/**
 * 第四章（白砂墩）的【暫代美術】：BootScene 開場時畫好；畫師的圖（public/stage/st_*.webp）載到時，AssetScene 蓋掉同名的暫代。
 * 尺寸、檔名照 art/baishadunSpec.ts（和 docs/第四章_美術接點清單.md 同一份清單）。
 *
 *  - 四人小轎＋粉紅遮雨布：布幔拉開（去程）／放下（回程）、落地的轎、回宮的八人大轎。
 *    布幔拉開也只看得到轎裡暗暗的金框，不畫神像的臉（媽祖全章不露臉）。
 *  - 頭旗手、香擔、香燈腳六款、點心站、牽路仔。
 *  - 拱辰宮（過場用的廟）。
 */
import Phaser from 'phaser';
import { DARK, SKIN, make, person, type G, type PersonOpt } from './figures';
import { makeTemple } from './backdrop';
import { CH4_STAGE_ART, QIANLU_VISITOR, type Ch4StageKey } from './baishadunSpec';

const PINK = 0xf29ab8;
const PINK_DARK = 0xd0688e;
const GOLD = 0xe9b949;
const RED = 0xb3261e;
const WOOD = 0x5a2e14;

function stage(scene: Phaser.Scene, key: Ch4StageKey, draw: (g: G, w: number, h: number) => void): void {
  const [w, h] = CH4_STAGE_ART[key];
  make(scene, key, w, h, draw);
}

/** 一般人形放大 s 倍畫（演出時再縮回來） */
function big(g: G, w: number, h: number, s: number, o: PersonOpt): void {
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(w / 2, h - 6, w * 0.6, 12);
  g.save();
  g.scaleCanvas(s, s);
  person(g, w / s, h / s, o);
  g.restore();
}

/** 轎夫（站在 x，腳底 h） */
function bearer(g: G, x: number, h: number, s: number): void {
  g.fillStyle(DARK, 1);
  g.fillRect(x - 6 * s, h - 22 * s, 5 * s, 22 * s);
  g.fillRect(x + 1 * s, h - 22 * s, 5 * s, 22 * s);
  g.fillStyle(0xf4f0e6, 1);
  g.fillRect(x - 10 * s, h - 66 * s, 20 * s, 46 * s);
  g.fillStyle(RED, 1);
  g.fillRect(x - 10 * s, h - 44 * s, 20 * s, 4 * s);
  g.fillStyle(SKIN, 1);
  g.fillCircle(x, h - 76 * s, 10 * s);
  g.fillStyle(RED, 1);
  g.fillRect(x - 10 * s, h - 84 * s, 20 * s, 4 * s);
}

/**
 * 轎身＋粉紅遮雨布。open：布幔拉開（裡面暗暗的金框，不畫神像）；否則布幔放下。
 * (cx, base)：轎槓的中心；s：倍率
 */
