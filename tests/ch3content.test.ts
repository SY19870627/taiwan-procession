/**
 * 第三章「新瀛・太子出營」內容一致性（計畫 §4 階段 1）。
 * 規則：說謊只收證詞、狡辯只收物證／文獻、純嗆聲不用證據；每層真相都有拿得到的證據；
 * 第一天每條路都遇得到四隻鬼；名字不和前兩章重複；氣焰不超過狠話數；引用的貼圖都有畫。
 */
import { describe, it, expect } from 'vitest';
import { CHAPTER3 } from '../src/content/ch3';
import { CASES3, EVIDENCE3 } from '../src/content/ch3/cases';
import { CARDS3, newBelievers3, ledger3, epitaphs3, ghostEpitaphs3, jiaoEpitaph } from '../src/content/ch3/believers';
import { DAY_PLANS3, dawn3 } from '../src/content/ch3/days';
import { FINALE_ROUNDS3, MEMBER_STATS3, RELEASE_SKILL3, finaleSetup3 } from '../src/content/ch3/finale';
import { CASES, EVIDENCE } from '../src/content/cases';
import { CASES2, EVIDENCE2 } from '../src/content/ch2/cases';
import { CARDS } from '../src/content/believers';
import { CARDS2, newBelievers2 } from '../src/content/ch2/believers';
import { newBelievers } from '../src/content/believers';
import type { Encounter } from '../src/content/days';
import { newRun, type RunState } from '../src/state';

const cases = Object.values(CASES3);
const days = [1, 2, 3].map((d) => DAY_PLANS3[d]);

function ch3Run(patch: Partial<RunState> = {}): RunState {
  const r = newRun();
  r.chapter = 'xinying';
  r.b = { ...newBelievers3() };
  r.slots = 5;
  return Object.assign(r, patch);
}

/** 一天裡（某條路）會遇到的事 */
function along(d: number, route: number): Encounter[] {
  const p = DAY_PLANS3[d];
  return [...p.pre, ...p.routes[route].encounters, ...p.post];
}

const allEncounters = days.flatMap((p) => [...p.pre, ...p.routes.flatMap((r) => r.encounters), ...p.post]);

/** 信徒卡在各種狀態下可能給的證據 */
function cardGives(): Set<string> {
  const out = new Set<string>();
  const states: RunState[] = [ch3Run()];
  for (const aling of ['met', 'unmet']) states.push(ch3Run({ b: { ...newBelievers3(), aling } }));
  for (const r of states) {
    for (const f of Object.values(CARDS3)) {
      const c = f(r);
      for (const o of c?.options ?? []) for (const g of o.gives ?? []) out.add(g);
    }
  }
  return out;
}

/** 不靠「審過才掉」就拿得到的證據 */
function obtainable(): Set<string> {
  const out = cardGives();
  for (const p of days) for (const d of p.docs) out.add(d);
  for (const e of allEncounters) if (e.kind === 'clue' || e.kind === 'talk') out.add(e.evidence);
  for (const k of cases) for (const id of k.onCollect ?? []) out.add(id);
  return out;
}

