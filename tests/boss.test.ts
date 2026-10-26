import { describe, it, expect } from 'vitest';
import { BossBattle, FRONT_MAX } from '../src/core/boss';
import { finaleSetup } from '../src/content/finale';
import { newRun, type RunState } from '../src/state';

type Policy = { rotate: boolean; spells: boolean; answers: boolean };

export function simulate(r: RunState, pol: Policy, seed = 7) {
  const b = new BossBattle({ ...finaleSetup(r), seed });
  let t = 0;
  let swaps = 0;
  while (!b.result && t < 400) {
    b.step(1 / 30);
    t += 1 / 30;
    for (const e of b.drainEvents()) if (e.type === 'trial') b.answer(e.round, pol.answers);
    if (pol.spells) {
      if (b.palanquin.hp < b.palanquin.maxHp * 0.5 || b.front.some((u) => u.hp < u.maxHp * 0.35)) b.bless();
      if (b.enemies.filter((e) => e.alive).length >= 4) b.smite();
    }
    if (pol.rotate) {
      // 血少的前排退下來；後排有血的近戰補上去
      for (const u of b.front) if (u.hp < u.maxHp * 0.35 && b.front.length > 1) { if (b.swap(u.uid)) swaps++; }
      if (b.frontCount() < FRONT_MAX) {
        const c = b.back.filter((x) => x.role === 'melee' && x.hp > x.maxHp * 0.8).sort((a, c2) => c2.hp - a.hp)[0];
        if (c && b.swap(c.uid)) swaps++;
      }
    }
  }
  return { result: b.result, t: Math.round(b.t), pal: Math.round(b.palanquin.hp), boss: Math.round(b.boss.hp), alive: b.units.filter((u) => u.alive).length + '/' + b.units.length, swaps };
}

const run = (f: (r: RunState) => void) => { const r = newRun(); f(r); return r; };
const avg = (r: RunState, pol: Policy) => {
  const res = [1, 2, 3, 4, 5, 6].map((s) => simulate(r, pol, s));
  return { win: res.filter((x) => x.result === 'subdued').length, res: res.map((x) => `${x.result}@${x.t}s pal${x.pal} boss${x.boss} ${x.alive} sw${x.swaps}`) };
};

describe('最後一戰平衡', () => {
  it('普通的一輪：只按法術、不換位', () => {
    const o = avg(newRun(), { rotate: false, spells: true, answers: true });
    console.log('plain/spells only', o);
  });
  it('普通的一輪：換位＋法術', () => {
    const o = avg(newRun(), { rotate: true, spells: true, answers: true });
    console.log('plain/rotate', o);
  });
  it('準備充分：交陪、收編三隻鬼、舊傷、小芸、審問全對', () => {
    const r = run((r) => { r.allied = true; r.flags.recruit_biao = r.flags.recruit_gui = r.flags.recruit_tian = true; r.intel.bellyWound = true; r.b.xiaoyun = 'invited'; r.followers = 40; r.morale = 75; });
    const o = avg(r, { rotate: true, spells: true, answers: true });
    console.log('prepared', o);
    expect(o.win).toBe(6);
  });
  it('很糟：暴怒、小妖多 4 波、審問全錯、不換位', () => {
    const r = run((r) => { r.shijuEnraged = true; r.bossAdds = 4; r.morale = 45; });
    const o = avg(r, { rotate: false, spells: true, answers: false });
    console.log('bad', o);
    expect(o.win).toBeLessThanOrEqual(2);
  });
  it('中等：交陪、收編阿標、知道舊傷、審問全對', () => {
    const r = run((r) => { r.allied = true; r.flags.recruit_biao = true; r.intel.bellyWound = true; r.followers = 25; r.morale = 65; });
    console.log('medium/spells', avg(r, { rotate: false, spells: true, answers: true }));
    const o = avg(r, { rotate: true, spells: true, answers: true });
    console.log('medium/rotate', o);
    expect(o.win).toBeGreaterThanOrEqual(5);
    // 什麼都不做（不換位、不放法術）會輸
    expect(avg(r, { rotate: false, spells: false, answers: true }).win).toBeLessThanOrEqual(3);
  });
  it('很糟、重來三次', () => {
    const r = run((r) => { r.shijuEnraged = true; r.bossAdds = 4; r.morale = 45; r.retries = 3; });
    console.log('bad/retry3', avg(r, { rotate: true, spells: true, answers: false }));
  });
  it('很糟但會換位', () => {
    const r = run((r) => { r.shijuEnraged = true; r.bossAdds = 4; r.morale = 45; });
    console.log('bad/rotate', avg(r, { rotate: true, spells: true, answers: false }));
  });
});
