/**
 * 避免 AI 味檢核表（docs/AI味檢核表.md、docs/AI味檢核表_20條.md）的機械掃描器：純函式，只讀、不改任何遊戲文字。
 * 20 條裡能用字面抓的放在 AI_RULES（偏保守，會有誤報，命中只是「請寫手看一眼」）；其餘列在 AI_MANUAL，交給人工／fable 審讀。
 * scanChapterTexts() 收集玩家看得到的字（各章 content 模組的匯出值＋原始碼裡含中文的字串字面值；scenes、ui 歸「共用」），
 * 給 tools/aiPhrase.report.test.ts（npm run check:ai）出命中報告；npm test 不跑報告，只跑 tests/aiPhrase.test.ts。
 */
// 先照遊戲（和測試）的順序載入章節，再載 eager glob（見 aiPhraseSources.ts 的說明）
import '../content/chapter';
import '../content/story';
import '../content/stage';
import { MODS, RAW } from './aiPhraseSources';

export interface AiRule {
  /** 檢核表條目編號 1–20 */
  no: number;
  name: string;
  /** 回傳命中的片段（含前後幾個字）；沒命中回空陣列 */
  test(text: string): string[];
}

export interface ManualRule {
  no: number;
  name: string;
  note: '需人工／fable 審讀';
}

const CJK = /[㐀-鿿豈-﫿]/;
const CTX = 4;

/** 全域比對，每個命中回傳前後 CTX 個字的片段 */
function grab(re: RegExp, text: string): string[] {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out: string[] = [];
  for (const m of text.matchAll(g)) {
    const i = m.index ?? 0;
    if (m[0].length === 0) continue;
    out.push(text.slice(Math.max(0, i - CTX), i + m[0].length + CTX));
  }
  return out;
}

/** 最後一句（句末標點切開，取最後一個非空句子） */
function lastSentence(text: string): string {
  const parts = text
    .replace(/\n+/g, '。')
    .split(/(?<=[。！？…])/)
    .map((s) => s.replace(/^[\s」』）)]+/, '').trim())
    .filter((s) => CJK.test(s));
  return parts[parts.length - 1] ?? '';
}

/** 三連排比：同一個開頭字（有／是／像／在）連三個短子句；或三個等長短項並列後收句 */
function triple(text: string): string[] {
  const out = grab(/(?:^|(?<=[，、。！？；：「\s]))([有是像在])[^，、。！？；\n]{1,6}[，、]\1[^，、。！？；\n]{1,6}[，、]\1[^，、。！？；\n]{1,6}/u, text);
  const list = /(?:^|(?<=[，。！？；：「\s]))([一-鿿]{2,4})([、，])([一-鿿]{2,4})\2([一-鿿]{2,4})[。！]/gu;
  for (const m of text.matchAll(list)) {
    if (m[1].length === m[3].length && m[3].length === m[4].length) {
      const i = m.index ?? 0;
      out.push(text.slice(Math.max(0, i - CTX), i + m[0].length + CTX));
    }
  }
  return out;
}

export const AI_RULES: AiRule[] = [
  { no: 1, name: '破折號', test: (t) => grab(/——|—/, t) },
  { no: 2, name: '三連排比', test: triple },
  {
    no: 3,
    name: '不是……而是',
    test: (t) => [...grab(/(?:並)?不是[^。！？\n]{0,20}而是/, t), ...grab(/與其說[^。！？\n]{0,20}不如說/, t)],
  },
  {
    no: 4,
    name: '金句收尾',
    test: (t) => grab(/每一(?:次|個|段)|都是.{0,8}(?:安排|禮物|意義)|原來.{0,6}就是/, lastSentence(t)),
  },
  { no: 8, name: '陳腔比喻', test: (t) => grab(/港灣|燈塔|拼圖|旅程|光芒|溫柔的安排|生命中|心靈/, t) },
  {
    no: 14,
    name: '公文翻譯腔',
    test: (t) => grab(/進行(?=[一-鿿]{2})|透過此|建立.{0,4}連結|獲得.{0,3}體驗|深層次|層面|針對|予以|之於/, t),
  },
  { no: 15, name: '程度副詞', test: (t) => grab(/非常|極其|無比|深深|莫大|難以言喻|格外/, t) },
  { no: 17, name: '硬塞口頭禪', test: (t) => {
    const hits = grab(/欸|啦|喔|齁|蛤|哈哈/, t);
    return hits.length >= 3 ? hits : [];
  } },
  { no: 18, name: '表演動作', test: (t) => grab(/微微一笑|嘴角微揚|輕輕嘆|眼底閃過|眼中閃過|溫柔地|淡淡地說/, t) },
  { no: 19, name: '命運永遠', test: (t) => grab(/命運|永遠|一輩子|宿命|註定|從此/, t) },
];

