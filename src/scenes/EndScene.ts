import Phaser from 'phaser';
import { C, H, W, GROUND_Y } from '../theme';
import { run } from '../state';
import { button, go, panel, txt } from '../ui/widgets';

/** 原型結局：石駒歸隊 */
export class EndScene extends Phaser.Scene {
  rebuildable = true;

  constructor() {
    super('end');
  }

  create(): void {
    this.cameras.main.fadeIn(800, 10, 8, 18);
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x6fb6ea, 0x6fb6ea, 0xf6e2c0, 0xf6e2c0, 1);
    sky.fillRect(0, 0, W, H);
    this.add.tileSprite(0, GROUND_Y - 60, W, 260, 'mtnFar').setOrigin(0, 1);
    this.add.tileSprite(0, GROUND_Y - 40, W, 220, 'mtnNear').setOrigin(0, 1);
    this.add.image(W * 0.86, GROUND_Y - 20, 'temple_huize').setOrigin(0.5, 1).setScale(0.45);
    const g = this.add.graphics();
    g.fillStyle(0xb8ab94, 1);
    g.fillRect(0, GROUND_Y - 24, W, H);
    const horse = this.add.image(W * 0.18, GROUND_Y + 40, 'shiju_calm').setOrigin(0.5, 1).setScale(1.2);
    this.tweens.add({ targets: horse, y: horse.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.image(W * 0.18 + 200, GROUND_Y + 40, 'palanquin').setOrigin(0.5, 1).setScale(0.8);

    txt(this, W / 2, 80, '石駒歸隊', 72, C.red, { serif: true, stroke: '#fbf3e2', strokeThickness: 8 }).setOrigin(0.5);
    txt(this, W / 2, 150, '青嶺王暗訪・原型試玩完成', 28, 0x3a2a20, { serif: true }).setOrigin(0.5);
    const lines = [
      `三夜共捉拿小妖　${run.totalCaptured} 名`,
      `剩餘香火　${run.incense}　　信徒　${run.followers} 人`,
      `重整再戰　${run.retries} 次`,
      run.allied ? '與惠澤宮結為交陪' : '未與惠澤宮會香',
    ];
    panel(this, W / 2 - 300, 180, 600, 210, 0xfbf3e2, 0.9);
    txt(this, W / 2, 200, lines.join('\n'), 26, 0x2a2018, { lineSpacing: 12, align: 'center' }).setOrigin(0.5, 0);
    txt(this, W * 0.62, H - 160, '封印崩壞才剛開始。下一段路，往南。', 24, 0x5a3a20, { serif: true }).setOrigin(0.5);
    button(this, W / 2, H - 70, 280, 72, '再玩一次', () => go(this, 'title'), { size: 28, fill: 0x8a1b14 });
  }
}
