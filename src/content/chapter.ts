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
import { approachHours, impsFlee, moodOf, type Mood } from '../core/renown';
import { CHAPTER2 } from './ch2';
import { BANTER1 } from './banter1';
import { CHAPTER3 } from './ch3';
import { CHAPTER4 } from './ch4';

/** 小妖怎麼處理 */
export type ImpRule =
  /** 驅散：花時辰，當場打散 */
  | { mode: 'scatter'; verb: string; hours: number; result: string; story: string }
  /** 押煞上船：用王令（每天有限），不花時辰 */
  | { mode: 'decree'; verb: string; perDay: number; result: string; story: string }
  /** 乾坤圈（第三章）：不花時辰、不加戾氣；略過的小妖最後一戰變成蝦兵（skipAdds 波） */
  | { mode: 'ring'; verb: string; result: string; story: string; skipAdds: number }
  /**
   * 牽路仔（第四章）：把隊尾落隊的人帶偏。派兵回頭喊花 hours 時辰；附近有點心站可以託人顧（0 時辰，那一攤這段不能再幫別的）。
   * 略過：有人沒跟上（記遺憾，follow.strayed +1）。見 core/procession.ts。
   */
  | { mode: 'stray'; verb: string; hours: number; result: string; story: string; entrustStory: string; skip: string };

/** 第三章點將問罪：堂上出手的將軍（北營夜審不上場） */
export interface General {
  /** east 東營（說謊・證詞）／west 西營（狡辯・物證文獻）／south 南營（純嗆聲） */
  camp: 'east' | 'west' | 'south';
  name: string;
  /** 立繪稱呼（見 art/portraits.ts） */
  portrait: string;
  color: number;
  /** 點這位將軍時按鈕上的說明 */
  does: string;
  /** 打臉時的口頭禪（每句狠話的 hit 之前） */
  shout: string[];
}

export interface TrialStyle {
  /**
   * interrogate：審問供詞；dossier：調閱案卷；dianjiang：點將問罪（第三章；core/dianjiang.ts、ui/dianjiang.ts）；
   * guihu：問歸處（第四章；沿用審問供詞的追問／出示，判決換成歸處，見 core/guihu.ts）
   */
  style: 'interrogate' | 'dossier' | 'dianjiang' | 'guihu';
  /** 每晚能審幾案（沒寫＝不限） */
  perNight?: number;
  /** 點將問罪的將軍 */
  generals?: General[];
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
  /** 第四章：每一夜開審前播的對話（一句一行，「名字：「…」」） */
  intro?: (night: number) => string;
  /** 第四章：大廳上的說明 */
  note?: string;
  /** 第四章：某一夜大廳上多一句說明（第二夜：人已經在北津） */
  nightNote?: Record<number, string>;
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
  /** 贏了之後的判決（needLast：陣前審問最後一輪要說動；needRound：第幾輪要說動，第三章收蛟要第 2 輪） */
  ends: { kind: 'recall' | 'return' | 'slay'; label: string; desc: string; needLast?: boolean; needRound?: number }[];
  winTitle: string;
  winText: string;
  /** 最好結局的劇情 */
  recallStory: string;
  /** 三種結局各自的劇情（有寫就用這個，沒寫的 recall 用 recallStory；第三章） */
  endStory?: Partial<Record<'recall' | 'return' | 'slay', string>>;
  /** 結局劇情之後、信徒錄之前的收尾劇情（第三章：收營） */
  closeStory?: string;
  loseText: string;
  dawnText: string;
  /**
   * 第四章：收尾劇情（closeStory）之後、信徒錄之前再走的一頁（開爐：第 12 天的黃曆 → 開爐過場 → 信徒錄）。
   * 沒寫就照舊直接到信徒錄。
   */
  afterClose?: { key: string; data?: object };
  /** 第四章：打贏、選完判決之後（離開戰鬥前）把戰鬥結果記進進度（被帶到下游沙洲的人） */
  onEnd?: (r: RunState, battle: import('../core/boss').BossBattle, kind: 'recall' | 'return' | 'slay') => void;
  /** 打贏後判決畫面的說明（winText 下面） */
  judgeText?: string;
  /** 第四章：斬魔王沒有懲罰（不加戾氣、不加威名） */
  slayFree?: boolean;
  /** 開打前的說明卡（第四章：顧人過溪）：蓋在操作面板上，按了才開始 */
  briefing?: { title: string; text: string };
  /** 人鏈一段一段出現時的台詞（一組一組播：開打後先播第一組，之後每次人鏈拉住一個人播下一組） */
  chainLines?: (r: RunState) => BanterLine[][];
  /**
   * 戰鬥互嗆換場合（有條件、只講一次的那幾組）：回傳要用的場合；said 是已經換過、講過的場合
   */
  chatKey?: (r: RunState, key: string, said: Set<string>, battle: import('../core/boss').BossBattle) => string;
  /** 第四章（漏掉收尾 F-2）：陣前審問第一次說不動時，戰鬥帶上當場播的一段（只播一次；不改任何數值） */
  wrongLines?: BanterLine[];
}

