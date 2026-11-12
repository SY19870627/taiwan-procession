/**
 * 第三章夜審「點將問罪」的純邏輯（可測試；畫面在 ui/dianjiang.ts，夜審與路邊點將共用）。
 * 見 docs/新瀛太子爺_故事大綱 §6、docs/第三章_開發計畫.md §2.3、D5～D12。
 *
 *  - 鬼有「氣焰」（3～5 格），一句一句說狠話；狠話標了類型。
 *  - 說謊 → 東營（帶對得上的「證詞」）；狡辯 → 西營（帶對得上的「物證／文獻」）；純嗆聲 → 南營。
 *  - 冤魂的嗆聲其實是嘴硬（sore）：正解是「讓牠說」（D6）；點南營會嚇到牠（怨氣 +1，也算點錯）。
 *  - 點對：氣焰 -1（第二天起連續點對兩次，第三次合擊再多 -1，D7）；點錯：太子怒氣 +1，滿 3 太子直接斬（D11）。
 *  - 氣焰歸零 → 跪地求饒：可以超渡／編入五營；還沒破的「有真相」的狠話可以繼續問，把真相問完。
 *  - 開場氣焰：惡鬼依威名 -1／-2（D3）；被太子壓過一晚 -1，並自動破掉一句狠話（overnight.breaks）。
 *  - 每晚 2 案（正式開審才算；快判、路邊點將不算，D12）。
 *  - 天亮：第三章押著的鬼被太子壓一晚（不加怨氣、不掙脫；冤魂怨氣 -1，D5）；第一、二章照舊（怨氣 +1、到 3 掙脫）。
 *
 * 進度存在 run.cases[id].dj，改日再審（或白天路邊點將之後晚上再審）都接得上。
 */
import type { RunState, Held } from '../state';
import { clamp } from '../state';
import type { Camp, GhostCase, Taunt, VerdictDef } from '../content/cases';
import type { ChapterDef } from '../content/chapter';
import { flareCut, natureOf, slayGhost } from './renown';

/** 怒氣滿幾太子直接斬 */
export const ANGER_MAX = 3;
/** 第幾夜起解鎖合擊（第二天解鎖，D7） */
export const COMBO_FROM_DAY = 2;
/** 連續點對幾次之後，下一次點對是合擊 */
export const COMBO_STREAK = 2;
/** 怨氣到這裡冤魂縮起來，不再開口（D5） */
export const MUTE_AT = 3;

/** 點將的選擇：東營、西營、南營、讓牠說（不點將）、先跳過這句 */
export type Choice = 'east' | 'west' | 'south' | 'listen' | 'skip';

export const CAMP_NAME: Record<Camp, string> = { east: '東營', south: '南營', west: '西營', north: '北營', center: '中營' };
export const TAUNT_TAG: Record<Taunt['type'], string> = { lie: '說謊', excuse: '狡辯', taunt: '嗆聲' };

/** 存在 run.cases[id].dj 的進度 */
export interface DjProgress {
  /** 氣焰被打掉幾格（合擊一次算 2） */
  dmg: number;
  /** 已經破掉（點對、壓一晚吐實）的狠話 */
  broken: number[];
  /** 被太子壓過幾晚（每晚開場氣焰 -1） */
  tamed: number;
  /** 讓牠說之後聽到的心事（第幾句 heart） */
  heard: number;
  /** 跪過了（掉出 dropsOnTrial 的證據只給一次） */
  knelt?: boolean;
}

/** 這一次升堂（或路邊點將）的狀態；怒氣每案獨立、換一案歸零（D11） */
export interface Session {
  id: string;
  mode: 'night' | 'roadside';
  /** 合擊解鎖了沒（第二天起） */
  combo: boolean;
  anger: number;
  /** 連續點對幾次（合擊用） */
  streak: number;
  /** 現在說的是第幾句狠話（-1：沒有話可說了） */
  cur: number;
  /** 路邊點將：這一輪還剩幾句（審一輪就結束） */
  roundLeft?: number;
  /** 結束的原因：forced 怒氣滿、太子直接斬；mute 冤魂縮起來；round 路邊這一輪說完；done 跪了而且沒話可問 */
  over?: 'forced' | 'mute' | 'round' | 'done';
}

