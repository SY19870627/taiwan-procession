/**
 * 除錯面板（?debug=1，且只有測試區建置 VITE_DEBUG_TOOLS=1 或本機開發）：taiwan-procession 和共用除錯核心（./core/）之間的轉接層。
 * main.ts 用動態 import() 載入；沒帶 ?debug=1 不會下載這支。核心不改，遊戲相關的設定都在這裡組：
 * 位置（章、天、場景、台詞：probe.ts）、跳關（BootScene 的網址深層連結：jumps.ts）、快轉（Phaser timeScale）、
 * 版本（vite define＋version.json）、截圖（WebGL 畫布用 renderer.snapshot 疊進 DOM 截圖）。
 */
import type Phaser from 'phaser';
import { run } from '../state';
import { startDebug, type DebugHandle, type LatestInfo } from './core/index.js';
import { REPORT_ENDPOINT, REPORT_KEY, GAME, STORAGE_KEYS, KEEP_PREFIX, isGameSaveKey, H2C_SRC, FAST_RATE, SNAPSHOT_TIMEOUT_MS } from './config';
import { shownLine } from './probe';
import { jumpGroups, jumpUrl } from './jumps';
import { HELPER_SCENES, positionOf, sceneLabel, type SceneData } from './position';
import { BUILD_SHA, isStale, latestOf, reloadUrl, versionSplit, versionText } from './version';

type Scene = Phaser.Scene;

const live = (s: Scene) => s.sys.isActive() || s.sys.isPaused();
/** 目前在跑的場景（照畫的順序，最後一個在最上層；背景用的不算） */
function running(game: Phaser.Game): Scene[] {
  return game.scene.getScenes(false).filter((s) => live(s) && !HELPER_SCENES.includes(s.sys.settings.key));
}
const top = (game: Phaser.Game): Scene | undefined => running(game).filter((s) => s.sys.isActive()).pop() ?? running(game).pop();
const dataOf = (s: Scene | undefined): SceneData => (s?.sys.settings.data ?? {}) as SceneData;
/** 算第幾天用的資料：蓋在別的場景上播的劇情（playStory 的 overlay）看底下那個場景（白天第幾天、夜審第幾夜） */
function dayDataOf(game: Phaser.Game, s: Scene | undefined): SceneData {
  const d = dataOf(s) as SceneData & { overlay?: { caller?: string } };
  const caller = d.overlay?.caller ? game.scene.getScene(d.overlay.caller) : undefined;
  if (!caller) return d;
  const key = caller.sys.settings.key;
  const cd = dataOf(caller);
  return { ...d, next: { key, data: { day: cd.day, night: cd.night } } };
}

/** 最新版（version.json）：開機先查一次，面板「有新版」的提示用 */
let latestSha = '';
async function fetchLatest(): Promise<LatestInfo | null> {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const v = latestOf(await res.json());
    if (v) latestSha = v.id;
    return v;
  } catch {
    return null;
  }
}

/** 遊戲畫面快照（WebGL 的 preserveDrawingBuffer 是 false，html2canvas 讀不到；renderer.snapshot 在下一格畫完時取）；最多等 2 秒 */
function snapshot(game: Phaser.Game): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const t = setTimeout(() => fail(new Error('遊戲畫面快照逾時')), SNAPSHOT_TIMEOUT_MS);
    try {
      game.renderer.snapshot((img) => {
        clearTimeout(t);
        if (img instanceof HTMLImageElement) ok(img);
        else fail(new Error('遊戲畫面快照格式不對'));
      });
    } catch (e) {
      clearTimeout(t);
      fail(e);
    }
  });
}

