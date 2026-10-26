/**
 * 短過場（3～4 秒，點一下可跳過）：
 *  - depart：起駕。鑼鼓、鞭炮，隊伍從左邊走進畫面。
 *  - dusk：日落回廟升堂。天色變暗，燈籠一盞盞亮起，廟門打開。
 *  - dawn：雞啼天亮。天色由暗轉亮，太陽升起。
 *  - boss：魔王現身（石駒：山在震，紫色煞氣裡走出石馬；黑潮：海面隆起，浪裡浮出人臉）。
 * 第二章在漁港：遠景換成海和漁船，廟換成代天府。
 */
import Phaser from 'phaser';
import { C, H, W, lerpColor } from '../theme';
import { txt } from '../ui/widgets';
import { CH } from '../content/chapter';

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
    const harbor = CH().look === 'harbor';
    const far = (night: boolean, y = G - 40) => harbor
      ? this.add.tileSprite(0, y + 10, W, 200, night ? 'seaFarN' : 'seaFar').setOrigin(0, 1)
      : this.add.tileSprite(0, y, W, 260, night ? 'mtnFarN' : 'mtnFar').setOrigin(0, 1);
    if (data.kind === 'depart') {
      paintSky(0x8ec8f0, 0xf6e7c8);
      far(false).setAlpha(0.8);
      for (let i = 0; i < 4; i++) this.add.image(i * 230 - 40, G + 4, harbor ? `hshop${(i * 3) % 8}` : `shop${(i * 3) % 8}`).setOrigin(0, 1);
      ground();
      // 隊伍從左邊走進來（用這一章白天的隊伍）
      const line = this.add.container(-560, G + 90).setDepth(10);
      const band = CH().band(1);
      const minX = Math.min(...band.map((b) => b[1]));
      const maxX = Math.max(...band.map((b) => b[1]));
      for (const [k, x, sc] of band) line.add(this.add.image(((x - minX) / (maxX - minX)) * 600, 0, k).setOrigin(0.5, 1).setScale(sc * 1.04));
      this.tweens.add({ targets: line, x: 80, duration: 3000, ease: 'Sine.out' });
      this.tweens.add({ targets: line, y: line.y - 6, duration: 180, yoyo: true, repeat: 16 });
      // 鞭炮
      for (let k = 0; k < 6; k++) {
        this.time.delayedCall(300 + k * 380, () => {
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
      far(true).setAlpha(0.8);
      const temple = this.add.image(W / 2, G + 6, CH().temple).setOrigin(0.5, 1).setScale(0.78);
      this.time.delayedCall(1400, () => temple.setTint(0x8a7090));
      ground();
      // 燈籠一盞盞亮
      for (let i = 0; i < 6; i++) {
        const l = this.add.image(70 + i * 116, H * 0.36, 'lantern').setScale(0.8).setAlpha(0.15).setDepth(20);
        this.tweens.add({ targets: l, alpha: 1, duration: 200, delay: 900 + i * 220 });
      }
      // 判官（中軍府）的身影
      const [o1, o2] = CH().trial.officers;
      const j1 = this.add.image(W / 2 - 150, G + 110, o1.tex).setOrigin(0.5, 1).setScale(1.1).setAlpha(0).setDepth(12);
      const j2 = this.add.image(W / 2 + 150, G + 110, o2.tex).setOrigin(0.5, 1).setScale(1.1).setFlipX(true).setAlpha(0).setDepth(12);
      if (o1.tint) j1.setTint(o1.tint);
      if (o2.tint) j2.setTint(o2.tint);
      this.tweens.add({ targets: [j1, j2], alpha: 1, duration: 600, delay: 2200 });
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
      far(false).setAlpha(0.8).setDepth(2);
      this.add.image(W / 2, G + 6, CH().temple).setOrigin(0.5, 1).setScale(0.7).setDepth(3);
      ground();
      this.time.delayedCall(1000, () => {
        const crow = txt(this, W * 0.22, G - 160, '喔——喔——', 30, 0xfff3c4, { serif: true, stroke: '#3a2a1a', strokeThickness: 5 }).setDepth(40);
        this.tweens.add({ targets: crow, y: crow.y - 40, alpha: 0, duration: 1600 });
      });
    }
    if (data.kind === 'boss' && harbor) {
      // 黑潮現身：海面隆起，浪裡浮出人臉；沙灘上是王船
      paintSky(0x050816, 0x1a1640);
      const sea = this.add.graphics().setDepth(2);
      sea.fillStyle(0x0a1028, 1);
      sea.fillRect(0, G - 120, W, 140);
      const sand = this.add.graphics().setDepth(5);
      sand.fillStyle(0x2a2630, 1);
      sand.fillRect(0, G, W, H - G);
      this.add.image(W * 0.24, G + 40, 'wangchuan').setOrigin(0.5, 1).setScale(0.9).setTint(0x8a7aa0).setDepth(9);
      const tide = this.add.image(W * 0.72, G + 160, 'heichao').setOrigin(0.5, 1).setScale(0.8).setAlpha(0).setDepth(8);
      this.tweens.add({ targets: tide, alpha: 1, y: G + 30, scale: 1.1, duration: 2000, delay: 400, ease: 'Cubic.out' });
      this.time.delayedCall(300, () => { this.cameras.main.shake(1600, 0.005); });
      this.time.delayedCall(2200, () => { this.cameras.main.flash(200, 80, 120, 200); });
      len = 3800;
    } else if (data.kind === 'boss') {
      paintSky(0x0a0614, 0x2e1446);
      const mtn = this.add.tileSprite(0, G + 10, W, 260, 'mtnFarN').setOrigin(0, 1).setAlpha(0.9);
      ground();
      const fog = this.add.circle(W / 2, G - 60, 200, 0x9b3cff, 0.0).setDepth(6);
      this.tweens.add({ targets: fog, fillAlpha: 0.35, scale: 1.3, duration: 1800 });
      const horse = this.add.image(W / 2, G + 120, 'shiju').setOrigin(0.5, 1).setScale(1.3).setAlpha(0).setDepth(8);
      this.tweens.add({ targets: horse, alpha: 1, y: G + 60, duration: 1600, delay: 600, ease: 'Cubic.out' });
      this.time.delayedCall(300, () => { this.cameras.main.shake(1400, 0.006); });
      this.time.delayedCall(2000, () => { this.cameras.main.flash(200, 160, 80, 255); });
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
