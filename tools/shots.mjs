// 第一、二章熱鬧化：截圖交付（計畫 §2 第 7 階段）。
// 用無頭 Chrome（Chrome DevTools Protocol，Node 22 內建 WebSocket，不加套件）開本機 vite preview 的深層連結，
// 每張各截電腦 1280×720 與手機 390×844（觸控、deviceScaleFactor 3），另寫 urls.txt（測試區網址）。
//
//   npm run build && npx vite preview --port 4173 --strictPort
//   node tools/shots.mjs [--base http://localhost:4173/] [--out C:\Users\nelso\grokbot_transfer\ch12\shots]
//
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
/** 只截檔名符合這個規則的（例如 --only "^(trial|boss)"） */
const ONLY = new RegExp(arg('--only', '.'));
const OUT = arg('--out', 'C:\\Users\\nelso\\grokbot_transfer\\ch12\\shots');
const CHROME = arg('--chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
const TEST = 'https://sy19870627.github.io/taiwan-procession/test/';

const DEVICES = {
  pc: { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false, touch: false },
  phone: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true, touch: true },
};

/** 過場：每章 2 段、每段 2 拍（&beat=N 是第 N+1 拍，鏡頭已停好） */
const STORY_SHOTS = [
  ['wanjia', 'anfang1', [1, 5]],
  ['wanjia', 'recall', [2, 4]],
  ['dongjin', 'qingwang2', [2, 5]],
  ['dongjin', 'sendoff', [2, 4]],
  ['xinying', 'kaiying3', [2, 6]],
  ['xinying', 'jiaoRecall', [3, 7]],
];
/** 評分補截（extra\ 資料夾，視覺修正後重截）：石駒回頭、王船起火 */
const EXTRA_SHOTS = [
  ['wanjia', 'shijuReturn1', [3, 5]],
  ['dongjin', 'heichaoSlay2', [0, 4]],
];
/**
 * 夜審：深層連結一開，判官的立繪還沒載到（堂上是程式畫的小人）；等圖載好重開一次夜審（和正常玩到夜審一樣是立繪），再叫掛勾
 */
const TRIAL_JS = "(() => { const s = __game.scene.getScene('trial'); s.scene.restart(s.sys.settings.data); setTimeout(() => __game.scene.getScene('trial').quip('t_open', 0), 1200); })()";
/** 互嗆：白天起駕、夜審升堂（直接叫掛勾）、最後一戰開打（1.5 秒後播 b_start）與開打後 */
const BANTER_SHOTS = [
  { name: 'day_wanjia', q: 'scene=day&n=1&ch=wanjia', wait: 3200 },
  { name: 'day_dongjin', q: 'scene=day&n=1&ch=dongjin', wait: 3200 },
  { name: 'trial_wanjia', q: 'scene=trial&n=1&ch=wanjia', wait: 3000, js: TRIAL_JS, after: 4200 },
  { name: 'trial_dongjin', q: 'scene=trial&n=1&ch=dongjin', wait: 3000, js: TRIAL_JS, after: 4200 },
  { name: 'boss_wanjia', q: 'scene=boss&ch=wanjia', wait: 4200 },
  { name: 'boss_dongjin', q: 'scene=boss&ch=dongjin', wait: 4200 },
  // 打一段時間後（事件真的觸發的互嗆，不叫掛勾）
  { name: 'boss_wanjia_mid', q: 'scene=boss&ch=wanjia', wait: 26000 },
  { name: 'boss_dongjin_mid', q: 'scene=boss&ch=dongjin', wait: 26000 },
];

/**
 * 修正第 2 輪（--fix2）：夜審（審問畫面：先押一個鬼進令旗、重開夜審、升堂；另截堂上）、最後一戰開打互嗆兩句時、
 * 開營有泡泡的每一拍。輸出到 --out（預設 shotsix2）。
 */
