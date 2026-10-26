/**
 * 短過場（3～4 秒，點一下可跳過）：
 *  - depart：起駕。鑼鼓、鞭炮，隊伍從左邊走進畫面。
 *  - dusk：日落回廟升堂。天色變暗，燈籠一盞盞亮起，廟門打開。
 *  - dawn：雞啼天亮。天色由暗轉亮，太陽升起。
 *  - boss：石駒現身。山在震，紫色的煞氣裡走出一匹石馬。
 */
import Phaser from 'phaser';
import { C, H, W, lerpColor } from '../theme';
import { txt } from '../ui/widgets';
import { sfx } from '../audio/sfx';

export type CutKind = 'depart' | 'dusk' | 'dawn' | 'boss';

export interface CutData {
  kind: CutKind;
  title: string;
  sub?: string;
  next: { key: string; data?: object };
}

export class CutScene extends Phaser.Scene {
  private done = false;

  constructor() {
    super('cut');
  }

  create(data: CutData): void {
    this.done = false;
    this.cameras.main.fadeIn(300, 10, 8, 18);
    const G = Math.round(H * 0.62);
    const sky = this.add.graphics();
    const paintSky = (top: number, bottom: number) => {
      sky.clear();
      sky.fillGradientStyle(top, top, bottom, bottom, 1);
      sky.fillRect(0, 0, W, H);
    };
    const ground = () => {
      const g = this.add.graphics().setDepth(5);
      g.fillStyle(data.kind === 'boss' ? 0x1a1424 : 0x2a2632, 1);
      g.fillRect(0, G, W, H - G);
      g.lineStyle(1, 0x3a3444, 1);
      for (let y = G; y < H; y += 40) g.lineBetween(0, y, W, y);
    };
    const title = txt(this, W / 2, H * 0.2, data.title, 56, C.gold, { serif: true, stroke: '#2a0e0a', strokeThickness: 8 }).setOrigin(0.5).setDepth(50).setAlpha(0);
    const sub = txt(this, W / 2, H * 0.2 + 64, data.sub ?? '', 22, C.paper, { serif: true, stroke: '#1d1726', strokeThickness: 5 }).setOrigin(0.5).setDepth(50).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, y: title.y - 10, duration: 500, delay: 300 });
    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 700 });

    let len = 3600;
    if (data.kind === 'depart') {
      paintSky(0x8ec8f0, 0xf6e7c8);
      this.add.tileSprite(0, G - 40, W, 260, 'mtnFar').setOrigin(0, 1).setAlpha(0.7);
      for (let i = 0; i < 4; i++) this.add.image(i * 230 - 40, G + 4, `shop${(i * 3) % 8}`).setOrigin(0, 1);
      ground();
      // 隊伍從左邊走進來
      const line = this.add.container(-560, G + 90).setDepth(10);
      const keys: [string, number][] = [['paoshou', 0], ['lion', 90], ['bajiang0', 190], ['palanquin', 330], ['baye', 470], ['qiye', 520], ['flag1', 600]];
      for (const [k, x] of keys) line.add(this.add.image(x, 0, k).setOrigin(0.5, 1).setScale(0.75));
      this.tweens.add({ targets: line, x: 80, duration: 3000, ease: 'Sine.out' });
      this.tweens.add({ targets: line, y: line.y - 6, duration: 180, yoyo: true, repeat: 16 });
      // 鞭炮
      sfx.gong();
      for (let k = 0; k < 6; k++) {
        this.time.delayedCall(300 + k * 380, () => {
          sfx.firecracker();
          this.burst(Phaser.Math.Between(80, W - 80), G - Phaser.Math.Between(20, 140));
        });
      }
    }
    if (data.kind === 'dusk') {
      // 天色從黃昏到夜晚
      const t = { v: 0 };
      this.tweens.add({
        targets: t, v: 1, duration: 2400,
        onUpdate: () => paintSky(lerpColor(0xe88a4a, 0x0b0a1c, t.v), lerpColor(0xf6c08a, 0x231d40, t.v)),
      });
      paintSky(0xe88a4a, 0xf6c08a);
      this.add.tileSprite(0, G - 40, W, 260, 'mtnFarN').setOrigin(0, 1).setAlpha(0.8);
      const temple = this.add.image(W / 2, G + 6, 'temple_qingling').setOrigin(0.5, 1).setScale(0.78);
      this.time.delayedCall(1400, () => temple.setTint(0x8a7090));
      ground();
      // 燈籠一盞盞亮
      for (let i = 0; i < 6; i++) {
        const l = this.add.image(70 + i * 116, H * 0.36, 'lantern').setScale(0.8).setAlpha(0.15).setDepth(20);
        this.tweens.add({ targets: l, alpha: 1, duration: 200, delay: 900 + i * 220, onStart: () => i % 2 === 0 && sfx.bell(0.15) });
      }
      // 判官的身影
      const j1 = this.add.image(W / 2 - 150, G + 110, 'judge').setOrigin(0.5, 1).setScale(1.1).setAlpha(0).setDepth(12);
      const j2 = this.add.image(W / 2 + 150, G + 110, 'judge').setOrigin(0.5, 1).setScale(1.1).setFlipX(true).setTint(0x9a6a6a).setAlpha(0).setDepth(12);
      this.tweens.add({ targets: [j1, j2], alpha: 1, duration: 600, delay: 2200 });
      this.time.delayedCall(2300, () => sfx.drum(3));
      len = 3800;
    }
    if (data.kind === 'dawn') {
      const t = { v: 0 };
      this.tweens.add({
        targets: t, v: 1, duration: 2600,
        onUpdate: () => paintSky(lerpColor(0x0b0a1c, 0x8ec8f0, t.v), lerpColor(0x231d40, 0xf6d8a8, t.v)),
      });
      paintSky(0x0b0a1c, 0x231d40);
      const sun = this.add.circle(W * 0.7, G + 60, 60, 0xffd76a).setDepth(1);
      this.tweens.add({ targets: sun, y: G - 120, duration: 2600, ease: 'Sine.out' });
      this.add.tileSprite(0, G - 40, W, 260, 'mtnFar').setOrigin(0, 1).setAlpha(0.8).setDepth(2);
      this.add.image(W / 2, G + 6, 'temple_qingling').setOrigin(0.5, 1).setScale(0.7).setDepth(3);
      ground();
      this.time.delayedCall(900, () => sfx.rooster());
      this.time.delayedCall(1000, () => {
        const crow = txt(this, W * 0.22, G - 160, '喔——喔——', 30, 0xfff3c4, { serif: true, stroke: '#3a2a1a', strokeThickness: 5 }).setDepth(40);
        this.tweens.add({ targets: crow, y: crow.y - 40, alpha: 0, duration: 1600 });
      });
    }
    if (data.kind === 'boss') {
      paintSky(0x0a0614, 0x2e1446);
      const mtn = this.add.tileSprite(0, G + 10, W, 260, 'mtnFarN').setOrigin(0, 1).setAlpha(0.9);
      ground();
      const fog = this.add.circle(W / 2, G - 60, 200, 0x9b3cff, 0.0).setDepth(6);
      this.tweens.add({ targets: fog, fillAlpha: 0.35, scale: 1.3, duration: 1800 });
      const horse = this.add.image(W / 2, G + 120, 'shiju').setOrigin(0.5, 1).setScale(1.3).setAlpha(0).setDepth(8);
      this.tweens.add({ targets: horse, alpha: 1, y: G + 60, duration: 1600, delay: 600, ease: 'Cubic.out' });
      this.time.delayedCall(300, () => { this.cameras.main.shake(1400, 0.006); sfx.rumble(); });
      this.time.delayedCall(2000, () => { sfx.neigh(); this.cameras.main.flash(200, 160, 80, 255); });
      this.tweens.add({ targets: mtn, y: mtn.y + 4, duration: 80, yoyo: true, repeat: 12 });
      len = 3800;
    }

    txt(this, W / 2, H - 40, '點一下跳過', 16, C.muted, { bold: false }).setOrigin(0.5).setDepth(60).setAlpha(0.7);
    const finish = () => {
      if (this.done) return;
      this.done = true;
      this.cameras.main.fadeOut(350, 10, 8, 18);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(data.next.key, data.next.data));
    };
    this.input.once('pointerup', finish);
    this.time.delayedCall(len, finish);
  }

  private burst(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      const s = this.add.image(x, y, 'spark').setTint(Phaser.Math.RND.pick([0xff4a3a, 0xffd76a, 0xffffff])).setScale(Phaser.Math.FloatBetween(0.6, 1.4)).setDepth(30);
      this.tweens.add({ targets: s, x: x + Phaser.Math.Between(-90, 90), y: y + Phaser.Math.Between(-90, 60), alpha: 0, duration: 600, onComplete: () => s.destroy() });
    }
  }
}
