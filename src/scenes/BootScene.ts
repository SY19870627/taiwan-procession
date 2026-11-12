import Phaser from 'phaser';
import { makeFigures } from '../art/figures';
import { makeBackdropTextures, makeTemple } from '../art/backdrop';
import { makeHarbor } from '../art/harbor';
import { makeXinying } from '../art/xinying';
import { makeStageArt } from '../art/stage';
import { makeBaishadun } from '../art/baishadun';
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
    makeStageArt(this);
    // 第四章：四人小轎（粉紅遮雨布）、頭旗、香擔、香燈腳、點心站、牽路仔、拱辰宮的暫代
    makeBaishadun(this);
    // 立繪圖檔在背景載入
    this.scene.launch('assets');
    // 網址加 ?scene=night&n=2 可以直接跳到某個場景（測試用）
    const q = new URLSearchParams(location.search);
    // ?proto=stage&id=recall：原型的舊網址，現在等同 ?scene=story&id=recall（播正式演出，看完回標題）
    const jump = q.get('proto') === 'stage' ? 'story' : q.get('scene');
    if (jump) {
      const n = Number(q.get('n') ?? 1);
      // ?ch=dongjin 指定章節
      const ch = q.get('ch');
      if (ch) startChapter(ch);
      // ?scene=cut&kind=boss 看過場（depart／dusk／dawn／boss），看完回標題
      const kind = q.get('kind') ?? 'depart';
      // ?scene=story&id=recall：&text=1 強制播文字版、&beat=3 演出直接停在第 4 拍（截圖、驗收用）
      const beat = q.get('beat') !== null ? Math.max(0, Math.floor(Number(q.get('beat'))) || 0) : undefined;
      this.scene.start(jump, {
        day: n, night: n, id: q.get('id') ?? (jump === 'story' && q.get('proto') ? 'recall' : 'dusk3'), prologue: q.get('prologue') === '1', kind, title: kind, next: { key: 'title' },
        text: q.get('text') === '1', beat,
      });
      return;
    }
    this.scene.start('title');
  }
}
