/**
 * 第三章戰鬥圖（最後一戰・疾水溪的 jiao 模式使用）。【暫代美術】全部程式繪製。
 *  - b3_taizi：太子出轎（雙髻、紅肚兜、混天綾、火尖槍、手上乾坤圈、腳踩風火輪）
 *  - b3_zhang／b3_xiao／b3_liu／b3_lian：四將戰鬥姿勢（背後插營色靠旗；章持盾、霄持大刀、柳持弓、廉持黑令旗與鎖鏈）
 *  - jiao／jiao_rise：蛟（平常、浪頭升起＝預告翻江）
 *  - xia：蝦兵（持叉）；x3_ring 乾坤圈、x3_wheel 風火輪、x3_firetrail 風火輪火痕、x3_wave 翻江的水牆
 * 若之後有正式的蛟戰鬥圖（docs/第三章_開發計畫.md §5.2「其他美術」），用同樣的貼圖名稱載入即可蓋掉。
 */
import Phaser from 'phaser';
import { DARK, make, person, type G } from './figures';
import { CAMP_COLORS } from './xinyingSpec';

/** 一面三角小旗 */
export function pennant(g: G, x: number, y: number, len: number, color: number): void {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + len, y + len * 0.35);
  g.lineTo(x, y + len * 0.7);
  g.closePath();
  g.fillPath();
  g.lineStyle(2, 0xe9b949, 1);
  g.strokePath();
}

/** 乾坤圈：金色圓環 */
export function ring(g: G, x: number, y: number, r: number, thick: number, glow = false): void {
  if (glow) {
    g.fillStyle(0xffd76a, 0.25);
    g.fillCircle(x, y, r + thick * 3);
  }
  g.lineStyle(thick, 0xe9b949, 1);
  g.strokeCircle(x, y, r);
  g.lineStyle(Math.max(1, thick / 3), 0xfff3c4, 1);
  g.strokeCircle(x, y, r - thick / 3);
}

/** 風火輪：一圈火焰的輪子 */
export function wheel(g: G, x: number, y: number, r: number): void {
  g.fillStyle(0xff7a2a, 0.85);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    g.fillTriangle(
      x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7,
      x + Math.cos(a + 0.5) * r * 0.7, y + Math.sin(a + 0.5) * r * 0.7,
      x + Math.cos(a + 0.25) * r * 1.35, y + Math.sin(a + 0.25) * r * 1.35,
    );
  }
  g.fillStyle(0xffd76a, 1);
  g.fillCircle(x, y, r * 0.75);
  g.fillStyle(0xc8372d, 1);
  g.fillCircle(x, y, r * 0.5);
  g.fillStyle(0xffd76a, 1);
  g.fillCircle(x, y, r * 0.18);
}

function taizi(g: G, w: number, h: number): void {
  const cx = w / 2;
  const top = h - 26;
  // 混天綾：繞過肩膀往後飄的紅綢
  g.lineStyle(8, 0xd8372d, 0.95);
  g.beginPath();
  g.moveTo(cx + 18, h - 104);
  for (let k = 1; k <= 9; k++) g.lineTo(cx + 18 - k * 10, h - 104 - Math.sin(k * 0.8) * 16 - k * 3);
  g.strokePath();
  wheel(g, cx - 20, h - 14, 13);
  wheel(g, cx + 20, h - 14, 13);
  person(g, w, top, { robe: 0xd8372d, trim: 0xe9b949, pants: 0xe9c13a, tall: 0.9, wide: 0.95, hat: 'none', item: 'none' });
  // 雙髻
  g.fillStyle(0x1a1a1a, 1);
  g.fillCircle(cx - 9, top - 86, 7);
  g.fillCircle(cx + 9, top - 86, 7);
  g.fillStyle(0xd8372d, 1);
  g.fillRect(cx - 12, top - 82, 6, 3);
  g.fillRect(cx + 6, top - 82, 6, 3);
  // 肚兜上的金邊
  g.fillStyle(0xe9b949, 1);
  g.fillTriangle(cx - 8, top - 62, cx + 8, top - 62, cx, top - 50);
  // 火尖槍
  g.lineStyle(4, 0x8a5a2a, 1);
  g.lineBetween(cx + 24, h - 20, cx + 44, h - 186);
  g.fillStyle(0xff7a2a, 1);
  g.fillTriangle(cx + 40, h - 182, cx + 50, h - 184, cx + 47, h - 198);
  g.fillStyle(0xd8d8e0, 1);
  g.fillTriangle(cx + 41, h - 178, cx + 48, h - 180, cx + 46, h - 194);
  // 左手上的乾坤圈
  ring(g, cx - 22, top - 56, 11, 4, true);
}

