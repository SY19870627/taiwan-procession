/**
 * 第四章第 C3 輪（爽Game）：作者規則——「做錯或沒做＝懲罰」的設計，全部改成「做了＝多一點獎勵或演出；沒做＝故事照走」。
 *  - 沒有任何選項、判決、略過、押兵會減少東西，也不會產生「遺憾」的狀態或標籤；
 *  - 押錯：時辰變化 0；
 *  - 做了的事加獎勵（旗標、回宮／開爐多出來的人影、最後一戰畫面上的鬼）；
 *  - 第一～三章的行為不變。
 * 清單與【待定】見 _agent/c3-report.md。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CHAPTERS, startChapter } from '../src/content/chapter';
import { CHAPTER4 } from '../src/content/ch4';
import { CARDS4, chainSegments4, helped4 } from '../src/content/ch4/believers';
import { CASES4 } from '../src/content/ch4/cases';
import { finaleSetup4, fordGhosts, rewards4 } from '../src/content/ch4/finale';
import { REWARD_CROWD_MAX4, rewardCrowd4 } from '../src/content/stage/ch4';
import { STAGES } from '../src/content/stage';
import { BossBattle } from '../src/core/boss';
import { GUIHU_VERDICTS, judgeGuihu, makeRoom, rightVerdict } from '../src/core/guihu';
import {
  BET_LOSS, STAY, applyBroadcast, betResultText, report, resolveBet, resolveStray, skipStray, spendHours, strayChoices,
} from '../src/core/procession';
import type { DayPlan, Encounter } from '../src/content/days';
import type { RunState } from '../src/state';
import * as state from '../src/state';

const r = () => state.run;
const RAW = import.meta.glob(['../src/scenes/*.ts', '../src/content/ch4/*.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const raw = (end: string) => RAW[Object.keys(RAW).find((p) => p.endsWith(end))!];

beforeEach(() => startChapter('baishadun'));

type Imp = Extract<Encounter, { kind: 'imp' }>;
type Person = Extract<Encounter, { kind: 'person' }>;

function allEncounters(p: DayPlan): Encounter[] {
  return [
    ...p.pre, ...p.routes.flatMap((x) => x.encounters), ...p.post,
    ...(p.follow?.detour?.encounters ?? []), ...(p.follow?.rest.encounters ?? []),
    ...(p.tagged ?? []).flatMap((t) => t.encounters),
  ];
}
const DAYS = [1, 2, 3].map((d) => CHAPTER4.days[d]);
const persons = (p: DayPlan) => allEncounters(p).filter((e): e is Person => e.kind === 'person');
const imps = (p: DayPlan) => allEncounters(p).filter((e): e is Imp => e.kind === 'imp');

/** 「好東西」：只能變多、不能變少 */
function gains(x: RunState) {
  return {
    chain: chainSegments4(x),
    helped: helped4(x).length,
    rewards: rewards4(x),
    evidence: x.evidence.length,
    ferry: finaleSetup4(x).bellyWound ? 1 : 0,
  };
}
/** 最後一戰的數值（畫面用的人鏈、被叫的名單、鬼的影子、白天證據的加成都拿掉）：做什麼、不做什麼都一樣 */
function battle(x: RunState): string {
  const s = finaleSetup4(x);
  return JSON.stringify({ ...s, bellyWound: false, ford: { ...s.ford!, chain: 0, stragglers: [], ghosts: [] } });
}
function expectNoLess(before: ReturnType<typeof gains>, after: ReturnType<typeof gains>, what: string): void {
  for (const k of Object.keys(before) as (keyof typeof before)[]) expect(after[k], `${what}：${k}`).toBeGreaterThanOrEqual(before[k]);
}
/** 沒有遺憾：因果簿沒有 bad、信徒錄不是圓滿就有標籤（不會落到 EndScene 預設的「遺憾」）、「昨日」是空的、字裡沒有「遺憾」 */
function expectNoRegret(x: RunState, what: string): void {
  for (const l of CHAPTER4.ledger(x)) {
    expect(l.tone, `${what}：因果簿 ${l.who}`).not.toBe('bad');
    expect(l.state + l.who, what).not.toContain('遺憾');
  }
  for (const e of [...CHAPTER4.epitaphs(x), ...CHAPTER4.ghostEpitaphs(x), CHAPTER4.finalEpitaph(x)]) {
    expect(e.good || !!e.tag, `${what}：信徒錄 ${e.who}`).toBe(true);
    expect(e.tag ?? '', what).not.toBe('遺憾');
    expect(e.text, what).not.toContain('遺憾');
  }
  for (const d of [1, 2, 3]) expect(CHAPTER4.dawn(x, d), `${what}：昨日 ${d}`).toEqual([]);
  expect(x.follow?.strayed ?? 0, what).toBe(0);
  expect(x.liqi, what).toBe(0);
  expect(x.bossAdds, what).toBe(0);
}

