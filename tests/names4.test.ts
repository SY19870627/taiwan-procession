/**
 * 第四章文字檢查：遊戲內一律用虛構名稱（白砂墩拱辰宮、北津朝聖宮、渾水溪、通汐、大岬鎮海宮）；
 * 不出現真實廟名、地名（取材出處只能寫在註解、_agent、docs）。
 * 掃 src 底下所有程式（去掉註解，只看會進遊戲的字），以及第四章實際產生的文字（信徒卡、黃曆、行程、案子、劇情）。
 */
import { describe, it, expect } from 'vitest';
import { CHAPTER4 } from '../src/content/ch4';
import { CARDS4, newBelievers4 } from '../src/content/ch4/believers';
import { CUTSCENES4 } from '../src/content/ch4/story';
import { MAP_CHAPTERS } from '../src/content/map';
import { newRun } from '../src/state';

/** 第四章取材地的真實名稱 */
const BANNED = ['白沙屯', '拱天宮', '北港', '朝天宮', '濁水溪', '通霄', '大甲', '鎮瀾宮', '北辰派出所', '西螺'];
/** 第四章用的虛構名稱 */
const FICTION = ['白砂墩', '拱辰宮', '北津', '渾水溪'];

const SRC = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');

function ch4Text(): string {
  const out: string[] = [];
  const walk = (v: unknown, depth = 0): void => {
    if (depth > 8 || v == null) return;
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => walk(x, depth + 1));
    else if (typeof v === 'object') Object.values(v as object).forEach((x) => walk(x, depth + 1));
  };
  walk({ ...CHAPTER4, cards: undefined, days: undefined });
  for (const p of Object.values(CHAPTER4.days)) {
    walk({ ...p, almanac: undefined });
    walk(p.almanac(newRun()));
  }
  const r = newRun();
  r.chapter = 'baishadun';
  r.b = newBelievers4();
  for (const f of Object.values(CARDS4)) walk(f(r));
  walk(CUTSCENES4);
  walk(MAP_CHAPTERS.find((c) => c.id === 'baishadun'));
  const t = CHAPTER4.trial;
  out.push(t.lobbyTitle(1), t.open('某某'), t.shipLine('某某'), CHAPTER4.held.collect('某某'));
  return out.join('\n');
}

describe('第四章：文字檢查（虛構名稱）', () => {
  it('src 的程式與字串（不含註解）沒有第四章取材地的真實名稱', () => {
    const hits: string[] = [];
    expect(Object.keys(SRC).length).toBeGreaterThan(40);
    for (const [f, raw] of Object.entries(SRC)) {
      const code = strip(raw);
      for (const w of BANNED) if (code.includes(w)) hits.push(`${f}：${w}`);
    }
    expect(hits).toEqual([]);
  });

  it('第四章實際產生的文字沒有真實名稱，而且用的是虛構名稱', () => {
    const text = ch4Text();
    expect(text.length).toBeGreaterThan(600);
    for (const w of BANNED) expect(text.includes(w), w).toBe(false);
    for (const w of FICTION) expect(text.includes(w), w).toBe(true);
  });

  it('跟轎台的義工叫阿睿（第一章已有阿哲）；第四章的字裡沒有阿哲', () => {
    const text = ch4Text();
    expect(text).toContain('阿睿');
    expect(text.includes('阿哲')).toBe(false);
  });

  it('取材來源只寫在註解（ch4/index.ts 檔頭）', () => {
    const src = SRC['../src/content/ch4/index.ts'];
    expect(src).toContain('白沙屯');
    expect(strip(src)).not.toContain('白沙屯');
  });
});