const MANUAL: [number, string][] = [
  [5, '說完又總結一遍'],
  [6, '情緒只貼標籤，沒有當下反應'],
  [7, '每句完整工整，像輪流朗讀作文'],
  [9, '所有角色說同一種話'],
  [10, '角色替作者解說背景'],
  [11, '把潛台詞全說破'],
  [12, '一問一答過度配合，人人像客服'],
  [13, '客套與報幕擋住真正的對話'],
  [16, '同義重說，刻意換詞假裝推進'],
  [20, '每場都完整和解，沒有留下下一次'],
];
export const AI_MANUAL: ManualRule[] = MANUAL.map(([no, name]) => ({ no, name, note: '需人工／fable 審讀' }));

export interface RuleHit {
  no: number;
  name: string;
  snippets: string[];
}

export function scanText(text: string): RuleHit[] {
  const out: RuleHit[] = [];
  for (const r of AI_RULES) {
    const snippets = r.test(text);
    if (snippets.length) out.push({ no: r.no, name: r.name, snippets });
  }
  return out;
}

// ---------------------------------------------------------------- 收集玩家看得到的字

export type ChapterKey = '第一章' | '第二章' | '第三章' | '第四章' | '共用';
export const CHAPTER_ORDER: ChapterKey[] = ['第一章', '第二章', '第三章', '第四章', '共用'];

export interface TextEntry {
  chapter: ChapterKey;
  /** 相對 src 的路徑，例如 content/ch4/missed.ts */
  file: string;
  /** `${file}:${keyPath}`（匯出值）或 `${file}:L${行}`（原始碼字面值） */
  id: string;
  text: string;
}

const NUM = ['', '第一章', '第二章', '第三章', '第四章'] as const;

/** 檔案 → 章；不收的檔回 null */
function chapterOf(file: string): ChapterKey | null {
  const m = /^content\/ch(\d)\/[^/]+\.ts$/.exec(file) ?? /^content\/stage\/ch(\d)\.ts$/.exec(file);
  if (m) return NUM[Number(m[1])] || null;
  // stage/index.ts 放的是第一章的演出腳本（第二～四章在 stage/ch*.ts）；types.ts 只有型別
  if (file === 'content/stage/index.ts') return '第一章';
  if (/^content\/[^/]+\.ts$/.test(file)) return '第一章';
  if (/^(scenes|ui)\/[^/]+\.ts$/.test(file)) return '共用';
  return null;
}

/** 處理順序：先各章子資料夾（index 最後），再第一章頂層（chapter.ts 最後），stage/index 最後；重新匯出的物件只算第一個走到的檔 */
function rank(file: string): number {
  const ch = /^content\/ch(\d)\//.exec(file);
  if (ch) return (10 - Number(ch[1])) * 10 + (file.endsWith('/index.ts') ? 1 : 0);
  if (/^content\/stage\/ch\d\.ts$/.test(file)) return 100;
  if (file === 'content/stage/index.ts') return 300;
  if (file === 'content/chapter.ts') return 210;
  if (/^content\/[^/]+\.ts$/.test(file)) return 200;
  return 400;
}

