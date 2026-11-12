/**
 * 第四章（白砂墩・媽祖徒步進香）第 1 階段：跟轎的引擎（押先鋒、臨時轉進、停駕點、駐駕）、牽路仔、稟報、日落傳消息、
 * 問歸處與跨天佔格、威名關掉、對鬼不斬，以及章節內容的一致性。前三章的規則不變另見 chapters／renown／dianjiang 測試。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CHAPTERS, startChapter, summary, visible } from '../src/content/chapter';
import { CHAPTER4 } from '../src/content/ch4';
import { CARDS4 } from '../src/content/ch4/believers';
import { CUTSCENES } from '../src/content/story';
import { MAP_CHAPTERS } from '../src/content/map';
import type { DayPlan, Encounter } from '../src/content/days';
import type { Option } from '../src/content/believers';
import * as state from '../src/state';
import {
  BET_GAIN, BET_LOSS, REPORT_NOTE, STAY, afterFork, applyBroadcast, beforeFork, betChoices, betOutcome, hoursAfter, impCleared,
  optionWhy, poolFor, report, resolveBet, resolveStray, skipStray, stallFree, strayChoices, useStall,
} from '../src/core/procession';
import { CARRY, arrive, carrying, hasSlay, judgeGuihu, pending } from '../src/core/guihu';
import { dawnHeld } from '../src/core/dianjiang';
import { impsFlee, moodOf, slayPreview } from '../src/core/renown';
import { CH4_STAGE_FILES, bandLine4, jiaoKey } from '../src/art/baishadunSpec';

const r = () => state.run;
const D1 = CHAPTER4.days[1];
const D2 = CHAPTER4.days[2];
const G = CHAPTER4.guihu!;
type Imp = Extract<Encounter, { kind: 'imp' }>;

/** 一天裡所有的事（pre、兩條路、臨時轉進、停駕點、post、事件池） */
function allEncounters(p: DayPlan): Encounter[] {
  return [
    ...p.pre, ...p.routes.flatMap((x) => x.encounters), ...p.post,
    ...(p.follow?.detour?.encounters ?? []), ...(p.follow?.rest.encounters ?? []),
    ...(p.tagged ?? []).flatMap((t) => t.encounters),
  ];
}
const imp = (p: DayPlan, id: string) => allEncounters(p).find((e) => e.id === id) as Imp;

beforeEach(() => startChapter('baishadun'));

describe('第四章註冊', () => {
  it('章節 id baishadun、出巡圖開放（這個分支只部署到測試區）、深層連結用的第一天存在', () => {
    expect(CHAPTERS.baishadun).toBe(CHAPTER4);
    expect(MAP_CHAPTERS.find((c) => c.id === 'baishadun')!.open).toBe(true);
    expect(CHAPTER4.days[1].follow).toBeDefined();
    expect(r().chapter).toBe('baishadun');
    expect(r().follow).toEqual({ strayed: 0, broadcast: {}, tags: [], chain: 0, stallsUsed: [], reports: {} });
    expect(r().slots).toBe(4);
    expect(r().held).toEqual([]);
  });

  it('前三章沒有跟轎（新的一天結構是 opt-in）：DayPlan 沒有 follow／tagged／broadcast，開局沒有 follow 進度', () => {
    for (const id of ['wanjia', 'dongjin', 'xinying']) {
      for (const p of Object.values(CHAPTERS[id].days)) {
        expect(p.follow, `${id} ${p.day}`).toBeUndefined();
        expect(p.tagged, `${id} ${p.day}`).toBeUndefined();
        expect(p.broadcast, `${id} ${p.day}`).toBeUndefined();
      }
      expect(CHAPTERS[id].follow).toBeUndefined();
      expect(CHAPTERS[id].playableDays).toBeUndefined();
      expect(CHAPTERS[id].trial.style).not.toBe('guihu');
      expect(CHAPTERS[id].overnight).not.toBe('carry');
      startChapter(id);
      expect(r().follow).toBeUndefined();
    }
  });

  it('前三章的小妖照舊每次都看得到（沒有被先鋒清掉這回事）', () => {
    for (const id of ['wanjia', 'dongjin', 'xinying']) {
      startChapter(id);
      const e = Object.values(CHAPTERS[id].days).flatMap(allEncounters).find((x) => x.kind === 'imp')!;
      expect(visible(r(), e), id).toBe(true);
    }
  });
});