describe('C3-1. 押兵：押錯時辰變化 0；押中多一筆獎勵', () => {
  for (const p of DAYS) {
    const f = p.follow!;
    it(`${p.title}：三種押法都不會讓時辰變少；押錯 gained 0、結果那句沒有「少 1 時辰」`, () => {
      for (const bet of [...p.routes.map((x) => x.id), STAY]) {
        for (const h of [0, 2, p.hours]) {
          startChapter('baishadun');
          r().day = p.day;
          r().hours = h;
          const before = gains(r());
          const o = resolveBet(r(), p, bet);
          expect(o.gained!, `${p.day} ${bet} ${h}`).toBeGreaterThanOrEqual(0);
          expect(r().hours).toBeGreaterThanOrEqual(h);
          if (o.result === 'miss') {
            expect(o.delta).toBe(0);
            expect(o.gained).toBe(0);
            expect(r().hours).toBe(h);
          }
          const said = betResultText(f, o);
          expect(said).not.toContain('少 1 時辰');
          expect(said).not.toContain('遺憾');
          expectNoLess(before, gains(r()), `${p.day} ${bet}`);
          expectNoRegret(r(), `${p.day} ${bet}`);
          expect(battle(r())).toBe(battle(state.newRun()));
        }
      }
      expect(BET_LOSS).toBe(0);
      // 押兵的小字也不寫「少 1 時辰」
      for (const b of Object.values(f.bets!)) expect(b.small).not.toContain('少 1 時辰');
    });

    it(`${p.title}：押中記 bet_hit、回宮／開爐多一個人影`, () => {
      r().day = p.day;
      const before = rewards4(r());
      expect(resolveBet(r(), p, f.goes).result).toBe('hit');
      expect(r().flags[`bet_hit_${p.day}`]).toBe(true);
      expect(rewards4(r())).toBe(before + 1);
    });
  }
});

describe('C3-2. 略過：故事照走，什麼都不扣', () => {
  it('略過每一張信徒卡（DayScene 記的 missed 旗標）：好東西不變、最後一戰一樣、沒有遺憾、「昨日」是空的', () => {
    let n = 0;
    for (const p of DAYS) {
      for (const e of persons(p)) {
        startChapter('baishadun');
        r().day = p.day;
        const c = CARDS4[e.card](r());
        if (!c) continue;
        const before = gains(r());
        const fight = battle(r());
        if (c.missed) r().flags[`missed_${e.card}`] = true;
        expect(gains(r()), e.id).toEqual(before);
        expect(battle(r()), e.id).toBe(fight);
        expectNoRegret(r(), `略過 ${e.id}`);
        expect(c.ignore, e.id).not.toContain('遺憾');
        n++;
      }
    }
    expect(n).toBeGreaterThan(20);
  });

  it('全部略過（三天每張卡都略過）也一樣：沒有 bad、沒有遺憾', () => {
    for (const p of DAYS) for (const e of persons(p)) r().flags[`missed_${e.card}`] = true;
    expectNoRegret(r(), '全部略過');
  });

  it('略過每一隻牽路仔：狀態完全不變（沒有沒跟上的人數、不加小妖）；略過那句不寫遺憾', () => {
    for (const p of DAYS) {
      for (const e of imps(p)) {
        startChapter('baishadun');
        r().day = p.day;
        const before = JSON.stringify(r());
        skipStray(r());
        expect(JSON.stringify(r()), e.id).toBe(before);
        expect(finaleSetup4(r()).extraWaves).toBe(0);
      }
    }
    const rule = CHAPTER4.imp;
    expect(rule.mode).toBe('stray');
    if (rule.mode === 'stray') expect(rule.skip).not.toContain('遺憾');
  });

  it('沒帶的鬼：信徒錄標「路過」，不是遺憾', () => {
    for (const e of CHAPTER4.ghostEpitaphs(r())) {
      expect(e.good).toBe(false);
      expect(e.tag).toBeTruthy();
      expect(e.tag).not.toBe('遺憾');
    }
  });
});

