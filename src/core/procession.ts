/**
 * 第四章「跟轎」的純邏輯（可測試；畫面在 scenes/DayScene.ts）。見 _agent/ch4-baishatun-plan.md §4 方案 A＋C。
 *
 *  - 行轎岔路：轎子走哪條由內容決定（DayPlan.follow.goes），玩家只決定先鋒押哪：
 *      押中：那條路的小妖已經清掉，省 1 時辰；押錯：兵馬要趕回來，少 1 時辰；留在轎邊：不賺不賠。
 *  - 臨時轉進：甲乙都不是，轎子拐進第三個地方（沒得猜，事後才有解釋）。之後是停駕點、post、駐駕。
 *  - 牽路仔（ImpRule stray）：自己派兵回頭喊 1 時辰；附近有點心站就託人顧 0 時辰，但那一攤這一段不能再幫別的。
 *  - 稟報（取代神蹟）：用掉一次稟報；轎子停不停由內容決定（Option.report.stops），不是亂數。
 *  - 日落傳消息：讓跟轎台拍到哪件事 → 明天事件池換標籤（DayPlan.tagged）、記人鏈段數（最後一戰用）。
 *
 * 轎、頭旗、香擔不是可以點的東西：這裡沒有任何「對轎子做事」的函式；牽路仔只對隊尾落隊的人下手。
 */
import type { FollowState, RunState } from '../state';
import { newFollow } from '../state';
import type { BroadcastOption, DayPlan, Encounter } from '../content/days';
import type { Option } from '../content/believers';

/** 留在轎邊 */
export const STAY = 'stay';
/** 押中省幾個時辰、押錯少幾個時辰 */
export const BET_GAIN = 1;
export const BET_LOSS = 1;

/** 白天的段落：pre、路線 id（甲／乙）、detour 臨時轉進、rest 停駕點（含會合後的 post） */
export type Segment = string;

export function followOf(r: RunState): FollowState {
  return (r.follow ??= newFollow());
}

// ---------- 行轎岔路：押先鋒 ----------
export interface BetChoice {
  bet: string;
  label: string;
  /** 轎子真的走這邊（或留在轎邊）會怎樣 */
  ifRight: string;
  /** 轎子走另一邊會怎樣 */
  ifWrong: string;
}

/** 押兵畫面的選項（代價照例明講：猜中、猜錯各寫一行） */
export function betChoices(plan: DayPlan): BetChoice[] {
  const out: BetChoice[] = plan.routes.map((rt) => ({
    bet: rt.id,
    label: `押${rt.id}`,
    ifRight: `轎子走${rt.id}：${rt.id}路的小妖先清掉，省 ${BET_GAIN} 時辰`,
    ifWrong: `轎子走另一邊：兵馬要趕回來，少 ${BET_LOSS} 時辰`,
  }));
  out.push({ bet: STAY, label: '留在轎邊', ifRight: '不賺不賠', ifWrong: '不賺不賠' });
  return out;
}

export interface BetOutcome {
  result: 'hit' | 'miss' | 'stay';
  /** 時辰變化（+1／-1／0；實際加減受上下限影響，見 hoursAfter） */
  delta: number;
  /** 押中時先清掉的小妖（encounter id） */
  cleared: string[];
}

/** 只算結果，不改狀態 */
export function betOutcome(plan: DayPlan, bet: string): BetOutcome {
  const goes = plan.follow?.goes;
  if (bet === STAY || !goes) return { result: 'stay', delta: 0, cleared: [] };
  if (bet === goes) {
    const rt = plan.routes.find((x) => x.id === goes);
    const cleared = (rt?.encounters ?? []).filter((e) => e.kind === 'imp').map((e) => e.id);
    return { result: 'hit', delta: BET_GAIN, cleared };
  }
  return { result: 'miss', delta: -BET_LOSS, cleared: [] };
}

/** 押完之後的時辰（不超過當天的時辰、不低於 0） */
export function hoursAfter(hours: number, delta: number, max: number): number {
  return Math.max(0, Math.min(max, hours + delta));
}

/** 押先鋒：改時辰、記結果、把押中那條路的小妖標成已清掉 */
export function resolveBet(r: RunState, plan: DayPlan, bet: string): BetOutcome {
  const o = betOutcome(plan, bet);
  const f = followOf(r);
  f.bet = bet;
  f.betResult = o.result;
  r.hours = hoursAfter(r.hours, o.delta, plan.hours);
  for (const id of o.cleared) r.flags[`cleared_${id}`] = true;
  return o;
}

/** 這隻小妖是不是已經被押中的先鋒清掉了 */
export function impCleared(r: RunState, e: Encounter): boolean {
  return e.kind === 'imp' && !!r.flags[`cleared_${e.id}`];
}

/** 岔路之後的行程：那條路 →（臨時轉進）→ 停駕點 → post（字串是段落標記） */
export type Step = Encounter | 'fork' | 'detour' | 'detourEnd' | 'rest';

