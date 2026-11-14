// 第四章（白砂墩）畫面超框掃描（feat/ch4-voice-pass）。
// 用無頭 Chrome（Chrome DevTools Protocol，Node 22 內建 WebSocket，不加套件）開本機 vite preview 的深層連結，
// 走過第四章盡量多的畫面，每個畫面在頁面裡走訪所有場景的 display list（含 Container 子物件），找出看得到的 Text：
//   offscreen  世界座標的邊界超出畫布（0..720 × 0..遊戲高）
//   frame      超出它背後的面板／框（同一個場景、畫在它下面、包住它中心點的最小矩形：Rectangle 或 Graphics 的填色／框線）
//   overlap    兩個看得到的 Text 邊界明顯重疊（同一行左右拼字的不算；容忍幾 px）
// 被全螢幕黑幕蓋住的字：不透明（≥0.9）的整個不算；半透明的只檢查 offscreen（標 dimmed）。有遮罩（可以上下拖的卷動區）的字不檢查。
// 做法照 tools/shots.mjs、tools/shots-ch4-voice.mjs；塞進度用 BootScene 的開發參數（只有加網址參數才會動）。
//
//   npm run build && npx vite preview --port 4173 --strictPort
//   node tools/overflow-scan-ch4.mjs [--base http://localhost:4173/] [--out C:\Users\nelso\grokbot_transfer\ch4-overflow\shots]
//        [--only "^day2"] [--devices "390,360,pc"] [--chrome C:\...\chrome.exe] [--shots all|issues|none] [--jobs 2]
//
// 輸出：--out 裡每個畫面 × 裝置一張截圖（<畫面>__<裝置>.png）；--out 的上一層寫 overflow.json（全部）與 overflow.txt（易讀清單）。
// 每個畫面掃完先 append 一行到 overflow.partial.jsonl（中途被中斷也有結果）；stdout 每一行馬上寫出去。
// --jobs N：同時開 N 個分頁（最多 4）平行做不同畫面。
// 不檢查：淡出中（alpha < 0.3）的字、被畫在上面的填色物件整個蓋住（疊起來 ≥ 0.9）的字；
// 框只找字下面那層全螢幕黑幕「之上」的；字的中心在框外（或離框線不到 4px）的名字牌類不算超出框；
// 兩個字的交集被中間的填色物件蓋住（字幕底蓋掉後面的字）不算重疊。
// 只關自己開的 Chrome（用自己的暫存使用者資料夾），preview 由呼叫的人自己關。
import { spawn } from 'node:child_process';
import { appendFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, writeSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const BASE = arg('--base', 'http://localhost:4173/');
const ONLY = new RegExp(arg('--only', '.'));
const OUT = arg('--out', 'C:\\Users\\nelso\\grokbot_transfer\\ch4-overflow\\shots');
const REPORT = arg('--report', dirname(OUT));
const CHROME = arg('--chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
/** all：每個畫面都截；issues：有問題的才截；none：不截 */
const SHOTS = arg('--shots', 'all');
const ALL_DEVICES = {
  '390': { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
  '360': { width: 360, height: 800, deviceScaleFactor: 3, mobile: true },
  pc: { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false },
};
const DEVICES = arg('--devices', '390,360,pc').split(',').map((s) => s.trim()).filter((k) => ALL_DEVICES[k]);
/** 同時開幾個分頁（各做不同畫面）；預設 1＝一個一個來 */
const JOBS = Math.max(1, Math.min(4, Number(arg('--jobs', '1')) || 1));

// ---------------------------------------------------------------------------------------------
// 頁面裡用的小工具（注入到 window）
// ---------------------------------------------------------------------------------------------
function PAGE() {
  const game = () => window.__game;
  window.__scene = (key) => game().scene.getScene(key);
  /** 場景在跑（RUNNING 5）或暫停（PAUSED 6，畫面還在） */
  window.__alive = (key) => {
    const s = window.__scene(key);
    const st = s?.sys.settings.status;
    return !!s && (st === 5 || st === 6);
  };
  const press = (hit) => {
    const p = { x: 0, y: 0, isDown: false };
    hit.emit('pointerdown', p);
    hit.emit('pointerup', p);
  };
  /** 找按鈕（Container 裡有一個字符合 test 的 Text、和一個可以點的物件） */
  const findBtn = (list, test) => {
    for (const o of list) {
      if (!o.list || o.visible === false) continue;
      const t = o.list.find((x) => x.type === 'Text' && test(String(x.text).replace(/\s/g, '')));
      const hit = t && o.list.find((x) => x.input && x.input.enabled);
      if (hit) return hit;
      const r = findBtn(o.list, test);
      if (r) return r;
    }
    return null;
  };
  window.__click = (key, label) => {
    const want = label.replace(/\s/g, '');
    const s = window.__scene(key);
    const h = s && findBtn(s.children.list, (x) => x === want);
    if (h) press(h);
    return !!h;
  };
  window.__clickRe = (key, re) => {
    const r = new RegExp(re);
    const s = window.__scene(key);
    const h = s && findBtn(s.children.list, (x) => r.test(x));
    if (h) press(h);
    return !!h;
  };

  // 物件的排序鍵：[場景順序, 顯示清單位置, 容器裡的位置…]（字典序越大畫在越上面）
  const cmp = (a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
  };

  /** 點一下畫面（x, y 遊戲座標）：找最上面、包住這一點、聽 pointerup／pointerdown 的物件，照真的按下去 */
  window.__tap = (x, y) => {
    const g = game();
    const H = g.scale.gameSize.height;
    const px = x ?? g.scale.gameSize.width / 2;
    const py = y ?? H - 140;
    let best = null;
    g.scene.scenes.forEach((sc, si) => {
      if (sc.sys.settings.status !== 5 || !sc.sys.settings.visible || !sc.input?.enabled) return;
      const walk = (list, rank) => list.forEach((o, i) => {
        if (!o || o.visible === false) return;
        const r = rank.concat(i);
        if (o.list) return walk(o.list, r);
        if (!o.input?.enabled) return;
        if (o.listenerCount('pointerup') + o.listenerCount('pointerdown') === 0) return;
        const b = o.getBounds?.();
        if (!b || px < b.x || px > b.x + b.width || py < b.y || py > b.y + b.height) return;
        if (!best || cmp(r, best.r) > 0) best = { o, r };
      });
      walk(sc.children.list, [si]);
    });
    if (!best) return 'none';
    const p = { x: px, y: py, isDown: false };
    best.o.emit('pointerdown', p);
    best.o.emit('pointerup', p);
    return best.o.type;
  };

  /** 一個場景裡看得到的字（含容器裡的）接起來：演出有沒有往下一拍走 */
  window.__sig = (key) => {
    const out = [];
    const walk = (list) => list.forEach((o) => {
      if (!o || o.visible === false) return;
      if (o.list) return walk(o.list);
      if (o.type === 'Text') out.push(o.text);
    });
    const s = window.__scene(key);
    if (s) walk(s.children.list);
    return out.join('|');
  };

  /** 掃描：回傳 { W, H, texts, issues } */
  window.__scan = () => {
    const g = game();
    const W = g.scale.gameSize.width;
    const H = g.scale.gameSize.height;
    const texts = [];
    const frames = [];
    const covers = [];
    const fills = [];
    g.scene.scenes.forEach((sc, si) => {
      const st = sc.sys.settings;
      if (!st.visible || (st.status !== 5 && st.status !== 6)) return;
      const cam = sc.cameras?.main;
      if (!cam || !cam.visible || cam.alpha <= 0.02) return;
      const key = st.key;
      const toS = (x, y, sf) => {
        const ox = cam.width * cam.originX;
        const oy = cam.height * cam.originY;
        return [cam.x + ox + (x - cam.scrollX * sf - ox) * cam.zoom, cam.y + oy + (y - cam.scrollY * sf - oy) * cam.zoom];
      };
      const rectOf = (m, x0, y0, x1, y1, sf) => {
        const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => toS(m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f, sf));
        const xs = pts.map((p) => p[0]);
        const ys = pts.map((p) => p[1]);
        const l = Math.min(...xs);
        const t = Math.min(...ys);
        return { x: l, y: t, w: Math.max(...xs) - l, h: Math.max(...ys) - t };
      };
      const addFrame = (b, rank, alpha, fill) => {
        // 有填色的東西都可能蓋住後面的字（說明卡、字幕底、印章、回憶的整片底色）
        if (fill && alpha >= 0.3) fills.push({ b, rank, alpha });
        if (fill && alpha >= 0.3 && b.x <= 2 && b.y <= 2 && b.x + b.w >= W - 2 && b.y + b.h >= H * 0.95) covers.push({ si, rank, alpha });
        if (b.w < 40 || b.h < 24 || b.w >= W - 2 || b.h >= H - 2) return;
        frames.push({ scene: key, si, rank, b, fill });
      };
      const walk = (list, rank, alpha, masked, sf0) => list.forEach((o, i) => {
        if (!o || o.visible === false) return;
        const a = alpha * (o.alpha ?? 1);
        if (a <= 0.02) return;
        const r = rank.concat(i);
        const mk = masked || !!o.mask;
        const sf = sf0 ?? (o.scrollFactorX ?? 1);
        if (o.list) return walk(o.list, r, a, mk, sf);
        const m = o.getWorldTransformMatrix?.();
        if (!m) return;
        if (o.type === 'Text') {
          const s = String(o.text);
          if (!s.trim()) return;
          const b = rectOf(m, -o.displayOriginX, -o.displayOriginY, o.width - o.displayOriginX, o.height - o.displayOriginY, sf);
          texts.push({ scene: key, si, rank: r, text: s, b, masked: mk, alpha: a, size: String(o.style.fontSize) });
          // 有底色的字（名字牌、印章）也會蓋住後面的字
          if (o.style.backgroundColor && a >= 0.3) fills.push({ b, rank: r, alpha: a });
          return;
        }
        if (o.type === 'Rectangle') {
          if (o.isFilled && o.fillAlpha * a >= 0.25) {
            addFrame(rectOf(m, -o.displayOriginX, -o.displayOriginY, o.width - o.displayOriginX, o.height - o.displayOriginY, sf), r, o.fillAlpha * a, true);
          }
          return;
        }
        if (o.type === 'Graphics') {
          const buf = o.commandBuffer;
          let fa = 0;
          let la = 0;
          let pts = [];
          const fromPts = (fill, al) => {
            if (pts.length < 2) return;
            const xs = pts.map((p) => p[0]);
            const ys = pts.map((p) => p[1]);
            addFrame(rectOf(m, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), sf), r, al, fill);
          };
          for (let k = 0; k < buf.length;) {
            const c = buf[k++];
            switch (c) {
              case 0: { const [x, y, rr] = [buf[k], buf[k + 1], buf[k + 2]]; pts.push([x - rr, y - rr], [x + rr, y + rr]); k += 7; break; }
              case 1: pts = []; break;
              case 2: break;
              case 3: {
                const [x, y, w, h] = [buf[k], buf[k + 1], buf[k + 2], buf[k + 3]];
                if (fa * a >= 0.25) addFrame(rectOf(m, x, y, x + w, y + h, sf), r, fa * a, true);
                k += 4;
                break;
              }
              case 4: case 5: pts.push([buf[k], buf[k + 1]]); k += 2; break;
              case 6: la = buf[k + 2]; k += 3; break;
              case 7: fa = buf[k + 1]; k += 2; break;
              case 8: if (fa * a >= 0.25) fromPts(true, fa * a); break;
              case 9: if (la * a >= 0.5) fromPts(false, la * a); break;
              case 10: case 11: k += 6; break;
              case 14: case 15: break;
              case 16: case 17: k += 2; break;
              case 18: k += 1; break;
              case 21: fa = Math.max(buf[k], buf[k + 1], buf[k + 2], buf[k + 3]); k += 8; break;
              case 22: la = buf[k + 1]; k += 6; break;
              default: k = buf.length;
            }
          }
        }
      });
      walk(sc.children.list, [si], cam.alpha, false, undefined);
    });

    // 被蓋住：畫在字上面、整個包住這個字的填色物件（全螢幕黑幕、說明卡、字幕底、印章…）疊起來的不透明度
    const inside = (b, F, tol = 1) => b.x >= F.x - tol && b.y >= F.y - tol && b.x + b.w <= F.x + F.w + tol && b.y + b.h <= F.y + F.h + tol;
    for (const t of texts) {
      const over = fills.filter((f) => cmp(f.rank, t.rank) > 0 && inside(t.b, f.b));
      t.cover = over.length ? 1 - over.reduce((p, f) => p * (1 - Math.min(1, f.alpha)), 1) : 0;
      // 字下面最上面那層全螢幕黑幕：比它更下面的框不算這個字的框（對話框下面的卡片按鈕、回憶底下的夜審面板）
      const under = covers.filter((c) => c.si === t.si && cmp(c.rank, t.rank) < 0).sort((p, q) => cmp(q.rank, p.rank))[0];
      t.floor = under?.rank;
    }
    // 淡出中（alpha < 0.3）、被蓋住（≥ 0.9）的字不檢查
    const live = texts.filter((t) => t.cover < 0.9 && t.alpha >= 0.3);
    const short = (s) => s.replace(/\s+/g, ' ').slice(0, 30);
    const R = (b) => [Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)];
    const issues = [];
    const TOL = 2;
    for (const t of live) {
      if (t.masked) continue;
      const b = t.b;
      const over = { left: -b.x, top: -b.y, right: b.x + b.w - W, bottom: b.y + b.h - H };
      if (Object.values(over).some((v) => v > TOL)) {
        issues.push({ kind: 'offscreen', scene: t.scene, text: short(t.text), size: t.size, bounds: R(b), over: Object.fromEntries(Object.entries(over).filter(([, v]) => v > TOL).map(([k, v]) => [k, Math.round(v)])), dimmed: t.cover > 0 || undefined });
      }
      if (t.cover > 0) continue;
      // 框：同場景、畫在下面（但在字下面那層全螢幕黑幕之上）、包住字的中心點的最小矩形。
      // 中心點要在框裡面 4px 以上：字的中心在框外（或剛好壓在框線上）的是名字牌這類故意凸出去的，不算超出框
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const M = 4;
      const fr = frames
        .filter((f) => f.si === t.si && cmp(f.rank, t.rank) < 0 && (!t.floor || cmp(f.rank, t.floor) > 0)
          && cx > f.b.x + M && cx < f.b.x + f.b.w - M && cy > f.b.y + M && cy < f.b.y + f.b.h - M)
        .sort((p, q) => p.b.w * p.b.h - q.b.w * q.b.h)[0];
      if (fr) {
        const F = fr.b;
        const o2 = { left: F.x - b.x, top: F.y - b.y, right: b.x + b.w - (F.x + F.w), bottom: b.y + b.h - (F.y + F.h) };
        if (Object.values(o2).some((v) => v > 3)) {
          issues.push({ kind: 'frame', scene: t.scene, text: short(t.text), size: t.size, bounds: R(b), frame: R(F), over: Object.fromEntries(Object.entries(o2).filter(([, v]) => v > 3).map(([k, v]) => [k, Math.round(v)])) });
        }
      }
    }
    // 重疊
    const ov = live.filter((t) => !t.masked && t.cover === 0);
    // 兩個字中間（畫在下面那個之上、上面那個之下）有填色物件蓋住交集：看起來不會疊（例如字幕底把後面的字蓋掉）
    const hidden = (lo, hi, ix0, iy0, ix1, iy1) => {
      const box = { x: ix0, y: iy0, w: ix1 - ix0, h: iy1 - iy0 };
      const mid = fills.filter((f) => cmp(f.rank, lo.rank) > 0 && cmp(f.rank, hi.rank) < 0 && inside(box, f.b));
      return 1 - mid.reduce((p, f) => p * (1 - Math.min(1, f.alpha)), 1) >= 0.9;
    };
    for (let i = 0; i < ov.length; i++) {
      for (let j = i + 1; j < ov.length; j++) {
        const a = ov[i].b;
        const b = ov[j].b;
        const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ix <= 4 || iy <= 4) continue;
        const [lo, hi] = cmp(ov[i].rank, ov[j].rank) < 0 ? [ov[i], ov[j]] : [ov[j], ov[i]];
        if (hidden(lo, hi, Math.max(a.x, b.x), Math.max(a.y, b.y), Math.min(a.x + a.w, b.x + b.w), Math.min(a.y + a.h, b.y + b.h))) continue;
        // 同一行左右拼起來的字（名字＋台詞、【】＋字）
        if (Math.abs(a.y + a.h / 2 - (b.y + b.h / 2)) < 6 && ix <= 10) continue;
        issues.push({ kind: 'overlap', scene: ov[i].scene, text: short(ov[i].text), bounds: R(a), other: { scene: ov[j].scene, text: short(ov[j].text), bounds: R(b) }, area: [Math.round(ix), Math.round(iy)] });
      }
    }
    return { W, H, texts: texts.length, issues };
  };

  // ---------------- 白天：一個一個畫面叫出來 ----------------
  window.__dayActs = () => {
    const s = window.__scene('day');
    const p = s.plan;
    const f = p.follow;
    const acts = [];
    const seen = new Set();
    const encs = [...p.pre, ...(p.tagged ?? []).flatMap((t) => t.encounters), ...p.routes.flatMap((r) => r.encounters),
      ...(f?.detour?.encounters ?? []), ...(f?.rest?.encounters ?? []), ...p.post].filter((e) => !seen.has(e.id) && seen.add(e.id));
    const fresh = () => { s.busy = false; s.redraw = undefined; s.caught = undefined; };
    for (const e of encs) {
      if (e.peek) acts.push({ name: `peek_${e.id}`, run: () => { fresh(); s.panelMsg(e.place, e.peek); } });
      acts.push({ name: `${e.kind}_${e.id}`, run: () => { fresh(); s.show(e); } });
    }
    if (f) {
      acts.push({ name: 'bet_info', run: () => { fresh(); s.showBetInfo(); } });
      acts.push({ name: 'bet_pick', run: () => { fresh(); s.showBetPick(); } });
      if (f.detour) {
        acts.push({ name: 'detour', run: () => { fresh(); s.stepPanel(`臨時轉進・${f.detour.name}`, `${f.detour.text}\n\n（這一次沒得猜，只能跟。）`, '跟進去', () => {}); } });
        acts.push({ name: 'detour_why', run: () => { fresh(); s.showDetourWhy(); } });
      }
      acts.push({ name: 'rest', run: () => { fresh(); s.routeEndPlayed = true; s.showRest(); } });
      if (f.rest.gather) acts.push({ name: 'rest_gather', run: () => { fresh(); s.routeEndPlayed = true; s.showRest(); window.__click('day', '等人集結'); } });
      acts.push({ name: 'sunset', run: () => { fresh(); s.stayStoryPlayed = true; s.broadcastHeard = true; window.__run().flags[`missedfun_${p.day}`] = true; s.endDayFollow(); } });
    }
    acts.push({ name: 'start_msg', run: () => { fresh(); s.panelMsg(`${p.title}・起駕`, '頭旗出發了，轎子跟在後面。往哪裡走，只有媽祖知道。路上遇到的事，停下來處理才花時辰；略過就走過去了。'); } });
    acts.push({ name: 'ledger', run: () => { fresh(); s.showLedger(); } });
    acts.push({ name: 'evidence', run: () => {
      const r = window.__run();
      for (const id of Object.keys(window.__ch().evidence)) if (!r.evidence.includes(id)) r.evidence.push(id);
      fresh();
      s.showEvidence();
    } });
    window.__acts = acts;
    window.__actKey = 'day';
    return acts.map((a) => a.name);
  };
  /**
   * 上一個動作開的清單（因果簿、證物袋、出示證據）先關掉再做下一個：
   * 真的玩的時候清單有整片可點的黑幕，關掉之前按不到別的；不關會疊兩層（第 1 次掃描的「證物袋」「收回」重疊就是這樣來的）
   */
  window.__closeAll = (key) => {
    let n = 0;
    while (n < 4 && (window.__click(key, '關閉') || window.__click(key, '收回'))) n++;
    return n;
  };
  window.__actDo = (i) => {
    if (window.__actKey) window.__closeAll(window.__actKey);
    window.__acts[i].run();
    return window.__acts[i].name;
  };

  /** 白天：打開某件事的卡片，按第一個辦得了的選項（看結果的對話） */
  window.__dayPick = (id) => {
    const s = window.__scene('day');
    const p = s.plan;
    const f = p.follow;
    const all = [...p.pre, ...(p.tagged ?? []).flatMap((t) => t.encounters), ...p.routes.flatMap((r) => r.encounters), ...(f?.detour?.encounters ?? []), ...(f?.rest?.encounters ?? []), ...p.post];
    const e = all.find((x) => x.id === id);
    if (!e) return 'none';
    s.busy = false;
    s.show(e);
    const box = s.cardBox;
    const btns = [];
    const walk = (list) => list.forEach((o) => { if (o.list) { const t = o.list.find((x) => x.type === 'Text'); const hit = o.list.find((x) => x.input?.enabled); if (t && hit && o.setLabel) btns.push({ label: String(t.text), hit, alpha: t.alpha }); else walk(o.list); } });
    walk(box?.list ?? []);
    const b = btns.find((x) => x.alpha > 0.9 && !/略過|不/.test(x.label.replace(/\s/g, '')));
    if (!b) return 'no option';
    b.hit.emit('pointerdown', { x: 0, y: 0 });
    b.hit.emit('pointerup', { x: 0, y: 0 });
    return b.label;
  };

  // ---------------- 夜審 ----------------
  window.__trialActs = () => {
    const s = window.__scene('trial');
    const C = window.__ch();
    const r = window.__run();
    const acts = [{ name: 'lobby', run: () => s.lobby() }];
    for (const h of [...r.held]) {
      const k = C.cases[h.id];
      if (!k) continue;
      const t0 = k.truths[0];
      acts.push({ name: `${k.id}_open`, run: () => s.open(k) });
      if (k.press?.length) acts.push({ name: `${k.id}_press`, run: () => s.say(k, `${k.pressQ?.[0] ? `${k.pressQ[0]}\n` : ''}${k.dayName}：${k.press[0]}`) });
      if (t0) {
        acts.push({ name: `${k.id}_present`, run: () => { for (const t of k.truths) for (const id of t.evidence) if (!r.evidence.includes(id)) r.evidence.push(id); s.say(k, C.trial.again ?? ''); s.present(k, t0.stmt); } });
        const wrongEv = Object.keys(C.evidence).find((id) => !k.truths.some((t) => t.evidence.includes(id)));
        if (wrongEv) acts.push({ name: `${k.id}_wrong`, run: () => { if (!r.evidence.includes(wrongEv)) r.evidence.push(wrongEv); s.check(k, t0.stmt, wrongEv); } });
        acts.push({ name: `${k.id}_flashback`, run: () => s.check(k, t0.stmt, t0.evidence[0]), taps: 4 });
      }
      acts.push({ name: `${k.id}_solved`, run: () => { r.cases[k.id] = { ...(r.cases[k.id] ?? {}), truths: k.truths.map((_, i) => i) }; s.say(k, `${C.trial.record}：${t0?.summary ?? ''}`, 'sad'); } });
      acts.push({ name: `${k.id}_verdicts`, run: () => s.verdicts(k) });
    }
    // 判決（會改進度：放在最後，一個鬼一個）
    for (const h of [...r.held]) {
      const k = C.cases[h.id];
      if (!k) continue;
      acts.push({ name: `${k.id}_judge`, run: () => { const v = k.verdicts.find((x) => !s.why(k, x)); if (v) s.judge(k, v); }, taps: 3 });
    }
    window.__acts = acts;
    window.__actKey = 'trial';
    return acts.map((a) => `${a.name}${a.taps ? `#${a.taps}` : ''}`);
  };
}
const PAGE_JS = `(${PAGE.toString()})()`;

