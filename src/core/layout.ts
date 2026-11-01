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

/**
 * 夜審（第一、二章）的版面：鬼的光圈、立繪、下方面板，以及互嗆字幕放哪裡。
 * 字幕比照點將問罪：放在立繪左邊、限寬到光圈（脈動放到最大時）左緣 − 8，太長就換行，
 * 不蓋鬼的臉，也不碰下方的供詞／案卷面板（第一、二章熱鬧化第 6 階段）。
 */
export const TRIAL = {
  /** 審問畫面：光圈中心、半徑、脈動放大倍數 */
  glow: { x: 360, y: 360, r: 130, pulse: 1.1 },
  /** 審問畫面：鬼的立繪底部與高度（420×560 的圖） */
  ghost: { bottom: 532, h: 320 },
  /** 審問畫面：下方面板的上緣 */
  panelY: 530,
  /** 判決結果：鬼的立繪底部與高度、下方面板的上緣 */
  verdict: { bottom: 556, h: 340, panelY: 560 },
  /** 互嗆字幕：第一句的 y（判官立繪的臉下面）、字幕框最寬多少（從 x = 16 算起） */
  chatY: 336,
  chatW: 360 - 130 * 1.1 - 8 - 16,
} as const;

/** 換行後有沒有哪一行以標點開頭（「，再問問。」這種）——互嗆字幕換行時要避開 */
export function punctLeads(rows: string[]): boolean {
  return rows.slice(1).some((r) => /^[，。、！？；：…」』）—]/.test(r));
}

/**
 * 互嗆字幕換行寬度：從平均分的寬度 base 開始，依序試寬一點、窄一點（每次一個字 step），
 * 挑第一個不會讓標點落在行首的寬度（不超過 max）；都不行就用 base。wrap 回傳照某個寬度換好的各行。
 */
export function wrapWidth(base: number, max: number, step: number, wrap: (w: number) => string[]): number {
  for (const w of [base, base + step, base + 2 * step, base - step, base - 2 * step]) {
    if (w > step && w <= max && !punctLeads(wrap(w))) return w;
  }
  return base;
}
