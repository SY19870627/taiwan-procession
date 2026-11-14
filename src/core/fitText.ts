/**
 * 單行字放不下時怎麼辦（純函式，可以單元測試；第四章超框校正）：
 * 先一級一級縮字（size → minSize），縮到 minSize 還放不下就改成換行（字級停在 minSize）。
 * 量寬由呼叫的人給：遊戲裡用 Phaser 實際量（ui/widgets.ts 的 fitText），測試用 estWidth 估。
 * 放得下就什麼都不動（別章原本放得下的字，顯示完全一樣）。
 */

/** 一個字大約幾個字寬（em）：中日韓字、全形標點 1；半形英數 0.62；空白 0.3 */
export function charEm(ch: string): number {
  const c = ch.codePointAt(0) ?? 0;
  if (ch === ' ') return 0.3;
  if (c < 0x80) return 0.62;
  // 半形片假名、半形符號
  if (c >= 0xff61 && c <= 0xffdc) return 0.55;
  return 1;
}

/** 估一行字在 size px 下多寬（多行取最寬那一行） */
export function estWidth(s: string, size: number): number {
  return Math.max(0, ...s.split('\n').map((line) => Array.from(line).reduce((w, ch) => w + charEm(ch), 0) * size));
}

export interface FitResult {
  /** 最後用的字級 */
  size: number;
  /** 縮到 minSize 還放不下，要換行 */
  wrap: boolean;
}

/**
 * 從 size 開始往下縮（每次 step），找第一個 measure(size) ≤ maxW 的字級；縮到 minSize 還不行就 wrap。
 * measure 回傳那個字級下的寬度。
 */
export function fitLine(measure: (size: number) => number, maxW: number, size: number, minSize: number, step = 1): FitResult {
  if (measure(size) <= maxW) return { size, wrap: false };
  const lo = Math.min(size, minSize);
  for (let s = size - step; s >= lo; s -= step) {
    if (measure(s) <= maxW) return { size: s, wrap: false };
  }
  return { size: lo, wrap: true };
}

/** 行首不放的標點（避頭點） */
const NO_HEAD = '，。、；：！？」』）】〕》〉…—～';

/**
 * 依估寬把字換行（逐字；標點不放行首，會留在上一行尾巴）。給測試用來算換行後幾行、每行多寬。
 */
export function wrapEst(s: string, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const para of s.split('\n')) {
    let line = '';
    let w = 0;
    for (const ch of Array.from(para)) {
      const cw = charEm(ch) * size;
      if (line && w + cw > maxW && !NO_HEAD.includes(ch)) {
        out.push(line);
        line = '';
        w = 0;
      }
      line += ch;
      w += cw;
    }
    out.push(line);
  }
  return out;
}

/** 按鈕上的字太長就斷成兩行（逗號、冒號後面優先）。白天卡片的選項按鈕用（原本在 DayScene，搬來這裡給測試用） */
export function twoLines(label: string): string {
  if (label.length <= 7) return label;
  const mid = Math.ceil(label.length / 2);
  let at = -1;
  for (let d = 0; d <= 4 && at < 0; d++) {
    for (const i of [mid + d, mid - d]) if (/[，：、]/.test(label[i - 1] ?? '')) { at = i; break; }
  }
  if (at < 0) at = mid;
  return `${label.slice(0, at)}\n${label.slice(at)}`;
}

/** 按鈕的字可以寬到按鈕寬減這麼多（左右各留 6px；button() 自動縮字也用這個） */
export const BUTTON_PAD = 12;
/** 白天卡片選項按鈕的寬 */
export const OPTION_W = 164;

/** 平均斷成 n 行：斷點盡量落在標點後面（前後 2 個字內找），標點不放行首 */
export function splitEven(s: string, n: number): string[] {
  const a = Array.from(s);
  const out: string[] = [];
  let start = 0;
  for (let k = 1; k < n; k++) {
    const ideal = Math.round((a.length * k) / n);
    let at = ideal;
    for (let d = 0; d <= 2; d++) {
      if (/[，：、。]/.test(a[ideal + d - 1] ?? '')) { at = ideal + d; break; }
      if (/[，：、。]/.test(a[ideal - d - 1] ?? '')) { at = ideal - d; break; }
    }
    at = Math.max(at, start + 1);
    while (at < a.length && NO_HEAD.includes(a[at])) at++;
    out.push(a.slice(start, at).join(''));
    start = at;
  }
  out.push(a.slice(start).join(''));
  return out.filter(Boolean);
}

/**
 * 白天卡片選項按鈕（寬 164）的字、字級、按鈕高（DayScene.optionRow）：
 * 第四章（follow）長字斷兩行；字級照字數（原本的規則，放得下就照舊）。
 * 第四章照原本的規則還是比按鈕寬（例如「派前哨在人潮裡順出一條路，把她送到工作人員旁邊」）：
 * 平均斷成 2～3 行、字級 15→13，挑第一個放得下的，按鈕跟著加高（超框校正）。別章不動。
 */
export function optionLabel(label: string, follow: boolean): { text: string; size: number; h: number } {
  const text = follow ? twoLines(label) : label;
  const longest = Math.max(...text.split('\n').map((s) => s.length));
  const two = text.includes('\n');
  const size = two ? (longest > 8 ? 15 : 17) : label.length > 9 ? 15 : label.length > 6 ? 18 : label.length > 4 ? 20 : 24;
  const res = { text, size, h: two ? 64 : 52 };
  const maxW = OPTION_W - BUTTON_PAD;
  if (!follow || estWidth(text, size) <= OPTION_W - 2) return res;
  for (const n of [2, 3]) {
    for (const sz of [15, 14, 13]) {
      const lines = splitEven(label, n);
      if (estWidth(lines.join('\n'), sz) <= maxW) return { text: lines.join('\n'), size: sz, h: Math.max(64, Math.ceil(lines.length * sz * 1.45 + 16)) };
    }
  }
  return res;
}

/** 測試用：用估寬跑一次 fitLine，回傳字級與換好的各行 */
export function fitEst(s: string, maxW: number, size: number, minSize: number): FitResult & { lines: string[] } {
  const r = fitLine((sz) => estWidth(s, sz), maxW, size, minSize);
  return { ...r, lines: r.wrap ? wrapEst(s, r.size, maxW) : s.split('\n') };
}
