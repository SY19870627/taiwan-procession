/**
 * 第三章三天的純邏輯模擬（第 7 階段：白天擠的程度、最好結局可不可能、點將問罪難度）。
 * 照 DayScene／TrialScene 的第三章規則重現，只呼叫遊戲本身的純邏輯（content/chapter、core/renown、core/dianjiang），
 * 不重寫規則；畫面上的演出（動畫、劇情、互嗆）不影響狀態，這裡略過。
 *
 *  - 白天：時辰、神蹟、黃曆文獻、信徒卡、線索、問話、乾坤圈小妖（威名 ≥1 自己逃）、
 *          鬼的反應（戾氣逃走／威名嚇跑追回 1 時辰／風火輪追怨氣 +1）、收容、北營看相、快判、路邊點將（1 時辰）
 *  - 晚上：每晚 2 案的點將問罪、判決、太子怒氣滿直接斬、大廳快判
 *  - 天亮：壓一晚（dawnHeld）、信徒的變化（dawn3）
 *
 * 玩家怎麼選由 Brain 決定（隨機的、會規劃的）。模擬用全域的 run（信徒卡的 apply 會直接改它）。
 */
import { run, gainEvidence, isHeld, caseDone } from '../src/state';
import { CH, startChapter, visible, ghostMood, collectHours, talkBlocked } from '../src/content/chapter';
import type { Encounter, DayPlan } from '../src/content/days';
import type { Card, Option } from '../src/content/believers';
import type { GhostCase, Taunt, Verdict, VerdictDef } from '../src/content/cases';
import { collectGrudge, escortGhost, impsFlee, isLooked, lookAt, natureOf, slayGhost, LOOK_HOURS, ROADSIDE_HOURS } from '../src/core/renown';
import { available, beginNight, canOpen, expected, forcedSlay, judge, knelt, matching, muted, openCase, pick, useTrial, verdictWhy, dawnHeld, type Choice, type Session } from '../src/core/dianjiang';

/** 亂數（固定種子，結果可重現） */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 0x100000000;
  };
}

export type GhostAct = 'collect' | 'look' | 'slay' | 'escort' | 'skip';

/** 玩家的腦袋：每個岔路、每件事怎麼選 */
export interface Brain {
  route(day: number, plan: DayPlan): number;
  person(card: Card, e: Encounter): Option | null;
  clue(e: Extract<Encounter, { kind: 'clue' | 'talk' }>): boolean;
  /** 乾坤圈（true）或略過 */
  imp(): boolean;
  /** 被威名嚇跑：花 1 時辰追回？ */
  chaseScared(k: GhostCase): boolean;
  /** 戾氣讓牠躲起來：風火輪追？ */
  chaseHiding(k: GhostCase): boolean;
  ghost(k: GhostCase, day: number): GhostAct;
  /** 營旗下滿了又想收：要快判掉誰（回傳 id 與做法），不快判就回 null */
  makeRoom(k: GhostCase): { id: string; act: 'slay' | 'escort' } | null;
  /** 白天走完、還有時辰：要不要對營旗下的某隻路邊點將（回傳 id） */
  roadside(day: number): string | null;
  /** 今晚先審誰（依序，最多審 2 案） */
  nightOrder(day: number): string[];
  /** 嗆聲（沒證據的那種）：要點南營還是讓牠說 */
  taunt(k: GhostCase, t: Taunt): Choice;
  /** 審完可以判了：選哪一個判決（null＝先押著） */
  verdict(k: GhostCase, ok: VerdictDef[], day: number): VerdictDef | null;
  /** 大廳快判（審完之後、天亮之前）：回傳要快判的 id 與做法 */
  lobby(day: number): { id: string; act: 'slay' | 'escort' }[];
}

