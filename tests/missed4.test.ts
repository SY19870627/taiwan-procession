/**
 * 第四章漏掉收尾（化解版，白天的事）：missed.ts 的 MISSED_END4 → 隔天黃曆的「昨日」（days.ts 的 dawn4）、開爐那頁（finale.ts 的 fordEnd4）。
 * 字照 docs/白砂墩_漏掉收尾對照_v0.1.md 第 2 節「漏掉（化解…）」那一句（去掉【待定】）。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { startChapter } from '../src/content/chapter';
import { CHAPTER4 } from '../src/content/ch4';
import { CARDS4 } from '../src/content/ch4/believers';
import { DAY_PLANS4, dawn4 } from '../src/content/ch4/days';
import { fordEnd4 } from '../src/content/ch4/finale';
import { MISSED_CAP4, MISSED_END4, applyMissedPreset4, missedKeys4, missedLines4 } from '../src/content/ch4/missed';
import { applyBroadcast, poolFor } from '../src/core/procession';
import type { Encounter } from '../src/content/days';
import * as state from '../src/state';

const r = () => state.run;
const DOC = Object.values(import.meta.glob(['../docs/白砂墩_漏掉收尾對照_v0.1.md'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>)[0];

beforeEach(() => startChapter('baishadun'));

/** 什麼都沒做的一局：每天出現的信徒卡全略過、鬼不帶、留在轎邊、不稟報；日落選 b1／b2（決定第二、三天出現哪些事） */
function allSkipped(b1: string, b2: string): state.RunState {
  startChapter('baishadun');
  const x = r();
  const pick = [b1, b2];
  for (const d of [1, 2, 3]) {
    const plan = DAY_PLANS4[d];
    const pool = poolFor(plan, x.follow!.tags);
    const rt = plan.routes.find((t) => t.id === plan.follow!.goes)!;
    const all: Encounter[] = [...pool.pre, ...rt.encounters, ...plan.follow!.rest.encounters, ...pool.post];
    for (const e of all) if (e.kind === 'person' && CARDS4[e.card](x)?.missed) x.flags[`missed_${e.card}`] = true;
    x.follow!.betResult = 'stay';
    if (d <= 2) applyBroadcast(x, d, plan.broadcast!.find((o) => o.id === pick[d - 1])!);
  }
  return x;
}

const B1 = ['garage', 'xiuzhi', 'none'];
const B2 = ['jinmiao2', 'truck2', 'none2'];