export interface Outcome {
  kind: 'hit' | 'miss' | 'skip' | 'mute';
  choice: Choice;
  /** 剛才那一句狠話 */
  taunt: number;
  /** 點錯的原因 */
  why?: 'noEvidence' | 'wrongCamp' | 'scaredWronged' | 'listenEvil';
  /** 點對時拍在臉上的證據 */
  evidence?: string;
  /** 揭開第幾層真相 */
  truth?: number;
  /** 讓牠說：多說的心事 */
  heart?: string;
  /** 這一下是合擊 */
  combo?: boolean;
  /** 氣焰掉了幾格 */
  drop: number;
  /** 剛跪下 */
  kneel?: boolean;
  /** 跪下時掉出來的證據 */
  drops?: string[];
  /** 南營嚇到冤魂：怨氣 +1 */
  grudge?: number;
  /** 怒氣滿了：太子直接斬 */
  forced?: boolean;
  /** 給畫面用的一段話（點對：將軍那一句＋牠的反應；點錯：牠嗆回來） */
  line: string;
}

// ---------- 進度 ----------
export function progress(r: RunState, id: string): DjProgress {
  const c = (r.cases[id] ??= { truths: [] });
  return (c.dj ??= { dmg: 0, broken: [], tamed: 0, heard: 0 });
}

/** 惡鬼（十惡、真惡）才會被威名嚇到；冤魂不算（大綱「囂張的鬼越快跪」） */
export function isEvil(k: GhostCase): boolean {
  return natureOf(k) !== 'wronged';
}

/** 開場氣焰：原本的氣焰 − 威名（惡鬼）− 壓過幾晚；至少留 1 格 */
export function startFlare(r: RunState, k: GhostCase): number {
  const p = progress(r, k.id);
  const cut = isEvil(k) ? flareCut(r.weiming) : 0;
  return Math.max(1, (k.flare ?? 3) - cut - p.tamed);
}

/** 現在的氣焰 */
export function flareOf(r: RunState, k: GhostCase): number {
  return Math.max(0, startFlare(r, k) - progress(r, k.id).dmg);
}

/** 跪地求饒了沒（氣焰歸零） */
export function knelt(r: RunState, k: GhostCase): boolean {
  return !!r.cases[k.id]?.dj?.knelt;
}

/**
 * 第一次跪地求饒時要播的劇情（第三章：紙紮童跪下）。只播一次：拿了就記在 flags，之後回傳 undefined。
 */
export function takeKneelStory(r: RunState, k: GhostCase): string | undefined {
  if (!k.kneelStory || !knelt(r, k)) return undefined;
  const flag = `kneelStory_${k.id}`;
  if (r.flags[flag]) return undefined;
  r.flags[flag] = true;
  return k.kneelStory;
}

/** 冤魂怨氣到 3：縮起來不再開口 */
export function muted(r: RunState, k: GhostCase): boolean {
  const h = r.held.find((x) => x.id === k.id);
  return natureOf(k) === 'wronged' && !!h && h.grudge >= MUTE_AT;
}

/** 還能說的狠話：沒破掉的；跪了之後只剩「連著真相、還沒問出來」的 */
export function available(r: RunState, k: GhostCase): number[] {
  const p = progress(r, k.id);
  const truths = r.cases[k.id]?.truths ?? [];
  return (k.taunts ?? [])
    .map((t, i) => ({ t, i }))
    .filter(({ i }) => !p.broken.includes(i))
    .filter(({ t }) => !knelt(r, k) || (t.truth !== undefined && !truths.includes(t.truth)))
    .map(({ i }) => i);
}

/** 這句狠話的正解 */
export function expected(t: Taunt): Choice {
  if (t.type === 'lie') return 'east';
  if (t.type === 'excuse') return 'west';
  return t.sore ? 'listen' : 'south';
}

