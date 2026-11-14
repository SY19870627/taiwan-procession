/**
 * 第四章「跟轎」的純邏輯（可測試；畫面在 scenes/DayScene.ts）。見 docs/白砂墩媽祖_第四章計畫書_v0.1.md §4 方案 A＋C。
 *
 *  - 行轎岔路：轎子走哪條由內容決定（DayPlan.follow.goes），玩家只決定先鋒押哪：
 *      押中：那條路的小妖已經清掉，省 1 時辰；押錯（第 C3 輪）：不扣時辰；留在轎邊：不賺不賠。
 *  - 臨時轉進：甲乙都不是，轎子拐進第三個地方（沒得猜，事後才有解釋）。之後是停駕點、post、駐駕。
 *  - 牽路仔（ImpRule stray）：自己派兵回頭喊 1 時辰；附近有點心站就託人顧 0 時辰，但那一攤這一段不能再幫別的。
 *  - 稟報（取代神蹟）：用掉一次稟報；轎子停不停由內容決定（Option.report.stops），不是亂數。
 *  - 日落傳消息：讓跟轎台拍到哪件事 → 明天事件池換標籤（DayPlan.tagged）、記人鏈段數（最後一戰用）。
 *
 * 轎、頭旗、香擔不是可以點的東西：這裡沒有任何「對轎子做事」的函式；牽路仔只對隊尾落隊的人下手。
 */
import type { FollowState, RunState } from '../state';
import { newFollow } from '../state';
import type { BroadcastOption, DayPlan, Encounter, FollowPlan } from '../content/days';
import type { Option } from '../content/believers';

/** 留在轎邊 */
export const STAY = 'stay';
/**
 * 押中省幾個時辰、押錯少幾個時辰。
 * 第 C3 輪（爽Game：做了有獎勵、沒做故事照走）：押錯不扣時辰（BET_LOSS = 0）；押中照舊清掉那條路的牽路仔、省 1 時辰（上限照舊），
 * 另外記 flags.bet_hit_<天>（回宮／開爐多一個人影，見 content/ch4/finale.ts 的 rewards4）。
 */
export const BET_GAIN = 1;
export const BET_LOSS = 0;

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
    // 第 C3 輪：押錯不扣時辰
    ifWrong: '轎子走另一邊：前哨跑回來會合，什麼都不扣',
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
  /** resolveBet 之後才有：實際加減了幾個時辰（上限是當天的時辰、下限 0） */
  gained?: number;
  /** resolveBet 之後才有：押中了，但時辰本來就是滿的（不加，改顯示「時辰已滿」那句） */
  full?: boolean;
  /**
   * resolveBet 之後才有：押中了，但那條路今天本來就沒有牽路仔（Encounter.unlessTag；不省也不扣，改顯示 hitEmpty）。
   * 押錯時：轎子走的那條路今天本來就沒有牽路仔（missNote 只接前兩句；時辰照舊不動）
   */
  empty?: boolean;
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
  // 第 C3 輪：押錯不扣時辰（delta 0；寫成 0 而不是 -BET_LOSS，避免 -0）
  return { result: 'miss', delta: 0, cleared: [] };
}

/** 押完之後的時辰（不超過當天的時辰、不低於 0） */
export function hoursAfter(hours: number, delta: number, max: number): number {
  return Math.max(0, Math.min(max, hours + delta));
}

/**
 * 押先鋒：改時辰、記結果、把押中那條路的小妖標成已清掉。
 * 時辰永遠不超過當天的上限（作者定案 A）：押中時已經是滿的就不加（full），畫面改播「時辰已滿」那句（betResultText）。
 */
