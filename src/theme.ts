export const FONT = '"Noto Sans TC", "Noto Sans CJK TC", "Microsoft JhengHei", "PingFang TC", sans-serif';
export const SERIF = '"Noto Serif TC", "Noto Serif CJK TC", "PMingLiU", serif';

/**
 * 直式畫面：寬度固定 720，高度跟著螢幕比例（16:9 是 1280，最長 1560）。
 * 電腦瀏覽器一律 720×1280，置中顯示，左右留邊。
 */
export function gameHeight(): number {
  try {
    if (typeof window === 'undefined') return BASE_H;
    const touch = window.matchMedia?.('(pointer: coarse)').matches;
    if (!touch) return BASE_H;
    // 讀 #game 實際可用的範圍（已扣掉瀏海與底部橫條）
    const el = document.getElementById('game');
    const w = el?.clientWidth || window.innerWidth;
    const h = el?.clientHeight || window.innerHeight;
    const a = Math.max(w, h) / Math.min(w, h);
    if (!isFinite(a) || a <= 0) return BASE_H;
    return Math.round(Math.min(1560, Math.max(BASE_H, 720 * a)));
  } catch {
    return BASE_H;
  }
}

export const BASE_H = 1280;
export const W = 720;
export let H = gameHeight();

export function setGameHeight(h: number): void {
  H = h;
}

/** 夜戰的戰場（邏輯座標，畫面上整片縮小放進上方的戰鬥帶） */
export const FIELD_W = 1280;
export const FIELD_H = 720;

/** 夜戰戰鬥帶的地面（隊伍腳底）y 座標 */
export const GROUND_Y = 560;

export const C = {
  ink: 0x1d1726,
  night: 0x120f1c,
  paper: 0xfbf3e2,
  panel: 0x2a2236,
  panelEdge: 0x5a4a6e,
  gold: 0xe9b949,
  red: 0xc8372d,
  temple: 0xb3261e,
  jade: 0x3f9e83,
  muted: 0x9a8fae,
  spirit: 0x7fd6ff,
  sha: 0x9b3cff,
};

export const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}

export function shade(c: number, f: number): number {
  return f < 0 ? lerpColor(c, 0x000000, -f) : lerpColor(c, 0xffffff, f);
}

/** 測試用：網址加 ?ts=4 讓白天和夜晚跑快 4 倍 */
export const TIME_SCALE = (() => {
  try {
    return Math.max(1, Number(new URLSearchParams(location.search).get('ts') ?? 1) || 1);
  } catch {
    return 1;
  }
})();
