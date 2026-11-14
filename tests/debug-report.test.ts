/**
 * ?debug=1 測試模式＋回報（src/debug/）：
 *  1. 共用除錯核心（src/debug/core/）和 MANIFEST.json 一致（核心不能在這個 repo 改）
 *  2. 回報的 payload 欄位、game
 *  3. 版本字串「YYYY-MM-DD HH:mm:ss（短碼）」、最新版、重新載入的網址
 *  4. 「清除存檔重來」只刪遊戲的鍵
 *  5. 跳關選單產生的網址都是 BootScene 認得的參數與場景
 *  6. 自動帶入的位置（章、天、場景、台詞）
 *  7. 正式版建置不含除錯程式（main.ts 的條件、只有 main.ts 用動態 import 載入 adapter）
 */
import { describe, it, expect } from 'vitest';
import { checkManifest } from '../src/debug/core/manifest-check.js';
import { buildPayload, formatVersion, BUILD_TIME_RE, keysToClear } from '../src/debug/core/index.js';
import { GAME, STORAGE_KEYS, KEEP_PREFIX, isGameSaveKey, H2C_SRC } from '../src/debug/config';
import { BUILD_SHA, BUILD_TIME, isStale, latestOf, reloadUrl, versionText } from '../src/debug/version';
import { JUMP_PARAMS, chapterName, jumpGroups, jumpUrl } from '../src/debug/jumps';
import { dayLabel, positionOf, sceneLabel } from '../src/debug/position';
import { clearLine, noteLine, shownLine } from '../src/debug/probe';
import { CHAPTERS } from '../src/content/chapter';
import { CUTSCENES } from '../src/content/story';

const SRC = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const src = (p: string) => SRC[`../src/${p}`] ?? '';

/** file:// 網址轉成本機路徑（Windows 的 /D:/… 去掉開頭的 /） */
function dirOf(rel: string): string {
  const p = decodeURIComponent(new URL(rel, import.meta.url).pathname);
  return /^\/[A-Za-z]:/.test(p) ? p.slice(1) : p;
}

describe('除錯核心', () => {
  it('src/debug/core/ 和 MANIFEST.json 一致（沒有被改、少檔、多檔）', () => {
    const r = checkManifest(dirOf('../src/debug/core'));
    expect({ missing: r.missing, extra: r.extra, changed: r.changed, versionMismatch: r.versionMismatch }).toEqual({ missing: [], extra: [], changed: [], versionMismatch: false });
    expect(r.ok).toBe(true);
  });
});

describe('回報內容', () => {
  it('payload 欄位照核心的順序，game 是 taiwan-procession', () => {
    const position = positionOf({
      chapter: 'baishadun', scene: 'day', data: { day: 2 }, runDay: 2,
      line: { scene: 'day', speaker: '押尾', text: '「金水伯。」', index: 3 }, liveScenes: ['day', 'band'],
    });
    const p = buildPayload({ position, game: GAME, version: versionText(), device: 'test', now: new Date('2026-11-14T12:00:00Z') });
    expect(Object.keys(p)).toEqual(['time', 'version', 'day', 'scene', 'line', 'speaker', 'text', 'category', 'comment', 'screenshot', 'device', 'game', 'owner']);
    expect(p.game).toBe('taiwan-procession');
    expect(p).toMatchObject({ day: '第四章 白砂墩｜第2天', scene: 'day', line: 3, speaker: '押尾', text: '「金水伯。」' });
  });

  it('設定：localStorage 鍵、html2canvas 相對於頁面', () => {
    expect(STORAGE_KEYS).toEqual({ queue: 'taiwan-procession.debug.queue', fast: 'taiwan-procession.debug.fast', owner: 'taiwan-procession.debug.owner' });
    expect(H2C_SRC).toBe('vendor/html2canvas.min.js');
  });
});

describe('版本', () => {
  it('版本字串是「YYYY-MM-DD HH:mm:ss（短碼）」', () => {
    expect(formatVersion('2026-11-14 20:05:31', 'abc1234')).toBe('2026-11-14 20:05:31（abc1234）');
    // 有 git 的環境：vite.config.ts define 的 HEAD commit 時間與短碼
    expect(BUILD_TIME).toMatch(BUILD_TIME_RE);
    expect(BUILD_SHA).toMatch(/^[0-9a-f]{7}$/);
    expect(versionText()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}（[0-9a-f]{7}）$/);
  });

  it('version.json → 最新版；和正在跑的不一樣才提示', () => {
    expect(latestOf({ sha: 'abc1234', time: '2026-11-14 20:05:31' })).toEqual({ id: 'abc1234', label: '2026-11-14 20:05:31（abc1234）' });
    expect(latestOf({ sha: '' })).toBeNull();
    expect(latestOf('<html>')).toBeNull();
    expect(isStale('abc1234', 'abc1234')).toBe(false);
    expect(isStale('def5678', 'abc1234')).toBe(true);
    expect(isStale('', 'abc1234')).toBe(false);
  });

  it('重新載入最新版：保留 debug=1 與其他參數，加 v=短碼與 _r', () => {
    const u = new URL(reloadUrl('https://sy19870627.github.io/taiwan-procession/test/?debug=1&scene=day&ch=baishadun&n=2&v=old', 'abc1234', 123));
    expect(u.pathname).toBe('/taiwan-procession/test/');
    expect(Object.fromEntries(u.searchParams)).toEqual({ debug: '1', scene: 'day', ch: 'baishadun', n: '2', v: 'abc1234', _r: '123' });
    expect(new URL(reloadUrl('https://x.test/?debug=1', undefined, 5)).search).toBe('?debug=1&_r=5');
  });
});