export function resolveBet(r: RunState, plan: DayPlan, bet: string): BetOutcome {
  const base = betOutcome(plan, bet);
  const f = followOf(r);
  // 第三天「什麼都不拍」：那條路的牽路仔今天不出現（unlessTag）——押中也沒有東西可以清，不省也不扣
  const here = base.cleared.filter((id) => !absentToday(r, plan, id));
  const empty = base.result === 'hit' && base.cleared.length > 0 && here.length === 0;
  const o: BetOutcome = empty ? { ...base, delta: 0, cleared: [] } : { ...base, cleared: here };
  // 押錯、但轎子走的那條路今天本來就沒有牽路仔：只影響押錯的話（missNote 不接最後一句「…的牽路仔到了再處理」），不影響時辰
  const goneRt = plan.routes.find((x) => x.id === plan.follow?.goes);
  const goneImps = (goneRt?.encounters ?? []).filter((e) => e.kind === 'imp');
  const missEmpty = base.result === 'miss' && goneImps.length > 0 && goneImps.every((e) => absentToday(r, plan, e.id));
  f.bet = bet;
  f.betResult = o.result;
  const before = r.hours;
  const full = o.result === 'hit' && !empty && before >= plan.hours;
  r.hours = hoursAfter(before, o.delta, plan.hours);
  for (const id of o.cleared) r.flags[`cleared_${id}`] = true;
  // 第 C3 輪：押中記一筆（回宮／開爐多一個人影）
  if (o.result === 'hit') r.flags[`bet_hit_${r.day}`] = true;
  return { ...o, gained: r.hours - before, full, empty: empty || missEmpty };
}

/** 這件事今天因為傳消息的標籤不出現（Encounter.unlessTag：第三天「什麼都不拍」，渡頭路的牽路仔不出現） */
export function absentToday(r: RunState, plan: DayPlan, id: string): boolean {
  const all = [...plan.pre, ...plan.post, ...plan.routes.flatMap((x) => x.encounters)];
  const e = all.find((x) => x.id === id);
  return !!e && e.kind === 'imp' && !!e.unlessTag && followOf(r).tags.includes(e.unlessTag);
}

/** 押中但時辰已滿時的系統句（FollowPlan.results.hitFull 沒寫時用這句） */
export const HIT_FULL_DEFAULT = '押中了。牽路仔已經清掉；時辰本來就是滿的，沒有多出來。';

/**
 * 押完之後播的話：押中／押錯／留在轎邊的那段；押中但時辰已滿時，最後一行（系統句「省 1 時辰」）
 * 換成 results.hitFull（沒寫用 HIT_FULL_DEFAULT）。最後一行就是押兵結果頁上的那一句。
 * hitFull 寫了好幾行（第二天：作者另寫了一整段「押中但時辰已滿」）就整段換掉。
 */
export function betResultText(f: FollowPlan, o: Pick<BetOutcome, 'result' | 'full' | 'empty'>): string {
  const res = f.results;
  if (!res) return '';
  // 押中、但那條路今天本來就沒有牽路仔（第三天「什麼都不拍」）：最後一行系統句換成 hitEmpty
  if (o.result === 'hit' && o.empty && res.hitEmpty) return [...res.hit.split('\n').slice(0, -1), res.hitEmpty].join('\n');
  // 第 C3 輪：押錯不扣時辰——miss 只留對話，最後一行（押兵結果頁那一句）是 missNote
  // 押錯、但轎子走的那條路今天本來就沒有牽路仔（第三天「什麼都不拍」）：missNote 只接前兩句
  if (o.result === 'miss') {
    if (!res.missNote) return res.miss;
    const note = o.empty ? (res.missNote.match(/[^。]*。/g) ?? [res.missNote]).slice(0, 2).join('') : res.missNote;
    return [res.miss, note].join('\n');
  }
  if (o.result !== 'hit' || !o.full) return res[o.result];
  if (res.hitFull?.includes('\n')) return res.hitFull;
  const lines = res.hit.split('\n');
  return [...lines.slice(0, -1), res.hitFull ?? HIT_FULL_DEFAULT].join('\n');
}

/** 這隻小妖是不是已經被押中的先鋒清掉了 */
export function impCleared(r: RunState, e: Encounter): boolean {
  return e.kind === 'imp' && !!r.flags[`cleared_${e.id}`];
}

/**
 * 岔路之後的行程：那條路 →（臨時轉進）→ 停駕點 →（restEnd：轎子起馬時的過場）→ post（字串是段落標記）。
 * 今天因為標籤不出現的事（unlessTag）不排進來。
 */
