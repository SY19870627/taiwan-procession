/**
 * 第四章最後一戰「渾水溪・茫渡」（core/boss.ts 的 ford 模式）：規則與第 A 輪初版平衡模擬（照 tests/jiao.test.ts 的做法）。
 *  - 茫渡不打人：拉住前排第一個（換位掙開）、起霧、學人講話叫走水裡的人；
 *  - 人鏈（傳消息＋幫過的信徒）每段拉住一次；喊名把人喊回來；揮頭旗打散剛要起的霧；
 *  - 一般打法贏得了；人鏈越長，被帶到下游沙洲的人越少；
 *  - 對鬼不斬（斬只對茫渡）；判對歸處的鬼才會來幫忙。
 */
import { describe, it, expect } from 'vitest';
import { BossBattle, CHAIN_TIME, FORD_HOME, FRONT_MAX, SPELLS, type BossSetup } from '../src/core/boss';
import { FINALE_ROUNDS4, GHOST_MEMBERS4, MEMBER_STATS4, WAVES4, finaleSetup4, fordEnd4, fordGhosts } from '../src/content/ch4/finale';
import { CHAPTER4 } from '../src/content/ch4';
import { hasSlay, rightVerdict } from '../src/core/guihu';
import { newRun, newFollow, type RunState } from '../src/state';
import { CH4_BATTLE_FILES, CH4_FORD_BG } from '../src/art/baishadunSpec';

const ch4Run = (f?: (r: RunState) => void): RunState => {
  const r = newRun();
  r.chapter = 'baishadun';
  r.b = CHAPTER4.newBelievers();
  r.follow = newFollow();
  f?.(r);
  return r;
};

/**
 * human：像真人一樣每 2 秒看一次——有人被叫走就喊名、霧要起就揮頭旗、血少的前排退下來換有血的近戰。
 * noCall：完全不按法術、不換位（看人鏈自己拉得住幾個）。
 */
type Policy = 'human' | 'noCall';

function simulate(r: RunState, pol: Policy, seed = 7, over?: Partial<BossSetup>) {
  const b = new BossBattle({ ...finaleSetup4(r), seed, ...over });
  let next = 0;
  const ev: Record<string, number> = {};
  while (!b.result && b.t < 400) {
    b.step(1 / 30);
    for (const e of b.drainEvents()) {
      ev[e.type] = (ev[e.type] ?? 0) + 1;
      if (e.type === 'trial') b.answer(e.round, true);
    }
    if (pol !== 'human' || b.t < next) continue;
    next = b.t + 2;
    if (b.lure) b.cast(0);
    if (b.boss.state === 'paw') b.cast(1);
    const low = b.front.find((u) => u.hp < u.maxHp * 0.35);
    const fresh = b.back.find((u) => u.role === 'melee' && u.hp > u.maxHp * 0.8);
    if (low && fresh && b.frontCount() > 1) b.swap(low.uid);
    else if (fresh && b.frontCount() < FRONT_MAX) b.swap(fresh.uid);
  }
  return { b, result: b.result, t: Math.round(b.t), stranded: b.stranded.length, saved: b.saved.length, ev };
}

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

describe('渾水溪・茫渡：設定', () => {
  it('ford 模式；兵馬自己的兩招（喊名、揮頭旗）；四隊兵馬：近戰前三上前排、弓在後排', () => {
    const s = finaleSetup4(ch4Run());
    expect(s.mode).toBe('ford');
    expect(s.spells).toEqual(['huming', 'huiqi']);
    expect(SPELLS.huming.name).toBe('喊名');
    expect(s.waves).toBe(WAVES4);
    expect(s.members.map((m) => m.stats.key)).toEqual(['qianshao', 'yawei', 'bingma', 'gongshou']);
    expect(s.members.map((m) => m.row)).toEqual(['front', 'front', 'front', 'back']);
    expect(s.ford!.chain).toBe(0);
    expect(s.ford!.stragglers.length).toBeGreaterThan(0);
    expect(new BossBattle({ ...s, seed: 1 }).boss.id).toBe('mangdu');
  });

  it('人鏈段數＝傳消息加的（follow.chain）＋幫過的信徒；幫過的人不在被叫走的名單', () => {
    const r = ch4Run((x) => { x.follow!.chain = 2; x.b.aman = 'walked'; x.b.ahan = 'wrapped'; });
    const s = finaleSetup4(r);
    expect(s.ford!.chain).toBe(4);
    expect(s.ford!.stragglers).not.toContain('阿滿姨');
    expect(s.ford!.stragglers).not.toContain('阿翰');
  });

  it('判對歸處的鬼才會來（帶錯的不來）；假香燈腳判「不帶」是對的，但不會來', () => {
    expect(fordGhosts(ch4Run())).toEqual([]);
    const r = ch4Run((x) => {
      x.cases.caoxie = { truths: [1], verdict: 'tobeijin' };
      x.cases.apo = { truths: [0], verdict: 'here' };
      x.cases.xinniang = { truths: [0], verdict: 'tobeijin' };
      x.cases.jiajiao = { truths: [0], verdict: 'leave' };
    });
    expect(fordGhosts(r)).toEqual(['caoxie', 'apo']);
    expect(finaleSetup4(r).members.map((m) => m.stats.key)).toEqual(['qianshao', 'yawei', 'bingma', 'gongshou', 'caoxie', 'apo']);
    expect(GHOST_MEMBERS4).not.toContain('jiajiao');
    expect(rightVerdict(CHAPTER4.cases.jiajiao)).toBe('leave');
    for (const k of GHOST_MEMBERS4) expect(MEMBER_STATS4[k], k).toBeDefined();
  });

  it('陣前審問三輪在 70／40／10%；最後一輪說動才能喚回', () => {
    const b = new BossBattle({ ...finaleSetup4(ch4Run()), seed: 1 });
    expect(b.trialMarks).toEqual([0.7, 0.4, 0.1]);
    expect(FINALE_ROUNDS4).toHaveLength(3);
    expect(CHAPTER4.finale.ends.find((e) => e.kind === 'recall')!.needLast).toBe(true);
  });
});

