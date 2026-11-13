/**
 * 第四章第 B2 輪：整章串起來（照 integrate3 的做法）。
 * 序章 → 起駕 → 第一天 → 第一夜問歸處 → 天亮 → 第二天 → 第二夜（進火）→ 天亮 → 第三天（回程）→ 入夜直接過溪：最後一戰
 * → 結局（喚回／送回／斬，或遺憾）→ 回宮 → 開爐的黃曆 → 開爐 → 信徒錄。
 * 每一步會播到的過場 id 都存在、說話的人都登記過、媽祖不說話；場景之間的接法照程式碼；
 * 再用內容的規則把一局從頭走到尾（不開畫面），確認每一天的行程、每一張卡、每一種結局都接得上。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CHAPTERS, playableDays, startChapter, visible } from '../src/content/chapter';
import { CHAPTER4 } from '../src/content/ch4';
import { CUTSCENES, SPEAKERS } from '../src/content/story';
import { STAGES } from '../src/content/stage';
import { BossBattle } from '../src/core/boss';
import { afterFork, applyBroadcast, beforeFork, resolveBet } from '../src/core/procession';
import { judgeGuihu } from '../src/core/guihu';
import { fordEnd4 } from '../src/content/ch4/finale';
import type { Encounter } from '../src/content/days';
import * as state from '../src/state';

const r = () => state.run;
const SRC = import.meta.glob(['../src/scenes/*.ts', '../src/main.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const raw = (end: string) => SRC[Object.keys(SRC).find((p) => p.endsWith(end))!];
const GODS = ['god', 'kaijiang', 'yun', 'taizi'];

beforeEach(() => startChapter('baishadun'));

/** 一局會播到的所有過場（依播放順序） */
function storiesOf4(): string[] {
  const C = CHAPTER4;
  const F = C.finale;
  const D = C.days;
  const ids: string[] = [C.prologueStory!, C.openingStory!];
  for (const n of [1, 2, 3]) {
    if (C.dawnStory?.[n]) ids.push(C.dawnStory[n]);
    if (C.departStory?.[n]) ids.push(C.departStory[n]);
    const f = D[n].follow!;
    if (f.detour?.story) ids.push(f.detour.story);
    for (const rt of D[n].routes) if (rt.endStory) ids.push(rt.endStory);
    if (f.rest.gather?.story) ids.push(f.rest.gather.story);
    if (f.rest.leaveStory) ids.push(f.rest.leaveStory.id);
    if (f.stay.story) ids.push(f.stay.story);
    if (C.nightStory?.[n]) ids.push(C.nightStory[n]);
  }
  ids.push(...Object.values(C.guihu?.releaseStory ?? {}));
  ids.push(F.story, ...Object.values(F.endStory ?? {}), F.regretStory!, F.closeStory!, C.epilogue!.story);
  return ids;
}

describe('第四章整章：過場', () => {
  it('從序章到開爐，每一段過場都存在；說話的人都登記過；媽祖不說話、沒有旨意', () => {
    const ids = storiesOf4();
    // 序章 2（qitou4、qijia4）＋第一天 1（zhuanjin4）＋第二天 6（天亮、出發、過圳、停駕、入廟、進火）
    // ＋第三天 5（天亮、出發、上堤防、轎子回頭、橋頭）＋放下 1＋最後一戰 7（開戰、三結局、遺憾、回宮、開爐）＝22
    expect(ids.length).toBeGreaterThanOrEqual(22);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      const cs = CUTSCENES[id];
      expect(cs, id).toBeDefined();
      for (const l of cs.lines) {
        expect(GODS.includes(l.who), `${id}：${l.who}`).toBe(false);
        if (l.who !== 'narrator') expect(SPEAKERS[l.who], `${id}：${l.who}`).toBeDefined();
        expect(l.text.length, id).toBeGreaterThan(0);
      }
    }
  });

  it('開爐：鏡頭不拍神龕——過場沒有廟（文字版不畫廟）、演出沒有廟也沒有轎；沒有媽祖、沒有神龕說話的人', () => {
    const cs = CUTSCENES.kailu4;
    expect(cs.temple).toBeUndefined();
    expect(cs.mood).not.toBe('temple');
    const sc = STAGES.kailu4;
    expect(sc.temple).toBeUndefined();
    for (const a of sc.actors) expect(a.tex.startsWith('st_jiao') || a.tex.startsWith('temple'), a.id).toBe(false);
    for (const l of cs.lines) expect(['narrator', 'qianshao', 'yawei', 'cunbo', 'aman']).toContain(l.who);
    for (const l of cs.lines) expect(l.text).not.toMatch(/媽祖[：:]/);
  });

  it('香擔的火在任何結局都沒有熄：每一種結局之後都照常回宮、開爐（添火那句不分結局都播）', () => {
    const add = CUTSCENES.kailu4.lines.find((l) => l.text.includes('一勺一勺添進殿裡的爐'))!;
    expect(add).toBeDefined();
    expect(add.when).toBeUndefined();
    expect(CHAPTER4.finale.closeStory).toBe('huigong4');
    for (const s of [...Object.values(CHAPTER4.finale.endStory!), CHAPTER4.finale.regretStory!]) {
      for (const l of CUTSCENES[s!].lines) expect(l.text.includes('火熄') || l.text.includes('火滅'), s).toBe(false);
    }
  });
});

