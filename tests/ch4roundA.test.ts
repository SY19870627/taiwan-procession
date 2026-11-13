/**
 * 第四章第 A 輪：
 *  A. 時辰不超過當天上限（作者定案）：押中時已經滿了就不加，播「時辰已滿」那句（results.hitFull），不是「省 1 時辰」；
 *     押中但沒滿 +1（不超過上限）；押錯照舊 -1（不低於 0）。
 *  B. 第二天（北津派出所停駕等集結、入廟三進三退、進火、草鞋丁到北津放下、第二天傳消息）、
 *     第三天（布幔放下、4 時辰、最多 7 件事、橋頭頓三下下堤防）、回宮、開爐的結構與接法。
 * 字都是【待定】暫代，這裡只檢查接點與規則。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CHAPTERS, playOverride, playableDays, startChapter } from '../src/content/chapter';
import { CHAPTER4 } from '../src/content/ch4';
import { CARDS4, MISSED4, chainSegments4, helped4, stragglers4 } from '../src/content/ch4/believers';
import { CUTSCENES } from '../src/content/story';
import { STAGES } from '../src/content/stage';
import type { DayPlan, Encounter, FollowPlan } from '../src/content/days';
import * as state from '../src/state';
import { HIT_FULL_DEFAULT, afterFork, applyBroadcast, beforeFork, betResultText, poolFor, resolveBet, skipStray } from '../src/core/procession';
import { arrive, judgeGuihu } from '../src/core/guihu';
import { bandLine4, jiaoKey } from '../src/art/baishadunSpec';

const r = () => state.run;
const D1 = CHAPTER4.days[1];
const D2 = CHAPTER4.days[2];
const D3 = CHAPTER4.days[3];
const RAW = import.meta.glob(['../src/scenes/*.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const raw = (end: string) => RAW[Object.keys(RAW).find((p) => p.endsWith(end))!];
const lastLine = (s: string) => s.split('\n').pop()!;

beforeEach(() => startChapter('baishadun'));

// ---------------------------------------------------------------------------------------------------------------
describe('A. 押先鋒：時辰不超過當天上限', () => {
  for (const p of [D1, D2, D3]) {
    const f = p.follow!;
    it(`${p.title}：押中時時辰已滿 → +0、播「時辰已滿」那句（不是省 1 時辰）`, () => {
      r().hours = p.hours;
      const o = resolveBet(r(), p, f.goes);
      expect(o.result).toBe('hit');
      expect(o.full).toBe(true);
      expect(o.gained).toBe(0);
      expect(r().hours).toBe(p.hours);
      const said = betResultText(f, o);
      expect(lastLine(said)).toBe(lastLine(f.results!.hitFull!));
      expect(lastLine(said)).not.toBe(lastLine(f.results!.hit));
      expect(lastLine(said)).not.toContain('省 1 時辰');
      // hitFull 只有一行：押中那段的前面幾句照舊，只換最後一行系統句；
      // 作者另寫了一整段（第 B1 輪：第二天）：整段換掉
      if (f.results!.hitFull!.includes('\n')) expect(said).toBe(f.results!.hitFull);
      else expect(said.split('\n').slice(0, -1)).toEqual(f.results!.hit.split('\n').slice(0, -1));
    });

    it(`${p.title}：押中時還沒滿 → +1，但不超過上限`, () => {
      r().hours = p.hours - 2;
      const o = resolveBet(r(), p, f.goes);
      expect(o.full).toBe(false);
      expect(o.gained).toBe(1);
      expect(r().hours).toBe(p.hours - 1);
      expect(betResultText(f, o)).toBe(f.results!.hit);
      startChapter('baishadun');
      r().hours = p.hours - 1;
      resolveBet(r(), p, f.goes);
      expect(r().hours).toBe(p.hours);
    });

    it(`${p.title}：押錯照舊 -1（不低於 0）`, () => {
      const wrong = p.routes.find((x) => x.id !== f.goes)!.id;
      r().hours = 3;
      const o = resolveBet(r(), p, wrong);
      expect(o.result).toBe('miss');
      expect(o.gained).toBe(-1);
      expect(r().hours).toBe(2);
      expect(betResultText(f, o)).toBe(f.results!.miss);
      startChapter('baishadun');
      r().hours = 0;
      expect(resolveBet(r(), p, wrong).gained).toBe(0);
      expect(r().hours).toBe(0);
    });
  }

  it('hitFull 沒寫時用預設的「時辰已滿」句', () => {
    const f: FollowPlan = { ...D1.follow!, results: { ...D1.follow!.results!, hitFull: undefined } };
    expect(lastLine(betResultText(f, { result: 'hit', full: true }))).toBe(HIT_FULL_DEFAULT);
    expect(HIT_FULL_DEFAULT).not.toContain('省 1 時辰');
  });

  it('DayScene 押完播 betResultText，結果頁寫出實際的時辰變化', () => {
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain('const said = betResultText(f, o);');
    expect(day).toContain("o.full ? '時辰本來就是滿的，沒有多出來'");
    expect(day).toContain('${said.split(\'\\n\').pop()}\\n${real}');
  });
});

// ---------------------------------------------------------------------------------------------------------------
/** 一天裡所有可能出現的事 */
function allEncounters(p: DayPlan): Encounter[] {
  return [
    ...p.pre, ...p.routes.flatMap((x) => x.encounters), ...p.post,
    ...(p.follow?.detour?.encounters ?? []), ...(p.follow?.rest.encounters ?? []),
    ...(p.tagged ?? []).flatMap((t) => t.encounters),
  ];
}

