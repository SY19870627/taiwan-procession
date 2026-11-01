/**
 * 第三章三張新背景：庄頭街景（village）、鴨母寮（duckfarm）、溪邊渡口（ferry）。
 *
 * 【暫代美術】全部程式繪製，照遊戲現有背景的畫風（色塊、無縫橫向捲動）。
 * 之後換成正式背景圖：見 art/xinyingSpec.ts 的 BG_FILES 與 docs/第三章_開發計畫.md §5.2。
 * 每張貼圖都畫白天與夜版本（夜版本名字後面加 N：顏色壓暗、窗戶與燈亮起來）。
 */
import Phaser from 'phaser';
import { lerpColor } from '../theme';
import { make, type G } from './figures';
import { PLAIN_ART, type PlainArtKey } from './xinyingSpec';

type Draw = (g: G, w: number, h: number, night: boolean) => void;

/** 夜裡的顏色：往深藍紫壓暗 */
const dk = (night: boolean, base = 0.7) => (c: number, t = base) => (night ? lerpColor(c, 0x15122a, t) : c);
const LIT = 0xffcf7a;

/** 樹叢天際線（防風林、竹林）：在 [x0, x1) 之間一團一團的圓 */
function treeline(g: G, x0: number, x1: number, base: number, size: number, color: number, seed: number): void {
  g.fillStyle(color, 1);
  for (let x = x0; x < x1; x += size * 0.8) {
    const r = size * (0.55 + 0.25 * Math.abs(Math.sin((x + seed) * 0.37)));
    g.fillCircle(x, base - r * 0.6, r);
  }
  g.fillRect(x0 - size, base - size * 0.4, x1 - x0 + size * 2, size * 0.4 + 2);
}

/** 嘉南平原遠景：甘蔗田、防風林、糖廠煙囪、水塔、遠處的農舍 */
const plainFar: Draw = (g, w, h, night) => {
  const c = dk(night);
  const base = h - 40;
  // 防風林（左右無縫：從 -40 畫到 w+40）
  treeline(g, -40, w + 40, base, 26, c(0x6a8a6a, 0.78), 3);
  // 糖廠：鋸齒屋頂的廠房＋紅白煙囪
  g.fillStyle(c(0x9a9488, 0.75), 1);
  g.fillRect(250, base - 50, 150, 50);
  g.fillStyle(c(0x7a746a, 0.75), 1);
  for (let k = 0; k < 5; k++) g.fillTriangle(250 + k * 30, base - 50, 280 + k * 30, base - 50, 280 + k * 30, base - 68);
  g.fillStyle(c(0xb8b0a0, 0.75), 1);
  g.fillRect(380, 26, 16, base - 26);
  g.fillStyle(c(0xb84a3a, 0.75), 1);
  g.fillRect(380, 26, 16, 10);
  g.fillRect(380, 52, 16, 8);
  if (night) {
    g.fillStyle(0xff4a3a, 1);
    g.fillCircle(388, 22, 3);
    g.fillStyle(LIT, 0.7);
    for (let k = 0; k < 4; k++) g.fillRect(262 + k * 34, base - 34, 10, 8);
  } else {
    // 一縷白煙
    g.fillStyle(0xf4f2ea, 0.5);
    for (let k = 0; k < 4; k++) g.fillCircle(398 + k * 16, 18 - k * 3, 8 + k * 3);
  }
  // 水塔：四支腳＋圓桶
  g.fillStyle(c(0x8a8a8a, 0.75), 1);
  g.fillRect(712, base - 70, 4, 70);
  g.fillRect(744, base - 70, 4, 70);
  g.lineStyle(2, c(0x8a8a8a, 0.75), 1);
  g.lineBetween(714, base - 20, 746, base - 50);
  g.lineBetween(746, base - 20, 714, base - 50);
  g.fillStyle(c(0xc8c4b8, 0.75), 1);
  g.fillRect(700, base - 102, 60, 34);
  g.fillEllipse(730, base - 102, 60, 12);
  // 遠處的農舍與電塔
  for (const [x, s] of [[100, 1], [560, 0.8], [900, 1.1]] as const) {
    g.fillStyle(c(0xb8a890, 0.78), 1);
    g.fillRect(x, base - 22 * s, 44 * s, 22 * s);
    g.fillStyle(c(0x9a5a4a, 0.78), 1);
    g.fillTriangle(x - 4, base - 22 * s, x + 48 * s, base - 22 * s, x + 22 * s, base - 34 * s);
    if (night) {
      g.fillStyle(LIT, 0.8);
      g.fillRect(x + 8 * s, base - 14 * s, 6, 6);
    }
  }
  g.lineStyle(2, c(0x7a7a80, 0.8), 1);
  for (const x of [180, 640]) {
    g.lineBetween(x, base, x + 10, base - 90);
    g.lineBetween(x + 20, base, x + 10, base - 90);
    g.lineBetween(x - 6, base - 70, x + 26, base - 70);
  }
  // 甘蔗田（地平線前的一條綠帶，有一道一道的田埂）
  g.fillStyle(c(0x7aa04a), 1);
  g.fillRect(0, base, w, h - base);
  g.lineStyle(2, c(0x5a8a3a), 1);
  for (let x = 0; x < w; x += 24) g.lineBetween(x, base + 2, x + 10, h);
  g.fillStyle(c(0x9ab85a), 1);
  g.fillRect(0, base, w, 4);
};

