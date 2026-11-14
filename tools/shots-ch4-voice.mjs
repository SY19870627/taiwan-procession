// 第四章語氣重過 v0.1：截圖交付（feat/ch4-voice-pass）。
// 用無頭 Chrome（Chrome DevTools Protocol，Node 22 內建 WebSocket，不加套件）開本機 vite preview 的深層連結，電腦 1280×720。
// 做法照 tools/shots.mjs；塞進度用的網址參數見 src/scenes/BootScene.ts 的 voicePreset4（只有加參數才會動，不影響正常遊玩）。
//
//   npm run build && npx vite preview --port 4173 --strictPort
//   node tools/shots-ch4-voice.mjs [--base http://localhost:4173/] [--out C:\Users\nelso\grokbot_transfer\ch4-voice\shots] [--only "^03"]
//
// 每一組開一個分頁，照 steps 依序做（等、執行 JS、按畫面、截圖）。另寫 urls.txt（測試區網址＋每張圖的說明）。
// 只關自己開的 Chrome（用自己的暫存使用者資料夾），preview 由呼叫的人自己關。
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const BASE = arg('--base', 'http://localhost:4173/');
/** 只跑名字符合這個規則的那幾組（例如 --only "^0[34]"） */
const ONLY = new RegExp(arg('--only', '.'));
const OUT = arg('--out', 'C:\\Users\\nelso\\grokbot_transfer\\ch4-voice\\shots');
const CHROME = arg('--chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
const TEST = 'https://sy19870627.github.io/taiwan-procession/test/';
const PC = { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false };

/**
 * 頁面裡用的小工具（注入到 window）：
 *  __click(場景, 按鈕字)：找到那個按鈕（字一樣，忽略換行空白），照真的按下去（pointerdown → pointerup）
 *  __scene(場景)：拿場景物件
 */
function helpers() {
  window.__scene = (key) => window.__game.scene.getScene(key);
  window.__click = (key, label) => {
    const want = label.replace(/\s/g, '');
    const walk = (list) => {
      for (const o of list) {
        if (!o.list) continue;
        const t = o.list.find((x) => x.type === 'Text' && String(x.text).replace(/\s/g, '') === want);
        const hit = t && o.list.find((x) => x.input && x.input.enabled);
        if (hit) {
          hit.emit('pointerdown', { x: 0, y: 0 });
          hit.emit('pointerup', { x: 0, y: 0 });
          return true;
        }
        if (walk(o.list)) return true;
      }
      return false;
    };
    return walk(window.__scene(key).children.list);
  };
}
const HELPERS = `(${helpers.toString()})()`;

/** 夜審：深層連結一開，立繪還沒載到；等圖載好重開一次夜審（data 裡的 ask／panel 會留著） */
const TRIAL_RESTART = "(() => { const s = __scene('trial'); s.scene.restart(s.sys.settings.data); })()";
/** 白天：直接打開第二天冬瓜茶攤牽路仔（stray2y）的卡（要 &bc1=garage 才有這一隻） */
const OPEN_STRAY2Y = "(() => { const s = __scene('day'); const e = s.plan.tagged.flatMap((t) => t.encounters).find((x) => x.id === 'stray2y'); s.busy = false; s.showImp(e); })()";
/** 白天：直接到第二天的停駕點（北津派出所：S0445「媽祖要等後面的人到齊」） */
const OPEN_REST = "(() => { const s = __scene('day'); s.routeEndPlayed = true; s.busy = false; s.showRest(); })()";
/**
 * 最後一戰：按「開始」，戰鬥先停住（不讓霧、學人講話的互嗆蓋掉要截的字幕）；
 * 人鏈台詞先收起來（不讓開打 7 秒後自動播的第一組蓋掉），由 CHAIN_SAY 一組一組叫
 */
const BOSS_START = "(() => { const ok = __click('bosshud', '開始'); __scene('boss').battle.paused = true; const h = __scene('bosshud'); window.__chain = h.chainQueue; h.chainQueue = []; return '開始=' + ok + '，人鏈 ' + window.__chain.length + ' 組'; })()";
/** 最後一戰：直接播人鏈裡某個人那一組（賢仔／阿睿：拆成同一個人連續兩句） */
const CHAIN_SAY = (who) => `(() => { const h = __scene('bosshud'); const g = window.__chain.find((x) => x.some((l) => l.who === '${who}')); if (!g) return 'none'; h.say(g); return g.map((l) => l.who + '：' + l.text).join(' / '); })()`;
/** 最後一戰：讓霧馬上叫下一個還在水裡的人（上方目標列顯示「霧在叫「名字」」） */
const LURE_NOW = "(() => { const b = __scene('boss').battle; b.paused = false; b.lureTimer = 0; return JSON.stringify(b.setup.ford.stragglers); })()";

/** 對話框：每一句等打字跑完截一張，再點一下換下一句 */
const talkLines = (prefix, n, first = 3500) => {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ sleep: i === 0 ? first : 2600 }, { shot: `${prefix}_l${i + 1}.png` }, { click: [640, 300] });
  return out;
};