describe('行轎岔路：押先鋒', () => {
  it('選項是押甲／押乙／留在轎邊，代價事先明講（押中、押錯各一行）', () => {
    const cs = betChoices(D1);
    expect(cs.map((c) => c.bet)).toEqual(['甲', '乙', STAY]);
    for (const c of cs.slice(0, 2)) {
      expect(c.ifRight).toContain(`省 ${BET_GAIN} 時辰`);
      expect(c.ifWrong).toContain(`少 ${BET_LOSS} 時辰`);
    }
    expect(cs[2].ifRight).toBe('不賺不賠');
    expect(cs[2].ifWrong).toBe('不賺不賠');
  });

  it('方向由內容決定（不是亂數）：同一個押法每次結果都一樣', () => {
    expect(D1.follow!.goes).toBe('甲');
    for (let i = 0; i < 20; i++) expect(betOutcome(D1, '乙').result).toBe('miss');
  });

  it('押中：那條路的小妖先清掉、省 1 時辰', () => {
    r().hours = 4;
    const o = resolveBet(r(), D1, '甲');
    expect(o.result).toBe('hit');
    expect(r().hours).toBe(5);
    expect(r().follow!.bet).toBe('甲');
    expect(r().follow!.betResult).toBe('hit');
    const impsOnA = D1.routes.find((x) => x.id === '甲')!.encounters.filter((e) => e.kind === 'imp');
    expect(impsOnA.length).toBeGreaterThan(0);
    for (const e of impsOnA) {
      expect(impCleared(r(), e)).toBe(true);
      expect(visible(r(), e)).toBe(false);
    }
    // 別的段落的小妖不受影響
    expect(visible(r(), imp(D1, 'stray1c'))).toBe(true);
  });

  it('押錯：兵馬要趕回來，少 1 時辰；小妖都還在', () => {
    r().hours = 4;
    const o = resolveBet(r(), D1, '乙');
    expect(o.result).toBe('miss');
    expect(r().hours).toBe(3);
    expect(D1.routes.find((x) => x.id === '甲')!.encounters.filter((e) => e.kind === 'imp').every((e) => visible(r(), e))).toBe(true);
  });

  it('留在轎邊：不賺不賠', () => {
    r().hours = 4;
    expect(resolveBet(r(), D1, STAY).result).toBe('stay');
    expect(r().hours).toBe(4);
    expect(Object.keys(r().flags).filter((k) => k.startsWith('cleared_'))).toEqual([]);
  });

  it('時辰不超過當天上限、不低於 0', () => {
    expect(hoursAfter(6, 1, 6)).toBe(6);
    expect(hoursAfter(0, -1, 6)).toBe(0);
    r().hours = D1.hours;
    resolveBet(r(), D1, '甲');
    expect(r().hours).toBe(D1.hours);
  });
});

