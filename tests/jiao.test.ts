/**
 * 第三章最後一戰「蛟」（core/boss.ts 的 jiao 模式）：規則與初版平衡模擬。
 * 三種策略（docs/第三章_開發計畫.md §2.4 最後一列）：
 *  - spells：只按法術（乾坤圈、太子出轎、技能），完全不換位 → 會輸
 *  - rotate：換位（血少的退下、有血的近戰補上），但不管營旗 → 很辛苦
 *  - flags：照營旗輪換（廉將軍上前插北營旗、翻江前站前排；柳將軍上前插西營旗再退回後排射斷拖人）→ 穩贏
 */
import { describe, it, expect } from 'vitest';
import { BossBattle, CUE_TIME, DRAG_TIME, FLAG_TIME, FRONT_MAX, JIAO_CAMPS, SUNK_TIME, type BossSetup, type Unit } from '../src/core/boss';
import { finaleSetup3, CAMPS3, FULLPOWER_CUES3, MEMBER_STATS3, WAVES3 } from '../src/content/ch3/finale';
import { finaleSetup } from '../src/content/finale';
import { finaleSetup2 } from '../src/content/ch2/finale';
import { newRun, type RunState } from '../src/state';
import { CHAPTER3 } from '../src/content/ch3';

/** human：照營旗輪換，但像真人一樣每 2 秒才看一次：最多換一個人，順手按下冷卻好了的法術、技能 */
type Policy = 'idle' | 'spells' | 'rotate' | 'flags' | 'human';
const HUMAN_PACE = 2;

const ch3Run = (f?: (r: RunState) => void): RunState => {
  const r = newRun();
  r.chapter = 'xinying';
  r.b = CHAPTER3.newBelievers();
  f?.(r);
  return r;
};

function castAll(b: BossBattle): void {
  if (b.enemies.filter((e) => e.alive && e !== b.boss).length >= 3) b.cast(0);
  b.cast(1);
  b.skill('baidu');
  if (b.boss.state === 'paw') b.skill('qunya');
}

/** 照營旗輪換：決定誰該站前排 */
function wantFront(b: BossBattle): Unit[] {
  const js = b.setup.jiao!;
  const alive = b.units.filter((u) => u.alive && !u.taizi && !(u.sunk ?? 0));
  const surge = ['back', 'paw', 'charge'].includes(b.boss.state) || (b.boss.state === 'fight' && b.boss.stateTime > js.surgeEvery - 4);
  const want: Unit[] = [];
  const add = (u?: Unit) => { if (u && !want.includes(u) && want.length < FRONT_MAX) want.push(u); };
  const ok = (u: Unit) => u.hp > u.maxHp * 0.4;
  const lian = alive.find((u) => u.key === 'lian');
  const liu = alive.find((u) => u.key === 'liu');
  if (lian && (surge || !b.planted.north) && (ok(lian) || surge)) add(lian);
  if (liu && !b.planted.west && ok(liu) && !surge) add(liu);
  const melee = alive.filter((u) => u.role === 'melee' && ok(u));
  // 還沒插旗的近戰優先，其次血多的
  melee.sort((a, c) => Number(!!js.camps[c.key] && !b.planted[js.camps[c.key]]) - Number(!!js.camps[a.key] && !b.planted[js.camps[a.key]]) || c.hp / c.maxHp - a.hp / a.maxHp);
  for (const u of melee) add(u);
  return want;
}