// ---------------------------------------------------------------------------------------------
// 畫面清單
// ---------------------------------------------------------------------------------------------
const CH4 = 'ch=baishadun';
/** 夜審：深層連結一開立繪還沒載到；等圖載好重開一次（data 裡的 ask／panel 會留著） */
const TRIAL_RESTART = "(() => { const s = __scene('trial'); s.scene.restart(s.sys.settings.data); })()";
const CUT = (kind, title, sub) => `(() => { const s = __scene('title'); s.scene.start('cut', { kind: '${kind}', title: ${title}, sub: ${sub}, next: { key: 'title' } }); })()`;

/**
 * 步驟：
 *  { sleep }、{ js }、{ scan: '子畫面名' }（掃描＋截圖）、{ tap: true }（點畫面下方，換下一句）
 *  { click: [場景, 按鈕字] }、{ clickRe: [場景, 規則] }
 *  { talk: 'prefix', n, gap }：對話一句一句（等打字跑完掃一次，再點）
 *  { story: 'prefix', max, gap }：演出一拍一拍掃，直到 story 場景結束
 *  { acts: 'day'|'trial' }：叫頁面裡的 __dayActs／__trialActs，一個一個做、每個掃一次
 *  { pick: '事件 id' }：白天打開那件事、按第一個選項，之後的對話掃 4 句
 */
