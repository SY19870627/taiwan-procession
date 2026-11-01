/**
 * 引擎內演出的【暫代美術】（docs/第一二章_熱鬧化計畫.md §5）：BootScene 開場時畫好。
 *
 *  - 新說話者的小人（文字版過場、夜審沒有立繪時用）：wupan 武判官、xunbu 巡捕、jiaoban 轎班。
 *  - B 組演出小人 st_*：畫 2 倍大（尺寸照 art/stageSpec.ts），演出時再縮小，線條細一點。
 *    畫師的圖（public/stage/st_*.webp）載到時，AssetScene 會蓋掉同名的暫代。
 *  - 石駒站／跪／回頭：比最後一戰的 shiju 細緻，只給演出用（戰鬥畫面仍用原本的 shiju，不換）。
 */
import Phaser from 'phaser';
import { drawPalanquin, make, person, type G, type PersonOpt } from './figures';
import { ship } from './harbor';
import { STAGE_SIZES } from './stageSpec';

/** 用 STAGE_SIZES 的尺寸畫一張演出貼圖 */
function stage(scene: Phaser.Scene, key: string, draw: (g: G, w: number, h: number) => void): void {
  const [w, h] = STAGE_SIZES[key];
  make(scene, key, w, h, draw);
}

/** 用一般人形放大 s 倍畫（線條、色塊都跟著放大，演出時再縮回來） */
function big(g: G, w: number, h: number, s: number, o: PersonOpt): void {
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(w / 2, h - 6, w * 0.6, 12);
  g.save();
  g.scaleCanvas(s, s);
  person(g, w / s, h / s, o);
  g.restore();
}

/** 大刀（武判官）：刀柄在 (x, y)，往上斜 */
function blade(g: G, x: number, y: number, len: number, s = 1): void {
  g.fillStyle(0x6b3b1f, 1);
  g.fillRect(x - 1.5 * s, y - len, 3 * s, len);
  g.fillStyle(0xd8dce4, 1);
  g.beginPath();
  g.moveTo(x + 1.5 * s, y - len);
  g.lineTo(x + 14 * s, y - len + 6 * s);
  g.lineTo(x + 12 * s, y - len + 30 * s);
  g.lineTo(x + 1.5 * s, y - len + 22 * s);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xc8372d, 1);
  g.fillCircle(x, y - len + 24 * s, 3 * s);
}

const WUPAN: PersonOpt = { robe: 0x7a2a1a, trim: 0xe9b949, paint: [0x2b2b30, 0x2b2b30], hat: 'flat', hatColor: 0x111111, item: 'none', tall: 1.1, wide: 1.2 };
const XUNBU: PersonOpt = { robe: 0x4a5a7a, trim: 0xd8c8a8, hat: 'cap', hatColor: 0x2a2a3a, item: 'chain', tall: 1.0, wide: 1.05 };
const JIAOBAN: PersonOpt = { robe: 0x3a8a5a, trim: 0xc8372d, pants: 0x2a2a30, tall: 0.95, wide: 1.1, hat: 'band', hatColor: 0xc8372d, item: 'none' };