export function simulate(r: RunState, pol: Policy, seed = 7, setup?: Partial<BossSetup>) {
  const b = new BossBattle({ ...finaleSetup3(r), ...setup, seed });
  let swaps = 0;
  let next = 0;
  const ev: Record<string, number> = {};
  while (!b.result && b.t < 400) {
    b.step(1 / 30);
    for (const e of b.drainEvents()) {
      ev[e.type] = (ev[e.type] ?? 0) + 1;
      if (e.type === 'trial') b.answer(e.round, r.flags[`ans${e.round}`] !== false);
    }
    if (pol === 'human') {
      if (b.t < next) continue;
      next = b.t + HUMAN_PACE;
      castAll(b);
      const want = wantFront(b);
      const out = b.front.find((u) => !u.taizi && !want.includes(u));
      if (out && b.swap(out.uid)) { swaps++; continue; }
      const inn = want.find((u) => u.row === 'back' && u.moving <= 0);
      if (inn && b.frontCount() < FRONT_MAX && b.swap(inn.uid)) swaps++;
      continue;
    }
    if (pol !== 'idle') castAll(b);
    if (pol === 'rotate') {
      for (const u of b.front) if (!u.taizi && u.hp < u.maxHp * 0.35 && b.frontCount() > 1) { if (b.swap(u.uid)) swaps++; }
      if (b.frontCount() < FRONT_MAX) {
        const c = b.back.filter((x) => x.role === 'melee' && x.hp > x.maxHp * 0.8).sort((a, c2) => c2.hp - a.hp)[0];
        if (c && b.swap(c.uid)) swaps++;
      }
    }
    if (pol === 'flags') {
      const want = wantFront(b);
      for (const u of b.front) if (!u.taizi && !want.includes(u)) { if (b.swap(u.uid)) swaps++; }
      for (const u of want) if (u.row === 'back' && u.moving <= 0 && b.frontCount() < FRONT_MAX) { if (b.swap(u.uid)) swaps++; }
    }
  }
  return {
    result: b.result, t: Math.round(b.t), pal: Math.round(b.palanquin.hp), boss: Math.round(b.boss.hp / b.boss.maxHp * 100),
    alive: `${b.units.filter((u) => u.alive && !u.taizi).length}/${b.units.filter((u) => !u.taizi).length}`,
    swaps, formations: b.formations, ev,
  };
}

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
export const avg = (r: RunState, pol: Policy, setup?: Partial<BossSetup>) => {
  const res = SEEDS.map((s) => simulate(r, pol, s, setup));
  return {
    win: res.filter((x) => x.result === 'subdued').length,
    res: res.map((x) => `${x.result}@${x.t}s pal${x.pal} boss${x.boss}% ${x.alive} sw${x.swaps} 合陣${x.formations} 拖${x.ev.drag ?? 0}/斷${x.ev.cut ?? 0}/落水${x.ev.sunk ?? 0}`),
  };
};

/** 單步跑到條件成立（最多 sec 秒） */
function until(b: BossBattle, cond: () => boolean, sec = 60): void {
  const end = b.t + sec;
  while (!cond() && b.t < end && !b.result) b.step(1 / 30);
}

/** 用小步跑 sec 秒（一次 step 很大會跳過走路、插旗的計時） */
function adv(b: BossBattle, sec: number): void {
  const end = b.t + sec;
  while (b.t < end - 1e-9 && !b.result) b.step(Math.min(1 / 30, end - b.t));
}

const base = (over?: Partial<BossSetup>) => ({ ...finaleSetup3(ch3Run()), seed: 3, ...over });