describe('第四章整章：場景接法（程式碼）', () => {
  it('沒有試玩版的天數限制：第一、二夜天亮翻到下一天；第三天日落直接接最後一戰（不問歸處）', () => {
    expect(playableDays(CHAPTER4)).toBeUndefined();
    const trial = raw('/scenes/TrialScene.ts');
    expect(trial).toContain("next: { key: 'almanac', data: { day: this.n + 1 } }");
    expect(trial).toContain('const story = CH().dawnStory?.[this.n + 1];');
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain('if (f.stay.finale) {');
    expect(CHAPTER4.days[3].follow!.stay.finale).toBe(true);
    expect(CHAPTER4.days[1].follow!.stay.finale).toBeUndefined();
    expect(CHAPTER4.days[2].follow!.stay.finale).toBeUndefined();
  });

  it('黃曆起駕 → 出發過場 → 白天；最後一戰 → 結局（或遺憾）→ 回宮 → 開爐的黃曆 → 開爐 → 信徒錄', () => {
    const alm = raw('/scenes/AlmanacScene.ts');
    expect(alm).toContain('CH().departStory?.[day]');
    expect(alm).toContain("go(this, 'story', { id: ep.story, next: { key: 'end' } })");
    const boss = raw('/scenes/BossScene.ts');
    expect(boss).toContain('const close = F.afterClose ?? { key: \'end\' };');
    expect(boss).toContain("const end = F.closeStory ? { key: 'story', data: { id: F.closeStory, next: close } } : close;");
    expect(CHAPTER4.finale.afterClose).toEqual({ key: 'almanac', data: { epilogue: true } });
    // 用到的場景都有註冊
    const main = raw('/main.ts');
    for (const k of ['AlmanacScene', 'DayScene', 'TrialScene', 'StoryScene', 'CutScene', 'BossScene', 'EndScene']) expect(main, k).toContain(k);
  });
});

