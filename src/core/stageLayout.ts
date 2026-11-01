/**
 * 引擎內演出的版面（純函式，可以單元測試；播放器在 ui/stage.ts）。
 *
 * 手機直式畫面比較高（最高 1560）：地平線往下、演員放大（以 1280 高為 1，上限 STAGE_MAX_K），
 * 演員腳底下面畫前景，畫面下 40% 是字幕區；泡泡掛在說話者頭上，不超出畫面、不蓋左上地名與右上略過鈕。
 */
import { BASE_H, W } from '../theme';
import { STAGE_SIZES } from '../art/stageSpec';

/** 演員放大的上限（手機最高 1560 時） */
export const STAGE_MAX_K = 1.2;

export interface StageLayout {
  /** 地平線（腳底 y = G + 腳本的 y × k） */
  G: number;
  /** 演員放大倍數（以 1280 高為 1） */
  k: number;
  /** 字幕區的上緣（畫面下 40%） */
  capTop: number;
  /** 旁白字幕的中心 y */
  capY: number;
  /** 前景的上緣（演員腳底下面） */
  foreTop: number;
  /** 泡泡最上面可以到哪裡（避開左上地名、右上略過鈕：都在 y < 80） */
  bubbleTop: number;
}

/** 依畫面高度算版面：1280 高的地平線和原型一樣；越高地平線越往下、演員越大 */
export function stageLayout(h: number): StageLayout {
  const k = Math.min(STAGE_MAX_K, Math.max(1, h / BASE_H));
  const G = Math.round(h * 0.66 - (h - BASE_H) * 0.11);
  const capTop = Math.round(h * 0.6);
  return {
    G,
    k,
    capTop,
    capY: Math.round(h - (h - capTop) * 0.42),
    foreTop: Math.round(G + 100 * k),
    bubbleTop: 100,
  };
}

/** 演員的實際縮放：演出小人（st_*）以設計尺寸為準，畫師的圖大小不同也縮成一樣高 */
export function actorScale(tex: string, scale: number, k: number, texHeight: number): number {
  const size = STAGE_SIZES[tex];
  const norm = size && texHeight > 0 ? size[1] / texHeight : 1;
  return scale * k * norm;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 泡泡放哪裡：(px, py) 是說話者頭頂在畫面上的位置，bw×bh 是泡泡大小。
 * 回傳泡泡左上角與尾巴尖端；泡泡左右留 12、上不超過 bubbleTop、下留 24。
 */
export function bubbleBox(px: number, py: number, bw: number, bh: number, L: StageLayout, h: number): { x: number; y: number; tipX: number; tipY: number } {
  const x = clamp(px - bw / 2, 12, W - bw - 12);
  const y = clamp(py - bh - 34, L.bubbleTop, h - bh - 24);
  const tipX = clamp(px, x + 24, x + bw - 24);
  const tipY = Math.max(y + bh + 10, Math.min(py - 4, y + bh + 34));
  return { x, y, tipX, tipY };
}