describe('蛟：設定', () => {
  it('第三章用 jiao 模式、乾坤圈＋太子出轎；第一、二章不變', () => {
    const s = finaleSetup3(ch3Run());
    expect(s.mode).toBe('jiao');
    expect(s.spells).toEqual(['qiankun', 'chujiao']);
    expect(s.waves).toBe(WAVES3);
    expect(s.jiao!.camps).toEqual(CAMPS3);
    expect(s.members.map((m) => m.stats.key)).toEqual(['zhang', 'xiao', 'liu', 'lian']);
    expect(s.members.map((m) => m.row)).toEqual(['front', 'front', 'back', 'back']);
    expect(finaleSetup(newRun()).mode).toBeUndefined();
    expect(finaleSetup2(newRun()).mode).toBe('escort');
  });

  it('五將特性：章 cover、霄 combo、柳 snipe、廉 stun；收編：虎頭扛轎、鴨母婆 ducks、紙紮童 paper', () => {
    expect(MEMBER_STATS3.zhang.trait).toBe('cover');
    expect(MEMBER_STATS3.xiao.trait).toBe('combo');
    expect(MEMBER_STATS3.liu.trait).toBe('snipe');
    expect(MEMBER_STATS3.lian.trait).toBe('stun');
    expect(MEMBER_STATS3.hutou.guard).toBeLessThan(1);
    expect(MEMBER_STATS3.yamupo.trait).toBe('ducks');
    expect(MEMBER_STATS3.zhizha.trait).toBe('paper');
    const r = ch3Run((r) => { r.flags.recruit_hutou = r.flags.recruit_yamupo = r.flags.recruit_zhizha = true; });
    const s = finaleSetup3(r);
    expect(s.members.map((m) => m.stats.key)).toEqual(['zhang', 'xiao', 'liu', 'lian', 'hutou', 'yamupo', 'zhizha']);
    expect(s.members.find((m) => m.stats.key === 'hutou')!.row).toBe('front');
  });

  it('渡伯編入＝知道喘息的弱點；超渡鴨母婆、渡伯＝群鴨陣、擺渡篙；凡人的聲音讓全開變 14 秒', () => {
    expect(finaleSetup3(ch3Run((r) => { r.flags.recruit_dubo = true; })).bellyWound).toBe(true);
    const r = ch3Run((r) => { r.cases.yamupo = { verdict: 'release', truths: [] }; r.cases.dubo = { verdict: 'release', truths: [] }; });
    expect(finaleSetup3(r).skills.sort()).toEqual(['baidu', 'qunya']);
    expect(finaleSetup3(ch3Run()).jiao!.fullTime).toBe(10);
    expect(finaleSetup3(ch3Run((r) => { r.b.aling = 'pacifier'; })).jiao!.fullTime).toBe(14);
    expect(finaleSetup3(ch3Run((r) => { r.b.akai = 'danced'; })).jiao!.fullTime).toBe(14);
  });

  it('略過的小妖、神蹟：蝦兵多幾波（最多 4）；重來一次蛟的力氣少 15%', () => {
    expect(finaleSetup3(ch3Run((r) => { r.bossAdds = 2; })).extraWaves).toBe(2);
    expect(finaleSetup3(ch3Run((r) => { r.bossAdds = 9; })).extraWaves).toBe(4);
    expect(finaleSetup3(ch3Run((r) => { r.retries = 1; })).boss.hpMul).toBeCloseTo(0.85);
  });

  it('全開的字幕：沉默 2 秒 → 章將軍 → 五將齊喊 →（凡人的聲音）→ 太子；都在 CUE_TIME 之前', () => {
    expect(FULLPOWER_CUES3[0].at).toBe(0);
    expect(FULLPOWER_CUES3[1].at).toBe(2);
    expect(FULLPOWER_CUES3[1].text).toContain('弟兄們都在');
    expect(FULLPOWER_CUES3.at(-1)!.text).toContain('我知道我是誰');
    for (const c of FULLPOWER_CUES3) expect(c.at).toBeLessThan(CUE_TIME);
    expect(FULLPOWER_CUES3.filter((c) => c.voice).map((c) => c.voice).sort()).toEqual(['akai', 'aling']);
  });
});