/** 東營／西營手上有沒有對得上這句的證據（D8：按鈕上標「對得上」） */
export function matching(r: RunState, t: Taunt, choice: Choice): string | undefined {
  if (choice !== 'east' && choice !== 'west') return undefined;
  if (expected(t) !== choice) return undefined;
  return (t.evidence ?? []).find((id) => r.evidence.includes(id));
}

function next(r: RunState, k: GhostCase, from: number): number {
  const av = available(r, k);
  if (!av.length) return -1;
  return av.find((i) => i > from) ?? av[0];
}

/** 揭開一層真相（重複的不算），回傳是不是新的 */
function reveal(r: RunState, id: string, truth: number | undefined): number | undefined {
  if (truth === undefined) return undefined;
  const c = (r.cases[id] ??= { truths: [] });
  if (c.truths.includes(truth)) return undefined;
  c.truths.push(truth);
  return truth;
}

/** 跪下：掉出只有審過才拿得到的證據 */
function kneelNow(r: RunState, k: GhostCase): string[] {
  const p = progress(r, k.id);
  if (p.knelt) return [];
  p.knelt = true;
  const drops = (k.dropsOnTrial ?? []).filter((id) => !r.evidence.includes(id));
  r.evidence.push(...drops);
  return drops;
}

// ---------- 升堂 ----------
export interface Opening {
  session: Session;
  /** 壓過一晚：牠先說的話（惡鬼吐實、冤魂心事） */
  overnight?: string;
  /** 壓一晚自動破掉的那一句揭開的真相 */
  truth?: number;
  /** 一開場氣焰就歸零（壓一晚＋威名） */
  kneel?: boolean;
  drops?: string[];
}

/**
 * 押上堂（或路邊點將）：套用壓過一晚的效果，決定第一句狠話。
 * night：第幾夜（白天路邊點將就是當天）；第二天起解鎖合擊。
 */
export function openCase(r: RunState, k: GhostCase, mode: Session['mode'], day: number): Opening {
  const p = progress(r, k.id);
  const h = r.held.find((x) => x.id === k.id);
  const out: Opening = { session: { id: k.id, mode, combo: day >= COMBO_FROM_DAY, anger: 0, streak: 0, cur: -1 } };
  if (h?.tamed) {
    h.tamed = false;
    p.tamed++;
    out.overnight = k.overnight?.say;
    const b = k.overnight?.breaks;
    if (b !== undefined && k.taunts?.[b] && !p.broken.includes(b)) {
      p.broken.push(b);
      out.truth = reveal(r, k.id, k.taunts[b].truth);
    } else if (!isEvil(k) && k.heart?.length) {
      // 冤魂冷靜下來：多說一層心事（已經寫在 overnight.say 裡；計入聽過的心事）
      p.heard = Math.min(k.heart.length, p.heard + 1);
    }
  }
  // 壓一晚、威名升高之後，一開場氣焰就歸零：直接跪
  if (!p.knelt && flareOf(r, k) === 0) {
    out.kneel = true;
    out.drops = kneelNow(r, k);
  }
  const av = available(r, k);
  out.session.cur = av[0] ?? -1;
  if (mode === 'roadside') out.session.roundLeft = av.length;
  if (muted(r, k)) out.session.over = 'mute';
  else if (out.session.cur < 0) out.session.over = 'done';
  return out;
}