/** 蛟：從右邊水面升起的長身（一節一節的圓），頭朝左；rise = 浪頭升起（預告翻江） */
function jiao(g: G, w: number, h: number, rise: boolean): void {
  const base = h - 30;
  const lift = rise ? 70 : 0;
  const pts: [number, number, number][] = [];
  for (let k = 0; k < 11; k++) {
    const t = k / 10;
    const x = w - 60 - t * (w - 200);
    // 從水裡拱起一道弧，頭在左上（t = 1）
    const y = base - 30 - Math.sin(t * Math.PI * 0.9) * (150 + lift) - t * (120 + lift * 0.6);
    pts.push([x, y, 46 - t * 14]);
  }
  if (rise) {
    // 身後一道升起的浪頭
    g.fillStyle(0x5a90a8, 0.75);
    g.beginPath();
    g.moveTo(w, base);
    g.lineTo(w, 60);
    g.lineTo(w - 60, 40);
    g.lineTo(w - 140, 90);
    g.lineTo(w - 170, base);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xe8f4f8, 0.9);
    for (let k = 0; k < 6; k++) g.fillCircle(w - 140 + k * 24, 50 + Math.abs(Math.sin(k)) * 30, 12);
  }
  // 身體：鱗片帶亮邊
  for (const [x, y, r] of pts) {
    g.fillStyle(0x2a5a5a, 1);
    g.fillCircle(x, y, r);
    g.fillStyle(0x3a7a6a, 1);
    g.fillCircle(x - r * 0.2, y - r * 0.25, r * 0.7);
    g.lineStyle(2, 0x8ad0b0, 0.6);
    g.beginPath();
    g.arc(x, y, r * 0.8, Math.PI * 1.1, Math.PI * 1.6);
    g.strokePath();
  }
  // 背鰭
  g.fillStyle(0x1a3a3a, 1);
  for (let k = 1; k < pts.length - 1; k += 2) {
    const [x, y, r] = pts[k];
    g.fillTriangle(x - 10, y - r + 4, x + 10, y - r + 4, x + 4, y - r - 22);
  }
  // 爪
  const [px, py] = pts[5];
  for (let k = 0; k < 3; k++) g.fillTriangle(px - 30 + k * 10, py + 30, px - 22 + k * 10, py + 30, px - 34 + k * 10, py + 56);
  // 頭：張口、短角、金眼、長鬚
  const [hx0, hy0] = pts[pts.length - 1];
  const hx = hx0 - 40;
  const hy = hy0 - 6;
  g.fillStyle(0x2a5a5a, 1);
  g.fillEllipse(hx, hy, 120, 64);
  g.fillStyle(0x3a7a6a, 1);
  g.fillEllipse(hx - 6, hy - 10, 100, 34);
  g.fillStyle(0x5a1a2a, 1);
  g.fillTriangle(hx - 60, hy + 2, hx - 4, hy + 4, hx - 50, hy + 34);
  g.fillStyle(0xf4f2ea, 1);
  for (let k = 0; k < 4; k++) g.fillTriangle(hx - 54 + k * 12, hy + 4, hx - 48 + k * 12, hy + 4, hx - 51 + k * 12, hy + 14);
  g.fillStyle(0xc8b88a, 1);
  g.fillTriangle(hx + 10, hy - 24, hx + 22, hy - 22, hx + 34, hy - 62);
  g.fillTriangle(hx + 28, hy - 20, hx + 38, hy - 18, hx + 54, hy - 50);
  g.fillStyle(0xffd76a, 1);
  g.fillCircle(hx + 4, hy - 12, 9);
  g.fillStyle(0x1a1a1a, 1);
  g.fillEllipse(hx + 4, hy - 12, 4, 14);
  g.lineStyle(3, 0x8ad0b0, 0.9);
  g.beginPath();
  g.moveTo(hx - 40, hy - 4);
  g.lineTo(hx - 80, hy - 26);
  g.lineTo(hx - 110, hy - 14);
  g.strokePath();
  g.beginPath();
  g.moveTo(hx - 36, hy + 8);
  g.lineTo(hx - 76, hy + 30);
  g.lineTo(hx - 100, hy + 50);
  g.strokePath();
  // 水面與浪花（身體從水裡出來）
  g.fillStyle(0x3a6a80, 0.9);
  g.fillRect(0, base, w, h - base);
  g.fillStyle(0xe8f4f8, 0.85);
  for (let k = 0; k < 9; k++) g.fillCircle(w - 120 + k * 12 - (k % 2) * 30, base - 4 - (k % 3) * 6, 10 - (k % 3) * 2);
}

function shrimp(g: G, w: number, h: number): void {
  const cx = w / 2;
  g.fillStyle(0xb84a2a, 1);
  g.fillRect(cx - 10, h - 20, 4, 18);
  g.fillRect(cx + 4, h - 20, 4, 18);
  g.fillStyle(0xd86a4a, 1);
  for (let k = 0; k < 5; k++) g.fillEllipse(cx, h - 26 - k * 13, 30 - k * 2, 16);
  g.fillStyle(0xe88a6a, 1);
  g.fillEllipse(cx + 2, h - 92, 26, 22);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx + 8, h - 96, 3);
  g.lineStyle(2, 0xb84a2a, 1);
  g.lineBetween(cx + 10, h - 100, cx + 34, h - 108);
  g.lineBetween(cx + 6, h - 102, cx + 22, h - 110);
  // 叉
  g.lineStyle(3, 0x6a5a4a, 1);
  g.lineBetween(cx + 18, h - 4, cx + 30, h - 100);
  g.lineStyle(2, 0xc8c8d0, 1);
  for (const d of [-5, 0, 5]) g.lineBetween(cx + 30 + d, h - 100, cx + 31 + d, h - 112);
  g.lineBetween(cx + 25, h - 100, cx + 36, h - 100);
}

