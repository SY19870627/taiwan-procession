/**
 * 第三章第 7 階段：白天擠的程度、最好結局可不可能、點將問罪難度（模擬器見 tests/sim3.ts）。
 * 計畫 §4 階段 7：
 *  - 隨機策略跑三天，統計平均能收幾隻、斬幾隻、錯過幾隻；確認「事情多到處理不來」但最好結局仍可能
 *  - 每案只靠白天各路線能拿到的證據，至少有一條路線組合能查明全部真相
 * 結果記在計畫 §9。
 */
import { describe, it, expect } from 'vitest';
import { play, planBrain, randomBrain, BIG_FOUR, type Stats } from './sim3';
import { CASES3 } from '../src/content/ch3/cases';
import { DAY_PLANS3 } from '../src/content/ch3/days';
import { CARDS3, newBelievers3 } from '../src/content/ch3/believers';
import { CHAPTER3 } from '../src/content/ch3';
import { newRun, run, type RunState } from '../src/state';
import type { Encounter } from '../src/content/days';

const cases = Object.values(CASES3);
const COMBOS: [number, number, number][] = [];
for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) COMBOS.push([a, b, c]);
const tag = (c: number[]) => c.map((x) => '甲乙'[x]).join('');

/** 處理得當：十惡斬或押送；冤魂、真惡審清楚超渡或編入 */
const proper = (st: Stats) => Object.entries(st.verdicts).filter(([id, v]) =>
  CASES3[id].nature === 'wicked' ? v === 'slay' || v === 'escort' : v === 'release' || v === 'recruit').length;

describe('第三章：白天擠的程度（隨機策略 300 局）', () => {
  const N = 300;
  const res: Stats[] = [];
  for (let s = 1; s <= N; s++) res.push(play(randomBrain(s)));
  const avg = (f: (x: Stats) => number) => +(res.reduce((a, x) => a + f(x), 0) / N).toFixed(2);
  const sum = {
    收容: avg((x) => x.collected), 斬: avg((x) => x.slain), 斬錯: avg((x) => x.wrongSlain), 押送: avg((x) => x.escorted),
    超渡編入: avg((x) => x.saved), 錯過: avg((x) => x.missed), 沒判: avg((x) => x.unjudged), 滿了想收: avg((x) => x.fullTimes),
    剩時辰: avg((x) => x.hoursLeft), 證據: avg((x) => x.evidence), 處理得當: avg(proper),
    四大案圓滿: avg((x) => +x.bigFour), 最好結局: avg((x) => +x.best),
  };

  it('統計（寫進計畫 §9）', () => {
    console.log('crowd3 random', sum);
    expect(res.length).toBe(N);
  });

  it('事情多到處理不來：九隻鬼平均處理得當不到一半，每局都有鬼被押送、錯過或斬錯', () => {
    expect(sum.處理得當).toBeLessThan(4.5);
    for (const x of res) expect(9 - proper(x), JSON.stringify(x.verdicts)).toBeGreaterThan(0);
    // 斬錯（冤魂）平均一隻以上：沒看相就斬的代價真的會發生
    expect(sum.斬錯).toBeGreaterThanOrEqual(1);
    // 營旗下五格真的會滿
    expect(res.filter((x) => x.fullTimes > 0).length).toBeGreaterThan(N * 0.3);
  });

  it('隨機亂玩幾乎拿不到最好結局（四大案都圓滿）', () => {
    expect(sum.四大案圓滿).toBeLessThan(0.05);
    expect(sum.最好結局).toBeLessThan(0.05);
  });
});

describe('第三章：最好結局仍可能（會規劃、知道身分的玩家）', () => {
  it('有路線組合能拿到最好結局：四大案超渡或編入、渡伯編入北營帶路、不斬錯、收蛟為坐騎', () => {
    const ok: string[] = [];
    for (const routes of COMBOS) for (const wicked of ['slay', 'escort'] as const) {
      const st = play(planBrain({ routes, targets: BIG_FOUR, wicked, prefer: { dubo: 'recruit' } }));
      if (st.best) ok.push(`${tag(routes)}・十惡${wicked === 'slay' ? '斬' : '押送'}`);
    }
    console.log('crowd3 best', ok);
    expect(ok.length).toBeGreaterThan(0);
    // 但不是每種走法都行：路線選擇有份量
    expect(ok.length).toBeLessThan(COMBOS.length * 2);
  });

  it('九隻全都處理得當：只有少數路線組合做得到，而且時辰幾乎用光', () => {
    const ok: { c: string; left: number }[] = [];
    const wronged = cases.filter((k) => k.nature !== 'wicked').map((k) => k.id);
    for (const routes of COMBOS) for (const wicked of ['slay', 'escort'] as const) {
      const st = play(planBrain({ routes, targets: wronged, wicked, prefer: { dubo: 'recruit' } }));
      if (proper(st) === 9 && st.best) ok.push({ c: `${tag(routes)}${wicked}`, left: st.hoursLeft });
    }
    console.log('crowd3 all9', ok);
    expect(ok.length).toBeGreaterThan(0);
    expect(ok.length).toBeLessThanOrEqual(COMBOS.length / 2);
    // 三天 16 個時辰，最多剩 2 個
    for (const x of ok) expect(x.left).toBeLessThanOrEqual(2);
  });
});