/** 鴨母寮遠景：平原＋魚塭水面（水車打水）、遠方一排鴨寮屋頂 */
const pondFar: Draw = (g, w, h, night) => {
  const c = dk(night);
  const base = h - 50;
  treeline(g, -40, w + 40, base - 6, 22, c(0x6a8a6a, 0.78), 11);
  // 遠方鴨寮：長長的低屋頂
  for (const x of [80, 420, 760]) {
    g.fillStyle(c(0x3a3a3a, 0.75), 1);
    g.fillRect(x, base - 20, 160, 14);
    g.fillStyle(c(0x6a5a3a, 0.75), 1);
    for (let k = 0; k < 6; k++) g.fillRect(x + 4 + k * 30, base - 8, 3, 8);
  }
  // 魚塭：一格一格的水面，中間田埂
  g.fillStyle(c(0x8a7a5a), 1);
  g.fillRect(0, base - 2, w, h - base + 2);
  for (let k = 0; k < 4; k++) {
    const x = k * 256 + 10;
    g.fillStyle(c(0x7ab0c8), 1);
    g.fillRect(x, base + 6, 236, h - base - 14);
    g.fillStyle(c(0xb8dcec), night ? 0.3 : 0.8);
    for (let y = base + 14; y < h - 10; y += 10) g.fillRect(x + 20 + ((y * 7) % 60), y, 50, 2);
    // 水車打水
    g.fillStyle(0xffffff, night ? 0.25 : 0.85);
    g.fillCircle(x + 160, base + 20, 5);
    g.fillCircle(x + 170, base + 18, 3);
    g.fillStyle(c(0xd8d0b0), 1);
    g.fillRect(x + 154, base + 14, 12, 4);
  }
  if (night) {
    // 魚塭邊的燈
    g.fillStyle(LIT, 0.9);
    for (let k = 0; k < 4; k++) g.fillCircle(k * 256 + 240, base - 4, 3);
  }
};

/** 疾水溪遠景：對岸的河堤與竹林、遠方的鐵橋 */
const riverFar: Draw = (g, w, h, night) => {
  const c = dk(night);
  const base = h - 20;
  // 對岸遠山（很淡）
  g.fillStyle(c(0x9ab0c0, 0.8), 1);
  g.beginPath();
  g.moveTo(0, base - 40);
  for (let x = 0; x <= w; x += 32) g.lineTo(x, base - 60 - Math.sin(x / 163) * 18 - Math.sin(x / 61) * 6);
  g.lineTo(w, base);
  g.lineTo(0, base);
  g.closePath();
  g.fillPath();
  // 鐵橋（桁架）
  g.fillStyle(c(0x6a6a74, 0.75), 1);
  g.fillRect(560, base - 70, 380, 8);
  for (let k = 0; k <= 6; k++) g.fillRect(560 + k * 62, base - 70, 6, 50);
  g.lineStyle(3, c(0x6a6a74, 0.75), 1);
  for (let k = 0; k < 6; k++) {
    g.lineBetween(560 + k * 62, base - 64, 622 + k * 62, base - 96);
    g.lineBetween(622 + k * 62, base - 64, 560 + k * 62, base - 96);
  }
  g.lineBetween(560, base - 96, 940, base - 96);
  // 對岸的竹林與河堤
  treeline(g, -40, w + 40, base - 10, 18, c(0x5a8a52, 0.78), 23);
  g.fillStyle(c(0xa8a49a, 0.75), 1);
  g.fillRect(0, base - 12, w, 12);
  g.fillStyle(c(0x7a8a6a), 1);
  g.fillRect(0, base, w, h - base);
  if (night) {
    g.fillStyle(LIT, 0.8);
    for (const x of [140, 420, 980]) g.fillCircle(x, base - 18, 2.5);
  }
};

