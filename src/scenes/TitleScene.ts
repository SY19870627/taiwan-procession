import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { button, fullscreenButton, go, txt } from '../ui/widgets';
import { resetRun } from '../state';

export class TitleScene extends Phaser.Scene {
  rebuildable = true;

  constructor() {
    super('title');
  }

  create(): void {
    this.cameras.main.fadeIn(500, 10, 8, 18);
    // 直式構圖：上方標題、中間廟與神轎、下方起駕
    const G = Math.round(H * 0.64);
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0b0a1c, 0x0b0a1c, 0x2a1d44, 0x2a1d44, 1);
    sky.fillRect(0, 0, W, H);
    // 月亮
    this.add.circle(W * 0.8, 420, 46, 0xfff3c4, 0.9);
    this.add.circle(W * 0.8, 420, 80, 0xfff3c4, 0.08);
    this.add.tileSprite(0, G - 70, W, 260, 'mtnFarN').setOrigin(0, 1);
    // 廟
    this.add.image(W / 2, G + 10, 'temple_qingling').setOrigin(0.5, 1).setScale(0.72).setTint(0x8a7090);
    const ground = this.add.graphics();
    ground.fillStyle(0x1a1622, 1);
    ground.fillRect(0, G + 8, W, H - G);
    ground.lineStyle(1, 0x2a2434, 1);
    for (let x = -200; x < W + 200; x += 60) ground.lineBetween(x, G + 8, x + (x - W / 2) * 0.5, H);
    // 燈籠串
    for (let i = 0; i < 7; i++) {
      const lx = 50 + i * 103;
      const l = this.add.image(lx, 330 + Math.sin(i) * 10, 'lantern').setScale(0.7);
      this.tweens.add({ targets: l, angle: { from: -4, to: 4 }, duration: 1600 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // 神轎與神光
    const glow = this.add.circle(W / 2, G - 100, 120, 0xffd76a, 0.12);
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.2, duration: 1800, yoyo: true, repeat: -1 });
    this.add.image(W / 2, G + 90, 'palanquin').setOrigin(0.5, 1).setScale(0.9);
    this.add.image(W / 2 - 230, G + 110, 'qiye').setOrigin(0.5, 1).setScale(0.85);
    this.add.image(W / 2 - 160, G + 100, 'baye').setOrigin(0.5, 1).setScale(0.85);
    this.add.image(W / 2 + 170, G + 100, 'flag3').setOrigin(0.5, 1).setScale(0.85);
    this.add.image(W / 2 + 240, G + 110, 'flag1').setOrigin(0.5, 1).setScale(0.85);
    // 靈界霧氣
    for (let i = 0; i < 10; i++) {
      const s = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(G - 60, H - 160), 'smoke').setTint(0x9b7cff).setAlpha(0.12).setScale(Phaser.Math.FloatBetween(2, 4));
      this.tweens.add({ targets: s, x: s.x + 120, alpha: 0.03, duration: 5000 + i * 400, yoyo: true, repeat: -1 });
    }
    // 標題
    const title = txt(this, W / 2, 150, '遶　境', 120, C.gold, { serif: true, stroke: '#3a0e0a', strokeThickness: 10 }).setOrigin(0.5);
    title.setShadow(0, 6, '#000000', 12, true, true);
    txt(this, W / 2, 238, '青嶺王暗訪・原型試玩', 30, C.paper, { serif: true }).setOrigin(0.5);
    txt(this, W / 2, 280, '白天祈福，晚上斬妖。凡人什麼都看不見。', 22, C.muted, { bold: false }).setOrigin(0.5);
    button(this, W / 2, H - 110, 300, 90, '起　駕', () => {
      resetRun();
      go(this, 'almanac', { prologue: true });
    }, { size: 38, fill: 0x8a1b14 });
    fullscreenButton(this);
  }
}
