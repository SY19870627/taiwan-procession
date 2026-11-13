/**
 * 互嗆字幕不擋按鈕（第 8 階段修正）：freeY 找一個不和按鈕重疊、離原本位置最近的高度。
 */
import { describe, it, expect } from 'vitest';
import { fitCard, freeY, overlaps, type Rect } from '../src/core/layout';

const RAW = import.meta.glob(['../src/scenes/DayScene.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const daySrc = Object.values(RAW)[0];

/**
 * 第 C2 輪：白天卡片（第三天阿翰那張：三個選項＋稟報＋「不處理：…」）蓋到下面的「前方」。
 * DayScene 的面板：上緣 BAND_Y 226 ＋ 隊伍帶 321 ＋ 14 = 561；下緣 H − 16；「前方」兩件時那條線在下緣上面 22 + 2×38 + 10。
 */
describe('fitCard：卡片塞不下就縮，不蓋到「前方」', () => {
  const panel = (H: number) => {
    const y = 561;
    const h = H - y - 16;
    return { top: y, floor: y + h - 12, limit: y + h - 22 - 2 * 38 - 10 - 6 };
  };

  it('放得下就不縮、「前方」照常顯示', () => {
    const p = panel(1558);
    expect(fitCard(p.top, p.limit - 1, p.limit, p.floor)).toEqual({ scale: 1, ahead: true });
  });

  // 390×844 的手機（遊戲高 1558）、電腦（1280）；內容從很短到很長（第三天秀枝那種長卡約 1000）
  for (const H of [1558, 1280]) {
    it(`遊戲高 ${H}：任何長度的卡片縮完都不蓋到「前方」（或「前方」收起來、不超出面板）`, () => {
      const p = panel(H);
      for (let len = 100; len <= 1300; len += 10) {
        const bottom = p.top + len;
        const f = fitCard(p.top, bottom, p.limit, p.floor);
        const scaled = p.top + len * f.scale;
        if (f.scale <= 0.5) continue;
        if (f.ahead) expect(scaled, `${H} ${len}`).toBeLessThanOrEqual(p.limit + 0.01);
        else expect(scaled, `${H} ${len}`).toBeLessThanOrEqual(p.floor + 0.01);
        expect(f.scale).toBeGreaterThanOrEqual(0.5);
        expect(f.scale).toBeLessThanOrEqual(1);
      }
    });
  }

  it('第三天阿翰的長卡（估約 900 高）在 390×844 上只縮一點、「前方」還在', () => {
    const p = panel(1558);
    const f = fitCard(p.top, p.top + 900, p.limit, p.floor);
    expect(f.ahead).toBe(true);
    expect(f.scale).toBeLessThan(1);
    expect(f.scale).toBeGreaterThan(0.85);
  });

  it('DayScene：卡片內容放進 cardBox，「前方」另外一個容器；每張卡最後一列（skipRow）排完就 fitCard', () => {
    expect(daySrc).toContain('(this.cardBox ?? this.side).add(o);');
    expect(daySrc).toContain('this.fitCard(Math.max(y + 66, t.y + t.height) + 6);');
    expect(daySrc).toContain('const fit = fitCardLayout(p.y, bottom, limit, p.y + p.h - 12);');
    expect(daySrc).toContain('if (!fit.ahead) this.aheadBox?.setVisible(false);');
    // 「前方」先畫，再開卡片容器（不跟著卡片縮）
    const head = daySrc.slice(daySrc.indexOf('private cardHead('));
    expect(head.indexOf('this.drawAhead(p);')).toBeLessThan(head.indexOf('this.cardBox = this.add.container(0, 0);'));
  });
});

describe('freeY：字幕讓開按鈕', () => {
  const box = { x: 16, w: 300, h: 30 };
  const hit = (y: number, bs: Rect[]) => bs.some((b) => overlaps({ x: box.x, y, w: box.w, h: box.h }, b));

  it('沒有擋到就留在原位', () => {
    expect(freeY(box, 240, [], 1280)).toBe(240);
    expect(freeY(box, 240, [{ x: 400, y: 230, w: 100, h: 60 }], 1280)).toBe(240);
  });

  it('擋到按鈕就移到最近的空位，而且真的不重疊', () => {
    const btn: Rect[] = [{ x: 140, y: 530, w: 150, h: 46 }];
    const y = freeY(box, 548, btn, 1280);
    expect(hit(y, btn)).toBe(false);
    expect(Math.abs(y - 548)).toBeLessThan(80);
  });

  it('夜審大廳：一排排「太子親斬／押送」按鈕之間找得到縫，也避開已經排好的上一句', () => {
    const rows: Rect[] = [];
    for (let i = 0; i < 4; i++) rows.push({ x: 140, y: 360 + i * 176, w: 340, h: 44 }, { x: 600, y: 260 + i * 176, w: 130, h: 52 });
    const first = freeY(box, 548, rows, 1280);
    expect(hit(first, rows)).toBe(false);
    const placed = [...rows, { x: 16, y: first, w: 300, h: 30 }];
    const second = freeY(box, first + 34, placed, 1280);
    expect(hit(second, placed)).toBe(false);
  });

  it('留在畫面裡；整個畫面都被擋住時退回原位', () => {
    expect(freeY(box, -50, [], 1280)).toBeGreaterThanOrEqual(0);
    expect(freeY(box, 5000, [], 1280)).toBeLessThanOrEqual(1280 - 30);
    expect(freeY(box, 300, [{ x: 0, y: 0, w: 720, h: 1280 }], 1280)).toBe(300);
  });
});