export function afterFork(plan: DayPlan, r: RunState): Step[] {
  const f = plan.follow!;
  const rt = plan.routes.find((x) => x.id === f.goes) ?? plan.routes[0];
  const out: Step[] = [...rt.encounters];
  if (f.detour) out.push('detour', ...f.detour.encounters, 'detourEnd');
  out.push('rest', ...f.rest.encounters, ...poolFor(plan, followOf(r).tags).post);
  return out;
}

/** 出發後、岔路前（含傳消息標籤加進來的事） */
export function beforeFork(plan: DayPlan, r: RunState): Step[] {
  return [...poolFor(plan, followOf(r).tags).pre, 'fork'];
}

// ---------- 事件池（傳消息的標籤） ----------
/** 依標籤組出當天的 pre／post：沒有標籤的事一定在，標籤對上的才加 */
export function poolFor(plan: DayPlan, tags: string[]): { pre: Encounter[]; post: Encounter[] } {
  const pre = [...plan.pre];
  const post = [...plan.post];
  for (const t of plan.tagged ?? []) {
    if (!tags.includes(t.tag)) continue;
    (t.where === 'pre' ? pre : post).push(...t.encounters);
  }
  return { pre, post };
}

/** 日落傳消息：記下選了什麼、換明天的標籤、加人鏈 */
export function applyBroadcast(r: RunState, day: number, opt: BroadcastOption): void {
  const f = followOf(r);
  f.broadcast[day] = opt.id;
  f.tags = [...opt.tags];
  f.chain += opt.chain;
  r.flags[`film_${opt.id}`] = true;
}

// ---------- 點心站 ----------
const stallKey = (seg: Segment, name: string) => `${seg}:${name}`;

/** 這一段的這一攤還能不能幫忙 */
export function stallFree(r: RunState, seg: Segment, name: string): boolean {
  return !followOf(r).stallsUsed.includes(stallKey(seg, name));
}

export function useStall(r: RunState, seg: Segment, name: string): void {
  if (stallFree(r, seg, name)) followOf(r).stallsUsed.push(stallKey(seg, name));
}

// ---------- 牽路仔 ----------
export type StrayHow = 'shout' | 'entrust';

export interface StrayChoice {
  how: StrayHow;
  label: string;
  hours: number;
  cost: string;
  /** 不能選的理由 */
  why: string;
}

/** 牽路仔的處理方式：派兵回頭喊（花時辰）、託點心站（0 時辰，那一攤這段用掉） */
export function strayChoices(r: RunState, e: Extract<Encounter, { kind: 'imp' }>, seg: Segment, shoutHours: number): StrayChoice[] {
  const out: StrayChoice[] = [{
    how: 'shout', label: '派兵回頭喊', hours: shoutHours, cost: `${shoutHours} 時辰`,
    why: shoutHours > r.hours ? `時辰不夠（剩 ${r.hours}）` : '',
  }];
  if (e.stall) {
    out.push({
      how: 'entrust', label: '託點心站', hours: 0, cost: `0 時辰・「${e.stall}」這一段不能再幫別的`,
      why: stallFree(r, seg, e.stall) ? '' : `「${e.stall}」這一段已經在幫別的事`,
    });
  }
  return out;
}

/** 處理牽路仔：花時辰或用掉點心站。回傳有沒有成功 */
export function resolveStray(r: RunState, e: Extract<Encounter, { kind: 'imp' }>, seg: Segment, how: StrayHow, shoutHours: number): boolean {
  const c = strayChoices(r, e, seg, shoutHours).find((x) => x.how === how);
  if (!c || c.why) return false;
  if (how === 'shout') r.hours -= shoutHours;
  else useStall(r, seg, e.stall!);
  r.flags[`stray_${e.id}`] = true;
  return true;
}

/** 略過牽路仔：落隊的人被帶偏，記一位沒跟上（遺憾） */
export function skipStray(r: RunState): void {
  followOf(r).strayed++;
}

// ---------- 稟報 ----------
/** 稟報的固定說明（選之前就寫明） */
export const REPORT_NOTE = '媽祖會知道；轎子會不會為他停，不保證';

/** 信徒卡上的選項能不能選（稟報次數、點心站） */
export function optionWhy(r: RunState, o: Option, seg: Segment): string {
  if ((o.miracle || o.report) && r.miracles <= 0) return o.report ? '今天的稟報已經用完' : '今天的神蹟已經用完';
  if (o.stall && !stallFree(r, seg, o.stall)) return `「${o.stall}」這一段已經在幫別的事`;
  if (o.hours > r.hours) return `時辰不夠（剩 ${r.hours}）`;
  return '';
}

/** 稟報：用掉一次，記下結果；停不停由內容決定 */
export function report(r: RunState, o: Option): { stops: boolean; text: string } {
  const rep = o.report!;
  r.miracles = Math.max(0, r.miracles - 1);
  const stops = rep.stops(r);
  followOf(r).reports[rep.key] = stops;
  return { stops, text: stops ? rep.stop : rep.pass };
}