/** 溪面：水紋可以往左（順流）或往右（倒流）捲；左右無縫 */
const water: Draw = (g, w, h, night) => {
  const c = dk(night);
  // 由遠到近一條一條變深（貼圖是用畫布產生的，不能用漸層填色）
  const bands = 6;
  for (let k = 0; k < bands; k++) {
    g.fillStyle(c(lerpColor(0x6a9ab0, 0x3a6a80, k / (bands - 1))), 1);
    g.fillRect(0, (k * h) / bands, w, h / bands + 1);
  }
  g.lineStyle(2, c(0xc8e4ec, 0.6), night ? 0.35 : 0.75);
  for (let y = 8; y < h; y += 12) {
    const off = (y * 37) % 64;
    for (let x = off; x < w; x += 64) {
      // 一道水紋：左低右高的小弧（看得出往哪邊流）
      g.beginPath();
      g.moveTo(x, y + 2);
      g.lineTo(x + 12, y - 1);
      g.lineTo(x + 26, y + 1);
      g.strokePath();
    }
  }
  if (night) {
    // 月光的倒影
    g.fillStyle(0xfff3c4, 0.18);
    for (let y = 10; y < h; y += 14) g.fillRect(140 + ((y * 13) % 30), y, 60 - y / 3, 2);
  }
};

/** 近岸的水泥護岸（蓋在溪面下緣）：左右無縫 */
const levee: Draw = (g, w, h, night) => {
  const c = dk(night);
  g.fillStyle(c(0xb8b4a8), 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(c(0xd0ccc0), 1);
  g.fillRect(0, 0, w, 8);
  g.lineStyle(2, c(0x8a8678), 1);
  for (let x = 0; x < w; x += 64) g.lineBetween(x, 8, x, h);
  g.lineBetween(0, h / 2 + 4, w, h / 2 + 4);
  // 青苔與水痕
  g.fillStyle(c(0x6a8a5a), 0.6);
  for (let x = 10; x < w; x += 90) g.fillEllipse(x, h - 6, 40, 10);
};

/** 柏油路＋水溝蓋＋褪色的分隔線 */
const road: Draw = (g, w, h, night) => {
  const c = dk(night);
  // 路肩的水溝（一格一格的水溝蓋）
  g.fillStyle(c(0xa8a090), 1);
  g.fillRect(0, 0, w, 24);
  g.fillStyle(c(0x6a665c), 1);
  for (let x = 4; x < w; x += 64) {
    g.fillRect(x, 6, 52, 12);
    g.fillStyle(c(0x3a3a34), 1);
    for (let k = 0; k < 6; k++) g.fillRect(x + 4 + k * 8, 8, 4, 8);
    g.fillStyle(c(0x6a665c), 1);
  }
  g.fillStyle(c(0x5a5862), 1);
  g.fillRect(0, 24, w, h - 24);
  // 補過的柏油
  g.fillStyle(c(0x4a4852), 1);
  g.fillRect(60, 70, 80, 30);
  g.fillStyle(c(0xd8c84a, 0.75), night ? 0.5 : 0.85);
  g.fillRect(20, 150, 90, 5);
  g.fillRect(148, 150, 90, 5);
};

/** 鴨寮旁的泥土路：輪胎痕、路邊草 */
const dirt: Draw = (g, w, h, night) => {
  const c = dk(night);
  g.fillStyle(c(0x6a8a4a), 1);
  g.fillRect(0, 0, w, 20);
  g.fillStyle(c(0x5a7a3a), 1);
  for (let x = 0; x < w; x += 14) g.fillTriangle(x, 20, x + 6, 20, x + 3, 6 + ((x * 7) % 8));
  g.fillStyle(c(0xa08a62), 1);
  g.fillRect(0, 20, w, h - 20);
  g.fillStyle(c(0x8a7450), 1);
  g.fillRect(0, 96, w, 14);
  g.fillRect(0, 170, w, 14);
  g.fillStyle(c(0xb89e74), 1);
  for (let i = 0; i < 24; i++) g.fillEllipse((i * 53) % w, 30 + ((i * 41) % (h - 40)), 10, 4);
};

/** 堤防頂上的水泥路：伸縮縫、外側矮欄杆 */
const levroad: Draw = (g, w, h, night) => {
  const c = dk(night);
  g.fillStyle(c(0x8a8a82), 1);
  g.fillRect(0, 0, w, 18);
  g.fillStyle(c(0x6a6a62), 1);
  for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 4, 18);
  g.fillStyle(c(0xb0aca0), 1);
  g.fillRect(0, 18, w, h - 18);
  g.lineStyle(2, c(0x8a867a), 1);
  for (let x = 0; x < w; x += 128) g.lineBetween(x, 18, x, h);
  g.lineBetween(0, 130, w, 130);
  g.fillStyle(c(0x9a968a), 1);
  for (let i = 0; i < 12; i++) g.fillEllipse((i * 71) % w, 40 + ((i * 47) % (h - 50)), 16, 4);
};