describe('B-1. 第二天（到北津）', () => {
  it('停駕北津派出所：等信徒集結（rest.gather），有過場；DayScene 會播', () => {
    const rest = D2.follow!.rest;
    expect(rest.name).toBe('北津派出所');
    expect(rest.gather).toBeDefined();
    expect(CUTSCENES[rest.gather!.story!]).toBeDefined();
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain('const g = r.gather;');
    expect(day).toContain('playStory(this, g.story');
  });

  it('入廟三進三退：駐駕前播演出 jinmiao4；轎只用 st_jiao4_carry／st_jiao4_pause，三進三退再衝進廟門、眾人喊「進喔！」', () => {
    expect(D2.follow!.stay.name).toBe('北津朝聖宮');
    expect(D2.follow!.stay.story).toBe('jinmiao4');
    const sc = STAGES.jinmiao4;
    expect(sc).toBeDefined();
    const jiaoTex = [
      ...sc.actors.filter((a) => a.id === 'jiao').map((a) => a.tex),
      ...sc.beats.flatMap((b) => (b.moves ?? []).filter((m) => m.id === 'jiao' && m.tex).map((m) => m.tex!)),
    ];
    expect(new Set(jiaoTex)).toEqual(new Set(['st_jiao4_carry', 'st_jiao4_pause']));
    // 往前衝（換扛轎圖）三次＋最後衝進廟門、往後退（換頓住圖）三次；最後一次是衝進廟（淡出）
    const moves = sc.beats.flatMap((b) => (b.moves ?? []).filter((m) => m.id === 'jiao'));
    expect(moves.filter((m) => m.tex === 'st_jiao4_carry').length).toBe(4);
    expect(moves.filter((m) => m.tex === 'st_jiao4_pause').length).toBe(3);
    expect(moves[moves.length - 1].alpha).toBe(0);
    expect(CUTSCENES.jinmiao4.lines.filter((l) => l.who === 'zhongren' && l.text.includes('進喔')).length).toBe(3);
    // 有條件的那幾拍（阿滿姨、秀枝稟報過）不放轎的走位：跳過時轎的位置不會亂
    for (const b of sc.beats) if (b.src !== undefined && CUTSCENES.jinmiao4.lines[b.src].when) expect((b.moves ?? []).some((m) => m.id === 'jiao'), b.text).toBe(false);
    expect(raw('/scenes/StoryScene.ts')).toContain('return !l?.when || l.when(run);');
    // DayScene：日落（駐駕）前先播 stay.story
    expect(raw('/scenes/DayScene.ts')).toContain('const st = f.stay.story;');
  });

  it('第二夜：開審前播進火（nightStory[2]），草鞋丁（帶去北津）到北津放下時播放下的過場', () => {
    expect(CHAPTER4.nightStory?.[2]).toBe('jinhuo4');
    expect(CUTSCENES.jinhuo4).toBeDefined();
    const rs = CHAPTER4.guihu!.releaseStory!.caoxie;
    expect(CUTSCENES[rs]).toBeDefined();
    // 規則：判帶去北津 → 第 2 夜放下
    r().held.push({ id: 'caoxie', grudge: 0 });
    judgeGuihu(r(), CHAPTER4.cases.caoxie, CHAPTER4.cases.caoxie.verdicts.find((v) => v.verdict === 'tobeijin')!, CHAPTER4.guihu!, 1);
    expect(arrive(r(), 2, CHAPTER4.guihu!)).toEqual([{ id: 'caoxie', dest: 'beijin' }]);
    const trial = raw('/scenes/TrialScene.ts');
    expect(trial).toContain('CH().nightStory?.[this.n]');
    expect(trial).toContain('G.releaseStory?.[a.id]');
  });

  it('第二天兩個鬼（新娘、假香燈腳）都碰得到、不受岔路影響：新娘在 pre（省道），假香燈腳在派出所前；物證帶走時一起拿到', () => {
    const pre = beforeFork(D2, r()).map((s) => (typeof s === 'string' ? s : s.id));
    const ids = afterFork(D2, r()).map((s) => (typeof s === 'string' ? s : s.id));
    expect(pre).toContain('xinniang2');
    expect(ids).toContain('jiajiao2');
    expect(CHAPTER4.cases.xinniang.onCollect).toEqual(['veil']);
    expect(CHAPTER4.cases.jiajiao.onCollect).toEqual(['armband']);
  });

  it('第二天傳消息：三個選項，接著加人鏈（不是覆蓋），換第三天的事件池', () => {
    const opts = D2.broadcast!;
    expect(opts.length).toBe(3);
    applyBroadcast(r(), 1, D1.broadcast![0]);
    applyBroadcast(r(), 2, opts[0]);
    expect(r().follow!.chain).toBe(2);
    expect(r().follow!.broadcast).toEqual({ 1: 'garage', 2: opts[0].id });
    for (const o of opts) for (const t of o.tags) if (t !== 'quiet') expect(D3.tagged!.some((x) => x.tag === t), t).toBe(true);
    // 第 B1 輪：三進三退 +1、賢仔的貨車 +0、什麼都不拍 −1（最低到 0）
    expect(opts.map((o) => o.chain)).toEqual([1, 0, -1]);
    startChapter('baishadun');
    applyBroadcast(r(), 1, D1.broadcast![2]);
    applyBroadcast(r(), 2, opts[2]);
    expect(r().follow!.chain).toBe(0);
  });

  it('第二、三天的信徒卡都有、辦得完（暫代）；辦過一次不再出現；稟報不改第一天的狀態', () => {
    for (const p of [D2, D3]) {
      for (const e of allEncounters(p)) {
        if (e.kind !== 'person') continue;
        startChapter('baishadun');
        const c = CARDS4[e.card](r());
        expect(c, e.id).toBeTruthy();
        for (const o of c!.options) expect(typeof o.apply(r()), `${e.id} ${o.label}`).toBe('string');
      }
    }
    startChapter('baishadun');
    r().b.ahan = 'wrapped';
    const card = CARDS4.ahan2(r())!;
    card.options.find((o) => o.report)!.apply(r());
    expect(r().b.ahan).toBe('wrapped');
    expect(CARDS4.ahan2(r())).toBeNull();
  });

  it('天亮「昨日」：第二天略過的卡、第二天被牽路仔帶偏的人（不算第一天的）', () => {
    r().day = 1;
    skipStray(r());
    r().day = 2;
    skipStray(r());
    skipStray(r());
    r().flags.missed_ahan2 = true;
    expect(CHAPTER4.dawn(r(), 2)).toEqual([MISSED4.ahan2, '昨天有 2 位被牽路仔帶偏，沒跟上隊伍。']);
    expect(CHAPTER4.dawn(r(), 1)).toEqual(['昨天有 1 位被牽路仔帶偏，沒跟上隊伍。']);
  });
});

