/**
 * 第四章漏掉收尾（化解版，白天的事）：missed.ts 的 MISSED_END4 → 隔天黃曆的「昨日」（days.ts 的 dawn4）、開爐那頁（finale.ts 的 fordEnd4）。
 * 字照 docs/白砂墩_漏掉收尾對照_v0.1.md 第 2 節「漏掉（化解…）」那一句（去掉【待定】）。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { startChapter } from '../src/content/chapter';
import { CHAPTER4 } from '../src/content/ch4';
import { CARDS4 } from '../src/content/ch4/believers';
import { CASES4 } from '../src/content/ch4/cases';
import { DAY_PLANS4, dawn4, verdictEffects4 } from '../src/content/ch4/days';
import { fordEnd4, fordResult4 } from '../src/content/ch4/finale';
import {
  FINALE_WRONG_FUN4, MISSED_CAP4, MISSED_END4, MISSED_FINALE4, MISSED_FUN4, MISSED_NIGHT4,
  applyMissedPreset4, dayEndMissed4, finaleMissed4, missedKeys4, missedLines4,
} from '../src/content/ch4/missed';
import {
  APO_SCARE_LINE4, SCARE_APO4, SCARE_FLAG4, SCARE_MAX_MS4, SCARE_TIDENG4, TIDENG_SCARE4,
  scareMs4, shouldScareApo4, shouldScareTideng4, tidengMissed4,
} from '../src/content/ch4/missed';
import { CUTSCENES4 } from '../src/content/ch4/story';
import { BossBattle } from '../src/core/boss';
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

// ---------- 第 B 步：搞笑（當場播）、問歸處、最後一戰 ----------

/** 判對的歸處（cases.ts 的 dests：有 needs 的那一個） */
const right = (id: string) => CASES4[id].verdicts.find((v) => v.needs)!.verdict;
const wrongOf = (id: string) => CASES4[id].verdicts.find((v) => !v.needs)!.verdict;
/** 文件裡有這一句（去掉【待定】以後） */
const inDoc = (s: string) => DOC.replace(/【待定】/g, '').includes(s);