/** 紅磚平房：i 決定樣式（平頂加蓋鐵皮、斜屋頂、兩層） */
function house(i: number): Draw {
  return (g, w, h, night) => {
    const c = dk(night);
    const brick = [0xb0563a, 0xa04a34, 0xb86a4a, 0x9a5038][i % 4];
    const wallTop = i === 3 ? 40 : 70;
    // 鐵皮加蓋（平頂的才有）
    if (i === 0 || i === 2) {
      const tin = i === 0 ? 0x4a8a9a : 0x6a7a8a;
      g.fillStyle(c(tin), 1);
      g.fillRect(16, 18, w - 60, wallTop - 18);
      g.lineStyle(1, c(lerpColor(tin, 0x000000, 0.25)), 1);
      for (let x = 20; x < w - 44; x += 8) g.lineBetween(x, 18, x, wallTop);
      g.fillStyle(c(lerpColor(tin, 0x000000, 0.2)), 1);
      g.fillRect(10, 12, w - 48, 8);
    } else if (i === 1) {
      // 斜的瓦屋頂
      g.fillStyle(c(0x7a3a2a), 1);
      g.fillTriangle(-2, wallTop + 4, w + 2, wallTop + 4, w / 2, 16);
      g.fillStyle(c(0x5a2a20), 1);
      g.fillRect(0, wallTop - 2, w, 8);
    }
    // 磚牆
    g.fillStyle(c(brick), 1);
    g.fillRect(0, wallTop, w, h - wallTop);
    g.lineStyle(1, c(lerpColor(brick, 0x000000, 0.25)), 0.8);
    for (let y = wallTop + 8; y < h; y += 10) {
      g.lineBetween(0, y, w, y);
      for (let x = ((y / 10) % 2) * 12; x < w; x += 24) g.lineBetween(x, y, x, y + 10);
    }
    // 兩層的：二樓窗
    if (i === 3) {
      for (const x of [26, w - 76]) {
        const lit = night;
        g.fillStyle(lit ? LIT : c(0x3a3a44), lit ? 0.9 : 1);
        g.fillRect(x, wallTop + 22, 50, 40);
        g.lineStyle(2, c(0x2a2a2a), 1);
        for (let k = 1; k < 4; k++) g.lineBetween(x + k * 12.5, wallTop + 22, x + k * 12.5, wallTop + 62);
      }
      g.fillStyle(c(0xd8d0c0), 1);
      g.fillRect(0, wallTop + 76, w, 8);
    }
    // 鋁門與春聯
    const dw = 62;
    const dx = i % 2 ? w * 0.22 : w * 0.5 - dw / 2;
    g.fillStyle(c(0x9aa0a8), 1);
    g.fillRect(dx, h - 88, dw, 88);
    g.lineStyle(2, c(0x6a7078), 1);
    g.lineBetween(dx + dw / 2, h - 88, dx + dw / 2, h);
    g.lineBetween(dx, h - 44, dx + dw, h - 44);
    g.fillStyle(c(0xd8372d), 1);
    g.fillRect(dx - 12, h - 86, 8, 60);
    g.fillRect(dx + dw + 4, h - 86, 8, 60);
    g.fillRect(dx, h - 98, dw, 8);
    // 鐵窗
    const wx = i % 2 ? w * 0.62 : 18;
    const lit = night && i % 2 === 0;
    g.fillStyle(lit ? LIT : c(0x2a2a34), lit ? 0.9 : 1);
    g.fillRect(wx, h - 76, 52, 40);
    g.lineStyle(2, c(0x3a3a3a), 1);
    for (let k = 0; k <= 4; k++) g.lineBetween(wx + k * 13, h - 80, wx + k * 13, h - 32);
    // 門口的機車或盆栽
    if (i % 2 === 0) {
      g.fillStyle(c(0x3a6a3a), 1);
      g.fillCircle(w - 26, h - 22, 14);
      g.fillStyle(c(0x8a4a2a), 1);
      g.fillRect(w - 36, h - 14, 20, 14);
    } else {
      g.fillStyle(c(0xc83a2a), 1);
      g.fillRect(w - 70, h - 34, 40, 14);
      g.fillStyle(c(0x1a1a1a), 1);
      g.fillCircle(w - 66, h - 10, 9);
      g.fillCircle(w - 32, h - 10, 9);
    }
  };
}

