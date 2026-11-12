/**
 * 試玩結束畫面（第四章試玩版：第一夜天亮之後）。ChapterDef.playableDays／sliceEnd 決定什麼時候播、寫什麼。
 * 有正式的下一天時（playableDays 拿掉或調大）就不會走到這裡。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { CH } from '../content/chapter';
import { run } from '../state';
import { button, fullscreenButton, go, panel, txt } from '../ui/widgets';

export class SliceEndScene extends Phaser.Scene {
  constructor() {
    super('sliceEnd');
  }

  create(): void {
    this.cameras.main.fadeIn(600, 10, 8, 18);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a1a24, 0x2a1a24, 0x120a10, 0x120a10, 1);
    bg.fillRect(0, 0, W, H);
    const ch = CH();
    const s = ch.sliceEnd ?? { title: `${ch.place}・試玩到這裡`, text: '待續。' };
    const x = 32;
    const y = 180;
    const pw = W - 64;
    const ph = H - 460;
    panel(this, x, y, pw, ph);
    // 轎子（暫代或畫師的圖），只是畫面，不能點
    if (this.textures.exists('st_jiao4_carry')) {
      const img = this.add.image(W / 2, y - 10, 'st_jiao4_carry').setOrigin(0.5, 1);
      img.setScale(Math.min(150 / img.height, (W - 120) / img.width));
    }
    txt(this, W / 2, y + 40, s.title, 34, C.gold, { serif: true }).setOrigin(0.5, 0);
    const lines = [s.text];
    const f = run.follow;
    if (f) {
      const film = f.broadcast[1];
      lines.push('', `今天跟轎台拍到：${film ? ch.days[1]?.broadcast?.find((b) => b.id === film)?.label ?? film : '（還沒選）'}`);
      lines.push(`頭旗下跟著走的：${run.held.length}／${run.slots} 格`);
      if (f.strayed) lines.push(`沒跟上的人：${f.strayed} 位`);
    }
    txt(this, x + 32, y + 110, lines.join('\n'), 23, C.paper, { bold: false, lineSpacing: 10, wordWrap: { width: pw - 64, useAdvancedWrap: true } });
    button(this, W / 2, H - 200, 300, 76, '回出巡圖', () => go(this, 'chapters'), { size: 28, fill: 0x8a1b14 });
    button(this, W / 2, H - 110, 300, 64, '回標題', () => go(this, 'title'), { size: 24, fill: 0x3a3442 });
    fullscreenButton(this);
  }
}