/** 快轉：所有場景的計時器、補間動畫，以及全域的影格動畫；新開的場景（start／create）也補上，另外每秒補一次 */
function timeControl(game: Phaser.Game) {
  let speed = 1;
  const apply = (s: Scene) => {
    if (s.time && s.time.timeScale !== speed) s.time.timeScale = speed;
    if (s.tweens && s.tweens.timeScale !== speed) s.tweens.timeScale = speed;
  };
  const applyAll = () => {
    for (const s of game.scene.getScenes(false)) apply(s);
    if (game.anims) game.anims.globalTimeScale = speed;
  };
  for (const s of game.scene.getScenes(false)) {
    s.sys.events.on('start', () => apply(s));
    s.sys.events.on('create', () => apply(s));
  }
  setInterval(applyAll, 1000);
  // 核心給的 k＝等待時間的倍率（快轉 1/5）；Phaser 的 timeScale 是速度，所以用 1/k
  return (k: number) => { speed = k > 0 ? 1 / k : 1; applyAll(); };
}

/** 面板掛的地方：蓋在整個視窗上（手機橫拿時的「請轉成直向」提示上面也看得到 DBG 與回報鈕） */
function host(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'dbg-host';
  el.style.cssText = 'position:fixed;inset:0;z-index:20;pointer-events:none';
  document.body.appendChild(el);
  preselectJump(el);
  return el;
}

/**
 * 繞過核心：跳關選單預設選「目前位置的場景 key」，但選單的值是網址參數（scene=day&ch=…），對不上時什麼都沒選（按「跳」會失敗）。
 * 面板打開時，沒選到就改選和目前網址一樣的那一項（網址是跳關進來的），都沒有就選第一項。
 */
function preselectJump(el: HTMLElement): void {
  new MutationObserver(() => {
    const sel = el.querySelector<HTMLSelectElement>('.dbg-sheet select.dbg-grow[aria-label="場景"]');
    if (!sel || sel.selectedIndex >= 0 || sel.dataset.dbgPicked) return;
    sel.dataset.dbgPicked = '1';
    const here = new URLSearchParams(location.search);
    const same = [...sel.options].find((op) => [...new URLSearchParams(op.value)].every(([k, v]) => here.get(k) === v));
    sel.value = same?.value ?? sel.options[0]?.value ?? '';
  }).observe(el, { childList: true, subtree: true });
}

export async function start(game: Phaser.Game): Promise<DebugHandle | null> {
  void fetchLatest();
  const gameEl = document.getElementById('game') ?? document.body;
  return startDebug({
    app: host(),
    game: GAME,
    endpoint: REPORT_ENDPOINT,
    key: REPORT_KEY,
    storageKeys: STORAGE_KEYS,
    isGameSaveKey,
    keepPrefixes: [KEEP_PREFIX],
    position: () => {
      const s = top(game);
      const key = s?.sys.settings.key ?? '';
      return positionOf({
        chapter: run.chapter, scene: key, data: dayDataOf(game, s), runDay: run.day,
        line: shownLine(), liveScenes: game.scene.getScenes(false).filter(live).map((x) => x.sys.settings.key),
      });
    },
    sceneLabel: (key) => {
      const s = game.scene.getScenes(false).find((x) => x.sys.settings.key === key);
      return sceneLabel(key, dataOf(s));
    },
    jumpGroups,
    jump: (query, line) => {
      const url = jumpUrl(location.href, query, line);
      if (!url) return false;
      location.assign(url);
      return true;
    },
    setTimeScale: timeControl(game),
    fastRate: FAST_RATE,
    version: {
      display: versionText,
      parts: versionSplit,
      note: () => (isStale(latestSha, BUILD_SHA) ? '有新版，按「重新載入最新版」' : ''),
      latest: fetchLatest,
      reloadUrl: (latest) => reloadUrl(location.href, latest?.id || latestSha),
    },
    capture: {
      root: gameEl,
      html2canvasSrc: H2C_SRC,
      background: '#120f1c',
      snapshot: () => snapshot(game),
      snapshotMode: 'overlay',
      snapshotElement: () => game.canvas,
    },
    text: {
      sceneAria: '場景',
      jumpHint: '跳關會換網址、從那個場景重新開始（這一局的進度不保留）；第幾句只對「劇情」有效（演出從第幾拍開始）。',
      jumpFail: '跳不過去：請先在上面的選單選一個場景',
      shotLost: '截圖少了部分畫面（瀏覽器不讓讀取）',
    },
  });
}