const ASK_JS = "(() => { const r = __run(); const id = Object.keys(__cases())[0]; if (!r.held.some((h) => h.id === id)) r.held.push({ id, grudge: 0 }); const s = __game.scene.getScene('trial'); s.scene.restart(s.sys.settings.data); setTimeout(() => { const t = __game.scene.getScene('trial'); t.open(__cases()[id]); }, 1200); })()";
const FIX2_SHOTS = [
  { name: 'trial_wanjia', q: 'scene=trial&n=1&ch=wanjia', wait: 3000, js: ASK_JS, after: 4300 },
  { name: 'trial_dongjin', q: 'scene=trial&n=1&ch=dongjin', wait: 3000, js: ASK_JS, after: 4300 },
  { name: 'trial_wanjia_lobby', q: 'scene=trial&n=1&ch=wanjia', wait: 3000, js: TRIAL_JS, after: 4200 },
  { name: 'trial_dongjin_lobby', q: 'scene=trial&n=1&ch=dongjin', wait: 3000, js: TRIAL_JS, after: 4200 },
  { name: 'boss_wanjia', q: 'scene=boss&ch=wanjia', wait: 4300 },
  { name: 'boss_dongjin', q: 'scene=boss&ch=dongjin', wait: 4300 },
  // 第三句進來、第一句收掉之後
  { name: 'boss_wanjia_3rd', q: 'scene=boss&ch=wanjia', wait: 6500 },
  { name: 'boss_dongjin_3rd', q: 'scene=boss&ch=dongjin', wait: 6500 },
];
const FIX2_BEATS = [1, 2, 3, 4, 6, 7, 9, 10];

/** 修正第 3 輪（--fix3）：換上畫師的七爺、八爺、轎班、王轎、太子轎、新版青嶺王神轎的拍子。輸出到 --out（shots\fix3） */
const FIX3_BEATS = [
  ['wanjia', 'anfang1', [1, 3]],
  ['wanjia', 'recall', [4]],
  ['wanjia', 'shijuReturn1', [3]],
  ['dongjin', 'qingwang2', [5]],
  ['dongjin', 'sendoff', [2]],
  ['dongjin', 'songwang2', [1]],
  ['xinying', 'kaiying3', [1]],
  ['xinying', 'jiao3', [0]],
  ['xinying', 'shouying3', [1]],
];

