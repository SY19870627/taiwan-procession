import Phaser from 'phaser';
import { makeFigures } from '../art/figures';
import { makeBackdropTextures, makeTemple } from '../art/backdrop';
import { makeHarbor } from '../art/harbor';
import { startChapter } from '../content/chapter';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    makeFigures(this);
    makeBackdropTextures(this);
    makeTemple(this, 'temple_qingling', '青嶺宮');
    makeTemple(this, 'temple_zhuang', '福安宮');
    makeTemple(this, 'temple_huize', '惠澤宮');
    makeHarbor(this);
    // 網址加 ?scene=night&n=2 可以直接跳到某個場景（測試用）
    const q = new URLSearchParams(location.search);
    const jump = q.get('scene');
    if (jump) {
      const n = Number(q.get('n') ?? 1);
      // ?ch=dongjin 指定章節
      const ch = q.get('ch');
      if (ch) startChapter(ch);
      this.scene.start(jump, { day: n, night: n, id: q.get('id') ?? 'dusk3', prologue: q.get('prologue') === '1' });
      return;
    }
    this.scene.start('title');
  }
}