export interface ChapterDef {
  id: string;
  place: string;
  title: string;
  /** 主神（畫面上稱呼用） */
  god: string;
  /** 畫面風格：山城、漁港、嘉南平原（第三章） */
  look: 'mountain' | 'harbor' | 'plain';
  prologue: Almanac;
  /**
   * 序章擲筊。lines（第四章）：擲到聖筊為止，第 i 個聖筊播 lines[i]；笑杯、陰杯只顯示那句話、重擲（不算次數）
   */
  jiao: { ask: string; times: number; holy: { text: string }; laugh: { text: string }; yin: { text: string }; allHoly: { text: string }; done: string; lines?: string[] };
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
  /** 第四章（漏掉收尾・搞笑）：第 day 天日落、傳消息之前當場播的幾段（沒漏掉就是空的；只播一次） */
  dayEndMissed?: (r: RunState, day: number) => string[];
  /** 判決的名稱 */
  verdictName: Partial<Record<Verdict, string>>;
  /** 超渡這個鬼，最後一戰多的技能（名稱、說明） */
  releaseSkill(id: string): { name: string; desc: string } | null;
  /** 白天：收容的地方叫什麼、怎麼收容、小妖怎麼處理 */
  held: { label: string; sub: string; icon: string; collect: (dayName: string) => string };
  /** 白天、夜審畫面上「鬼」「鬼魂」的稱呼（可選；預設「鬼」。第四章：「好兄弟」）。用 ghostWord() 讀 */
  ghostWord?: string;
  /** 數鬼的量詞（可選；預設「個」。第四章：「位」——「收容了 N 位好兄弟」）。用 ghostUnit() 讀 */
  ghostUnit?: string;
  imp: ImpRule;
  trial: TrialStyle;
  finale: FinaleDef;
  /** 過場用的廟（貼圖） */
  temple: string;
  /** 結局頁的副標 */
  endSub: string;
  // ----- 第三章起的設定（全部可選；沒寫就是第一、二章的規則） -----
  /** 收容格數（預設 3） */
  slots?: number;
  /** 開局就押在收容格的鬼 */
  startHeld?: string[];
  /** 收容格的名稱與顏色（第三章：東青、南紅、西白、北黑、中黃） */
  slotLabels?: { label: string; color: number }[];
  /** 押著過夜：grudge 天亮怨氣 +1、到 3 掙脫（預設）；tame 太子壓下去教訓一晚；carry 跟在頭旗後面走（第四章：不加怨氣、不掙脫） */
  overnight?: 'grudge' | 'tame' | 'carry';
  /** 斬的結算：liqi 一律戾氣 +1、斬錯再 +1（預設）；renown 看斬的是誰（十惡、真惡威名 +1；冤魂戾氣 +1） */
  slayRule?: 'liqi' | 'renown';
  /** 戾氣讓鬼躲起來時可以「風火輪追」（0 時辰、怨氣 +1） */
  chase?: boolean;
  /** 每天早上黃曆後顯示的卡（第三章：成長解鎖，各將一招、合擊、五營合陣；第一、二章：今日陣頭，只說明不改數值） */
  unlocks?: Record<number, { title: string; text: string }>;
  /** 互嗆台詞庫：場合（depart、ring、look、slay…）→ 幾組對話，每組一句一行輪流跳出來（第三章；第一、二章白天起） */
  banter?: Record<string, BanterLine[][]>;
  /** 序章擲筊之後、第一天黃曆之前的劇情（第三章：開營） */
  prologueStory?: string;
  /** 第 n 天的黃曆之前（前一晚天亮前）播的劇情（第三章：第三天溪水倒流） */
  dawnStory?: Record<number, string>;
  // ----- 第四章起（全部可選） -----
  /**
   * 跟轎（第四章）：開局帶 follow 進度；神蹟換成「稟報」。
   * 白天的行程要另外在 DayPlan.follow 寫（core/procession.ts）。
   */
  follow?: { reportLabel: string; reportVerb: string };
  /** 問歸處：歸處（id → 名稱、第幾夜到）。見 core/guihu.ts */
  guihu?: import('../core/guihu').GuihuRules;
  /** 試玩版只做到第幾天：過完這一夜（天亮後）接試玩結束畫面（scenes/SliceEndScene.ts），不翻到下一天 */
  playableDays?: number;
  /** 試玩結束畫面的字 */
  sliceEnd?: { title: string; text: string };
  /** 序章擲筊按鈕的字（沒寫：第三章「請示太子」、其他「請示王爺」） */
  askLabel?: string;
  /** 序章劇情（prologueStory）之後、第一天黃曆之前再播的過場（第四章：深夜起駕 qijia4） */
  openingStory?: string;
  /** 試玩版：最後一夜天亮之後、試玩結束畫面之前播的過場（第四章：tianliang4_1） */
  sliceStory?: string;
  /** 第 n 夜開審之前播的過場（第四章：第二夜進火 jinhuo4） */
  nightStory?: Record<number, string>;
  /** 第 n 天黃曆按「起駕」之後、白天之前播的過場（第四章：第二天出發 chufa4_2） */
  departStory?: Record<number, string>;
  /**
   * 收尾的黃曆（第四章：開爐，第 12 天）。AlmanacScene 用 { epilogue: true } 打開：「昨日」欄照 run.yesterday
   *（最後一戰被帶到下游沙洲的人），按鈕播 story，之後到信徒錄。
   */
  epilogue?: { title: string; area: string; almanac: (r: RunState) => Almanac; button: string; story: string };
  /**
   * 白天互嗆的版本（第四章第三天：新娘有跟著才播的那一組）：回傳的字串接在場合後面，
   * DayScene 先找「場合@第幾天#版本」，沒有才找「場合@第幾天」、「場合」
   */
  banterTag?: (r: RunState) => string | undefined;
}