describe('C3-3. 信徒卡的每個選項：只會加，不會減', () => {
  it('三天每張卡、每個選項（含稟報、託點心站）：好東西不減、最後一戰一樣、沒有遺憾', () => {
    let n = 0;
    for (const p of DAYS) {
      for (const e of persons(p)) {
        startChapter('baishadun');
        const c0 = CARDS4[e.card](r());
        if (!c0) continue;
        for (let i = 0; i < c0.options.length; i++) {
          startChapter('baishadun');
          r().day = p.day;
          r().hours = p.hours;
          r().miracles = 1;
          const o = CARDS4[e.card](r())!.options[i];
          const before = gains(r());
          const fight = battle(r());
          spendHours(r(), o.hours);
          if (o.report) report(r(), o);
          const said = o.apply(r());
          expect(said, `${e.id} ${o.label}`).not.toContain('遺憾');
          expect(o.result, `${e.id} ${o.label}`).not.toContain('遺憾');
          expectNoLess(before, gains(r()), `${e.id} ${o.label}`);
          expect(battle(r()), `${e.id} ${o.label}`).toBe(fight);
          expectNoRegret(r(), `${e.id} ${o.label}`);
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(40);
  });

  it('秀枝：第一天沒讓押尾記下，第二、三天的選項不多扣時辰', () => {
    for (const card of ['xiuzhi2', 'xiuzhi3'] as const) {
      startChapter('baishadun');
      const lost = CARDS4[card](r())!.options.filter((o) => !o.report).map((o) => o.hours);
      startChapter('baishadun');
      r().b.xiuzhi = 'noted';
      const noted = CARDS4[card](r())!.options.filter((o) => !o.report).map((o) => o.hours);
      expect(lost, card).toEqual(noted);
    }
  });

  it('第二天稟報秀枝不再記成「沒辦」', () => {
    r().miracles = 1;
    const o = CARDS4.xiuzhi2(r())!.options.find((x) => x.report)!;
    report(r(), o);
    o.apply(r());
    expect(r().flags.missed_xiuzhi2).toBeUndefined();
    expectNoRegret(r(), '稟報秀枝');
  });

  it('做了加獎勵：辦成的小事、喊回來（或託點心站顧）的牽路仔，回宮／開爐多一個人影', () => {
    const before = rewards4(r());
    CARDS4.shoes2(r())!.options[0].apply(r());
    expect(rewards4(r())).toBe(before + 1);
    const D1 = CHAPTER4.days[1];
    const a = imps(D1).find((x) => x.id === 'stray1a')!;
    expect(resolveStray(r(), a, '甲', 'shout', 1)).toBe(true);
    expect(r().flags.stray_stray1a).toBe(true);
    expect(rewards4(r())).toBe(before + 2);
    const b = imps(D1).find((x) => x.id === 'stray1b')!;
    expect(strayChoices(r(), b, '乙', 1).some((c) => c.how === 'entrust')).toBe(true);
    expect(resolveStray(r(), b, '乙', 'entrust', 1)).toBe(true);
    expect(rewards4(r())).toBe(before + 3);
  });
});

describe('C3-4. 問歸處：判到哪裡都不會減少東西、不會有遺憾；判對了多一個幫手的影子', () => {
  const night = (id: string) => (['caoxie', 'apo'].includes(id) ? 1 : 2);

  it('每個鬼、每種歸處：最後一戰數值一樣、好東西不減、沒有遺憾；滿了旗後面多一格（不會擠掉之後的鬼）', () => {
    const fresh = state.newRun();
    // 第三天的小咖鬼（等船的人、提燈的）不問歸處（第三夜不開審，帶著過溪就是獎勵），不在這裡判
    for (const k of Object.values(CASES4).filter((x) => !['dengchuan', 'tideng'].includes(x.id))) {
      for (const verdict of GUIHU_VERDICTS) {
        const v = k.verdicts.find((x) => x.verdict === verdict);
        if (!v) continue;
        startChapter('baishadun');
        r().cases[k.id] = { truths: k.truths.map((_, i) => i) };
        r().held.push({ id: k.id, grudge: 0 });
        const before = gains(r());
        const lines = judgeGuihu(r(), k, v, CHAPTER4.guihu!, night(k.id));
        const what = `${k.id} ${verdict}`;
        for (const s of [...lines, v.after ?? '', v.result]) expect(s, what).not.toContain('遺憾');
        expect(battle(r()), what).toBe(battle(fresh));
        expectNoLess(before, gains(r()), what);
        expectNoRegret(r(), what);
        // 再塞滿：makeRoom 之後一定還有一格
        while (r().held.length < r().slots) r().held.push({ id: `x${r().held.length}`, grudge: 0 });
        makeRoom(r());
        expect(r().slots - r().held.length, what).toBeGreaterThanOrEqual(1);
        expect(r().held.every((h) => h.grudge === 0)).toBe(true);
      }
    }
  });

  it('判對了才多：鬼案四個、小咖鬼兩個判對，回宮／開爐多一個人影；草鞋丁、阿婆、新娘判對，最後一戰畫面上多一個鬼的影子（不上場）', () => {
    const fresh = rewards4(state.newRun());
    for (const id of ['caoxie', 'apo', 'xinniang', 'jiajiao', 'diantou', 'guqi']) {
      const k = CASES4[id];
      const right = rightVerdict(k)!;
      for (const verdict of GUIHU_VERDICTS) {
        startChapter('baishadun');
        r().cases[id] = { truths: k.truths.map((_, i) => i), verdict };
        expect(rewards4(r()), `${id} ${verdict}`).toBe(fresh + (verdict === right ? 1 : 0));
      }
    }
    startChapter('baishadun');
    r().cases.caoxie = { truths: [1], verdict: 'tobeijin' };
    r().cases.apo = { truths: [0], verdict: 'here' };
    r().cases.xinniang = { truths: [2], verdict: 'tohome' };
    const s = finaleSetup4(r());
    expect(fordGhosts(r())).toEqual(['caoxie', 'apo', 'xinniang']);
    expect(s.ford!.ghosts).toEqual(['caoxie', 'apo', 'xinniang']);
    expect(s.members.map((m) => m.stats.key)).toEqual(['qianshao', 'yawei', 'bingma', 'gongshou']);
    expect(battle(r())).toBe(battle(state.newRun()));
  });

  it('對照錯了不加怨氣（TrialScene 的問歸處分支）；夜裡的說明不寫「怨氣 +1」', () => {
    const trial = raw('/scenes/TrialScene.ts');
    expect(trial).toContain("const calm = T.style === 'guihu';");
    expect(trial).toContain('if (calm) this.wrongN[k.id] = (this.wrongN[k.id] ?? 0) + 1;');
    expect(trial).toContain('else held.grudge = Math.min(3, held.grudge + 1);');
    expect(CHAPTER4.trial.style).toBe('guihu');
    expect(CHAPTER4.trial.rule).not.toContain('怨氣 +1');
    expect(CHAPTER4.trial.wrongTail).not.toContain('怨氣 +1');
  });

  it('DayScene：第四章頭旗下滿了也帶得走（makeRoom），別章照舊擋', () => {
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain('const full = run.held.length >= run.slots && !CH().guihu;');
    expect(day).toContain('if (!this.busy && CH().guihu) makeRoom(run);');
  });
});

describe('C3-5. 傳消息、最後一戰：沒有會減少的選項', () => {
  it('每天傳消息的每個選項，人鏈都不會變少', () => {
    for (const p of DAYS) {
      for (const o of p.broadcast ?? []) {
        startChapter('baishadun');
        r().follow!.chain = 3;
        applyBroadcast(r(), p.day, o);
        expect(r().follow!.chain, `${p.day} ${o.id}`).toBeGreaterThanOrEqual(3);
        expect(o.chain).toBeGreaterThanOrEqual(0);
        expect(o.cost).not.toContain('−1');
      }
    }
  });

  it('陣前審問說不動茫渡：不加任何懲罰（mods 不變）；第一章照舊攻擊 ×1.1', () => {
    const b = new BossBattle({ ...finaleSetup4(r()), seed: 1 });
    const m = { ...b.mods };
    for (const round of [1, 2, 3]) b.answer(round, false);
    expect(b.mods).toEqual(m);
    expect(CHAPTER4.finale.wrong).not.toContain('厚了一層');
    startChapter('wanjia');
    const b1 = new BossBattle({ ...CHAPTERS.wanjia.finale.setup(r()), seed: 1 });
    b1.answer(1, false);
    expect(b1.mods.atk).toBeCloseTo(1.1, 5);
  });

  it('斬茫渡：信徒錄標「斬」，不是遺憾；喚回、送回是圓滿', () => {
    for (const end of ['recall', 'return', 'slay'] as const) {
      r().shijuEnd = end;
      const e = CHAPTER4.finalEpitaph(r());
      expect(e.good || e.tag === '斬', end).toBe(true);
      expect(e.tag ?? '').not.toBe('遺憾');
    }
  });
});

describe('C3-6. 回宮／開爐：做了的事多站幾個人（只是畫面）', () => {
  it('rewardCrowd4：0 沒有、越多越多、最多 REWARD_CROWD_MAX4；在畫面裡、名字不和腳本撞', () => {
    for (const at of ['huigong4', 'kailu4'] as const) {
      expect(rewardCrowd4(0, at)).toEqual([]);
      for (let n = 1; n <= REWARD_CROWD_MAX4; n++) expect(rewardCrowd4(n, at)).toHaveLength(n);
      expect(rewardCrowd4(99, at)).toHaveLength(REWARD_CROWD_MAX4);
      const ids = new Set(STAGES[at].actors.map((a) => a.id));
      for (const a of rewardCrowd4(REWARD_CROWD_MAX4, at)) {
        expect(ids.has(a.id), a.id).toBe(false);
        expect(a.x).toBeGreaterThanOrEqual(0);
        expect(a.x).toBeLessThanOrEqual(720);
        for (const b of STAGES[at].beats) expect((b.moves ?? []).some((m) => m.id === a.id)).toBe(false);
      }
    }
  });

  it('STAGES.huigong4／kailu4.crowd：押中、喊回牽路仔、判對歸處，人就多一點；什麼都沒做是 0', () => {
    for (const at of ['huigong4', 'kailu4']) {
      startChapter('baishadun');
      expect(STAGES[at].crowd!(r())).toHaveLength(0);
      r().flags.bet_hit_1 = true;
      const one = STAGES[at].crowd!(r()).length;
      r().flags.stray_stray1a = true;
      r().cases.apo = { truths: [0], verdict: 'here' };
      const three = STAGES[at].crowd!(r()).length;
      expect(one).toBe(1);
      expect(three).toBe(3);
    }
  });
});

describe('C3-7. 【待定】暫代字都換成作者的正式文字了', () => {
  it('第四章內容檔、押兵說明、BossScene 都沒有【待定】開頭的字串（_agent/ch4-text-shuang-A.md）', () => {
    for (const [f, src] of Object.entries(RAW)) {
      if (!f.includes('/content/ch4/') && !f.endsWith('/core/procession.ts') && !f.endsWith('/scenes/BossScene.ts')) continue;
      expect([...src.matchAll(/['`](【待定】[^'`]*)['`]/g)].map((m) => m[1]), f).toEqual([]);
    }
  });
});

describe('C3-8. 第一～三章不變', () => {
  it('沒有問歸處、沒有跟轎：makeRoom、牽路仔、押兵的改動碰不到', () => {
    for (const id of ['wanjia', 'dongjin', 'xinying']) {
      const C = CHAPTERS[id];
      expect(C.guihu, id).toBeUndefined();
      expect(C.trial.style, id).not.toBe('guihu');
      expect(C.imp.mode, id).not.toBe('stray');
      expect(C.follow, id).toBeUndefined();
      startChapter(id);
      expect(r().slots, id).toBe(C.slots ?? 3);
    }
  });

  it('第一章：沒驅散的小妖照舊加最後一戰的波數；信徒錄的信徒沒有標籤（照舊圓滿／遺憾）', () => {
    startChapter('wanjia');
    r().bossAdds = 2;
    expect(CHAPTERS.wanjia.finale.setup(r()).extraWaves).toBe(2);
    for (const e of CHAPTERS.wanjia.epitaphs(r())) expect(e.tag, e.who).toBeUndefined();
  });

  it('第二章的「隨船」照舊算在信徒錄的總結裡；EndScene 只把「隨船」算成隨船', () => {
    expect(raw('/scenes/EndScene.ts')).toContain("ghosts.filter((e) => e.tag === '隨船').length");
    startChapter('dongjin');
    for (const e of CHAPTERS.dongjin.ghostEpitaphs(r())) if (e.tag) expect(e.tag).toBe('隨船');
  });
});
