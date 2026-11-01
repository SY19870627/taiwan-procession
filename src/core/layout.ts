/** 版面小工具（純函式，可以單元測試） */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/**
 * 找一個離 want 最近、放得下 box（寬 w 高 h、左邊在 x）又不和 blockers 重疊的 y（畫面高 screenH 之內）。
 * 往下、往上交替找；真的找不到就回傳 want（夾在畫面裡）。
 */
export function freeY(box: { x: number; w: number; h: number }, want: number, blockers: Rect[], screenH: number, step = 6): number {
  const lo = 4;
  const hi = Math.max(lo, screenH - box.h - 4);
  const start = Math.min(hi, Math.max(lo, want));
  const ok = (y: number) => blockers.every((b) => !overlaps({ x: box.x, y, w: box.w, h: box.h }, b));
  for (let d = 0; d <= screenH; d += step) {
    if (start + d <= hi && ok(start + d)) return start + d;
    if (d > 0 && start - d >= lo && ok(start - d)) return start - d;
  }
  return start;
}
