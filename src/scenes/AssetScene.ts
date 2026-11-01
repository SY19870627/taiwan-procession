import Phaser from 'phaser';
import { loadPortraits } from '../art/portraits';
import { BG_FILES } from '../art/xinyingSpec';

/**
 * 背景載入立繪圖檔：遊戲一開就在背後載，不擋畫面。
 * 還沒載完的角色會先用程式畫的小人（portraitKey 找不到貼圖就回傳 undefined）。
 */
export class AssetScene extends Phaser.Scene {
  constructor() {
    super('assets');
  }

  preload(): void {
    this.load.on('loaderror', (f: Phaser.Loader.File) => console.warn('立繪載入失敗', f.key));
    loadPortraits(this);
    // 第三章的正式背景圖（有放進 public/bg/ 才會列在 BG_FILES；沒有就用程式畫的暫代美術）
    for (const k of BG_FILES) this.load.image(k, `bg/${k}.webp`);
  }
}