describe('B-2. 第三天（回程・渾水溪）', () => {
  it('布幔全天不拉開（隊伍的轎是 st_jiao4_carry_closed）；4 時辰', () => {
    expect(D3.hours).toBe(4);
    expect(jiaoKey(3)).toBe('st_jiao4_carry_closed');
    const keys = bandLine4(3).map((b) => b[0]);
    expect(keys).toContain('st_jiao4_carry_closed');
    expect(keys).not.toContain('st_jiao4_carry');
    expect(CHAPTER4.band(3)).toEqual(bandLine4(3));
  });

  it('事情最多 7 件（不管第二天拍什麼）', () => {
    const f = D3.follow!;
    const route = D3.routes.find((x) => x.id === f.goes)!;
    const counts = [[], ['crowd'], ['helper'], ['quiet']].map((tags) => {
      const p = poolFor(D3, tags);
      return p.pre.length + route.encounters.length + (f.detour?.encounters.length ?? 0) + f.rest.encounters.length + p.post.length;
    });
    expect(Math.max(...counts)).toBe(7);
    for (const n of counts) expect(n).toBeGreaterThanOrEqual(5);
  });

  it('秀枝的那一段在這天（有卡、可以稟報）', () => {
    const e = allEncounters(D3).find((x) => x.kind === 'person' && x.card === 'xiuzhi3');
    expect(e).toBeDefined();
    expect(CARDS4.xiuzhi3(r())!.options.some((o) => o.report)).toBe(true);
  });

  it('橋頭頓三下、下堤防：臨時轉進播 qiaotou4；轎只用布幔放下的 st_jiao4_carry_closed，頓三次、最後往下走', () => {
    expect(D3.follow!.detour!.story).toBe('qiaotou4');
    const sc = STAGES.qiaotou4;
    expect(sc).toBeDefined();
    const jiao = sc.actors.find((a) => a.id === 'jiao')!;
    expect(jiao.tex).toBe('st_jiao4_carry_closed');
    for (const b of sc.beats) for (const m of b.moves ?? []) if (m.id === 'jiao' && m.tex) expect(m.tex).toBe('st_jiao4_carry_closed');
    expect(sc.beats.filter((b) => b.sfx?.at === 'jiao' && b.sfx.text.includes('頓')).length).toBe(3);
    const down = sc.beats.flatMap((b) => (b.moves ?? []).filter((m) => m.id === 'jiao' && m.y !== undefined));
    expect(down[down.length - 1].y!).toBeGreaterThan(jiao.y);
  });

  it('第三天之後：第三夜 → 茫渡現身 → 最後一戰（不再接第四天）', () => {
    expect(CHAPTER4.days[4]).toBeUndefined();
    expect(CUTSCENES[CHAPTER4.finale.story]).toBeDefined();
  });
});