/** 柑仔店：開著的店面、紅白遮雨棚、貨架、冰櫃（招牌只畫色塊，不寫店名） */
const shop: Draw = (g, w, h, night) => {
  const c = dk(night);
  g.fillStyle(c(0xc8b8a0), 1);
  g.fillRect(0, 30, w, h - 30);
  g.fillStyle(c(0x8a1b14), 1);
  g.fillRect(20, 40, w - 40, 34);
  g.fillStyle(c(0xf4e2b0), 1);
  for (let k = 0; k < 4; k++) g.fillRect(40 + k * 42, 48, 28, 18);
  // 遮雨棚
  for (let k = 0; k < 8; k++) {
    g.fillStyle(c(k % 2 ? 0xf4f2ea : 0xc8372d), 1);
    g.fillTriangle(k * (w / 8), 80, (k + 1) * (w / 8), 80, (k + 0.5) * (w / 8), 100);
    g.fillRect(k * (w / 8), 74, w / 8, 8);
  }
  // 店面
  g.fillStyle(night ? 0x3a2a1a : 0x4a3a2e, 1);
  g.fillRect(14, 100, w - 28, h - 100);
  if (night) {
    g.fillStyle(LIT, 0.45);
    g.fillRect(14, 100, w - 28, h - 100);
  }
  // 貨架上一包一包的零食
  const goods = [0xe9b949, 0xd8372d, 0x2b8aa8, 0x6ac85a, 0xe88ac0];
  for (let r = 0; r < 3; r++) {
    g.fillStyle(c(0x6a5a4a), 1);
    g.fillRect(24, 128 + r * 22, w - 120, 3);
    for (let k = 0; k < 9; k++) {
      g.fillStyle(c(goods[(k + r) % goods.length]), 1);
      g.fillRect(28 + k * 13, 114 + r * 22, 10, 14);
    }
  }
  // 冰櫃＋汽水箱
  g.fillStyle(c(0xf0f0f0), 1);
  g.fillRect(w - 84, h - 60, 60, 60);
  g.fillStyle(c(0x9ad0f0), 1);
  g.fillRect(w - 78, h - 54, 48, 18);
  g.fillStyle(c(0xd8372d), 1);
  g.fillRect(w - 76, h - 26, 44, 6);
  g.fillStyle(c(0xe9b949), 1);
  g.fillRect(28, h - 26, 40, 26);
  g.lineStyle(2, c(0x8a6a2a), 1);
  g.lineBetween(28, h - 13, 68, h - 13);
};

/** 檳榔攤：玻璃小亭、霓虹燈框（夜裡會亮） */
const betel: Draw = (g, w, h, night) => {
  const c = dk(night, 0.6);
  g.fillStyle(c(0x7a7a84), 1);
  g.fillRect(10, 40, w - 20, h - 40);
  g.fillStyle(night ? 0x5a4a3a : 0xc8e0e8, 1);
  g.fillRect(20, 60, w - 40, h - 100);
  if (night) {
    g.fillStyle(0xffe0a0, 0.5);
    g.fillRect(20, 60, w - 40, h - 100);
  }
  g.fillStyle(c(0x2a8a3a), 1);
  g.fillRect(28, h - 70, w - 56, 14);
  g.fillStyle(c(0x6ac85a), 1);
  for (let k = 0; k < 6; k++) g.fillCircle(36 + k * 15, h - 72, 4);
  // 霓虹燈框
  const neon = [0x5aff7a, 0xff5ab8, 0x5ad8ff];
  neon.forEach((col, k) => {
    g.lineStyle(night ? 4 : 3, night ? col : lerpColor(col, 0x6a6a6a, 0.45), 1);
    g.strokeRect(14 + k * 4, 44 + k * 4, w - 28 - k * 8, h - 52 - k * 8);
  });
  // 招牌（色塊）
  g.fillStyle(night ? 0xff5ab8 : 0xd84a9a, 1);
  g.fillRect(24, 8, w - 48, 30);
  g.fillStyle(0xfff3f8, night ? 1 : 0.85);
  for (let k = 0; k < 2; k++) g.fillRect(44 + k * 36, 14, 24, 18);
  if (night) {
    g.fillStyle(0xff5ab8, 0.18);
    g.fillCircle(w / 2, 24, 50);
  }
};

/** 電線桿：橫擔、礙子、變壓器，兩邊垂下來的電線 */
const pole: Draw = (g, w, h, night) => {
  const c = dk(night);
  const cx = w / 2;
  g.lineStyle(2, c(0x2a2a2a), 1);
  for (const y of [34, 48]) {
    g.beginPath();
    g.moveTo(0, y + 14);
    g.lineTo(cx * 0.5, y + 6);
    g.lineTo(cx - 20, y);
    g.lineTo(cx + 20, y);
    g.lineTo(cx * 1.5, y + 6);
    g.lineTo(w, y + 14);
    g.strokePath();
  }
  g.fillStyle(c(0xa8a49a), 1);
  g.fillRect(cx - 6, 20, 12, h - 20);
  g.fillStyle(c(0x6a665c), 1);
  g.fillRect(cx - 24, 30, 48, 6);
  g.fillStyle(c(0xe8e4da), 1);
  for (const dx of [-20, 0, 16]) g.fillRect(cx + dx, 24, 4, 8);
  // 變壓器
  g.fillStyle(c(0x7a8a8a), 1);
  g.fillRect(cx + 6, 70, 18, 30);
  // 貼在桿子上的小廣告
  g.fillStyle(c(0xf4e2b0), 1);
  g.fillRect(cx - 6, h - 120, 12, 26);
  g.fillStyle(c(0xd8372d), 1);
  g.fillRect(cx - 6, h - 90, 12, 18);
  if (night) {
    // 路燈
    g.fillStyle(c(0x6a665c), 1);
    g.fillRect(cx, 110, 26, 4);
    g.fillStyle(LIT, 1);
    g.fillCircle(cx + 26, 116, 5);
    g.fillStyle(LIT, 0.16);
    g.fillCircle(cx + 26, 130, 28);
  }
};

