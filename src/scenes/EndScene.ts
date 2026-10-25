/**
 * 結局：信徒錄。黃曆紙樣式，一人一欄寫出這三天之後每個人的結局。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { run } from '../state';
import { epitaphs } from '../content/believers';
import { button, go, txt } from '../ui/widgets';

const INK = 0x2a1a10;
const RED = 0xa3261c;

export class EndScene extends Phaser.Scene {
  rebuildable = true;

  constructor() {
    super('end');
  }

  create(): void {
    this.cameras.main.fadeIn(800, 10, 8, 18);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a1a14, 0x2a1a14, 0x120a08, 0x120a08, 1);
    bg.fillRect(0, 0, W, H);
    const pw = Math.min(W - 60, 1320);
    const ph = 610;
    const px = (W - pw) / 2;
    const py = 16;
    const g = this.add.graphics();
    g.fillStyle(0xeee0bd, 1);
    g.fillRect(px, py, pw, ph);
    const rnd = new Phaser.Math.RandomDataGenerator(['end']);
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0xc9a76a, rnd.realInRange(0.05, 0.12));
      g.fillEllipse(px + rnd.between(0, pw), py + rnd.between(0, ph), rnd.between(40, 180), rnd.between(20, 90));
    }
    g.lineStyle(4, RED, 0.85);
    g.strokeRect(px + 18, py + 18, pw - 36, ph - 36);

    txt(this, W / 2, py + 52, '信　徒　錄', 44, RED, { serif: true }).setOrigin(0.5);
    txt(this, W / 2, py + 98, '青嶺王暗訪・三日之後', 20, INK, { serif: true }).setOrigin(0.5);

    const list = epitaphs(run);
    const good = list.filter((e) => e.good).length;
    const rowH = 66;
    list.forEach((e, i) => {
      const y = py + 140 + i * rowH;
      txt(this, px + 70, y, e.who, 26, INK, { serif: true });
      txt(this, px + 270, y + 2, e.good ? '圓滿' : '遺憾', 20, 0xfbf3e2, { backgroundColor: e.good ? '#2f6f5a' : '#7a3a2a', padding: { x: 8, y: 3 } });
      txt(this, px + 360, y + 2, e.text, 22, INK, { serif: true, wordWrap: { width: pw - 440, useAdvancedWrap: true } });
    });
    const sy = py + 140 + list.length * rowH;
    const shiju = run.shijuEnraged ? '石駒歸隊。但腿上的傷，要很久才會好。' : '石駒歸隊。';
    txt(this, px + 70, sy, '石駒', 26, INK, { serif: true });
    txt(this, px + 360, sy + 2, shiju, 22, INK, { serif: true });
    txt(this, W / 2, py + ph - 52, `這三天，你照顧了 ${good} / ${list.length} 位信徒。`, 28, RED, { serif: true }).setOrigin(0.5);

    txt(this, 40, H - 50, `捉拿小妖 ${run.totalCaptured}・剩餘香火 ${run.incense}・信徒 ${run.followers}・重整再戰 ${run.retries} 次`, 18, C.muted, { bold: false }).setOrigin(0, 0.5);
    button(this, W - 170, H - 50, 260, 64, '再走一次', () => go(this, 'title'), { size: 26, fill: 0x8a1b14 });
  }
}