export interface Stats {
  /** 收容了幾隻（不含開局押著的三隻） */
  collected: number;
  /** 斬了幾隻、其中斬錯（冤魂）幾隻 */
  slain: number;
  wrongSlain: number;
  escorted: number;
  /** 超渡＋編入五營 */
  saved: number;
  /** 路上錯過（沒收、跑掉、略過）而且到最後都沒有結果的鬼 */
  missed: number;
  /** 到最後還押著、沒判的 */
  unjudged: number;
  /** 想收卻滿了的次數 */
  fullTimes: number;
  /** 三天剩下沒用的時辰 */
  hoursLeft: number;
  /** 拿到幾項證據（全部 30 項） */
  evidence: number;
  weiming: number;
  liqi: number;
  bossAdds: number;
  /** 四個完整案子（鴨母婆、虎頭、紙紮童、渡伯）都超渡或編入 */
  bigFour: boolean;
  /** 收蛟為坐騎的條件（陣前審問第 2 輪說得動） */
  recall: boolean;
  /** 最好結局：四個完整案子都圓滿、渡伯編入北營帶路、沒有斬錯冤魂、收蛟為坐騎 */
  best: boolean;
  /** 每個鬼的結果 */
  verdicts: Record<string, Verdict | 'held' | 'none'>;
}

export const BIG_FOUR = ['yamupo', 'hutou', 'zhizha', 'dubo'];

/** 跑一章（序章押好三隻 → 三天三夜），回傳統計；run 留著最後的狀態 */
export function play(brain: Brain): Stats {
  startChapter('xinying');
  const ch = CH();
  let collected = 0;
  let fullTimes = 0;
  let hoursLeft = 0;
  const met = new Set<string>(ch.startHeld ?? []);
  for (let day = 1; day <= 3; day++) {
    run.day = day;
    const plan = ch.days[day];
    run.hours = plan.hours;
    run.miracles = plan.miracles;
    for (const id of plan.docs) gainEvidence(id);
    const ri = brain.route(day, plan);
    const queue: Encounter[] = [...plan.pre, ...plan.routes[ri].encounters, ...plan.post];
    for (const e of queue) {
      if (!visible(run, e)) continue;
      switch (e.kind) {
        case 'person': {
          const card = ch.cards[e.card](run) as Card;
          const o = brain.person(card, e);
          if (o && o.hours <= run.hours && (!o.miracle || run.miracles > 0)) {
            run.hours -= o.hours;
            if (o.miracle) { run.miracles--; run.bossAdds++; }
            o.apply(run);
          }
          break;
        }
        case 'clue':
        case 'talk':
          if (e.kind === 'talk' && talkBlocked(run)) break;
          if (e.hours <= run.hours && brain.clue(e)) { run.hours -= e.hours; gainEvidence(e.evidence); }
          break;
        case 'imp': {
          const rule = ch.imp;
          if (rule.mode !== 'ring') throw new Error('第三章的小妖是乾坤圈');
          if (impsFlee(run, ch)) break;
          if (!brain.imp()) run.bossAdds += rule.skipAdds;
          break;
        }
        case 'ghost': {
          const k = ch.cases[e.caseId];
          met.add(k.id);
          const mood = ghostMood(run, k.id);
          if (mood === 'fled') break;
          let grudge = 0;
          if (mood === 'scared') {
            const h = collectHours(run, k.id);
            if (h > run.hours || !brain.chaseScared(k)) break;
            run.hours -= h;
          } else if (mood === 'hiding') {
            if (!brain.chaseHiding(k)) break;
            grudge = collectGrudge(mood, ch);
          }
          for (let guard = 0; guard < 3; guard++) {
            const act = brain.ghost(k, day);
            if (act === 'look') {
              if (isLooked(run, k.id) || LOOK_HOURS > run.hours) continue;
              run.hours -= LOOK_HOURS;
              lookAt(run, k);
              continue;
            }
            if (act === 'collect') {
              if (run.held.length >= run.slots) {
                fullTimes++;
                const room = brain.makeRoom(k);
                if (!room) break;
                quick(room.id, room.act);
              }
              run.held.push({ id: k.id, grudge, ...(isLooked(run, k.id) ? { looked: true } : {}) });
              run.cases[k.id] ??= { truths: [] };
              for (const id of k.onCollect ?? []) gainEvidence(id);
              collected++;
            } else if (act === 'slay') slayGhost(run, k, ch);
            else if (act === 'escort') escortGhost(run, k);
            break;
          }
          break;
        }
      }
    }
    // 走完了：剩下的時辰可以拿來路邊點將（營旗格的「路邊點將」，1 時辰）
    for (let guard = 0; guard < 6 && run.hours >= ROADSIDE_HOURS; guard++) {
      const id = brain.roadside(day);
      if (!id || !isHeld(id) || muted(run, ch.cases[id])) break;
      run.hours -= ROADSIDE_HOURS;
      session(ch.cases[id], 'roadside', day, brain);
    }
    hoursLeft += run.hours;
    run.hours = 0;
    // ---------- 夜審 ----------
    beginNight(run, ch);
    for (const id of brain.nightOrder(day)) {
      if (!canOpen(run)) break;
      if (!isHeld(id) || muted(run, ch.cases[id])) continue;
      useTrial(run);
      session(ch.cases[id], 'night', day, brain);
    }
    for (const q of brain.lobby(day)) if (isHeld(q.id)) quick(q.id, q.act);
    if (day < 3) {
      dawnHeld(run, ch);
      ch.dawn(run, day);
    }
  }
  return stats(collected, fullTimes, hoursLeft, met);
}

