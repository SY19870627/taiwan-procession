/**
 * 第三章第 7 階段：文字檢查。遊戲內一律用虛構名稱（新瀛、太子殿、疾水溪、章霄柳廉四將）；不出現真實廟名、地名。
 * 掃 src 底下所有程式（去掉註解，只看會進遊戲的字），以及第三章實際產生的文字（信徒卡、黃曆、互嗆、劇情）。
 * 取材來源（例如「地點參考臺南新營太子宮」）只能寫在註解與 docs 裡。
 */
import { describe, it, expect } from 'vitest';
import { CHAPTER3 } from '../src/content/ch3';
import { CARDS3, newBelievers3 } from '../src/content/ch3/believers';
import { BANTER3 } from '../src/content/ch3/banter';
import { CUTSCENES } from '../src/content/story';
import { FULLPOWER_CUES3 } from '../src/content/ch3/finale';
import { newRun } from '../src/state';

/** 真實的廟名、地名（第三章取材地附近）與五營兵將的真實姓氏稱呼 */
const BANNED = [
  '太子宮', '新營', '急水溪', '鹽水', '台南', '臺南', '柳營', '白河', '後壁', '麻豆', '佳里', '南鯤鯓',
  '張將軍', '蕭將軍', '劉將軍', '連將軍', '張聖者', '蕭聖者', '劉聖者', '連聖者', '張元帥', '蕭元帥', '劉元帥', '連元帥',
];
/** 遊戲裡用的虛構名稱 */
const FICTION = ['新瀛', '太子殿', '疾水溪', '章將軍', '霄將軍', '柳將軍', '廉將軍'];

/** src 底下全部程式（用 Vite 的 glob 讀，不必裝 node 型別） */
const SRC = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** 去掉註解，只留會進遊戲的程式碼與字串 */
const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');

/** 第三章實際產生的文字：信徒卡（各種狀態）、黃曆、劇情、互嗆、戰鬥字幕、章節設定裡的字 */
function ch3Text(): string {
  const out: string[] = [];
  const walk = (v: unknown, depth = 0): void => {
    if (depth > 8 || v == null) return;
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => walk(x, depth + 1));
    else if (typeof v === 'object') Object.values(v as object).forEach((x) => walk(x, depth + 1));
  };
  walk({ ...CHAPTER3, cards: undefined, days: undefined });
  for (const d of [1, 2, 3]) {
    const p = CHAPTER3.days[d];
    walk({ ...p, almanac: undefined });
    walk(p.almanac(newRun()));
  }
  for (const aling of ['unmet', 'met']) {
    const r = newRun();
    r.chapter = 'xinying';
    r.b = { ...newBelievers3(), aling };
    for (const f of Object.values(CARDS3)) walk(f(r));
  }
  walk(BANTER3);
  walk(FULLPOWER_CUES3);
  for (const id of ['kaiying3', 'zhizha3', 'river3', 'jiao3', 'jiaoRecall', 'jiaoSlay3', 'jiaoReturn3', 'shouying3']) {
    if (!CUTSCENES[id]) throw new Error(`沒有劇情 ${id}`);
    walk(CUTSCENES[id]);
  }
  const t = CHAPTER3.trial;
  out.push(t.lobbyTitle(1), t.open('某某'), t.slayLine('某某'), t.shipLine('某某'));
  return out.join('\n');
}

describe('第三章：文字檢查（虛構名稱）', () => {
  it('src 的程式與字串（不含註解）沒有真實廟名、地名、五營真實姓氏', () => {
    const hits: string[] = [];
    expect(Object.keys(SRC).length).toBeGreaterThan(40);
    for (const [f, raw] of Object.entries(SRC)) {
      const code = strip(raw);
      for (const w of BANNED) if (code.includes(w)) hits.push(`${f}：${w}`);
    }
    expect(hits).toEqual([]);
  });

  it('第三章實際產生的文字沒有真實名稱，而且用的是虛構名稱', () => {
    const text = ch3Text();
    expect(text.length).toBeGreaterThan(5000);
    for (const w of BANNED) expect(text.includes(w), w).toBe(false);
    for (const w of FICTION) expect(text.includes(w), w).toBe(true);
  });

  it('取材來源只寫在註解（例如 ch3/index.ts 檔頭）', () => {
    const src = SRC['../src/content/ch3/index.ts'];
    expect(src).toContain('新營太子宮');
    expect(strip(src)).not.toContain('新營太子宮');
  });
});
