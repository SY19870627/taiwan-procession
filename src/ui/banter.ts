/**
 * 互嗆小字幕（第三章起；第一、二章熱鬧化第 5 階段起白天也有）：一句一行，從畫面上方滑進來，幾秒後自己消失。
 * 不攔點擊、不暫停（大綱 §3：每句 1 行、不擋操作）。同一場景同時只顯示一組，新的一組會蓋掉舊的。
 * 也不蓋住按鈕：每句放在不和場景裡任何可點的東西重疊的高度；之後才冒出來的按鈕也會讓開（freeY）。
 * 可以限制寬度（maxW），太長就換行，不蓋到畫面中間的東西（夜審的立繪）。
 * 也可以放大字、加深底色（style）：夜審字幕條、最後一戰（戰場特效會飛過字幕）。
 */
import Phaser from 'phaser';
import { H, W, WHO_COLOR } from '../theme';
import { freeY, wrapWidth, type Rect } from '../core/layout';
import type { BanterLine } from '../content/chapter';
import { txt } from './widgets';

const LINE_MS = 2200;

/** 字級與底色（預設 19 號字、底色 0.55） */
export interface BanterStyle {
  size?: number;
  alpha?: number;
  /** 最多同時幾行：再來一句就把最舊的收掉、其餘往上推（最後一戰：第三句會疊到血條，Q26） */
  rows?: number;
}
const live = new WeakMap<Phaser.Scene, Phaser.GameObjects.GameObject[]>();

/**
 * 播一組互嗆（每句 LINE_MS 毫秒，一句一行往下排，最後一起淡出）。
 * maxW：字幕框最寬多少（從 x = 16 算起）。太長就縮小一號字、換行（夜審：不蓋到中間的立繪與光圈）；
 * 不給就和以前一樣一句一行。
 */
export function banter(scene: Phaser.Scene, lines: BanterLine[], y = 240, depth = 40, maxW?: number, style: BanterStyle = {}): void {
  const size = style.size ?? 19;
  for (const o of live.get(scene) ?? []) o.destroy();
  const objs: Phaser.GameObjects.GameObject[] = [];
  live.set(scene, objs);
  lines.forEach((l, i) => {
    scene.time.delayedCall(i * LINE_MS, () => {
      if (live.get(scene) !== objs) return;
      // 名字依五營上色，後面接著台詞
      let name = txt(scene, 10, 4, `${l.who}：`, size, WHO_COLOR[l.who] ?? 0xffd76a, { stroke: '#120a10', strokeThickness: 5 });
      let t = txt(scene, 10 + name.width, 4, l.text, size, 0xfbf3e2, { bold: false, stroke: '#120a10', strokeThickness: 5 });
      let bw = name.width + t.width + 20;
      let pad = 8;
      if (maxW !== undefined && bw > maxW) {
        // 太寬：整句（含名字）縮一號字換行，再把上色的名字疊在第一行開頭（同字型同粗細，剛好蓋住）。
        // 各行平均分（不會剩「嘛。」一兩個字孤零零一行）
        name.destroy();
        t.destroy();
        const st = { bold: false, stroke: '#120a10', strokeThickness: 4 };
        t = txt(scene, 10, 3, `${l.who}：${l.text}`, size - 2, 0xfbf3e2, st);
        const rows = Math.ceil(t.width / (maxW - 20));
        // 標點不放在行首：寬一點或窄一點再換一次
        const tt = t;
        const ww = wrapWidth(Math.min(maxW - 20, Math.ceil(t.width / rows) + size - 2), maxW - 20, size - 2, (w) => {
          tt.setWordWrapWidth(w, true);
          return tt.getWrappedText();
        });
        t.setWordWrapWidth(ww, true);
        name = txt(scene, 10, 3, `${l.who}：`, size - 2, WHO_COLOR[l.who] ?? 0xffd76a, st);
        bw = Math.min(maxW, t.width + 20);
        pad = 6;
      }
      const box = scene.add.rectangle(0, 0, bw, t.height + pad, 0x120a10, style.alpha ?? 0.55).setOrigin(0);
      // 照順序往下排（接在上一句下面），但要避開按鈕和上面幾句
      if (style.rows) {
        const shown = objs.filter((o) => (o as Phaser.GameObjects.Container).active) as Phaser.GameObjects.Container[];
        while (shown.length >= style.rows) shown.shift()!.destroy();
        let yy = y;
        for (const r of shown) {
          r.y = yy;
          yy += Math.max(34, r.height + 4);
        }
      }
      const prev = objs.filter((o) => (o as Phaser.GameObjects.Container).active).pop() as Phaser.GameObjects.Container | undefined;
      const want = prev ? prev.y + (maxW !== undefined || style.size ? Math.max(34, prev.height + 4) : 34) : y;
      const c = scene.add.container(W + 10, 0, [box, name, t]).setDepth(depth);
      c.setSize(box.width, box.height);
      c.y = freeY({ x: 16, w: c.width, h: c.height }, want, [...buttons(scene), ...lineRects(objs)], H);
      objs.push(c);
      scene.tweens.add({ targets: c, x: 16, duration: 260, ease: 'Cubic.out' });
    });
  });
  // 字幕顯示中才冒出來的按鈕：每 0.2 秒檢查一次，被蓋到的那句移開
  const watch = scene.time.addEvent({
    delay: 200, loop: true, callback: () => {
      if (live.get(scene) !== objs) { watch.remove(); return; }
      const btn = buttons(scene);
      objs.forEach((o, i) => {
        const c = o as Phaser.GameObjects.Container;
        if (!c.active) return;
        const others = lineRects(objs.filter((_, j) => j !== i));
        const y = freeY({ x: 16, w: c.width, h: c.height }, c.y, [...btn, ...others], H);
        if (y !== c.y) c.y = y;
      });
    },
  });
  scene.time.delayedCall(lines.length * LINE_MS + 1400, () => {
    if (live.get(scene) !== objs) return;
    scene.tweens.add({ targets: objs.filter((o) => o.active), alpha: 0, duration: 400, onComplete: () => { for (const o of objs) o.destroy(); } });
    live.delete(scene);
  });
}