describe('岔路之後：轎子那條路 → 臨時轉進 → 停駕點 → post', () => {
  it('不管押哪，行程都照轎子走的那條；臨時轉進在停駕點之前，事後才有解釋', () => {
    const q = afterFork(D1, r());
    const ids = q.map((s) => (typeof s === 'string' ? s : s.id));
    const goes = D1.routes.find((x) => x.id === D1.follow!.goes)!;
    const other = D1.routes.find((x) => x.id !== D1.follow!.goes)!;
    for (const e of goes.encounters) expect(ids).toContain(e.id);
    for (const e of other.encounters) if (!goes.encounters.some((g) => g.id === e.id)) expect(ids).not.toContain(e.id);
    const d = ids.indexOf('detour');
    const de = ids.indexOf('detourEnd');
    const rest = ids.indexOf('rest');
    expect(d).toBeGreaterThan(0);
    expect(de).toBeGreaterThan(d);
    expect(rest).toBeGreaterThan(de);
    expect(ids.slice(d + 1, de)).toEqual(D1.follow!.detour!.encounters.map((e) => e.id));
    for (const e of D1.post) expect(ids.indexOf(e.id)).toBeGreaterThan(rest);
    expect(D1.follow!.detour!.why.length).toBeGreaterThan(0);
    // 押別的路，行程一樣
    resolveBet(r(), D1, '乙');
    expect(afterFork(D1, r()).map((s) => (typeof s === 'string' ? s : s.id))).toEqual(ids);
  });

  it('岔路前：出發後的事，最後一格是岔路', () => {
    const q = beforeFork(D1, r());
    expect(q[q.length - 1]).toBe('fork');
    expect(q.slice(0, -1)).toEqual(D1.pre);
  });

  it('沒有臨時轉進的天：直接到停駕點', () => {
    const ids = afterFork(D2, r()).map((s) => (typeof s === 'string' ? s : s.id));
    expect(ids).not.toContain('detour');
    expect(ids).toContain('rest');
  });
});

describe('牽路仔（ImpRule stray）', () => {
  const rule = CHAPTER4.imp;
  it('規則：派兵回頭喊 1 時辰；花費文字寫出託點心站 0', () => {
    expect(rule.mode).toBe('stray');
    if (rule.mode !== 'stray') return;
    expect(rule.hours).toBe(1);
    expect(summary(r(), imp(D1, 'stray1a')).cost).toBe('派兵回頭喊 1 時辰／託點心站 0');
    expect(summary(r(), imp(D1, 'stray1p')).cost).toBe('派兵回頭喊 1 時辰');
  });

  it('沒有點心站：只能派兵回頭喊（1 時辰）', () => {
    const cs = strayChoices(r(), imp(D1, 'stray1p'), 'pre', 1);
    expect(cs.map((c) => c.how)).toEqual(['shout']);
    r().hours = 3;
    expect(resolveStray(r(), imp(D1, 'stray1p'), 'pre', 'shout', 1)).toBe(true);
    expect(r().hours).toBe(2);
  });

  it('時辰不夠就不能喊', () => {
    r().hours = 0;
    const c = strayChoices(r(), imp(D1, 'stray1p'), 'pre', 1)[0];
    expect(c.why).toContain('時辰不夠');
    expect(resolveStray(r(), imp(D1, 'stray1p'), 'pre', 'shout', 1)).toBe(false);
  });

  it('附近有點心站：託人顧 0 時辰，但那一攤這一段不能再幫別的', () => {
    r().hours = 3;
    const a = imp(D1, 'stray1a');
    expect(a.stall).toBe('海線點心站');
    expect(strayChoices(r(), a, '甲', 1).find((c) => c.how === 'entrust')!.hours).toBe(0);
    expect(resolveStray(r(), a, '甲', 'entrust', 1)).toBe(true);
    expect(r().hours).toBe(3);
    expect(stallFree(r(), '甲', '海線點心站')).toBe(false);
    // 同一段同一攤：不能再託
    expect(strayChoices(r(), a, '甲', 1).find((c) => c.how === 'entrust')!.why).toContain('這一段已經在幫別的事');
    // 換一段（停駕點）：這攤又可以幫忙了
    const c = imp(D1, 'stray1c');
    expect(strayChoices(r(), c, 'rest', 1).find((x) => x.how === 'entrust')!.why).toBe('');
  });

  it('點心站用掉之後，信徒卡上要用同一攤的選項也不能選（同一段）', () => {
    const arui = CARDS4.arui1(r())!;
    const o = arui.options.find((x) => x.stall)!;
    expect(optionWhy(r(), o, 'rest')).toBe('');
    useStall(r(), 'rest', o.stall!);
    expect(optionWhy(r(), o, 'rest')).toContain('這一段已經在幫別的事');
  });

  it('略過：有人沒跟上（記遺憾），不加最後一戰的小妖', () => {
    const adds = r().bossAdds;
    skipStray(r());
    skipStray(r());
    expect(r().follow!.strayed).toBe(2);
    expect(r().bossAdds).toBe(adds);
  });

  it('牽路仔只在隊尾：每隻都標在「隊尾」；轎、頭旗、香擔不是路上的事（牠碰不到、玩家也點不到）', () => {
    const all = Object.values(CHAPTER4.days).flatMap(allEncounters);
    const strays = all.filter((e): e is Imp => e.kind === 'imp');
    expect(strays.length).toBeGreaterThanOrEqual(4);
    for (const e of strays) expect(e.place, e.id).toContain('隊尾');
    const forbidden = ['st_jiao4_carry', 'st_jiao4_carry_closed', 'st_jiao4', 'st_jiao8_carry', 'st_touqi', 'st_xiangdan'];
    for (const e of all) if ('tex' in e) expect(forbidden.includes(e.tex), e.id).toBe(false);
  });
});