describe('蛟：規則', () => {
  it('翻江：預告 2.5 秒 → 水牆掃過前排；北營廉將軍在前排傷害減半', () => {
    const hurt = (lianFront: boolean) => {
      const s = base();
      if (lianFront) s.members = s.members.map((m) => (m.stats.key === 'lian' ? { ...m, row: 'front' } : m));
      s.waves = [];
      const b = new BossBattle(s);
      until(b, () => b.boss.state === 'paw');
      const paw = b.t;
      until(b, () => b.boss.state === 'charge');
      expect(b.t - paw).toBeGreaterThanOrEqual(2.49);
      const xiao = b.units.find((u) => u.key === 'xiao')!;
      const before = xiao.hp;
      b.drainEvents();
      until(b, () => b.boss.state === 'breath');
      // 只算浪打到霄將軍那一下（扣掉蛟咬的不算：翻江中蛟不咬人）
      return before - xiao.hp;
    };
    const full = hurt(false);
    const half = hurt(true);
    expect(full).toBeGreaterThan(0);
    expect(half).toBeCloseTo(full / 2, 0);
  });

  it('擺渡篙在預告時打斷翻江，直接喘息；群鴨陣擋下整道浪', () => {
    const s = base({ skills: ['baidu', 'qunya'], waves: [] });
    const b = new BossBattle(s);
    expect(b.canSkill('baidu')).toBe(false);
    until(b, () => b.boss.state === 'paw');
    expect(b.skill('baidu')).toBe(true);
    expect(b.boss.state).toBe('breath');
    expect(b.wave).toBeNull();
    // 群鴨陣：浪頭升起時放，鴨群擋下整道浪，前排不掉血
    until(b, () => b.boss.state === 'paw');
    expect(b.skill('qunya')).toBe(true);
    expect(b.canSkill('qunya')).toBe(false);
    until(b, () => b.boss.state === 'charge');
    const hp = b.front.map((u) => u.hp);
    b.drainEvents();
    until(b, () => b.boss.state === 'breath');
    expect(b.drainEvents().some((e) => e.type === 'duck')).toBe(true);
    expect(b.front.map((u) => u.hp)).toEqual(hp);
    expect(b.duckShield).toBe(false);
  });

  it('拖人：柳將軍在後排會射斷；不在就拖下水（重傷、10 秒不能出手）；紙紮童的紙人替身吸收一次', () => {
    // 柳將軍在後排
    let b = new BossBattle(base({ waves: [] }));
    until(b, () => !!b.drag, 30);
    expect(b.drag).not.toBeNull();
    b.drainEvents();
    until(b, () => !b.drag, 5);
    let ev = b.drainEvents().map((e) => e.type);
    expect(ev).toContain('cut');
    expect(ev).not.toContain('sunk');
    // 柳將軍不在場（換成只剩廉將軍在後排）
    const s = base({ waves: [] });
    s.members = s.members.filter((m) => m.stats.key !== 'liu');
    b = new BossBattle(s);
    until(b, () => !!b.drag, 30);
    const victim = b.units.find((u) => u.uid === b.drag!.uid)!;
    expect(victim.key).toBe('lian');
    expect(b.canSwap(victim.uid)).toBe(false);
    const hp = victim.hp;
    until(b, () => !b.drag, DRAG_TIME + 1);
    expect(victim.sunk).toBeGreaterThan(SUNK_TIME - 0.5);
    expect(victim.hp).toBeLessThan(hp - victim.maxHp * 0.35);
    expect(b.canSwap(victim.uid)).toBe(false);
    const timer = victim.timer;
    adv(b, 1);
    expect(victim.timer).toBe(timer);
    // 紙紮童：吸收一次
    const s2 = base({ waves: [] });
    s2.members = s2.members.filter((m) => m.stats.key !== 'liu');
    s2.members.push({ stats: { ...MEMBER_STATS3.zhizha }, row: 'back' });
    b = new BossBattle(s2);
    expect(b.paperLeft).toBe(1);
    until(b, () => !!b.drag, 30);
    b.drainEvents();
    until(b, () => !b.drag, DRAG_TIME + 1);
    ev = b.drainEvents().map((e) => e.type);
    expect(ev).toContain('paper');
    expect(ev).not.toContain('sunk');
    expect(b.paperLeft).toBe(0);
  });

  it('太子出轎：上前排 8 秒、不佔三格、不能點卡片；時間到回轎；冷卻 35 秒', () => {
    const b = new BossBattle(base({ waves: [] }));
    const n = b.frontCount();
    expect(b.cast(1)).toBe(true);
    const tz = b.taiziOut!;
    expect(tz).toBeTruthy();
    expect(b.front[0]).toBe(tz);
    expect(b.frontCount()).toBe(n);
    expect(b.canSwap(tz.uid)).toBe(false);
    expect(b.canSpell(1)).toBe(false);
    until(b, () => !b.taiziOut, 10);
    expect(b.t).toBeGreaterThan(7.9);
    expect(b.t).toBeLessThan(8.2);
    expect(b.spellCd[1]).toBeGreaterThan(25);
  });

  it('乾坤圈：打爆全場蝦兵、對蛟小傷，冷卻 12 秒', () => {
    const b = new BossBattle(base());
    until(b, () => b.enemies.filter((e) => e.alive && e.id === 'xia').length >= 3);
    const hp = b.boss.hp;
    expect(b.cast(0)).toBe(true);
    expect(b.enemies.filter((e) => e.alive && e.id === 'xia').length).toBe(0);
    expect(b.boss.hp).toBeLessThan(hp);
    expect(hp - b.boss.hp).toBeLessThan(b.boss.maxHp * 0.05);
    expect(b.canSpell(0)).toBe(false);
  });

  it('五營合陣：四將在前排連續站滿 5 秒插旗、太子出轎插中營旗；五面插齊蝦兵全清、蛟 -15%，旗子倒下重來', () => {
    const s = base({ waves: [] });
    // 不翻江、不拖人，專心看插旗
    s.jiao = { ...s.jiao!, surgeEvery: 999, dragEvery: 999 };
    s.members = s.members.map((m) => ({ ...m, row: m.stats.key === 'liu' ? 'back' : 'front' }));
    const b = new BossBattle(s);
    adv(b, FLAG_TIME - 0.5);
    expect(b.planted.east).toBe(false);
    adv(b, 0.6);
    expect(b.planted).toMatchObject({ east: true, south: true, north: true, west: false, center: false });
    // 柳將軍上前：要先有人退下（前排最多 3）
    const liu = b.units.find((u) => u.key === 'liu')!;
    expect(b.swap(liu.uid)).toBe(false);
    b.swap(b.units.find((u) => u.key === 'xiao')!.uid);
    adv(b, 2.1);
    expect(b.swap(liu.uid)).toBe(true);
    adv(b, 2.1);
    // 中途退下就重算
    adv(b, 3);
    expect(b.flagProgress.west).toBeGreaterThan(0.5);
    b.swap(liu.uid);
    adv(b, 2.1);
    expect(b.flagProgress.west).toBe(0);
    b.swap(liu.uid);
    adv(b, 2.1 + FLAG_TIME);
    expect(b.planted.west).toBe(true);
    b.enemies.push({ ...b.boss, uid: 999, id: 'xia', hp: 90, maxHp: 90, x: 900, state: 'walk' });
    const hp = b.boss.hp;
    b.cast(1);
    b.drainEvents();
    adv(b, FLAG_TIME + 0.1);
    const ev = b.drainEvents().map((e) => e.type);
    expect(ev).toContain('formation');
    expect(b.formations).toBe(1);
    expect(hp - b.boss.hp).toBeGreaterThanOrEqual(b.boss.maxHp * 0.15);
    expect(b.enemies.filter((e) => e.alive && e !== b.boss).length).toBe(0);
    expect(JIAO_CAMPS.every((c) => !b.planted[c])).toBe(true);
  });

  it('合擊：霄將軍與出轎的太子同在前排，霄將軍出手加倍', () => {
    const s = base({ waves: [] });
    s.jiao = { ...s.jiao!, surgeEvery: 999, dragEvery: 999 };
    const b = new BossBattle(s);
    until(b, () => b.boss.state === 'fight', 10);
    b.drainEvents();
    b.cast(1);
    adv(b, 3);
    expect(b.drainEvents().some((e) => e.type === 'combo')).toBe(true);
  });

  it('章將軍替別人擋蛟一口（5 秒一次）', () => {
    const s = base({ waves: [] });
    s.jiao = { ...s.jiao!, surgeEvery: 999, dragEvery: 999 };
    // 霄將軍站最前面，章將軍第二
    s.members = [s.members[1], s.members[0], s.members[2], s.members[3]];
    const b = new BossBattle(s);
    adv(b, 10);
    expect(b.drainEvents().some((e) => e.type === 'cover')).toBe(true);
  });

  it('鴨母婆的鴨群：蝦兵走得慢', () => {
    const dist = (ducks: boolean) => {
      const s = base();
      if (ducks) s.members = [...s.members, { stats: { ...MEMBER_STATS3.yamupo }, row: 'back' }];
      const b = new BossBattle(s);
      until(b, () => b.enemies.some((e) => e.id === 'xia'), 10);
      const x = b.enemies.find((e) => e.id === 'xia')!;
      const x0 = x.x;
      b.step(1);
      return x0 - x.x;
    };
    expect(dist(true)).toBeCloseTo(dist(false) * 0.7, 0);
  });

  it('陣前審問第 3 輪：戰鬥不停，CUE_TIME 秒後太子全開（攻擊 ×1.5、法術冷卻 ×0.4、出轎可以再用）', () => {
    const s = base({ waves: [] });
    const b = new BossBattle(s);
    b.cast(1);
    b.boss.hp = b.boss.maxHp * 0.09;
    adv(b, 0.2);
    const trials = b.drainEvents().filter((e) => e.type === 'trial');
    expect(trials.length).toBe(3);
    for (const e of trials) if (e.type === 'trial') b.answer(e.round, true);
    expect(b.paused).toBe(false);
    expect(b.cueT).toBe(0);
    b.boss.hp = b.boss.maxHp;
    until(b, () => b.fullT > 0, CUE_TIME + 1);
    expect(b.t).toBeGreaterThan(CUE_TIME);
    expect(b.fullT).toBeCloseTo(10, 0);
    expect(b.spellCd[1]).toBe(0);
    b.cast(0);
    const cd = b.spellCd[0];
    adv(b, 1);
    expect(cd - b.spellCd[0]).toBeCloseTo(2.5, 1);
  });

  it('陣前審問第 2 輪說動：下一次翻江半路散掉', () => {
    const b = new BossBattle(base({ waves: [] }));
    b.answer(2, true);
    until(b, () => b.boss.state === 'charge');
    b.drainEvents();
    until(b, () => b.boss.state === 'breath', 5);
    expect(b.drainEvents().some((e) => e.type === 'callout')).toBe(true);
  });
});