export function makeXinyingBattle(scene: Phaser.Scene): void {
  make(scene, 'b3_taizi', 150, 200, taizi);

  // 四將：背後兩面營色靠旗
  const general = (key: string, robe: number, trim: number, flag: number, extra: (g: G, w: number, h: number) => void, item: 'club' | 'chain' | 'none' = 'none') =>
    make(scene, key, 120, 160, (g, w, h) => {
      const cx = w / 2;
      g.fillStyle(0x8a6a3a, 1);
      g.fillRect(cx - 14, h - 150, 3, 70);
      g.fillRect(cx + 10, h - 150, 3, 70);
      pennant(g, cx - 11, h - 150, 26, flag);
      pennant(g, cx + 13, h - 148, 26, flag);
      person(g, w, h, { robe, trim, pants: DARK, tall: 1.12, wide: 1.2, hat: 'helmet', hatColor: trim, item });
      extra(g, w, h);
    });
  general('b3_zhang', CAMP_COLORS.east, 0xe9b949, CAMP_COLORS.east, (g, w, h) => {
    // 大圓盾
    g.fillStyle(0x6a4a2a, 1);
    g.fillCircle(w / 2 + 22, h - 58, 20);
    g.lineStyle(3, 0xe9b949, 1);
    g.strokeCircle(w / 2 + 22, h - 58, 20);
    g.fillStyle(0xe9b949, 1);
    g.fillCircle(w / 2 + 22, h - 58, 5);
  }, 'club');
  general('b3_xiao', CAMP_COLORS.south, 0xe9b949, CAMP_COLORS.south, (g, w, h) => {
    // 大刀
    g.lineStyle(4, 0x6a4a2a, 1);
    g.lineBetween(w / 2 + 20, h - 10, w / 2 + 36, h - 140);
    g.fillStyle(0xd8d8e0, 1);
    g.fillTriangle(w / 2 + 34, h - 128, w / 2 + 52, h - 150, w / 2 + 38, h - 112);
  });
  general('b3_liu', 0xd8d4ca, 0x6a6a7a, CAMP_COLORS.west, (g, w, h) => {
    // 長弓
    const bx = w / 2 + 14;
    const by = h - 70;
    g.lineStyle(3, 0x6a4a2a, 1);
    g.beginPath();
    g.arc(bx, by, 34, -1.2, 1.2);
    g.strokePath();
    g.lineStyle(1, 0xf4f2ea, 1);
    g.lineBetween(bx + Math.cos(-1.2) * 34, by + Math.sin(-1.2) * 34, bx + Math.cos(1.2) * 34, by + Math.sin(1.2) * 34);
  });
  general('b3_lian', CAMP_COLORS.north, 0x7a8aa0, CAMP_COLORS.north, (g, w, h) => {
    // 黑令旗
    g.fillStyle(0x6a4a2a, 1);
    g.fillRect(w / 2 + 24, h - 120, 3, 100);
    g.fillStyle(0x1a1a22, 1);
    g.fillRect(w / 2 + 27, h - 120, 26, 22);
    g.lineStyle(2, 0xe9b949, 1);
    g.strokeRect(w / 2 + 27, h - 120, 26, 22);
  }, 'chain');

  make(scene, 'jiao', 520, 420, (g, w, h) => jiao(g, w, h, false));
  make(scene, 'jiao_rise', 520, 420, (g, w, h) => jiao(g, w, h, true));
  make(scene, 'xia', 90, 116, shrimp);

  make(scene, 'x3_ring', 72, 72, (g, w, h) => ring(g, w / 2, h / 2, 22, 7, true));
  make(scene, 'x3_wheel', 48, 48, (g, w, h) => wheel(g, w / 2, h / 2, 15));
  make(scene, 'x3_firetrail', 160, 40, (g, _w, h) => {
    for (let k = 0; k < 10; k++) {
      g.fillStyle(k % 2 ? 0xffd76a : 0xff7a2a, 0.15 + k * 0.07);
      g.fillEllipse(10 + k * 15, h / 2 + Math.sin(k) * 3, 14 + k * 2, 10 + k);
    }
  });
  make(scene, 'x3_wave', 300, 260, (g, w, h) => {
    g.fillStyle(0x3a6a80, 0.85);
    g.beginPath();
    g.moveTo(0, h);
    g.lineTo(20, 80);
    g.lineTo(80, 30);
    g.lineTo(170, 20);
    g.lineTo(240, 60);
    g.lineTo(220, 90);
    g.lineTo(w, h);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x5a90a8, 0.9);
    g.fillTriangle(40, h, 90, 60, 160, h);
    g.fillStyle(0xe8f4f8, 0.9);
    for (let k = 0; k < 10; k++) g.fillCircle(60 + k * 18, 28 + Math.abs(Math.sin(k * 1.3)) * 22, 9 + (k % 3) * 2);
  });
}
