/**
 * 第四章夜審「問歸處」的純邏輯（可測試；畫面接在 scenes/TrialScene.ts，沿用審問供詞的追問／出示）。
 * 媽祖不是來審人的：弄清楚這個鬼嘴上說要去哪、其實該去哪。
 *
 *  - 判決只有四種：帶去北津（tobeijin）／帶回白砂墩（tohome）／就在這裡下（here）／不帶（leave）。對鬼不斬。
 *  - 帶著走的鬼跟在頭旗後面，一直佔著收容格（跨天），到了歸處那一夜才放下。
 *  - 頭旗下 4 格；押著過夜不加怨氣、不會掙脫（overnight 'carry'）。
 *  - 這一章沒有威名（slayRule 不設）。
 */
import type { RunState } from '../state';
import type { GhostCase, Verdict, VerdictDef } from '../content/cases';

/** 帶著走的判決 → 歸處 id */
export const CARRY: Partial<Record<Verdict, string>> = { tobeijin: 'beijin', tohome: 'home' };
/** 問歸處的四種判決 */
export const GUIHU_VERDICTS: Verdict[] = ['tobeijin', 'tohome', 'here', 'leave'];

export interface Dest {
  name: string;
  /** 第幾夜到（那一夜開審前放下） */
  night: number;
}

export interface GuihuRules {
  dests: Record<string, Dest>;
  /** 鬼到了歸處、放下時播的過場（鬼 id → 過場 id；第四章：草鞋丁第二夜到北津） */
  releaseStory?: Record<string, string>;
}

/**
 * 這個鬼「該去的地方」（要先查明才能選的那個判決）。最後一戰：判對了、而且有帶著走或在原地放下的鬼會來（第 C3 輪：
 * 只是畫面上多一個幫忙的影子，不影響任何戰鬥數值；帶到別處的也有溫和的結局，不記遺憾）。
 */
export function rightVerdict(k: GhostCase): Verdict | undefined {
  return k.verdicts.find((v) => v.needs)?.verdict;
}

/**
 * 第 C3 輪（爽Game）：頭旗下滿了也帶得走——旗後面多排一格（slots 加 1）。
 * 這樣判到別的歸處、跟著走佔格的鬼，不會害之後的鬼帶不走（判決不會減少任何東西）。
 */
export function makeRoom(r: RunState): void {
  if (r.held.length >= r.slots) r.slots = r.held.length + 1;
}

/** 還沒決定歸處、今晚可以問的鬼 */
export function pending(r: RunState) {
  return r.held.filter((h) => !h.dest);
}

/** 已經決定帶著走的鬼（佔格） */
export function carrying(r: RunState) {
  return r.held.filter((h) => !!h.dest);
}

/** 判決：帶著走的留在格子裡（記歸處）；其他的空出格子。回傳要顯示的話 */
export function judgeGuihu(r: RunState, k: GhostCase, v: VerdictDef, rules: GuihuRules, night: number): string[] {
  const st = (r.cases[k.id] ??= { truths: [] });
  st.verdict = v.verdict;
  const dest = CARRY[v.verdict];
  const name = st.truths.length ? k.name : k.dayName;
  if (dest) {
    let h = r.held.find((x) => x.id === k.id);
    if (!h) {
      h = { id: k.id, grudge: 0 };
      r.held.push(h);
    }
    h.dest = dest;
    h.since = night;
    const d = rules.dests[dest];
    // 今晚就在歸處（第二夜判「帶去北津」：跟頭旗進廟門）→ 當晚放下，不佔格
    if (d && d.night <= night) {
      r.held = r.held.filter((x) => x !== h);
      r.flags[`arrived_${k.id}`] = true;
      return [`${name}今晚就到了${d.name}，放下了。`, '頭旗下空出一格。'];
    }
    return [`${name}跟在頭旗後面走。`, `到${d?.name ?? dest}之前，牠一直佔著頭旗下一格。`];
  }
  r.held = r.held.filter((x) => x.id !== k.id);
  if (v.verdict === 'here') return [`${name}在這裡下了。`, '頭旗下空出一格。'];
  return [`${name}不跟了。`, '頭旗下空出一格。'];
}

/** 到了第 night 夜：歸處到了的鬼放下（開審前呼叫）。回傳放下的鬼與歸處 */
export function arrive(r: RunState, night: number, rules: GuihuRules): { id: string; dest: string }[] {
  const out: { id: string; dest: string }[] = [];
  for (const h of [...r.held]) {
    const d = h.dest ? rules.dests[h.dest] : undefined;
    if (!d || d.night > night) continue;
    r.held = r.held.filter((x) => x !== h);
    r.flags[`arrived_${h.id}`] = true;
    out.push({ id: h.id, dest: h.dest! });
  }
  return out;
}

/** 判決選項裡有沒有斬（這一章對鬼不斬） */
export function hasSlay(k: GhostCase): boolean {
  return k.verdicts.some((v) => v.verdict === 'slay');
}
