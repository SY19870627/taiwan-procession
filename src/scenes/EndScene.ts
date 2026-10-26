/**
 * 結局：信徒錄。黃曆紙樣式，一人一欄寫出這三天之後每個人的結局。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { run } from '../state';
import { epitaphs, ghostEpitaphs, shijuEpitaph } from '../content/believers';
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
    // 直式：一整頁信徒錄，一人兩行（名字＋結局）
    const pw = W - 32;
    const ph = H - 190;
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

    txt(this, W / 2, py + 64, '信　徒　錄', 48, RED, { serif: true }).setOrigin(0.5);
    txt(this, W / 2, py + 114, '青嶺王暗訪・三日之後', 20, INK, { serif: true }).setOrigin(0.5);

    const list = epitaphs(run);
    const ghosts = ghostEpitaphs(run);
    const good = list.filter((e) => e.good).length;
    const eased = ghosts.filter((e) => e.good).length;
    let y = py + 150;
    // 一人兩行：名字＋結局（字小一點，十個人才放得下）
    const row = (who: string, good: boolean, text: string) => {
      txt(this, px + 44, y, who, 22, INK, { serif: true });
      txt(this, px + pw - 44, y + 2, good ? '圓滿' : '遺憾', 16, 0xfbf3e2, { backgroundColor: good ? '#2f6f5a' : '#7a3a2a', padding: { x: 6, y: 2 } }).setOrigin(1, 0);
      const t = txt(this, px + 44, y + 32, text, 18, INK, { serif: true, lineSpacing: 4, wordWrap: { width: pw - 88, useAdvancedWrap: true } });
      y = t.y + t.height + 16;
    };
    const head = (s: string) => {
      txt(this, px + 44, y, s, 18, RED, { serif: true });
      y += 30;
    };
    head('【信徒】');
    for (const e of list) row(e.who, e.good, e.text);
    head('【鬼】');
    for (const e of ghosts) row(e.who, e.good, e.text);
    const sj = shijuEpitaph(run);
    row(sj.who, sj.good, sj.text);
    txt(this, W / 2, py + ph - 56, `照顧了 ${good}／${list.length} 位信徒・化解了 ${eased}／${ghosts.length} 個鬼`, 24, RED, { serif: true }).setOrigin(0.5);

    txt(this, W / 2, H - 150, `戾氣 ${run.liqi}・剩餘香火 ${run.incense}・信徒 ${run.followers}・重整再戰 ${run.retries} 次`, 17, C.muted, { bold: false }).setOrigin(0.5);
    button(this, W / 2, H - 70, 300, 80, '再走一次', () => go(this, 'title'), { size: 30, fill: 0x8a1b14 });
  }
}