describe('第四章整章：用規則走一局（不開畫面）', () => {
  /** 走一天：照行程（岔路前 → 押甲／押乙 → 那條路 → 停駕 → post），每件看得到的事都處理（信徒卡選第一個能選的、鬼帶著走） */
  function playDay(n: number, choose: (e: Encounter) => void): string[] {
    const p = CHAPTER4.days[n];
    r().day = n;
    r().hours = p.hours;
    r().miracles = p.miracles;
    for (const d of p.docs) if (!r().evidence.includes(d)) r().evidence.push(d);
    const seen: string[] = [];
    const steps = [...beforeFork(p, r())];
    const walk = (list: typeof steps) => {
      for (const s of list) {
        if (typeof s === 'string') continue;
        if (!visible(r(), s)) continue;
        seen.push(s.id);
        choose(s);
      }
    };
    walk(steps);
    resolveBet(r(), p, p.follow!.goes);
    walk(afterFork(p, r()));
    return seen;
  }
  const handle = (e: Encounter): void => {
    if (e.kind === 'person') {
      const c = CHAPTER4.cards[e.card](r());
      const o = c?.options.find((x) => !x.report && x.hours <= r().hours);
      if (o) {
        r().hours -= o.hours;
        o.apply(r());
      } else r().flags[`missed_${e.card}`] = true;
    }
    if (e.kind === 'ghost' && r().held.length < r().slots) r().held.push({ id: e.caseId, grudge: 0 });
    if (e.kind === 'clue' && e.hours <= r().hours) {
      r().hours -= e.hours;
      r().evidence.push(e.evidence);
    }
  };

  it('三天、兩夜、最後一戰、回宮、開爐、信徒錄：每一步的資料都接得上', () => {
    const G = CHAPTER4.guihu!;
    // 第一天
    const d1 = playDay(1, handle);
    expect(d1.length).toBeGreaterThanOrEqual(5);
    applyBroadcast(r(), 1, CHAPTER4.days[1].broadcast![0]);
    // 第一夜：判對歸處
    for (const id of ['caoxie', 'apo']) {
      const k = CHAPTER4.cases[id];
      const right = k.verdicts.find((v) => v.needs)!;
      r().cases[id] = { truths: [...right.needs!] };
      if (!r().held.some((h) => h.id === id)) r().held.push({ id, grudge: 0 });
      judgeGuihu(r(), k, right, G, 1);
    }
    r().yesterday = CHAPTER4.dawn(r(), 1);
    // 第二天
    const d2 = playDay(2, handle);
    expect(d2.length).toBeGreaterThanOrEqual(5);
    applyBroadcast(r(), 2, CHAPTER4.days[2].broadcast![0]);
    for (const id of ['xinniang', 'jiajiao']) {
      const k = CHAPTER4.cases[id];
      const right = k.verdicts.find((v) => v.needs)!;
      r().cases[id] = { truths: [...right.needs!] };
      if (!r().held.some((h) => h.id === id)) r().held.push({ id, grudge: 0 });
      judgeGuihu(r(), k, right, G, 2);
    }
    // 第三天：拍了三進三退，多兩件事；新娘有跟著
    expect(r().follow!.tags).toEqual(['crowd']);
    const d3 = playDay(3, handle);
    expect(d3).toContain('kneel3');
    expect(d3).toContain('xiuzhi3');
    expect(r().evidence).toContain('dutou_doc');
    CHAPTER4.endOfDay3(r());
    // 最後一戰：打贏，三輪都說得動（黃曆的文獻、押尾），三種結局都能選
    const setup = CHAPTER4.finale.setup(r());
    expect(setup.mode).toBe('ford');
    expect(setup.ford!.chain).toBeGreaterThanOrEqual(2);
    for (const round of CHAPTER4.finale.rounds) {
      const ok = (round.people ?? []).some((p) => p.test(r())) || round.evidence.some((e) => r().evidence.includes(e));
      expect(ok, round.line).toBe(true);
    }
    const b = new BossBattle({ ...setup, seed: 4 });
    CHAPTER4.finale.onEnd!(r(), b, 'recall');
    r().shijuEnd = 'recall';
    // 回宮、開爐的黃曆、開爐、信徒錄
    expect(CHAPTER4.epilogue!.almanac(r()).lunar).toBe('三月二十');
    const ep = CHAPTER4.epitaphs(r());
    expect(ep.map((e) => e.who)).toEqual(['阿滿姨', '阿睿', '賢仔', '秀枝', '阿翰']);
    for (const e of [...ep, ...CHAPTER4.ghostEpitaphs(r()), CHAPTER4.finalEpitaph(r())]) expect(e.text.length, e.who).toBeGreaterThan(5);
    expect(CHAPTER4.ghostEpitaphs(r()).find((e) => e.who === '沒走成的新娘')!.good).toBe(true);
    expect(CHAPTER4.finalEpitaph(r()).good).toBe(true);
  });

  it('遺憾那一局：被帶到下游的人寫進開爐那頁的「昨日」；開爐那天三位信徒的那一小句，沒趕上回宮的拿掉', () => {
    const b = new BossBattle({ ...CHAPTER4.finale.setup(r()), seed: 1 });
    b.stranded.push('阿翰', '金水伯', '美雲', '宗翰');
    r().flags.ford_regret = true;
    CHAPTER4.finale.onEnd!(r(), b, 'regret');
    expect(r().yesterday[0]).toContain('阿翰、金水伯、美雲等 4 人');
    const ahan = CUTSCENES.kailu4.lines.find((l) => l.text === '阿翰把帽子拿在手上。')!;
    expect(ahan.when!(r())).toBe(false);
    const aman = CUTSCENES.kailu4.lines.find((l) => l.text === '阿滿姨抬著頭，嘴巴動了動。')!;
    expect(aman.when!(r())).toBe(true);
    // 遺憾：押尾那句換成「剛好。沒有多。」
    const said = CUTSCENES.kailu4.lines.filter((l) => !l.when || l.when(r())).map((l) => l.text);
    expect(said).toContain('剛好。沒有多。');
    expect(said).not.toContain('多一碗。');
    // 茫渡還在溪裡
    expect(CHAPTER4.finalEpitaph(r()).good).toBe(false);
    // 遺憾：沒有人死
    expect(r().yesterday[0]).toContain('人平安');
    expect(fordEnd4).toBeTypeOf('function');
  });

  it('第一～三章不受影響：沒有 banterTag、briefing、regretStory', () => {
    for (const id of ['wanjia', 'dongjin', 'xinying']) {
      const C = CHAPTERS[id];
      expect(C.banterTag, id).toBeUndefined();
      expect(C.finale.briefing, id).toBeUndefined();
      expect(C.finale.regretStory, id).toBeUndefined();
      for (const p of Object.values(C.days)) expect(p.follow, id).toBeUndefined();
    }
  });
});