/**
 * 測試區用：網址加 &full=1 時不管 playableDays，整章走到底（BootScene 設定）。
 * 分支上 playableDays 還是 1，試玩版照舊在第一夜天亮結束。
 */
export const playOverride = { full: false };

/** 這一章試玩版做到第幾天（沒有限制，或網址 &full=1 時是 undefined） */
export function playableDays(ch: ChapterDef = CH()): number | undefined {
  return playOverride.full ? undefined : ch.playableDays;
}

/** 互嗆的一句（一行、不擋操作） */
export interface BanterLine {
  who: string;
  text: string;
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
    // 第一章熱鬧化（第 2 階段）：三種結局各自的劇情＋回宮
    endStory: { recall: 'recall', return: 'shijuReturn1', slay: 'shijuSlay1' },
    closeStory: 'huigong1',
    loseText: '隊伍退回廟裡重整。\n試著把血少的陣頭輪流退到後排回血；石駒刨地時先讓脆的退下來。\n下次石駒的煞氣會少一些。',
    dawnText: '石駒退回山裡。今晚再試一次：\n下次石駒的煞氣會少一些。',
  },
  temple: 'temple_qingling',
  endSub: '青嶺王暗訪・三日之後',
  // 第一章熱鬧化（第 2 階段）：開場（暗訪出廟）、第二夜天亮前（報馬仔回報蹄印）
  prologueStory: 'anfang1',
  dawnStory: { 3: 'shanlu1' },
  // 第一章熱鬧化（第 5 階段）：白天互嗆、今日陣頭卡
  banter: BANTER1,
  unlocks: ch1Days.UNLOCKS1,
};

export const CHAPTERS: Record<string, ChapterDef> = { wanjia: CHAPTER1, dongjin: CHAPTER2, xinying: CHAPTER3, baishadun: CHAPTER4 };

/** 目前這一章 */
export function CH(): ChapterDef {
  return CHAPTERS[run.chapter] ?? CHAPTER1;
}

/**
 * 這一章畫面上怎麼叫鬼（ChapterDef.ghostWord）。沒寫就用 fallback：原本寫「鬼」的地方是「鬼」，
 * 原本寫「鬼魂」的地方傳 '鬼魂'（別章顯示完全不變）。
 */
export function ghostWord(fallback = '鬼', ch: ChapterDef = CH()): string {
  return ch.ghostWord ?? fallback;
}

/** 這一章數鬼的量詞（ChapterDef.ghostUnit；沒寫是「個」） */
export function ghostUnit(ch: ChapterDef = CH()): string {
  return ch.ghostUnit ?? '個';
}