describe('稟報（取代神蹟）', () => {
  const aman = () => CARDS4.aman1(r())!;
  const rep = () => aman().options.find((o) => o.report) as Option;

  it('選項明講：媽祖會知道；轎子會不會為他停，不保證', () => {
    expect(REPORT_NOTE).toBe('媽祖會知道；轎子會不會為他停，不保證');
    expect(CHAPTER4.follow!.reportLabel).toBe('稟報');
    expect(rep().miracle).toBeUndefined();
  });

  it('結果由內容決定、不是亂數：同樣的狀態每次都一樣；用掉一次稟報、記下來', () => {
    const results = new Set<boolean>();
    for (let i = 0; i < 30; i++) {
      startChapter('baishadun');
      r().miracles = 1;
      const out = report(r(), rep());
      results.add(out.stops);
      expect(r().miracles).toBe(0);
      expect(out.text).toBe(out.stops ? rep().report!.stop : rep().report!.pass);
      expect(r().follow!.reports.aman1).toBe(out.stops);
    }
    expect(results.size).toBe(1);
  });

  it('稟報用完就不能再選；不加最後一戰的小妖', () => {
    r().miracles = 0;
    expect(optionWhy(r(), rep(), 'pre')).toBe('今天的稟報已經用完');
    r().miracles = 1;
    const adds = r().bossAdds;
    report(r(), rep());
    expect(r().bossAdds).toBe(adds);
  });
});