function sedan(g: G, cx: number, base: number, s: number, open: boolean): void {
  const bw = 120 * s;
  const bh = 110 * s;
  const top = base - bh;
  // 轎身（木、金邊）
  g.fillStyle(0x8a3a1a, 1);
  g.fillRect(cx - bw / 2, top, bw, bh);
  g.fillStyle(GOLD, 1);
  g.fillRect(cx - bw / 2, top, bw, 6 * s);
  g.fillRect(cx - bw / 2, base - 8 * s, bw, 8 * s);
  // 正面：拉開是暗暗的轎內＋金框；放下是黃布幔
  const fx = cx - bw * 0.3;
  const fw = bw * 0.6;
  if (open) {
    g.fillStyle(0x2a1410, 1);
    g.fillRect(fx, top + 16 * s, fw, bh - 30 * s);
    g.lineStyle(3 * s, GOLD, 0.9);
    g.strokeRect(fx + 6 * s, top + 22 * s, fw - 12 * s, bh - 42 * s);
    // 拉到兩邊的布幔
    g.fillStyle(0xe8c040, 1);
    g.fillTriangle(fx, top + 16 * s, fx + 16 * s, top + 16 * s, fx, base - 14 * s);
    g.fillTriangle(fx + fw, top + 16 * s, fx + fw - 16 * s, top + 16 * s, fx + fw, base - 14 * s);
  } else {
    g.fillStyle(0xe8c040, 1);
    g.fillRect(fx, top + 16 * s, fw, bh - 30 * s);
    g.lineStyle(2 * s, 0xb08a20, 0.8);
    for (let i = 1; i < 4; i++) g.lineBetween(fx + (fw * i) / 4, top + 16 * s, fx + (fw * i) / 4, base - 14 * s);
  }
  // 粉紅遮雨布：蓋在轎頂、垂到兩側
  g.fillStyle(PINK, 1);
  g.beginPath();
  g.moveTo(cx - bw / 2 - 14 * s, top + 34 * s);
  g.lineTo(cx - bw / 2 + 8 * s, top - 26 * s);
  g.lineTo(cx + bw / 2 - 8 * s, top - 26 * s);
  g.lineTo(cx + bw / 2 + 14 * s, top + 34 * s);
  g.closePath();
  g.fillPath();
  g.fillStyle(PINK_DARK, 1);
  g.fillRect(cx - bw / 2 - 14 * s, top + 30 * s, 18 * s, 50 * s);
  g.fillRect(cx + bw / 2 - 4 * s, top + 30 * s, 18 * s, 50 * s);
  // 轎頂的小頂珠
  g.fillStyle(GOLD, 1);
  g.fillCircle(cx, top - 32 * s, 7 * s);
}

/** 扛轎的姿勢（第 3 輪）：行進、路口頓住（轎身前低後高）、轉進小路（略縮短，像轉了三分之二側）、過溪（腳邊水花） */
type CarryPose = 'walk' | 'pause' | 'turn' | 'ford';

/** 扛著的轎：n 個轎夫（4 或 8），轎槓。腳底貼下緣、水平置中（和畫師交稿同一個錨點） */
function carried(g: G, w: number, h: number, open: boolean, n: 4 | 8, pose: CarryPose = 'walk'): void {
  const s = 1.6;
  const cx = w / 2;
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, h - 6, w * 0.8, 14);
  g.save();
  // 轉彎：整組以下緣中點為準橫向縮成 0.8（腳底仍貼下緣、仍置中）
  if (pose === 'turn') {
    g.translateCanvas(cx, h);
    g.scaleCanvas(0.8, 1);
    g.translateCanvas(-cx, -h);
  }
  const xs = (n === 4 ? [-150, -80, 80, 150] : [-200, -150, -100, -50, 50, 100, 150, 200]).map((dx) => cx + dx * (n === 4 ? 1.4 : 1.15) * 0.75);
  for (const x of xs) bearer(g, x, h - 4, s);
  const pole = h - 4 - 66 * s;
  g.save();
  // 頓住：轎槓和轎身繞轎槓中點往前（右）壓低約 5 度；轉彎：前槓略高（兩槓不同步）
  const tilt = pose === 'pause' ? 0.09 : pose === 'turn' ? -0.04 : 0;
  if (tilt) {
    g.translateCanvas(cx, pole);
    g.rotateCanvas(tilt);
    g.translateCanvas(-cx, -pole);
  }
  g.fillStyle(WOOD, 1);
  g.fillRect(cx - w * 0.47, pole - 5 * s, w * 0.94, 8 * s);
  sedan(g, cx, pole - 4 * s, n === 8 ? 1.25 : 1.1, open);
  g.restore();
  g.restore();
  // 過溪：小腿／腳踝周圍的水花（不畫整條水面）
  if (pose === 'ford') {
    for (const x of xs) {
      g.fillStyle(0xbfe0f0, 0.75);
      g.fillEllipse(x, h - 10, 46, 14);
      g.fillStyle(0xf4fbff, 0.9);
      for (const [dx, dy, r] of [[-18, -22, 5], [-8, -32, 4], [10, -28, 5], [20, -18, 4], [0, -16, 6]]) g.fillCircle(x + dx, h + dy, r);
    }
  }
}