describe('渾水溪・茫渡：規則', () => {
  const base = (over?: Partial<BossSetup>) => new BossBattle({ ...finaleSetup4(ch4Run()), seed: 3, ...over });
  const until = (b: BossBattle, cond: () => boolean, sec = 60) => {
    const end = b.t + sec;
    while (!cond() && b.t < end && !b.result) b.step(1 / 30);
  };

  it('茫渡不打人：拉住前排第一個（不能出手、不扣血）；換位就掙開', () => {
    const b = base({ waves: [] });
    until(b, () => (b.front[0]?.hold ?? 0) > 0);
    const u = b.front[0];
    expect(u.hold).toBeGreaterThan(0);
    expect(u.hp).toBe(u.maxHp);
    const ev = b.drainEvents().map((e) => e.type);
    expect(ev).toContain('hold');
    expect(ev).not.toContain('palanquin');
    expect(b.swap(u.uid)).toBe(true);
    expect(u.hold).toBe(0);
  });

  it('學人講話叫走一個人：人鏈在 CHAIN_TIME 秒拉住（用掉一段）；沒有人鏈就被帶到下游', () => {
    const withChain = base({ waves: [], ford: { ...finaleSetup4(ch4Run()).ford!, chain: 1 } });
    until(withChain, () => !!withChain.lure);
    const name = withChain.lure!.name;
    until(withChain, () => !withChain.lure, CHAIN_TIME + 0.5);
    expect(withChain.saved).toContain(name);
    expect(withChain.chainLeft).toBe(0);
    expect(withChain.drainEvents().map((e) => e.type)).toContain('chainHold');

    const none = base({ waves: [] });
    until(none, () => !!none.lure);
    const who = none.lure!.name;
    until(none, () => !none.lure, 10);
    expect(none.stranded).toEqual([who]);
  });

  it('喊名：有人正被叫走時才能按，按了他就回來', () => {
    const b = base({ waves: [] });
    expect(b.canSpell(0)).toBe(false);
    until(b, () => !!b.lure);
    const name = b.lure!.name;
    expect(b.cast(0)).toBe(true);
    expect(b.lure).toBeNull();
    expect(b.saved).toContain(name);
    expect(b.drainEvents().map((e) => e.type)).toContain('called');
  });

  it('霧起有預告；預告中揮頭旗，霧起不來（直接現出渡船喘息）', () => {
    const b = base({ waves: [] });
    until(b, () => b.boss.state === 'paw', 60);
    expect(b.boss.state).toBe('paw');
    expect(b.boss.x).toBe(FORD_HOME);
    expect(b.cast(1)).toBe(true);
    expect(b.boss.state).toBe('breath');
    const t0 = b.t;
    until(b, () => b.t > t0 + 1);
    expect(b.drainEvents().map((e) => e.type)).not.toContain('charge');
  });

  it('前排沒人時，茫渡才把水裡的隊伍往回拉', () => {
    const b = base({ waves: [] });
    for (const u of [...b.front]) b.swap(u.uid);
    until(b, () => b.palanquin.hp < b.palanquin.maxHp, 20);
    expect(b.palanquin.hp).toBeLessThan(b.palanquin.maxHp);
  });
});

