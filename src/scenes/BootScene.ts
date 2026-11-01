import Phaser from 'phaser';
import { makeFigures } from '../art/figures';
import { makeBackdropTextures, makeTemple } from '../art/backdrop';
import { makeHarbor } from '../art/harbor';
import { makeXinying } from '../art/xinying';
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
    makeXinying(this);
    // 立繪圖檔在背景載入
    this.scene.launch('assets');
    // 網址加 ?scene=night&n=2 可以直接跳到某個場景（測試用）
    const q = new URLSearchParams(location.search);
    const jump = q.get('scene');
    if (jump) {
      const n = Number(q.get('n') ?? 1);
      // ?ch=dongjin 指定章節
      const ch = q.get('ch');
      if (ch) startChapter(ch);
      // ?scene=cut&kind=boss 看過場（depart／dusk／dawn／boss），看完回標題
      const kind = q.get('kind') ?? 'depart';
      this.scene.start(jump, { day: n, night: n, id: q.get('id') ?? 'dusk3', prologue: q.get('prologue') === '1', kind, title: kind, next: { key: 'title' } });
      return;
    }
    this.scene.start('title');
  }
}
