import Phaser from 'phaser';
import { loadPortraits } from '../art/portraits';

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
  }
}
