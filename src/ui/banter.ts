/**
 * 互嗆小字幕（第三章）：一句一行，從畫面上方滑進來，幾秒後自己消失。
 * 不攔點擊、不暫停（大綱 §3：每句 1 行、不擋操作）。同一場景同時只顯示一組，新的一組會蓋掉舊的。
 * 也不蓋住按鈕：每句放在不和場景裡任何可點的東西重疊的高度；之後才冒出來的按鈕也會讓開（freeY）。
 */
import Phaser from 'phaser';
import { H, W } from '../theme';
import { freeY, type Rect } from '../core/layout';
import type { BanterLine } from '../content/chapter';
import { txt } from './widgets';

/** 說話的人名字的顏色（依五營） */
const WHO_COLOR: Record<string, number> = {
  太子: 0xffb347, 章將軍: 0x6fd39a, 霄將軍: 0xff7a6a, 柳將軍: 0xf2efe6, 廉將軍: 0xa8a8c8,
};

const LINE_MS = 2200;
const live = new WeakMap<Phaser.Scene, Phaser.GameObjects.GameObject[]>();

/** 播一組互嗆（每句 LINE_MS 毫秒，一句一行往下排，最後一起淡出） */
export function banter(scene: Phaser.Scene, lines: BanterLine[], y = 240, depth = 40): void {
  for (const o of live.get(scene) ?? []) o.destroy();
  const objs: Phaser.GameObjects.GameObject[] = [];
  live.set(scene, objs);
  lines.forEach((l, i) => {
    scene.time.delayedCall(i * LINE_MS, () => {
      if (live.get(scene) !== objs) return;
      // 名字依五營上色，後面接著台詞
      const name = txt(scene, 10, 4, `${l.who}：`, 19, WHO_COLOR[l.who] ?? 0xffd76a, { stroke: '#120a10', strokeThickness: 5 });
      const t = txt(scene, 10 + name.width, 4, l.text, 19, 0xfbf3e2, { bold: false, stroke: '#120a10', strokeThickness: 5 });
      const box = scene.add.rectangle(0, 0, name.width + t.width + 20, t.height + 8, 0x120a10, 0.55).setOrigin(0);
      // 照順序往下排（接在上一句下面），但要避開按鈕和上面幾句
      const prev = objs[objs.length - 1] as Phaser.GameObjects.Container | undefined;
      const want = prev ? prev.y + 34 : y;
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
    scene.tweens.add({ targets: objs, alpha: 0, duration: 400, onComplete: () => { for (const o of objs) o.destroy(); } });
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