/** 點將：結算這一下，換下一句狠話 */
export function pick(r: RunState, k: GhostCase, s: Session, choice: Choice): Outcome {
  const taunts = k.taunts ?? [];
  const t = taunts[s.cur];
  const base = { choice, taunt: s.cur, drop: 0 };
  if (muted(r, k)) {
    s.over = 'mute';
    return { ...base, kind: 'mute', line: k.wrong };
  }
  if (!t || s.over) return { ...base, kind: 'skip', line: '' };
  const p = progress(r, k.id);
  let out: Outcome;
  const wasKnelt = knelt(r, k);
  if (choice === 'skip') {
    out = { ...base, kind: 'skip', line: '（先跳過這句。）' };
  } else {
    const ev = matching(r, t, choice);
    const right = expected(t) === choice && (choice === 'south' || choice === 'listen' || !!ev);
    if (right) {
      p.broken.push(s.cur);
      out = { ...base, kind: 'hit', line: t.hit, evidence: ev };
      if (choice === 'listen') {
        const hs = k.heart ?? [];
        if (hs.length) out.heart = hs[Math.min(p.heard, hs.length - 1)];
        p.heard = Math.min(hs.length, p.heard + 1);
      }
      out.truth = reveal(r, k.id, t.truth);
      if (!wasKnelt) {
        // 合擊：第二天起，連續點對兩次之後的那一下（讓牠說不是點將，不算也不中斷）
        const isCombo = s.combo && choice !== 'listen' && s.streak >= COMBO_STREAK;
        const before = flareOf(r, k);
        p.dmg += Math.min(before, isCombo ? 2 : 1);
        out.drop = before - flareOf(r, k);
        if (isCombo) {
          out.combo = true;
          s.streak = 0;
        } else if (choice !== 'listen') s.streak++;
        if (flareOf(r, k) === 0) {
          out.kneel = true;
          out.drops = kneelNow(r, k);
        }
      }
    } else {
      const why: Outcome['why'] = choice === 'south' && !isEvil(k) ? 'scaredWronged'
        : choice === 'listen' ? 'listenEvil'
          : expected(t) === choice ? 'noEvidence' : 'wrongCamp';
      out = { ...base, kind: 'miss', why, line: t.miss };
      s.streak = 0;
      if (why === 'scaredWronged') {
        // 南營嚇冤魂：怨氣 +1、縮起來（大綱 §6）
        const h = r.held.find((x) => x.id === k.id);
        if (h) {
          h.grudge = clamp(h.grudge + 1, 0, MUTE_AT);
          out.grudge = 1;
        }
      }
      // 跪著求饒的鬼，點錯了太子也不會再被激（牠已經跪了）
      if (!wasKnelt) {
        s.anger = Math.min(ANGER_MAX, s.anger + 1);
        if (s.anger >= ANGER_MAX) {
          out.forced = true;
          s.over = 'forced';
        }
      }
    }
  }
  if (s.roundLeft !== undefined) s.roundLeft--;
  if (!s.over) {
    s.cur = next(r, k, s.cur);
    if (muted(r, k)) s.over = 'mute';
    else if (s.cur < 0) s.over = 'done';
    else if (s.roundLeft !== undefined && s.roundLeft <= 0) s.over = 'round';
  }
  return out;
}

// ---------- 判決 ----------
/** 這個判決現在能不能下（空字串＝可以）；第三章超渡、編入要先跪地求饒 */
export function verdictWhy(r: RunState, k: GhostCase, v: VerdictDef): string {
  const st = r.cases[k.id] ?? { truths: [] };
  if ((v.verdict === 'release' || v.verdict === 'recruit') && !knelt(r, k)) return '牠還沒跪地求饒（氣焰歸零才能超渡或編入五營）';
  const miss = (v.needs ?? []).filter((i) => !st.truths.includes(i));
  if (miss.length) return `還沒查明：${miss.map((i) => `「${k.truths[i].summary.slice(0, 14)}…」`).join('、')}`;
  if (v.extra && !v.extra.test(r)) return v.extra.why;
  return '';
}

export interface Judged {
  lines: string[];
  /** 斬錯了：播真相回憶 */
  wronged: boolean;
}

/**
 * 下判決（第三章；夜審與路邊點將共用）：改 r，回傳要顯示的字。
 *  - 超渡：戾氣 -1，有技能的寫出最後一戰多的技能
 *  - 編入五營：寫明進哪一營
 *  - 押送
 *  - 太子親斬：依身分（core/renown.ts 的 slayGhost）
 */