const SCREENS = [];
const add = (name, q, wait, steps) => SCREENS.push({ name, q, wait, steps });

// 標題、章節
add('title', '', 3500, [{ scan: '' }]);
add('chapter', `scene=chapter&${CH4}`, 3000, [{ scan: '' }, { js: "(() => { const s = __scene('chapter'); for (let i = 0; i < 6; i++) { try { s.select(i); } catch {} } return 'ok'; })()" }, { sleep: 600 }, { scan: 'last' }]);

// 序章黃曆＋擲筊
add('almanac_prologue', `scene=almanac&${CH4}&prologue=1`, 3500, [
  { scan: '' },
  { click: ['almanac', '請示媽祖'] }, { sleep: 700 }, { scan: 'jiao' },
  // 擲到三個聖筊為止（聖杯 50%）：最多按 14 次
  ...Array.from({ length: 14 }, () => [{ clickRe: ['almanac', '^(擲筊|再擲)'] }, { sleep: 1800 }]).flat(),
  { scan: 'jiao_done' },
]);
// 第 1–3 天黃曆（昨日卡、今日說明卡、黃曆本頁）
for (const n of [1, 2, 3]) {
  const q = `scene=almanac&n=${n}&${CH4}${n > 1 ? '&preset=missed' : ''}`;
  add(`almanac_day${n}`, q, 3500, [
    { scan: n > 1 ? 'yesterday' : 'unlock' },
    { clickRe: ['almanac', '^知道了$'] }, { sleep: 700 }, { scan: n > 1 ? 'unlock' : 'page' },
    { clickRe: ['almanac', '^知道了$'] }, { sleep: 700 }, { scan: n > 1 ? 'page' : 'page2' },
  ]);
}
add('almanac_day3_yday', `scene=almanac&n=3&${CH4}&bc1=garage&yday=1`, 3500, [{ scan: '' }]);
add('almanac_epilogue', `scene=almanac&${CH4}&epilogue=1&preset=missed`, 3500, [{ scan: 'yesterday' }, { clickRe: ['almanac', '^知道了$'] }, { sleep: 700 }, { scan: 'page' }]);
add('almanac_epilogue_clean', `scene=almanac&${CH4}&epilogue=1`, 3500, [{ scan: '' }]);