describe('清除存檔重來', () => {
  it('只刪 raujing-* 與 taiwan-procession.*（.debug.* 不刪）', () => {
    expect(isGameSaveKey('raujing-ios-tip')).toBe(true);
    expect(isGameSaveKey('taiwan-procession.save')).toBe(true);
    expect(isGameSaveKey('taiwan-procession.debug.queue')).toBe(false);
    expect(isGameSaveKey('taiwan-procession.debug.owner')).toBe(false);
    expect(isGameSaveKey('dream-cafe.v3b')).toBe(false);
    expect(isGameSaveKey('other')).toBe(false);
    const keys = ['raujing-ios-tip', 'taiwan-procession.x', ...Object.values(STORAGE_KEYS), 'taiwan-procession.debug.other', 'dream-cafe.v3b'];
    expect(keysToClear(keys, { isGameSaveKey, keepKeys: Object.values(STORAGE_KEYS), keepPrefixes: [KEEP_PREFIX] })).toEqual(['raujing-ios-tip', 'taiwan-procession.x']);
  });
});

describe('跳關', () => {
  const boot = src('scenes/BootScene.ts');
  // BootScene 讀的參數：q.get('x')、list('x')
  const bootParams = new Set([...boot.matchAll(/q\.get\('(\w+)'\)/g), ...boot.matchAll(/list\('(\w+)'\)/g)].map((m) => m[1]));
  // 註冊的場景 key：super('x')
  const sceneKeys = new Set(Object.values(SRC).flatMap((s) => [...s.matchAll(/super\('(\w+)'\)/g)].map((m) => m[1])));
  const groups = jumpGroups();
  const items = groups.flatMap((g) => g.items);

  it('每一章都有一組，章名照 CHAPTERS 的順序', () => {
    expect(groups.length).toBe(1 + Object.keys(CHAPTERS).length);
    expect(chapterName('baishadun')).toBe('第四章 白砂墩');
    expect(groups[4].name.startsWith('第四章 白砂墩')).toBe(true);
  });

  it('每一項的參數都是 BootScene 認得的；場景、章節、劇情都存在', () => {
    expect(bootParams.has('scene') && bootParams.has('ch') && bootParams.has('n')).toBe(true);
    expect(items.length).toBeGreaterThan(40);
    for (const it of items) {
      const p = new URLSearchParams(it.scene);
      for (const k of p.keys()) expect(bootParams.has(k), `${it.label}: ${k}`).toBe(true);
      expect(sceneKeys.has(p.get('scene')!), `${it.label}: scene=${p.get('scene')}`).toBe(true);
      if (p.get('ch')) expect(CHAPTERS[p.get('ch')!], it.label).toBeTruthy();
      if (p.get('scene') === 'story') expect(CUTSCENES[p.get('id')!], `${it.label}: id=${p.get('id')}`).toBeTruthy();
    }
    for (const k of JUMP_PARAMS) expect(bootParams.has(k), k).toBe(true);
    // 值不重複（選單 value）
    expect(new Set(items.map((i) => i.scene)).size).toBe(items.length);
  });

  it('第四章：每天的黃曆、白天、夜審，最後一戰、開爐、結局都在', () => {
    const ch4 = groups[4].items.map((i) => i.scene);
    for (const n of [1, 2, 3]) {
      expect(ch4).toContain(`scene=almanac&ch=baishadun&n=${n}`);
      expect(ch4).toContain(`scene=day&ch=baishadun&n=${n}`);
      expect(ch4).toContain(`scene=trial&ch=baishadun&n=${n}`);
    }
    expect(ch4).toContain('scene=almanac&ch=baishadun&prologue=1');
    expect(ch4).toContain('scene=boss&ch=baishadun');
    expect(ch4).toContain('scene=almanac&ch=baishadun&epilogue=1');
    expect(ch4).toContain('scene=end&ch=baishadun');
  });

  it('跳關網址：保留 debug=1 與其他參數，舊的跳關參數換掉；劇情的第幾句變 &beat', () => {
    const u = new URL(jumpUrl('https://x.test/test/?debug=1&scene=trial&ch=wanjia&n=3&ask=lobby&v=abc1234&full=1&_r=9', 'scene=day&ch=baishadun&n=2', 4));
    expect(Object.fromEntries(u.searchParams)).toEqual({ debug: '1', v: 'abc1234', full: '1', scene: 'day', ch: 'baishadun', n: '2' });
    const s = new URL(jumpUrl('https://x.test/?debug=1', 'scene=story&ch=baishadun&id=qijia4', 3));
    expect(s.searchParams.get('beat')).toBe('3');
    expect(jumpUrl('https://x.test/?debug=1', '', 0)).toBe('');
  });
});