/**
 * 每一組：name、q（網址參數）、wait（開頁後先等多久）、steps、say（urls.txt 的說明）。
 * 深層連結（不含 JS 步驟）就是 BASE + '?' + q；有 JS 步驟的，urls.txt 會寫「之後腳本做了什麼」。
 */
const SHOTS = [
  // ① 第一夜問歸處（點心擔阿婆／草鞋丁的判決面板）
  {
    name: '01_trial1_caoxie', q: 'scene=trial&n=1&ch=baishadun&held=caoxie,apo&ask=caoxie&panel=verdicts', wait: 3000,
    steps: [{ js: TRIAL_RESTART }, { sleep: 2500 }, { shot: '01_trial1_caoxie_verdicts.png' }],
    say: '第一夜問歸處：草鞋丁的判決面板（&ask=caoxie&panel=verdicts）',
  },
  {
    name: '01_trial1_apo', q: 'scene=trial&n=1&ch=baishadun&held=caoxie,apo&ask=apo&panel=verdicts', wait: 3000,
    steps: [{ js: TRIAL_RESTART }, { sleep: 2500 }, { shot: '01_trial1_apo_verdicts.png' }],
    say: '第一夜問歸處：點心擔阿婆的判決面板',
  },
  {
    name: '01_trial1_apo_ask', q: 'scene=trial&n=1&ch=baishadun&held=caoxie,apo&ask=apo', wait: 3000,
    steps: [{ js: TRIAL_RESTART }, { sleep: 3000 }, { shot: '01_trial1_apo_ask.png' }],
    say: '第一夜問歸處：問點心擔阿婆（審問畫面、開場的話）',
  },
  // ② 第二天北津：停駕派出所（S0445）
  {
    name: '02_day2_beijin', q: 'scene=day&n=2&ch=baishadun', wait: 3500,
    steps: [{ js: OPEN_REST }, { sleep: 1500 }, { shot: '02_day2_beijin_rest.png' }, { js: "__click('day', '等人集結')" }, { sleep: 1200 }, { shot: '02_day2_beijin_gather.png' }],
    say: '第二天停駕北津派出所：「轎子在北津派出所前落了地，媽祖要等後面的人到齊。」（腳本直接叫 showRest；再按「等人集結」）',
  },
  // ③ 冬瓜茶攤牽路仔 stray2y：派押尾、託攤子、沒處理
  {
    name: '03_stray2y_shout', q: 'scene=day&n=2&ch=baishadun&bc1=garage', wait: 3500,
    steps: [{ js: OPEN_STRAY2Y }, { sleep: 1200 }, { shot: '03_stray2y_card.png' }, { js: "__click('day', '派押尾回頭喊人')" }, ...talkLines('03_stray2y_shout', 5)],
    say: '第二天冬瓜茶攤的牽路仔（拍了車行過夜才有）：卡片，按「派押尾回頭喊人」→ 派押尾的結果（5 句）',
  },
  {
    name: '03_stray2y_entrust', q: 'scene=day&n=2&ch=baishadun&bc1=garage', wait: 3500,
    steps: [{ js: OPEN_STRAY2Y }, { sleep: 1200 }, { js: "__click('day', '託社團的冬瓜茶攤顧')" }, ...talkLines('03_stray2y_entrust', 5)],
    say: '同上，按「託社團的冬瓜茶攤顧」→ 託攤子顧的結果（5 句）',
  },
  {
    name: '03_stray2y_skip', q: 'scene=almanac&n=3&ch=baishadun&bc1=garage&yday=1', wait: 4500,
    steps: [{ shot: '03_stray2y_skip_yesterday.png' }],
    say: '冬瓜茶攤的牽路仔沒處理：第三天黃曆「昨日」那張卡裡的 stray2y 收尾（第二天其他沒做的事也會一起列，最多 6 句）',
  },
  // ④ 最後一戰：賢仔／阿睿拆成兩句的互嗆、水裡的名單（冠宇）
  {
    name: '04_boss', q: 'scene=boss&ch=baishadun&done=xianzai3,arui3&strayed=stray2y,stray2b', wait: 4500,
    steps: [
      { shot: '04_boss_briefing.png' },
      { js: BOSS_START }, { sleep: 2500 },
      { js: CHAIN_SAY('賢仔') }, { sleep: 800 }, { shot: '04_boss_xianzai_1.png' }, { sleep: 2300 }, { shot: '04_boss_xianzai_2.png' },
      { sleep: 1500 },
      { js: CHAIN_SAY('阿睿') }, { sleep: 800 }, { shot: '04_boss_arui_1.png' }, { sleep: 2300 }, { shot: '04_boss_arui_2.png' },
      { sleep: 1500 },
      { js: LURE_NOW }, { sleep: 900 }, { shot: '04_boss_lure_guanyu.png' },
      { sleep: 7000 }, { js: LURE_NOW }, { sleep: 900 }, { shot: '04_boss_lure_meiyun.png' },
    ],
    say: '最後一戰：賢仔、阿睿第三天辦成；略過了冬瓜茶攤（冠宇）和舊街（美雲）的牽路仔。按「開始」後直接播賢仔、阿睿那兩組（各兩句），再讓霧叫人：先「冠宇」、再「美雲」',
  },
  // ⑤ 三個結局的開爐（S0291 湯圓；第 13 拍＝beat 12，最後一句＝beat 14）
  ...['recall', 'return', 'slay'].map((end) => ({
    name: `05_kailu_${end}`, q: `scene=story&id=kailu4&ch=baishadun&ending=${end}&beat=12`, wait: 4500,
    steps: [{ shot: `05_kailu_${end}_tangyuan.png` }],
    say: `開爐（茫渡${end === 'recall' ? '喚回' : end === 'return' ? '送回' : '斬'}）：阿滿姨「我多煮了一碗湯圓，放在石階那邊喔。」`,
  })),
  ...['recall', 'return', 'slay'].map((end) => ({
    name: `05_kailu_${end}_end`, q: `scene=story&id=kailu4&ch=baishadun&ending=${end}&beat=14`, wait: 4500,
    steps: [{ shot: `05_kailu_${end}_last.png` }],
    say: `開爐（茫渡${end === 'recall' ? '喚回' : end === 'return' ? '送回' : '斬'}）：供桌上的湯圓那一句（結局不同）`,
  })),
  // ⑥ 夜審畫面上的「好兄弟」
  {
    name: '06_trial_lobby', q: 'scene=trial&n=1&ch=baishadun&held=caoxie,apo&ask=lobby', wait: 3000,
    steps: [{ js: TRIAL_RESTART }, { sleep: 2000 }, { shot: '06_trial_lobby_haoxiongdi.png' }],
    say: '夜審大廳：「頭旗下的好兄弟」',
  },
  {
    name: '06_trial_empty', q: 'scene=trial&n=1&ch=baishadun&ask=lobby', wait: 3000,
    steps: [{ js: TRIAL_RESTART }, { sleep: 2000 }, { shot: '06_trial_empty_haoxiongdi.png' }],
    say: '夜審大廳（頭旗下沒帶）：「頭旗下沒有要問的好兄弟了。」',
  },
  {
    name: '06_wanjia_trial', q: 'scene=trial&n=1&ch=wanjia', wait: 3000,
    steps: [{ sleep: 500 }, { shot: '06_wanjia_trial_unchanged.png' }],
    say: '對照：第一章夜審照舊寫「鬼」（別章不變）',
  },
];