// 過場（出發、日落、開戰）：標題、副標用遊戲裡真的字
for (const n of [1, 2, 3]) {
  add(`cut_depart${n}`, `scene=title&${CH4}`, 3000, [
    { js: CUT('depart', `__ch().days[${n}].title + '・起駕'`, `__ch().days[${n}].area`) }, { sleep: 1800 }, { scan: '' },
  ]);
}
add('cut_dusk', `scene=title&${CH4}`, 3000, [{ js: CUT('dusk', "'日落・駐駕'", "'今晚問' + __ch().held.label + '的好兄弟要去哪裡'") }, { sleep: 1800 }, { scan: '' }]);
add('cut_finale', `scene=title&${CH4}`, 3000, [{ js: CUT('dusk', "'日落・入夜'", '__ch().finale.cutSub') }, { sleep: 1800 }, { scan: '' }]);
add('cut_boss', `scene=title&${CH4}`, 3000, [{ js: CUT('boss', '__ch().finale.cutTitle', '__ch().finale.cutSub') }, { sleep: 2200 }, { scan: '' }]);

// 白天三天：每一種卡片、岔路、停駕、日落、因果簿、證物袋
for (const n of [1, 2, 3]) {
  add(`day${n}`, `scene=day&n=${n}&${CH4}${n === 2 ? '&bc1=garage' : ''}`, 4500, [{ scan: 'start' }, { acts: 'day' }]);
}
add('day1_pick', `scene=day&n=1&${CH4}`, 4500, [{ pick: 'FIRST_PERSON' }]);
add('day2_pick', `scene=day&n=2&${CH4}&bc1=garage`, 4500, [{ pick: 'FIRST_PERSON' }]);
add('day3_pick', `scene=day&n=3&${CH4}`, 4500, [{ pick: 'FIRST_PERSON' }]);
add('day1_sunset_missed', `scene=day&n=1&${CH4}&preset=missed&sunset=1`, 4000, [{ talk: 'fun', n: 4 }, { sleep: 1500 }, { scan: 'panel' }]);
add('day3_sunset', `scene=day&n=3&${CH4}&preset=missed&sunset=1`, 4000, [{ talk: 'fun', n: 3 }, { sleep: 1500 }, { scan: 'panel' }]);