describe('渾水溪・茫渡：平衡模擬（第 A 輪初版）', () => {
  it('一般打法（human）贏得了：8 個亂數種子至少 7 次在天亮前打贏', () => {
    const res = SEEDS.map((s) => simulate(ch4Run(), 'human', s));
    const wins = res.filter((x) => x.result === 'subdued').length;
    expect(wins, res.map((x) => `${x.result}@${x.t}s 下游${x.stranded}`).join(' ')).toBeGreaterThanOrEqual(7);
  });

  it('什麼都不按也打得完（茫渡不打人；輸贏看的是有沒有人被帶走）', () => {
    const res = SEEDS.map((s) => simulate(ch4Run(), 'noCall', s));
    expect(res.filter((x) => x.result === 'subdued').length).toBeGreaterThanOrEqual(6);
  });

  it('人鏈越長，被帶到下游的人越少（同一個種子、同樣不按喊名）', () => {
    for (const seed of [1, 4, 7]) {
      const ford = finaleSetup4(ch4Run()).ford!;
      const short = simulate(ch4Run(), 'noCall', seed, { ford: { ...ford, chain: 0 } });
      const long = simulate(ch4Run(), 'noCall', seed, { ford: { ...ford, chain: ford.stragglers.length } });
      expect(short.stranded, `seed ${seed}`).toBeGreaterThan(0);
      expect(long.stranded, `seed ${seed}`).toBe(0);
      expect(long.stranded).toBeLessThan(short.stranded);
    }
  });

  it('實際的人鏈（傳消息＋幫過的信徒）也一樣：幫過人的那一局被帶走的比較少', () => {
    const lonely = simulate(ch4Run(), 'noCall', 5);
    const helped = simulate(ch4Run((x) => { x.follow!.chain = 2; x.b.aman = 'walked'; x.b.ahan = 'wrapped'; x.b.xiuzhi = 'noted'; }), 'noCall', 5);
    expect(helped.stranded).toBeLessThan(lonely.stranded);
  });

  it('被帶到下游的人：開爐那頁黃曆「昨日」寫他們的名字；沒有人被帶走就不寫', () => {
    const r = ch4Run();
    const { b } = simulate(r, 'noCall', 2);
    fordEnd4(r, b);
    expect(r.follow!.sandbar).toEqual(b.stranded);
    if (b.stranded.length) {
      expect(r.yesterday.length).toBe(1);
      for (const n of b.stranded) expect(r.yesterday[0]).toContain(n);
    }
    const r2 = ch4Run();
    fordEnd4(r2, new BossBattle({ ...finaleSetup4(r2), seed: 1 }));
    expect(r2.yesterday).toEqual([]);
  });
});

describe('渾水溪・茫渡：對鬼不斬、斬只對茫渡', () => {
  it('四個鬼都沒有斬的判決；最後一戰的判決才有斬（對茫渡）', () => {
    for (const k of Object.values(CHAPTER4.cases)) expect(hasSlay(k), k.id).toBe(false);
    expect(CHAPTER4.finale.bossName).toBe('茫渡');
    expect(CHAPTER4.finale.ends.map((e) => e.kind)).toContain('slay');
    expect(CHAPTER4.slayRule).toBeUndefined();
  });
});

const RAW = import.meta.glob(['../src/art/*.ts', '../src/scenes/*.ts', '../docs/第四章_美術接點清單.md'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const raw = (end: string) => RAW[Object.keys(RAW).find((p) => p.endsWith(end))!];

describe('渾水溪・茫渡：畫面與美術接點', () => {
  it('戰鬥圖 b4_* 有暫代、AssetScene 會載入並蓋掉；整張夜景 bg_ford 有載、BossScene 沒圖時用程式畫的', () => {
    const art = raw('/art/baishadun.ts');
    for (const k of CH4_BATTLE_FILES) expect(art.includes(`'${k}'`), k).toBe(true);
    const asset = raw('/scenes/AssetScene.ts');
    expect(asset).toMatch(/CH4_BATTLE_FILES[\s\S]*replaceTexture/);
    expect(asset).toContain('CH4_FORD_BG');
    expect(CH4_FORD_BG).toBe('bg_ford');
    const boss = raw('/scenes/BossScene.ts');
    expect(boss).toContain('drawFord');
    expect(boss).toContain("'b4_mangdu_boat'");
    expect(boss).toContain("'b4_renlian'");
  });

  it('開場轎子先過溪（st_jiao4_ford），之後只剩對岸一點粉紅；戰場上沒有轎可以點', () => {
    const boss = raw('/scenes/BossScene.ts');
    const crossing = boss.slice(boss.indexOf('  private fordCrossing('), boss.indexOf('  ft(x: number'));
    expect(crossing).toContain("'st_jiao4_ford'");
    expect(crossing).toContain('0xf29ab8');
    expect(crossing).not.toContain('setInteractive');
  });

  it('docs/第四章_美術接點清單.md 列了 bg_ford 與每張 b4_* 戰鬥圖', () => {
    const doc = raw('/docs/第四章_美術接點清單.md');
    for (const k of [CH4_FORD_BG, ...CH4_BATTLE_FILES]) expect(doc, k).toContain(k);
  });
});
