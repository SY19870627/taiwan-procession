import { newBelievers } from './content/believers';

/** 一次出巡（原型：三天）的進度與資源 */
export interface RunState {
  /** 目前的章節（見 content/chapter.ts） */
  chapter: string;
  /** 第幾天（1–3） */
  day: number;
  /** 判官審出的情報 */
  intel: {
    /** 醒獅震擊對石屑傀加倍 */
    quakeTip?: boolean;
    /** 今晚妖怪主要從哪一邊來 */
    mainSide?: -1 | 1;
    /** 知道石駒肚子的舊傷 */
    bellyWound?: boolean;
    /** 知道石駒衝鋒後會喘息較久 */
    longBreath?: boolean;
    /** 小魍怕鹽米（解鎖信徒卡上的便宜選項） */
    salt?: boolean;
  };
  /** 信徒目前的狀態（每章自己定義，見各章的 believers） */
  b: Record<string, string>;
  /** 今天剩下的時辰 */
  hours: number;
  /** 今天還能顯現幾次神蹟 */
  miracles: number;
  /** 第二章：今天還有幾道王令（押煞上船用） */
  decrees: number;
  /** 石駒被阿雄的陷阱激怒 */
  shijuEnraged: boolean;
  /** 「昨日」欄：前一天沒照顧到的人發生了什麼 */
  yesterday: string[];
  /** 交陪：已與惠澤宮會香 */
  allied: boolean;
  /** 石駒已被喚回 */
  shijuJoined: boolean;
  /** 最後一戰的判決（第一章：喚回／送回山中／斬；第二章：一起送走／鎮回海裡／斬） */
  shijuEnd?: 'recall' | 'return' | 'slay';
  /** 白天事件的旗標 */
  flags: Record<string, boolean>;
  /** 證物袋：白天拿到的證據 id */
  evidence: string[];
  /**
   * 令旗下收容中的鬼（grudge：怨氣 0–3，到 3 會掙脫）。
   * 第三章：tamed＝被太子壓過一晚（隔天氣焰 -1）；looked＝北營看過相。
   */
  held: Held[];
  /** 收容格數 */
  slots: number;
  /** 戾氣 0–3：斬鬼會上升，鬼魂會躲起來或逃走 */
  liqi: number;
  /** 每個案子的結果 */
  cases: Record<string, { verdict?: import('./content/cases').Verdict; escaped?: boolean; truths: number[]; dj?: import('./core/dianjiang').DjProgress }>;
  /** 最後一戰多出來的小妖波數（神蹟、沒驅散的小妖） */
  bossAdds: number;
  /** 戰鬥失敗重來的次數 */
  retries: number;
  /** 三天總共捉到的小妖 */
  totalCaptured: number;
  /** 第三章：威名 0–5（斬十惡、揭穿後斬真惡 +1）；其他章一直是 0 */
  weiming: number;
  /** 第三章：今晚還能審幾案（每晚 2 案）；沒有限制的章節是 undefined */
  trialsLeft?: number;
  /** 第四章：跟轎的進度（押先鋒、牽路仔、稟報、傳消息）；其他章 undefined（見 core/procession.ts） */
  follow?: FollowState;
}

/** 第四章：跟轎的進度 */
export interface FollowState {
  /** 今天先鋒押在哪：路線 id（甲／乙）或 'stay'（留在轎邊）；還沒到岔路是 undefined */
  bet?: string;
  /** 押兵的結果：hit 押中、miss 押錯、stay 留在轎邊 */
  betResult?: 'hit' | 'miss' | 'stay';
  /** 被牽路仔帶偏、沒跟上的人（遺憾；最後一戰與黃曆「昨日」用） */
  strayed: number;
  /** 每天日落傳消息選了什麼（天數 → 選項 id） */
  broadcast: Record<number, string>;
  /** 明天事件池的標籤（傳消息決定；DayPlan.tagged 依這個加事件） */
  tags: string[];
  /** 最後一戰「人鏈」：會下水牽人的有幾段 */
  chain: number;
  /** 用掉的點心站（`段:攤名`；同一段同一攤只能幫一件事） */
  stallsUsed: string[];
  /** 稟報過的事（選項 key → 轎子有沒有停） */
  reports: Record<string, boolean>;
  /** 每天被牽路仔帶偏的人數（天數 → 人數；略過牽路仔時才建立） */
  strayedDay?: Record<number, number>;
}

export function newFollow(): FollowState {
  return { strayed: 0, broadcast: {}, tags: [], chain: 0, stallsUsed: [], reports: {} };
}

export interface Held {
  id: string;
  grudge: number;
  tamed?: boolean;
  looked?: boolean;
  /** 第四章問歸處：決定帶去哪裡（歸處 id）；到了才放下，在那之前一直佔著格子（跨天） */
  dest?: string;
  /** 第四章：第幾夜決定帶著走的 */
  since?: number;
}

/** 開始一章時，依章節設定的收容格數與預放的鬼（第一、二章：3 格、不預放） */
export interface RunOpts {
  slots?: number;
  startHeld?: string[];
  /** 第四章：跟轎 */
  follow?: boolean;
}

export function newRun(): RunState {
  return {
    chapter: 'wanjia',
    day: 1,
    intel: {},
    allied: false,
    shijuJoined: false,
    flags: {},
    retries: 0,
    totalCaptured: 0,
    evidence: [],
    held: [],
    slots: 3,
    liqi: 0,
    weiming: 0,
    cases: {},
    bossAdds: 0,
    b: { ...newBelievers() },
    hours: 6,
    miracles: 1,
    decrees: 0,
    shijuEnraged: false,
    yesterday: [],
  };
}

/** 全域唯一的進度（原型不存檔） */
export let run: RunState = newRun();

export function resetRun(chapter = 'wanjia', believers?: Record<string, string>, opts: RunOpts = {}): void {
  run = newRun();
  run.chapter = chapter;
  if (believers) run.b = { ...believers };
  if (opts.slots) run.slots = opts.slots;
  if (opts.startHeld) run.held = opts.startHeld.map((id) => ({ id, grudge: 0 }));
  if (opts.follow) run.follow = newFollow();
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}


/** 拿到證據（重複的不算），回傳是不是新的 */
export function gainEvidence(id: string): boolean {
  if (run.evidence.includes(id)) return false;
  run.evidence.push(id);
  return true;
}

/** 這個案子已經有結果了（判決過或掙脫） */
export function caseDone(id: string): boolean {
  const c = run.cases[id];
  return !!c && (!!c.verdict || !!c.escaped);
}

export function isHeld(id: string): boolean {
  return run.held.some((h) => h.id === id);
}
