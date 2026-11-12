import Phaser from 'phaser';
import { loadPortraits } from '../art/portraits';
import { BATTLE_FILES, BG_FILES } from '../art/xinyingSpec';
import { STAGE_DIR, STAGE_FILES } from '../art/stageSpec';
import { CH4_BG_FILES, CH4_STAGE_FILES } from '../art/baishadunSpec';

/** 正式戰鬥圖先用這個暫時的名字載入，載完再換成正式的貼圖名稱 */
const TMP = 'art:';

/**
 * 背景載入立繪圖檔：遊戲一開就在背後載，不擋畫面。
 * 還沒載完的角色會先用程式畫的小人（portraitKey 找不到貼圖就回傳 undefined）。
 */
export class AssetScene extends Phaser.Scene {
  constructor() {
    super('assets');
  }

  preload(): void {
    this.load.on('loaderror', (f: Phaser.Loader.File) => console.warn('美術圖載入失敗（改用程式畫的）', f.key));
    // 每張圖載完都通知一聲（已經開著的場景可以換上正式圖，例如最後一戰的夜景）
    this.load.on('filecomplete', (key: string) => { if (!key.startsWith(TMP)) this.game.events.emit('artloaded', key); });
    loadPortraits(this);
    // 第三章的正式背景圖（沒載到就用程式畫的暫代美術）
    for (const k of BG_FILES) this.load.image(k, `bg/${k}.webp`);
    // 第三章的正式戰鬥圖：BootScene 已經用同樣的名字畫好暫代圖，所以先用暫時的名字載，載完再蓋掉
    // （檔案不在就什麼都不做，繼續用程式畫的）
    for (const k of BATTLE_FILES) {
      this.load.image(TMP + k, `battle/${k}.webp`);
      this.load.once(`filecomplete-image-${TMP}${k}`, () => this.replaceTexture(k));
    }
    // 第一、二章演出用小人（畫師的圖：public/stage/st_*.webp）：同一套做法，載到就蓋掉 art/stage.ts 畫的暫代
    // （立繪 A 組已經合進 portraits.ts 的 SETS，由 loadPortraits 載）
    for (const k of STAGE_FILES) {
      this.load.image(TMP + k, `${STAGE_DIR}/${k}.webp`);
      this.load.once(`filecomplete-image-${TMP}${k}`, () => this.replaceTexture(k));
    }
    // 第四章（art/baishadunSpec.ts）：演出小人與轎子同一套蓋掉暫代；背景圖有就用（Street 的 useArtImages）
    for (const k of CH4_STAGE_FILES) {
      this.load.image(TMP + k, `${STAGE_DIR}/${k}.webp`);
      this.load.once(`filecomplete-image-${TMP}${k}`, () => this.replaceTexture(k));
    }
    for (const k of CH4_BG_FILES) this.load.image(k, `bg/${k}.webp`);
  }

  /**
   * 把程式畫的 key 換成剛載好的正式圖；正在用舊圖的物件改指到新圖，顯示的高度不變（寬照新圖的比例），
   * 再通知場景（最後一戰每幀會依貼圖重新算縮放與錨點）。
   */
  private replaceTexture(key: string): void {
    const tm = this.textures;
    if (!tm.exists(TMP + key)) return;
    const users: Phaser.GameObjects.Image[] = [];
    for (const sc of this.game.scene.getScenes(false)) {
      sc.children?.each((o: Phaser.GameObjects.GameObject) => collect(o, key, users));
    }
    const heights = users.map((img) => img.displayHeight);
    if (tm.exists(key)) tm.remove(key);
    tm.renameTexture(TMP + key, key);
    users.forEach((img, i) => {
      const h = heights[i];
      img.setTexture(key);
      if (img.height > 0) img.setScale((h / img.height) * Math.sign(img.scaleX || 1), (h / img.height) * Math.sign(img.scaleY || 1));
    });
    this.game.events.emit('battleart', key);
  }
}

/** 找出（含容器裡的）正在用某張貼圖的圖片 */
function collect(o: Phaser.GameObjects.GameObject, key: string, out: Phaser.GameObjects.Image[]): void {
  if (o instanceof Phaser.GameObjects.Container) {
    for (const c of o.list) collect(c, key, out);
  } else if (o instanceof Phaser.GameObjects.Image && o.texture?.key === key) out.push(o);
}