// 夜審（問歸處）
for (const [n, held] of [[1, 'caoxie,apo'], [2, 'xinniang,jiajiao']]) {
  add(`trial${n}`, `scene=trial&n=${n}&${CH4}&held=${held}&ask=lobby`, 3000, [{ js: TRIAL_RESTART }, { sleep: 2500 }, { scan: 'lobby_start' }, { acts: 'trial' }]);
  add(`trial${n}_intro`, `scene=trial&n=${n}&${CH4}&held=${held}`, 3500, [{ talk: 'intro', n: 4 }]);
}
add('trial1_empty', `scene=trial&n=1&${CH4}&ask=lobby`, 3000, [{ js: TRIAL_RESTART }, { sleep: 2000 }, { scan: '' }]);
add('trial1_fun', `scene=trial&n=1&${CH4}&preset=missed&fun=1`, 3500, [{ sleep: 1500 }, { scan: '' }, { talk: 'fun', n: 3 }]);

// 最後一戰
const BOSS_START = "(() => { const ok = __click('bosshud', '開始'); __scene('boss').battle.paused = true; const h = __scene('bosshud'); window.__chain = h.chainQueue; h.chainQueue = []; return '開始=' + ok + '，人鏈 ' + window.__chain.length + ' 組'; })()";
const CHAIN_SAY = (i) => `(() => { const h = __scene('bosshud'); const g = window.__chain[${i}]; if (!g) return 'none'; h.say(g); return g.map((l) => l.who).join('/'); })()`;
const LURE_NOW = "(() => { const b = __scene('boss').battle; b.paused = false; b.lureTimer = 0; return 'lure'; })()";
const PAUSE = "(() => { __scene('boss').battle.paused = true; })()";
const ALL_EVIDENCE = "(() => { const r = __run(); for (const id of Object.keys(__ch().evidence)) if (!r.evidence.includes(id)) r.evidence.push(id); return r.evidence.length; })()";
const bossQ = `scene=boss&${CH4}&done=xianzai3,arui3&strayed=stray2y,stray2b`;
add('boss', bossQ, 4500, [
  { scan: 'briefing' },
  { js: BOSS_START }, { sleep: 2500 }, { scan: 'hud' },
  ...[0, 1, 2].flatMap((i) => [{ js: CHAIN_SAY(i) }, { sleep: 900 }, { scan: `chain${i + 1}a` }, { sleep: 2300 }, { scan: `chain${i + 1}b` }, { sleep: 1500 }]),
  { js: LURE_NOW }, { sleep: 900 }, { js: PAUSE }, { scan: 'lure' },
]);
add('boss_trial_wrong', bossQ, 4500, [
  { js: BOSS_START }, { sleep: 1500 },
  { js: "__scene('bosshud').trial(1)" }, { sleep: 1900 }, { scan: 'r1' }, { sleep: 2200 }, { scan: 'r1_talk' },
]);
add('boss_trial_ok', bossQ, 4500, [
  { js: ALL_EVIDENCE }, { js: BOSS_START }, { sleep: 1500 },
  ...[1, 2, 3].flatMap((r) => [{ js: `__scene('bosshud').trial(${r})` }, { sleep: 1900 }, { scan: `r${r}` }, { sleep: 2200 }, { scan: `r${r}_talk` }, { sleep: 3500 }]),
]);
add('boss_finish', bossQ, 4500, [
  { js: ALL_EVIDENCE }, { js: BOSS_START }, { sleep: 800 },
  { js: "(() => { const h = __scene('bosshud'); h.ok = [true, true, true]; h.finish('subdued'); })()" }, { sleep: 1500 }, { scan: 'subdued' },
]);
add('boss_finish_miss', bossQ, 4500, [
  { js: BOSS_START }, { sleep: 800 },
  { js: "(() => { const h = __scene('bosshud'); h.ok = [false, false, false]; h.finish('subdued'); })()" }, { sleep: 1500 }, { scan: 'subdued' },
]);
add('boss_finish_dawn', bossQ, 4500, [{ js: BOSS_START }, { sleep: 800 }, { js: "__scene('bosshud').finish('dawn')" }, { sleep: 1200 }, { scan: '' }]);

