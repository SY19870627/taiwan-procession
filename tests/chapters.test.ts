/**
 * 三章共通：每章的 ChapterDef 結構完整；第一、二章的預設值不因第三章的新欄位改變（計畫 §8 不退步保證）。
 */
import { describe, it, expect } from 'vitest';
import { CHAPTERS, ghostMood, startChapter, summary } from '../src/content/chapter';
import { newRun, run } from '../src/state';
import * as state from '../src/state';
import { beginNight, dawnHeld } from '../src/core/dianjiang';
import { slayGhost } from '../src/core/renown';
import { play, planBrain } from './sim3';

describe('三章的 ChapterDef', () => {
  it('三章都註冊了，必要欄位齊全', () => {
    // 第四章（白砂墩）在 feat/ch4-baishadun 註冊（tests/ch4.test.ts）
    expect(Object.keys(CHAPTERS).sort()).toEqual(['baishadun', 'dongjin', 'wanjia', 'xinying']);
    for (const ch of Object.values(CHAPTERS)) {
      expect(ch.place && ch.title && ch.god, ch.id).toBeTruthy();
      expect([1, 2, 3].every((d) => ch.days[d]), ch.id).toBe(true);
      expect(Object.keys(ch.cases).length, ch.id).toBeGreaterThanOrEqual(4);
      expect(ch.finale.rounds.length, ch.id).toBe(3);
      expect(ch.finale.ends.map((e) => e.kind).sort(), ch.id).toEqual(['recall', 'return', 'slay']);
      expect(ch.band(1).length, ch.id).toBeGreaterThan(0);
      // 每個證據都屬於這一章的某個鬼（第四章第 B2 輪：渾水溪渡頭的四件屬於最後一戰的茫渡，陣前審問用）
      for (const e of Object.values(ch.evidence)) {
        if (ch.id === 'baishadun' && e.ghost === 'mangdu') continue;
        expect(ch.cases[e.ghost], `${ch.id}：${e.id}`).toBeTruthy();
      }
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

describe('章節切換（第 7 階段）：整章玩完第三章，再開第一、二章', () => {
  /** 用模擬器把第三章三天三夜整個玩完（威名、戾氣、證據、判決、點將進度、每晚案數都會變） */
  const playCh3 = () => {
    const st = play(planBrain({ routes: [0, 0, 0], targets: ['yamupo', 'hutou', 'zhizha', 'dubo'], wicked: 'slay', prefer: { dubo: 'recruit' } }));
    state.run.retries = 2;
    state.run.shijuEnd = 'recall';
    return st;
  };

  it('第三章玩完之後狀態確實變了（不然這組測試沒意義）', () => {
    playCh3();
    expect(state.run.weiming).toBeGreaterThan(0);
    expect(state.run.evidence.length).toBeGreaterThan(5);
    expect(state.run.trialsLeft).toBeDefined();
    expect(Object.values(state.run.cases).some((c) => c.dj)).toBe(true);
    expect(state.run.flags.recruit_dubo).toBe(true);
  });

  for (const id of ['wanjia', 'dongjin']) {
    it(`再開${CHAPTERS[id].place}：除了章節與信徒，整份進度和全新的一樣（3 格、沒有預放的鬼、威名 0、不限案數）`, () => {
      playCh3();
      startChapter(id);
      const fresh = newRun();
      const { chapter, b, ...rest } = state.run;
      const { chapter: _c, b: _b, ...freshRest } = fresh;
      void _c; void _b;
      expect(chapter).toBe(id);
      expect(b).toEqual(CHAPTERS[id].newBelievers());
      expect(rest).toEqual(freshRest);
      expect(state.run.slots).toBe(3);
      expect(state.run.held).toEqual([]);
      expect(state.run.weiming).toBe(0);
      expect(state.run.trialsLeft).toBeUndefined();
    });

    it(`再開${CHAPTERS[id].place}：規則也回到原本的（入夜不限案數、天亮怨氣 +1、斬一律加戾氣、沒有威名嚇跑）`, () => {
      playCh3();
      startChapter(id);
      const ch = CHAPTERS[id];
      beginNight(state.run, ch);
      expect(state.run.trialsLeft).toBeUndefined();
      const k = Object.values(ch.cases)[0];
      state.run.held.push({ id: k.id, grudge: 0 });
      dawnHeld(state.run, ch);
      expect(state.run.held[0]?.grudge).toBe(1);
      state.run.weiming = 5;
      expect(ghostMood(state.run, k.id)).toBe('normal');
      const before = state.run.liqi;
      slayGhost(state.run, k, ch);
      expect(state.run.liqi).toBe(Math.min(3, before + 1 + (k.innocent ? 1 : 0)));
      expect(state.run.weiming).toBe(5);
    });
  }

  it('第一章玩到一半再開第三章：五格、開局押著三隻，前一章的證據與旗標不會帶過來', () => {
    startChapter('wanjia');
    state.run.evidence.push('x');
    state.run.flags.allied = true;
    state.run.liqi = 3;
    startChapter('xinying');
    expect(state.run.slots).toBe(5);
    expect(state.run.held.map((h) => h.id)).toEqual(['yamupo', 'shuigui', 'huosha']);
    expect(state.run.evidence).toEqual([]);
    expect(state.run.flags).toEqual({});
    expect(state.run.liqi).toBe(0);
  });
});
