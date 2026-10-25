import { describe, it, expect } from 'vitest';
import { Battle, type BattleSetup, type Side } from '../src/core/battle';
import { NIGHTS, nightSpawns } from '../src/content/nights';
import type { UnitId } from '../src/core/units';
import { palanquinStats, unitStats, type Upgrades } from '../src/core/upgrades';

type Plan = { units: { id: UnitId; level: number; side: Side }[]; pal?: number; boss?: BattleSetup['boss']; miracles?: number; cleared?: boolean; followers: number; morale: number; incense: number; intel?: BattleSetup['intel']; spells?: boolean };

export function simulate(night: number, plan: Plan, seed = 7) {
  const n = NIGHTS[night];
  // 等級 lv 換算成逐項升級：體力、武力都到 lv
  const ups: Upgrades = {};
  for (const u of plan.units) ups[u.id] = { hp: u.level, atk: u.level };
  ups.palanquin = { hp: plan.pal ?? 1 };
  const units = plan.units.map((u) => ({ id: u.id, side: u.side, stats: unitStats(u.id, ups, plan.followers) }));
  const b = new Battle({ mode: n.mode, fieldW: 1280, duration: n.duration, spawns: nightSpawns(night, { miracles: plan.miracles ?? 0, cleared: !!plan.cleared }), boss: plan.boss, units, palanquin: palanquinStats(ups), followers: plan.followers, morale: plan.morale, incense: plan.incense, intel: plan.intel ?? {}, seed });
  let t = 0;
  while (!b.result && t < 400) {
    b.step(1 / 30);
    t += 1 / 30;
    if (plan.spells) {
      if (b.palanquin.hp < b.palanquin.maxHp * 0.5) b.bless();
      if (b.enemies.filter((e) => e.alive).length >= 4) b.smite();
    }
  }
  return { result: b.result, hp: Math.round(b.palanquin.hp), captured: b.captured, t: Math.round(b.t), boss: b.boss ? Math.round(b.boss.hp) : null };
}

const base = (lv = 1): Plan['units'] => [
  { id: 'qiye', level: lv, side: 1 }, { id: 'bajiang', level: lv, side: 1 },
  { id: 'xingshi', level: lv, side: -1 }, { id: 'paoshou', level: lv, side: -1 },
];

describe('平衡', () => {
  it('第一夜：預設布陣、不放法術也能過', () => {
    const r = simulate(1, { units: base(), followers: 12, morale: 60, incense: 40 });
    console.log('night1 default', r);
    expect(r.result).toBe('win');
  });
  it('第一夜：全部擺後方會很危險', () => {
    const r = simulate(1, { units: base().map((u) => ({ ...u, side: -1 as Side })), followers: 12, morale: 60, incense: 0 });
    console.log('night1 all-back', r);
  });
  it('第二夜：預設、有放法術', () => {
    const r = simulate(2, { units: base(), followers: 16, morale: 60, incense: 50, spells: true });
    console.log('night2 default spells', r);
    expect(r.result).toBe('win');
  });
  it('第二夜：不放法術', () => {
    console.log('night2 no spells', simulate(2, { units: base(), followers: 16, morale: 60, incense: 0 }));
  });
  it('第二夜：升級一次＋情報', () => {
    console.log('night2 lv2 intel', simulate(2, { units: base(2), followers: 18, morale: 70, incense: 30, intel: { quakeTip: true }, spells: true }));
  });
  it('第三夜：有交陪、有情報、有法術', () => {
    const units = [...base(2), { id: 'kaijiang' as UnitId, level: 1, side: 1 as Side }];
    const r = simulate(3, { units, followers: 20, morale: 70, incense: 60, intel: { bellyWound: true, longBreath: true }, spells: true });
    console.log('night3 good', r);
    expect(r.result).toBe('win');
  });
  it('第三夜：沒情報', () => {
    const units = [...base(1), { id: 'kaijiang' as UnitId, level: 1, side: 1 as Side }];
    console.log('night3 no intel', simulate(3, { units, followers: 16, morale: 60, incense: 40, spells: true }));
  });
  it('第三夜：升級過、只有一項情報', () => {
    const units = [...base(2), { id: 'kaijiang' as UnitId, level: 1, side: 1 as Side }];
    console.log('night3 lv2 belly only', simulate(3, { units, followers: 18, morale: 65, incense: 45, intel: { bellyWound: true }, spells: true }));
    console.log('night3 lv2 no intel', simulate(3, { units, followers: 18, morale: 65, incense: 45, spells: true }));
  });
  it('白天的選擇對夜戰的影響', () => {
    const units = [...base(2), { id: 'kaijiang' as UnitId, level: 1, side: 1 as Side }];
    const p = { units, followers: 20, morale: 65, incense: 45, intel: { bellyWound: true }, spells: true };
    console.log('night3 normal', simulate(3, p));
    console.log('night3 enraged', simulate(3, { ...p, boss: { atkMul: 1.3, chargeEvery: 6 } }));
    console.log('night3 xiaoyun', simulate(3, { ...p, boss: { hpMul: 0.8, skipCharges: 1 } }));
    console.log('night3 enraged+xiaoyun', simulate(3, { ...p, boss: { atkMul: 1.3, chargeEvery: 6, hpMul: 0.8, skipCharges: 1 } }));
    console.log('night1 miracle', simulate(1, { units: base(), followers: 22, morale: 60, incense: 20, miracles: 1, spells: true }));
    console.log('night1 cleared', simulate(1, { units: base(), followers: 12, morale: 60, incense: 40, cleared: true }));
    console.log('night2 2 miracles', simulate(2, { units: base(2), followers: 30, morale: 60, incense: 30, miracles: 2, spells: true }));
  });
});