function quick(id: string, act: 'slay' | 'escort'): void {
  const k = CH().cases[id];
  if (act === 'slay') slayGhost(run, k, CH());
  else escortGhost(run, k);
}

/** 升堂一次（或路邊點將一輪）：照 brain 點將；沒證據的句子先跳過；跪了而且查明了就判 */
export function session(k: GhostCase, mode: Session['mode'], day: number, brain: Brain): void {
  const ch = CH();
  const o = openCase(run, k, mode, day);
  const s = o.session;
  let skips = 0;
  while (!s.over) {
    const t = k.taunts![s.cur];
    const choice = decide(k, t, brain);
    skips = choice === 'skip' ? skips + 1 : 0;
    // 剩下的每一句都拿不出證據：先押回去
    if (skips > available(run, k).length) break;
    const out = pick(run, k, s, choice);
    if (out.forced) { forcedSlay(run, k, ch); return; }
  }
  if (!isHeld(k.id) || caseDone(k.id)) return;
  const ok = k.verdicts.filter((v) => !verdictWhy(run, k, v));
  const v = brain.verdict(k, ok, day);
  if (v) judge(run, k, v, ch);
}

/** 這一句點誰：說謊、狡辯有對得上的證據才點（沒有就跳過）；嗆聲交給 brain */
function decide(k: GhostCase, t: Taunt, brain: Brain): Choice {
  const exp = expected(t);
  if (exp === 'east' || exp === 'west') return matching(run, t, exp) ? exp : 'skip';
  return brain.taunt(k, t);
}

function stats(collected: number, fullTimes: number, hoursLeft: number, met: Set<string>): Stats {
  const ch = CH();
  const verdicts: Stats['verdicts'] = {};
  for (const id of Object.keys(ch.cases)) verdicts[id] = run.cases[id]?.verdict ?? (isHeld(id) ? 'held' : 'none');
  const v = Object.values(verdicts);
  const n = (x: string) => v.filter((y) => y === x).length;
  const wrongSlain = Object.keys(ch.cases).filter((id) => verdicts[id] === 'slay' && natureOf(ch.cases[id]) === 'wronged').length;
  const bigFour = BIG_FOUR.every((id) => verdicts[id] === 'release' || verdicts[id] === 'recruit');
  const r2 = ch.finale.rounds[1];
  const recall = r2.evidence.some((id) => run.evidence.includes(id)) || (r2.people ?? []).some((p) => p.test(run));
  void met;
  return {
    collected, fullTimes, hoursLeft,
    slain: n('slay'), wrongSlain, escorted: n('escort'), saved: n('release') + n('recruit'),
    missed: n('none'), unjudged: n('held'),
    evidence: run.evidence.length, weiming: run.weiming, liqi: run.liqi, bossAdds: run.bossAdds,
    bigFour, recall,
    best: bigFour && !!run.flags.recruit_dubo && wrongSlain === 0 && recall,
    verdicts,
  };
}