/** 五營旗竿：石座、竹竿、東青南紅西白北黑中黃五面三角旗、一塊令牌 */
const flagpole: Draw = (g, _w, h, night) => {
  const c = dk(night, 0.55);
  const cx = 20;
  g.fillStyle(c(0x8a8478), 1);
  g.fillRect(cx - 14, h - 22, 28, 22);
  g.fillStyle(c(0x8a6a3a), 1);
  g.fillRect(cx - 3, 6, 6, h - 26);
  const cols = [0x2f8f5a, 0xc8372d, 0xe8e4da, 0x2a2a34, 0xe9b949];
  cols.forEach((col, k) => {
    const y = 10 + k * 26;
    g.fillStyle(c(col), 1);
    g.fillTriangle(cx + 3, y, cx + 3, y + 20, cx + 46, y + 10);
    g.lineStyle(1, c(0xe9b949), 1);
    g.strokeTriangle(cx + 3, y, cx + 3, y + 20, cx + 46, y + 10);
  });
  // 令牌
  g.fillStyle(c(0xe9c13a), 1);
  g.fillRect(cx - 9, 150, 18, 34);
  g.fillStyle(c(0x8a1b14), 1);
  g.fillRect(cx - 5, 156, 10, 22);
};

/** 榕樹：大樹冠、氣根 */
const tree: Draw = (g, w, h, night) => {
  const c = dk(night, 0.75);
  g.fillStyle(c(0x6a4a2a), 1);
  g.fillRect(w / 2 - 12, h - 90, 24, 90);
  g.lineStyle(2, c(0x5a3a22), 1);
  for (let k = 0; k < 7; k++) g.lineBetween(w / 2 - 50 + k * 16, 90, w / 2 - 50 + k * 16 + 4, 150 + (k % 3) * 12);
  g.fillStyle(c(0x3a6a3a), 1);
  g.fillCircle(w / 2 - 40, 80, 46);
  g.fillCircle(w / 2 + 40, 84, 44);
  g.fillCircle(w / 2, 56, 56);
  g.fillStyle(c(0x4a7a42), 1);
  g.fillCircle(w / 2 - 14, 46, 34);
  g.fillCircle(w / 2 + 30, 66, 28);
};

/** 竹棚鴨寮：竹柱、黑色遮光網的斜屋頂、低圍欄，裡面幾隻鴨 */
const shed: Draw = (g, w, h, night) => {
  const c = dk(night);
  g.fillStyle(c(0x2a2a2e), 1);
  g.beginPath();
  g.moveTo(0, 60);
  g.lineTo(w, 30);
  g.lineTo(w, 50);
  g.lineTo(0, 80);
  g.closePath();
  g.fillPath();
  g.lineStyle(1, c(0x5a5a62), 0.8);
  for (let x = 0; x < w; x += 10) g.lineBetween(x, 60 - x * 30 / w, x, 80 - x * 30 / w);
  g.fillStyle(c(0x4a3a2a), 1);
  g.fillRect(0, 76, w, h - 76);
  g.fillStyle(c(0xb89a5a), 1);
  for (let x = 6; x < w; x += 46) g.fillRect(x, 70 - x * 30 / w, 7, h - 70 + x * 30 / w);
  // 低圍欄
  g.fillStyle(c(0xc8a86a), 1);
  g.fillRect(0, h - 40, w, 5);
  g.fillRect(0, h - 22, w, 5);
  // 裡面的鴨
  for (let k = 0; k < 6; k++) {
    const x = 30 + k * 40;
    const y = h - 48 + (k % 2) * 4;
    g.fillStyle(c(0xf4f2ea, 0.6), 1);
    g.fillEllipse(x, y, 22, 12);
    g.fillCircle(x + 9, y - 7, 5);
    g.fillStyle(c(0xe9a030, 0.6), 1);
    g.fillTriangle(x + 13, y - 8, x + 19, y - 6, x + 13, y - 5);
  }
  if (night) {
    g.fillStyle(LIT, 0.9);
    g.fillCircle(w / 2, 86, 5);
    g.fillStyle(LIT, 0.12);
    g.fillCircle(w / 2, 110, 50);
  }
};

