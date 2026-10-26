/**
 * 章節：每一章自己的行程、信徒、案子、證據、黃曆、結局與最後一戰。
 * 畫面（白天、夜審、最後一戰、結局）都從這裡拿「目前這一章」的資料，所以加新章節不用改畫面。
 *
 * 神明不同，辦事的方式也不同（見 docs/東津迎王_故事大綱）：
 *  - 小妖：青嶺王「驅散」（花時辰）；代天巡狩的千歲爺「押煞上船」（用王令，不花時辰）。
 *  - 夜審：青嶺王由文武判官「審問供詞」；千歲爺在代天府「調閱案卷」，用證據補正塗改、缺頁、模糊的記載。
 *  - 最後一戰：青嶺王的天令、淨符；雲王爺的五王火、王令。
 */
import type { RunState } from '../state';
import { caseDone, gainEvidence, isHeld, run, resetRun } from '../state';
import type { Almanac, Card, Epitaph, LedgerLine } from './believers';
import type { DayPlan, Encounter } from './days';
import type { Evidence, GhostCase, Verdict } from './cases';
import type { FinaleRound } from './finale';
import type { BossSetup, MemberStats } from '../core/boss';
import * as ch1Believers from './believers';
import * as ch1Days from './days';
import * as ch1Cases from './cases';
import * as ch1Finale from './finale';
import { SKILLS } from '../core/boss';
import { CHAPTER2 } from './ch2';

/** 小妖怎麼處理 */
export type ImpRule =
  /** 驅散：花時辰，當場打散 */
  | { mode: 'scatter'; verb: string; hours: number; result: string; story: string }
  /** 押煞上船：用王令（每天有限），不花時辰 */
  | { mode: 'decree'; verb: string; perDay: number; result: string; story: string };

export interface TrialStyle {
  /** interrogate：審問供詞；dossier：調閱案卷 */
  style: 'interrogate' | 'dossier';
  plaque: string;
  officers: { tex: string; label: string; tint?: number }[];
  lobbyTitle: (n: number) => string;
  /** 押上堂時說的話 */
  open: (dayName: string) => string;
  /** 「供詞」或「案卷記載」 */
  listTitle: string;
  /** 「追問」或「問牠」 */
  ask: string;
  /** 「出示」或「補正」 */
  show: string;
  /** 揭開真相後，誰記下來 */
  record: string;
  /** 出示錯了 */
  wrongTail: string;
  rule: string;
  again: string;
  recruitSay: string;
  slayLine: (name: string) => string;
  wrongedLine: string;
  shipLine: (name: string) => string;
  /** 夜審最後一夜的按鈕 */
  finalLabel: string;
}

export interface FinaleDef {
  /** 最後一戰前的劇情 */
  story: string;
  cutTitle: string;
  cutSub: string;
  title: string;
  place: string;
  bossName: string;
  /** 戰鬥帶右上角：魔王從哪邊來 */
  bossFrom: string;
  setup(r: RunState): BossSetup;
  rounds: FinaleRound[];
  wrong: string;
  members: Record<string, MemberStats & { tex: string[]; desc: string }>;
  /** 收編的鬼（畫成半透明藍色） */
  ghostMembers: string[];
  /** 贏了之後的判決 */
  ends: { kind: 'recall' | 'return' | 'slay'; label: string; desc: string; needLast?: boolean }[];
  winTitle: string;
  winText: string;
  /** 最好結局的劇情 */
  recallStory: string;
  loseText: string;
  dawnText: string;
}

export interface ChapterDef {
  id: string;
  place: string;
  title: string;
  /** 主神（畫面上稱呼用） */
  god: string;
  /** 畫面風格：山城或漁港 */
  look: 'mountain' | 'harbor';
  prologue: Almanac;
  jiao: { ask: string; times: number; holy: { text: string }; laugh: { text: string }; yin: { text: string }; allHoly: { text: string }; done: string };
  /** 序章黃曆下方那句話 */
  prologueLine: string;
  days: Record<number, DayPlan>;
  /** 白天隊伍的排列（貼圖、x、大小），可以依天數不同 */
  band(day: number): [string, number, number][];
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
  /** 判決的名稱 */
  verdictName: Partial<Record<Verdict, string>>;
  /** 超渡這個鬼，最後一戰多的技能（名稱、說明） */
  releaseSkill(id: string): { name: string; desc: string } | null;
  /** 白天：收容的地方叫什麼、怎麼收容、小妖怎麼處理 */
  held: { label: string; sub: string; icon: string; collect: (dayName: string) => string };
  imp: ImpRule;
  trial: TrialStyle;
  finale: FinaleDef;
  /** 過場用的廟（貼圖） */
  temple: string;
  /** 結局頁的副標 */
  endSub: string;
}

