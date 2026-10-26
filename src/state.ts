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
  /** 令旗下收容中的鬼（grudge：怨氣 0–3，到 3 會掙脫） */
  held: { id: string; grudge: number }[];
  /** 收容格數 */
  slots: number;
  /** 戾氣 0–3：斬鬼會上升，鬼魂會躲起來或逃走 */
  liqi: number;
  /** 每個案子的結果 */
  cases: Record<string, { verdict?: import('./content/cases').Verdict; escaped?: boolean; truths: number[] }>;
  /** 最後一戰多出來的小妖波數（神蹟、沒驅散的小妖） */
  bossAdds: number;
  /** 戰鬥失敗重來的次數 */
  retries: number;
  /** 三天總共捉到的小妖 */
  totalCaptured: number;
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

export function resetRun(chapter = 'wanjia', believers?: Record<string, string>): void {
  run = newRun();
  run.chapter = chapter;
  if (believers) run.b = { ...believers };
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