/** 已經排好的字幕佔的位置（滑進來之前也算它最後停的 x = 16） */
function lineRects(objs: Phaser.GameObjects.GameObject[]): Rect[] {
  return objs.map((o) => o as Phaser.GameObjects.Container).filter((c) => c.active).map((c) => ({ x: 16, y: c.y, w: c.width, h: c.height }));
}

/** 場景裡看得到、可以點的東西（按鈕）的範圍；整片的點擊攔截層不算 */
function buttons(scene: Phaser.Scene): Rect[] {
  const out: Rect[] = [];
  const walk = (list: Phaser.GameObjects.GameObject[], shown: boolean) => {
    for (const o of list) {
      const v = o as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible & Phaser.GameObjects.Components.AlphaSingle;
      const vis = shown && v.visible !== false && (v.alpha ?? 1) > 0.05;
      if (o instanceof Phaser.GameObjects.Container) walk(o.list, vis);
      else if (vis && o.input?.enabled && 'getBounds' in o) {
        const b = (o as unknown as Phaser.GameObjects.Components.GetBounds).getBounds();
        if (b.width >= W * 0.9 && b.height >= H * 0.5) continue;
        out.push({ x: b.x, y: b.y, w: b.width, h: b.height });
      }
    }
  };
  walk(scene.children.list, true);
  return out;
}

/** 全寬字幕條的設定：bottom 字幕條下緣（貼在面板上緣上面）、side 說話的人站哪一邊 */
export interface StripOpts {
  bottom: number;
  side: (who: string) => 'left' | 'right';
  size: number;
  rowH: number;
  rows: number;
  depth?: number;
}

/**
 * 全寬字幕條（夜審；修正第 2 輪）：整條從 x = 16 拉到 W − 16，貼在下方面板上緣上面，最多疊 rows 行，
 * 新的一句從下面進來、舊的往上推，超過就把最舊的收掉（只蓋判官、鬼的腰部以下）。
 * 說話的人站左邊：字靠左、開頭「◀」；站右邊：字靠右、結尾「▶」；箭頭、名字和那一側的色條都用這個角色的顏色。
 */
export function banterStrip(scene: Phaser.Scene, lines: BanterLine[], o: StripOpts): void {
  for (const x of live.get(scene) ?? []) x.destroy();
  const objs: Phaser.GameObjects.GameObject[] = [];
  live.set(scene, objs);
  const x0 = 16;
  const bw = W - 32;
  const gap = 2;
  const slotY = (fromBottom: number) => o.bottom - (fromBottom + 1) * o.rowH - fromBottom * gap;
  lines.forEach((l, i) => {
    scene.time.delayedCall(i * LINE_MS, () => {
      if (live.get(scene) !== objs) return;
      const col = WHO_COLOR[l.who] ?? 0xffd76a;
      const right = o.side(l.who) === 'right';
      const st = { stroke: '#120a10', strokeThickness: 4 };
      const box = scene.add.rectangle(0, 0, bw, o.rowH, 0x120a10, 0.95).setOrigin(0);
      const bar = scene.add.rectangle(right ? bw - 6 : 0, 0, 6, o.rowH, col, 1).setOrigin(0);
      const arrow = txt(scene, 0, 0, right ? '▶' : '◀', o.size - 4, col, st);
      const name = txt(scene, 0, 0, `${l.who}：`, o.size, col, st);
      const t = txt(scene, 0, 0, l.text, o.size, 0xfbf3e2, { ...st, bold: false });
      // 太長：整句縮小到放得下（一行，不換行）
      const room = bw - 28 - arrow.width - 8;
      const k = Math.min(1, room / (name.width + t.width));
      if (k < 1) for (const g of [name, t]) g.setScale(k);
      const nw = name.displayWidth;
      const tw = t.displayWidth;
      const mid = (h: number) => (o.rowH - h) / 2;
      if (right) {
        arrow.setPosition(bw - 14 - arrow.width, mid(arrow.height));
        t.setPosition(arrow.x - 8 - tw, mid(t.displayHeight));
        name.setPosition(t.x - nw, mid(name.displayHeight));
      } else {
        arrow.setPosition(14, mid(arrow.height));
        name.setPosition(arrow.x + arrow.width + 8, mid(name.displayHeight));
        t.setPosition(name.x + nw, mid(t.displayHeight));
      }
      const c = scene.add.container(x0, slotY(0) + 12, [box, bar, arrow, name, t]).setDepth(o.depth ?? 40).setAlpha(0);
      c.setSize(bw, o.rowH);
      objs.push(c);
      // 最舊的收掉，其餘往上推一格
      const shown = objs.filter((x) => x.active) as Phaser.GameObjects.Container[];
      while (shown.length > o.rows) shown.shift()!.destroy();
      shown.forEach((r, j) => scene.tweens.add({ targets: r, y: slotY(shown.length - 1 - j), alpha: 1, duration: 220, ease: 'Cubic.out' }));
    });
  });
  scene.time.delayedCall(lines.length * LINE_MS + 1400, () => {
    if (live.get(scene) !== objs) return;
    scene.tweens.add({ targets: objs.filter((x) => x.active), alpha: 0, duration: 400, onComplete: () => { for (const x of objs) x.destroy(); } });
    live.delete(scene);
  });
}