export type Step = Encounter | 'fork' | 'detour' | 'detourEnd' | 'rest' | 'restEnd';

export function afterFork(plan: DayPlan, r: RunState): Step[] {
  const f = plan.follow!;
  const rt = plan.routes.find((x) => x.id === f.goes) ?? plan.routes[0];
  const out: Step[] = rt.encounters.filter((e) => !absentToday(r, plan, e.id));
  if (f.detour) out.push('detour', ...f.detour.encounters, 'detourEnd');
  out.push('rest', ...f.rest.encounters);
  if (f.rest.leaveStory) out.push('restEnd');
  out.push(...poolFor(plan, followOf(r).tags).post);
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
  // 人鏈可以減（第二天「什麼都不拍」−1），最低到 0
  f.chain = Math.max(0, f.chain + opt.chain);
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

/**
 * 爽Game（第 C2 輪）：第四章的事不會因為時辰不夠而辦不了。時辰照扣，扣到 0 為止（不會變負的）；
 * 上限照舊（押中也不超過當天的時辰，見 hoursAfter）。
 */
export function spendHours(r: RunState, hours: number): void {
  r.hours = Math.max(0, r.hours - hours);
}

/** 牽路仔的處理方式：派兵回頭喊（花時辰；時辰不夠也能喊）、託點心站（0 時辰，那一攤這段用掉） */
export function strayChoices(r: RunState, e: Extract<Encounter, { kind: 'imp' }>, seg: Segment, shoutHours: number): StrayChoice[] {
  const out: StrayChoice[] = [{
    how: 'shout', label: '派兵回頭喊', hours: shoutHours, cost: `${shoutHours} 時辰`, why: '',
  }];
  if (e.stall) {
    out.push({
      how: 'entrust', label: `託${e.stall}顧`, hours: 0, cost: `0 時辰・這一攤這段路不能再幫別的事`,
      why: stallFree(r, seg, e.stall) ? '' : `「${e.stall}」這一段已經在幫別的事`,
    });
  }
  return out;
}

/** 處理牽路仔：花時辰或用掉點心站。回傳有沒有成功 */
export function resolveStray(r: RunState, e: Extract<Encounter, { kind: 'imp' }>, seg: Segment, how: StrayHow, shoutHours: number): boolean {
  const c = strayChoices(r, e, seg, shoutHours).find((x) => x.how === how);
  if (!c || c.why) return false;
  if (how === 'shout') spendHours(r, shoutHours);
  else useStall(r, seg, e.stall!);
  r.flags[`stray_${e.id}`] = true;
  return true;
}

/**
 * 略過牽路仔。第 C3 輪（爽Game）：不記任何東西——沒有「沒跟上」的人數、沒有遺憾、最後一戰不多小妖。
 * 落隊的人自己走回隊伍（故事照走）；有處理的才有獎勵（flags.stray_<id>：回宮／開爐多一個人影）。
 * 給了牽路仔 id 就記下來（follow.strayedIds）：只用在最後一戰水裡喊誰的名字（believers.ts 的 stragglers4），不是懲罰。
 */
export function skipStray(r: RunState, id?: string): void {
  const f = followOf(r);
  if (!id) return;
  const ids = (f.strayedIds ??= []);
  if (!ids.includes(id)) ids.push(id);
}

// ---------- 稟報 ----------
/** 稟報的固定說明（選之前就寫明） */
export const REPORT_NOTE = '媽祖會知道；轎子會不會為他停，不保證';

/** 信徒卡上的選項能不能選（稟報次數、點心站）。時辰不夠也能選（spendHours：扣到 0 為止） */
export function optionWhy(r: RunState, o: Option, seg: Segment): string {
  if ((o.miracle || o.report) && r.miracles <= 0) return o.report ? '今天的稟報已經用完' : '今天的神蹟已經用完';
  if (o.stall && !stallFree(r, seg, o.stall)) return `「${o.stall}」這一段已經在幫別的事`;
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