describe('日落傳消息：隔天事件池切換', () => {
  const opts = D1.broadcast!;
  const ids = (es: Encounter[]) => es.map((e) => e.id).sort();
  const base = () => poolFor(D2, []);

  it('三個選項照計畫 §4 的表（拍什麼、明天多來的人、代價）', () => {
    expect(opts.map((o) => o.id)).toEqual(['garage', 'xiuzhi', 'none']);
    expect(opts[0]).toMatchObject({ label: '轎子在車行過夜', brings: '看熱鬧的年輕人', cost: '多 2 件小事（鞋子、中暑），多 1 攤點心站' });
    expect(opts[1]).toMatchObject({ label: '秀枝推輪椅跟在隊尾', brings: '帶病人來求的家屬', cost: '多 2 件很難辦的事，沒有多的幫手' });
    expect(opts[2]).toMatchObject({ label: '什麼都不拍', brings: '沒有多的人', cost: '明天清閒，但第三天過溪時少一批會牽人的手' });
  });

  it('拍車行過夜：明天出發後多 2 件小事，多 1 攤點心站（牽路仔旁邊）；人鏈 +1', () => {
    applyBroadcast(r(), 1, opts[0]);
    expect(r().follow!.broadcast[1]).toBe('garage');
    expect(r().follow!.chain).toBe(1);
    expect(r().flags.film_garage).toBe(true);
    const p = poolFor(D2, r().follow!.tags);
    const extra = p.pre.filter((e) => !D2.pre.includes(e));
    expect(extra.filter((e) => e.kind === 'person').length).toBe(2);
    const stalls = new Set(extra.filter((e): e is Imp => e.kind === 'imp' && !!e.stall).map((e) => e.stall));
    expect(stalls.size).toBe(1);
    expect(ids(p.post)).toEqual(ids(base().post));
    // DayScene 用的 beforeFork 也跟著換
    expect(beforeFork(D2, r()).length).toBe(D2.pre.length + extra.length + 1);
  });

  it('拍秀枝：明天會合後多 2 件很難辦的事（每件 2 時辰起），沒有多的點心站；人鏈 +1', () => {
    applyBroadcast(r(), 1, opts[1]);
    expect(r().follow!.chain).toBe(1);
    const p = poolFor(D2, r().follow!.tags);
    const extra = p.post.filter((e) => !D2.post.includes(e));
    expect(extra.length).toBe(2);
    for (const e of extra) {
      expect(e.kind).toBe('person');
      if (e.kind !== 'person') continue;
      const card = CARDS4[e.card](r())!;
      expect(Math.min(...card.options.map((o) => o.hours))).toBeGreaterThanOrEqual(2);
    }
    expect(ids(p.pre)).toEqual(ids(base().pre));
    expect([...p.pre, ...p.post].some((e) => e.kind === 'imp' && e.stall)).toBe(false);
  });

  it('什麼都不拍：明天沒有多的事；人鏈不加（第三天過溪少一批牽人的手）', () => {
    applyBroadcast(r(), 1, opts[2]);
    expect(r().follow!.chain).toBe(0);
    const p = poolFor(D2, r().follow!.tags);
    expect(ids(p.pre)).toEqual(ids(base().pre));
    expect(ids(p.post)).toEqual(ids(base().post));
  });

  it('三種選擇的隔天事件池都不一樣；人鏈旗標可以給最後一戰用', () => {
    const sets = opts.map((o) => {
      startChapter('baishadun');
      applyBroadcast(r(), 1, o);
      const p = poolFor(D2, r().follow!.tags);
      return JSON.stringify([ids(p.pre), ids(p.post)]);
    });
    expect(new Set(sets).size).toBe(3);
  });

  it('每個事件池標籤都有選項會打開；第二天也有傳消息（通用，不只第一天）', () => {
    const tags = new Set(Object.values(CHAPTER4.days).flatMap((p) => p.broadcast ?? []).flatMap((o) => o.tags));
    for (const p of Object.values(CHAPTER4.days)) for (const t of p.tagged ?? []) expect(tags.has(t.tag), t.tag).toBe(true);
    expect(D2.broadcast?.length).toBeGreaterThan(0);
  });
});

