/**
 * 互嗆字幕不擋按鈕（第 8 階段修正）：freeY 找一個不和按鈕重疊、離原本位置最近的高度。
 */
import { describe, it, expect } from 'vitest';
import { freeY, overlaps, type Rect } from '../src/core/layout';

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