const CHAPTER1: ChapterDef = {
  id: 'wanjia', place: '萬舺', title: '青嶺王暗訪', god: '青嶺王', look: 'mountain',
  prologue: ch1Believers.PROLOGUE,
  jiao: ch1Believers.PROLOGUE_JIAO,
  prologueLine: '阿土伯：「香斷了三次……王爺有話要說。」',
  days: ch1Days.DAY_PLANS,
  band: () => [
    ['flag1', 820, 0.8], ['qiye', 700, 0.72], ['baye', 650, 0.72], ['palanquin', 480, 0.78],
    ['bajiang0', 330, 0.72], ['bajiang1', 280, 0.72], ['lion', 170, 0.72], ['paoshou', 70, 0.72],
  ],
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
  verdictName: ch1Cases.VERDICT_NAME,
  releaseSkill: (id) => {
    const k = ch1Finale.RELEASE_SKILL[id];
    return k ? SKILLS[k] : null;
  },
  held: {
    label: '令旗下', sub: '今晚審', icon: 'flag1',
    collect: (n) => `七爺的鎖鏈一甩，${n}沒有掙扎，跟著回到了令旗下。\n今晚升堂再審。`,
  },
  imp: { mode: 'scatter', verb: '驅散', hours: 1, result: '當場打散，牠們不會跟到最後一戰', story: '八將衝上前，小妖四散逃竄。' },
  trial: {
    style: 'interrogate',
    plaque: '明　察　秋　毫',
    officers: [{ tex: 'judge', label: '文判官' }, { tex: 'judge', label: '武判官', tint: 0x9a6a6a }],
    lobbyTitle: (n) => `第 ${n} 夜・升堂`,
    open: (n) => `${n}被押上堂來。\n文判官：「報上名來，說說你為什麼留在陽間。」`,
    listTitle: '供詞',
    ask: '追問', show: '出示',
    record: '文判官提筆記下',
    wrongTail: '對不上。鬼起了疑心，怨氣 +1。',
    rule: '出示錯的證據，怨氣 +1；怨氣到 3，牠就不肯再開口',
    again: '文判官：「不急，再問問。」',
    recruitSay: '「願隨王爺左右，贖我的罪。」',
    slayLine: (n) => `武判官手起刀落。${n}化成一縷青煙，散了。`,
    wrongedLine: '文判官放下了筆，很久沒有說話。',
    shipLine: (n) => `${n}上了船。`,
    finalLabel: '出陣・喚回石駒',
  },
  finale: {
    story: 'dusk3', cutTitle: '石駒現身', cutSub: '最後一戰・喚回石駒',
    title: '最後一戰・喚回石駒', place: '芝嶺巖惠澤宮', bossName: '石駒', bossFrom: '石駒從北邊來 ▶',
    setup: ch1Finale.finaleSetup,
    rounds: ch1Finale.FINALE_ROUNDS,
    wrong: ch1Finale.FINALE_WRONG,
    members: ch1Finale.MEMBER_STATS,
    ghostMembers: ch1Finale.GHOST_MEMBERS,
    ends: [
      { kind: 'recall', label: '喚回', desc: '石駒歸隊，成為青嶺王的坐騎', needLast: true },
      { kind: 'return', label: '送回山中', desc: '牠回到山裡繼續等；不再下山作亂' },
      { kind: 'slay', label: '斬', desc: '石駒化為碎石。戾氣 +1，記遺憾' },
    ],
    winTitle: '石駒的煞氣散了',
    winText: '牠跪在廟埕上，喘著氣，看著你們。要怎麼判？',
    recallStory: 'recall',
    loseText: '隊伍退回廟裡重整。\n試著把血少的陣頭輪流退到後排回血；石駒刨地時先讓脆的退下來。\n下次石駒的煞氣會少一些。',
    dawnText: '石駒退回山裡。今晚再試一次：\n下次石駒的煞氣會少一些。',
  },
  temple: 'temple_qingling',
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

/** 判決的名稱（這一章的叫法） */
export function verdictName(v: Verdict): string {
  return CH().verdictName[v] ?? ch1Cases.VERDICT_NAME[v];
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
    case 'imp': {
      const rule = CH().imp;
      const cost = rule.mode === 'scatter' ? `${rule.verb} ${rule.hours} 時辰` : `${rule.verb}・王令 1 道`;
      return { icon: '妖', title: `${e.place}・小妖`, cost, color: 0xc9a0ff };
    }
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
