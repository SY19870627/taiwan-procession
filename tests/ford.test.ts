/**
 * 第四章最後一戰「渾水溪・茫渡」（core/boss.ts 的 ford 模式）：規則與第 A 輪初版平衡模擬（照 tests/jiao.test.ts 的做法）。
 *  - 茫渡不打人：拉住前排第一個（換位掙開）、起霧、學人講話叫走水裡的人；
 *  - 人鏈（傳消息＋幫過的信徒）每段拉住一次；喊名把人喊回來；揮頭旗打散剛要起的霧；
 *  - 一般打法贏得了；人鏈越長，被帶到下游沙洲的人越少；
 *  - 對鬼不斬（斬只對茫渡）；判對歸處的鬼才會來幫忙。
 */
import { describe, it, expect } from 'vitest';
import { BossBattle, CHAIN_TIME, FORD_HOME, FRONT_MAX, SPELLS, type BossSetup } from '../src/core/boss';
import { FINALE_ROUNDS4, GHOST_MEMBERS4, MAX_STRANDED4, MEMBER_STATS4, WAVES4, finaleSetup4, fordEnd4, fordGhosts } from '../src/content/ch4/finale';
import { chainSegments4, sandbarLines4, stragglers4 } from '../src/content/ch4/believers';
import { CUTSCENES } from '../src/content/story';
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

  it('什麼都不按、但人鏈夠長也打得完（茫渡不打人；輸贏看的是有沒有人被帶走）', () => {
    const res = SEEDS.map((s) => {
      const ford = finaleSetup4(ch4Run()).ford!;
      return simulate(ch4Run(), 'noCall', s, { ford: { ...ford, chain: ford.stragglers.length } });
    });
    expect(res.filter((x) => x.result === 'subdued').length).toBeGreaterThanOrEqual(6);
  });

  it('什麼都不按、一段人鏈都沒有：被帶走的人超過上限，霧沒有散（遺憾）', () => {
    const res = SEEDS.map((s) => simulate(ch4Run(), 'noCall', s));
    const regret = res.filter((x) => x.result === 'lose' && x.b.regret);
    expect(regret.length, res.map((x) => `${x.result}@${x.t}s 下游${x.stranded}`).join(' ')).toBeGreaterThanOrEqual(6);
    for (const x of regret) expect(x.stranded).toBe(MAX_STRANDED4 + 1);
  });

  it('人鏈越長，被帶到下游的人越少（同一個種子、同樣不按喊名）；人鏈長度決定贏還是遺憾', () => {
    for (const seed of [1, 4, 7]) {
      const ford = finaleSetup4(ch4Run()).ford!;
      const short = simulate(ch4Run(), 'noCall', seed, { ford: { ...ford, chain: 0 } });
      const long = simulate(ch4Run(), 'noCall', seed, { ford: { ...ford, chain: ford.stragglers.length } });
      expect(short.stranded, `seed ${seed}`).toBeGreaterThan(0);
      expect(long.stranded, `seed ${seed}`).toBe(0);
      expect(long.stranded).toBeLessThan(short.stranded);
      expect(long.b.regret).toBe(false);
    }
  });

  it('實際的人鏈（傳消息＋幫過的信徒）也一樣：幫過人的那一局被帶走的比較少', () => {
    const lonely = simulate(ch4Run(), 'noCall', 5);
    const helped = simulate(ch4Run((x) => { x.follow!.chain = 2; x.b.aman = 'walked'; x.b.ahan = 'wrapped'; x.b.xiuzhi = 'noted'; }), 'noCall', 5);
    expect(helped.stranded).toBeLessThan(lonely.stranded);
    // 第三天的卡辦成也算幫過（辦成一位多一段，稟報不算）
    const r = ch4Run();
    const before = chainSegments4(r);
    CHAPTER4.cards.arui3(r)!.options[0].apply(r);
    expect(chainSegments4(r)).toBe(before + 1);
    const r2 = ch4Run();
    CHAPTER4.cards.aman3(r2)!.options.find((o) => o.report)!.apply(r2);
    expect(chainSegments4(r2)).toBe(before);
  });

  it('被叫走的人：沒辦成的阿翰、阿睿，加上被牽路仔帶偏過的人（金水伯、美雲、宗翰；帶偏過的排前面），不夠就用這三個補', () => {
    expect(stragglers4(ch4Run())).toEqual(['阿翰', '阿睿', '金水伯', '美雲', '宗翰']);
    const r = ch4Run((x) => { x.follow!.strayedDay = { 3: 1 }; x.follow!.strayed = 1; x.flags.helped_ahan = true; x.flags.helped_arui = true; });
    expect(stragglers4(r)).toEqual(['宗翰', '金水伯', '美雲']);
    // 秀枝的輪椅留在橋頭、阿滿姨沒辦成的時候還在渡頭路、賢仔塞在便道：都不會在水裡被叫走
    for (const n of ['秀枝', '秀枝的阿母', '阿滿姨', '賢仔']) expect(stragglers4(ch4Run())).not.toContain(n);
  });

  it('遺憾：開爐那頁黃曆「昨日」寫被帶到下游的人（三個名字＋人數；一個人用單人版），再接第三天沒辦成的事；打贏了沙洲上的人押尾帶回來，不寫', () => {
    // 什麼都不按、沒有人鏈：找一個遺憾收場的種子
    const seed = SEEDS.find((s) => simulate(ch4Run(), 'noCall', s).b.regret)!;
    expect(seed).toBeDefined();
    const r = ch4Run();
    const { b } = simulate(r, 'noCall', seed);
    expect(b.regret).toBe(true);
    r.flags.missed_ahan3 = true;
    fordEnd4(r, b, 'regret');
    expect(r.follow!.sandbar).toEqual(b.stranded);
    expect(r.yesterday[0]).toContain(`等 ${b.stranded.length} 人被帶到下游沙洲`);
    for (const n of b.stranded.slice(0, 3)) expect(r.yesterday[0]).toContain(n);
    expect(r.yesterday[0]).toContain('香擔的火一路沒有熄');
    expect(r.yesterday).toContain(CHAPTER4.cards.ahan3(ch4Run())!.missed);
    expect(sandbarLines4(['金水伯'])[0]).toBe('渾水溪夜霧。金水伯被帶到下游沙洲，天亮尋獲，人平安。回宮未趕上。香擔的火一路沒有熄。');
    // 打贏（喚回）：沒有沙洲的名字
    const r2 = ch4Run();
    fordEnd4(r2, b, 'recall');
    expect(r2.follow!.sandbar).toEqual([]);
    expect(r2.yesterday).toEqual([]);
  });

  it('陣前審問說動了：第一輪叫走得比較慢、第二輪學人講話慢半拍、第三輪不再有人被叫走（現出渡船）', () => {
    const b = new BossBattle({ ...finaleSetup4(ch4Run()), seed: 3, waves: [] });
    b.answer(3, true);
    expect(b.noLure).toBe(true);
    expect(b.boss.state).toBe('breath');
    const end = b.t + 40;
    while (b.t < end && !b.result) b.step(1 / 30);
    expect(b.stranded).toEqual([]);
    expect(b.lure).toBeNull();
  });
});