describe('第四章漏掉收尾（第 B 步）', () => {
  it('沒有【待定】；字照文件第 2 節', () => {
    const all = [
      ...Object.values(MISSED_FUN4),
      ...Object.values(MISSED_NIGHT4).flatMap((m) => [m.verdict, m.truths].filter((s): s is string => !!s)),
      ...Object.values(MISSED_FINALE4),
      ...FINALE_WRONG_FUN4.map((l) => l.text),
    ];
    for (const s of all) {
      expect(s).not.toContain('【待定】');
      // 送回那一句照文件備註換了第二句
      if (s === MISSED_FINALE4.noSlayReturn) continue;
      expect(inDoc(s), s).toBe(true);
    }
    expect(MISSED_FINALE4.noSlayReturn).toContain('牠撐了最後一篙，船頭碰到了岸');
  });

  it('分配表：N1-1 化解、N1-2 搞笑、N1-3 化解、N2-1 化解、N2-2 化解、N2-3 化解、N2-4 搞笑；N1-4（jump scare）不在這裡', () => {
    const pick = (head: string, kind: string) => {
      const sec = DOC.slice(DOC.indexOf(`#### ${head}`));
      const line = sec.split(/\r?\n/).find((l) => l.startsWith(`- 漏掉・${kind}`))!;
      return line.replace(/^- 漏掉・[^：]+：(【待定】)?/, '').trim();
    };
    expect(MISSED_NIGHT4.caoxie.verdict).toBe(pick('N1-1', '化解版'));
    expect(MISSED_NIGHT4.caoxie.truths).toBe(pick('N1-2', '搞笑版'));
    expect(MISSED_NIGHT4.apo.verdict).toBe(pick('N1-3', '化解版'));
    expect(MISSED_NIGHT4.apo.truths).toBeUndefined();
    expect(MISSED_NIGHT4.xinniang.verdict).toBe(pick('N2-1', '化解版'));
    expect(MISSED_NIGHT4.xinniang.truths).toBe(pick('N2-2', '化解版'));
    expect(MISSED_NIGHT4.jiajiao.verdict).toBe(pick('N2-3', '化解版'));
    expect(MISSED_NIGHT4.jiajiao.truths).toBe(pick('N2-4', '搞笑版'));
  });

  it('問歸處：判到別處或真相沒對出來，判決之後的字接上那一句；判對而且真相都對出來就不接', () => {
    const items: [id: string, key: 'verdict' | 'truths'][] = [
      ['caoxie', 'verdict'], ['caoxie', 'truths'], ['apo', 'verdict'],
      ['xinniang', 'verdict'], ['xinniang', 'truths'], ['jiajiao', 'verdict'], ['jiajiao', 'truths'],
    ];
    for (const [id, key] of items) {
      const line = MISSED_NIGHT4[id][key]!;
      const all = CASES4[id].truths.map((_, i) => i);
      // 漏掉：判到別處（真相都對出來）／判對但真相沒對出來
      startChapter('baishadun');
      r().cases[id] = { truths: key === 'verdict' ? all : all.slice(0, -1) };
      const v = key === 'verdict' ? wrongOf(id) : right(id);
      expect(CHAPTER4.verdictEffects(r(), id, v), `${id} ${key}`).toContain(line);
      // 有做：判對、真相都對出來
      startChapter('baishadun');
      r().cases[id] = { truths: all };
      const done = CHAPTER4.verdictEffects(r(), id, right(id));
      expect(done, `${id} 判對`).not.toContain(line);
      expect(done, `${id} 判對`).toEqual([]);
    }
    // 判到別處、真相也沒對出來：兩句都接（中間空一行）
    startChapter('baishadun');
    r().cases.caoxie = { truths: [] };
    expect(verdictEffects4(r(), 'caoxie', 'leave')).toEqual(['', MISSED_NIGHT4.caoxie.verdict, '', MISSED_NIGHT4.caoxie.truths]);
    // 阿婆的真相（N1-4 jump scare）不在這裡：判對、真相沒對出來不多播
    startChapter('baishadun');
    r().cases.apo = { truths: [] };
    expect(verdictEffects4(r(), 'apo', right('apo'))).toEqual([]);
  });

  it('白天的搞笑（1-01、2-03、3-14）：什麼都沒做的一局，那天日落各播一次；有做就不播', () => {
    for (const b1 of B1) for (const b2 of B2) {
      const x = allSkipped(b1, b2);
      expect(CHAPTER4.dayEndMissed!(x, 1), `${b1}/${b2}`).toEqual([MISSED_FUN4.arui1]);
      expect(CHAPTER4.dayEndMissed!(x, 2), `${b1}/${b2}`).toEqual([MISSED_FUN4.diantou2]);
      expect(CHAPTER4.dayEndMissed!(x, 3), `${b1}/${b2}`).toEqual([MISSED_FUN4.xianzai3]);
    }
    startChapter('baishadun');
    const x = r();
    x.cases.diantou = { truths: [] };
    for (const d of [1, 2, 3]) expect(dayEndMissed4(x, d)).toEqual([]);
    // 搞笑的不寫進「昨日」
    const y = allSkipped('none', 'none2');
    for (const d of [1, 2, 3]) for (const s of Object.values(MISSED_FUN4)) expect(dawn4(y, d)).not.toContain(s);
    // 點人頭的阿伯帶了、判到別處：判決之後播同一句
    expect(verdictEffects4(x, 'diantou', 'leave')).toContain(MISSED_FUN4.diantou2);
    expect(verdictEffects4(x, 'diantou', right('diantou'))).toEqual([]);
  });

  it('最後一戰：F-2 說不動茫渡當場播；其他寫在開爐那頁「昨日」（第三天白天的後面）', () => {
    expect(CHAPTER4.finale.wrongLines).toBe(FINALE_WRONG_FUN4);
    const x = allSkipped('none', 'none2');
    const day3 = dawn4(x, 3);
    const b = new BossBattle({ ...CHAPTER4.finale.setup(x), seed: 4 });
    b.answer(1, false);
    b.answer(2, false);
    b.walkedBack.push('黃金水');
    CHAPTER4.finale.onEnd!(x, b, 'return');
    const F = MISSED_FINALE4;
    expect(x.yesterday).toEqual([...day3, F.ferry, F.chain, F.huming, F.rounds, F.noSlayReturn, F.almostNone]);
    // 斬：沒有 F-5、F-6
    fordEnd4(x, fordResult4(b, 'slay'));
    expect(x.yesterday).toEqual([...day3, F.ferry, F.chain, F.huming, F.almostNone]);
    // 全部有做：只剩第三天白天的
    const y = allSkipped('none', 'none2');
    y.evidence.push('mooring');
    const res = { kind: 'recall' as const, asked: { 1: true, 2: true, 3: true }, walkedBack: [] };
    expect(finaleMissed4(res, { knowsFerry: true, chain: 2, rewards: 3, helped: 2 })).toEqual([F.noSlay]);
    // 不給戰鬥結果（舊的呼叫）照舊只有第三天白天的
    fordEnd4(y);
    expect(y.yesterday).toEqual(dawn4(y, 3));
  });

  it('爽Game：漏掉收尾只寫字，不改任何數值', () => {
    const x = allSkipped('none', 'none2');
    const before = JSON.stringify(x);
    for (const id of Object.keys(MISSED_NIGHT4)) for (const v of CASES4[id].verdicts) verdictEffects4(x, id, v.verdict);
    for (const d of [1, 2, 3]) dayEndMissed4(x, d);
    expect(JSON.stringify(x)).toBe(before);
  });
});

