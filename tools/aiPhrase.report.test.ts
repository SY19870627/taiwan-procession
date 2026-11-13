/**
 * 避免 AI 味命中報告（npm run check:ai，設定在 vitest.ai.config.ts；npm test 不跑）。永遠不失敗。
 * - 一定印：AI_HITS_BEGIN … AI_HITS_END 之間一段 JSON（專案沒裝 @types/node，不靠 node 型別）。
 * - 另外試著寫 _agent/ai-phrase-hits.md（不進版控）；執行環境沒有 node:fs 就略過。
 * 命中只是「請寫手看一眼」，不是錯；報告不改任何遊戲文字。
 */
import { it } from 'vitest';
import { AI_MANUAL, AI_RULES, CHAPTER_ORDER, scanAll, type ScanResult } from '../src/tools/aiPhrase';

const cell = (s: string) => s.replace(/\r?\n/g, '⏎').replace(/\|/g, '\\|');

function markdown(hits: ScanResult[]): string {
  const L: string[] = [];
  L.push('# 避免 AI 味：機械掃描命中報告', '');
  L.push('由 `npm run check:ai` 產生（src/tools/aiPhrase.ts）。命中只是「請寫手看一眼」，會有誤報；不改任何遊戲文字。', '');
  L.push(`需人工／fable 審讀（不自動掃）：${AI_MANUAL.map((r) => `${String(r.no).padStart(2, '0')} ${r.name}`).join('、')}`, '');
  for (const ch of CHAPTER_ORDER) {
    const rows = hits.filter((h) => h.chapter === ch);
    L.push(`## ${ch}（${rows.length} 句命中）`, '');
    L.push('| 條目 | 命中句數 | 命中次數 |', '|---|---|---|');
    for (const r of AI_RULES) {
      const hs = rows.flatMap((x) => x.hits.filter((h) => h.no === r.no));
      L.push(`| ${String(r.no).padStart(2, '0')} ${r.name} | ${hs.length} | ${hs.reduce((n, h) => n + h.snippets.length, 0)} |`);
    }
    L.push('');
    if (!rows.length) continue;
    L.push('| file | id | 原句 | 命中條目 |', '|---|---|---|---|');
    for (const x of rows) {
      const tags = x.hits
        .map((h) => `${String(h.no).padStart(2, '0')} ${h.name}：${h.snippets.map((s) => `「${cell(s)}」`).join(' ')}`)
        .join('<br>');
      L.push(`| ${x.file} | ${x.id.slice(x.file.length + 1)} | ${cell(x.text)} | ${tags} |`);
    }
    L.push('');
  }
  return L.join('\n');
}

it('AI 味命中報告（不失敗）', async () => {
  let hits: ScanResult[] = [];
  try {
    hits = scanAll();
  } catch (e) {
    console.log('AI 味掃描出錯：', e);
    return;
  }
  console.log('AI_HITS_BEGIN');
  console.log(JSON.stringify(hits.map(({ chapter, id, text, hits: h }) => ({ chapter, id, text, hits: h }))));
  console.log('AI_HITS_END');
  try {
    const fs = (await import(/* @vite-ignore */ 'node:' + 'fs')) as {
      writeFileSync(p: URL, s: string): void;
    };
    fs.writeFileSync(new URL('../_agent/ai-phrase-hits.md', import.meta.url), markdown(hits));
    console.log(`已寫 _agent/ai-phrase-hits.md：${hits.length} 句命中`);
  } catch (e) {
    console.log('沒有寫報告檔（只印 JSON）：', String(e));
  }
});
