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
  /**
   * 互嗆字幕條（修正第 2 輪：上一輪的 chatY 386 剛好在判官胸口，底框又只有字那麼寬，看起來還是靠左兩條）：
   * 改成全寬（x 16～W − 16）的字幕條，下緣貼在當時下方面板上緣上面 gap，最多疊 rows 行、每行 rowH 高，
   * 只蓋判官與鬼的腰部以下；說話的人站哪邊，字就靠哪邊、加朝那邊的箭頭（ui/banter.ts 的 banterStrip）。
   */
  strip: { size: 22, rowH: 36, rows: 2, gap: 4 },
  /** 判官立繪：底部 y 與最高多高（create 畫的） */
  officer: { bottom: 506, h: 250 },
} as const;

/**
 * 白天的卡片（DayScene）塞不下時怎麼縮（第 C2 輪：第三天阿翰那種長卡，選項＋「不處理：…」蓋到下面的「前方」）：
 * 內容從 top 排到 bottom，要放在 limit（「前方」那條線）以上，就以 top 為基準整張等比縮小（scale）。
 * 縮到 keepMin 還放不下：把「前方」收起來（ahead = false），改成放到 floor（面板下緣）以上；最小縮到 min。
 */
export function fitCard(top: number, bottom: number, limit: number, floor: number, keepMin = 0.75, min = 0.5): { scale: number; ahead: boolean } {
  const h = bottom - top;
  if (bottom <= limit || h <= 0) return { scale: 1, ahead: true };
  const keep = (limit - top) / h;
  if (keep >= keepMin) return { scale: keep, ahead: true };
  return { scale: Math.max(min, Math.min(1, (floor - top) / h)), ahead: false };
}

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
