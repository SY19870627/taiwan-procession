/**
 * 第四章（白砂墩）超框校正第 1 步：用跟遊戲同一套「估寬 → 縮字／換行」的純函式（core/fitText.ts），
 * 檢查第四章資料裡會進單行標題、按鈕的字放得進給定的寬度；別章原本放得下的字不受影響。
 * 估寬：中日韓字、全形標點 1 個字寬，半形英數 0.62（偏寬，寧可多報）。實際畫面另用 tools/overflow-scan-ch4.mjs 掃。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CHAPTERS, startChapter } from '../src/content/chapter';
import { CHAPTER4 } from '../src/content/ch4';
import { CARDS4 } from '../src/content/ch4/believers';
import type { DayPlan, Encounter } from '../src/content/days';
import * as state from '../src/state';
import { strayChoices } from '../src/core/procession';
import { BUTTON_PAD, OPTION_W, estWidth, fitEst, fitLine, optionLabel, splitEven, twoLines, wrapEst } from '../src/core/fitText';
import { chunk, flashbackLines } from '../src/ui/split';

const RAW = import.meta.glob(['../src/scenes/*.ts', '../src/ui/widgets.ts', '../src/ui/talk.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const raw = (end: string) => RAW[Object.keys(RAW).find((p) => p.endsWith(end))!];

const W = 720;
/** 白天的面板（DayScene.resetSide）：x 16、寬 W − 32 */
const P = { x: 16, w: W - 32 };
const r = () => state.run;

beforeEach(() => startChapter('baishadun'));

function allEncounters(p: DayPlan): Encounter[] {
  return [
    ...p.pre, ...p.routes.flatMap((x) => x.encounters), ...p.post,
    ...(p.follow?.detour?.encounters ?? []), ...(p.follow?.rest.encounters ?? []),
    ...(p.tagged ?? []).flatMap((t) => t.encounters),
  ];
}

describe('fitText：估寬、縮字、換行', () => {
  it('估寬：中文 1 字寬、半形 0.62、多行取最寬', () => {
    expect(estWidth('擲筊', 30)).toBe(60);
    expect(estWidth('ab', 10)).toBeCloseTo(12.4);
    expect(estWidth('一二三\n一', 10)).toBe(30);
  });

  it('放得下：字級、換行都不動', () => {
    expect(fitLine((s) => s * 5, 200, 30, 20)).toEqual({ size: 30, wrap: false });
  });

  it('放不下：縮到第一個放得下的字級', () => {
    expect(fitLine((s) => s * 10, 250, 30, 20)).toEqual({ size: 25, wrap: false });
  });

  it('縮到最小還放不下：停在最小字級、改成換行', () => {
    expect(fitLine((s) => s * 10, 100, 30, 20)).toEqual({ size: 20, wrap: true });
    const f = fitEst('一二三四五六七八九十，十一', 100, 20, 20);
    expect(f.wrap).toBe(true);
    // 標點不放行首
    expect(f.lines.slice(1).every((l) => !/^[，。、]/.test(l))).toBe(true);
  });

  it('wrapEst：每行（扣掉行尾的標點）不超過寬度', () => {
    for (const l of wrapEst('派前哨在人潮裡順出一條路，把她送到工作人員旁邊', 15, 100)) {
      expect(estWidth(l.replace(/[，。、；：！？」』）】…]+$/, ''), 15)).toBeLessThanOrEqual(100);
    }
  });

  it('twoLines、splitEven：不掉字、標點不放行首', () => {
    for (const s of ['起一陣風，讓隔壁的阿伯看到他的腳', '派前哨在人潮裡順出一條路，把她送到工作人員旁邊', '短的']) {
      expect(twoLines(s).replace('\n', '')).toBe(s);
      for (const n of [2, 3]) {
        const lines = splitEven(s, n);
        expect(lines.join('')).toBe(s);
        expect(lines.slice(1).every((l) => !/^[，。、；：]/.test(l))).toBe(true);
      }
    }
  });
});

