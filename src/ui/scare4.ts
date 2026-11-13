/**
 * 第四章 jump scare 的畫面（全章 2 次；字、時間、觸發條件在 content/ch4/missed.ts）。
 *  - scareApo4：N1-4 點心擔阿婆（第一夜問歸處，判完回列表那一下；TrialScene）
 *  - scareTideng4：3-13 提燈的（mangdu4 起霧以後；StoryScene 文字版的 Line.pre）
 * 共同規則：畫面 < 2 秒；點一下或按任何鍵馬上跳過；只蓋一層畫面，不改任何狀態。
 * 沒有新圖：用角色現有的立繪／小人放大、換色。文件寫的「一聲短的鑼」：遊戲沒有音效系統，先不放。
 */
import Phaser from 'phaser';
import { H, W } from '../theme';
import { SCARE_APO4, SCARE_TIDENG4 } from '../content/ch4/missed';

const DEPTH = 950;

type Obj = Phaser.GameObjects.GameObject;
type Step = { at: number; run: () => void };

/** 蓋一層畫面、依時間播幾步；播完或被跳過都只呼叫一次 done（下一個 frame 才呼叫，跳過的那一下不會再被底下接到） */
function play(scene: Phaser.Scene, build: (add: <T extends Obj>(o: T) => T) => { steps: Step[]; total: number }, done: () => void): void {
  const objs: Obj[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let over = false;
  const add = <T extends Obj>(o: T): T => {
    objs.push(o);
    return o;
  };
  const end = (): void => {
    if (over) return;
    over = true;
    scene.input.keyboard?.off('keydown', end);
    for (const t of timers) t.remove();
    for (const o of objs) {
      scene.tweens.killTweensOf(o);
      o.destroy();
    }
    scene.time.delayedCall(1, done);
  };
  // 最上面一層吃掉點擊（點一下就跳過）
  const hit = add(scene.add.rectangle(0, 0, W, H, 0x000000, 0.001).setOrigin(0).setDepth(DEPTH + 50).setInteractive());
  hit.on('pointerup', end);
  scene.input.keyboard?.on('keydown', end);
  scene.events.once('shutdown', () => { over = true; scene.input.keyboard?.off('keydown', end); });
  const { steps, total } = build(add);
  for (const s of steps) timers.push(scene.time.delayedCall(s.at, () => { if (!over) s.run(); }));
  timers.push(scene.time.delayedCall(total, end));
}

/** 圖放大到高度 h（立繪或程式畫的小人都可以） */
const fitH = (img: Phaser.GameObjects.Image, h: number): number => h / img.height;

/**
 * N1-4：畫面先暗半拍 → 阿婆的大臉（偏白）佔滿畫面、震一下 → 半秒後退回正常大小、換成笑的表情、白色退掉
 * → 背景亮回來、後面的舊灶冒一點白煙。
 * face：嚇人那一下的圖；smile：退回去以後換的圖（沒有笑的立繪就同一張）
 */
export function scareApo4(scene: Phaser.Scene, face: string, smile: string, done: () => void): void {
  const T = SCARE_APO4;
  play(scene, (add) => {
    const dark = add(scene.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0).setDepth(DEPTH));
    scene.tweens.add({ targets: dark, fillAlpha: 0.85, duration: T.dark });
    const img = add(scene.add.image(W / 2, H / 2, face).setDepth(DEPTH + 1).setVisible(false).setTint(0xd8e4ec));
    // 偏白：同一張圖填白蓋在上面（不用新圖）
    const wash = add(scene.add.image(W / 2, H / 2, face).setDepth(DEPTH + 2).setVisible(false).setTintFill(0xf4f8fb).setAlpha(0.5));
    const big = fitH(img, H * 1.15);
    const t1 = T.dark;
    const t2 = t1 + T.face;
    const t3 = t2 + T.shrink;
    const steps: Step[] = [
      {
        at: t1, run: () => {
          for (const o of [img, wash]) o.setScale(big * 1.08).setVisible(true);
          scene.tweens.add({ targets: [img, wash], scale: big, duration: 90, ease: 'Back.out' });
          scene.cameras.main.shake(140, 0.012);
        },
      },
      {
        at: t2, run: () => {
          img.setTexture(smile).clearTint();
          wash.setTexture(smile);
          scene.tweens.add({ targets: [img, wash], scale: fitH(img, H * 0.42), y: H * 0.5, duration: T.shrink, ease: 'Cubic.out' });
          scene.tweens.add({ targets: wash, alpha: 0, duration: T.shrink });
        },
      },
      {
        at: t3, run: () => {
          scene.tweens.add({ targets: dark, fillAlpha: 0, duration: T.clear });
          scene.tweens.add({ targets: img, alpha: 0, duration: T.clear, ease: 'Quad.in' });
          // 後面的舊灶冒一點白煙（臉的左下）
          for (let i = 0; i < 4; i++) {
            const s = add(scene.add.image(W * 0.26 + i * 16, H * 0.5 + img.displayHeight * 0.42, 'smoke')
              .setDepth(DEPTH + 3).setTint(0xffffff).setAlpha(0.55).setScale(0.6 + i * 0.15));
            scene.tweens.add({ targets: s, y: s.y - 70 - i * 12, x: s.x + Phaser.Math.Between(-14, 14), alpha: 0, scale: s.scale * 1.8, duration: T.clear, delay: i * 40 });
          }
        },
      },
    ];
    return { steps, total: t3 + T.clear };
  }, done);
}