// ---------- 最小的 CDP 用戶端 ----------
function cdp(ws) {
  let id = 0;
  const wait = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && wait.has(m.id)) {
      const { ok, ng } = wait.get(m.id);
      wait.delete(m.id);
      m.error ? ng(new Error(`${m.error.message}`)) : ok(m.result);
    }
  });
  return (method, params = {}, sessionId) =>
    new Promise((ok, ng) => {
      const n = ++id;
      wait.set(n, { ok, ng });
      ws.send(JSON.stringify({ id: n, method, params, sessionId }));
    });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  mkdirSync(OUT, { recursive: true });
  const prof = mkdtempSync(join(tmpdir(), 'tp-shots-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  try {
    const portFile = join(prof, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100);
    const [port, path] = readFileSync(portFile, 'utf8').split('\n');
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
    await new Promise((r, j) => {
      ws.addEventListener('open', r);
      ws.addEventListener('error', j);
    });
    const send = cdp(ws);

    for (const o of SHOTS) {
      if (!ONLY.test(o.name)) continue;
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const s = (m, p) => send(m, p, sessionId);
      await s('Page.enable');
      await s('Emulation.setDeviceMetricsOverride', PC);
      await s('Page.navigate', { url: `${BASE}?${o.q}` });
      await sleep(o.wait);
      await s('Runtime.evaluate', { expression: HELPERS });
      for (const st of o.steps) {
        if (st.sleep) await sleep(st.sleep);
        if (st.js) {
          const r = await s('Runtime.evaluate', { expression: st.js, returnByValue: true });
          if (r.exceptionDetails) console.warn('  js 出錯', o.name, r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
          else if (r.result?.value !== undefined) console.log('  ', o.name, r.result.value);
        }
        if (st.click) {
          const [x, y] = st.click;
          await s('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
          await s('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
          await s('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
        }
        if (st.shot) {
          const { data } = await s('Page.captureScreenshot', { format: 'png' });
          writeFileSync(join(OUT, st.shot), Buffer.from(data, 'base64'));
          console.log('ok', st.shot);
        }
      }
      await send('Target.closeTarget', { targetId });
    }
    await send('Browser.close').catch(() => {});
  } finally {
    chrome.kill();
    await sleep(500);
    try {
      rmSync(prof, { recursive: true, force: true });
    } catch {
      /* Chrome 還沒放開檔案就算了 */
    }
  }

  const lines = [
    '# 第四章語氣重過 v0.1：截圖的深層連結（測試區 feat/ch4-voice-pass 推上去後自動更新）',
    '# 有「腳本另外」的那幾張：網址只把進度塞好，之後腳本在頁面裡叫函式／按按鈕（見 tools/shots-ch4-voice.mjs）',
    ...SHOTS.map((o) => {
      const extra = o.steps.some((st) => st.js && st.js !== TRIAL_RESTART) ? '　（腳本另外：' + o.steps.filter((st) => st.js && st.js !== TRIAL_RESTART).map((st) => st.js.slice(0, 60)).join('；') + '…）' : '';
      return `${TEST}?${o.q}　${o.say}${extra}`;
    }),
    '',
  ];
  writeFileSync(join(OUT, 'urls.txt'), lines.join('\r\n'), 'utf8');
  console.log('urls.txt', SHOTS.length, '組');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