function walk(value: unknown, path: string, seen: WeakSet<object>, emit: (path: string, s: string) => void): void {
  if (typeof value === 'string') {
    if (CJK.test(value)) emit(path, value);
    return;
  }
  if (value === null || typeof value !== 'object') return; // 函式不呼叫、不走
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, seen, emit));
    return;
  }
  if (value instanceof Map) {
    for (const [k, v] of value) walk(v, `${path}.${String(k)}`, seen, emit);
    return;
  }
  for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, seen, emit);
}

const ESC: Record<string, string> = { n: '\n', t: '\t', r: '', '0': '\0' };
function unesc(s: string): string {
  return s.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\n|.)/g, (_, e: string) => {
    if (e[0] === 'u' && e.length > 1) return String.fromCodePoint(parseInt(e.replace(/[u{}]/g, ''), 16));
    if (e[0] === 'x' && e.length === 3) return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e === '\n') return '';
    return ESC[e] ?? e;
  });
}

/**
 * 原始碼裡的字串字面值（'…'、"…"、`…`），跳過註解；樣板字串的 ${…} 換成「…」。
 * 小型詞法掃描，不認正規表示式字面值；單、雙引號字串遇到換行就當作沒對上，避免一路錯下去。
 */
export function rawLiterals(src: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      const start = line;
      let j = i + 1;
      let buf = '';
      let ok = false;
      while (j < n) {
        const d = src[j];
        if (d === '\\') { buf += src.slice(j, j + 2); if (src[j + 1] === '\n') line++; j += 2; continue; }
        if (d === '\n') break;
        if (d === c) { ok = true; j++; break; }
        buf += d;
        j++;
      }
      if (ok) out.push({ line: start, text: unesc(buf) });
      i = j; // 沒對上就從換行處繼續
      continue;
    }
    if (c === '`') {
      const start = line;
      let j = i + 1;
      let buf = '';
      while (j < n && src[j] !== '`') {
        const d = src[j];
        if (d === '\\') { buf += src.slice(j, j + 2); if (src[j + 1] === '\n') line++; j += 2; continue; }
        if (d === '$' && src[j + 1] === '{') {
          // 跳過 ${…}（含巢狀大括號）
          let depth = 1;
          j += 2;
          while (j < n && depth > 0) {
            if (src[j] === '{') depth++;
            else if (src[j] === '}') depth--;
            else if (src[j] === '\n') line++;
            j++;
          }
          buf += '…';
          continue;
        }
        if (d === '\n') line++;
        buf += d;
        j++;
      }
      out.push({ line: start, text: unesc(buf) });
      i = j + 1;
      continue;
    }
    i++;
  }
  return out.filter((l) => CJK.test(l.text));
}

/** 收集各章玩家看得到的字（有穩定 id）；同一檔內相同的字只留一筆（匯出值的 keyPath 優先） */
export function scanChapterTexts(): TextEntry[] {
  const files = new Set<string>();
  for (const k of [...Object.keys(MODS), ...Object.keys(RAW)]) files.add(k.replace(/^\.\.\//, ''));
  const ordered = [...files].filter((f) => chapterOf(f)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const seen = new WeakSet<object>();
  const out: TextEntry[] = [];
  for (const file of ordered) {
    const chapter = chapterOf(file)!;
    const have = new Set<string>();
    const ids = new Map<string, number>();
    const add = (id: string, text: string) => {
      if (have.has(text)) return;
      have.add(text);
      // 同一行有兩個字面值時加 #2、#3
      const k = (ids.get(id) ?? 0) + 1;
      ids.set(id, k);
      out.push({ chapter, file, id: `${file}:${id}${k > 1 ? `#${k}` : ''}`, text });
    };
    const mod = MODS[`../${file}`];
    if (mod) for (const [name, v] of Object.entries(mod)) walk(v, name, seen, add);
    const raw = RAW[`../${file}`];
    if (raw) for (const l of rawLiterals(raw)) add(`L${l.line}`, l.text);
  }
  return out;
}

export interface ScanResult extends TextEntry {
  hits: RuleHit[];
}

/** 掃所有章節，只回有命中的字 */
export function scanAll(): ScanResult[] {
  return scanChapterTexts()
    .map((e) => ({ ...e, hits: scanText(e.text) }))
    .filter((e) => e.hits.length > 0);
}
