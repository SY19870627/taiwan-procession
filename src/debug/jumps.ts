/**
 * 除錯面板的跳關：只用 BootScene 既有的網址深層連結（?scene=…&ch=…&n=…），不另寫跳關邏輯。
 * 選單每一項的值就是那一段查詢字串；jump 時換網址（保留 debug=1 等非跳關參數）重新開始。
 */
import { CHAPTERS, type ChapterDef } from '../content/chapter';

export interface JumpItem { scene: string; label: string }
export interface JumpGroup { name: string; items: JumpItem[] }

/** BootScene 讀的跳關參數：換場景時這些一律清掉，換成新的（&full=1 是整章走到底的模式，照留） */
export const JUMP_PARAMS = [
  'scene', 'ch', 'n', 'id', 'kind', 'prologue', 'epilogue', 'text', 'beat', 'proto', 'preset', 'sunset', 'fun', 'scare', 'ask', 'panel',
  'bc1', 'done', 'strayed', 'held', 'ending', 'yday',
];

const NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
/** 第幾章（照 CHAPTERS 的順序，1 起算；找不到是 0） */
export function chapterNo(id: string): number {
  return Object.keys(CHAPTERS).indexOf(id) + 1;
}
/** 「第四章 白砂墩」 */
export function chapterName(id: string): string {
  const ch = CHAPTERS[id];
  const no = chapterNo(id);
  return ch && no ? `第${NUM[no - 1] ?? no}章 ${ch.place}` : '';
}

const q = (o: Record<string, string | number>) => new URLSearchParams(Object.entries(o).map(([k, v]) => [k, String(v)])).toString();

function chapterItems(id: string, ch: ChapterDef): JumpItem[] {
  const out: JumpItem[] = [];
  // 第幾天的劇情帶 &n（BootScene 給劇情的 day，回報框的「第幾天」才對）
  const story = (sid: string | undefined, label: string, n?: number) => {
    if (sid) out.push({ scene: q(n ? { scene: 'story', ch: id, id: sid, n } : { scene: 'story', ch: id, id: sid }), label });
  };
  out.push({ scene: q({ scene: 'almanac', ch: id, prologue: 1 }), label: '序章黃曆（擲筊）' });
  story(ch.prologueStory, '開場劇情');
  story(ch.openingStory, '開場過場');
  const days = Object.keys(ch.days).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
  for (const n of days) {
    story(ch.dawnStory?.[n], `第${n}天 天亮前劇情`, n);
    out.push({ scene: q({ scene: 'almanac', ch: id, n }), label: `第${n}天 黃曆` });
    story(ch.departStory?.[n], `第${n}天 出發過場`, n);
    out.push({ scene: q({ scene: 'day', ch: id, n }), label: `第${n}天 白天` });
    story(ch.nightStory?.[n], `第${n}夜 開審前過場`, n);
    out.push({ scene: q({ scene: 'trial', ch: id, n }), label: `第${n}夜 夜審` });
  }
  story(ch.finale.story, '最後一戰前劇情');
  out.push({ scene: q({ scene: 'boss', ch: id }), label: '最後一戰' });
  const ends = ch.finale.endStory ?? { recall: ch.finale.recallStory };
  const END_NAME: Record<string, string> = { recall: '結局劇情（最好）', return: '結局劇情（送回）', slay: '結局劇情（斬）' };
  for (const [k, sid] of Object.entries(ends)) story(sid, END_NAME[k] ?? `結局劇情（${k}）`);
  story(ch.finale.closeStory, '收尾劇情');
  if (ch.epilogue) {
    out.push({ scene: q({ scene: 'almanac', ch: id, epilogue: 1 }), label: `收尾黃曆（${ch.epilogue.title}）` });
    story(ch.epilogue.story, `${ch.epilogue.title}過場`);
  }
  out.push({ scene: q({ scene: 'end', ch: id }), label: '結局（信徒錄）' });
  return out;
}

/** 跳關選單：共用（標題、選章）＋每一章 */
export function jumpGroups(): JumpGroup[] {
  return [
    { name: '共用', items: [{ scene: q({ scene: 'title' }), label: '標題' }, { scene: q({ scene: 'chapters' }), label: '選章' }] },
    ...Object.entries(CHAPTERS).map(([id, ch]) => ({ name: `${chapterName(id)}・${ch.title}`, items: chapterItems(id, ch) })),
  ];
}

/**
 * 跳關的網址：原本網址的跳關參數（JUMP_PARAMS）與 _r 清掉，其他（debug=1、v=…）照留，再加上這一項的參數。
 * line > 0 而且是劇情（story）：加 &beat=line（演出直接從第幾拍開始）。query 是空的或沒有 scene＝不認得，回 ''。
 */
export function jumpUrl(href: string, query: string, line = 0): string {
  const add = new URLSearchParams(query);
  if (!query || !add.get('scene')) return '';
  const u = new URL(href);
  for (const k of [...JUMP_PARAMS, '_r']) u.searchParams.delete(k);
  for (const [k, v] of add) u.searchParams.set(k, v);
  if (line > 0 && add.get('scene') === 'story') u.searchParams.set('beat', String(Math.floor(line)));
  return u.toString();
}
