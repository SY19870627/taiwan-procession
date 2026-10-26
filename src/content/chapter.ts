/**
 * 章節：每一章自己的行程、信徒、案子、證據、黃曆、結局與最後一戰。
 * 畫面（白天、夜審、結局）都從這裡拿「目前這一章」的資料，所以加新章節不用改畫面。
 */
import type { RunState } from '../state';
import { caseDone, gainEvidence, isHeld, run, resetRun } from '../state';
import type { Almanac, Card, Epitaph, LedgerLine } from './believers';
import type { DayPlan, Encounter } from './days';
import type { Evidence, GhostCase, Verdict } from './cases';
import * as ch1Believers from './believers';
import * as ch1Days from './days';
import * as ch1Cases from './cases';
import * as ch1Finale from './finale';
import { SKILLS } from '../core/boss';
import { CHAPTER2 } from './ch2';

export interface ChapterDef {
  id: string;
  place: string;
  title: string;
  /** 主神（畫面上稱呼用） */
  god: string;
  prologue: Almanac;
  jiao: { ask: string; times: number; holy: { text: string }; laugh: { text: string }; yin: { text: string }; allHoly: { text: string }; done: string };
  /** 序章黃曆下方那句話 */
  prologueLine: string;
  days: Record<number, DayPlan>;
  cases: Record<string, GhostCase>;
  evidence: Record<string, Evidence>;
  cards: Record<string, (r: RunState) => Card | null>;
  newBelievers(): Record<string, string>;
  ledger(r: RunState): LedgerLine[];
  bossEffects(r: RunState): string[];
  epitaphs(r: RunState): Epitaph[];
  ghostEpitaphs(r: RunState): Epitaph[];
  finalEpitaph(r: RunState): Epitaph;
  dawn(r: RunState, n: number): string[];
  endOfDay3(r: RunState): void;
  verdictEffects(r: RunState, id: string, verdict: Verdict): string[];
  /** 超渡這個鬼，最後一戰多的技能（名稱、說明） */
  releaseSkill(id: string): { name: string; desc: string } | null;
  /** 最後一戰的場景與開場 */
  finale: { scene: string; story: string; cutTitle: string; cutSub: string };
  /** 過場用的廟（貼圖） */
  temple: string;
  /** 夜審的匾額 */
  hall: string;
  /** 結局頁的副標 */
  endSub: string;
}

const CHAPTER1: ChapterDef = {
  id: 'wanjia', place: '萬舺', title: '青嶺王暗訪', god: '青嶺王',
  prologue: ch1Believers.PROLOGUE,
  jiao: ch1Believers.PROLOGUE_JIAO,
  prologueLine: '阿土伯：「香斷了三次……王爺有話要說。」',
  days: ch1Days.DAY_PLANS,
  cases: ch1Cases.CASES,
  evidence: ch1Cases.EVIDENCE,
  cards: ch1Believers.CARDS,
  newBelievers: () => ({ ...ch1Believers.newBelievers() }),
  ledger: ch1Believers.ledger,
  bossEffects: ch1Believers.bossEffects,
  epitaphs: ch1Believers.epitaphs,
  ghostEpitaphs: ch1Believers.ghostEpitaphs,
  finalEpitaph: ch1Believers.shijuEpitaph,
  dawn: ch1Days.dawn,
  endOfDay3: ch1Days.endOfDay3,
  verdictEffects: ch1Days.verdictEffects,
  releaseSkill: (id) => {
    const k = ch1Finale.RELEASE_SKILL[id];
    return k ? SKILLS[k] : null;
  },
  finale: { scene: 'boss', story: 'dusk3', cutTitle: '石駒現身', cutSub: '最後一戰・喚回石駒' },
  temple: 'temple_qingling',
  hall: '明　察　秋　毫',
  endSub: '青嶺王暗訪・三日之後',
};

export const CHAPTERS: Record<string, ChapterDef> = { wanjia: CHAPTER1, dongjin: CHAPTER2 };

/** 目前這一章 */
export function CH(): ChapterDef {
  return CHAPTERS[run.chapter] ?? CHAPTER1;
}