/** 準備很好：收編虎頭、鴨母婆、紙紮童、渡伯（帶路），超渡不到鴨母婆（收編了），阿玲請到奶嘴 */
const good = () => ch3Run((r) => {
  r.flags.recruit_hutou = r.flags.recruit_yamupo = r.flags.recruit_zhizha = r.flags.recruit_dubo = true;
  r.cases.dubo = { verdict: 'recruit', truths: [] };
  r.b.aling = 'pacifier';
});
/** 準備很好（另一種）：超渡鴨母婆與渡伯 → 群鴨陣、擺渡篙兩個技能；收編虎頭 */
const goodRelease = () => ch3Run((r) => {
  r.cases.yamupo = { verdict: 'release', truths: [] };
  r.cases.dubo = { verdict: 'release', truths: [] };
  r.flags.recruit_hutou = true;
  r.b.akai = 'danced';
});
/** 準備很糟：略過小妖、用神蹟，蝦兵多 4 波；陣前審問前兩輪都答錯 */
const bad = (retries = 0) => ch3Run((r) => { r.bossAdds = 4; r.flags.ans1 = r.flags.ans2 = false; r.retries = retries; });
const plain = (retries = 0) => ch3Run((r) => { r.retries = retries; });

/**
 * 平衡定案（第 7 階段）。目標（計畫 §2.4 最後一列）：
 *  只按法術不換位會輸；換位但沒湊齊合陣很辛苦；輪到五營合陣可以穩贏——而且是真人做得到的節奏（human：每 2 秒一個動作）。
 *  準備越好越輕鬆；準備很糟仍有機會；輸了重來（蛟每次 -15%）要越來越容易，重來兩次後連「換位不管旗」也打得過。
 * 結果記在計畫 §9。
 */