describe('渾水溪・茫渡：陣前審問、結局、遺憾的字與接法', () => {
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

  it('遺憾：可以再試一次或就這樣回宮；遺憾的過場 → 照常回宮（遺憾版那兩句）→ 開爐；沒有人死，火沒有熄', () => {
    const F = CHAPTER4.finale;
    expect(F.regretStory).toBe('mangduRegret4');
    expect(F.retryNote!.length).toBeGreaterThan(5);
    expect(F.acceptNote).toContain('昨日欄');
    expect(F.loseText).toContain('火沒有事');
    const boss = raw('/scenes/BossScene.ts');
    expect(boss).toContain('private regretEnd(): void');
    expect(boss).toContain("run.flags.ford_regret = true;");
    expect(boss).toContain("F.onEnd?.(run, this.battle, 'regret');");
    expect(boss).toContain('{ id: F.regretStory!, next: end }');
    const regret = (x: RunState) => { x.flags.ford_regret = true; };
    const hg = CUTSCENES.huigong4.lines.filter((l) => l.when && l.when(ch4Run(regret)) && !l.when(ch4Run((x) => { x.flags.done_aman3 = true; })));
    expect(hg.map((l) => l.text)).toContain('沒趕上的那幾個，傍晚會坐車到。我在廟口等。');
    const all = [...CUTSCENES.mangduRegret4.lines, ...CUTSCENES.huigong4.lines].map((l) => l.text).join('\n');
    for (const bad of ['死了', '淹死', '火熄了']) expect(all).not.toContain(bad);
    // 茫渡還在溪裡（信徒錄）
    expect(CHAPTER4.finalEpitaph(ch4Run(regret)).text).toContain('還在溪裡');
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
