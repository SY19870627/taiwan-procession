import Phaser from 'phaser';
import { C, H, W, GROUND_Y } from '../theme';
import { button, fullscreenButton, go, txt } from '../ui/widgets';
import { resetRun } from '../state';

export class TitleScene extends Phaser.Scene {
  rebuildable = true;

  constructor() {
    super('title');
  }

  create(): void {
    this.cameras.main.fadeIn(500, 10, 8, 18);
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0b0a1c, 0x0b0a1c, 0x2a1d44, 0x2a1d44, 1);
    sky.fillRect(0, 0, W, H);
    // 月亮
    this.add.circle(W * 0.82, 120, 46, 0xfff3c4, 0.9);
    this.add.circle(W * 0.82, 120, 80, 0xfff3c4, 0.08);
    this.add.tileSprite(0, GROUND_Y - 70, W, 260, 'mtnFarN').setOrigin(0, 1);
    // 廟
    this.add.image(W / 2, GROUND_Y + 10, 'temple_qingling').setOrigin(0.5, 1).setScale(0.78).setTint(0x8a7090);
    const ground = this.add.graphics();
    ground.fillStyle(0x1a1622, 1);
    ground.fillRect(0, GROUND_Y + 8, W, H - GROUND_Y);
    ground.lineStyle(1, 0x2a2434, 1);
    for (let x = 0; x < W; x += 60) ground.lineBetween(x, GROUND_Y + 8, x - 40, H);
    // 燈籠串
    for (let i = 0; i < Math.ceil(W / 110); i++) {
      const lx = 40 + i * 110;
      if (Math.abs(lx - W / 2) < 340) continue;
      const l = this.add.image(lx, 70 + Math.sin(i) * 10, 'lantern').setScale(0.8);
      this.tweens.add({ targets: l, angle: { from: -4, to: 4 }, duration: 1600 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // 神轎與神光
    const glow = this.add.circle(W / 2, GROUND_Y - 120, 120, 0xffd76a, 0.12);
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.2, duration: 1800, yoyo: true, repeat: -1 });
    this.add.image(W / 2, GROUND_Y + 30, 'palanquin').setOrigin(0.5, 1).setScale(0.9);
    this.add.image(W / 2 - 220, GROUND_Y + 30, 'qiye').setOrigin(0.5, 1).setScale(0.85);
    this.add.image(W / 2 - 160, GROUND_Y + 30, 'baye').setOrigin(0.5, 1).setScale(0.85);
    this.add.image(W / 2 + 200, GROUND_Y + 30, 'flag3').setOrigin(0.5, 1).setScale(0.85);
    this.add.image(W / 2 + 260, GROUND_Y + 30, 'flag1').setOrigin(0.5, 1).setScale(0.85);
    // 靈界霧氣
    for (let i = 0; i < 10; i++) {
      const s = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(GROUND_Y - 60, H), 'smoke').setTint(0x9b7cff).setAlpha(0.12).setScale(Phaser.Math.FloatBetween(2, 4));
      this.tweens.add({ targets: s, x: s.x + 120, alpha: 0.03, duration: 5000 + i * 400, yoyo: true, repeat: -1 });
    }
    // 標題
    const title = txt(this, W / 2, 104, '遶　境', 110, C.gold, { serif: true, stroke: '#3a0e0a', strokeThickness: 10 }).setOrigin(0.5);
    title.setShadow(0, 6, '#000000', 12, true, true);
    txt(this, W / 2, 186, '青嶺王暗訪・原型試玩', 30, C.paper, { serif: true }).setOrigin(0.5);
    txt(this, W / 2, 226, '白天祈福，晚上斬妖。凡人什麼都看不見。', 22, C.muted, { bold: false }).setOrigin(0.5);
    button(this, W / 2, H - 70, 260, 76, '起　駕', () => {
      resetRun();
      go(this, 'almanac', { prologue: true });
    }, { size: 34, fill: 0x8a1b14 });
    fullscreenButton(this);
  }
}