export function makeStageArt(scene: Phaser.Scene): void {
  // ---- 新說話者（和陣頭小人同一個大小） ----
  make(scene, 'wupan', 100, 140, (g, w, h) => {
    person(g, w, h, WUPAN);
    blade(g, w / 2 + 14, h - 40, 84);
  });
  make(scene, 'xunbu', 100, 140, (g, w, h) => person(g, w, h, XUNBU));
  make(scene, 'jiaoban', 80, 120, (g, w, h) => person(g, w, h, JIAOBAN));

  // ---- B 組：演出用全身小人（2 倍大） ----
  stage(scene, 'st_wenpan', (g, w, h) => big(g, w, h, 3.4, { robe: 0x2b3a5a, trim: 0xe9b949, paint: [0xb3261e, 0xb3261e], hat: 'flat', hatColor: 0x111111, item: 'brush', tall: 1.1, wide: 1.15 }));
  stage(scene, 'st_wupan', (g, w, h) => {
    big(g, w, h, 3.4, WUPAN);
    blade(g, w / 2 + 48, h - 130, 280, 3);
  });
  stage(scene, 'st_baoma', (g, w, h) => {
    big(g, w, h, 3.4, { robe: 0x3c5a7a, trim: 0xd9c08a, tall: 0.9, hat: 'cap', hatColor: 0xc9a25a, item: 'gong' });
  });
  stage(scene, 'st_zhongjun', (g, w, h) => big(g, w, h, 3.4, { robe: 0xf0ece0, trim: 0x2a3a6a, paint: [0xd8c8a8, 0xd8c8a8], hat: 'flat', hatColor: 0x111111, item: 'token', tall: 1.1, wide: 1.15 }));
  stage(scene, 'st_xunbu', (g, w, h) => big(g, w, h, 3.4, XUNBU));

  for (const calm of [false, true]) stage(scene, calm ? 'st_shiju_calm' : 'st_shiju', (g, w, h) => shiju(g, w, h, 'stand', calm));
  stage(scene, 'st_shiju_kneel', (g, w, h) => shiju(g, w, h, 'kneel', true));
  stage(scene, 'st_shiju_look', (g, w, h) => shiju(g, w, h, 'look', true));

  stage(scene, 'st_heichao_figures', heichaoFigures);
  for (const fire of [false, true]) {
    stage(scene, fire ? 'st_wangchuan_fire' : 'st_wangchuan', (g, w, h) => {
      const s = h / 280;
      if (fire) {
        for (let i = 5; i > 0; i--) {
          g.fillStyle(0xff8a3a, 0.05 * i);
          g.fillEllipse(w / 2, h * 0.45, w * (0.5 + i * 0.09), h * (0.5 + i * 0.08));
        }
      }
      g.save();
      g.translateCanvas((w - 360 * s) / 2, 0);
      g.scaleCanvas(s, s);
      ship(g, 360, 280, false);
      g.restore();
      if (fire) flames(g, w, h);
    });
  }
  stage(scene, 'st_jiao_qingling', (g, w, h) => {
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(w / 2, h - 6, w * 0.9, 14);
    g.save();
    g.scaleCanvas(2, 2);
    drawPalanquin(g, w / 2, h / 2, { shirt: 0x2a2a34, body: 0x3a2a4a, roof: 0x2f5a4a, sash: 0xe9b949 });
    // 暗訪：轎簾放下來
    const cx = w / 4;
    const by = h / 2;
    g.fillStyle(0x1a1420, 0.92);
    g.fillRect(cx - 26, by - 116, 52, 42);
    g.lineStyle(1, 0xe9b949, 0.8);
    for (let x = cx - 22; x < cx + 26; x += 8) g.lineBetween(x, by - 116, x, by - 74);
    g.restore();
  });
}

/** 王船燒起來：船身上方一排火舌 */
function flames(g: G, w: number, h: number): void {
  const base = h * 0.78;
  for (let i = 0; i < 14; i++) {
    const x = w * 0.16 + (i / 13) * w * 0.68;
    const tall = 90 + ((i * 53) % 7) * 22;
    g.fillStyle(0xd8371d, 0.85);
    g.fillTriangle(x - 28, base, x + 28, base, x + ((i % 3) - 1) * 10, base - tall);
    g.fillStyle(0xffb03a, 0.9);
    g.fillTriangle(x - 16, base, x + 16, base, x + ((i % 3) - 1) * 6, base - tall * 0.65);
    g.fillStyle(0xfff0b0, 0.9);
    g.fillTriangle(x - 7, base, x + 7, base, x, base - tall * 0.35);
  }
}

/** 黑潮・人形：浪裡五個人影（送王時朝岸上揮手） */
function heichaoFigures(g: G, w: number, h: number): void {
  // 浪
  const top = (x: number) => h - 120 - Math.sin(x / 40) * 12 - Math.sin(x / 17) * 5;
  // 五個人影（半透明，站在浪裡）
  const xs = [0.18, 0.34, 0.5, 0.66, 0.82];
  xs.forEach((fx, i) => {
    const x = w * fx;
    const tall = 250 + ((i * 37) % 3) * 30;
    const y0 = h - 110;
    g.fillStyle(0x8aa0c0, 0.55);
    g.fillRoundedRect(x - 26, y0 - tall + 60, 52, tall - 60, 18);
    g.fillCircle(x, y0 - tall + 36, 28);
    // 揮手（中間那個舉得最高）
    g.lineStyle(10, 0x8aa0c0, 0.55);
    const up = i === 2 ? 70 : 40;
    g.lineBetween(x + 22, y0 - tall + 80, x + 46, y0 - tall + 80 - up);
    g.fillStyle(0xcfe0f0, 0.35);
    g.fillCircle(x, y0 - tall + 36, 16);
  });
  g.fillStyle(0x1a2a4a, 1);
  g.beginPath();
  g.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) g.lineTo(x, top(x));
  g.lineTo(w, h);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xcfe0f0, 0.8);
  for (let x = 12; x < w; x += 20) g.fillCircle(x, top(x) + 3, 4);
  g.lineStyle(2, 0x6a8ab8, 0.7);
  for (let y = h - 90; y < h; y += 24) for (let x = (y % 48) * 1.5; x < w; x += 70) g.lineBetween(x, y, x + 34, y);
}

