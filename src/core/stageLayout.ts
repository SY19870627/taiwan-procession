/**
 * 引擎內演出的版面（純函式，可以單元測試；播放器在 ui/stage.ts）。
 *
 * 手機直式畫面比較高（最高 1560）：地平線往下、演員放大（以 1280 高為 1，上限 STAGE_MAX_K），
 * 演員腳底下面畫前景，畫面下 40% 是字幕區；泡泡掛在說話者頭上，不超出畫面、不蓋左上地名與右上略過鈕。
 */
import { BASE_H, W } from '../theme';
import { STAGE_SIZES } from '../art/stageSpec';
import { BATTLE_ART } from '../art/xinyingSpec';

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

/**
 * 演員的設計尺寸：演出小人（st_*）照 stageSpec；第三章的戰鬥圖（太子、四將、蛟）照 xinyingSpec 的 BATTLE_ART
 * （正式圖比暫代大，腳本的 scale 以暫代大小為準）。其他程式畫的貼圖沒有設計尺寸。
 */
export function stageSize(tex: string): readonly [number, number] | undefined {
  return STAGE_SIZES[tex] ?? (BATTLE_ART as Record<string, readonly [number, number]>)[tex];
}

/** 演員的實際縮放：演出小人（st_*）、第三章戰鬥圖以設計尺寸為準，正式圖大小不同也縮成一樣高 */
export function actorScale(tex: string, scale: number, k: number, texHeight: number): number {
  const size = stageSize(tex);
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

/** 遠景帶的最大高度（山、城市剪影、海） */
export const FAR_MAX_H = 260;

/**
 * 遠景帶多高：照貼圖本身的高度、最多 FAR_MAX_H。
 * 遠景貼圖比 260 矮時（城市剪影 220、海 200），原本會上下重複貼一截；改成照貼圖高度就不會。
 */
export function farBandHeight(texHeight: number): number {
  return texHeight > 0 ? Math.min(FAR_MAX_H, texHeight) : FAR_MAX_H;
}

/**
 * 遠景用哪張：正式圖（far）有載到就用它、套 farTint；沒載到用 farAlt（程式畫的暫代，不套色）。
 * 兩張都沒有就不畫遠景。
 */
export function pickFar(sc: { far?: string; farAlt?: string; farTint?: number }, exists: (k: string) => boolean): { key: string; tint?: number } | undefined {
  if (sc.far && exists(sc.far)) return { key: sc.far, tint: sc.farTint };
  if (sc.farAlt && exists(sc.farAlt)) return { key: sc.farAlt };
  return undefined;
}

/** 近景圖（溪邊堤防 2048×400）的路面在圖高的幾成：演員腳底踩在這條線上 */
export const NEAR_WALK = 0.675;

/**
 * 近景帶怎麼擺：縮成 0.55k 倍，路面（NEAR_WALK）對齊地面線下 20k（演員腳底附近）。
 * 回傳上緣 y、高度、縮放。
 */
export function nearBand(G: number, k: number, texHeight: number): { top: number; h: number; s: number } {
  const s = 0.55 * k;
  const h = texHeight * s;
  return { top: G + 20 * k - h * NEAR_WALK, h, s };
}
