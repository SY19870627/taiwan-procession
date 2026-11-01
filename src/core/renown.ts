/**
 * 第三章的白天規則（純邏輯，可測試）：威名、戾氣、看相、快判、風火輪追、小妖自己逃。
 * 見 docs/第三章_開發計畫.md §2.2、D3、D4、D5、D12、D13、D36～。
 *
 * 第一、二章不設 slayRule／chase，這裡的函式回到原本的規則（斬一律戾氣 +1、斬錯再 +1；戾氣讓鬼躲或逃）。
 */
import type { RunState } from '../state';
import { clamp } from '../state';
import type { GhostCase, Nature } from '../content/cases';

export const WEIMING_MAX = 5;
/** 威名 ≥1：路上的小妖看到隊伍自己逃（算清掉） */
export const IMP_FLEE_AT = 1;
/** 威名 ≥2：路上的鬼（不分善惡）看到隊伍就逃，追回要 1 時辰 */
export const SCARE_AT = 2;
/** 威名 ≥2／≥4：惡鬼夜審開場氣焰 -1／-2（core/dianjiang.ts 的 startFlare） */
export const FLARE_CUT_AT = [2, 4] as const;
/** 威名讓鬼逃走時，追回要幾個時辰 */
export const CATCH_HOURS = 1;
/** 北營看相要幾個時辰 */
export const LOOK_HOURS = 1;
/** 路邊點將要幾個時辰（DayScene.roadside） */
export const ROADSIDE_HOURS = 1;

/** 章節規則（只取這裡需要的，測試時不用整個 ChapterDef） */
export interface Rules {
  slayRule?: 'liqi' | 'renown';
  chase?: boolean;
}

/**
 * 鬼看到隊伍的反應：
 *  - normal：照常
 *  - hiding：戾氣讓牠躲起來（第一、二章：花 1 時辰勸出來；第三章：風火輪追，0 時辰、怨氣 +1）
 *  - scared：威名讓牠看到隊伍就跑（第三章：花 1 時辰追回，不追就錯過）
 *  - fled：戾氣讓牠逃走，今天收不到
 * 順序：戾氣的逃走最重，其次是威名的逃跑，最後是戾氣的躲（D4：威名不能把戾氣的代價蓋掉）。
 */
export type Mood = 'normal' | 'hiding' | 'scared' | 'fled';

export function moodOf(r: Pick<RunState, 'liqi' | 'weiming'>, timid: number, rules: Rules = {}): Mood {
  if (r.liqi >= timid + 1) return 'fled';
  if (rules.slayRule === 'renown' && r.weiming >= SCARE_AT) return 'scared';
  if (r.liqi >= timid) return 'hiding';
  return 'normal';
}

/** 處理這隻鬼之前要先花幾個時辰（勸出來、追回來）；風火輪追不花時辰 */
export function approachHours(mood: Mood, rules: Rules = {}): number {
  if (mood === 'scared') return CATCH_HOURS;
  if (mood === 'hiding') return rules.chase ? 0 : 1;
  return 0;
}

/** 收容時多出來的怨氣：風火輪追來的鬼被嚇過，怨氣 +1（D5） */
export function collectGrudge(mood: Mood, rules: Rules = {}): number {
  return mood === 'hiding' && rules.chase ? 1 : 0;
}

/** 威名 ≥1：路上的小妖看到隊伍自己逃 */
export function impsFlee(r: Pick<RunState, 'weiming'>, rules: Rules = {}): boolean {
  return rules.slayRule === 'renown' && r.weiming >= IMP_FLEE_AT;
}

/** 威名讓惡鬼夜審開場氣焰少幾格（點將問罪的開場氣焰） */
export function flareCut(weiming: number): number {
  return FLARE_CUT_AT.filter((t) => weiming >= t).length;
}

/** 鬼的身分（第一、二章沒填 nature：有冤＝冤魂，其他當真惡） */
export function natureOf(k: GhostCase): Nature {
  return k.nature ?? (k.innocent ? 'wronged' : 'villain');
}

/** 北營看相後格子上的標記 */
export const LOOK_TAG: Record<Nature, { s: string; color: string }> = {
  wicked: { s: '十惡', color: '#8a1b14' },
  wronged: { s: '有冤', color: '#2b5aa8' },
  villain: { s: '該斬', color: '#6a3a1a' },
};

export function isLooked(r: RunState, id: string): boolean {
  return !!r.flags[`looked_${id}`];
}