describe('序章擲筊的標題（AlmanacScene.prologueJiao）', () => {
  // 彈窗寬 W − 40，標題可以用的寬度 pw − 64
  const maxW = W - 40 - 64;
  for (const ch of Object.values(CHAPTERS)) {
    const title = `擲筊・請示：${ch.jiao.ask}`;
    if (ch.id === 'baishadun') {
      it(`${ch.place}：「${title}」30 號字放不下 → 縮字後一行放得進彈窗（不換行、不小於 22）`, () => {
        expect(estWidth(title, 30)).toBeGreaterThan(maxW);
        const f = fitEst(title, maxW, 30, 22);
        expect(f.wrap).toBe(false);
        expect(f.size).toBeGreaterThanOrEqual(22);
        expect(estWidth(title, f.size)).toBeLessThanOrEqual(maxW);
      });
    } else {
      it(`${ch.place}：「${title}」原本就放得下，字級不變（30）`, () => {
        expect(fitEst(title, maxW, 30, 22)).toMatchObject({ size: 30, wrap: false });
      });
    }
  }

  it('AlmanacScene：標題先 fitText，換行時整個彈窗往下讓（dy）', () => {
    const src = raw('AlmanacScene.ts');
    expect(src).toContain('fitText(title, pw - 64, 22);');
    expect(src).toContain('const ph = 600 + dy;');
    expect(src).toContain('y + dy + 76, rules.join');
    expect(src).toContain('y + dy + rowY + i * rowH');
  });
});

describe('第四章：黃曆下方、白天上方的單行字', () => {
  it('黃曆下方「第幾天・地區」（24 號字、寬 W − 40）不用縮', () => {
    for (const d of [1, 2, 3]) {
      const p = CHAPTER4.days[d];
      expect(fitEst(`${p.title}・${p.area}`, W - 40, 24, 18).size, p.title).toBe(24);
    }
    const ep = CHAPTER4.epilogue!;
    expect(fitEst(`${ep.title}・${ep.area}`, W - 40, 24, 18).size).toBe(24);
  });

  it('白天左上「第幾天・白天」（28 號）與地區（18 號）碰不到右邊的「因果簿」按鈕（左緣 346）', () => {
    for (const d of [1, 2, 3]) {
      const p = CHAPTER4.days[d];
      expect(20 + estWidth(`${p.title}・白天`, 28), p.title).toBeLessThanOrEqual(346);
      expect(20 + estWidth(p.area, 18), p.area).toBeLessThanOrEqual(346);
    }
  });
});

describe('第四章：白天卡片的標題、地點（DayScene.cardHead）', () => {
  /** 標題從頭像右邊（最壞：x + 124）排到右邊標籤的左邊 − 12 */
  const head = (title: string, place: string, tag?: string) => {
    const tagW = tag ? estWidth(tag, 19) + 16 : 0;
    const right = P.x + P.w - 24;
    const tx = P.x + 124;
    return {
      title: fitEst(title, right - (tag ? tagW + 12 : 0) - tx, 30, 22),
      place: fitEst(place, right - tx, 20, 15),
    };
  };

  for (const d of [1, 2, 3]) {
    it(`${CHAPTER4.days[d].title}：每件事的卡片標題、地點縮完都是一行`, () => {
      let n = 0;
      for (const e of allEncounters(CHAPTER4.days[d])) {
        startChapter('baishadun');
        let h: ReturnType<typeof head> | undefined;
        if (e.kind === 'person') {
          const c = CARDS4[e.card](r());
          if (!c) continue;
          h = head(c.who, e.place, c.deadline ? `趁${c.deadline}` : undefined);
        } else if (e.kind === 'ghost') {
          const k = CHAPTER4.cases[e.caseId];
          h = head(k.dayName, `${e.place}（凡人看不見）`, k.meet ? '沒地方去的' : '有冤情的好兄弟');
        } else if (e.kind === 'imp') h = head('牽路仔', e.place, '隊尾');
        else if (e.kind === 'clue') h = head('線索', e.place);
        else h = head(e.who, e.place);
        expect(h.title.wrap, `${e.id} 標題`).toBe(false);
        expect(h.place.wrap, `${e.id} 地點「${e.place}」`).toBe(false);
        n++;
      }
      expect(n).toBeGreaterThan(3);
    });
  }
});