/**
 * 3-13：霧把畫面蓋到全暗 → 停一拍 →「啪」正中間亮起一盞燈，燈後面是提燈的臉、貼著鏡頭 → 他自己也嚇到往後縮
 * → 燈晃幾下 → 光暈慢慢散成堤防上那一排手機燈。
 * face：提燈的立繪或小人
 */
export function scareTideng4(scene: Phaser.Scene, face: string, done: () => void): void {
  const T = SCARE_TIDENG4;
  play(scene, (add) => {
    const fog = add(scene.add.rectangle(0, 0, W, H, 0x9a9aa8, 0).setOrigin(0).setDepth(DEPTH));
    const black = add(scene.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0).setDepth(DEPTH + 1));
    scene.tweens.add({ targets: fog, fillAlpha: 0.9, duration: T.fog });
    const cx = W / 2;
    const cy = H * 0.42;
    const glow = add(scene.add.circle(cx, cy + 40, 150, 0xffd27a, 0).setDepth(DEPTH + 2));
    const img = add(scene.add.image(cx, cy + H * 0.36, face).setOrigin(0.5, 1).setDepth(DEPTH + 3).setVisible(false).setTint(0xffe2a8));
    const lamp = add(scene.add.circle(cx, cy + 40, 26, 0xfff2c4, 1).setDepth(DEPTH + 4).setVisible(false));
    const near = fitH(img, H * 1.25);
    const t1 = T.fog;
    const t2 = t1 + T.black + T.beat;
    const t3 = t2 + T.snap;
    const t4 = t3 + T.flinch;
    const t5 = t4 + T.sway;
    const steps: Step[] = [
      { at: t1, run: () => scene.tweens.add({ targets: black, fillAlpha: 1, duration: T.black }) },
      {
        // 啪：燈亮、臉貼著鏡頭
        at: t2, run: () => {
          glow.setFillStyle(0xffd27a, 0.55);
          lamp.setVisible(true);
          img.setScale(near).setVisible(true);
          scene.cameras.main.flash(T.snap + 40, 255, 230, 170);
        },
      },
      // 他自己也嚇到往後縮
      { at: t3, run: () => scene.tweens.add({ targets: img, scale: near * 0.55, y: img.y - 30, duration: T.flinch, ease: 'Back.out' }) },
      {
        // 燈晃幾下
        at: t4, run: () => {
          scene.tweens.add({ targets: [lamp, glow], x: cx + 26, duration: T.sway / 4, yoyo: true, repeat: 1, ease: 'Sine.inOut' });
        },
      },
      {
        // 光暈散成堤防上一排手機燈
        at: t5, run: () => {
          scene.tweens.add({ targets: [img, lamp], alpha: 0, duration: T.fade * 0.6 });
          scene.tweens.add({ targets: glow, scaleX: 4, scaleY: 0.2, alpha: 0, duration: T.fade });
          scene.tweens.add({ targets: [black, fog], fillAlpha: 0, duration: T.fade, ease: 'Quad.in' });
          for (let i = 0; i < 14; i++) {
            const x = W * 0.08 + (i * W * 0.84) / 13 + Phaser.Math.Between(-8, 8);
            const d = add(scene.add.circle(cx, cy + 40, 5, 0xfdfbf0, 0.9).setDepth(DEPTH + 4));
            scene.tweens.add({ targets: d, x, y: H * 0.36 + Phaser.Math.Between(-6, 6), duration: T.fade * 0.7, ease: 'Cubic.out' });
            scene.tweens.add({ targets: d, alpha: 0, delay: T.fade * 0.6, duration: T.fade * 0.4 });
          }
        },
      },
    ];
    return { steps, total: t5 + T.fade };
  }, done);
}
