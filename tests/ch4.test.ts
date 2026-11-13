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
import { CARRY, arrive, carrying, hasSlay, judgeGuihu, pending, rightVerdict } from '../src/core/guihu';
import { DAY2_BANTER4, NIGHT2_BANTER4 } from '../src/content/ch4/banter';
import { betResultText } from '../src/core/procession';
import { dawnHeld } from '../src/core/dianjiang';
import { impsFlee, moodOf, slayPreview } from '../src/core/renown';
import { CH4_STAGE_ART, CH4_STAGE_FILES, bandLine4, jiaoKey } from '../src/art/baishadunSpec';
import { STAGES } from '../src/content/stage';
import { SPEAKERS, SPEAKER_TEX } from '../src/content/story';
import { CUTSCENES4 } from '../src/content/ch4/story';
import { BANTER4, DAY_BANTER4, NIGHT_BANTER4 } from '../src/content/ch4/banter';
import { MISSED4 } from '../src/content/ch4/believers';
import { splitStory } from '../src/ui/split';

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
    // 別的路的小妖不受影響
    expect(visible(r(), imp(D1, 'stray1b'))).toBe(true);
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
  /** 沒有點心站的牽路仔（第一天兩隻都有點心站，這裡自己做一隻） */
  const bare: Imp = { kind: 'imp', id: 'bare', place: '隊尾', text: '', tex: 'qianlu' };
  it('規則：派押尾回頭喊 1 時辰；花費文字寫出託點心站 0', () => {
    expect(rule.mode).toBe('stray');
    if (rule.mode !== 'stray') return;
    expect(rule.hours).toBe(1);
    expect(rule.verb).toBe('派押尾回頭喊他');
    expect(summary(r(), imp(D1, 'stray1a')).cost).toBe('派押尾回頭喊他 1 時辰／託點心站 0');
    expect(summary(r(), bare).cost).toBe('派押尾回頭喊他 1 時辰');
  });

  it('沒有點心站：只能派兵回頭喊（1 時辰）', () => {
    const cs = strayChoices(r(), bare, 'pre', 1);
    expect(cs.map((c) => c.how)).toEqual(['shout']);
    r().hours = 3;
    expect(resolveStray(r(), bare, 'pre', 'shout', 1)).toBe(true);
    expect(r().hours).toBe(2);
  });

  it('第 C2 輪（爽Game）：時辰不夠也能喊，時辰扣到 0 為止', () => {
    r().hours = 0;
    const c = strayChoices(r(), bare, 'pre', 1)[0];
    expect(c.why).toBe('');
    expect(resolveStray(r(), bare, 'pre', 'shout', 1)).toBe(true);
    expect(r().hours).toBe(0);
  });

  it('附近有點心站：託人顧 0 時辰，但那一攤這一段不能再幫別的（按鈕：託茶水攤顧）', () => {
    r().hours = 3;
    const a = imp(D1, 'stray1a');
    expect(a.stall).toBe('茶水攤');
    const entrust = strayChoices(r(), a, '甲', 1).find((c) => c.how === 'entrust')!;
    expect(entrust.hours).toBe(0);
    expect(entrust.label).toBe('託茶水攤顧');
    expect(entrust.cost).toContain('這一攤這段路不能再幫別的事');
    expect(resolveStray(r(), a, '甲', 'entrust', 1)).toBe(true);
    expect(r().hours).toBe(3);
    expect(stallFree(r(), '甲', '茶水攤')).toBe(false);
    // 同一段同一攤：不能再託
    expect(strayChoices(r(), a, '甲', 1).find((c) => c.how === 'entrust')!.why).toContain('這一段已經在幫別的事');
    // 換一段（停駕點）：這攤又可以幫忙了
    expect(strayChoices(r(), a, 'rest', 1).find((x) => x.how === 'entrust')!.why).toBe('');
  });

  it('點心站用掉之後，信徒卡上要用同一攤的選項也不能選（同一段：阿滿姨「託茶水攤留她坐一下」與牽路仔互斥）', () => {
    const aman = CARDS4.aman1(r())!;
    const o = aman.options.find((x) => x.stall)!;
    expect(o.stall).toBe('茶水攤');
    expect(o.hours).toBe(0);
    expect(optionWhy(r(), o, '甲')).toBe('');
    useStall(r(), '甲', o.stall!);
    expect(optionWhy(r(), o, '甲')).toContain('這一段已經在幫別的事');
  });

  it('略過：有人沒跟上（記遺憾），不加最後一戰的小妖', () => {
    const adds = r().bossAdds;
    skipStray(r());
    skipStray(r());
    expect(r().follow!.strayed).toBe(2);
    expect(r().bossAdds).toBe(adds);
  });

  it('牽路仔只在隊尾：卡片標「隊尾」、隊伍畫面上從隊伍後面冒出來；轎、頭旗、香擔不是路上的事（牠碰不到、玩家也點不到）', () => {
    const all = Object.values(CHAPTER4.days).flatMap(allEncounters);
    const strays = all.filter((e): e is Imp => e.kind === 'imp');
    expect(strays.length).toBeGreaterThanOrEqual(3);
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain("{ s: '隊尾', color: '#6a4a8a' }");
    expect(day).toContain("{ tex: e.tex, kind: 'imp', count: 1, tail: true }");
    expect(raw('/scenes/BandScene.ts')).toContain('if (v.tail) {');
    const forbidden = ['st_jiao4_carry', 'st_jiao4_carry_closed', 'st_jiao4', 'st_jiao4_pause', 'st_jiao4_turn', 'st_jiao4_ford', 'st_jiao8_carry', 'st_touqi', 'st_xiangdan'];
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
    // 字照 docs/白砂墩_試玩段落文字_v0.1.md 第 7 節
    expect(opts[0]).toMatchObject({ label: '轎子在車行過夜', brings: '看熱鬧的年輕人', cost: '多 2 件小事（鞋子磨腳、中暑）；多 1 攤點心站可以託' });
    expect(opts[1]).toMatchObject({ label: '秀枝推輪椅跟在隊尾', brings: '帶病人來求的家屬', cost: '多 2 件很難辦的事；沒有多的幫手' });
    expect(opts[2]).toMatchObject({ label: '什麼都不拍', brings: '沒有', cost: '明天清閒；第三天過溪的時候，少一批會下水牽人的手' });
    for (const o of opts) expect(o.said?.length, o.id).toBeGreaterThan(0);
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

  it('什麼都不拍：明天比較清閒（第 B1 輪：多兩件可辦可不辦的小事、沒有點心站）；人鏈不加（第三天過溪少一批牽人的手）', () => {
    applyBroadcast(r(), 1, opts[2]);
    expect(r().follow!.chain).toBe(0);
    const p = poolFor(D2, r().follow!.tags);
    const extra = p.pre.filter((e) => !D2.pre.includes(e));
    expect(extra.map((e) => e.id).sort()).toEqual(['flag2', 'rice2']);
    // 不辦沒有遺憾：都是 1 時辰的小事
    for (const e of extra) if (e.kind === 'person') for (const o of CARDS4[e.card](r())!.options) expect(o.hours).toBe(1);
    expect(extra.some((e) => e.kind === 'imp')).toBe(false);
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
    // 草鞋丁：查明第 2 層（入伍前在轎前許過願，對照「沒落過地的草鞋」）才能帶去北津；阿婆：查明第 1 層（家就是這裡）
    expect(v('caoxie', 'tobeijin').needs).toEqual([1]);
    expect(v('apo', 'here').needs).toEqual([0]);
    // 第 B1 輪（ch4-text-day2.md）：新娘要查明第三層、假香燈腳要查明第二層
    expect(v('xinniang', 'tohome').needs).toEqual([2]);
    expect(v('jiajiao', 'leave').needs).toEqual([1]);
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

describe('整章：沒有試玩版的天數限制（第 B2 輪）', () => {
  it('playableDays／sliceEnd／sliceStory 都拿掉了：和第一～三章一樣走到開爐、信徒錄；三天都有作者的字', () => {
    expect(CHAPTER4.playableDays).toBeUndefined();
    expect(CHAPTER4.sliceEnd).toBeUndefined();
    expect(CHAPTER4.sliceStory).toBeUndefined();
    expect(CHAPTER4.days[2].title).toBe('第二天・到北津');
    expect(CHAPTER4.days[3].title).toBe('第三天・回程');
  });
});

describe('第四章內容一致性', () => {
  const days = Object.values(CHAPTER4.days);

  it('每件事指到的信徒卡、鬼、證據都存在；證據都屬於某個鬼（第三天渡頭的四件屬於最後一戰的茫渡）', () => {
    for (const e of days.flatMap(allEncounters)) {
      if (e.kind === 'person') expect(CARDS4[e.card], e.id).toBeDefined();
      if (e.kind === 'ghost') expect(CHAPTER4.cases[e.caseId], e.id).toBeDefined();
      if (e.kind === 'clue' || e.kind === 'talk') expect(CHAPTER4.evidence[e.evidence], e.id).toBeDefined();
    }
    for (const ev of Object.values(CHAPTER4.evidence)) {
      if (ev.ghost === 'mangdu') expect(['dutou_doc', 'mooring', 'agong_call', 'amu_ferry'], ev.id).toContain(ev.id);
      else expect(CHAPTER4.cases[ev.ghost], ev.id).toBeDefined();
    }
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
    // 收容時一起拿到的（草鞋）、黃曆上的文獻（路邊的鹹粥）
    for (const e of allEncounters(D1)) if (e.kind === 'ghost') for (const g of CHAPTER4.cases[e.caseId].onCollect ?? []) ev.add(g);
    for (const d of D1.docs) ev.add(d);
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
    for (const s of [CHAPTER4.prologueStory!, CHAPTER4.openingStory!, F.story, F.recallStory, ...Object.values(F.endStory ?? {}), F.closeStory!, D1.follow!.detour!.story!]) {
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
const RAW = import.meta.glob(['../src/art/*.ts', '../src/scenes/*.ts', '../docs/第四章_美術接點清單.md', '../docs/第四章_神轎交稿_manifest.json'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
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

  it('docs/第四章_美術接點清單.md 列了程式找的每一張演出貼圖', () => {
    const doc = raw('/docs/第四章_美術接點清單.md');
    expect(doc).toBeTruthy();
    for (const k of CH4_STAGE_FILES) expect(doc, k).toContain(k);
  });

  it('第 3 輪：畫師交的神轎（docs/第四章_神轎交稿_manifest.json）每張都已登記在 CH4_STAGE_FILES，設計尺寸相同；有暫代、會被載入', () => {
    const man = JSON.parse(raw('/docs/第四章_神轎交稿_manifest.json')) as { files: { key: string; file: string; size: [number, number]; pixels: [number, number] }[] };
    expect(man.files.length).toBe(7);
    const art = raw('/art/baishadun.ts');
    const sizes = CH4_STAGE_ART as Record<string, readonly [number, number]>;
    for (const f of man.files) {
      expect((CH4_STAGE_FILES as string[]).includes(f.key), f.key).toBe(true);
      expect(f.file, f.key).toBe(`${f.key}.webp`);
      expect(sizes[f.key], f.key).toEqual(f.size);
      expect(f.pixels, f.key).toEqual(f.size);
      expect(art.includes(`'${f.key}'`), `${f.key} 暫代`).toBe(true);
    }
    // 新的三張：頓住、轉彎（演出與行轎岔路用）、過溪（只登記）
    for (const k of ['st_jiao4_pause', 'st_jiao4_turn', 'st_jiao4_ford']) expect(man.files.some((f) => f.key === k), k).toBe(true);
    const used = (id: string, k: string) => STAGES[id].beats.some((b) => b.moves?.some((m) => m.id === 'jiao' && m.tex === k));
    for (const id of ['qijia4', 'zhuanjin4']) {
      expect(used(id, 'st_jiao4_pause'), id).toBe(true);
      expect(used(id, 'st_jiao4_turn'), id).toBe(true);
    }
    expect(used('qijia4', 'st_jiao4_carry')).toBe(true);
    expect(raw('/scenes/BandScene.ts')).toContain('poseJiao(');
  });

  it('停駕點換成車行的街景（garage 背景圖的接點）；序章之後接起駕；天亮過場（第一夜 → 第二天、第二夜 → 第三天）', () => {
    expect(D1.follow!.rest.art).toBe('garage');
    expect(raw('/scenes/DayScene.ts')).toContain('this.band.setScene(');
    expect(raw('/scenes/AlmanacScene.ts')).toContain('CH().openingStory');
    expect(CHAPTER4.openingStory).toBe('qijia4');
    // 第 B2 輪：沒有試玩版了，兩個天亮都走 dawnStory
    expect(CHAPTER4.dawnStory).toEqual({ 2: 'tianliang4_1', 3: 'tianliang4_2' });
    expect(raw('/scenes/TrialScene.ts')).toContain('CH().dawnStory?.[this.n + 1]');
  });

  it('DayScene：跟轎的天用押兵畫面（不是二選一）；試玩結束畫面的程式還在（別的分支、別章的試玩版用得到），第四章不會走到', () => {
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain("if (e === 'fork') return this.plan.follow ? this.showBet() : this.showFork();");
    const trial = raw('/scenes/TrialScene.ts');
    expect(trial).toContain("next: { key: 'sliceEnd' }");
    expect(raw('/scenes/SliceEndScene.ts')).toContain("super('sliceEnd')");
    expect(CHAPTER4.playableDays).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 第 2 輪：試玩段落換成正式文字（docs/白砂墩_試玩段落文字_v0.1.md v0.1，作者尚未定稿）
// ---------------------------------------------------------------------------------------------------------------
const CH4_SRC = import.meta.glob(['../src/content/ch4/*.ts', '../src/content/stage/ch4.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
/** 空的、或還是暫代字 */
const stub = (s: string | undefined) => !s || !s.trim() || /待寫|【待定】/.test(s);
const HEADER = '// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）';

describe('第一天試玩段落：正式文字', () => {
  it('第一天每件事都有劇本的字（信徒卡、鬼、牽路仔、線索），不是暫代', () => {
    const kinds = new Set<string>();
    for (const e of allEncounters(D1)) {
      kinds.add(e.kind);
      if (e.kind === 'person') {
        const c = CARDS4[e.card](r())!;
        expect(c, e.id).toBeTruthy();
        for (const s of [c.who, c.text, c.ignore]) expect(stub(s), `${e.id}：${s}`).toBe(false);
        for (const o of c.options) {
          expect(stub(o.label), e.id).toBe(false);
          expect(stub(o.result), `${e.id} ${o.label}`).toBe(false);
          if (o.report) continue;
          startChapter('baishadun');
          expect(stub(o.apply(r())), `${e.id} ${o.label}`).toBe(false);
        }
      } else if (e.kind === 'ghost') {
        const k = CHAPTER4.cases[e.caseId];
        expect(k.meet, e.id).toBeDefined();
        for (const s of [k.daySight, k.harm, k.meet!.take, k.meet!.takeResult, k.meet!.taken, k.meet!.skip, k.meet!.left]) expect(stub(s), `${e.id}：${s}`).toBe(false);
      } else if (e.kind === 'imp') {
        expect(stub(e.text), e.id).toBe(false);
      } else if (e.kind === 'clue') {
        expect(stub(e.text), e.id).toBe(false);
        expect(stub(e.story), e.id).toBe(false);
      } else {
        expect(stub(e.text), e.id).toBe(false);
      }
    }
    expect([...kinds].sort()).toEqual(['clue', 'ghost', 'imp', 'person']);
    // 行程上的字：岔路、行轎、押兵按鈕與小字、轉進、停駕、駐駕、傳消息
    const f = D1.follow!;
    const lines = [
      f.hint, f.intro, f.hints, f.turn, f.results!.hit, f.results!.miss, f.results!.stay,
      ...Object.values(f.bets!).flatMap((b) => [b.label, b.small]),
      f.detour!.name, f.detour!.text, f.detour!.why, f.rest.name, f.rest.text, f.stay.name, f.stay.text,
      ...D1.routes.flatMap((rt) => [rt.name, rt.note, ...(rt.preview ?? [])]),
      D1.broadcastIntro, D1.broadcastNote, ...D1.broadcast!.flatMap((o) => [o.label, o.brings, o.cost, o.said]),
      ...Object.values(D1.almanac(r())), CHAPTER4.unlocks![1].text,
    ];
    for (const s of lines) expect(stub(s), String(s)).toBe(false);
    // 序章黃曆、擲筊（三個聖筊各一句）、序章那句話（第 B2 輪：試玩結束卡拿掉了）
    for (const s of [...Object.values(CHAPTER4.prologue), CHAPTER4.jiao.ask, CHAPTER4.jiao.done, CHAPTER4.jiao.allHoly.text, CHAPTER4.prologueLine]) expect(stub(s), s).toBe(false);
    expect(CHAPTER4.jiao.lines).toHaveLength(CHAPTER4.jiao.times);
    // 夜裡：開場對話、說明；牽路仔兩種結果
    expect(stub(CHAPTER4.trial.intro?.(1))).toBe(false);
    expect(stub(CHAPTER4.trial.note)).toBe(false);
    const rule = CHAPTER4.imp;
    if (rule.mode === 'stray') for (const s of [rule.story, rule.entrustStory]) expect(stub(s)).toBe(false);
  });

  it('第四章內容檔都有檔頭註解（v0.1【待定】）；遊戲裡的字沒有【待定】（第 B1 輪：還沒到的字寫「（待寫）」）、沒有阿哲', () => {
    expect(Object.keys(CH4_SRC).length).toBeGreaterThanOrEqual(8);
    for (const [f, src] of Object.entries(CH4_SRC)) {
      expect(src.replace(/^\uFEFF/, '').startsWith(HEADER), f).toBe(true);
      // 【待定】開頭的字串（作者定案後換掉的說明句，等作者補）不算
      const code = stripComments(src).replace(/'【待定】[^']*'/g, "''");
      expect(code.includes('【待定】'), f).toBe(false);
      expect(code.includes('阿哲'), f).toBe(false);
      expect(code.includes('azhe'), f).toBe(false);
    }
    // 實際產生的字（卡片辦成的結果、稟報、劇情、互嗆）也一樣
    const out: string[] = [];
    const walk = (v: unknown, depth = 0): void => {
      if (depth > 8 || v == null) return;
      if (typeof v === 'string') out.push(v);
      else if (Array.isArray(v)) v.forEach((x) => walk(x, depth + 1));
      else if (typeof v === 'object') Object.values(v as object).forEach((x) => walk(x, depth + 1));
    };
    walk({ ...CHAPTER4, days: undefined, cards: undefined });
    walk(CUTSCENES4);
    walk(BANTER4);
    for (const p of Object.values(CHAPTER4.days)) {
      walk({ ...p, almanac: undefined });
      walk(p.almanac(r()));
    }
    for (const f of Object.values(CARDS4)) {
      startChapter('baishadun');
      const c = f(r());
      walk(c);
      for (const o of c?.options ?? []) {
        startChapter('baishadun');
        out.push(o.apply(r()));
        if (o.report) out.push(o.report.stop, o.report.pass);
      }
    }
    // 第 B2 輪：信徒錄、人鏈台詞、沙洲那句也是實際產生的字
    for (const setup of [(): void => undefined, (): void => {
      for (const id of ['aman3', 'arui3', 'xianzai3', 'xiuzhi3', 'ahan3']) r().flags[`done_${id}`] = true;
      r().cases.xinniang = { truths: [], verdict: 'tohome' };
      r().shijuEnd = 'recall';
    }]) {
      startChapter('baishadun');
      setup();
      walk([CHAPTER4.epitaphs(r()), CHAPTER4.ghostEpitaphs(r()), CHAPTER4.finalEpitaph(r()), CHAPTER4.finale.chainLines!(r()), CHAPTER4.epilogue!.almanac(r())]);
    }
    // 作者定案（爽Game）以後說錯的說明句換成【待定】開頭的短句等作者補（列在 _agent/c1-report.md）：只有字串開頭的那幾個可以
    const stubs = out.filter((s) => s.startsWith('【待定】'));
    // 第 C2 輪：時辰不夠也能辦以後，第二、三天的今日說明卡也換成【待定】（列在 _agent/c2-report.md）
    expect([...new Set(stubs)].sort()).toEqual([CHAPTER4.finale.briefing!.text, CHAPTER4.unlocks![2].text, CHAPTER4.unlocks![3].title, CHAPTER4.unlocks![3].text].sort());
    const text = out.filter((s) => !s.startsWith('【待定】')).join('\n');
    expect(text.length).toBeGreaterThan(3000);
    // 實際產生的字沒有【待定】；第 B2 輪：三天的字都到了，也沒有「（待寫）」
    expect(text.includes('【待定】')).toBe(false);
    expect(text.includes('（待寫）')).toBe(false);
    for (const src of Object.values(CH4_SRC)) expect(stripComments(src).includes('（待寫）')).toBe(false);
    expect(text.includes('阿哲')).toBe(false);
    expect(text.includes('azhe')).toBe(false);
    expect(text).toContain('阿睿');
    // 第一天（試玩段落）的字沒有暫代：見上一個 it（第一天每件事、行程、黃曆、夜裡的字都不是【待定】）
  });

  it('三條線索都指向甲（防風林老路），轎子真的走甲；線索一必得、二要辦阿睿、三要問阿桑', () => {
    const f = D1.follow!;
    expect(f.goes).toBe('甲');
    expect(D1.routes.find((x) => x.id === '甲')!.name).toBe('防風林老路');
    expect(f.clues).toHaveLength(3);
    for (const c of f.clues!) expect(c.text, c.text).toContain('老路');
    expect(f.clues!.map((c) => c.got(r()))).toEqual([true, false, false]);
    CARDS4.arui1(r())!.options[0].apply(r());
    expect(f.clues!.map((c) => c.got(r()))).toEqual([true, true, false]);
    CARDS4.oajian1(r())!.options[0].apply(r());
    expect(f.clues!.map((c) => c.got(r()))).toEqual([true, true, true]);
    // 問過的阿桑不再出現
    expect(CARDS4.oajian1(r())).toBeNull();
    expect(betOutcome(D1, '甲').result).toBe('hit');
    // 押兵按鈕照劇本（押甲、押乙、留在轎邊），三種都會播行轎演出
    expect(Object.keys(f.bets!).sort()).toEqual(['stay', '乙', '甲'].sort());
    // 第 3 輪：turn 第一行（停住、頓）自己一段（轎換 st_jiao4_pause），其餘＋押中／押錯／留在轎邊的話照舊（轎換 st_jiao4_turn）
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain("f.turn.split('\\n')");
    // 第 A 輪：押完的話改由 betResultText 決定（押中但時辰已滿換成 results.hitFull），其他照舊
    expect(day).toContain('const said = betResultText(f, o);');
    expect(day).toContain('`${rest.join(\'\\n\')}\\n${said}`');
    expect(day).toMatch(/poseJiao\('st_jiao4_pause'\)[\s\S]*poseJiao\('st_jiao4_turn'\)/);
  });

  it('問歸處：兩個鬼都有四種歸處；草鞋丁該帶去北津、點心擔阿婆就在這裡下；每種判決都有劇本的話', () => {
    const right: Record<string, string> = { caoxie: 'tobeijin', apo: 'here' };
    for (const [id, want] of Object.entries(right)) {
      const k = CHAPTER4.cases[id];
      expect(k.verdicts.map((v) => v.verdict), id).toEqual(['tobeijin', 'tohome', 'here', 'leave']);
      expect(k.verdicts.filter((v) => v.needs).map((v) => v.verdict), id).toEqual([want]);
      for (const v of k.verdicts) {
        expect(stub(v.result), `${id} ${v.verdict}`).toBe(false);
        expect(stub(v.after), `${id} ${v.verdict}`).toBe(false);
      }
      // 三層真相、三句話，每句都可以再問
      expect(k.truths, id).toHaveLength(3);
      expect(k.statements, id).toHaveLength(3);
      expect(k.press, id).toHaveLength(3);
      expect(k.pressQ, id).toHaveLength(3);
      for (const t of k.truths) for (const s of [t.summary, t.reveal]) expect(stub(s), id).toBe(false);
      for (const s of [...k.statements, ...k.press, k.wrong, k.daySight]) expect(stub(s), id).toBe(false);
    }
    expect(CHAPTER4.verdictName.tobeijin).toBe('帶去北津');
    expect(CHAPTER4.verdictName.here).toBe('就在這裡下');
    // 判決之後播劇本的話（不再加系統的那兩行）
    expect(raw('/scenes/TrialScene.ts')).toContain('v.after ? [v.after]');
  });

  it('演出腳本：起駕、轉進車行用程式畫的轎（扛轎 → 落地換 st_jiao4）；照抄每一句、沒有補寫；媽祖不說話、沒有旨意', () => {
    for (const id of ['qijia4', 'zhuanjin4']) {
      const sc = STAGES[id];
      expect(sc, id).toBeDefined();
      expect(sc.actors.find((a) => a.id === 'jiao')?.tex, id).toBe('st_jiao4_carry');
      expect(sc.actors.some((a) => a.tex === 'decree'), id).toBe(false);
      expect(sc.beats.map((b) => b.src), id).toEqual(CUTSCENES4[id].lines.map((_, i) => i));
      expect(sc.beats.some((b) => b.draft), id).toBe(false);
    }
    expect(STAGES.zhuanjin4.beats.some((b) => b.moves?.some((m) => m.id === 'jiao' && m.tex === 'st_jiao4'))).toBe(true);
    // 臨時轉進的過場由 DayScene 蓋在畫面上播
    expect(D1.follow!.detour!.story).toBe('zhuanjin4');
    expect(raw('/scenes/DayScene.ts')).toContain('playStory(this, d.story');
    // 說話的人都在 SPEAKERS；沒有叫「媽祖」的說話者
    for (const [id, cs] of Object.entries(CUTSCENES4)) for (const l of cs.lines) if (l.who !== 'narrator') expect(SPEAKERS[l.who], `${id} ${l.who}`).toBeDefined();
    for (const s of Object.values(SPEAKERS)) expect(s.name.includes('媽祖'), s.name).toBe(false);
    for (const n of ['前哨', '押尾', '頭旗手', '阿睿', '阿滿姨', '賢仔', '秀枝', '阿翰', '草鞋丁', '點心擔阿婆', '香燈腳們']) {
      expect(Object.values(SPEAKERS).some((s) => s.name === n), n).toBe(true);
    }
  });

  it('白天對話裡「名字：「……」」那句算那個人說的（有小人貼圖）', () => {
    const lines = splitStory('押尾走回隊尾。\n押尾：「金水伯。隊伍在這邊。」\n牽路仔：「嘖。」', undefined, SPEAKER_TEX);
    expect(lines.map((l) => l.name ?? '')).toEqual(['', '押尾', '牽路仔']);
    expect(lines[1].tex).toBe(SPEAKER_TEX['押尾']);
    // 沒給名字表：照舊（第一～三章不受影響）
    expect(splitStory('押尾：「金水伯。」').map((l) => l.name)).toEqual([undefined, undefined]);
  });

  it('互嗆：白天 12 組、夜裡 12 組；每個場合都接到畫面上', () => {
    expect(DAY_BANTER4.length).toBeGreaterThanOrEqual(12);
    expect(NIGHT_BANTER4.length).toBeGreaterThanOrEqual(12);
    expect(CHAPTER4.banter).toBe(BANTER4);
    // 每一組都至少用在一個場合
    const used = new Set(Object.values(BANTER4).flat());
    for (const set of [...DAY_BANTER4, ...NIGHT_BANTER4]) expect(used.has(set), set[0].text).toBe(true);
    const day = raw('/scenes/DayScene.ts');
    const trial = raw('/scenes/TrialScene.ts');
    // 第 A 輪：最後一戰的 b_* 接在 BossScene
    const boss = raw('/scenes/BossScene.ts');
    // 「場合@n」（第 n 天／第 n 夜才用的）：DayScene／TrialScene 先找這個，場合本身要接到畫面
    // 第 B2 輪：「場合@n#版本」（第三天新娘有跟著才播的那一組，ChapterDef.banterTag）也算
    const scoped = (k: string) => /@\d+(#\w+)?$/.test(k) && day.includes('`${key}@${this.plan.day}`') && trial.includes('`${key}@${this.n}`')
      && (!k.includes('#') || day.includes('`${key}@${this.plan.day}#${tag}`')) && hooked(k.replace(/@\d+(#\w+)?$/, ''));
    const hooked = (k: string): boolean => scoped(k) || day.includes(`'${k}'`) || trial.includes(`'${k}'`) || (k.startsWith('b_') && boss.includes(`'${k}'`))
      || (k.startsWith('walk') && day.includes('`walk${this.plan.day}`'))
      || (k.startsWith('bet_') && day.includes('`bet_${o.result}`'))
      || (k.startsWith('t_open_') && trial.includes('`t_open_${k.id}`'))
      || (/^t_(tobeijin|tohome|here|leave)$/.test(k) && trial.includes('`t_${v.verdict}`'));
    for (const k of Object.keys(BANTER4)) expect(hooked(k), k).toBe(true);
  });

  it('天亮：舊灶那一句只在阿婆判「就在這裡下」時播；略過的信徒卡，天亮寫出沒辦的結果', () => {
    const line = CUTSCENES4.tianliang4_1.lines.find((l) => l.when)!;
    expect(line.text).toContain('舊灶');
    expect(line.when!(r())).toBe(false);
    r().cases.apo = { truths: [0], verdict: 'here' };
    expect(line.when!(r())).toBe(true);
    expect(CHAPTER4.dawn(r(), 1)).toEqual([]);
    r().flags.missed_aman1 = true;
    r().flags.missed_xiuzhi1 = true;
    expect(CHAPTER4.dawn(r(), 1)).toEqual([MISSED4.aman1, MISSED4.xiuzhi1]);
    for (const id of ['aman1', 'arui1', 'xianzai1', 'xiuzhi1', 'ahan1']) expect(CARDS4[id](r())!.missed, id).toBe(MISSED4[id]);
  });

  it('稟報：阿滿姨、秀枝、阿翰三張卡可以稟報，報了轎子照常往前走（第一天不停）', () => {
    for (const id of ['aman1', 'xiuzhi1', 'ahan1']) {
      startChapter('baishadun');
      const o = CARDS4[id](r())!.options.find((x) => x.report)!;
      expect(o.label, id).toBe('稟報');
      const out = report(r(), o);
      expect(out.stops, id).toBe(false);
      expect(out.text).toContain('轎子照常往前走');
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 第 B1 輪：ch4-text-fixes.md（第一天補字）＋ch4-text-day2.md（第二天、第二夜、天亮），試玩版開到第二夜
// ---------------------------------------------------------------------------------------------------------------
describe('第 B1 輪：第一天補字（ch4-text-fixes.md）', () => {
  it('賣蚵嗲的阿桑：聽她跟客人講（兵馬凡人看不見）；頭尾兩句旁白', () => {
    const c = CARDS4.oajian1(r())!;
    expect(c.options[0].label).toBe('聽她跟客人講');
    expect(c.options[0].result).toBe('聽得到前面兩條路的狀況（岔路的線索）');
    expect(c.ignore).toBe('聽不到她講前面那兩條路（少一條岔路的線索）');
    const said = c.options[0].apply(r()).split('\n');
    expect(said[0]).toBe('一個香燈腳停下來買蚵嗲。阿桑手沒停，嘴巴也沒停。');
    expect(said[said.length - 1]).toBe('她多夾了一塊進袋子，沒有算錢。');
    expect(said).toHaveLength(5);
  });

  it('兩個鬼的第三列、再問、出示錯（兩句輪流）；開審與再問的提示', () => {
    const cx = CHAPTER4.cases.caoxie;
    expect(cx.statements[2]).toBe('我沒有什麼要跟媽祖講的。出力就好。');
    expect(cx.pressQ![1]).toBe('「你都在後面哪裡等？」');
    expect(cx.pressQ![2]).toBe('「真的一句都沒有？」');
    expect(cx.wrongs).toHaveLength(2);
    expect(cx.daySight.split('\n')[0]).toBe('隊伍後面跟著一個打赤腳的老人影子。草鞋掛在脖子上，沒穿。');
    const apo = CHAPTER4.cases.apo;
    expect(apo.statements[2]).toBe('轎子還沒到啦。到了會放炮，我聽得出來。');
    expect(apo.pressQ![2]).toBe('「今晚有聽到炮聲嗎？」');
    expect(apo.wrongs).toHaveLength(2);
    expect(CHAPTER4.trial.open('某某')).toBe('前哨：「不用跪，坐著講。你本來是要去哪裡？」');
    expect(CHAPTER4.trial.again).toBe('押尾：「這句再問一次。他剛才講到一半停了。」');
    expect(raw('/scenes/TrialScene.ts')).toContain('k.wrongs[(held.grudge - 1) % k.wrongs.length]');
  });

  it('第一天說明卡、外環點心站託人顧的結果、押中但時辰已滿那句', () => {
    expect(CHAPTER4.unlocks![1].title).toBe('跟轎');
    expect(CHAPTER4.unlocks![1].text.split('\n')).toHaveLength(3);
    const b = imp(D1, 'stray1b');
    expect(b.entrustStory).toContain('外環點心站的阿姨抓了一顆包子');
    expect(b.entrustStory).not.toContain('茶水攤');
    expect(raw('/scenes/DayScene.ts')).toContain('e.entrustStory ?? rule.entrustStory');
    expect(D1.follow!.results!.hitFull).toBe('押中了。防風林的牽路仔已經清掉。時辰本來就是滿的，沒有多出來。');
  });
});

describe('第 B1 輪：第二天（ch4-text-day2.md）', () => {
  it('第二天每件事都有劇本的字（信徒卡、鬼、牽路仔），不是暫代', () => {
    const kinds = new Set<string>();
    for (const e of allEncounters(D2)) {
      kinds.add(e.kind);
      if (e.kind === 'person') {
        startChapter('baishadun');
        const c = CARDS4[e.card](r())!;
        expect(c, e.id).toBeTruthy();
        for (const s of [c.who, c.text, c.ignore, c.missed, e.place]) expect(stub(s), `${e.id}：${s}`).toBe(false);
        for (const o of c.options) {
          expect(stub(o.label), e.id).toBe(false);
          expect(stub(o.result), `${e.id} ${o.label}`).toBe(false);
          startChapter('baishadun');
          if (o.report) {
            expect(stub(o.report.stop), e.id).toBe(false);
            continue;
          }
          expect(stub(o.apply(r())), `${e.id} ${o.label}`).toBe(false);
        }
      } else if (e.kind === 'ghost') {
        const k = CHAPTER4.cases[e.caseId];
        for (const s of [k.daySight, k.harm, k.meet!.take, k.meet!.takeResult, k.meet!.taken, k.meet!.skip, k.meet!.left, e.place]) expect(stub(s), `${e.id}：${s}`).toBe(false);
      } else if (e.kind === 'imp') {
        expect(stub(e.text), e.id).toBe(false);
        expect(stub(e.place), e.id).toBe(false);
      }
    }
    expect([...kinds].sort()).toEqual(['ghost', 'imp', 'person']);
    const f = D2.follow!;
    const lines = [
      f.hint, f.intro, f.hints, f.turn, f.results!.hit, f.results!.miss, f.results!.stay, f.results!.hitFull,
      ...Object.values(f.bets!).flatMap((b) => [b.label, b.small]), ...f.clues!.map((c) => c.text),
      f.rest.name, f.rest.text, f.rest.gather!.title, f.rest.gather!.text, f.stay.name, f.stay.text,
      ...D2.routes.flatMap((rt) => [rt.name, rt.note, ...(rt.preview ?? [])]),
      D2.broadcastIntro, D2.broadcastNote, ...D2.broadcast!.flatMap((o) => [o.label, o.brings, o.cost, o.said]),
      ...Object.values(D2.almanac(r())), D2.title, D2.area, CHAPTER4.unlocks![2].title,
      CHAPTER4.trial.intro!(2), CHAPTER4.trial.nightNote![2],
    ];
    for (const s of lines) expect(stub(s), String(s)).toBe(false);
    // 第 C2 輪：時辰不夠也能辦，說明卡「辦不完是正常的」說錯了，換成【待定】開頭的短句等作者補（_agent/c2-report.md）
    expect(CHAPTER4.unlocks![2].text.startsWith('【待定】')).toBe(true);
    // 牽路仔：舊街死巷口有自己的兩種結果（美雲、圳邊的阿嬤）
    const s2 = imp(D2, 'stray2b');
    expect(s2.story).toContain('美雲');
    expect(s2.entrustStory).toContain('圳邊的阿嬤');
    // 第二天的過場（出發、過圳、停駕、入廟、進火、草鞋丁放下、天亮）都是劇本的字；第二夜的互嗆 6＋6 組
    for (const id of ['chufa4_2', 'guozun4', 'tingjia_beijin4', 'jinmiao4', 'jinhuo4', 'fangxia_caoxie4', 'tianliang4_2']) {
      expect(CUTSCENES4[id], id).toBeDefined();
      for (const l of CUTSCENES4[id].lines) expect(stub(l.text), `${id}：${l.text}`).toBe(false);
    }
    expect(DAY2_BANTER4).toHaveLength(6);
    expect(NIGHT2_BANTER4).toHaveLength(6);
    for (const g of [...DAY2_BANTER4, ...NIGHT2_BANTER4]) for (const l of g) expect(stub(l.text)).toBe(false);
    const used = new Set(Object.values(BANTER4).flat());
    for (const g of [...DAY2_BANTER4, ...NIGHT2_BANTER4]) expect(used.has(g), g[0].text).toBe(true);
  });

  it('岔路的線索跟轎子走的路一致：轎子走乙（堤防下的舊街）；三條線索都指向舊街（洗腳、石階、沒有橋），拿法照劇本', () => {
    const f = D2.follow!;
    expect(f.goes).toBe('乙');
    const goes = D2.routes.find((x) => x.id === f.goes)!;
    expect(goes.name).toBe('堤防下的舊街');
    expect(goes.preview!.join('')).toMatch(/石階|水/);
    expect(f.turn).toContain('進了舊街');
    expect(f.results!.hit).toContain('舊街');
    expect(betOutcome(D2, '乙').result).toBe('hit');
    expect(betOutcome(D2, '甲').result).toBe('miss');
    expect(f.clues).toHaveLength(3);
    for (const c of f.clues!) expect(c.text, c.text).toMatch(/洗腳|石階|沒有橋/);
    // 線索一：草鞋丁有跟著（第一夜判帶去北津或帶回白砂墩）；二：帶新娘走（拿到頭紗）；三：阿翰聽賢仔講，或補旗的阿伯
    expect(f.clues!.map((c) => c.got(r()))).toEqual([false, false, false]);
    r().cases.caoxie = { truths: [1], verdict: 'tobeijin' };
    state.gainEvidence('veil');
    expect(f.clues!.map((c) => c.got(r()))).toEqual([true, true, false]);
    CARDS4.ahan2(r())!.options[2].apply(r());
    expect(f.clues!.map((c) => c.got(r()))).toEqual([true, true, true]);
    startChapter('baishadun');
    CARDS4.flag2(r())!.options[0].apply(r());
    expect(f.clues![2].got(r())).toBe(true);
    // 出發過場：草鞋丁那兩句跟線索一同一個條件
    const chufa = CUTSCENES4.chufa4_2.lines.filter((l) => l.when);
    expect(chufa).toHaveLength(2);
    for (const l of chufa) expect(l.when!(r())).toBe(false);
    r().cases.caoxie = { truths: [1], verdict: 'tohome' };
    for (const l of chufa) expect(l.when!(r())).toBe(true);
    expect(CHAPTER4.departStory?.[2]).toBe('chufa4_2');
    expect(raw('/scenes/AlmanacScene.ts')).toContain('CH().departStory?.[day]');
    // 過圳：乙路走完自動播
    expect(goes.endStory).toBe('guozun4');
    expect(raw('/scenes/DayScene.ts')).toContain('this.plan.routes.find((x) => x.id === this.plan.follow!.goes)?.endStory');
  });

  it('新娘：正解帶回白砂墩（查明第三層），佔旗下 1 格到回宮；判帶去北津今晚就放下；證據拿得到', () => {
    const k = CHAPTER4.cases.xinniang;
    expect(rightVerdict(k)).toBe('tohome');
    expect(k.verdicts.find((v) => v.verdict === 'tohome')!.needs).toEqual([2]);
    expect(k.truths.map((t) => t.stmt)).toEqual([1, 2, 0]);
    expect(k.truths[2].evidence).toEqual(['aman_zun']);
    // 證據：頭紗（帶走時）、阿滿姨的話（乙路聽她講）、文獻（第二天黃曆）
    expect(k.onCollect).toEqual(['veil']);
    expect(D2.docs).toContain('xijiao');
    expect(CARDS4.aman2(r())!.options.some((o) => o.gives?.includes('aman_zun'))).toBe(true);
    for (const v of k.verdicts) expect(stub(v.after), v.verdict).toBe(false);
    for (const s of [...k.statements, ...k.press, ...k.pressQ!, k.openLines!, ...k.wrongs!, ...k.truths.flatMap((t) => [t.summary, t.reveal])]) expect(stub(s)).toBe(false);
    // 第二夜判帶回白砂墩：佔格，到回宮（第 4 夜）才放下
    r().held.push({ id: 'xinniang', grudge: 0 });
    judgeGuihu(r(), k, k.verdicts.find((v) => v.verdict === 'tohome')!, G, 2);
    expect(r().held.map((h) => [h.id, h.dest])).toEqual([['xinniang', 'home']]);
    expect(arrive(r(), 3, G)).toEqual([]);
    expect(arrive(r(), 4, G)).toEqual([{ id: 'xinniang', dest: 'home' }]);
    // 第二夜判帶去北津：今晚跟頭旗進廟門，當晚放下，不佔格
    startChapter('baishadun');
    r().held.push({ id: 'xinniang', grudge: 0 });
    judgeGuihu(r(), k, k.verdicts.find((v) => v.verdict === 'tobeijin')!, G, 2);
    expect(r().held).toEqual([]);
    expect(r().flags.arrived_xinniang).toBe(true);
    expect(k.verdicts.find((v) => v.verdict === 'tobeijin')!.result).toContain('不佔格');
    // 天亮：新娘判帶回白砂墩才有阿滿姨那句
    const line = CUTSCENES4.tianliang4_2.lines.find((l) => l.when)!;
    expect(line.who).toBe('aman');
    expect(line.when!(r())).toBe(false);
    r().cases.xinniang = { truths: [0, 1, 2], verdict: 'tohome' };
    expect(line.when!(r())).toBe(true);
  });

  it('假香燈腳：正解不帶（查明第二層）；證據拿得到；小咖鬼兩個的正解', () => {
    const k = CHAPTER4.cases.jiajiao;
    expect(rightVerdict(k)).toBe('leave');
    expect(k.verdicts.find((v) => v.verdict === 'leave')!.needs).toEqual([1]);
    expect(k.onCollect).toEqual(['armband']);
    expect(CARDS4.arui2(r())!.options.some((o) => o.gives?.includes('arui_replay'))).toBe(true);
    expect(CARDS4.xianzai2(r())!.options.some((o) => o.gives?.includes('xian_truck'))).toBe(true);
    for (const v of k.verdicts) expect(stub(v.after), v.verdict).toBe(false);
    r().held.push({ id: 'jiajiao', grudge: 0 });
    judgeGuihu(r(), k, k.verdicts.find((v) => v.verdict === 'leave')!, G, 2);
    expect(r().held).toEqual([]);
    expect(r().cases.jiajiao.verdict).toBe('leave');
    // 點人頭的阿伯：就在這裡下；顧旗的囡仔：帶去北津（第二夜當晚放下）
    expect(rightVerdict(CHAPTER4.cases.diantou)).toBe('here');
    expect(rightVerdict(CHAPTER4.cases.guqi)).toBe('tobeijin');
    expect(allEncounters(D2).filter((e) => e.kind === 'ghost').map((e) => e.kind === 'ghost' && e.caseId).sort()).toEqual(['diantou', 'guqi', 'jiajiao', 'xinniang']);
  });

  it('草鞋丁第二夜在北津放下（判帶去北津）：開審前先進火、再播還願；判帶回白砂墩只在進火後多三句', () => {
    r().held.push({ id: 'caoxie', grudge: 0 });
    judgeGuihu(r(), CHAPTER4.cases.caoxie, CHAPTER4.cases.caoxie.verdicts.find((v) => v.verdict === 'tobeijin')!, G, 1);
    expect(r().held.length).toBe(1);
    expect(arrive(r(), 2, G)).toEqual([{ id: 'caoxie', dest: 'beijin' }]);
    expect(r().held).toEqual([]);
    expect(CHAPTER4.nightStory?.[2]).toBe('jinhuo4');
    const fx = CUTSCENES4[G.releaseStory!.caoxie];
    expect(fx.lines[fx.lines.length - 1].text).toBe('草鞋丁放下了。旗下空出 1 格。');
    const home = CUTSCENES4.jinhuo4.lines.filter((l) => l.when);
    expect(home).toHaveLength(3);
    for (const l of home) expect(l.when!(r())).toBe(false);
    r().cases.caoxie = { truths: [1], verdict: 'tohome' };
    for (const l of home) expect(l.when!(r())).toBe(true);
    // 進火全程安靜：不放鞭炮、不用 shake
    for (const l of CUTSCENES4.jinhuo4.lines) expect(l.fx).toBeUndefined();
    expect(raw('/scenes/TrialScene.ts')).toContain("this.quip(released ? 't_released' : 't_open')");
  });

  it('入廟三進三退 jinmiao4：轎只用 st_jiao4_carry／st_jiao4_pause（不用落地、轉彎、八人大轎、布幔放下的圖）；秀枝稟報過才多四句', () => {
    const sc = STAGES.jinmiao4;
    const tex = new Set([...sc.actors.map((a) => a.tex), ...sc.beats.flatMap((b) => (b.moves ?? []).flatMap((m) => (m.tex ? [m.tex] : [])))].filter((t) => t.startsWith('st_jiao')));
    expect(tex).toEqual(new Set(['st_jiao4_carry', 'st_jiao4_pause']));
    expect(sc.beats.map((b) => b.src)).toEqual(CUTSCENES4.jinmiao4.lines.map((_, i) => i));
    expect(sc.beats.some((b) => b.draft)).toBe(false);
    const xz = CUTSCENES4.jinmiao4.lines.filter((l) => l.text.includes('巷口') || l.who === 'xiuzhi' || l.text.includes('退得特別遠') || l.text.includes('輪椅'));
    expect(xz).toHaveLength(4);
    for (const l of xz) expect(l.when!(r())).toBe(false);
    // 稟報秀枝：轎子會有動作（stops）、記沒辦結果與因果簿的那一種寫法；四句會播
    r().miracles = 1;
    const o = CARDS4.xiuzhi2(r())!.options.find((x) => x.report)!;
    const out = report(r(), o);
    expect(out.stops).toBe(true);
    o.apply(r());
    for (const l of xz) expect(l.when!(r())).toBe(true);
    expect(r().flags.missed_xiuzhi2).toBe(true);
    expect(CHAPTER4.ledger(r()).some((x) => x.state === '秀枝：她在巷口護著輪椅。轎子退到她前面三步')).toBe(true);
    // 阿滿姨那句（趕上入廟）／外圈那句（沒趕上）二選一
    const aman = CUTSCENES4.jinmiao4.lines.filter((l) => l.when && !xz.includes(l));
    expect(aman.map((l) => l.when!(r()))).toEqual([false, true]);
    CARDS4.aman2(r())!.options[0].apply(r());
    expect(aman.map((l) => l.when!(r()))).toEqual([true, false]);
  });

  it('時辰上限照舊：第二天押中時已滿不加（作者另寫的那段，沒有「省 1 時辰」），沒滿 +1 不超過 6', () => {
    expect(D2.hours).toBe(6);
    r().hours = 6;
    const o = resolveBet(r(), D2, '乙');
    expect(o.full).toBe(true);
    expect(r().hours).toBe(6);
    const said = betResultText(D2.follow!, o);
    expect(said).toBe(D2.follow!.results!.hitFull);
    expect(said).not.toContain('省 1 時辰');
    startChapter('baishadun');
    r().hours = 5;
    resolveBet(r(), D2, '乙');
    expect(r().hours).toBe(6);
    expect(hoursAfter(6, 1, D2.hours)).toBe(6);
  });

  it('第一夜 → 第二天 → 第二夜 → 天亮（tianliang4_2）→ 第三天（第 B2 輪：不再接試玩結束卡）；第二天的沒辦結果寫進「昨日」、因果簿', () => {
    expect(CHAPTER4.playableDays).toBeUndefined();
    expect(CHAPTER4.dawnStory?.[2]).toBe('tianliang4_1');
    expect(CHAPTER4.dawnStory?.[3]).toBe('tianliang4_2');
    const trial = raw('/scenes/TrialScene.ts');
    expect(trial).toContain('if (last !== undefined && this.n >= last)');
    // 第二天略過的卡：天亮寫沒辦結果；因果簿寫沒辦的那一種
    for (const id of ['aman2', 'arui2', 'xianzai2', 'xiuzhi2', 'ahan2', 'shoes2', 'heat2', 'sick2a', 'sick2b', 'flag2', 'rice2']) {
      expect(stub(MISSED4[id]), id).toBe(false);
      expect(CARDS4[id](r())!.missed, id).toBe(MISSED4[id]);
    }
    r().flags.missed_arui2 = true;
    expect(CHAPTER4.dawn(r(), 2)).toEqual([MISSED4.arui2]);
    expect(CHAPTER4.ledger(r()).some((x) => x.state.startsWith('阿睿：三進三退拍得很清楚'))).toBe(true);
    // 辦成：因果簿換辦成的寫法、記幫過（人鏈）
    startChapter('baishadun');
    CARDS4.ahan2(r())!.options[1].apply(r());
    expect(CHAPTER4.ledger(r()).some((x) => x.state === '阿翰：背包上車，人用走的，走到了北津')).toBe(true);
    expect(r().flags.helped_ahan).toBe(true);
  });
});