describe('夜審「問歸處」與跨天佔格', () => {
  const k = (id: string) => CHAPTER4.cases[id];
  const v = (id: string, verdict: string) => k(id).verdicts.find((x) => x.verdict === verdict)!;

  it('style guihu；判決只有四種：帶去北津／帶回白砂墩／就在這裡下／不帶；對鬼不斬', () => {
    expect(CHAPTER4.trial.style).toBe('guihu');
    for (const c of Object.values(CHAPTER4.cases)) {
      expect(c.verdicts.map((x) => x.verdict).sort(), c.id).toEqual(['here', 'leave', 'tobeijin', 'tohome']);
      expect(hasSlay(c), c.id).toBe(false);
    }
    expect(CHAPTER4.verdictName).toEqual({ tobeijin: '帶去北津', tohome: '帶回白砂墩', here: '就在這裡下', leave: '不帶' });
    expect(CARRY).toEqual({ tobeijin: 'beijin', tohome: 'home' });
  });

  it('該去的地方要先查明（needs）；草鞋丁該去北津、點心擔阿婆就在這裡下', () => {
    expect(v('caoxie', 'tobeijin').needs).toEqual([0]);
    expect(v('apo', 'here').needs).toEqual([0]);
    expect(v('xinniang', 'tohome').needs).toEqual([0]);
    expect(v('jiajiao', 'leave').needs).toEqual([0]);
  });

  it('就在這裡下、不帶：空出格子', () => {
    r().held.push({ id: 'apo', grudge: 0 }, { id: 'jiajiao', grudge: 0 });
    judgeGuihu(r(), k('apo'), v('apo', 'here'), G, 1);
    judgeGuihu(r(), k('jiajiao'), v('jiajiao', 'leave'), G, 1);
    expect(r().held).toEqual([]);
    expect(r().cases.apo.verdict).toBe('here');
    expect(r().cases.jiajiao.verdict).toBe('leave');
  });

  it('帶著走：一直佔著格子，到了歸處那一夜才放下（北津第 2 夜、白砂墩回宮）', () => {
    r().held.push({ id: 'caoxie', grudge: 0 }, { id: 'xinniang', grudge: 0 });
    const lines = judgeGuihu(r(), k('caoxie'), v('caoxie', 'tobeijin'), G, 1);
    judgeGuihu(r(), k('xinniang'), v('xinniang', 'tohome'), G, 1);
    expect(lines.join('')).toContain('北津');
    expect(r().held.map((h) => [h.id, h.dest, h.since])).toEqual([['caoxie', 'beijin', 1], ['xinniang', 'home', 1]]);
    expect(pending(r())).toEqual([]);
    expect(carrying(r()).length).toBe(2);
    // 天亮：跟著走，不加怨氣、不掙脫
    for (let i = 0; i < 4; i++) dawnHeld(r(), CHAPTER4);
    expect(r().held.length).toBe(2);
    expect(r().held.every((h) => h.grudge === 0)).toBe(true);
    // 第 1 夜還沒到
    expect(arrive(r(), 1, G)).toEqual([]);
    // 第 2 夜到北津：草鞋丁放下；新娘繼續佔格
    expect(arrive(r(), 2, G)).toEqual([{ id: 'caoxie', dest: 'beijin' }]);
    expect(r().held.map((h) => h.id)).toEqual(['xinniang']);
    expect(r().flags.arrived_caoxie).toBe(true);
    expect(arrive(r(), 3, G)).toEqual([]);
    expect(arrive(r(), 4, G)).toEqual([{ id: 'xinniang', dest: 'home' }]);
  });

  it('頭旗下 4 格：帶著走的鬼佔的格子算在裡面（隔天收容會被擠到）', () => {
    expect(CHAPTER4.slots).toBe(4);
    for (const id of ['caoxie', 'apo', 'xinniang']) r().held.push({ id, grudge: 0 });
    for (const id of ['caoxie', 'apo', 'xinniang']) judgeGuihu(r(), k(id), v(id, 'tohome'), G, 1);
    expect(r().held.length).toBe(3);
    expect(r().slots - r().held.length).toBe(1);
  });

  it('還沒問完的鬼：天亮也不加怨氣（跟在頭旗後面走，不是押著）', () => {
    r().held.push({ id: 'caoxie', grudge: 2 });
    const out = dawnHeld(r(), CHAPTER4);
    expect(out).toEqual([]);
    expect(r().held).toEqual([{ id: 'caoxie', grudge: 2 }]);
  });
});

describe('威名關掉、只有茫渡可以斬', () => {
  it('不設 slayRule：威名不嚇鬼、小妖不會自己逃、斬的預告是前兩章的寫法', () => {
    expect(CHAPTER4.slayRule).toBeUndefined();
    expect(CHAPTER4.chase).toBeUndefined();
    r().weiming = 5;
    const R = { slayRule: CHAPTER4.slayRule, chase: CHAPTER4.chase };
    expect(moodOf(r(), 1, R)).toBe('normal');
    expect(impsFlee(r(), R)).toBe(false);
    expect(slayPreview(r(), CHAPTER4.cases.caoxie, R)).not.toContain('威名');
    startChapter('baishadun');
    expect(r().weiming).toBe(0);
  });

  it('最後一戰的判決才有斬（對魔王茫渡）', () => {
    expect(CHAPTER4.finale.bossName).toBe('茫渡');
    expect(CHAPTER4.finale.ends.map((e) => e.kind).sort()).toEqual(['recall', 'return', 'slay']);
  });
});

