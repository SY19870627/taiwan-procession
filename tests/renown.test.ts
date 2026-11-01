/**
 * 第三章白天規則（core/renown.ts）：威名、戾氣、看相、快判、風火輪追、小妖自己逃。
 * 同時確認第一、二章的規則沒有被改到。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CHAPTERS, collectHours, ghostMood, startChapter, summary } from '../src/content/chapter';
import * as state from '../src/state';
import {
  CATCH_HOURS, WEIMING_MAX, approachHours, collectGrudge, escortGhost, exposed, flareCut, impsFlee, isLooked,
  lookAt, moodOf, natureOf, slayGhost, slayPreview, truthReel, weimingText,
} from '../src/core/renown';
import { LOOK_LINE } from '../src/content/ch3/cases';
import type { Encounter } from '../src/content/days';

const ch3 = CHAPTERS.xinying;
const k3 = ch3.cases;
const R3 = { slayRule: ch3.slayRule, chase: ch3.chase };
const r = () => state.run;

describe('太子親斬的結算（第三章 renown）', () => {
  beforeEach(() => startChapter('xinying'));

  it('斬十惡：威名 +1、不加戾氣、空出格子', () => {
    const res = slayGhost(r(), k3.shuigui, R3);
    expect(res).toEqual({ weiming: 1, liqi: 0, wronged: false, lost: [] });
    expect(r().weiming).toBe(1);
    expect(r().liqi).toBe(0);
    expect(r().cases.shuigui.verdict).toBe('slay');
    expect(r().held.map((h) => h.id)).toEqual(['yamupo', 'huosha']);
  });

  it('斬冤魂：戾氣 +1（不像第一章再加 1）、記遺憾、威名不變', () => {
    const res = slayGhost(r(), k3.yamupo, R3);
    expect(res.liqi).toBe(1);
    expect(res.weiming).toBe(0);
    expect(res.wronged).toBe(true);
    expect(r().flags.wronged_yamupo).toBe(true);
    // 因果簿記遺憾
    expect(ch3.ledger(r()).some((l) => l.who === '遺憾' && l.state.includes('鴨母婆'))).toBe(true);
  });

  it('真惡沒審就斬：威名不加、不加戾氣，拿不到牠身上的證據（虎頭的帳本、紙紮童的話）', () => {
    const h = slayGhost(r(), k3.hutou, R3);
    expect(h).toEqual({ weiming: 0, liqi: 0, wronged: false, lost: ['ash_ledger'] });
    const z = slayGhost(r(), k3.zhizha, R3);
    expect(z.lost).toEqual(['zhizha_word']);
    expect(r().evidence).not.toContain('ash_ledger');
  });

  it('真惡揭穿後再斬：威名 +1', () => {
    r().cases.hutou = { truths: [0, 1] };
    expect(exposed(r(), k3.hutou)).toBe(true);
    r().evidence.push('ash_ledger');
    const res = slayGhost(r(), k3.hutou, R3);
    expect(res.weiming).toBe(1);
    expect(res.lost).toEqual([]);
  });

  it('威名上限 5、戾氣上限 3', () => {
    r().weiming = WEIMING_MAX;
    slayGhost(r(), k3.shuyao, R3);
    expect(r().weiming).toBe(WEIMING_MAX);
    r().liqi = 3;
    slayGhost(r(), k3.awang, R3);
    expect(r().liqi).toBe(3);
  });

  it('快判押送：不加不減、空出格子', () => {
    escortGhost(r(), k3.huosha);
    expect(r().cases.huosha.verdict).toBe('escort');
    expect(r().held.map((h) => h.id)).toEqual(['yamupo', 'shuigui']);
    expect(r().weiming + r().liqi).toBe(0);
    // 押送之後，路上不會再出現
    expect(state.caseDone('huosha')).toBe(true);
  });

  it('真相回憶：斬錯時把所有真相層連起來播', () => {
    const reel = truthReel(k3.dubo);
    for (const t of k3.dubo.truths) expect(reel.summary).toContain(t.summary);
    expect(reel.reveal).toBe(k3.dubo.truths[k3.dubo.truths.length - 1].reveal);
  });
});

describe('斬的結算：第一、二章不變（liqi）', () => {
  it('第一章：斬一律戾氣 +1、有冤再 +1；不動威名', () => {
    startChapter('wanjia');
    const ch1 = CHAPTERS.wanjia;
    const R1 = { slayRule: ch1.slayRule, chase: ch1.chase };
    const innocent = Object.values(ch1.cases).find((k) => k.innocent)!;
    const guilty = Object.values(ch1.cases).find((k) => !k.innocent)!;
    expect(slayGhost(r(), guilty, R1).liqi).toBe(1);
    expect(slayGhost(r(), innocent, R1).liqi).toBe(2);
    expect(r().weiming).toBe(0);
    expect(r().flags[`wronged_${innocent.id}`]).toBe(true);
  });
});

describe('鬼看到隊伍的反應（moodOf／ghostMood）', () => {
  it('第三章：威名 ≥2 看到就跑（追回 1 時辰）；戾氣讓牠躲時風火輪追（0 時辰、怨氣 +1）', () => {
    startChapter('xinying');
    const id = 'hutou';
    const t = k3[id].timid;
    expect(ghostMood(r(), id)).toBe('normal');
    r().weiming = 1;
    expect(ghostMood(r(), id)).toBe('normal');
    r().weiming = 2;
    expect(ghostMood(r(), id)).toBe('scared');
    expect(collectHours(r(), id)).toBe(CATCH_HOURS);
    r().weiming = 0;
    r().liqi = t;
    expect(ghostMood(r(), id)).toBe('hiding');
    expect(collectHours(r(), id)).toBe(0);
    expect(collectGrudge('hiding', R3)).toBe(1);
    // 戾氣的逃走最重：威名再高也追不回
    r().liqi = t + 1;
    r().weiming = 4;
    expect(ghostMood(r(), id)).toBe('fled');
  });

  it('威名的逃跑蓋過戾氣的躲（D4）', () => {
    expect(moodOf({ liqi: 1, weiming: 2 }, 1, R3)).toBe('scared');
    expect(approachHours('scared', R3)).toBe(1);
    expect(approachHours('hiding', R3)).toBe(0);
    expect(approachHours('normal', R3)).toBe(0);
  });

  it('第一、二章：威名不影響；躲起來要花 1 時辰勸出來、沒有風火輪', () => {
    for (const id of ['wanjia', 'dongjin']) {
      const ch = CHAPTERS[id];
      const R = { slayRule: ch.slayRule, chase: ch.chase };
      expect(moodOf({ liqi: 0, weiming: 5 }, 1, R)).toBe('normal');
      expect(approachHours('hiding', R)).toBe(1);
      expect(collectGrudge('hiding', R)).toBe(0);
      expect(impsFlee({ weiming: 5 }, R)).toBe(false);
    }
  });

  it('前方清單的花費文字：威名嚇跑、風火輪', () => {
    startChapter('xinying');
    const e: Encounter = { kind: 'ghost', id: 'x', place: '市場後巷', caseId: 'hutou' };
    expect(summary(r(), e).cost).toBe('收容佔 1 格');
    r().weiming = 2;
    expect(summary(r(), e).cost).toBe('見隊伍就跑・追回 1 時辰');
    r().weiming = 0;
    r().liqi = k3.hutou.timid;
    expect(summary(r(), e).cost).toBe('躲著・風火輪追（怨氣 +1）');
  });
});

describe('威名的其他效果', () => {
  it('威名 ≥1：路上的小妖看到隊伍自己逃', () => {
    startChapter('xinying');
    const imp = Object.values(ch3.days).flatMap((p) => [...p.pre, ...p.routes.flatMap((x) => x.encounters)]).find((x) => x.kind === 'imp')!;
    expect(impsFlee(r(), R3)).toBe(false);
    expect(summary(r(), imp).cost).toBe('乾坤圈・不花時辰');
    r().weiming = 1;
    expect(impsFlee(r(), R3)).toBe(true);
    expect(summary(r(), imp).cost).toBe('見隊伍就逃');
  });

  it('惡鬼夜審開場氣焰：威名 2 → -1、4 → -2（D3）', () => {
    expect([0, 1, 2, 3, 4, 5].map(flareCut)).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it('畫面上的威名說明依門檻變化', () => {
    expect(weimingText(0)).toBe('還沒人怕太子');
    expect(weimingText(1)).toContain('小妖');
    expect(weimingText(2)).toContain('氣焰 -1');
    expect(weimingText(4)).toContain('氣焰 -2');
  });
});

describe('北營看相', () => {
  it('十惡「不用問了」、冤魂「水裡有話」、真惡「該斬。但牠身上有東西」', () => {
    startChapter('xinying');
    for (const k of Object.values(k3)) {
      const n = natureOf(k);
      expect(isLooked(r(), k.id)).toBe(false);
      expect(lookAt(r(), k), k.id).toBe(LOOK_LINE[n]);
      expect(isLooked(r(), k.id)).toBe(true);
    }
    // 營旗格上的也一起標記
    expect(r().held.every((h) => h.looked)).toBe(true);
  });

  it('看過相，斬之前的說明才寫得確定', () => {
    startChapter('xinying');
    const before = slayPreview(r(), k3.yamupo, R3);
    expect(before).toContain('冤魂戾氣 +1');
    lookAt(r(), k3.yamupo);
    expect(slayPreview(r(), k3.yamupo, R3)).toMatch(/^有冤/);
    lookAt(r(), k3.shuigui);
    expect(slayPreview(r(), k3.shuigui, R3)).toMatch(/^十惡：威名 \+1/);
    lookAt(r(), k3.hutou);
    expect(slayPreview(r(), k3.hutou, R3)).toContain('拿不到牠身上的線索');
  });
});

describe('第一天會擠：四隻鬼、兩格', () => {
  it('每條路線都會遇到四隻鬼，開局營旗下只剩兩格', () => {
    startChapter('xinying');
    const d1 = ch3.days[1];
    expect(r().slots - r().held.length).toBe(2);
    for (const route of d1.routes) {
      const ghosts = [...d1.pre, ...route.encounters, ...d1.post].filter((e) => e.kind === 'ghost');
      expect(new Set(ghosts.map((e) => (e as Extract<Encounter, { kind: 'ghost' }>).caseId)).size, route.name).toBe(4);
    }
  });
});

describe('白天互嗆的掛勾與成長解鎖卡', () => {
  it('互嗆台詞：每個白天場合都有，每句一行、不太長，說話的是太子或五將', () => {
    const who = new Set(['太子', '章將軍', '霄將軍', '柳將軍', '廉將軍']);
    for (const key of ['depart', 'ring', 'look', 'slay', 'wronged', 'collect', 'chase']) {
      const lib = ch3.banter?.[key];
      expect(lib?.length, key).toBeGreaterThanOrEqual(2);
      for (const set of lib!) {
        for (const l of set) {
          expect(who.has(l.who), `${key}：${l.who}`).toBe(true);
          expect(l.text.includes('\n'), l.text).toBe(false);
          expect([...`${l.who}：${l.text}`].length, l.text).toBeLessThanOrEqual(24);
        }
      }
    }
  });

  it('第一、二章的互嗆不混第三章的說話者（第一、二章熱鬧化第 5 階段起有白天互嗆，見 banter12.test）', () => {
    const ch3who = new Set(['太子', '章將軍', '霄將軍', '柳將軍', '廉將軍']);
    for (const id of ['wanjia', 'dongjin']) {
      for (const sets of Object.values(CHAPTERS[id].banter ?? {})) for (const set of sets) for (const l of set) expect(ch3who.has(l.who), `${id}：${l.who}`).toBe(false);
    }
  });

  it('三天各有一張成長解鎖卡（各將一招、合擊、五營合陣）', () => {
    expect(Object.keys(ch3.unlocks ?? {})).toEqual(['1', '2', '3']);
    expect(ch3.unlocks![2].title).toContain('合擊');
    expect(ch3.unlocks![3].title).toContain('五營合陣');
  });
});