/**
 * 石駒（演出用、細緻版）。以 260 寬的座標畫、放大 2 倍。
 * stand 站著（煞氣／喚回）、kneel 跪下（喚回）、look 送回山中時回頭看一眼。
 */
function shiju(g: G, w: number, h: number, pose: 'stand' | 'kneel' | 'look', calm: boolean): void {
  const s = w / 260;
  const H0 = h / s;
  const stone = calm ? 0x9a948a : 0x6f6a72;
  const dark = calm ? 0x6f6a62 : 0x4a4550;
  const light = calm ? 0xb8b2a6 : 0x8a8590;
  const glow = calm ? 0xe9b949 : 0x9b3cff;
  const line = calm ? 0x4a4640 : 0x2a2430;
  g.save();
  g.scaleCanvas(s, s);
  const y = (v: number) => H0 - v;
  // 光暈（煞氣紫、喚回金）
  for (let i = 4; i > 0; i--) {
    g.fillStyle(glow, (calm ? 0.04 : 0.07) * i);
    g.fillEllipse(130, y(pose === 'kneel' ? 70 : 96), 150 + i * 24, 110 + i * 16);
  }
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(130, y(3), 210, 10);

  const leg = (x: number, top: number, c: number) => {
    g.fillStyle(c, 1);
    g.beginPath();
    g.moveTo(x - 10, y(top));
    g.lineTo(x + 10, y(top));
    g.lineTo(x + 6, y(top - 34));
    g.lineTo(x + 5, y(12));
    g.lineTo(x - 4, y(12));
    g.lineTo(x - 6, y(top - 34));
    g.closePath();
    g.fillPath();
    g.fillStyle(line, 1);
    g.fillRoundedRect(x - 7, y(13), 14, 11, 2);
    g.lineStyle(0.8, line, 0.8);
    g.lineBetween(x - 6, y(top - 34), x + 6, y(top - 34));
  };

  if (pose === 'kneel') {
    // 後腿收在身體下面、前腿折起來
    g.fillStyle(dark, 1);
    g.fillEllipse(70, y(40), 74, 52);
    g.fillRoundedRect(28, y(16), 46, 12, 5);
    g.fillRoundedRect(150, y(20), 56, 14, 6);
    g.fillStyle(stone, 1);
    g.fillEllipse(124, y(56), 156, 62);
    g.fillEllipse(176, y(62), 52, 54);
    g.fillEllipse(72, y(62), 62, 56);
    g.fillRoundedRect(164, y(26), 50, 13, 6);
    // 頭低下來（朝右下）
    g.beginPath();
    g.moveTo(166, y(82));
    g.lineTo(188, y(118));
    g.lineTo(206, y(110));
    g.lineTo(196, y(66));
    g.closePath();
    g.fillPath();
    g.beginPath();
    g.moveTo(186, y(122));
    g.lineTo(206, y(126));
    g.lineTo(230, y(98));
    g.lineTo(228, y(86));
    g.lineTo(214, y(88));
    g.lineTo(196, y(104));
    g.closePath();
    g.fillPath();
    g.fillStyle(dark, 1);
    g.fillTriangle(192, y(124), 196, y(140), 202, y(124));
    for (let i = 0; i < 5; i++) g.fillTriangle(168 + i * 4, y(86 + i * 7), 176 + i * 4, y(88 + i * 7), 162 + i * 4, y(96 + i * 7));
    // 尾巴垂在地上
    g.fillTriangle(42, y(70), 52, y(64), 22, y(18));
    g.fillStyle(line, 1);
    g.fillCircle(212, y(110), 2);
  } else {
    // 遠側的腳（暗一點）
    leg(80, 80, dark);
    leg(178, 80, dark);
    // 身體
    g.fillStyle(stone, 1);
    g.fillEllipse(124, y(98), 152, 66);
    g.fillEllipse(178, y(100), 52, 58);
    g.fillEllipse(72, y(102), 62, 58);
    // 近側的腳
    leg(64, 84, stone);
    leg(164, 84, stone);
    // 尾巴
    g.fillStyle(dark, 1);
    g.beginPath();
    g.moveTo(44, y(120));
    g.lineTo(54, y(112));
    g.lineTo(40, y(78));
    g.lineTo(30, y(52));
    g.lineTo(24, y(60));
    g.lineTo(32, y(92));
    g.closePath();
    g.fillPath();
    g.fillStyle(stone, 1);
    if (pose === 'stand') {
      // 脖子與頭（朝右）
      g.beginPath();
      g.moveTo(164, y(120));
      g.lineTo(186, y(172));
      g.lineTo(208, y(166));
      g.lineTo(202, y(104));
      g.closePath();
      g.fillPath();
      g.beginPath();
      g.moveTo(184, y(176));
      g.lineTo(204, y(188));
      g.lineTo(238, y(162));
      g.lineTo(240, y(150));
      g.lineTo(226, y(146));
      g.lineTo(204, y(154));
      g.closePath();
      g.fillPath();
      g.fillStyle(dark, 1);
      g.fillTriangle(192, y(182), 198, y(200), 204, y(184));
      for (let i = 0; i < 6; i++) g.fillTriangle(166 + i * 4, y(124 + i * 9), 176 + i * 4, y(126 + i * 9), 160 + i * 4, y(136 + i * 9));
      g.fillStyle(calm ? line : 0xff4fd8, 1);
      g.fillCircle(222, y(164), 2.6);
      g.fillStyle(line, 1);
      g.fillCircle(236, y(154), 1.4);
    } else {
      // 回頭：身體朝右走，脖子往上彎、頭朝左看回來
      g.beginPath();
      g.moveTo(160, y(120));
      g.lineTo(150, y(176));
      g.lineTo(174, y(182));
      g.lineTo(200, y(108));
      g.closePath();
      g.fillPath();
      g.beginPath();
      g.moveTo(170, y(186));
      g.lineTo(152, y(194));
      g.lineTo(116, y(172));
      g.lineTo(114, y(160));
      g.lineTo(128, y(156));
      g.lineTo(156, y(166));
      g.closePath();
      g.fillPath();
      g.fillStyle(dark, 1);
      g.fillTriangle(160, y(190), 166, y(206), 170, y(188));
      for (let i = 0; i < 6; i++) g.fillTriangle(176 - i * 3, y(126 + i * 9), 184 - i * 3, y(124 + i * 9), 182 - i * 3, y(136 + i * 9));
      g.fillStyle(line, 1);
      g.fillCircle(130, y(170), 2.4);
    }
  }
  // 石頭的斑點（固定位置，每次畫都一樣）
  g.fillStyle(light, 0.6);
  const by = pose === 'kneel' ? 56 : 98;
  for (let i = 0; i < 26; i++) {
    const a = (i * 2.399) % (Math.PI * 2);
    const r = 0.25 + ((i * 0.37) % 0.7);
    g.fillCircle(124 + Math.cos(a) * 66 * r, y(by) + Math.sin(a) * 26 * r, 1.2 + (i % 3) * 0.5);
  }
  // 裂縫（細線）
  g.lineStyle(1, calm ? line : glow, calm ? 0.9 : 1);
  const crack = (pts: [number, number][]) => {
    g.beginPath();
    g.moveTo(pts[0][0], y(pts[0][1]));
    for (const [px, py] of pts.slice(1)) g.lineTo(px, y(py));
    g.strokePath();
  };
  const dy = pose === 'kneel' ? -42 : 0;
  crack([[84, 120 + dy], [94, 104 + dy], [88, 92 + dy], [102, 80 + dy]]);
  crack([[134, 124 + dy], [128, 110 + dy], [138, 98 + dy]]);
  crack([[150, 116 + dy], [158, 104 + dy]]);
  // 肚子上的舊傷（鑿洞）
  g.fillStyle(0x1a1420, 1);
  g.fillEllipse(124, y(pose === 'kneel' ? 34 : 70), 24, 9);
  if (!calm) {
    g.fillStyle(glow, 0.85);
    g.fillEllipse(124, y(70), 12, 4);
  }
  // 喚回後：頸上一條紅布（廟裡的石馬）
  if (calm) {
    g.fillStyle(0xc8372d, 1);
    if (pose === 'kneel') g.fillRect(176, y(84), 22, 6);
    else if (pose === 'stand') g.fillRect(170, y(126), 30, 6);
    else g.fillRect(162, y(128), 30, 6);
  }
  g.restore();
}