/** 開始一章：重設進度（收容格數、開局押著的鬼依章節設定） */
export function startChapter(id: string): void {
  const ch = CHAPTERS[id];
  resetRun(id, ch.newBelievers(), { slots: ch.slots, startHeld: ch.startHeld, follow: !!ch.follow });
}

/** 判決的名稱（這一章的叫法） */
export function verdictName(v: Verdict): string {
  return CH().verdictName[v] ?? ch1Cases.VERDICT_NAME[v];
}

// ---------- 白天：路上的事 ----------
export type GhostMood = Mood;

/** 戾氣讓鬼躲起來或逃走；第三章威名 ≥2 鬼看到隊伍就跑（見 core/renown.ts） */
export function ghostMood(r: RunState, caseId: string): GhostMood {
  return moodOf(r, CH().cases[caseId].timid, CH());
}

/** 這件事今天還會不會出現 */
export function visible(r: RunState, e: Encounter): boolean {
  switch (e.kind) {
    case 'person': return CH().cards[e.card](r) !== null;
    case 'ghost': return !caseDone(e.caseId) && !isHeld(e.caseId);
    case 'clue': return !r.evidence.includes(e.evidence) && (!e.needs || r.evidence.includes(e.needs));
    case 'talk': return !r.evidence.includes(e.evidence);
    // 第四章：先鋒押中那條路，小妖已經清掉了（core/procession.ts 的 resolveBet）
    // 第四章第三天：傳消息「什麼都不拍」，人少，渡頭路的牽路仔不出現（unlessTag）
    case 'imp': return !r.flags[`cleared_${e.id}`] && !(e.unlessTag && r.follow?.tags.includes(e.unlessTag));
  }
}

/**
 * 收容一隻鬼要幾個時辰：平常不花時辰（只佔收容格）；躲起來要花 1 個時辰勸出來
 *（第三章：風火輪追，不花時辰、怨氣 +1）；被威名嚇跑的要花 1 個時辰追回來。
 */
export function collectHours(r: RunState, caseId: string): number {
  return approachHours(ghostMood(r, caseId), CH());
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
      const cost = mood === 'fled' ? '會逃走'
        : mood === 'scared' ? `見隊伍就跑・追回 ${collectHours(r, e.caseId)} 時辰`
          : mood === 'hiding' && CH().chase ? '躲著・風火輪追（怨氣 +1）'
            : collectHours(r, e.caseId) ? `收容 ${collectHours(r, e.caseId)} 時辰＋1 格` : '收容佔 1 格';
      return { icon: '鬼', title: `${e.place}・${k.dayName}`, cost, color: 0x9fd0ff };
    }
    case 'imp': {
      const rule = CH().imp;
      if (rule.mode === 'stray') {
        return { icon: '妖', title: `${e.place}・牽路仔`, cost: `${rule.verb} ${rule.hours} 時辰${e.stall ? '／託點心站 0' : ''}`, color: 0xc9a0ff };
      }
      const cost = rule.mode === 'scatter' ? `${rule.verb} ${rule.hours} 時辰` : rule.mode === 'decree' ? `${rule.verb}・王令 1 道`
        : impsFlee(r, CH()) ? '見隊伍就逃' : `${rule.verb}・不花時辰`;
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
    // 第四章：臨時轉進、停駕點的事也算
    const extra = p.follow ? [...(p.follow.detour?.encounters ?? []), ...p.follow.rest.encounters] : [];
    for (const r of p.routes) {
      for (const e of [...p.pre, ...r.encounters, ...extra, ...p.post]) {
        if (e.kind === 'ghost' && e.caseId === caseId) out.push(`第${'一二三'[d - 1]}天${r.id}線・${e.place}`);
      }
    }
  }
  return out;
}

/** 證據跟哪隻鬼有關（顯示用） */
export function evidenceFor(id: string): string {
  // 第四章：最後一戰用的證據（ghost 是魔王的 id，不是鬼案）寫魔王的名字
  return CH().cases[CH().evidence[id].ghost]?.dayName ?? CH().finale.bossName;
}

/** 這個證據是最後一戰（陣前審問）用的，不屬於任何鬼案（第四章：渾水溪的舊渡頭） */
export function finaleEvidence(id: string): boolean {
  return !CH().cases[CH().evidence[id]?.ghost ?? ''];
}

/** 這隻鬼相關的證據 id */
export function evidenceOf(caseId: string): string[] {
  return Object.values(CH().evidence).filter((e) => e.ghost === caseId).map((e) => e.id);
}