/** 北營看相：記下來（格子上的 looked 一起標），回傳廉將軍說的話 */
export function lookAt(r: RunState, k: GhostCase): string {
  r.flags[`looked_${k.id}`] = true;
  const h = r.held.find((x) => x.id === k.id);
  if (h) h.looked = true;
  return k.lookLine ?? '';
}

/** 真惡算不算「揭穿了」：至少查明一層真相（D36） */
export function exposed(r: RunState, k: GhostCase): boolean {
  return (r.cases[k.id]?.truths.length ?? 0) > 0;
}

export interface SlayResult {
  weiming: number;
  liqi: number;
  /** 斬錯了（冤魂）：要播真相回憶、因果簿記遺憾 */
  wronged: boolean;
  /** 真惡沒審就斬，拿不到的證據 */
  lost: string[];
}

/**
 * 斬的結算（夜審判決、白天快判、路上當場斬共用）。
 *  - 第一、二章（slayRule liqi）：戾氣 +1；有冤再 +1、記遺憾。
 *  - 第三章（renown）：十惡威名 +1；真惡揭穿過才威名 +1（沒揭穿就斬只是不加不減）；冤魂戾氣 +1、記遺憾。
 *    真惡沒審就斬，dropsOnTrial 的證據拿不到。
 * 會改 r（威名、戾氣、旗標、判決、收容格），回傳變化。
 */
export function slayGhost(r: RunState, k: GhostCase, rules: Rules = {}): SlayResult {
  const before = { weiming: r.weiming, liqi: r.liqi };
  const nature = natureOf(k);
  const lost: string[] = [];
  if (rules.slayRule === 'renown') {
    if (nature === 'wronged') r.liqi = clamp(r.liqi + 1, 0, 3);
    else if (nature === 'wicked' || exposed(r, k)) r.weiming = clamp(r.weiming + 1, 0, WEIMING_MAX);
    if (nature === 'villain') lost.push(...(k.dropsOnTrial ?? []).filter((id) => !r.evidence.includes(id)));
  } else {
    r.liqi = clamp(r.liqi + 1 + (k.innocent ? 1 : 0), 0, 3);
  }
  const wronged = nature === 'wronged';
  if (wronged) r.flags[`wronged_${k.id}`] = true;
  (r.cases[k.id] ??= { truths: [] }).verdict = 'slay';
  r.held = r.held.filter((h) => h.id !== k.id);
  return { weiming: r.weiming - before.weiming, liqi: r.liqi - before.liqi, wronged, lost };
}

/** 快判押送：不花時辰、空出格子（D12） */
export function escortGhost(r: RunState, k: GhostCase): void {
  (r.cases[k.id] ??= { truths: [] }).verdict = 'escort';
  r.held = r.held.filter((h) => h.id !== k.id);
}

/** 斬之前，卡上寫明的後果（看過相、或真相全查明（known）就寫確定的，否則三種都寫） */
export function slayPreview(r: RunState, k: GhostCase, rules: Rules = {}, known = false): string {
  if (rules.slayRule !== 'renown') return k.innocent ? '戾氣 +2（有冤）' : '戾氣 +1';
  const lostNames = (k.dropsOnTrial ?? []).filter((id) => !r.evidence.includes(id));
  const villain = `真惡：${exposed(r, k) ? '威名 +1' : '還沒揭穿，威名不加'}${lostNames.length ? '；沒審就斬，拿不到牠身上的線索' : ''}`;
  if (!isLooked(r, k.id) && !known) return '十惡威名 +1；冤魂戾氣 +1、記遺憾；真惡要揭穿過才加威名（先請北營看相才知道是哪種）';
  const n = natureOf(k);
  if (n === 'wicked') return '十惡：威名 +1，不加戾氣';
  if (n === 'villain') return villain;
  return '有冤：戾氣 +1、記遺憾，斬完才會知道牠的冤情';
}

/** 斬錯時播的真相回憶：所有真相層連起來 */
export function truthReel(k: GhostCase): { reveal: string; summary: string } {
  return {
    reveal: k.truths[k.truths.length - 1]?.reveal ?? '',
    summary: k.truths.map((t) => t.summary).join(''),
  };
}

/** 威名目前的影響（畫面上方「威名」格旁邊的字） */
export function weimingText(w: number): string {
  if (w >= 4) return '鬼見隊伍就逃・惡鬼氣焰 -2';
  if (w >= SCARE_AT) return '鬼見隊伍就逃・惡鬼氣焰 -1';
  if (w >= IMP_FLEE_AT) return '小妖見隊伍就逃';
  return '還沒人怕太子';
}
