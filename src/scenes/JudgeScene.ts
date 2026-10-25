/**
 * 天亮：判官審判。昨夜捉到的小妖受審，供詞就是今晚的情報；超渡小妖得到香火。
 */
import Phaser from 'phaser';
import { C, H, W, GROUND_Y } from '../theme';
import { judge } from '../content/story';
import { Dialogue } from '../ui/dialogue';
import { run, applyDelta } from '../state';
import { button, go, panel, txt } from '../ui/widgets';

export class JudgeScene extends Phaser.Scene {
  constructor() {
    super('judge');
  }

  create(data: { night: number }): void {
    const n = data.night ?? 1;
    this.cameras.main.fadeIn(600, 10, 8, 18);
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x3a3a6a, 0x3a3a6a, 0xe8a070, 0xe8a070, 1);
    sky.fillRect(0, 0, W, H);
    this.add.tileSprite(0, GROUND_Y - 100, W, 260, 'mtnFar').setOrigin(0, 1).setTint(0x8a7a9a);
    const temple = n === 1 ? 'temple_qingling' : 'temple_zhuang';
    this.add.image(W / 2, GROUND_Y - 30, temple).setOrigin(0.5, 1).setScale(0.75).setTint(0xd8c0b0);
    const g = this.add.graphics();
    g.fillStyle(0x4a4252, 1);
    g.fillRect(0, GROUND_Y - 34, W, H);
    txt(this, 40, 30, `天亮・判官審判（第 ${n} 夜之後）`, 26, C.gold, { serif: true });

    // 被捉到的小妖跪成一排
    const kinds = ['wang', 'mei', 'kui'];
    const shown = Math.min(run.captured, 8);
    for (let i = 0; i < shown; i++) {
      const img = this.add.image(W * 0.5 + i * 64, GROUND_Y - 30, kinds[i % (n === 1 ? 2 : 3)]).setOrigin(0.5, 1).setScale(0.9);
      this.tweens.add({ targets: img, y: img.y - 4, duration: 300 + i * 40, yoyo: true, repeat: -1 });
    }

    const verdict = judge(n, run.captured);
    const unlocks = verdict.unlocks;
    Object.assign(run.intel, verdict.intel);
    new Dialogue(this, verdict.lines, () => this.summary(n, unlocks));
  }

  private summary(n: number, unlocks: string[]): void {
    const reward = run.captured * 4;
    applyDelta({ incense: reward, morale: 5 });
    run.captured = 0;
    const pw = 640;
    const ph = unlocks.length ? 380 : 300;
    const x = (W - pw) / 2;
    const y = 120;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.35).setOrigin(0).setDepth(960).setInteractive();
    panel(this, x, y, pw, ph).setDepth(961);
    txt(this, W / 2, y + 50, '超渡完畢', 36, C.gold, { serif: true }).setOrigin(0.5).setDepth(962);
    txt(this, W / 2, y + 120, `香火 +${reward}、士氣 +5\n現在：香火 ${run.incense}・信徒 ${run.followers}・士氣 ${run.morale}`, 24, C.paper, { bold: false, align: 'center', lineSpacing: 10 }).setOrigin(0.5).setDepth(962);
    if (unlocks.length) txt(this, W / 2, y + 205, unlocks.map((u) => `解鎖：${u}`).join('\n'), 20, 0x9fe8c0, { align: 'center', lineSpacing: 8 }).setOrigin(0.5, 0).setDepth(962);
    button(this, W / 2, y + ph - 55, 300, 70, `起駕・第 ${n + 1} 天`, () => go(this, 'almanac', { day: n + 1 }), { size: 28, fill: 0x8a1b14 }).setDepth(963);
  }
}