/** 水塘：水面、反光、泥岸 */
const pond: Draw = (g, w, h, night) => {
  const c = dk(night);
  g.fillStyle(c(0x7a6a4a), 1);
  g.fillEllipse(w / 2, h - 34, w, 64);
  g.fillStyle(c(0x5a90a8), 1);
  g.fillEllipse(w / 2, h - 36, w - 24, 50);
  g.fillStyle(night ? 0xfff3c4 : 0xd0ecf4, night ? 0.25 : 0.8);
  for (let k = 0; k < 4; k++) g.fillRect(50 + k * 44, h - 48 + (k % 2) * 10, 30, 2);
  // 浮著的兩隻鴨
  for (const x of [80, 170]) {
    g.fillStyle(c(0xf4f2ea), 1);
    g.fillEllipse(x, h - 40, 18, 9);
    g.fillCircle(x + 7, h - 46, 4);
  }
};

/** 竹圍籬：交叉的竹片 */
const fence: Draw = (g, w, h, night) => {
  const c = dk(night);
  g.lineStyle(4, c(0xc8a86a), 1);
  for (let x = -h; x < w; x += 20) {
    g.lineBetween(x, h, x + h * 0.8, 20);
    g.lineBetween(x + h * 0.8, h, x, 20);
  }
  g.fillStyle(c(0x9a7a3a), 1);
  for (let x = 4; x < w; x += 48) g.fillRect(x, 12, 6, h - 12);
  g.fillRect(0, 24, w, 5);
  g.fillRect(0, h - 26, w, 5);
};

/** 飼料袋：疊起來的編織袋（白底藍紅條） */
const feed: Draw = (g, _w, h, night) => {
  const c = dk(night);
  const sack = (x: number, y: number) => {
    g.fillStyle(c(0xe8e4da), 1);
    g.fillRoundedRect(x, y, 46, 26, 6);
    g.fillStyle(c(0x2b5aa8), 1);
    g.fillRect(x + 4, y + 8, 38, 3);
    g.fillStyle(c(0xc8372d), 1);
    g.fillRect(x + 4, y + 15, 38, 3);
  };
  sack(6, h - 26);
  sack(56, h - 26);
  sack(30, h - 50);
};

/** 一群白鴨（路邊；第 3 階段做排成一列的動畫時用單隻的 x3_duck） */
const ducks: Draw = (g, _w, h, night) => {
  for (let k = 0; k < 7; k++) drawDuck(g, 20 + k * 30 + (k % 2) * 6, h - 8 - (k % 3) * 6, 1, night);
};

/** 一隻白鴨（面向右）：腳底在 (x, y) */
export function drawDuck(g: G, x: number, y: number, s: number, night: boolean): void {
  const c = dk(night, 0.6);
  g.fillStyle(c(0xe9a030), 1);
  g.fillRect(x - 3 * s, y - 5 * s, 2 * s, 5 * s);
  g.fillRect(x + 2 * s, y - 5 * s, 2 * s, 5 * s);
  g.fillStyle(c(0xf6f4ee), 1);
  g.fillEllipse(x, y - 11 * s, 24 * s, 14 * s);
  g.fillTriangle(x - 12 * s, y - 12 * s, x - 18 * s, y - 18 * s, x - 8 * s, y - 16 * s);
  g.fillCircle(x + 9 * s, y - 21 * s, 6 * s);
  g.fillRect(x + 6 * s, y - 21 * s, 6 * s, 10 * s);
  g.fillStyle(c(0xe9a030), 1);
  g.fillTriangle(x + 14 * s, y - 23 * s, x + 21 * s, y - 20 * s, x + 14 * s, y - 18 * s);
  g.fillStyle(0x111111, 1);
  g.fillCircle(x + 11 * s, y - 23 * s, 1.3 * s);
}

/** 蘆葦叢 */
const reeds: Draw = (g, _w, h, night) => {
  const c = dk(night, 0.72);
  for (let k = 0; k < 14; k++) {
    const x = 8 + k * 10 + ((k * 7) % 5);
    const top = 14 + ((k * 23) % 40);
    g.lineStyle(2, c(k % 2 ? 0x8a9a5a : 0x7a8a4a), 1);
    g.lineBetween(x, h, x + 6, top + 12);
    g.fillStyle(c(0xe8dcb8), 1);
    g.fillEllipse(x + 8, top + 4, 8, 22);
  }
};

/** 舊渡口的石階（往溪那邊下去）與一根繫船的木樁 */
const steps: Draw = (g, w, h, night) => {
  const c = dk(night);
  for (let k = 0; k < 5; k++) {
    g.fillStyle(c(k % 2 ? 0x9a968a : 0xa8a498), 1);
    g.fillRect(10 + k * 26, h - 20 - k * 16, w - 60 - k * 26, 20 + k * 16);
    g.fillStyle(c(0x6a8a5a), 0.7);
    g.fillRect(10 + k * 26, h - 22 - k * 16, 20, 4);
  }
  g.fillStyle(c(0x6a4a2a), 1);
  g.fillRect(w - 36, h - 76, 12, 76);
  g.lineStyle(3, c(0xc8b088), 1);
  g.lineBetween(w - 30, h - 60, w, h - 40);
};

