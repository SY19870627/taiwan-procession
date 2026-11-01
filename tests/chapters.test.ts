/**
 * 三章共通：每章的 ChapterDef 結構完整；第一、二章的預設值不因第三章的新欄位改變（計畫 §8 不退步保證）。
 */
import { describe, it, expect } from 'vitest';
import { CHAPTERS, ghostMood, startChapter, summary } from '../src/content/chapter';
import { run } from '../src/state';
import * as state from '../src/state';

describe('三章的 ChapterDef', () => {
  it('三章都註冊了，必要欄位齊全', () => {
    expect(Object.keys(CHAPTERS).sort()).toEqual(['dongjin', 'wanjia', 'xinying']);
    for (const ch of Object.values(CHAPTERS)) {
      expect(ch.place && ch.title && ch.god, ch.id).toBeTruthy();
      expect([1, 2, 3].every((d) => ch.days[d]), ch.id).toBe(true);
      expect(Object.keys(ch.cases).length, ch.id).toBeGreaterThanOrEqual(4);
      expect(ch.finale.rounds.length, ch.id).toBe(3);
      expect(ch.finale.ends.map((e) => e.kind).sort(), ch.id).toEqual(['recall', 'return', 'slay']);
      expect(ch.band(1).length, ch.id).toBeGreaterThan(0);
      // 每個證據都屬於這一章的某個鬼
      for (const e of Object.values(ch.evidence)) expect(ch.cases[e.ghost], `${ch.id}：${e.id}`).toBeTruthy();
    }
  });

  it('第一、二章沒有填第三章的新欄位（維持原本規則）', () => {
    for (const id of ['wanjia', 'dongjin']) {
      const ch = CHAPTERS[id];
      expect(ch.slots).toBeUndefined();
      expect(ch.startHeld).toBeUndefined();
      expect(ch.overnight).toBeUndefined();
      expect(ch.slayRule).toBeUndefined();
      expect(ch.chase).toBeUndefined();
      expect(ch.trial.perNight).toBeUndefined();
      expect(ch.trial.style).not.toBe('dianjiang');
      expect(ch.imp.mode).not.toBe('ring');
      expect(ch.finale.ends.find((e) => e.kind === 'recall')?.needLast).toBe(true);
      for (const k of Object.values(ch.cases)) {
        expect(k.nature, k.id).toBeUndefined();
        expect(k.taunts, k.id).toBeUndefined();
      }
    }
    expect(CHAPTERS.wanjia.imp.mode).toBe('scatter');
    expect(CHAPTERS.dongjin.imp.mode).toBe('decree');
  });
});

describe('開始一章：收容格與開局押著的鬼', () => {
  it('第一章：3 格、不預放、威名 0', () => {
    startChapter('wanjia');
    expect(state.run.chapter).toBe('wanjia');
    expect(state.run.slots).toBe(3);
    expect(state.run.held).toEqual([]);
    expect(state.run.weiming).toBe(0);
  });

  it('第二章：3 格、不預放', () => {
    startChapter('dongjin');
    expect(state.run.slots).toBe(3);
    expect(state.run.held).toEqual([]);
  });

  it('第三章：5 格、開局押著鴨母婆、水鬼、火煞', () => {
    startChapter('xinying');
    expect(state.run.slots).toBe(5);
    expect(state.run.held.map((h) => h.id)).toEqual(['yamupo', 'shuigui', 'huosha']);
    expect(state.run.held.every((h) => h.grudge === 0)).toBe(true);
    expect(state.run.weiming).toBe(0);
    expect(state.run.b.yashen).toBe('worried');
  });

  it('玩完第三章再開第一章：回到 3 格、沒有預放的鬼、威名歸零', () => {
    startChapter('xinying');
    state.run.weiming = 3;
    startChapter('wanjia');
    expect(state.run.slots).toBe(3);
    expect(state.run.held).toEqual([]);
    expect(state.run.weiming).toBe(0);
    expect(state.run.b.axiu).toBe('sick');
  });

  it('import 的 run 也跟著換（畫面用的是同一個進度）', () => {
    startChapter('xinying');
    expect(run.chapter).toBe('xinying');
    startChapter('wanjia');
    expect(run.chapter).toBe('wanjia');
  });
});

describe('白天規則：第一、二章不變', () => {
  it('ghostMood：戾氣 ≥ timid 躲、≥ timid+1 逃', () => {
    startChapter('wanjia');
    const k = CHAPTERS.wanjia.cases.gui;
    state.run.liqi = k.timid - 1;
    expect(ghostMood(state.run, 'gui')).toBe('normal');
    state.run.liqi = k.timid;
    expect(ghostMood(state.run, 'gui')).toBe('hiding');
    state.run.liqi = k.timid + 1;
    expect(ghostMood(state.run, 'gui')).toBe('fled');
  });

  it('小妖的花費文字：驅散、王令、乾坤圈', () => {
    const imp = (ch: string) => {
      startChapter(ch);
      const e = Object.values(CHAPTERS[ch].days).flatMap((p) => [...p.pre, ...p.routes.flatMap((r) => r.encounters), ...p.post]).find((x) => x.kind === 'imp')!;
      return summary(state.run, e).cost;
    };
    expect(imp('wanjia')).toBe('驅散 1 時辰');
    expect(imp('dongjin')).toBe('押煞上船・王令 1 道');
    expect(imp('xinying')).toBe('乾坤圈・不花時辰');
  });
});
