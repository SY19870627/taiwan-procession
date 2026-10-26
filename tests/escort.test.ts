import { describe, it, expect } from 'vitest';
import { BossBattle, FRONT_MAX } from '../src/core/boss';
import { finaleSetup2 } from '../src/content/ch2/finale';
import { newBelievers2 } from '../src/content/ch2/believers';
import { CASES2, EVIDENCE2 } from '../src/content/ch2/cases';
import { DEFECT_NEEDS } from '../src/content/cases';
import { newRun, type RunState } from '../src/state';

type Policy = { rotate: boolean; spells: boolean; answers: boolean };

function simulate(r: RunState, pol: Policy, seed = 7) {
  const b = new BossBattle({ ...finaleSetup2(r), seed });
  let t = 0;
  let maxGrab = 0;
  let stuck = 0;
  while (!b.result && t < 400) {
    b.step(1 / 30);
    t += 1 / 30;
    maxGrab = Math.max(maxGrab, b.grabbing);
    if (b.shipSpeed <= 0) stuck += 1 / 30;
    for (const e of b.drainEvents()) if (e.type === 'trial') b.answer(e.round, pol.answers);
    if (pol.spells) {
      // 有觸手就用王令押走；陣前妖怪多就放五王火
      if (b.grabbing > 0) b.cast(1);
      const near = b.enemies.filter((e) => e.alive && e.id !== 'tide' && e.x < 960).length;
      if (near >= 3 || b.grabbing >= 2) b.cast(0);
      if (b.front.some((u) => u.hp < u.maxHp * 0.35) || b.palanquin.hp < b.palanquin.maxHp * 0.5) b.skill('pingan');
      if (b.boss.state === 'paw') b.skill('dingfeng');
      if (b.grabbing >= 2) b.skill('shunfeng');
    }
    if (pol.rotate) {
      for (const u of b.front) if (u.hp < u.maxHp * 0.35 && b.front.length > 1) b.swap(u.uid);
      if (b.frontCount() < FRONT_MAX) {
        const c = b.back.filter((x) => x.role === 'melee' && x.hp > x.maxHp * 0.8).sort((a, c2) => c2.hp - a.hp)[0];
        if (c) b.swap(c.uid);
      }
    }
  }
  return { result: b.result, t: Math.round(b.t), prog: Math.round(b.shipProg * 100), hull: Math.round(b.palanquin.hp), alive: b.units.filter((u) => u.alive).length + '/' + b.units.length, maxGrab, stuck: Math.round(stuck) };
}

const mk = (f: (r: RunState) => void) => { const r = newRun(); r.chapter = 'dongjin'; r.b = { ...newBelievers2() }; f(r); return r; };
const avg = (r: RunState, pol: Policy) => {
  const res = [1, 2, 3, 4, 5, 6].map((s) => simulate(r, pol, s));
  return { win: res.filter((x) => x.result === 'subdued').length, res: res.map((x) => `${x.result}@${x.t}s prog${x.prog} hull${x.hull} ${x.alive} grab${x.maxGrab} stuck${x.stuck}`) };
};

describe('第二章：案卷', () => {
  it('每一筆有毛病的記載，補正用的證據種類對得上（塗改→物證、缺頁→文獻、模糊→證詞）', () => {
    for (const k of Object.values(CASES2)) {
      expect(k.dossier?.length).toBe(k.statements.length);
      expect(k.press.length).toBe(k.statements.length);
      for (const t of k.truths) {
        const d = k.dossier![t.stmt];
        expect(d, `${k.id} 第 ${t.stmt + 1} 筆應該有毛病`).toBeTruthy();
        for (const id of t.evidence) {
          expect(EVIDENCE2[id], id).toBeTruthy();
          expect(EVIDENCE2[id].kind, `${k.id}/${id}`).toBe(DEFECT_NEEDS[d!]);
          expect(EVIDENCE2[id].ghost).toBe(k.id);
        }
      }
      // 記載無誤的那一筆不該有真相
      k.dossier!.forEach((d, i) => { if (!d) expect(k.truths.some((t) => t.stmt === i)).toBe(false); });
    }
  });
});

describe('第二章最後一戰：送王平衡', () => {
  it('普通的一輪：只按法術、不換位', () => {
    console.log('ch2 plain/spells only', avg(mk(() => {}), { rotate: false, spells: true, answers: true }));
  });
  it('普通的一輪：換位＋法術', () => {
    console.log('ch2 plain/rotate', avg(mk(() => {}), { rotate: true, spells: true, answers: true }));
  });
  it('什麼都不做（不放法術）會被拖住', () => {
    const o = avg(mk(() => {}), { rotate: true, spells: false, answers: true });
    console.log('ch2 no spells', o);
    expect(o.win).toBeLessThanOrEqual(2);
  });
  it('準備充分：龍骨補好、阿城、交陪、收編三個、審問全對', () => {
    const r = mk((r) => { r.b.hong = 'fixed'; r.b.acheng = 'proud'; r.allied = true; r.flags.recruit_adi = r.flags.recruit_mipo = r.flags.recruit_yigui = true; });
    const o = avg(r, { rotate: true, spells: true, answers: true });
    console.log('ch2 prepared', o);
    expect(o.win).toBe(6);
  });
  it('中等：龍骨補好、審問全對、上船一個', () => {
    const r = mk((r) => { r.b.hong = 'fixed'; r.cases.yigui = { verdict: 'ship', truths: [0, 1, 2] }; });
    const o = avg(r, { rotate: true, spells: true, answers: true });
    console.log('ch2 medium', o);
    expect(o.win).toBeGreaterThanOrEqual(4);
  });
  it('很糟：龍骨帶傷、四個都上船、疫鬼跳船、小妖多、審問全錯、不換位', () => {
    const r = mk((r) => {
      for (const g of ['haibo', 'adi', 'mipo', 'yigui']) r.cases[g] = { verdict: 'ship', truths: [] };
      r.flags.yigui_loose = true; r.bossAdds = 3;
    });
    const o = avg(r, { rotate: false, spells: true, answers: false });
    console.log('ch2 bad', o);
    expect(o.win).toBeLessThanOrEqual(2);
  });
  it('很糟但會換位、重來兩次', () => {
    const r = mk((r) => {
      for (const g of ['haibo', 'adi', 'mipo', 'yigui']) r.cases[g] = { verdict: 'ship', truths: [] };
      r.flags.yigui_loose = true; r.bossAdds = 3; r.retries = 2;
    });
    console.log('ch2 bad/retry2', avg(r, { rotate: true, spells: true, answers: false }));
  });
  it('超渡三個（多三個技能）', () => {
    const r = mk((r) => { for (const g of ['haibo', 'adi', 'mipo']) r.cases[g] = { verdict: 'release', truths: [] }; });
    expect(finaleSetup2(r).skills).toEqual(['dingfeng', 'shunfeng', 'pingan']);
    console.log('ch2 release3', avg(r, { rotate: true, spells: true, answers: true }));
  });
});
