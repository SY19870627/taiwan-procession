/**
 * 避免 AI 味檢核表（照 dream-cafe）：檢核表兩份文件都在，短版剛好 20 條、完整版剛好 20 節；
 * 機械掃描器（src/tools/aiPhrase.ts）的規則對得上條目編號，抓得到範例句，也收得到各章的字。
 * 命中報告不在這裡跑（npm run check:ai），這裡不因遊戲文字有命中而失敗。
 */
import { describe, it, expect } from 'vitest';
import { AI_MANUAL, AI_RULES, rawLiterals, scanChapterTexts, scanText } from '../src/tools/aiPhrase';

const SHORT = import.meta.glob('../docs/AI味檢核表_20條.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const FULL = import.meta.glob('../docs/AI味檢核表.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

describe('AI 味檢核表文件', () => {
  it('短版 docs/AI味檢核表_20條.md 存在，剛好 20 條編號', () => {
    const files = Object.values(SHORT);
    expect(files).toHaveLength(1);
    const items = files[0].split(/\r?\n/).filter((l) => /^\d+\. /.test(l));
    expect(items).toHaveLength(20);
    expect(items.map((l) => Number(/^(\d+)\./.exec(l)![1]))).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('完整版 docs/AI味檢核表.md 存在，剛好 20 節「### NN.」', () => {
    const files = Object.values(FULL);
    expect(files).toHaveLength(1);
    const heads = files[0].split(/\r?\n/).filter((l) => /^### \d{2}\. /.test(l));
    expect(heads).toHaveLength(20);
    expect(heads.map((l) => Number(l.slice(4, 6)))).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
});

describe('AI 味掃描器', () => {
  it('自動規則＋人工條目剛好涵蓋 1–20，不重複', () => {
    const nos = [...AI_RULES.map((r) => r.no), ...AI_MANUAL.map((r) => r.no)].sort((a, b) => a - b);
    expect(nos).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  const hit = (text: string) => scanText(text).map((h) => h.no);
  it('範例句命中對的條目', () => {
    expect(hit('他停了一下——又停了一下—')).toEqual([1]);
    expect(scanText('他停了一下——又停了一下—')[0].snippets).toHaveLength(2);
    expect(hit('這不是結束，而是開始。')).toContain(3);
    expect(hit('與其說是怕，不如說是累。')).toContain(3);
    expect(hit('有風，有香，有人在等。')).toContain(2);
    expect(hit('他說完就走了。原來這就是家。')).toContain(4);
    expect(hit('原來這就是家。他說完就走了。')).not.toContain(4);
    expect(hit('廟埕是大家的港灣。')).toContain(8);
    expect(hit('我們進行討論。')).toContain(14);
    expect(hit('他非常高興。')).toContain(15);
    expect(hit('欸，好啦，走喔。')).toContain(17);
    expect(hit('欸，好啦。')).not.toContain(17);
    expect(hit('她微微一笑。')).toContain(18);
    expect(hit('這是命運。')).toContain(19);
    expect(hit('阿伯把香插好，走回轎邊。')).toEqual([]);
  });

  it('原始碼字面值跳過註解、樣板字串的 ${} 換成「…」', () => {
    const src = "// 註解：不算\n/* 也不算 */\nconst a = '第一句';\nconst b = `你好${name}啦`;\nconst k = 'asset_key';\n";
    expect(rawLiterals(src)).toEqual([
      { line: 3, text: '第一句' },
      { line: 4, text: '你好…啦' },
    ]);
  });

  it('收得到四章和共用的字，id 不重複', () => {
    const all = scanChapterTexts();
    for (const ch of ['第一章', '第二章', '第三章', '第四章', '共用']) {
      expect(all.some((e) => e.chapter === ch), ch).toBe(true);
    }
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
    expect(all.some((e) => e.chapter === '第四章' && e.id.startsWith('content/ch4/missed.ts:'))).toBe(true);
  });
});