describe('第三章：案子與證據', () => {
  it('九個鬼：四個完整案子、三個十惡、兩個小咖冤魂', () => {
    expect(cases.length).toBe(9);
    const n = (x: string) => cases.filter((k) => k.nature === x).map((k) => k.id).sort();
    expect(n('wicked')).toEqual(['huosha', 'shuigui', 'shuyao']);
    expect(n('villain')).toEqual(['hutou', 'zhizha']);
    expect(n('wronged')).toEqual(['awang', 'dubo', 'shaozaibo', 'yamupo']);
    for (const k of cases) expect(k.innocent).toBe(k.nature === 'wronged');
  });

  it('每案都有點將問罪需要的欄位', () => {
    for (const k of cases) {
      expect(k.camp, k.id).toBeTruthy();
      expect(k.lookLine, k.id).toBeTruthy();
      expect(k.overnight?.say, k.id).toBeTruthy();
      expect(k.flare!, k.id).toBeGreaterThanOrEqual(3);
      expect(k.flare!, k.id).toBeLessThanOrEqual(5);
      expect(k.taunts!.length, k.id).toBeGreaterThanOrEqual(k.flare!);
    }
  });

  it('說謊的證據都是證詞、狡辯的都是物證或文獻、純嗆聲沒有證據', () => {
    for (const k of cases) {
      for (const t of k.taunts!) {
        const kinds = (t.evidence ?? []).map((id) => {
          expect(EVIDENCE3[id], `${k.id}：${id}`).toBeTruthy();
          return EVIDENCE3[id].kind;
        });
        if (t.type === 'lie') {
          expect(kinds.length, `${k.id}：${t.line}`).toBeGreaterThan(0);
          expect(kinds.every((x) => x === '證詞'), `${k.id}：${t.line}`).toBe(true);
        }
        if (t.type === 'excuse') {
          expect(kinds.length, `${k.id}：${t.line}`).toBeGreaterThan(0);
          expect(kinds.every((x) => x === '物證' || x === '文獻'), `${k.id}：${t.line}`).toBe(true);
        }
        if (t.type === 'taunt') expect(kinds.length, `${k.id}：${t.line}`).toBe(0);
        expect(t.hit && t.miss, `${k.id}：${t.line}`).toBeTruthy();
      }
    }
  });

  it('嘴硬（讓牠說）只出現在冤魂身上，冤魂都有心事可說', () => {
    for (const k of cases) {
      const sore = k.taunts!.filter((t) => t.sore);
      if (k.nature === 'wronged') {
        expect(sore.length, k.id).toBeGreaterThan(0);
        expect(k.heart?.length, k.id).toBeGreaterThan(0);
      } else expect(sore.length, k.id).toBe(0);
      for (const t of sore) expect(t.type).toBe('taunt');
    }
  });

  it('每層真相都連著一句狠話，而且有不必審就拿得到的證據', () => {
    const can = obtainable();
    for (const k of cases) {
      k.truths.forEach((t, i) => {
        expect(t.stmt, `${k.id} 第 ${i} 層`).toBeGreaterThanOrEqual(0);
        expect(k.taunts![t.stmt].truth).toBe(i);
        expect(t.evidence.length, `${k.id} 第 ${i} 層`).toBeGreaterThan(0);
        expect(t.evidence.some((id) => can.has(id)), `${k.id} 第 ${i} 層：${t.evidence.join('、')}`).toBe(true);
      });
      // 舊的審問畫面也能用：每句狠話就是一句供詞
      expect(k.statements.length).toBe(k.taunts!.length);
      expect(k.press.length).toBe(k.taunts!.length);
    }
  });

  it('押一晚自動破掉的那句是真的狠話（不是冤魂的嘴硬）', () => {
    for (const k of cases) {
      const b = k.overnight?.breaks;
      if (b === undefined) continue;
      expect(k.taunts![b], k.id).toBeTruthy();
      expect(k.taunts![b].sore, k.id).toBeFalsy();
      expect(k.nature, k.id).not.toBe('wronged');
    }
  });

  it('真惡直接斬拿不到的證據（虎頭的帳本、紙紮童的話）', () => {
    expect(CASES3.hutou.dropsOnTrial).toEqual(['ash_ledger']);
    expect(CASES3.zhizha.dropsOnTrial).toEqual(['zhizha_word']);
    const can = obtainable();
    for (const k of cases) for (const id of k.dropsOnTrial ?? []) {
      expect(EVIDENCE3[id]).toBeTruthy();
      expect(can.has(id), id).toBe(false);
    }
    // 紙紮童的話：第三天堤防線的溪灣線索要先問到
    const shoes = allEncounters.find((e) => e.kind === 'clue' && e.evidence === 'kid_shoes');
    expect(shoes && shoes.kind === 'clue' && shoes.needs).toBe('zhizha_word');
  });

  it('每個證據都有出處說明，且屬於某個鬼', () => {
    for (const e of Object.values(EVIDENCE3)) {
      expect(e.where, e.id).toBeTruthy();
      expect(CASES3[e.ghost], e.id).toBeTruthy();
      expect(EVIDENCE[e.id], `${e.id} 和第一章重複`).toBeUndefined();
      expect(EVIDENCE2[e.id], `${e.id} 和第二章重複`).toBeUndefined();
    }
  });

  it('判決：每個鬼都可以太子親斬；需要的真相索引都存在', () => {
    for (const k of cases) {
      expect(k.verdicts.some((v) => v.verdict === 'slay'), k.id).toBe(true);
      for (const v of k.verdicts) for (const i of v.needs ?? []) expect(k.truths[i], `${k.id} ${v.verdict}`).toBeTruthy();
      expect(k.verdicts.every((v) => ['release', 'recruit', 'escort', 'slay'].includes(v.verdict)), k.id).toBe(true);
    }
  });
});