describe('第四章：按鈕上的字放得進按鈕', () => {
  /** 選項按鈕：照 optionLabel 斷行、字級；每一行放得進按鈕（左右留邊），行數 × 行高放得進按鈕高 */
  const fitsOption = (label: string) => {
    const o = optionLabel(label, true);
    const f = fitEst(o.text, OPTION_W - BUTTON_PAD, o.size, 13);
    const lines = f.lines.length;
    return { ok: !f.wrap && lines * f.size * 1.45 <= o.h - 4, o, f };
  };

  it('每張信徒卡的每個選項', () => {
    const labels = new Set<string>();
    for (const id of Object.keys(CARDS4)) {
      startChapter('baishadun');
      for (const o of CARDS4[id](r())?.options ?? []) labels.add(o.label);
    }
    expect(labels.size).toBeGreaterThan(20);
    for (const l of labels) {
      const f = fitsOption(l);
      expect(f.ok, `「${l}」→「${f.o.text.replace('\n', '／')}」${f.o.size}px`).toBe(true);
    }
  });

  it('岔路押兵、好兄弟（帶走）、牽路仔（派兵回頭喊、託點心站）的選項', () => {
    const labels = new Set<string>(['查看', '問話', '留在轎邊']);
    for (const d of [1, 2, 3]) {
      const p = CHAPTER4.days[d];
      for (const b of Object.values(p.follow?.bets ?? {})) if (b) labels.add(b.label);
      for (const e of allEncounters(p)) {
        if (e.kind === 'ghost') labels.add(CHAPTER4.cases[e.caseId].meet?.take ?? '收容');
        if (e.kind === 'imp' && CHAPTER4.imp.mode === 'stray') {
          for (const c of strayChoices(r(), e, 'pre', CHAPTER4.imp.hours)) labels.add(c.how === 'shout' ? CHAPTER4.imp.verb : c.label);
        }
      }
    }
    for (const l of labels) {
      const f = fitsOption(l);
      expect(f.ok, `「${l}」→「${f.o.text.replace('\n', '／')}」${f.o.size}px`).toBe(true);
    }
  });

  it('原本放得下的選項照舊（字、字級、按鈕高都不變）；別章（不是 follow）完全照舊', () => {
    expect(optionLabel('陪她走，聽她講老路的事', true)).toEqual({ text: '陪她走，\n聽她講老路的事', size: 17, h: 64 });
    expect(optionLabel('順好門口，再聽他講阿爸交代的事', true)).toEqual({ text: '順好門口，\n再聽他講阿爸交代的事', size: 15, h: 64 });
    expect(optionLabel('收容', false)).toEqual({ text: '收容', size: 24, h: 52 });
    expect(optionLabel('請七爺八爺押走牠', false)).toEqual({ text: '請七爺八爺押走牠', size: 18, h: 52 });
    // 別章很長的字也不斷行（照舊；比按鈕寬的話由 button() 縮字）
    expect(optionLabel('派前哨在人潮裡順出一條路，把她送到工作人員旁邊', false).text).not.toContain('\n');
    // 第四章太長：平均斷成三行、按鈕加高
    const long = optionLabel('派前哨在人潮裡順出一條路，把她送到工作人員旁邊', true);
    expect(long.text.split('\n').length).toBe(3);
    expect(long.h).toBeGreaterThan(64);
  });

  it('最後一戰的結局按鈕（BossHud.finish：長的 230 寬 18 號，短的 170 寬）', () => {
    for (const o of CHAPTER4.finale.ends) {
      const long = o.label.length > 5;
      const bw = long ? 230 : 170;
      const size = long ? 18 : o.label.length > 3 ? 20 : 24;
      expect(estWidth(o.label, size), o.label).toBeLessThanOrEqual(bw - BUTTON_PAD);
    }
  });

  it('判決按鈕（TrialScene.verdicts：150 寬）', () => {
    for (const name of Object.values(CHAPTER4.verdictName)) {
      if (!name) continue;
      expect(estWidth(name, name.length > 4 ? 18 : 22), name).toBeLessThanOrEqual(150 - BUTTON_PAD);
    }
  });

  it('button()：字比按鈕寬才縮字（fitText），setLabel 先還原字級再量', () => {
    const src = raw('widgets.ts');
    expect(src).toContain('if (t.width <= w - 2) return;');
    expect(src).toContain('t.setWordWrapWidth(null).setFontSize(size);');
  });
});

// ---------------- 超框校正第 2 步 ----------------