const TOUQI: PersonOpt = { robe: 0xf4f0e6, trim: RED, pants: DARK, hat: 'band', hatColor: RED, item: 'none', tall: 1.0, wide: 1.05 };
const XIANGDAN: PersonOpt = { robe: 0xf4f0e6, trim: GOLD, pants: DARK, hat: 'cap', hatColor: 0xf4f0e6, item: 'none', tall: 1.0, wide: 1.05 };
/** 香燈腳六款：老、少、男、女、推車、揹小孩 */
const PILGRIMS: PersonOpt[] = [
  { robe: 0xb8a888, trim: PINK, hat: 'straw', hatColor: 0xd8c088, item: 'incense', tall: 0.9 },
  { robe: 0x5a8ab8, trim: PINK, hat: 'cap', hatColor: 0xf4f0e6, item: 'flag', tall: 1.0 },
  { robe: 0x4a6a4a, trim: PINK, hat: 'straw', hatColor: 0xd8c088, item: 'incense', tall: 1.05, wide: 1.1 },
  { robe: 0xd86a8a, trim: 0xf4f0e6, hat: 'scarf', hatColor: 0xf29ab8, item: 'flag', tall: 0.95 },
  { robe: 0x8a6a4a, trim: PINK, hat: 'straw', hatColor: 0xd8c088, item: 'none', tall: 1.0 },
  { robe: 0x6a5a8a, trim: PINK, hat: 'scarf', hatColor: 0xf4f0e6, item: 'none', tall: 0.95 },
];