describe('試玩版：只到第一天', () => {
  it('playableDays 1、試玩結束畫面有字；第二、三天是骨架', () => {
    expect(CHAPTER4.playableDays).toBe(1);
    expect(CHAPTER4.sliceEnd!.title).toContain('試玩');
    expect(CHAPTER4.days[2].title).toBe('第二天');
    expect(CHAPTER4.days[3].title).toBe('第三天');
  });
});

describe('第四章內容一致性', () => {
  const days = Object.values(CHAPTER4.days);

  it('每件事指到的信徒卡、鬼、證據都存在；證據都屬於某個鬼', () => {
    for (const e of days.flatMap(allEncounters)) {
      if (e.kind === 'person') expect(CARDS4[e.card], e.id).toBeDefined();
      if (e.kind === 'ghost') expect(CHAPTER4.cases[e.caseId], e.id).toBeDefined();
      if (e.kind === 'clue' || e.kind === 'talk') expect(CHAPTER4.evidence[e.evidence], e.id).toBeDefined();
    }
    for (const ev of Object.values(CHAPTER4.evidence)) expect(CHAPTER4.cases[ev.ghost], ev.id).toBeDefined();
    for (const c of Object.values(CHAPTER4.cases)) {
      for (const t of c.truths) {
        expect(t.stmt, c.id).toBeLessThan(c.statements.length);
        for (const id of t.evidence) expect(CHAPTER4.evidence[id], `${c.id} ${id}`).toBeDefined();
      }
      expect(c.press.length, c.id).toBe(c.statements.length);
      for (const vd of c.verdicts) for (const n of vd.needs ?? []) expect(n, c.id).toBeLessThan(c.truths.length);
    }
  });

  it('第一天的兩個鬼案（草鞋丁、點心擔阿婆）的證據都拿得到', () => {
    const ev = new Set(allEncounters(D1).flatMap((e) => (e.kind === 'clue' || e.kind === 'talk' ? [e.evidence] : [])));
    for (const e of allEncounters(D1)) if (e.kind === 'person') for (const o of CARDS4[e.card](r())?.options ?? []) for (const g of o.gives ?? []) ev.add(g);
    for (const id of ['caoxie', 'apo']) for (const t of CHAPTER4.cases[id].truths) expect(t.evidence.some((x) => ev.has(x)), id).toBe(true);
  });

  it('每天的跟轎行程：轎子走的路存在、有停駕點與駐駕；第一天有臨時轉進與三個傳消息', () => {
    for (const p of days) {
      expect(p.follow, p.title).toBeDefined();
      expect(p.routes.map((x) => x.id), p.title).toContain(p.follow!.goes);
      expect(p.follow!.rest.name.length).toBeGreaterThan(0);
      expect(p.follow!.stay.name.length).toBeGreaterThan(0);
      for (const x of p.routes) expect(x.theme, p.title).toBeUndefined();
    }
    expect(D1.follow!.detour).toBeDefined();
    expect(D1.broadcast!.length).toBe(3);
    expect(D1.hours).toBe(6);
  });

  it('卡片上用到的點心站，當天真的有那一攤（牽路仔旁邊）', () => {
    const stalls = new Set(allEncounters(D1).flatMap((e) => (e.kind === 'imp' && e.stall ? [e.stall] : [])));
    for (const e of allEncounters(D1)) if (e.kind === 'person') for (const o of CARDS4[e.card](r())?.options ?? []) if (o.stall) expect(stalls.has(o.stall), o.label).toBe(true);
  });

  it('序章、天亮前、結局、收尾的劇情 id 都存在；旁白不替媽祖講話（第四章劇情裡沒有神明說話者）', () => {
    const F = CHAPTER4.finale;
    for (const s of [CHAPTER4.prologueStory!, F.story, F.recallStory, ...Object.values(F.endStory ?? {}), F.closeStory!]) {
      expect(CUTSCENES[s], s).toBeDefined();
      for (const l of CUTSCENES[s].lines) expect(['god', 'kaijiang', 'yun', 'taizi'].includes(l.who), s).toBe(false);
    }
  });

  it('白天隊伍：頭旗 → 香擔 → 四人小轎 → 香燈腳；去程布幔拉開、回程放下；人一天比一天多', () => {
    const line = bandLine4(1);
    expect(line.slice(0, 3).map((b) => b[0])).toEqual(['st_touqi', 'st_xiangdan', 'st_jiao4_carry']);
    for (let i = 1; i < line.length; i++) expect(line[i][1]).toBeLessThan(line[i - 1][1]);
    expect(jiaoKey(3)).toBe('st_jiao4_carry_closed');
    expect(bandLine4(2).length).toBeGreaterThan(bandLine4(1).length);
    expect(CHAPTER4.band(1)).toEqual(line);
    for (const [k] of line) expect((CH4_STAGE_FILES as string[]).includes(k), k).toBe(true);
  });
});