describe('第三章：點將問罪難度', () => {
  it('每案都有路線組合，在時辰限制內查明全部真相（模擬白天＋夜審）', () => {
    for (const k of cases) {
      const ok: string[] = [];
      for (const routes of COMBOS) for (const wicked of ['slay', 'escort'] as const) {
        play(planBrain({ routes, targets: [k.id], wicked, full: true }));
        if ((run.cases[k.id]?.truths.length ?? 0) === k.truths.length) ok.push(`${tag(routes)}${wicked[0]}`);
      }
      console.log('crowd3 truths', k.id, ok.join(' '));
      expect(ok.length, k.id).toBeGreaterThan(0);
    }
  });

  /** 某條路線組合，白天拿得到的證據（黃曆文獻、線索、問話、信徒卡、收容附帶；不含審過才掉的） */
  function dayEvidence(routes: number[]): Set<string> {
    const out = new Set<string>();
    const states: RunState[] = [];
    for (const aling of ['unmet', 'met']) {
      const r = newRun();
      r.chapter = 'xinying';
      r.b = { ...newBelievers3(), aling };
      states.push(r);
    }
    const startHeld = CHAPTER3.startHeld ?? [];
    for (const id of startHeld) for (const e of CASES3[id].onCollect ?? []) out.add(e);
    for (let d = 1; d <= 3; d++) {
      const p = DAY_PLANS3[d];
      for (const id of p.docs) out.add(id);
      const list: Encounter[] = [...p.pre, ...p.routes[routes[d - 1]].encounters, ...p.post];
      for (const e of list) {
        if ((e.kind === 'clue' && !e.needs) || e.kind === 'talk') out.add(e.evidence);
        if (e.kind === 'ghost') for (const id of CASES3[e.caseId].onCollect ?? []) out.add(id);
        if (e.kind === 'person') for (const r of states) for (const o of CARDS3[e.card](r)?.options ?? []) for (const g of o.gives ?? []) out.add(g);
      }
    }
    return out;
  }

  it('每案都有路線組合，光靠白天拿得到的證據（不靠壓一晚、不靠審過才掉的）就對得上每一層真相', () => {
    for (const k of cases) {
      const ok = COMBOS.filter((routes) => {
        const ev = dayEvidence(routes);
        return k.truths.every((_, i) => (k.taunts ?? []).some((t) => t.truth === i && (t.evidence ?? []).some((x) => ev.has(x))));
      });
      // 牠本人也要遇得到（或開局就押著）
      const meet = (routes: number[]) => (CHAPTER3.startHeld ?? []).includes(k.id) || [1, 2, 3].some((d) => {
        const p = DAY_PLANS3[d];
        return [...p.pre, ...p.routes[routes[d - 1]].encounters, ...p.post].some((e) => e.kind === 'ghost' && e.caseId === k.id);
      });
      const both = ok.filter(meet);
      console.log('crowd3 static', k.id, both.map(tag).join(' '));
      expect(both.length, k.id).toBeGreaterThan(0);
    }
  });

  it('紙紮童：第 7 階段補的「紙香爐的訂單」讓「第二天廟埕線＋第三天堤防線」查得完（D89）', () => {
    const t = CASES3.zhizha.taunts!.find((x) => x.truth === 1)!;
    expect(t.evidence).toContain('censer_order');
    expect(DAY_PLANS3[2].routes[0].encounters.some((e) => e.kind === 'clue' && e.evidence === 'censer_order')).toBe(true);
    expect(CHAPTER3.evidence.censer_order.kind).toBe('文獻');
  });
});