// 對話／過場（演出一拍一拍）：第四章全部的劇情；結局相關的三種都走
const STORIES = ['qitou4', 'qijia4', 'zhuanjin4', 'tianliang4_1', 'chufa4_2', 'guozun4', 'tingjia_beijin4', 'jinmiao4', 'jinhuo4',
  'fangxia_caoxie4', 'tianliang4_2', 'chufa4_3', 'tingjia_dike4', 'huitou4', 'qiaotou4', 'mangdu4'];
for (const id of STORIES) add(`story_${id}`, `scene=story&id=${id}&${CH4}&done=xianzai3,arui3`, 4000, [{ story: '', max: 45, gap: 1900 }]);
for (const end of ['recall', 'return', 'slay']) {
  for (const id of ['huigong4', 'kailu4']) add(`story_${id}_${end}`, `scene=story&id=${id}&${CH4}&ending=${end}&done=xianzai3,arui3`, 4000, [{ story: '', max: 45, gap: 1900 }]);
}
add('story_mangdu4_text', `scene=story&id=mangdu4&${CH4}&text=1`, 4000, [{ story: '', max: 45, gap: 2200 }]);

// 結局（信徒錄）
for (const end of ['recall', 'return', 'slay']) add(`end_${end}`, `scene=end&${CH4}&ending=${end}&done=xianzai3,arui3`, 3500, [{ scan: '' }]);
add('end_missed', `scene=end&${CH4}&preset=missed&epilogue=1&ending=slay`, 3500, [{ scan: '' }]);