/** 原始碼（用 Vite 的 glob 讀，不必裝 node 型別） */
const RAW = import.meta.glob(['../src/art/*.ts', '../src/scenes/*.ts', '../_agent/ch4-art-keys.md'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const raw = (end: string) => RAW[Object.keys(RAW).find((p) => p.endsWith(end))!];

describe('第四章暫代美術與畫面接法', () => {
  it('每張第四章演出貼圖都有程式畫的暫代；BootScene 會畫、AssetScene 會載入並蓋掉', () => {
    const art = raw('/art/baishadun.ts');
    for (const k of CH4_STAGE_FILES) {
      const drawn = art.includes(`'${k}'`) || (k.startsWith('st_xiangdeng_') && art.includes('`st_xiangdeng_${t}`'));
      expect(drawn, k).toBe(true);
    }
    expect(art).toContain('暫代');
    expect(raw('/scenes/BootScene.ts')).toContain('makeBaishadun');
    expect(raw('/scenes/AssetScene.ts')).toMatch(/CH4_STAGE_FILES[\s\S]*replaceTexture/);
  });

  it('隊伍（轎、頭旗、香擔）在畫面上不是可以點的東西', () => {
    const band = raw('/scenes/BandScene.ts');
    const members = band.slice(band.indexOf('for (const [key, x, sc] of data.line)'), band.indexOf('setHour(hour: number)'));
    expect(members.length).toBeGreaterThan(0);
    expect(members).not.toContain('setInteractive');
  });

  it('立繪代號：阿睿是 arui（第一章阿哲 azhe 不動）', () => {
    const p = raw('/art/portraits.ts');
    expect(p).toContain("阿睿: 'arui'");
    expect(p).toContain("阿哲: 'azhe'");
  });

  it('_agent/ch4-art-keys.md 列了程式找的每一張演出貼圖', () => {
    const doc = raw('/_agent/ch4-art-keys.md');
    expect(doc).toBeTruthy();
    for (const k of CH4_STAGE_FILES) expect(doc, k).toContain(k);
  });

  it('DayScene：跟轎的天用押兵畫面（不是二選一）；試玩版天亮後接 sliceEnd', () => {
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain("if (e === 'fork') return this.plan.follow ? this.showBet() : this.showFork();");
    const trial = raw('/scenes/TrialScene.ts');
    expect(trial).toContain("next: { key: 'sliceEnd' }");
    expect(raw('/scenes/SliceEndScene.ts')).toContain("super('sliceEnd')");
  });
});
