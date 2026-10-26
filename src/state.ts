import { newBelievers, type BelieverState } from './content/believers';

/** 一次出巡（原型：三天）的進度與資源 */
export interface RunState {
  /** 第幾天（1–3） */
  day: number;
  /** 香火：法術與升級用的資源 */
  incense: number;
  /** 信徒人數：鞭炮組的火力來源 */
  followers: number;
  /** 士氣 0–100：影響陣頭出手速度 */
  morale: number;
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
  /** 五位信徒目前的狀態（見 content/believers.ts） */
  b: BelieverState;
  /** 今天剩下的時辰 */
  hours: number;
  /** 今天還能顯現幾次神蹟 */
  miracles: number;
  /** 石駒被阿雄的陷阱激怒 */
  shijuEnraged: boolean;
  /** 「昨日」欄：前一天沒照顧到的人發生了什麼 */
  yesterday: string[];
  /** 交陪：已與惠澤宮會香 */
  allied: boolean;
  /** 石駒已被喚回 */
  shijuJoined: boolean;
  /** 最後一戰的判決 */
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
    day: 1,
    incense: 40,
    followers: 12,
    morale: 60,
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
    b: newBelievers(),
    hours: 6,
    miracles: 1,
    shijuEnraged: false,
    yesterday: [],
  };
}

/** 全域唯一的進度（原型不存檔） */
export let run: RunState = newRun();

export function resetRun(): void {
  run = newRun();
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** 套用事件結果，數值自動夾在合理範圍 */
export function applyDelta(d: { incense?: number; followers?: number; morale?: number }): void {
  if (d.incense) run.incense = Math.max(0, run.incense + d.incense);
  if (d.followers) run.followers = Math.max(0, run.followers + d.followers);
  if (d.morale) run.morale = clamp(run.morale + d.morale, 0, 100);
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
