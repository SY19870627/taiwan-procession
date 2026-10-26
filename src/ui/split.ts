/**
 * 把一段故事拆成一句一句（不依賴 Phaser，方便測試）。
 * 「」裡的話算說話的人說的，其他是旁白；太長的句子在句號處斷開。
 * 「」開頭可以加表情標記，例如「{sad}我只是……」：說話的人有立繪圖時會換成那個表情（標記不會顯示）。
 */
import type { Expr } from '../art/portraits';

export interface TalkLine {
  /** 說話的人（沒有就是旁白） */
  name?: string;
  /** 立繪貼圖 */
  tex?: string;
  /** 鬼：立繪畫成半透明藍色 */
  ghost?: boolean;
  /** 表情（有立繪圖的角色才有用） */
  expr?: Expr;
  text: string;
}

const EXPRS = ['normal', 'sad', 'angry', 'surprised', 'smile', 'relieved', 'calm'];


/** 把一段故事拆成一句一句 */
export function splitStory(s: string, who?: { name: string; tex?: string; ghost?: boolean }): TalkLine[] {
  const out: TalkLine[] = [];
  const pushNarr = (t: string) => {
    for (const part of chunk(t)) out.push({ text: part });
  };
  const re = /「([^」]*)」/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const before = s.slice(last, m.index).replace(/[：:，,]\s*$/, '').trim();
    if (before) pushNarr(before);
    // 誰說的：引號前面那一句提到這個人（或前面沒有旁白），就算他說的；否則當成別人說的話
    const clause = before.split(/[。！？]/).pop() ?? '';
    // 「阿城的阿嬤」在故事裡寫成「阿嬤」、「阿秀嬸與阿弟」寫成「阿秀嬸」
    const short = who ? who.name.split('的').pop()!.split('與')[0] : '';
    const mine = !!who && (!before || clause.includes(who.name) || clause.includes(short) || /^(他|她|牠)/.test(clause.trim()));
    // 表情標記 {sad}
    let said = m[1];
    let expr: Expr | undefined;
    const em = /^\{(\w+)\}/.exec(said);
    if (em) {
      said = said.slice(em[0].length);
      if (EXPRS.includes(em[1])) expr = em[1] as Expr;
    }
    for (const part of chunk(said)) out.push(mine ? { name: who!.name, tex: who!.tex, ghost: who!.ghost, expr, text: `「${part}」` } : { text: `「${part}」` });
    last = m.index + m[0].length;
  }
  const rest = s.slice(last).trim();
  if (rest) pushNarr(rest);
  return out.filter((l) => l.text.replace(/[「」\s。，]/g, ''));
}

/** 長句在句號、問號、驚嘆號處斷開，每段大約 40 字以內 */
export function chunk(t: string): string[] {
  const parts = t.split(/(?<=[。！？])/).map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > 40 && cur) {
      out.push(cur);
      cur = p;
    } else cur += p;
  }
  if (cur) out.push(cur);
  return out;
}

