/**
 * 第四章最後一戰「渾水溪・茫渡」（core/boss.ts 的 ford 模式）：規則與平衡模擬（照 tests/jiao.test.ts 的做法）。
 * 作者定案（第四章是爽Game）：
 *  - 斬茫渡不加戾氣；
 *  - 沒有遺憾：一定打贏（還是要選喚回／送回／斬），沒有人被帶到下游、沒有人趕不上回宮；
 *  - 人鏈（傳消息＋幫過的信徒）只影響畫面（「越多人只是畫面特效越多而已」），戰鬥的數值、節奏、難度都和人鏈長短無關。
 *  - 茫渡不打人：拉住前排第一個（換位掙開）、起霧、學人講話叫水裡的人（只是氣氛，一定回來）；
 *  - 對鬼不斬（斬只對茫渡）；判對歸處的鬼才會來幫忙。
 */
import { describe, it, expect } from 'vitest';
import { BossBattle, FORD_HOME, FRONT_MAX, SPELLS, type BossSetup } from '../src/core/boss';
import { FINALE_ROUNDS4, GHOST_MEMBERS4, MEMBER_STATS4, WAVES4, chainVisual4, finaleSetup4, fordEnd4, fordGhosts } from '../src/content/ch4/finale';
import { chainSegments4, stragglers4 } from '../src/content/ch4/believers';
import { CUTSCENES } from '../src/content/story';
import { CHAPTER4 } from '../src/content/ch4';
import { CHAPTERS } from '../src/content/chapter';
import { hasSlay, rightVerdict } from '../src/core/guihu';
import { slayBoss } from '../src/core/renown';
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
 * human：像真人一樣每 2 秒看一次——有人被叫就喊名、霧要起就揮頭旗、血少的前排退下來換有血的近戰。
 * noCall：完全不按法術、不換位。
 * empty：開打就把前排全部換下來（最糟的打法：沒有人出手）。
 */
type Policy = 'human' | 'noCall' | 'empty';

/** 每一幀的戰鬥數值快照（不含人鏈的畫面計數、不含事件） */
const snap = (b: BossBattle): string => JSON.stringify([
  +b.t.toFixed(4), b.result, b.boss.hp, b.boss.state, +b.boss.x.toFixed(3), b.palanquin.hp, b.spellCd, b.trialRound, b.mods,
  b.units.map((u) => [u.hp, u.row, u.alive, +(u.hold ?? 0).toFixed(3), +u.x.toFixed(3)]),
  b.enemies.map((e) => [e.id, e.hp, e.alive, +e.x.toFixed(3)]),
  b.lure?.name ?? null,
]);