describe('B-3. 回宮、開爐、整章接法', () => {
  it('回宮：八人大轎 st_jiao8_carry；頭旗、香擔先進廟', () => {
    expect(CHAPTER4.finale.closeStory).toBe('huigong4');
    const sc = STAGES.huigong4;
    expect(sc.actors.find((a) => a.id === 'jiao8')!.tex).toBe('st_jiao8_carry');
    expect(sc.actors.some((a) => a.tex === 'st_touqi')).toBe(true);
    expect(sc.actors.some((a) => a.tex === 'st_xiangdan')).toBe(true);
  });

  it('開爐：回宮之後先翻第 12 天的黃曆（昨日＝被帶到下游的人），再播開爐，之後信徒錄；鏡頭不拍神龕（沒有廟、沒有轎）', () => {
    expect(CHAPTER4.finale.afterClose).toEqual({ key: 'almanac', data: { epilogue: true } });
    const ep = CHAPTER4.epilogue!;
    expect(ep.story).toBe('kailu4');
    expect(ep.almanac(r()).lunar.length).toBeGreaterThan(0);
    const sc = STAGES.kailu4;
    expect(sc.temple).toBeUndefined();
    expect(CUTSCENES.kailu4.temple).toBeUndefined();
    for (const a of sc.actors) expect(a.tex.startsWith('st_jiao') || a.tex.startsWith('temple'), a.id).toBe(false);
    // 鏡頭抬到臉的高度
    expect(sc.beats.some((b) => (b.cam?.y ?? 0) <= -140)).toBe(true);
    expect(raw('/scenes/AlmanacScene.ts')).toContain('data.epilogue ? CH().epilogue');
    expect(raw('/scenes/BossScene.ts')).toContain('F.afterClose');
  });

  it('過場都有：整章模式的天亮、第二夜、回宮、開爐；說話的人都登記過，媽祖不說話', () => {
    const ids = [...Object.values(CHAPTER4.dawnStory ?? {}), ...Object.values(CHAPTER4.nightStory ?? {}), ...Object.values(CHAPTER4.guihu!.releaseStory ?? {}),
      D2.follow!.rest.gather!.story!, D2.follow!.stay.story!, D3.follow!.detour!.story!, CHAPTER4.epilogue!.story];
    for (const id of ids) {
      expect(CUTSCENES[id], id).toBeDefined();
      for (const l of CUTSCENES[id].lines) expect(['god', 'kaijiang', 'yun', 'taizi'].includes(l.who), id).toBe(false);
    }
  });

  it('playableDays 2（第 B1 輪：試玩版開到第二夜天亮）；網址 &full=1 時不限（整章走到底）', () => {
    expect(CHAPTER4.playableDays).toBe(2);
    expect(playableDays(CHAPTER4)).toBe(2);
    playOverride.full = true;
    try {
      expect(playableDays(CHAPTER4)).toBeUndefined();
    } finally {
      playOverride.full = false;
    }
    expect(playableDays(CHAPTERS.wanjia)).toBeUndefined();
    expect(raw('/scenes/BootScene.ts')).toContain("playOverride.full = q.get('full') === '1'");
    expect(raw('/scenes/TrialScene.ts')).toContain('const last = playableDays();');
  });

  it('人鏈＝傳消息加的＋幫過的信徒；幫過的人在人鏈上，不在水裡被叫走的名單', () => {
    expect(chainSegments4(r())).toBe(0);
    r().follow!.chain = 2;
    r().b.aman = 'walked';
    r().flags.helped_ahan = true;
    expect(helped4(r()).sort()).toEqual(['ahan', 'aman']);
    expect(chainSegments4(r())).toBe(4);
    const s = stragglers4(r());
    expect(s).not.toContain('阿滿姨');
    expect(s).not.toContain('阿翰');
    expect(s).toContain('金水伯');
  });
});