/** urls.txt：每一段有演出的過場（三章共 22 段）＋互嗆網址 */
const URLS = [
  ['wanjia', 'anfang1', '第一章開場：入夜，報馬仔敲鑼、七爺八爺出廟、判官點燈磨刀'],
  ['wanjia', 'shanlu1', '第一章第二夜過後天亮：報馬仔從山上跑回來報蹄印'],
  ['wanjia', 'dusk3', '第一章第三天黃昏：山下的燈籠亮起來'],
  ['wanjia', 'recall', '第一章結局・喚回：石駒歸隊'],
  ['wanjia', 'shijuReturn1', '第一章結局・送回山中：石駒回頭看一眼'],
  ['wanjia', 'shijuSlay1', '第一章結局・斬：文判官放下筆'],
  ['wanjia', 'huigong1', '第一章收尾・回宮：報馬仔累倒在廟埕'],
  ['dongjin', 'qingwang2', '第二章開場・請王：中軍府點名、巡捕數王令、轎班起轎'],
  ['dongjin', 'qianchuan2', '第二章第二夜過後天亮・王船廠：燈亮一夜'],
  ['dongjin', 'tide3', '第二章最後一戰前：潮水'],
  ['dongjin', 'sendoff', '第二章結局・送王船：黑潮上船'],
  ['dongjin', 'heichaoReturn2', '第二章結局・鎮回海裡：五排腳印走進海裡'],
  ['dongjin', 'heichaoSlay2', '第二章結局・斬：中軍府令下行刑'],
  ['dongjin', 'songwang2', '第二章收尾・送王：轎班在堤防上吃早餐'],
  ['xinying', 'kaiying3', '第三章開場・開營'],
  ['xinying', 'zhizha3', '第三章紙紮童跪下（遊戲裡蓋在點將問罪畫面上播）'],
  ['xinying', 'river3', '第三章第二夜過後天亮：溪水倒流'],
  ['xinying', 'jiao3', '第三章最後一戰前：蛟現身'],
  ['xinying', 'jiaoRecall', '第三章結局・喚回：太子踩上蛟頭'],
  ['xinying', 'jiaoSlay3', '第三章結局・斬'],
  ['xinying', 'jiaoReturn3', '第三章結局・鎮回溪裡'],
  ['xinying', 'shouying3', '第三章收尾・收營'],
];
const BANTER_URLS = [
  ['scene=day&n=1&ch=wanjia', '第一章白天互嗆（起駕、走路、岔路、小妖、收容、收工）'],
  ['scene=day&n=1&ch=dongjin', '第二章白天互嗆'],
  ['scene=trial&n=1&ch=wanjia', '第一章夜審互嗆（深層連結進去堂上沒有鬼；完整看要從標題玩到第一晚）'],
  ['scene=trial&n=1&ch=dongjin', '第二章夜審互嗆（同上）'],
  ['scene=boss&ch=wanjia', '第一章最後一戰（石駒）互嗆：開打、刨地、衝鋒、喘息、勾魂鎖、醒獅、陣前審問、有人倒下'],
  ['scene=boss&ch=dongjin', '第二章最後一戰（王船）互嗆：開打、觸手拖船、陣前審問、有人倒下、王船被推回去'],
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

    const shoot = async (url, file, dev, js, after = 0, wait = 3000) => {
      if (!ONLY.test(file)) return;
      const d = DEVICES[dev];
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const s = (m, p) => send(m, p, sessionId);
      await s('Page.enable');
      await s('Emulation.setDeviceMetricsOverride', { width: d.width, height: d.height, deviceScaleFactor: d.deviceScaleFactor, mobile: d.mobile });
      await s('Emulation.setTouchEmulationEnabled', d.touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
      await s('Page.navigate', { url });
      await sleep(wait);
      if (js) {
        await s('Runtime.evaluate', { expression: js });
        await sleep(after);
      }
      const { data } = await s('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(OUT, file), Buffer.from(data, 'base64'));
      await send('Target.closeTarget', { targetId });
      console.log('ok', file);
    };

    if (process.argv.includes('--fix3')) {
      for (const [ch, id, beats] of FIX3_BEATS)
        for (const b of beats) for (const dev of ['pc', 'phone']) await shoot(`${BASE}?scene=story&id=${id}&ch=${ch}&beat=${b}`, `${id}_b${b}_${dev}.png`, dev, undefined, 0, 3500);
      await send('Browser.close').catch(() => {});
      return;
    }
    if (process.argv.includes('--fix2')) {
      for (const o of FIX2_SHOTS) for (const dev of ['pc', 'phone']) await shoot(`${BASE}?${o.q}`, `${o.name}_${dev}.png`, dev, o.js, o.after, o.wait);
      for (const b of FIX2_BEATS) for (const dev of ['pc', 'phone']) await shoot(`${BASE}?scene=story&id=kaiying3&ch=xinying&beat=${b}`, `kaiying3_b${b}_${dev}.png`, dev, undefined, 0, 3500);
      await send('Browser.close').catch(() => {});
      return;
    }
    for (const [ch, id, beats] of STORY_SHOTS)
      for (const b of beats) for (const dev of ['pc', 'phone']) await shoot(`${BASE}?scene=story&id=${id}&ch=${ch}&beat=${b}`, `${id}_b${b}_${dev}.png`, dev, undefined, 0, 3500);
    mkdirSync(join(OUT, 'extra'), { recursive: true });
    for (const [ch, id, beats] of EXTRA_SHOTS)
      for (const b of beats) await shoot(`${BASE}?scene=story&id=${id}&ch=${ch}&beat=${b}`, join('extra', `${id}_b${b}_pc.png`), 'pc', undefined, 0, 3500);
    for (const o of BANTER_SHOTS) for (const dev of ['pc', 'phone']) await shoot(`${BASE}?${o.q}`, `${o.name}_${dev}.png`, dev, o.js, o.after, o.wait);

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
    '# 第一、二章熱鬧化：測試區網址（feat/ch12-lively 推上去後自動更新）',
    '# 過場（有演出的 22 段）：網址後面加 &text=1 看文字版、&beat=N 直接跳到第 N+1 拍',
    ...URLS.map(([ch, id, say]) => `${TEST}?scene=story&id=${id}&ch=${ch}　${say}`),
    '',
    '# 互嗆',
    ...BANTER_URLS.map(([q, say]) => `${TEST}?${q}　${say}`),
    '',
  ];
  writeFileSync(join(OUT, 'urls.txt'), lines.join('\r\n'), 'utf8');
  console.log('urls.txt', URLS.length, '段過場');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
