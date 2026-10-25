export const FONT = '"Noto Sans TC", "Noto Sans CJK TC", "Microsoft JhengHei", "PingFang TC", sans-serif';
export const SERIF = '"Noto Serif TC", "Noto Serif CJK TC", "PMingLiU", serif';

/**
 * 畫面寬度：高度固定 720，寬度跟著螢幕比例（16:9 是 1280，最寬 1800）。
 * 手機比 16:9 更長時，寬度變大、畫面填滿，不會有左右黑邊。
 */
export function gameWidth(): number {
  try {
    if (typeof window === 'undefined') return BASE_W;
    const touch = window.matchMedia?.('(pointer: coarse)').matches;
    const ios = /iPhone|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches
      || window.matchMedia?.('(display-mode: fullscreen)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    // 瀏海區（左右各讓出一樣寬）：讀 #game 實際的 left 值
    const el = document.getElementById('game');
    const inset = el ? parseFloat(getComputedStyle(el).left) || 0 : 0;
    const long = (a: number, b: number) => (Math.max(a, b) - 2 * inset) / Math.min(a, b);
    const a = !touch ? (window.innerWidth - 2 * inset) / window.innerHeight
      : ios && !standalone ? long(window.innerWidth, window.innerHeight)
      : long(screen.width, screen.height);
    if (!isFinite(a) || a <= 0) return BASE_W;
    return Math.round(Math.min(1800, Math.max(BASE_W, 720 * a)));
  } catch {
    return BASE_W;
  }
}

export const BASE_W = 1280;
export let W = gameWidth();
export const H = 720;

export function setGameWidth(w: number): void {
  W = w;
}

/** 地面（隊伍腳底）的 y 座標 */
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