// ---------------------------------------------------------------------------------------------
// CDP
// ---------------------------------------------------------------------------------------------
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
      const t = setTimeout(() => { if (wait.has(n)) { wait.delete(n); ng(new Error('CDP timeout ' + method)); } }, 30000);
      wait.set(n, { ok: (v) => { clearTimeout(t); ok(v); }, ng: (e) => { clearTimeout(t); ng(e); } });
      ws.send(JSON.stringify({ id: n, method, params, sessionId }));
    });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safe = (s) => s.replace(/[^\w.-]+/g, '_');
/** 一行馬上寫出去（不等緩衝；被中斷也看得到跑到哪） */
const say = (fd, s) => {
  try {
    writeSync(fd, `${s}\n`);
  } catch {
    (fd === 2 ? console.warn : console.log)(s);
  }
};
const log = (s) => say(1, s);
const warn = (s) => say(2, s);

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(REPORT, { recursive: true });
  // 每個畫面掃完就先 append 一行（中途被中斷也有結果）；每次重跑從空的開始
  const PARTIAL = join(REPORT, 'overflow.partial.jsonl');
  writeFileSync(PARTIAL, '', 'utf8');
  const prof = mkdtempSync(join(tmpdir(), 'tp-overflow-'));
  // 平行開好幾個分頁時，不在前景的分頁不能被降速（計時器、requestAnimationFrame），不然動畫跟等待的秒數對不上
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  /** 每個畫面 × 裝置一筆 */
  const results = [];
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

    // 工作清單：裝置 × 畫面。--jobs N 就同時開 N 個分頁，各做各的畫面（每個畫面自己一個分頁，互不影響）
    const jobs = [];
    for (const dev of DEVICES) for (const o of SCREENS) if (ONLY.test(o.name)) jobs.push({ dev, o, idx: jobs.length });
    log(`畫面 ${jobs.length} 個（裝置 ${DEVICES.join('/')}），同時 ${JOBS} 個分頁`);
    const runOne = async ({ dev, o, idx }) => {
      {
        const D = ALL_DEVICES[dev];
        let seq = 0;
        const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
        const s = (m, p) => send(m, p, sessionId);
        const ev = async (expression) => {
          const r = await Promise.race([s('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }), sleep(20000).then(() => ({ exceptionDetails: { text: 'timeout 20s' } }))]);
          if (r.exceptionDetails) {
            const msg = r.exceptionDetails.exception?.description ?? r.exceptionDetails.text;
            warn(`  [${dev}] ${o.name} js 出錯：${String(msg).split('\n')[0]}`);
            return undefined;
          }
          return r.result?.value;
        };
        try {
          await s('Page.enable');
          await s('Runtime.enable');
          await s('Emulation.setDeviceMetricsOverride', D);
          if (D.mobile) {
            await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }).catch(() => {});
            await s('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }] }).catch(() => {});
          }
          await s('Page.navigate', { url: `${BASE}?${o.q}` });
          await sleep(o.wait);
          await ev(PAGE_JS);

          const scan = async (sub) => {
            const screen = sub ? `${o.name}_${sub}` : o.name;
            const r = await ev('__scan()');
            if (!r) return;
            const row = { screen, device: dev, W: r.W, H: r.H, texts: r.texts, issues: r.issues, job: idx, seq: seq++ };
            results.push(row);
            appendFileSync(PARTIAL, `${JSON.stringify(row)}\n`, 'utf8');
            const bad = r.issues.length;
            if (SHOTS === 'all' || (SHOTS === 'issues' && bad)) {
              const { data } = await s('Page.captureScreenshot', { format: 'png' });
              writeFileSync(join(OUT, `${safe(screen)}__${dev}.png`), Buffer.from(data, 'base64'));
            }
            log(`${bad ? '!!' : 'ok'} [${dev} ${r.W}×${r.H}] ${screen}：字 ${r.texts}、問題 ${bad}`);
          };
          const talk = async (prefix, n, gap = 2600) => {
            for (let i = 0; i < n; i++) {
              await sleep(i === 0 ? 1200 : gap);
              await scan(`${prefix}_l${i + 1}`);
              await ev('__tap()');
            }
          };

          for (const st of o.steps) {
            if (st.sleep) await sleep(st.sleep);
            if (st.js) {
              const v = await ev(st.js);
              if (v !== undefined) log(`   [${dev}] ${o.name}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
            }
            if (st.click) {
              const ok = await ev(`__click(${JSON.stringify(st.click[0])}, ${JSON.stringify(st.click[1])})`);
              if (!ok) warn(`   [${dev}] ${o.name}: 找不到按鈕「${st.click[1]}」`);
            }
            if (st.clickRe) await ev(`__clickRe(${JSON.stringify(st.clickRe[0])}, ${JSON.stringify(st.clickRe[1])})`);
            if (st.tap) await ev('__tap()');
            if (st.scan !== undefined) await scan(st.scan);
            if (st.talk) await talk(st.talk, st.n, st.gap);
            if (st.story !== undefined) {
              await sleep(800);
              let last = '';
              let same = 0;
              for (let k = 0; k < st.max; k++) {
                if (!(await ev("__alive('story')"))) break;
                await scan(`${st.story ? `${st.story}_` : ''}b${String(k).padStart(2, '0')}`);
                // 卡住（同一拍連三次）就停
                const sig = await ev("__sig('story')");
                same = sig === last ? same + 1 : 0;
                last = sig;
                if (same >= 2) break;
                await ev('__tap()');
                await sleep(st.gap);
              }
            }
            if (st.acts) {
              const names = (await ev(st.acts === 'day' ? '__dayActs()' : '__trialActs()')) ?? [];
              for (let i = 0; i < names.length; i++) {
                const [name, taps] = names[i].split('#');
                await ev(`__actDo(${i})`);
                await sleep(900);
                await scan(name);
                // 有回憶、判決的對話：點幾下，每下掃一次
                for (let t = 0; t < Number(taps ?? 0); t++) {
                  await ev('__tap()');
                  await sleep(1800);
                  await scan(`${name}_t${t + 1}`);
                }
              }
            }
            if (st.pick) {
              const id = st.pick === 'FIRST_PERSON'
                ? await ev("(() => { const p = __scene('day').plan; const all = [...p.pre, ...(p.tagged ?? []).flatMap((t) => t.encounters), ...p.routes.flatMap((r) => r.encounters), ...p.post]; return all.find((e) => e.kind === 'person')?.id; })()")
                : st.pick;
              const label = await ev(`__dayPick(${JSON.stringify(id ?? '')})`);
              log(`   [${dev}] ${o.name}: ${id} → ${label}`);
              await talk(`${id}_after`, 4);
            }
          }
        } catch (e) {
          warn(`  [${dev}] ${o.name} 失敗：${e.message}`);
        }
        await send('Target.closeTarget', { targetId }).catch(() => {});
      }
    };
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(JOBS, jobs.length) }, async () => {
      while (next < jobs.length) {
        const j = jobs[next++];
        try {
          await runOne(j);
        } catch (e) {
          // 開分頁就失敗（Chrome 掛了之類）：記下來，換下一個畫面
          warn(`  [${j.dev}] ${j.o.name} 開不起來：${e.message}`);
        }
      }
    }));
    // 平行跑完的順序是亂的：照「裝置 → 畫面清單 → 掃描順序」排回來
    results.sort((a, b) => a.job - b.job || a.seq - b.seq);
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

  // ---------- 報告 ----------
  writeFileSync(join(REPORT, 'overflow.json'), JSON.stringify({ base: BASE, devices: DEVICES, results }, null, 1), 'utf8');
  const KIND = { offscreen: '超出畫面', frame: '超出框', overlap: '文字重疊' };
  const lines = ['# 第四章超框掃描（tools/overflow-scan-ch4.mjs）', `# 畫面 ${new Set(results.map((r) => r.screen)).size} 個 × 裝置 ${DEVICES.join('/')}；有問題的 ${results.filter((r) => r.issues.length).length} 筆`, ''];
  // 先合併：同一個問題（種類＋字＋另一個字）在哪些畫面、哪些裝置出現
  const merged = new Map();
  for (const r of results) {
    for (const it of r.issues) {
      const key = `${it.kind}|${it.scene}|${it.text}|${it.other?.text ?? ''}`;
      const m = merged.get(key) ?? { ...it, where: [] };
      m.where.push(`${r.screen}@${r.device}`);
      merged.set(key, m);
    }
  }
  const sorted = [...merged.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.scene.localeCompare(b.scene));
  for (const it of sorted) {
    const extra = it.kind === 'overlap' ? ` ↔ 「${it.other.text}」[${it.other.bounds}]（重疊 ${it.area.join('×')}）`
      : it.kind === 'frame' ? ` 框 [${it.frame}] 超出 ${JSON.stringify(it.over)}` : ` 超出 ${JSON.stringify(it.over)}${it.dimmed ? '（在半透明黑幕下）' : ''}`;
    lines.push(`[${KIND[it.kind]}] ${it.scene}「${it.text}」${it.size ? ` ${it.size}` : ''} [${it.bounds}]${extra}`);
    const w = it.where;
    lines.push(`    出現在 ${w.length} 處：${w.slice(0, 8).join('、')}${w.length > 8 ? '…' : ''}`);
  }
  if (!sorted.length) lines.push('（沒有找到問題）');
  writeFileSync(join(REPORT, 'overflow.txt'), lines.join('\r\n') + '\r\n', 'utf8');
  log(`\n問題 ${sorted.length} 種；報告：${join(REPORT, 'overflow.txt')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