// ---------------------------------------------------------------------------
// 隨機的玩家：每件事丟骰子（不規劃、不看證據值不值得），晚上點將照狠話類型點（沒看相的嗆聲用猜的）
// ---------------------------------------------------------------------------
export function randomBrain(seed: number): Brain {
  const R = rng(seed);
  const pickOne = <T>(xs: T[]): T => xs[Math.floor(R() * xs.length)];
  return {
    route: () => (R() < 0.5 ? 0 : 1),
    person: (card) => (R() < 0.3 ? null : pickOne(card.options)),
    clue: () => R() < 0.6,
    imp: () => R() < 0.85,
    chaseScared: () => R() < 0.6,
    chaseHiding: () => R() < 0.8,
    ghost: (k) => {
      const x = R();
      if (x < 0.2 && !isLooked(run, k.id)) return 'look';
      if (x < 0.65) return 'collect';
      if (x < 0.8) return 'slay';
      if (x < 0.9) return 'escort';
      return 'skip';
    },
    makeRoom: () => {
      if (R() < 0.4 || !run.held.length) return null;
      return { id: pickOne(run.held).id, act: R() < 0.5 ? 'slay' : 'escort' };
    },
    roadside: () => (R() < 0.3 && run.held.length ? pickOne(run.held).id : null),
    nightOrder: () => [...run.held].sort(() => R() - 0.5).map((h) => h.id),
    taunt: (k, t) => {
      if (isLooked(run, k.id)) return expected(t);
      return R() < 0.5 ? 'south' : 'listen';
    },
    verdict: (_k, ok, day) => {
      const good = ok.filter((v) => v.verdict === 'release' || v.verdict === 'recruit');
      if (good.length) return pickOne(good);
      if (day === 3 || R() < 0.3) return pickOne(ok);
      return null;
    },
    lobby: () => (R() < 0.3 && run.held.length > 3 ? [{ id: pickOne(run.held).id, act: R() < 0.5 ? 'slay' : 'escort' }] : []),
  };
}

// ---------------------------------------------------------------------------
// 會規劃的玩家：先決定這一輪要救誰（targets），時辰只花在對得上目標的證據；
// 鬼先看相再決定；十惡快判；營旗下讓給目標；晚上先審證據最齊的目標
// ---------------------------------------------------------------------------
export interface Plan {
  routes: [number, number, number];
  /** 要審清楚、超渡或編入的鬼 */
  targets: string[];
  /** 十惡怎麼處理：斬（威名）或押送 */
  wicked: 'slay' | 'escort';
  /** 每個目標偏好的判決 */
  prefer?: Record<string, Verdict>;
  /** 真相全部查明才下判決（點將問罪難度檢查用） */
  full?: boolean;
  /** 信徒卡：要選哪個選項（卡片 id → 選項序號；沒寫就挑對目標有用的證據最多、最便宜的） */
  cards?: Record<string, number | null>;
}