/** 拉上岸的竹筏：一排竹管、繩子綁在木樁上 */
const raft: Draw = (g, w, h, night) => {
  const c = dk(night);
  g.fillStyle(c(0x6a4a2a), 1);
  g.fillRect(8, h - 60, 10, 60);
  g.fillStyle(c(0xb89a5a), 1);
  for (let k = 0; k < 6; k++) g.fillRoundedRect(36, h - 14 - k * 6, w - 50, 7, 3);
  g.fillStyle(c(0x8a6a3a), 1);
  g.fillRect(60, h - 50, 4, 40);
  g.fillRect(w - 50, h - 50, 4, 40);
  g.lineStyle(2, c(0xd8c8a0), 1);
  g.lineBetween(14, h - 48, 40, h - 30);
  // 竹篙
  g.lineStyle(4, c(0x9a7a3a), 1);
  g.lineBetween(50, h - 60, w - 10, h - 30);
};

/** 何伯的茶攤：布棚、竹竿、長桌、大茶壺、杯子、長凳 */
const teastall: Draw = (g, w, h, night) => {
  const c = dk(night);
  g.fillStyle(c(0x8a6a3a), 1);
  g.fillRect(16, 40, 5, h - 40);
  g.fillRect(w - 22, 40, 5, h - 40);
  // 布棚（藍白條）
  for (let k = 0; k < 8; k++) {
    g.fillStyle(c(k % 2 ? 0xf4f2ea : 0x3a6aa8), 1);
    g.fillRect(6 + k * ((w - 12) / 8), 26, (w - 12) / 8, 22);
  }
  g.fillStyle(c(0x2a4a7a), 1);
  g.fillRect(6, 22, w - 12, 6);
  // 長桌
  g.fillStyle(c(0x7a5a3a), 1);
  g.fillRect(40, h - 64, w - 80, 8);
  g.fillRect(48, h - 56, 6, 56);
  g.fillRect(w - 54, h - 56, 6, 56);
  // 大茶壺與杯子
  g.fillStyle(c(0xc8c8c0), 1);
  g.fillCircle(80, h - 80, 16);
  g.fillRect(92, h - 86, 14, 4);
  g.fillStyle(c(0x3a3a3a), 1);
  g.fillRect(74, h - 98, 12, 4);
  g.fillStyle(c(0xf4f2ea), 1);
  for (let k = 0; k < 5; k++) g.fillRect(120 + k * 16, h - 74, 9, 10);
  // 手寫的價目板（色塊）
  g.fillStyle(c(0xf4e8c8), 1);
  g.fillRect(w - 80, 56, 44, 56);
  g.fillStyle(c(0x2a2a2a), 1);
  for (let k = 0; k < 4; k++) g.fillRect(w - 72, 64 + k * 12, 28, 4);
  // 長凳
  g.fillStyle(c(0x9a7a4a), 1);
  g.fillRect(20, h - 24, w - 40, 6);
  g.fillRect(28, h - 18, 5, 18);
  g.fillRect(w - 34, h - 18, 5, 18);
  if (night) {
    g.fillStyle(LIT, 1);
    g.fillCircle(w / 2, 58, 6);
    g.fillStyle(LIT, 0.15);
    g.fillCircle(w / 2, 80, 60);
  }
};

const DRAW: Record<PlainArtKey, Draw> = {
  x3_plainFar: plainFar, x3_pondFar: pondFar, x3_riverFar: riverFar,
  x3_water: water, x3_levee: levee,
  x3_road: road, x3_dirt: dirt, x3_levroad: levroad,
  x3_house0: house(0), x3_house1: house(1), x3_house2: house(2), x3_house3: house(3),
  x3_shop: shop, x3_betel: betel, x3_pole: pole, x3_flagpole: flagpole, x3_tree: tree,
  x3_shed: shed, x3_pond: pond, x3_fence: fence, x3_feed: feed, x3_ducks: ducks,
  x3_reeds: reeds, x3_steps: steps, x3_raft: raft, x3_teastall: teastall,
};

/** 畫出三張背景用到的所有貼圖（白天＋夜版本） */
export function makeXinyingScenery(scene: Phaser.Scene): void {
  for (const key of Object.keys(PLAIN_ART) as PlainArtKey[]) {
    const [w, h] = PLAIN_ART[key];
    make(scene, key, w, h, (g) => DRAW[key](g, w, h, false));
    make(scene, `${key}N`, w, h, (g) => DRAW[key](g, w, h, true));
  }
  // 單隻白鴨（第 3 階段鴨子排成一列、最後一戰群鴨陣用）
  make(scene, 'x3_duck', 44, 36, (g, w, h) => drawDuck(g, w / 2 - 2, h - 2, 1.4, false));
}