function simulate(r: RunState, pol: Policy, seed = 7, over?: Partial<BossSetup>, trace?: string[]) {
  const b = new BossBattle({ ...finaleSetup4(r), seed, ...over });
  let next = 0;
  const ev: Record<string, number> = {};
  if (pol === 'empty') for (const u of [...b.front]) b.swap(u.uid);
  while (!b.result && b.t < 400) {
    b.step(1 / 30);
    trace?.push(snap(b));
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
  return { b, result: b.result, t: b.t, saved: b.saved.length, ev };
}

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const withChain = (n: number): Partial<BossSetup> => ({ ford: { ...finaleSetup4(ch4Run()).ford!, chain: n } });

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
    // 沒有「被帶走幾個就輸」的上限
    expect('maxStranded' in s.ford!).toBe(false);
    expect(new BossBattle({ ...s, seed: 1 }).boss.id).toBe('mangdu');
  });

  it('人鏈段數＝傳消息加的（follow.chain）＋幫過的信徒；幫過的人不在被叫的名單', () => {
    const r = ch4Run((x) => { x.follow!.chain = 2; x.b.aman = 'walked'; x.b.ahan = 'wrapped'; });
    const s = finaleSetup4(r);
    expect(s.ford!.chain).toBe(4);
    expect(s.ford!.stragglers).not.toContain('阿滿姨');
    expect(s.ford!.stragglers).not.toContain('阿翰');
  });

  it('人鏈不進任何戰鬥數值：除了 ford.chain／被叫的名單，幫過人和沒幫過人的設定一模一樣', () => {
    const lonely = finaleSetup4(ch4Run());
    const helped = finaleSetup4(ch4Run((x) => { x.follow!.chain = 2; x.b.aman = 'walked'; x.b.ahan = 'wrapped'; x.b.xiuzhi = 'noted'; }));
    const strip = (s: BossSetup) => JSON.stringify({ ...s, ford: { ...s.ford!, chain: 0, stragglers: [] } });
    expect(helped.ford!.chain).toBeGreaterThan(lonely.ford!.chain);
    expect(strip(helped)).toBe(strip(lonely));
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

  it('學人講話叫一個人：不管有沒有人鏈，lureTime 秒後他都回來（同一個時間點）；有人鏈畫成人鏈牽回來，沒有就自己走回來', () => {
    const lureTime = finaleSetup4(ch4Run()).ford!.lureTime;
    const run = (chain: number) => {
      const b = base({ waves: [], ...withChain(chain) });
      until(b, () => !!b.lure);
      const name = b.lure!.name;
      const t0 = b.t;
      b.drainEvents();
      until(b, () => !b.lure, lureTime + 1);
      return { b, name, dt: b.t - t0, ev: b.drainEvents().map((e) => e.type) };
    };
    const one = run(1);
    const none = run(0);
    expect(one.name).toBe(none.name);
    expect(one.dt).toBeCloseTo(none.dt, 5);
    expect(one.dt).toBeGreaterThanOrEqual(lureTime - 0.05);
    expect(one.b.saved).toContain(one.name);
    expect(none.b.saved).toContain(none.name);
    expect(one.ev).toContain('chainHold');
    expect(none.ev).toContain('returned');
    expect(one.b.chainLeft).toBe(0);
    for (const x of [one, none]) {
      expect(x.ev).not.toContain('stranded');
      expect('stranded' in x.b).toBe(false);
    }
  });

  it('喊名：有人正被叫時才能按，按了他就提早回來', () => {
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

  it('前排沒人時，茫渡把水裡的隊伍往回拉（畫面上會晃），但拉不垮：不會輸', () => {
    const b = base({ waves: [] });
    for (const u of [...b.front]) b.swap(u.uid);
    until(b, () => b.palanquin.hp < b.palanquin.maxHp, 20);
    expect(b.palanquin.hp).toBeLessThan(b.palanquin.maxHp);
    b.palanquin.hp = 0.5;
    b.step(1 / 30);
    expect(b.result).not.toBe('lose');
    expect(b.palanquin.hp).toBeGreaterThan(0);
  });

  it('陣前審問說動了：第三輪不再有人被叫（現出渡船）', () => {
    const b = new BossBattle({ ...finaleSetup4(ch4Run()), seed: 3, waves: [] });
    b.answer(3, true);
    expect(b.noLure).toBe(true);
    expect(b.boss.state).toBe('breath');
    const end = b.t + 40;
    while (b.t < end && !b.result) b.step(1 / 30);
    expect(b.lure).toBeNull();
  });
});

describe('渾水溪・茫渡：一定贏（沒有遺憾）', () => {
  it('不管怎麼打、人鏈幾段，每一局都是打贏（subdued），不會輸、不會「天亮了沒打完」', () => {
    for (const pol of ['human', 'noCall', 'empty'] as const) {
      for (const chain of [0, 10]) {
        for (const s of SEEDS) {
          const x = simulate(ch4Run(), pol, s, withChain(chain));
          expect(x.result, `${pol} chain${chain} seed${s}`).toBe('subdued');
        }
      }
    }
  });

  it('一般打法（human）在天亮前就把茫渡的霧打散（8 個種子至少 7 次）', () => {
    const duration = finaleSetup4(ch4Run()).duration;
    const res = SEEDS.map((s) => simulate(ch4Run(), 'human', s));
    expect(res.filter((x) => x.b.boss.hp === 0 && x.t < duration).length, res.map((x) => `${Math.round(x.t)}s`).join(' ')).toBeGreaterThanOrEqual(7);
  });

  it('被叫的人最後都回來了（叫了幾個就回來幾個），沒有沙洲、沒有人趕不上回宮', () => {
    for (const s of SEEDS) {
      const { b, ev } = simulate(ch4Run(), 'noCall', s);
      expect(b.lure).toBeNull();
      expect(b.saved.length, `seed ${s}`).toBe(ev.lure ?? 0);
      expect(ev.stranded).toBeUndefined();
    }
    // 開爐那頁黃曆「昨日」只寫第三天沒辦成的事，沒有沙洲
    const r = ch4Run((x) => { x.flags.missed_ahan3 = true; });
    fordEnd4(r);
    expect(r.yesterday.join('')).not.toContain('沙洲');
    expect(r.yesterday).toContain(CHAPTER4.cards.ahan3(ch4Run())!.missed);
    expect('sandbar' in r.follow!).toBe(false);
  });

  it('遺憾的接法都拿掉了：沒有 regretStory／再試一次／就這樣回宮、沒有 mangduRegret4、BossScene 沒有 regretEnd', () => {
    const F = CHAPTER4.finale as unknown as Record<string, unknown>;
    for (const k of ['regretStory', 'retryLabel', 'retryNote', 'acceptLabel', 'acceptNote', 'loseTitle']) expect(F[k], k).toBeUndefined();
    expect(CUTSCENES.mangduRegret4).toBeUndefined();
    const boss = raw('/scenes/BossScene.ts');
    expect(boss).not.toContain('regretEnd');
    expect(boss).not.toContain('ford_regret');
    // 回宮、開爐沒有「沒趕上」的版本；信徒錄的茫渡照判決寫
    const hg = CUTSCENES.huigong4.lines.map((l) => l.text).join('\n');
    expect(hg).not.toContain('沒趕上的那幾個');
    for (const l of CUTSCENES.kailu4.lines) if (['阿滿姨抬著頭，嘴巴動了動。', '阿翰把帽子拿在手上。'].includes(l.text)) expect(l.when).toBeUndefined();
    expect(CHAPTER4.finalEpitaph(ch4Run((x) => { x.shijuEnd = 'recall'; })).good).toBe(true);
  });
});

describe('渾水溪・茫渡：人鏈只是畫面（越多人只是畫面特效越多而已）', () => {
  it('人鏈 0 段 vs 10 段：同一個種子、同一種打法，每一幀的戰鬥數值都一樣、同一幀結束；只差畫面上的人鏈計數', () => {
    for (const pol of ['human', 'noCall'] as const) {
      for (const seed of [1, 4, 7]) {
        const a: string[] = [];
        const z: string[] = [];
        const x0 = simulate(ch4Run(), pol, seed, withChain(0), a);
        const x10 = simulate(ch4Run(), pol, seed, withChain(10), z);
        expect(x10.t, `${pol} seed${seed}`).toBe(x0.t);
        expect(x10.result).toBe(x0.result);
        expect(z.length).toBe(a.length);
        for (let i = 0; i < a.length; i++) if (a[i] !== z[i]) expect(z[i], `${pol} seed${seed} frame ${i}`).toBe(a[i]);
        expect(x10.b.saved).toEqual(x0.b.saved);
        // 唯一的差別：人鏈牽回來（chainHold）還是自己走回來（returned），和人鏈的計數
        const back = (x: typeof x0) => (x.ev.chainHold ?? 0) + (x.ev.returned ?? 0);
        expect(back(x10)).toBe(back(x0));
        expect(x0.ev.chainHold ?? 0).toBe(0);
        expect(x10.b.chainLeft).toBeLessThanOrEqual(10);
      }
    }
  });

  it('實際的人鏈（傳消息＋幫過的信徒）也一樣：幫過人的那一局打得一樣久、茫渡的血一樣', () => {
    for (const seed of [2, 5]) {
      const lonely = simulate(ch4Run(), 'noCall', seed);
      const helped = simulate(ch4Run((x) => { x.follow!.chain = 2; x.b.aman = 'walked'; x.b.ahan = 'wrapped'; x.b.xiuzhi = 'noted'; }), 'noCall', seed);
      expect(helped.b.setup.ford!.chain).toBeGreaterThan(lonely.b.setup.ford!.chain);
      expect(helped.t).toBe(lonely.t);
      expect(helped.result).toBe('subdued');
      expect(helped.b.boss.hp).toBe(lonely.b.boss.hp);
      expect(helped.b.units.map((u) => u.hp)).toEqual(lonely.b.units.map((u) => u.hp));
    }
    // 第三天的卡辦成也算幫過（辦成一位多一段，稟報不算）
    const r = ch4Run();
    const before = chainSegments4(r);
    CHAPTER4.cards.arui3(r)!.options[0].apply(r);
    expect(chainSegments4(r)).toBe(before + 1);
    const r2 = ch4Run();
    CHAPTER4.cards.aman3(r2)!.options.find((o) => o.report)!.apply(r2);
    expect(chainSegments4(r2)).toBe(before);
  });

  it('畫面：人鏈越長，畫面上的人影、燈越多（最多 10 段）；BossScene 照 chainVisual4 畫', () => {
    expect(chainVisual4(0)).toEqual({ figures: 0, lights: 0 });
    expect(chainVisual4(4).figures).toBeGreaterThan(chainVisual4(1).figures);
    expect(chainVisual4(4).lights).toBeGreaterThan(chainVisual4(1).lights);
    expect(chainVisual4(30)).toEqual(chainVisual4(10));
    const boss = raw('/scenes/BossScene.ts');
    expect(boss).toContain('chainVisual4(this.battle.setup.ford?.chain ?? 0)');
  });

  it('被叫的人：沒辦成的阿翰、阿睿，加上被牽路仔帶偏過的人（金水伯、美雲、宗翰；帶偏過的排前面），不夠就用這三個補', () => {
    expect(stragglers4(ch4Run())).toEqual(['阿翰', '阿睿', '金水伯', '美雲', '宗翰']);
    const r = ch4Run((x) => { x.follow!.strayedDay = { 3: 1 }; x.follow!.strayed = 1; x.flags.helped_ahan = true; x.flags.helped_arui = true; });
    expect(stragglers4(r)).toEqual(['宗翰', '金水伯', '美雲']);
    for (const n of ['秀枝', '秀枝的阿母', '阿滿姨', '賢仔']) expect(stragglers4(ch4Run())).not.toContain(n);
  });
});

describe('渾水溪・茫渡：斬茫渡不加戾氣（只有第四章）', () => {
  it('第四章 slayFree：斬了戾氣、威名都不變；第一～三章照舊（戾氣 +1／第三章威名 +1）', () => {
    expect(CHAPTER4.finale.slayFree).toBe(true);
    const r4 = ch4Run();
    slayBoss(r4, CHAPTER4, CHAPTER4.finale.slayFree);
    expect(r4.liqi).toBe(0);
    expect(r4.weiming).toBe(0);
    for (const id of ['wanjia', 'dongjin']) {
      const C = CHAPTERS[id];
      expect(C.finale.slayFree, id).toBeUndefined();
      const r = newRun();
      slayBoss(r, C, C.finale.slayFree);
      expect(r.liqi, id).toBe(1);
    }
    const C3 = CHAPTERS.xinying;
    const r3 = newRun();
    slayBoss(r3, C3, C3.finale.slayFree);
    expect([r3.liqi, r3.weiming]).toEqual([0, 1]);
    expect(raw('/scenes/BossScene.ts')).toContain("if (kind === 'slay') slayBoss(run, CH(), F.slayFree);");
  });
});

describe('渾水溪・茫渡：陣前審問、結局的字與接法', () => {
  it('三輪：第一輪石樁／渡頭文獻／等船的人；第二輪阿公的電話／渡頭文獻／阿母的話；第三輪秀枝的阿母（要有證詞、秀枝辦成）或押尾（一定可以）', () => {
    const [r1, r2, r3] = FINALE_ROUNDS4;
    expect(r1.evidence).toEqual(['mooring', 'dutou_doc']);
    expect(r1.people!.map((p) => p.id)).toEqual(['dengchuan']);
    expect(r1.people![0].test(ch4Run())).toBe(false);
    expect(r1.people![0].test(ch4Run((x) => { x.held.push({ id: 'dengchuan', grudge: 0 }); }))).toBe(true);
    expect(r1.okLines!.length).toBe(4);
    expect(r1.people![0].lines!.length).toBe(4);
    expect(r2.evidence).toEqual(['agong_call', 'dutou_doc', 'amu_ferry']);
    expect(r3.sharedLines!.length).toBe(2);
    const [amu, yawei] = r3.people!;
    expect(amu.test(ch4Run((x) => { x.evidence.push('amu_ferry'); }))).toBe(false);
    expect(amu.test(ch4Run((x) => { x.evidence.push('amu_ferry'); x.flags.done_xiuzhi3 = true; }))).toBe(true);
    expect(yawei.test(ch4Run())).toBe(true);
    expect(amu.ok).not.toBe(yawei.ok);
    // 第三天黃曆的文獻一定拿得到：前兩輪一定說得動
    expect(CHAPTER4.days[3].docs).toContain('dutou_doc');
  });

  it('三個結局都有字：喚回要問完三輪、送回要問完第二輪、斬一開始就能選；按鈕小字照劇本', () => {
    const F = CHAPTER4.finale;
    const ends = Object.fromEntries(F.ends.map((e) => [e.kind, e]));
    expect(ends.recall.needLast).toBe(true);
    expect(ends.return.needRound).toBe(2);
    expect(ends.slay.needLast ?? ends.slay.needRound).toBeUndefined();
    for (const e of F.ends) expect(e.desc.length, e.kind).toBeGreaterThan(10);
    expect(ends.slay.desc).toContain('這一章只有牠可以斬');
    for (const k of ['recall', 'return', 'slay'] as const) {
      const cs = CUTSCENES[F.endStory![k]!];
      expect(cs.lines.length, k).toBeGreaterThanOrEqual(10);
      // 媽祖不出現、不說話
      for (const l of cs.lines) expect(['god', 'kaijiang', 'yun', 'taizi'].includes(l.who)).toBe(false);
    }
    // 收尾的那句：兵馬自己猜轎子為什麼不走橋（旁白不替媽祖解釋）
    for (const k of ['recall', 'return', 'slay'] as const) expect(CUTSCENES[F.endStory![k]!].lines.some((l) => l.who === 'qianshao' && l.text.includes('難怪不走橋')), k).toBe(true);
    // 斬：第三輪押尾問過名字，押尾那句換掉
    const slay = CUTSCENES.mangduSlay4.lines.filter((l) => l.who === 'yawei' && l.when);
    expect(slay.length).toBe(2);
    expect(slay.filter((l) => l.when!(ch4Run((x) => { x.flags.finale_yawei = true; }))).map((l) => l.text)).toEqual(['「渡頭撐船的」。我記了。現在要劃掉。']);
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
function raw(end: string): string {
  return RAW[Object.keys(RAW).find((p) => p.endsWith(end))!];
}

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
    const crossing = boss.slice(boss.indexOf('  private fordCrossing('), boss.indexOf('  private fordChainVisual('));
    expect(crossing).toContain("'st_jiao4_ford'");
    expect(crossing).toContain('0xf29ab8');
    expect(crossing).not.toContain('setInteractive');
  });

  it('docs/第四章_美術接點清單.md 列了 bg_ford 與每張 b4_* 戰鬥圖', () => {
    const doc = raw('/docs/第四章_美術接點清單.md');
    for (const k of [CH4_FORD_BG, ...CH4_BATTLE_FILES]) expect(doc, k).toContain(k);
  });
});