export function judge(r: RunState, k: GhostCase, v: VerdictDef, ch: ChapterDef): Judged {
  const st = (r.cases[k.id] ??= { truths: [] });
  const name = st.truths.length ? k.name : k.dayName;
  const lines: string[] = [];
  let wronged = false;
  if (v.verdict === 'slay') {
    const res = slayGhost(r, k, ch);
    wronged = res.wronged;
    lines.push(ch.trial.slayLine(name));
    if (res.weiming) lines.push(`威名 +${res.weiming}`);
    else if (!res.wronged) lines.push('牠還沒被揭穿：威名不加，也不加戾氣');
    if (res.lost.length) lines.push(`沒審清楚就斬：拿不到「${res.lost.map((id) => ch.evidence[id].name).join('、')}」了`);
    if (res.wronged) lines.push(ch.trial.wrongedLine, `牠是有冤的：戾氣 +${res.liqi}・因果簿記下遺憾`);
  } else {
    st.verdict = v.verdict;
    r.held = r.held.filter((h) => h.id !== k.id);
    switch (v.verdict) {
      case 'release': {
        r.liqi = Math.max(0, r.liqi - 1);
        lines.push(`${k.name}對著${ch.god}拜了三拜，身影慢慢淡去。`, '戾氣 -1');
        const sk = ch.releaseSkill(k.id);
        if (sk) lines.push('', `最後一戰多一個技能「${sk.name}」：${sk.desc}`);
        break;
      }
      case 'recruit': {
        r.flags[`recruit_${k.id}`] = true;
        const camp = CAMP_NAME[k.camp ?? 'center'];
        lines.push(`${k.name}跪下來：${ch.trial.recruitSay}`, `編入${camp}。`, v.result);
        break;
      }
      case 'escort':
        lines.push(`五營兵將押著${name}，往地府去了。`);
        break;
      default:
        lines.push(v.result);
    }
  }
  lines.push(...ch.verdictEffects(r, k.id, v.verdict));
  return { lines, wronged };
}

/** 太子怒氣滿了直接斬（依身分結算，D11） */
export function forcedSlay(r: RunState, k: GhostCase, ch: ChapterDef): Judged {
  const v = k.verdicts.find((x) => x.verdict === 'slay') ?? { verdict: 'slay' as const, result: '' };
  const j = judge(r, k, v, ch);
  return { ...j, lines: ['太子：「夠了。」', ...j.lines] };
}

// ---------- 每晚幾案 ----------
/** 入夜：今晚能審幾案（沒有限制的章節不設） */
export function beginNight(r: RunState, ch: Pick<ChapterDef, 'trial'>): void {
  r.trialsLeft = ch.trial.perNight;
}

/** 還能不能再開一案 */
export function canOpen(r: RunState): boolean {
  return r.trialsLeft === undefined || r.trialsLeft > 0;
}

/** 正式開審：用掉一案（審到一半押回去也算，D12） */
export function useTrial(r: RunState): void {
  if (r.trialsLeft !== undefined) r.trialsLeft = Math.max(0, r.trialsLeft - 1);
}

// ---------- 天亮 ----------
/**
 * 天亮時押著的鬼：
 *  - 第一、二章（overnight grudge）：怨氣 +1，到 3 掙脫。
 *  - 第三章（tame）：太子壓下去教訓一晚：不加怨氣、不掙脫；冤魂冷靜下來怨氣 -1；隔天開審氣焰 -1。
 * 回傳要寫進「昨日」的話。
 */
export function dawnHeld(r: RunState, ch: Pick<ChapterDef, 'overnight' | 'held' | 'cases'>): string[] {
  const out: string[] = [];
  // 第四章：鬼跟在頭旗後面走，不是押著；不加怨氣、不掙脫（core/guihu.ts）
  if (ch.overnight === 'carry') return out;
  if (ch.overnight === 'tame') {
    for (const h of r.held) {
      h.tamed = true;
      const k = ch.cases[h.id];
      if (k && natureOf(k) === 'wronged' && h.grudge > 0) h.grudge--;
    }
    if (r.held.length) out.push(`${ch.held.label}的${r.held.map((h) => ch.cases[h.id].dayName).join('、')}被太子壓了一晚，今天好審多了。`);
    return out;
  }
  for (const h of [...r.held] as Held[]) {
    h.grudge++;
    if (h.grudge >= 3) {
      r.held = r.held.filter((x) => x !== h);
      (r.cases[h.id] ??= { truths: [] }).escaped = true;
      out.push(`${ch.held.label}的${ch.cases[h.id].dayName}怨氣太重，掙脫逃走了。`);
    }
  }
  return out;
}