/** 開始一章：重設進度 */
export function startChapter(id: string): void {
  resetRun(id, CHAPTERS[id].newBelievers());
}

// ---------- 白天：路上的事 ----------
export type GhostMood = 'normal' | 'hiding' | 'fled';

/** 戾氣讓鬼躲起來或逃走 */
export function ghostMood(r: RunState, caseId: string): GhostMood {
  const t = CH().cases[caseId].timid;
  if (r.liqi >= t + 1) return 'fled';
  if (r.liqi >= t) return 'hiding';
  return 'normal';
}

/** 這件事今天還會不會出現 */
export function visible(r: RunState, e: Encounter): boolean {
  switch (e.kind) {
    case 'person': return CH().cards[e.card](r) !== null;
    case 'ghost': return !caseDone(e.caseId) && !isHeld(e.caseId);
    case 'clue': return !r.evidence.includes(e.evidence) && (!e.needs || r.evidence.includes(e.needs));
    case 'talk': return !r.evidence.includes(e.evidence);
    case 'imp': return true;
  }
}

/** 收容一隻鬼要幾個時辰：平常不花時辰（只佔收容格）；躲起來要花 1 個時辰勸出來 */
export function collectHours(r: RunState, caseId: string): number {
  return ghostMood(r, caseId) === 'hiding' ? 1 : 0;
}

/** 戾氣 3：凡人也不太敢靠近，問話會沒人理 */
export function talkBlocked(r: RunState): boolean {
  return r.liqi >= 3;
}

/** 一句話摘要（「前方」清單用） */
export function summary(r: RunState, e: Encounter): { icon: string; title: string; cost: string; color: number } {
  switch (e.kind) {
    case 'person': {
      const c = CH().cards[e.card](r) as Card;
      const min = Math.min(...c.options.map((o) => o.hours));
      return { icon: '人', title: `${e.place}・${c.who}${c.deadline ? '【急】' : ''}`, cost: `${min} 時辰起`, color: 0xe9b949 };
    }
    case 'ghost': {
      const k = CH().cases[e.caseId];
      const mood = ghostMood(r, e.caseId);
      return { icon: '鬼', title: `${e.place}・${k.dayName}`, cost: mood === 'fled' ? '會逃走' : collectHours(r, e.caseId) ? `收容 ${collectHours(r, e.caseId)} 時辰＋1 格` : '收容佔 1 格', color: 0x9fd0ff };
    }
    case 'imp': return { icon: '妖', title: `${e.place}・小妖`, cost: '驅散 1 時辰', color: 0xc9a0ff };
    case 'clue': return { icon: '證', title: `${e.place}・線索`, cost: `${e.hours} 時辰`, color: 0x9fe8c0 };
    case 'talk': return { icon: '問', title: `${e.place}・${e.who}`, cost: talkBlocked(r) ? '不敢靠近' : `問話 ${e.hours} 時辰`, color: 0x9fe8c0 };
  }
}

/** 起駕時把黃曆上的文獻收進證物袋，回傳新得到的 */
export function takeDocs(plan: DayPlan): string[] {
  return plan.docs.filter((id) => gainEvidence(id));
}

/** 這隻鬼之後還會在哪裡出現（今天之後） */
export function laterSightings(caseId: string, day: number): string[] {
  const out: string[] = [];
  for (let d = day + 1; d <= 3; d++) {
    const p = CH().days[d];
    for (const r of p.routes) {
      for (const e of [...p.pre, ...r.encounters, ...p.post]) {
        if (e.kind === 'ghost' && e.caseId === caseId) out.push(`第${'一二三'[d - 1]}天${r.id}線・${e.place}`);
      }
    }
  }
  return out;
}

/** 證據跟哪隻鬼有關（顯示用） */
export function evidenceFor(id: string): string {
  return CH().cases[CH().evidence[id].ghost].dayName;
}

/** 這隻鬼相關的證據 id */
export function evidenceOf(caseId: string): string[] {
  return Object.values(CH().evidence).filter((e) => e.ghost === caseId).map((e) => e.id);
}