describe('自動帶入的位置', () => {
  it('章＋第幾天（夜審是第幾夜；序章、收尾、最後一戰、結局）', () => {
    expect(dayLabel('baishadun', 'day', { day: 2 }, 1)).toBe('第四章 白砂墩｜第2天');
    expect(dayLabel('baishadun', 'trial', { night: 3 }, 3)).toBe('第四章 白砂墩｜第3夜');
    expect(dayLabel('baishadun', 'story', {}, 2)).toBe('第四章 白砂墩｜第2天');
    expect(dayLabel('wanjia', 'almanac', { prologue: true }, 1)).toBe('第一章 萬舺｜序章');
    expect(dayLabel('baishadun', 'almanac', { epilogue: true }, 3)).toBe('第四章 白砂墩｜收尾');
    expect(dayLabel('dongjin', 'boss', {}, 3)).toBe('第二章 東津｜最後一戰');
    expect(dayLabel('wanjia', 'title', {}, 1)).toBe('');
    // 出發過場：run.day 還是前一天，看播完要去的那一天；開審前過場看那一夜
    expect(dayLabel('baishadun', 'story', { id: 'chufa4_2', next: { key: 'day', data: { day: 2 } } }, 1)).toBe('第四章 白砂墩｜第2天');
    expect(dayLabel('baishadun', 'story', { id: 'jinhuo4', next: { key: 'trial', data: { night: 2 } } }, 2)).toBe('第四章 白砂墩｜第2夜');
    expect(sceneLabel('story', { id: 'qijia4' })).toBe('劇情・qijia4');
    expect(sceneLabel('day')).toBe('白天');
  });

  it('台詞只在它的場景還在時才帶', () => {
    const line = { scene: 'story', speaker: '押尾', text: '走了。', index: 2 };
    const base = { chapter: 'baishadun', scene: 'day', data: { day: 1 }, runDay: 1, line };
    expect(positionOf({ ...base, liveScenes: ['day', 'story'] })).toMatchObject({ speaker: '押尾', text: '走了。', line: 2 });
    expect(positionOf({ ...base, liveScenes: ['day'] })).toMatchObject({ speaker: '', text: '', line: 0 });
  });

  it('probe：記下最後顯示的一句；那個場景播完才清', () => {
    noteLine('媽祖', '起駕。', 0, 'story');
    expect(shownLine()).toEqual({ scene: 'story', speaker: '媽祖', text: '起駕。', index: 0 });
    clearLine('day');
    expect(shownLine()).not.toBeNull();
    clearLine('story');
    expect(shownLine()).toBeNull();
    noteLine(undefined, '旁白', 1, 'day');
    expect(shownLine()?.speaker).toBe('');
  });
});

describe('正式版不含除錯程式', () => {
  const main = src('main.ts');
  it('main.ts 只在「本機開發或 VITE_DEBUG_TOOLS=1」而且 ?debug=1 時才動態載入 adapter', () => {
    expect(main).toMatch(/if \(\(import\.meta\.env\.DEV \|\| import\.meta\.env\.VITE_DEBUG_TOOLS === '1'\) && debugOn\(location\.search\)\) \{\s*import\('\.\/debug\/adapter'\)/);
    // 靜態載入的只有開關（debugOn）
    expect(main).toMatch(/import \{ debugOn \} from '\.\/debug\/core\/index\.js';/);
    expect(main).not.toMatch(/from '\.\/debug\/(adapter|config|jumps|version|position)/);
  });

  it('除了 main.ts 的動態 import，沒有別的檔載入 adapter／config；遊戲程式只碰 probe', () => {
    for (const [p, s] of Object.entries(SRC)) {
      if (p.startsWith('../src/debug/')) continue;
      const deb = [...s.matchAll(/from '([^']*debug\/[^']*)'/g)].map((m) => m[1]);
      for (const d of deb) {
        if (p === '../src/main.ts') expect(d).toBe('./debug/core/index.js');
        else expect(d, p).toBe('../debug/probe');
      }
    }
  });

  it('probe 在正式版建置時什麼都不記（同一個條件）', () => {
    expect(src('debug/probe.ts')).toMatch(/const ON = import\.meta\.env\.DEV \|\| import\.meta\.env\.VITE_DEBUG_TOOLS === '1';/);
  });

  it('測試區的部署才設 VITE_DEBUG_TOOLS=1', () => {
    const wf = import.meta.glob('../.github/workflows/*.yml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(wf['../.github/workflows/deploy-test.yml']).toMatch(/run: npm run build\s+env:\s+VITE_DEBUG_TOOLS: '1'/);
    expect(wf['../.github/workflows/deploy.yml']).not.toMatch(/VITE_DEBUG_TOOLS/);
  });
});