export function makeBaishadun(scene: Phaser.Scene): void {
  stage(scene, 'st_jiao4_carry', (g, w, h) => carried(g, w, h, true, 4));
  stage(scene, 'st_jiao4_carry_closed', (g, w, h) => carried(g, w, h, false, 4));
  stage(scene, 'st_jiao4_pause', (g, w, h) => carried(g, w, h, true, 4, 'pause'));
  stage(scene, 'st_jiao4_turn', (g, w, h) => carried(g, w, h, true, 4, 'turn'));
  stage(scene, 'st_jiao4_ford', (g, w, h) => carried(g, w, h, true, 4, 'ford'));
  stage(scene, 'st_jiao8_carry', (g, w, h) => carried(g, w, h, false, 8));
  stage(scene, 'st_jiao4', (g, w, h) => {
    // 停駕時落地的轎：轎槓擱在兩張板凳上
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(w / 2, h - 6, w * 0.8, 14);
    g.fillStyle(WOOD, 1);
    for (const dx of [-140, 140]) {
      g.fillRect(w / 2 + dx - 30, h - 70, 60, 10);
      g.fillRect(w / 2 + dx - 26, h - 62, 8, 58);
      g.fillRect(w / 2 + dx + 18, h - 62, 8, 58);
    }
    g.fillRect(w * 0.04, h - 82, w * 0.92, 12);
    sedan(g, w / 2, h - 82, 1.3, true);
  });
  stage(scene, 'st_touqi', (g, w, h) => {
    big(g, w, h, 2.2, TOUQI);
    // 頭旗：長竿、紅底黃邊三角旗
    g.fillStyle(WOOD, 1);
    g.fillRect(w / 2 + 34, 20, 8, h - 60);
    g.fillStyle(RED, 1);
    g.fillTriangle(w / 2 + 42, 24, w - 6, 70, w / 2 + 42, 150);
    g.lineStyle(4, GOLD, 1);
    g.strokeTriangle(w / 2 + 42, 24, w - 6, 70, w / 2 + 42, 150);
  });
  stage(scene, 'st_xiangdan', (g, w, h) => {
    big(g, w, h, 2.2, XIANGDAN);
    // 香擔：扁擔兩頭的木箱（不可碰）
    g.fillStyle(WOOD, 1);
    g.fillRect(8, h - 300, w - 16, 8);
    for (const x of [10, w - 70]) {
      g.fillStyle(0x8a3a1a, 1);
      g.fillRect(x, h - 290, 60, 70);
      g.fillStyle(GOLD, 1);
      g.fillRect(x, h - 290, 60, 6);
      g.fillStyle(RED, 1);
      g.fillRect(x + 22, h - 280, 16, 50);
    }
  });
  (['a', 'b', 'c', 'd', 'e', 'f'] as const).forEach((t, i) => {
    stage(scene, `st_xiangdeng_${t}`, (g, w, h) => {
      big(g, w, h, 2.1, PILGRIMS[i]);
      if (t === 'e') {
        // 推車
        g.fillStyle(0x6a6a72, 1);
        g.fillRect(w / 2 + 20, h - 110, 90, 50);
        g.fillStyle(DARK, 1);
        g.fillCircle(w / 2 + 40, h - 50, 14);
        g.fillCircle(w / 2 + 96, h - 50, 14);
      }
      if (t === 'f') {
        // 揹小孩
        g.fillStyle(SKIN, 1);
        g.fillCircle(w / 2 - 30, h - 330, 16);
        g.fillStyle(PINK, 1);
        g.fillRect(w / 2 - 44, h - 316, 28, 40);
      }
    });
  });
  stage(scene, 'st_dianxin', (g, w, h) => {
    // 點心站：棚子、桌子、大鍋
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(w / 2, h - 6, w * 0.8, 14);
    g.fillStyle(0x6a6a72, 1);
    g.fillRect(30, 60, 8, h - 70);
    g.fillRect(w - 38, 60, 8, h - 70);
    g.fillStyle(0x3a7ac8, 1);
    g.fillRect(14, 40, w - 28, 40);
    g.fillStyle(0xf4f0e6, 1);
    for (let x = 14; x < w - 28; x += 40) g.fillRect(x, 40, 20, 40);
    g.fillStyle(0xd8c8a8, 1);
    g.fillRect(50, h - 140, w - 100, 14);
    g.fillStyle(WOOD, 1);
    g.fillRect(60, h - 126, 10, 120);
    g.fillRect(w - 70, h - 126, 10, 120);
    g.fillStyle(0x9aa0a8, 1);
    g.fillEllipse(w / 2, h - 160, 110, 50);
    g.fillStyle(0xf4f0e6, 0.6);
    for (const dx of [-20, 0, 20]) g.fillEllipse(w / 2 + dx, h - 200 - Math.abs(dx), 14, 30);
  });
  stage(scene, 'st_qianlu', (g, w, h) => qianlu(g, w, h, 2.4));
  // 白天路上走近的牽路仔（和其他章小妖一樣大）
  make(scene, 'qianlu', QIANLU_VISITOR[0], QIANLU_VISITOR[1], (g, w, h) => qianlu(g, w, h, 1));
  makeTemple(scene, 'temple_gongchen', '拱辰宮');
}

/** 牽路仔：路邊招手的灰色人影（半透明、手舉起來） */
function qianlu(g: G, w: number, h: number, s: number): void {
  const cx = w / 2;
  g.fillStyle(0x6a6a7a, 0.75);
  g.fillEllipse(cx, h - 50 * s, 36 * s, 90 * s);
  g.fillCircle(cx, h - 104 * s, 13 * s);
  // 招手
  g.fillRect(cx + 12 * s, h - 110 * s, 6 * s, 30 * s);
  g.fillCircle(cx + 15 * s, h - 112 * s, 6 * s);
  // 眼睛
  g.fillStyle(0xffe08a, 0.9);
  g.fillCircle(cx - 4 * s, h - 106 * s, 2 * s);
  g.fillCircle(cx + 5 * s, h - 106 * s, 2 * s);
}