describe('蛟：平衡（第 7 階段定案）', () => {
  it('什麼都不做會輸', () => {
    const o = avg(plain(), 'idle');
    console.log('jiao idle', o);
    expect(o.win).toBe(0);
  });
  it('只按法術、不換位：會輸（準備很好也一樣）', () => {
    const o = avg(plain(), 'spells');
    console.log('jiao spells', o);
    expect(o.win).toBe(0);
    expect(avg(good(), 'spells').win).toBeLessThanOrEqual(2);
  });
  it('換位但不管營旗：很辛苦（輸多贏少）', () => {
    const o = avg(plain(), 'rotate');
    console.log('jiao rotate', o);
    expect(o.win).toBeGreaterThanOrEqual(1);
    expect(o.win).toBeLessThanOrEqual(4);
  });
  it('照營旗輪換：穩贏（反應最快的模擬與每 2 秒一個動作的真人節奏都是）', () => {
    const o = avg(plain(), 'flags');
    console.log('jiao flags', o);
    expect(o.win).toBe(SEEDS.length);
    const h = avg(plain(), 'human');
    console.log('jiao human', h);
    expect(h.win).toBeGreaterThanOrEqual(SEEDS.length - 1);
    // 換位次數：真人節奏平均一場 45 次以內、比反應最快的模擬少（第 5 階段初版平均要 50 次以上，§7 Q24）
    const mean = (pol: Policy) => SEEDS.map((s) => simulate(plain(), pol, s).swaps).reduce((a, b) => a + b, 0) / SEEDS.length;
    expect(mean('human')).toBeLessThanOrEqual(45);
    expect(mean('human')).toBeLessThan(mean('flags'));
  });
  it('準備很好（收編三隻鬼＋渡伯帶路＋凡人的聲音／或超渡出兩個技能）照營旗輪換：全勝，而且比沒準備快', () => {
    for (const r of [good, goodRelease]) {
      const o = avg(r(), 'human');
      console.log('jiao prepared/human', o);
      expect(o.win).toBe(SEEDS.length);
    }
    const t = (r: RunState) => SEEDS.map((s) => simulate(r, 'flags', s).t).reduce((a, b) => a + b, 0);
    expect(t(good())).toBeLessThan(t(plain()));
  });
  it('準備很糟（蝦兵多 4 波、審問前兩輪都錯）：照營旗輪換還有機會；不換位必輸', () => {
    const o = avg(bad(), 'flags');
    console.log('jiao bad/flags', o);
    expect(o.win).toBeGreaterThanOrEqual(1);
    expect(avg(bad(), 'spells').win).toBe(0);
    expect(avg(bad(), 'human').win).toBeLessThan(SEEDS.length);
  });
  it('重來：每重來一次更容易；準備很糟重來兩次，真人節奏照營旗輪換也穩贏', () => {
    const w = [0, 1, 2].map((n) => avg(bad(n), 'human').win);
    console.log('jiao bad/human retries 0,1,2', w);
    expect(w[1]).toBeGreaterThanOrEqual(w[0]);
    expect(w[2]).toBeGreaterThanOrEqual(w[1]);
    expect(w[2]).toBeGreaterThanOrEqual(SEEDS.length - 1);
    // 沒準備、重來兩次：換位但不管營旗也多半打得過（給卡關的玩家一條路）
    const r2 = avg(plain(2), 'rotate');
    console.log('jiao plain/rotate retries 2', r2);
    expect(r2.win).toBeGreaterThanOrEqual(5);
  });
});
