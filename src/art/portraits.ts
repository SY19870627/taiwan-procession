/**
 * 角色立繪（AI 繪圖、手繪風）：有圖用圖，沒圖用程式畫的小人。
 *
 * 原圖在本機「圖片需求/立繪/」，經 tools/portraits.py 去背、統一成 420×560 的 webp，放在 public/portraits/。
 * 每張圖底部對齊、角色朝右（阿秀嬸原圖朝左，處理時已翻轉）。
 *
 * 表情：normal 平常、sad 難過、angry 生氣、surprised 驚訝、smile 開心、relieved 釋懷。
 * 劇本裡在「」的開頭加 {sad} 這樣的標記，就會換成那個表情（見 ui/talk.ts 的 splitStory）。
 */
import Phaser from 'phaser';

export type Expr = 'normal' | 'sad' | 'angry' | 'surprised' | 'smile' | 'relieved';

/** 已經有圖的角色與表情（新增圖片時更新這裡） */
const SETS: Record<string, Expr[]> = {
  xiaoyun: ['normal', 'sad', 'surprised', 'smile'],
  axiu: ['normal', 'sad', 'surprised', 'smile'],
  azhe: ['normal', 'sad', 'angry', 'surprised'],
  agui: ['normal', 'sad', 'angry', 'surprised', 'relieved'],
  abiao: ['normal', 'sad', 'angry', 'surprised', 'relieved'],
  atian: ['normal', 'sad', 'angry', 'relieved'],
  afu: ['normal', 'sad', 'surprised', 'relieved'],
};

/** 遊戲裡的稱呼（人名、鬼的真名、案子代號）→ 立繪代號 */
const ALIAS: Record<string, string> = {
  小芸: 'xiaoyun',
  阿秀嬸: 'axiu',
  阿秀嬸與阿弟: 'axiu',
  阿哲: 'azhe',
  阿桂: 'agui', gui: 'agui', 護嬰娘阿桂: 'agui',
  阿標: 'abiao', biao: 'abiao', 前鋒阿標: 'abiao',
  阿添公: 'atian', tian: 'atian', 冰水伯阿添: 'atian',
  阿福: 'afu', fu: 'afu',
};

/** 表情沒有圖時，用哪一個代替 */
const FALLBACK: Record<Expr, Expr[]> = {
  normal: [],
  sad: [],
  angry: ['sad'],
  surprised: [],
  smile: ['relieved'],
  relieved: ['smile'],
};

const key = (id: string, e: Expr) => `pt_${id}_${e}`;

/** BootScene.preload 呼叫：把所有立繪排進載入佇列 */
export function loadPortraits(scene: Phaser.Scene): void {
  const base = import.meta.env.BASE_URL;
  for (const [id, exprs] of Object.entries(SETS)) {
    for (const e of exprs) scene.load.image(key(id, e), `${base}portraits/${id}_${e}.webp`);
  }
}

/** 這個人／鬼有沒有立繪 */
export function hasPortrait(who: string | undefined): boolean {
  return !!who && !!ALIAS[who];
}

/** 取得立繪貼圖；沒有這個人的立繪就回傳 undefined（改用程式畫的小人） */
export function portraitKey(scene: Phaser.Scene, who: string | undefined, expr: Expr = 'normal'): string | undefined {
  const id = who ? ALIAS[who] : undefined;
  if (!id) return undefined;
  for (const e of [expr, ...FALLBACK[expr], 'normal' as Expr]) {
    const k = key(id, e);
    if (SETS[id].includes(e) && scene.textures.exists(k)) return k;
  }
  return undefined;
}

/** 小頭像的裁切起點（相對立繪寬、高的比例），由 tools 依臉的位置算出 */
const THUMB: Record<string, [number, number]> = {
  xiaoyun: [0.149, 0.007], axiu: [0.21, 0], azhe: [0.118, 0.001], agui: [0.192, 0.001],
  abiao: [0.281, 0.001], atian: [0.216, 0.009], afu: [0.155, 0.016],
};

/**
 * 小頭像：從立繪上半身裁一塊正方形（臉和肩膀），縮到 size 大小。
 * 回傳的圖 origin 在左上角，畫在 (x, y)。
 */
export function portraitThumb(scene: Phaser.Scene, k: string, x: number, y: number, size: number): Phaser.GameObjects.Image {
  const img = scene.add.image(0, 0, k).setOrigin(0, 0);
  const id = k.replace(/^pt_/, '').replace(/_[a-z]+$/, '');
  const [fx, fy] = THUMB[id] ?? [0.2, 0];
  const w = img.width;
  const cw = w * 0.6;
  const cx = w * fx;
  const cy = img.height * fy;
  img.setCrop(cx, cy, cw, cw);
  const sc = size / cw;
  img.setScale(sc);
  img.setPosition(x - cx * sc, y - cy * sc);
  return img;
}
