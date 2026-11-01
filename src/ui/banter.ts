/**
 * 互嗆小字幕（第三章）：一句一行，從畫面上方滑進來，幾秒後自己消失。
 * 不攔點擊、不暫停（大綱 §3：每句 1 行、不擋操作）。同一場景同時只顯示一組，新的一組會蓋掉舊的。
 */
import Phaser from 'phaser';
import { W } from '../theme';
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
      const c = scene.add.container(W + 10, y + i * 34, [box, name, t]).setDepth(depth);
      objs.push(c);
      scene.tweens.add({ targets: c, x: 16, duration: 260, ease: 'Cubic.out' });
    });
  });
  scene.time.delayedCall(lines.length * LINE_MS + 1400, () => {
    if (live.get(scene) !== objs) return;
    scene.tweens.add({ targets: objs, alpha: 0, duration: 400, onComplete: () => { for (const o of objs) o.destroy(); } });
    live.delete(scene);
  });
}