describe('夜審「回憶」的拆句（ui/split.ts 的 flashbackLines）', () => {
  /** 第四章每一層真相的 reveal（一問一答，用換行分開） */
  const reveals = () => Object.values(CHAPTER4.cases).flatMap((k) => k.truths.map((t) => ({ name: k.name, reveal: t.reveal })));

  it('第四章：不會拆出空引號「」、引號成對、沒有一句以標點開頭', () => {
    expect(reveals().length).toBeGreaterThan(0);
    for (const { name, reveal } of reveals()) {
      for (const l of flashbackLines(reveal, name)) {
        expect(l, l).not.toMatch(/「\s*」/);
        expect(l.split('「').length, l).toBe(l.split('」').length);
        expect(l.split('『').length, l).toBe(l.split('』').length);
        expect(l, l).not.toMatch(/^[，。、！？；：…」』）]/);
        // 名字只在原文有寫的時候出現（不會把「草鞋丁：」硬加在別人問的那句前面）
        if (reveal.includes('\n') && !/^[^「」]{1,8}：「/.test(reveal.split('\n').find((x) => x.trim() === l) ?? '')) expect(l.startsWith(`${name}：`), l).toBe(false);
      }
    }
  });

  it('第四章：一行就是一句，字原樣不動（不掉字、不加字）', () => {
    for (const { name, reveal } of reveals()) {
      if (!reveal.includes('\n')) continue;
      expect(flashbackLines(reveal, name).join('\n')).toBe(reveal.split('\n').map((x) => x.trim()).filter(Boolean).join('\n'));
    }
  });

  it('第四章：每一句在回憶畫面（28 號、寬 W − 80）換行後最多 3 行', () => {
    for (const { name, reveal } of reveals()) {
      for (const l of flashbackLines(reveal, name)) expect(wrapEst(l, 28, W - 80).length, l).toBeLessThanOrEqual(3);
    }
  });

  it('別章（reveal 沒有換行）照舊：句號處斷開、前面加「名字：「…」」', () => {
    const rv = '「……我只是摸摸他的額頭，像以前摸我的囝仔那樣。我不知道……我的手是冷的。」';
    expect(flashbackLines(rv, '阿桂')).toEqual(chunk(rv.replace(/^「|」$/g, '')).map((t) => `阿桂：「${t}」`));
    for (const ch of Object.values(CHAPTERS)) {
      if (ch === CHAPTER4) continue;
      for (const k of Object.values(ch.cases)) {
        for (const t of k.truths) {
          if (t.reveal.includes('\n')) continue;
          expect(flashbackLines(t.reveal, k.name)).toEqual(chunk(t.reveal.replace(/^「|」$/g, '')).map((x) => `${k.name}：「${x}」`));
        }
      }
    }
  });

  it('flashback() 用 flashbackLines，一問一答的排法：標點不放行首、往上推不疊、放不下收掉最舊的（別章照舊）', () => {
    const src = raw('talk.ts');
    expect(src).toContain('flashbackLines(o.reveal, o.name)');
    expect(src).toContain("const dialog = o.reveal.includes('\\n');");
    expect(src).toContain('if (dialog) relayout();');
    expect(src).toContain('else if (t.y + t.height > H - 80) for (const s of shown) s.y -= t.height + 18;');
  });
});

describe('最後一戰「陣前審問」那一條（BossScene.playTrial，第四章 ford）', () => {
  const src = () => raw('BossScene.ts');
  const ROOM = () => Number(/TRIAL_STAMP_ROOM = (\d+)/.exec(src())![1]);
  /** 戰鬥帶：BAND_Y 132、高 720 × 720 / 1280 = 405；審問那一條 top = BAND_Y + 8、h = BAND_H − 16 */
  const top = 132 + 8;
  const h = 405 - 16;

  it('茫渡那句換行在印章左邊（印章中心 W − 90、旋轉後寬約 84）', () => {
    const sayW = W - 48 - ROOM();
    expect(24 + sayW).toBeLessThanOrEqual(W - 90 - 42);
    for (const r of CHAPTER4.finale.rounds) {
      for (const row of wrapEst(`${CHAPTER4.finale.bossName}：${r.line}`, 23, sayW)) expect(estWidth(row, 23), row).toBeLessThanOrEqual(sayW);
    }
  });

  it('茫渡那句換成幾行，證據卡都往下讓，也不壓到最下面的結果字', () => {
    const sayW = W - 48 - ROOM();
    for (const r of CHAPTER4.finale.rounds) {
      const rows = wrapEst(`${CHAPTER4.finale.bossName}：${r.line}`, 23, sayW).length;
      const sayBottom = top + 54 + rows * 23 * 1.35;
      const cardTop = Math.max(top + 110, sayBottom + 10);
      expect(cardTop + 120, r.line).toBeLessThanOrEqual(top + h - 70);
    }
  });

  it('換輪先清掉上一輪、字後面墊不透明的底、審問還在時提示字等它滑出（別章照舊）', () => {
    const s = src();
    expect(s).toContain('this.trialC?.destroy();');
    expect(s).toContain("const sayW = ford ? W - 48 - TRIAL_STAMP_ROOM : W - 48;");
    expect(s).toMatch(/this\.add\.rectangle\(0, top, W, Math\.max\(sayBottom, BAND_Y \+ 34 \+ 2 \* 38\) \+ 8 - top, 0x0a0614, 1\)/);
    expect(s).toContain('const cardTop = ford ? Math.max(top + 110, say.y + say.height + 10) : top + 110;');
    expect(s).toContain('if (this.trialC?.active) {');
  });
});
