/**
 * 第一、二章熱鬧化第 5 階段：白天互嗆、今日陣頭卡。
 * 只加字幕與說明卡，不改數值（計畫 §1、§8）；第三章的互嗆與成長卡不變。
 */
import { describe, it, expect } from 'vitest';
import { CHAPTERS } from '../src/content/chapter';
import { BANTER1 } from '../src/content/banter1';
import { BANTER2 } from '../src/content/ch2/banter';
import { BANTER3 } from '../src/content/ch3/banter';
import { WHO_COLOR } from '../src/theme';

const DAY = import.meta.glob(['../src/scenes/DayScene.ts', '../src/scenes/AlmanacScene.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const daySrc = DAY['../src/scenes/DayScene.ts'];

/** 白天會播的場合（第一、二章；DayScene 的掛勾） */
const DAY_KEYS = ['depart', 'walk1', 'walk2', 'walk3', 'fork', 'imp', 'collect', 'dusk'];
const WHO: Record<string, string[]> = {
  wanjia: ['文判官', '武判官', '七爺', '八爺', '報馬仔'],
  dongjin: ['中軍府', '巡捕', '轎班'],
};

describe('第一、二章白天互嗆', () => {
  it('接到兩章的 ChapterDef', () => {
    expect(CHAPTERS.wanjia.banter).toBe(BANTER1);
    expect(CHAPTERS.dongjin.banter).toBe(BANTER2);
    expect(CHAPTERS.xinying.banter).toBe(BANTER3);
  });

  for (const id of ['wanjia', 'dongjin']) {
    it(`${id}：每個白天掛勾都有 2～4 組台詞`, () => {
      for (const key of DAY_KEYS) {
        const lib = CHAPTERS[id].banter?.[key];
        expect(lib?.length, `${id} ${key}`).toBeGreaterThanOrEqual(2);
        expect(lib!.length, `${id} ${key}`).toBeLessThanOrEqual(4);
      }
    });

    it(`${id}：每組 1～3 句、每句一行且 ≤ 24 字（連名字）`, () => {
      for (const [key, sets] of Object.entries(CHAPTERS[id].banter!)) {
        for (const set of sets) {
          expect(set.length, `${id} ${key}`).toBeGreaterThanOrEqual(1);
          expect(set.length, `${id} ${key}`).toBeLessThanOrEqual(3);
          for (const l of set) {
            expect(l.text.includes('\n'), l.text).toBe(false);
            expect(l.text.trim().length, `${id} ${key}`).toBeGreaterThan(0);
            expect([...`${l.who}：${l.text}`].length, l.text).toBeLessThanOrEqual(24);
          }
        }
      }
    });

    it(`${id}：說話的都是這一章的隨從，而且都有顏色`, () => {
      const who = new Set(WHO[id]);
      for (const [key, sets] of Object.entries(CHAPTERS[id].banter!)) {
        for (const set of sets) {
          for (const l of set) {
            expect(who.has(l.who), `${id} ${key}：${l.who}`).toBe(true);
            expect(WHO_COLOR[l.who], l.who).toBeTypeOf('number');
          }
        }
      }
    });
  }

  it('台詞庫的場合都有接到 DayScene（不會寫了沒播）', () => {
    const used = new Set<string>();
    for (const line of daySrc.split('\n').filter((l) => /\bbanter\(/.test(l))) for (const m of line.matchAll(/'(\w+)'/g)) used.add(m[1]);
    if (daySrc.includes('this.banter(`walk${this.plan.day}`)')) for (const d of [1, 2, 3]) used.add(`walk${d}`);
    for (const lib of [BANTER1, BANTER2]) for (const key of Object.keys(lib)) expect(used.has(key), key).toBe(true);
  });

  it('小妖：驅散（第一章）與押煞上船（第二章）都播 imp，第三章乾坤圈不碰', () => {
    const imp = daySrc.slice(daySrc.indexOf('private showImp('), daySrc.indexOf('private skipImp('));
    const scatter = imp.slice(imp.indexOf("rule.mode === 'scatter'"), imp.indexOf("rule.mode === 'ring'"));
    const ring = imp.slice(imp.indexOf("rule.mode === 'ring'"), imp.indexOf('// 押煞上船'));
    const decree = imp.slice(imp.indexOf('// 押煞上船'));
    expect(scatter).toContain("this.banter('imp')");
    expect(decree).toContain("this.banter('imp')");
    expect(ring).not.toContain("'imp'");
    expect(BANTER3.imp).toBeUndefined();
  });

  it('收容每次都播（第三章原本就是每次都播，行為不變）', () => {
    const collect = daySrc.slice(daySrc.indexOf('private collect('), daySrc.indexOf('// ----- 小妖 -----'));
    expect(collect).toContain("this.banter('collect')");
    expect(collect).not.toMatch(/if \(this\.renown\(\)\) this\.banter\('collect'\)/);
  });

  it('第三章的說話者顏色不變', () => {
    expect(WHO_COLOR).toMatchObject({ 太子: 0xffb347, 章將軍: 0x6fd39a, 霄將軍: 0xff7a6a, 柳將軍: 0xf2efe6, 廉將軍: 0xa8a8c8 });
  });
});

describe('今日陣頭卡', () => {
  it('第一、二章 1～3 天都有，標題是「今日陣頭・…」', () => {
    for (const id of ['wanjia', 'dongjin']) {
      const u = CHAPTERS[id].unlocks;
      expect(Object.keys(u ?? {}), id).toEqual(['1', '2', '3']);
      for (const d of [1, 2, 3]) {
        expect(u![d].title, `${id} ${d}`).toMatch(/^今日陣頭・/);
        expect(u![d].text.length, `${id} ${d}`).toBeGreaterThan(20);
      }
    }
  });

  it('說明和程式的規則對得上（不改數值，只說明）', () => {
    const ch1 = CHAPTERS.wanjia;
    const ch2 = CHAPTERS.dongjin;
    // 令旗下格數（預設 3）、驅散 1 時辰
    expect(ch1.slots ?? 3).toBe(3);
    expect(ch1.unlocks![1].text).toContain('三格');
    expect(ch1.imp.mode === 'scatter' && ch1.imp.hours).toBe(1);
    expect(ch1.unlocks![2].text).toContain('一個時辰');
    // 第二章：王令一天兩道、收容是王令下
    expect(ch2.imp.mode === 'decree' && ch2.imp.perDay).toBe(2);
    expect(ch2.unlocks![1].text).toContain('一天兩道');
    expect(ch2.unlocks![1].text).toContain(ch2.held.label);
    expect(ch1.unlocks![1].text).toContain(ch1.held.label);
  });

  it('第三章的成長解鎖卡不變', () => {
    expect(CHAPTERS.xinying.unlocks![1].title).toBe('五營出營・各將一招');
  });
});