describe('第三章：章節設定', () => {
  it('營旗下五格、開局押著三隻（兩個十惡、一個冤魂）', () => {
    expect(CHAPTER3.slots).toBe(5);
    expect(CHAPTER3.slotLabels?.length).toBe(5);
    const start = CHAPTER3.startHeld!;
    expect(start).toEqual(['yamupo', 'shuigui', 'huosha']);
    expect(start.filter((id) => CASES3[id].nature === 'wicked').length).toBe(2);
    expect(start.filter((id) => CASES3[id].nature === 'wronged').length).toBe(1);
    expect(CHAPTER3.overnight).toBe('tame');
    expect(CHAPTER3.slayRule).toBe('renown');
    expect(CHAPTER3.trial.style).toBe('dianjiang');
    expect(CHAPTER3.trial.perNight).toBe(2);
    expect(CHAPTER3.imp.mode).toBe('ring');
    expect(CHAPTER3.trial.generals!.map((g) => g.camp)).toEqual(['east', 'west', 'south']);
  });

  it('第一天：每條路都遇得到四隻鬼，營旗下只剩兩格', () => {
    const p = DAY_PLANS3[1];
    for (let i = 0; i < p.routes.length; i++) {
      const ghosts = new Set(along(1, i).flatMap((e) => (e.kind === 'ghost' ? [e.caseId] : [])));
      expect(ghosts.size, p.routes[i].name).toBeGreaterThanOrEqual(4);
      for (const id of ghosts) expect(CHAPTER3.startHeld).not.toContain(id);
    }
    expect(CHAPTER3.slots! - CHAPTER3.startHeld!.length).toBe(2);
  });

  it('三天都有一次岔路；第一天、第二天 6 時辰，第三天 4 時辰', () => {
    for (const p of days) expect(p.routes.length).toBe(2);
    expect(days.map((p) => p.hours)).toEqual([6, 6, 4]);
    expect(DAY_PLANS3[1].routes[0].theme).toBe('duckfarm');
    expect(DAY_PLANS3[3].theme).toBe('ferry');
  });

  it('白天的事都對得上：信徒卡、鬼、證據都存在', () => {
    for (const e of allEncounters) {
      if (e.kind === 'person') expect(CARDS3[e.card], e.id).toBeTruthy();
      if (e.kind === 'ghost') expect(CASES3[e.caseId], e.id).toBeTruthy();
      if (e.kind === 'clue' || e.kind === 'talk') expect(EVIDENCE3[e.evidence], e.id).toBeTruthy();
      if (e.kind === 'clue' && e.needs) expect(EVIDENCE3[e.needs], e.id).toBeTruthy();
    }
    for (const p of days) for (const d of p.docs) expect(EVIDENCE3[d].kind).toBe('文獻');
    const ids = allEncounters.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每個鬼白天都至少遇得到一次，或開局就押著', () => {
    for (const k of cases) {
      const seen = allEncounters.some((e) => e.kind === 'ghost' && e.caseId === k.id);
      expect(seen || CHAPTER3.startHeld!.includes(k.id), k.id).toBe(true);
    }
  });

  it('名字不和前兩章重複（鬼、信徒）', () => {
    const strip = (s: string) => s.replace(/【待定】/g, '');
    const old = new Set<string>();
    for (const k of [...Object.values(CASES), ...Object.values(CASES2)]) { old.add(k.name); old.add(k.dayName); }
    const r1 = newRun();
    r1.b = { ...newBelievers() };
    const r2 = newRun();
    r2.b = { ...newBelievers2() };
    for (const f of Object.values(CARDS)) { const c = f(r1); if (c) old.add(c.who); }
    for (const f of Object.values(CARDS2)) { const c = f(r2); if (c) old.add(c.who); }
    for (const k of cases) {
      expect(old.has(strip(k.name)), k.name).toBe(false);
      expect(old.has(k.dayName), k.dayName).toBe(false);
    }
    const r3 = ch3Run();
    for (const f of Object.values(CARDS3)) { const c = f(r3); if (c) expect(old.has(c.who), c.who).toBe(false); }
    const names = cases.map((k) => strip(k.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('小咖冤魂的名字標了【待定】', () => {
    expect(CASES3.shaozaibo.name).toContain('【待定】');
    expect(CASES3.awang.name).toContain('【待定】');
  });

  it('引用到的貼圖都有畫（程式繪製或既有貼圖）', () => {
    // 美術全部是程式畫的：在 src/art 的原始碼裡找得到貼圖名稱就算有畫
    const files = import.meta.glob('../src/art/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const src = Object.values(files).join('\n');
    expect(src.length).toBeGreaterThan(1000);
    const drawn = (k: string) => src.includes(`'${k}'`) || src.includes(`\`${k}\``) || src.includes(`'${k.replace(/\d+$/, '')}'`);
    const keys = new Set<string>([
      CHAPTER3.held.icon, CHAPTER3.temple,
      ...cases.map((k) => k.tex),
      ...allEncounters.flatMap((e) => (e.kind === 'person' || e.kind === 'talk' || e.kind === 'imp' ? [e.tex] : [])),
      ...CHAPTER3.band(1).map((b) => b[0]),
      ...CHAPTER3.trial.officers.map((o) => o.tex),
      ...Object.values(MEMBER_STATS3).flatMap((m) => m.tex),
    ]);
    for (const k of keys) expect(drawn(k), k).toBe(true);
  });
});

describe('第三章：信徒、黃曆、最後一戰占位', () => {
  it('五位信徒：因果簿五行、信徒錄五人、鬼的結局九個', () => {
    const r = ch3Run();
    expect(ledger3(r).length).toBe(5);
    expect(ledger3(r).every(Boolean)).toBe(true);
    expect(epitaphs3(r).map((e) => e.who)).toEqual(['炳伯', '阿凱', '鴨嬸', '阿玲', '何伯']);
    expect(ghostEpitaphs3(r).length).toBe(9);
    for (const end of ['recall', 'slay', 'return'] as const) expect(jiaoEpitaph({ ...r, shijuEnd: end }).text).toBeTruthy();
  });

  it('黃曆：序章與三天都有宜忌與舊聞；擲筊的說法標了【待定】', () => {
    expect(CHAPTER3.prologue.ji).toBe('食鴨');
    for (const p of days) {
      const a = p.almanac(ch3Run());
      expect(a.lunar && a.yi && a.ji && a.text, p.title).toBeTruthy();
    }
    expect(DAY_PLANS3[2].almanac(ch3Run()).lunar).toBe('九月初九');
    expect(CHAPTER3.jiao.holy.text).toContain('【待定】');
  });

  it('信徒卡：每個選項都寫了花費與結果，選了不會當掉', () => {
    for (const [id, f] of Object.entries(CARDS3)) {
      const c = f(ch3Run());
      if (!c) continue;
      for (const o of c.options) {
        expect(o.result, id).toBeTruthy();
        expect(o.hours, id).toBeGreaterThan(0);
        const r = ch3Run();
        expect(o.apply(r), id).toBeTruthy();
      }
      expect(c.ignore, id).toBeTruthy();
    }
  });

  it('天亮：沒顧到的人會出事（阿玲沒請到奶嘴、阿凱的頭盔）', () => {
    const r = ch3Run();
    dawn3(r, 1);
    const out = dawn3(r, 2);
    expect(r.b.aling).toBe('missed');
    expect(r.b.akai).toBe('flopped');
    expect(out.length).toBeGreaterThan(0);
    const r2 = ch3Run();
    r2.cases.yamupo = { verdict: 'release', truths: [1, 2] };
    expect(dawn3(r2, 1)[0]).toContain('一隻都沒少');
    expect(r2.b.yashen).toBe('thanked');
  });

  it('陣前審問三輪（70／40／10%）的證據都存在；收蛟要第 2 輪說動', () => {
    expect(FINALE_ROUNDS3.length).toBe(3);
    for (const round of FINALE_ROUNDS3) for (const id of round.evidence) expect(EVIDENCE3[id], id).toBeTruthy();
    expect(FINALE_ROUNDS3[0].evidence).toContain('ash_ledger');
    const recall = CHAPTER3.finale.ends.find((e) => e.kind === 'recall');
    expect(recall?.needRound).toBe(2);
    expect(Object.keys(RELEASE_SKILL3).sort()).toEqual(['dubo', 'yamupo']);
  });

  it('最後一戰的設定能產生：五將都在、收編的鬼會加入', () => {
    const r = ch3Run();
    const s = finaleSetup3(r);
    expect(s.members.map((m) => m.stats.key)).toEqual(['zhang', 'xiao', 'liu', 'lian']);
    r.flags.recruit_hutou = true;
    expect(finaleSetup3(r).members.map((m) => m.stats.key)).toContain('hutou');
  });
});