describe('第四章 jump scare（N1-4 阿婆、3-13 提燈的）', () => {
  it('字照文件第 2 節的 jump scare 版／漏掉版', () => {
    expect(DOC).toContain(APO_SCARE_LINE4);
    expect(DOC).toContain(TIDENG_SCARE4.say);
    expect(DOC).toContain(TIDENG_SCARE4.after);
  });

  it('每次的畫面都 < 2 秒', () => {
    expect(SCARE_MAX_MS4).toBe(2000);
    expect(scareMs4(SCARE_APO4)).toBeLessThan(SCARE_MAX_MS4);
    expect(scareMs4(SCARE_TIDENG4)).toBeLessThan(SCARE_MAX_MS4);
    for (const t of [SCARE_APO4, SCARE_TIDENG4]) for (const v of Object.values(t)) expect(v).toBeGreaterThan(0);
    // 阿婆：先暗半拍、臉停半秒
    expect(SCARE_APO4.dark).toBeLessThan(SCARE_APO4.face);
    expect(SCARE_APO4.face).toBe(500);
  });

  it('N1-4：第一夜、判的是阿婆、還有真相沒對出來才嚇；沒請來、對齊了、別夜、別的鬼、播過了都不嚇', () => {
    const x = r();
    const all = CASES4.apo.truths.map((_, i) => i);
    expect(all.length).toBeGreaterThan(0);
    expect(shouldScareApo4(x, 'apo', { truths: [] }, 1)).toBe(true);
    expect(shouldScareApo4(x, 'apo', { truths: all.slice(0, -1) }, 1)).toBe(true);
    // 重複的不算對出來
    expect(shouldScareApo4(x, 'apo', { truths: all.map(() => 0) }, 1)).toBe(all.length > 1);
    expect(shouldScareApo4(x, 'apo', { truths: all }, 1)).toBe(false);
    expect(shouldScareApo4(x, 'apo', undefined, 1)).toBe(false);
    expect(shouldScareApo4(x, 'apo', { truths: [] }, 2)).toBe(false);
    expect(shouldScareApo4(x, 'caoxie', { truths: [] }, 1)).toBe(false);
    x.flags[SCARE_FLAG4.apo] = true;
    expect(shouldScareApo4(x, 'apo', { truths: [] }, 1)).toBe(false);
  });

  it('3-13：第三天沒帶提燈的才嚇（一局一次）；有帶照原本那兩句', () => {
    const x = r();
    expect(tidengMissed4(x)).toBe(true);
    expect(shouldScareTideng4(x)).toBe(true);
    x.flags[SCARE_FLAG4.tideng] = true;
    expect(shouldScareTideng4(x)).toBe(false);
    delete x.flags[SCARE_FLAG4.tideng];
    x.held.push({ id: 'tideng', grudge: 0 });
    expect(tidengMissed4(x)).toBe(false);
    expect(shouldScareTideng4(x)).toBe(false);
  });

  it('mangdu4：起霧以後才嚇；有帶播原本兩句、沒帶播漏掉版（兩邊不重疊）', () => {
    const L = CUTSCENES4.mangdu4.lines;
    const fog = L.findIndex((l) => l.text.startsWith('溪面起霧了'));
    const scare = L.findIndex((l) => l.pre === 'scareTideng4');
    expect(fog).toBeGreaterThanOrEqual(0);
    expect(scare).toBeGreaterThan(fog);
    expect(L[scare].text).toBe(TIDENG_SCARE4.say);
    const shown = (x: state.RunState) => L.filter((l) => !l.when || l.when(x)).map((l) => l.text);
    const x = r();
    expect(shown(x)).toContain(TIDENG_SCARE4.say);
    expect(shown(x)).toContain(TIDENG_SCARE4.after);
    expect(shown(x)).not.toContain('夠亮了。今天晚上不用我的。');
    x.held.push({ id: 'tideng', grudge: 0 });
    expect(shown(x)).toContain('夠亮了。今天晚上不用我的。');
    expect(shown(x)).not.toContain(TIDENG_SCARE4.say);
  });

  it('判斷不改任何狀態', () => {
    const x = r();
    const before = JSON.stringify(x);
    shouldScareApo4(x, 'apo', { truths: [] }, 1);
    shouldScareTideng4(x);
    expect(JSON.stringify(x)).toBe(before);
  });
});