export function planBrain(plan: Plan): Brain {
  const ch = () => CH();
  const isTarget = (id: string) => plan.targets.includes(id);
  /** 還沒查明、而且還沒有任何對得上證據的真相層，需要哪些證據（任選其一） */
  const wanted = (): Set<string> => {
    const out = new Set<string>();
    for (const id of plan.targets) {
      const k = ch().cases[id];
      if (caseDone(id)) continue;
      const truths = run.cases[id]?.truths ?? [];
      for (const t of k.taunts ?? []) {
        if (t.truth === undefined || truths.includes(t.truth)) continue;
        if ((t.evidence ?? []).some((x) => run.evidence.includes(x))) continue;
        for (const x of t.evidence ?? []) out.add(x);
      }
    }
    return out;
  };
  const useful = (ids: string[] = []) => ids.filter((x) => wanted().has(x) && !run.evidence.includes(x)).length;
  return {
    route: (day) => plan.routes[day - 1],
    person: (card, e) => {
      const id = e.kind === 'person' ? e.card : '';
      if (plan.cards && id in plan.cards) {
        const i = plan.cards[id];
        return i === null ? null : card.options[i];
      }
      const scored = card.options.filter((o) => !o.miracle && o.hours <= run.hours).map((o) => ({ o, n: useful(o.gives) })).filter((x) => x.n > 0);
      scored.sort((a, b) => b.n - a.n || a.o.hours - b.o.hours);
      return scored[0]?.o ?? null;
    },
    clue: (e) => wanted().has(e.evidence),
    imp: () => true,
    chaseScared: (k) => isTarget(k.id) || natureOf(k) === 'wicked',
    chaseHiding: () => true,
    ghost: (k) => {
      if (isTarget(k.id)) return run.held.length < run.slots || run.held.some((h) => !isTarget(h.id)) ? 'collect' : 'skip';
      if (natureOf(k) === 'wicked') return plan.wicked;
      // 不是目標的冤魂、真惡：押送（不斬錯、不佔格子）
      return 'escort';
    },
    makeRoom: () => {
      const h = run.held.find((x) => !isTarget(x.id));
      if (!h) return null;
      const k = ch().cases[h.id];
      return { id: h.id, act: natureOf(k) === 'wicked' ? plan.wicked : 'escort' };
    },
    roadside: () => {
      // 有對得上證據、還沒查明的目標
      const h = run.held.find((x) => isTarget(x.id) && hasHit(ch().cases[x.id]));
      return h?.id ?? null;
    },
    nightOrder: () => {
      const hs = run.held.filter((h) => isTarget(h.id) && !caseDone(h.id));
      hs.sort((a, b) => readiness(ch().cases[b.id]) - readiness(ch().cases[a.id]));
      return hs.map((h) => h.id);
    },
    taunt: (_k, t) => expected(t),
    verdict: (k, ok) => {
      if (plan.full && (run.cases[k.id]?.truths.length ?? 0) < k.truths.length) return null;
      const want = plan.prefer?.[k.id];
      const good = ok.filter((v) => v.verdict === 'release' || v.verdict === 'recruit');
      return good.find((v) => v.verdict === want) ?? (want ? null : good[0]) ?? null;
    },
    lobby: () => {
      // 營旗下不是目標的：十惡照計畫處理，其他押送
      return run.held.filter((h) => !isTarget(h.id)).map((h) => ({ id: h.id, act: natureOf(ch().cases[h.id]) === 'wicked' ? plan.wicked : 'escort' as const }));
    },
  };
}

/** 有沒有一句狠話現在點得對而且會揭開新的真相 */
function hasHit(k: GhostCase): boolean {
  const truths = run.cases[k.id]?.truths ?? [];
  return available(run, k).some((i) => {
    const t = k.taunts![i];
    if (t.truth === undefined || truths.includes(t.truth)) return false;
    const exp = expected(t);
    return exp === 'south' || exp === 'listen' || !!matching(run, t, exp);
  });
}

/** 證據齊不齊：能揭開的新真相層數（＋已經跪了） */
function readiness(k: GhostCase): number {
  const truths = run.cases[k.id]?.truths ?? [];
  let n = knelt(run, k) ? 1 : 0;
  for (const t of k.taunts ?? []) {
    if (t.truth === undefined || truths.includes(t.truth)) continue;
    const exp = expected(t);
    if (exp === 'east' || exp === 'west' ? matching(run, t, exp) : true) n += 2;
  }
  return n;
}