describe('第四章漏掉收尾（化解版）', () => {
  it('沒有【待定】；每一句都照文件第 2 節的字', () => {
    expect(Object.keys(MISSED_END4).length).toBeGreaterThanOrEqual(40);
    for (const [k, s] of Object.entries(MISSED_END4)) {
      expect(s, k).not.toContain('【待定】');
      expect(s.length, k).toBeGreaterThan(10);
      expect(DOC.includes(`漏掉（化解・`) && DOC.includes(s), k).toBe(true);
    }
  });

  it('搞笑、jump scare 的項目不在這裡（阿睿的行動電源、點人頭的阿伯、賢仔和巴士、提燈的）', () => {
    for (const k of ['arui1', 'diantou2', 'xianzai3', 'tideng3']) expect(MISSED_END4[k], k).toBeUndefined();
  });

  it('什麼都沒做的一局：每一句都會寫進那天的「昨日」（所有傳消息的組合合起來）；dawn4 最多 6 句、信徒卡優先', () => {
    const seen = new Set<string>();
    for (const b1 of B1) for (const b2 of B2) {
      const x = allSkipped(b1, b2);
      for (const d of [1, 2, 3]) {
        const keys = missedKeys4(x, d);
        const out = dawn4(x, d);
        expect(out.length, `${b1}/${b2} 第${d}天`).toBeLessThanOrEqual(MISSED_CAP4);
        expect(out, `${b1}/${b2} 第${d}天`).toEqual(keys.slice(0, MISSED_CAP4).map((k) => MISSED_END4[k]));
        expect(out.join('')).not.toContain('【待定】');
        // 不截斷的話全部都在
        expect(missedLines4(x, d, 99)).toEqual(keys.map((k) => MISSED_END4[k]));
        // 信徒卡排在前面
        const cards = keys.filter((k) => CARDS4[k]);
        expect(keys.slice(0, cards.length)).toEqual(cards);
        for (const k of keys) seen.add(k);
      }
    }
    for (const k of Object.keys(MISSED_END4)) expect(seen.has(k), k).toBe(true);
  });

  it('略過的信徒卡：只略過那一張的話，它一定在「昨日」裡', () => {
    for (const b1 of B1) for (const b2 of B2) {
      const x = allSkipped(b1, b2);
      for (const d of [1, 2, 3]) {
        for (const k of missedKeys4(x, d).filter((c) => CARDS4[c])) {
          // 其他信徒卡都當成辦過：這一句一定排得進前 6
          const y = structuredClone(x);
          for (const c of missedKeys4(x, d)) if (c !== k && CARDS4[c]) delete y.flags[`missed_${c}`];
          expect(dawn4(y, d), `${b1}/${b2} ${k}`).toContain(MISSED_END4[k]);
        }
      }
    }
  });

  it('有做就不寫：辦過的卡、押中、找到證據、帶了鬼、稟報過、有拍', () => {
    const x = r();
    x.flags.bet_hit_1 = true;
    x.flags.cleared_stray1a = true;
    x.evidence.push('stove');
    x.cases.caoxie = { truths: [] };
    x.cases.apo = { truths: [] };
    x.follow!.reports.aman1 = false;
    x.follow!.broadcast[1] = 'garage';
    expect(dawn4(x, 1)).toEqual([MISSED_END4.oajian1]);
    x.flags.clue_oajian = true;
    expect(dawn4(x, 1)).toEqual([]);
    x.flags.missed_aman1 = true;
    expect(dawn4(x, 1)).toEqual([MISSED_END4.aman1]);
  });

  it('第三天的寫進開爐那頁（fordEnd4）；什麼都不拍的話渡頭路的牽路仔不出現、不寫', () => {
    const x = allSkipped('none', 'none2');
    expect(missedKeys4(x, 3)).not.toContain('stray3a');
    fordEnd4(x);
    expect(x.yesterday).toEqual(dawn4(x, 3));
    expect(x.yesterday.length).toBe(MISSED_CAP4);
    const y = allSkipped('none', 'jinmiao2');
    expect(missedKeys4(y, 3)).toContain('stray3a');
    expect(missedKeys4(y, 3)).toContain('kneel3');
  });

  it('爽Game：寫昨日不改任何數值', () => {
    const x = allSkipped('none', 'none2');
    const before = JSON.stringify(x);
    for (const d of [1, 2, 3]) dawn4(x, d);
    expect(JSON.stringify(x)).toBe(before);
    expect(CHAPTER4.dawn).toBe(dawn4);
  });

  it('開發用 &preset=missed：前幾天當成什麼都沒做，「昨日」是最後一天的', () => {
    applyMissedPreset4(r(), 1);
    expect(r().flags.missed_aman1).toBe(true);
    expect(r().yesterday).toEqual(dawn4(r(), 1));
    expect(r().yesterday.length).toBe(MISSED_CAP4);
    startChapter('baishadun');
    applyMissedPreset4(r(), 3);
    expect(r().follow!.broadcast).toEqual({ 1: 'none', 2: 'none2' });
    expect(r().flags.missed_flag2).toBe(true);
    expect(r().flags.missed_count3).toBe(true);
    expect(r().held).toEqual([]);
    expect(r().cases).toEqual({});
    expect(r().yesterday).toEqual(dawn4(r(), 3));
    startChapter('baishadun');
    applyMissedPreset4(r(), 0);
    expect(r().yesterday).toEqual([]);
  });
});
