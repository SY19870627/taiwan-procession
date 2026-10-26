/**
 * 第二章「東津・迎王」的美術：全部用程式畫。
 * 轎班（各千歲的轎衫顏色不同）、王令旗、中軍府、鹽米隊、王船、黑潮、觸手、浪、小疫鬼、海煞、
 * 四個鬼、五位信徒與路人；漁港街屋、海、碼頭、沙灘、代天府。
 * （取材：東港迎王的轎班以轎衫顏色區分所屬千歲；中軍府為白色。）
 */
import Phaser from 'phaser';
import { DARK, SKIN, drawPalanquin, make, person, type G } from './figures';
import { FONT, FIELD_H, GROUND_Y, lerpColor } from '../theme';
import { makeTemple } from './backdrop';

/** 轎衫顏色：中軍府白、大千歲黃、三千歲黑、雲府（主神）深藍、七境頭轎班綠 */
const SHIRTS: Record<string, [number, number, number]> = {
  white: [0xf4f2ea, 0xe8e2d0, 0x9a9a9a],
  yellow: [0xe9c13a, 0x8a1b14, 0xb3261e],
  black: [0x2a2a30, 0x3a1a1a, 0x22232b],
  blue: [0x24408a, 0x1f3a6a, 0x2b5aa8],
  green: [0x3a8a5a, 0x2f5a3a, 0x2f8f5a],
};

/** 小轎（戰鬥用）：兩個轎班扛一頂小轎 */
function smallPalanquin(g: G, w: number, h: number, shirt: number, body: number, roof: number): void {
  const cx = w / 2;
  for (const dx of [-30, 30]) {
    g.fillStyle(DARK, 1);
    g.fillRect(cx + dx - 6, h - 18, 5, 16);
    g.fillRect(cx + dx + 1, h - 18, 5, 16);
    g.fillStyle(shirt, 1);
    g.fillRect(cx + dx - 10, h - 60, 20, 44);
    g.fillStyle(0xc8372d, 1);
    g.fillRect(cx + dx - 10, h - 40, 20, 4);
    g.fillStyle(SKIN, 1);
    g.fillCircle(cx + dx, h - 68, 9);
    g.fillStyle(0xc8372d, 1);
    g.fillRect(cx + dx - 9, h - 76, 18, 4);
  }
  g.fillStyle(0x5a2e14, 1);
  g.fillRect(cx - 58, h - 64, 116, 6);
  g.fillStyle(body, 1);
  g.fillRect(cx - 24, h - 112, 48, 50);
  g.fillStyle(0xe9b949, 1);
  g.fillRect(cx - 24, h - 112, 48, 5);
  g.fillRect(cx - 24, h - 67, 48, 5);
  g.fillStyle(0xffd76a, 0.9);
  g.fillCircle(cx, h - 88, 9);
  g.fillStyle(roof, 1);
  g.fillTriangle(cx - 38, h - 110, cx + 38, h - 110, cx, h - 134);
  g.fillStyle(0xe9b949, 1);
  g.fillCircle(cx, h - 138, 5);
}

/** 王船：紅黑船身、龍目、三桅、帆與旗 */
function ship(g: G, w: number, h: number, wheels: boolean): void {
  const base = h - (wheels ? 34 : 14);
  // 帆柱與帆
  const masts = [w * 0.32, w * 0.52, w * 0.72];
  masts.forEach((mx, i) => {
    const top = base - 150 - (i === 1 ? 40 : 0);
    g.fillStyle(0x5a3a1a, 1);
    g.fillRect(mx - 3, top, 6, base - top - 40);
    g.fillStyle(0xf0e2c0, 1);
    g.fillRect(mx - 34, top + 16, 68, 70 + (i === 1 ? 20 : 0));
    g.lineStyle(2, 0xa3261c, 1);
    for (let k = 1; k < 4; k++) g.lineBetween(mx - 34, top + 16 + k * 22, mx + 34, top + 16 + k * 22);
    // 旗
    g.fillStyle([0xe9c13a, 0xd23a2a, 0x2f8f5a][i], 1);
    g.fillTriangle(mx + 3, top, mx + 3, top + 16, mx + 26, top + 8);
  });
  // 船身
  g.fillStyle(0x1a1a1a, 1);
  g.beginPath();
  g.moveTo(w * 0.04, base - 70);
  g.lineTo(w * 0.96, base - 84);
  g.lineTo(w * 0.86, base - 6);
  g.lineTo(w * 0.14, base - 6);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xb3261e, 1);
  g.beginPath();
  g.moveTo(w * 0.06, base - 66);
  g.lineTo(w * 0.94, base - 80);
  g.lineTo(w * 0.9, base - 50);
  g.lineTo(w * 0.1, base - 38);
  g.closePath();
  g.fillPath();
  // 金色彩帶與波浪紋
  g.fillStyle(0xe9b949, 1);
  g.fillRect(w * 0.12, base - 36, w * 0.76, 5);
  g.lineStyle(2, 0x2f8f5a, 1);
  for (let x = w * 0.18; x < w * 0.82; x += 22) g.strokeCircle(x, base - 22, 6);
  // 龍目（船頭在右）
  g.fillStyle(0xffffff, 1);
  g.fillCircle(w * 0.86, base - 62, 10);
  g.fillStyle(0x111111, 1);
  g.fillCircle(w * 0.865, base - 62, 5);
  // 船尾的樓
  g.fillStyle(0x8a1b14, 1);
  g.fillRect(w * 0.06, base - 108, w * 0.14, 40);
  g.fillStyle(0xe9b949, 1);
  g.fillRect(w * 0.06, base - 112, w * 0.14, 6);
  if (wheels) {
    g.fillStyle(0x3a2a1a, 1);
    g.fillRect(w * 0.1, h - 36, w * 0.8, 8);
    for (const x of [0.2, 0.42, 0.62, 0.82]) {
      g.fillStyle(0x2a2a2a, 1);
      g.fillCircle(w * x, h - 16, 14);
      g.fillStyle(0x6a6a6a, 1);
      g.fillCircle(w * x, h - 16, 5);
    }
  }
}

/** 黑潮：一團黑色的海水，裡面浮著人的臉 */
function tide(g: G, w: number, h: number, calm: boolean): void {
  const body = calm ? 0x2a3a5a : 0x0c0e22;
  const rim = calm ? 0x6a8ab8 : 0x3a2a7a;
  g.fillStyle(rim, calm ? 0.25 : 0.3);
  g.fillEllipse(w / 2, h - 120, w - 20, 240);
  // 一團隆起的海水：兩邊低、中間高，浪頭往左捲
  const top = (x: number) => h - Math.sin((Math.PI * x) / w) * (h - 40) - Math.sin(x / 13) * 8;
  g.fillStyle(body, 1);
  g.beginPath();
  g.moveTo(0, h);
  for (let x = 0; x <= w; x += 10) g.lineTo(x, top(x));
  g.lineTo(w, h);
  g.closePath();
  g.fillPath();
  // 浪尖的白沫
  g.fillStyle(calm ? 0xcfe0f0 : 0x6a6a9a, 0.8);
  for (let x = 40; x < w - 40; x += 22) g.fillCircle(x, top(x) + 4, 5);
  // 五張臉
  const faces: [number, number][] = [[0.32, 0.56], [0.5, 0.36], [0.68, 0.56], [0.42, 0.76], [0.6, 0.78]];
  for (const [fx, fy] of faces) {
    const x = w * fx;
    const y = h * fy;
    g.fillStyle(calm ? 0x8aa0c0 : 0x2a2a4a, 1);
    g.fillEllipse(x, y, 34, 42);
    g.fillStyle(calm ? 0x2a3a5a : 0x9a8aff, 1);
    if (calm) {
      // 閉著眼
      g.fillRect(x - 10, y - 4, 7, 2);
      g.fillRect(x + 3, y - 4, 7, 2);
    } else {
      g.fillCircle(x - 7, y - 4, 3);
      g.fillCircle(x + 7, y - 4, 3);
    }
    g.fillStyle(0x05040c, 1);
    g.fillEllipse(x, y + 10, calm ? 6 : 10, calm ? 3 : 8);
  }
}

function makeHarborFigures(scene: Phaser.Scene): void {
  // 大轎（白天的隊伍）
  for (const [k, [shirt, body, roof]] of Object.entries(SHIRTS)) {
    make(scene, `jb_${k}`, 200, 190, (g, w, h) => drawPalanquin(g, w, h, { shirt, body, roof, sash: k === 'white' ? 0x2a2a30 : undefined }));
    make(scene, `jbu_${k}`, 130, 150, (g, w, h) => smallPalanquin(g, w, h, shirt, body, roof));
  }
  // 王令旗：一面黃色的大旗，紅邊，中間一個「令」
  make(scene, 'wlflag', 110, 200, (g, w, h) => {
    person(g, w, h, { robe: 0xf4f2ea, trim: 0x2a2a30, hat: 'band', hatColor: 0xc8372d, item: 'flag' });
    const px = w / 2 + 13.5;
    g.fillStyle(0x6b3b1f, 1);
    g.fillRect(px - 1.5, 6, 3, h - 70);
    g.fillStyle(0xe9c13a, 1);
    g.fillRect(px + 2, 12, 46, 70);
    g.lineStyle(4, 0xb3261e, 1);
    g.strokeRect(px + 4, 14, 42, 66);
    g.fillStyle(0xb3261e, 1);
    g.fillRect(px + 22, 26, 6, 40);
    g.fillRect(px + 12, 30, 26, 5);
    g.fillRect(px + 14, 52, 22, 5);
  });
  // 中軍府：白袍、黑紗帽、令牌
  make(scene, 'zhongjun', 100, 140, (g, w, h) => {
    person(g, w, h, { robe: 0xf0ece0, trim: 0x2a3a6a, paint: [0xd8c8a8, 0xd8c8a8], hat: 'flat', hatColor: 0x111111, item: 'token', tall: 1.1, wide: 1.15 });
  });
  // 鹽米隊：提著鹽米籃
  make(scene, 'yanmi', 80, 110, (g, w, h) => person(g, w, h, { robe: 0x3a5a7a, trim: 0xe9b949, tall: 0.9, hat: 'band', hatColor: 0xc8372d, item: 'basket' }));
  make(scene, 'yanmi2', 80, 110, (g, w, h) => person(g, w, h, { robe: 0x7a4a2a, trim: 0xe9b949, tall: 0.86, hat: 'scarf', hatColor: 0xe9c13a, item: 'basket' }));
  // 小琉嶼護航船：一艘插滿旗的小漁船
  make(scene, 'liuyu', 150, 130, (g, w, h) => {
    g.fillStyle(0x4a8ad0, 0.3);
    g.fillEllipse(w / 2, h - 10, w - 10, 20);
    g.fillStyle(0x2b5aa8, 1);
    g.beginPath();
    g.moveTo(8, h - 46);
    g.lineTo(w - 6, h - 52);
    g.lineTo(w - 24, h - 14);
    g.lineTo(22, h - 14);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xf4f2ea, 1);
    g.fillRect(24, h - 44, w - 54, 6);
    g.fillStyle(0xe8e2d0, 1);
    g.fillRect(w * 0.3, h - 82, 40, 36);
    g.fillStyle(0x5a3a1a, 1);
    g.fillRect(w * 0.62, h - 120, 4, 74);
    const fc = [0xe9c13a, 0xd23a2a, 0x2f8f5a, 0xf4f2ea];
    fc.forEach((c, i) => {
      g.fillStyle(c, 1);
      g.fillTriangle(w * 0.62 + 4, h - 120 + i * 16, w * 0.62 + 4, h - 108 + i * 16, w * 0.62 + 26, h - 114 + i * 16);
    });
    g.fillStyle(0xffd76a, 1);
    g.fillCircle(w - 18, h - 58, 5);
  });
  // 王船（戰鬥用、白天遷船用）
  make(scene, 'wangchuan', 360, 280, (g, w, h) => ship(g, w, h, false));
  make(scene, 'wangchuan_land', 360, 300, (g, w, h) => ship(g, w, h, true));
  // 黑潮
  make(scene, 'heichao', 320, 320, (g, w, h) => tide(g, w, h, false));
  make(scene, 'heichao_calm', 320, 320, (g, w, h) => tide(g, w, h, true));
  // 觸手：從沙裡伸出來的黑色水柱，上面有吸盤
  make(scene, 'chu', 90, 250, (g, w, h) => {
    g.fillStyle(0x3a2a7a, 0.3);
    g.fillEllipse(w / 2, h - 8, w, 18);
    g.fillStyle(0x10142a, 1);
    g.beginPath();
    g.moveTo(w / 2 - 22, h);
    g.lineTo(w / 2 - 14, h - 90);
    g.lineTo(w / 2 - 22, h - 170);
    g.lineTo(w / 2 + 2, h - 240);
    g.lineTo(w / 2 + 14, h - 170);
    g.lineTo(w / 2 + 8, h - 90);
    g.lineTo(w / 2 + 22, h);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x5a5aa8, 1);
    for (let i = 0; i < 6; i++) g.fillCircle(w / 2 + (i % 2 ? 6 : -6), h - 30 - i * 34, 4);
  });
  // 捲浪：一道往左打的浪
  make(scene, 'wave', 240, 280, (g, w, h) => {
    g.fillStyle(0x0c1a3a, 0.95);
    g.beginPath();
    g.moveTo(w, h);
    g.lineTo(w, 40);
    g.lineTo(w * 0.55, 10);
    g.lineTo(w * 0.2, 40);
    g.lineTo(w * 0.05, 90);
    g.lineTo(w * 0.25, 80);
    g.lineTo(w * 0.35, 140);
    g.lineTo(w * 0.2, h);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xcfe0f0, 0.85);
    for (let i = 0; i < 9; i++) g.fillCircle(w * 0.08 + i * 18, 70 - Math.sin(i / 2) * 40 + (i > 5 ? 20 : 0), 7);
    g.lineStyle(3, 0x3a5a9a, 0.8);
    for (let y = 150; y < h; y += 34) g.lineBetween(w * 0.3, y, w, y - 10);
  });
  // 小疫鬼：戴斗笠的小黑影，紅眼
  make(scene, 'yi', 70, 80, (g, w, h) => {
    g.fillStyle(0x7a3a2a, 0.25);
    g.fillCircle(w / 2, h - 32, 30);
    g.fillStyle(0x2a2a20, 1);
    g.fillEllipse(w / 2, h - 26, 34, 40);
    g.fillTriangle(w / 2 - 14, h - 10, w / 2 + 14, h - 10, w / 2, h);
    g.fillStyle(0x9a8a5a, 1);
    g.fillTriangle(w / 2 - 30, h - 44, w / 2 + 30, h - 44, w / 2, h - 66);
    g.fillStyle(0xff5a3a, 1);
    g.fillCircle(w / 2 - 6, h - 32, 3);
    g.fillCircle(w / 2 + 6, h - 32, 3);
  });
  // 海煞：一團會跳的海水，白眼
  make(scene, 'sha', 60, 70, (g, w, h) => {
    g.fillStyle(0x4a8ad0, 0.25);
    g.fillEllipse(w / 2, h - 28, 54, 54);
    g.fillStyle(0x1f4a7a, 1);
    g.beginPath();
    g.moveTo(w / 2 - 20, h - 6);
    g.lineTo(w / 2 - 22, h - 34);
    g.lineTo(w / 2 - 8, h - 58);
    g.lineTo(w / 2, h - 44);
    g.lineTo(w / 2 + 10, h - 62);
    g.lineTo(w / 2 + 22, h - 32);
    g.lineTo(w / 2 + 20, h - 6);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xdff0ff, 1);
    g.fillCircle(w / 2 - 7, h - 32, 5);
    g.fillCircle(w / 2 + 7, h - 32, 5);
    g.fillStyle(0x0a1a2a, 1);
    g.fillCircle(w / 2 - 6, h - 31, 2);
    g.fillCircle(w / 2 + 8, h - 31, 2);
  });

  // ---------- 四個鬼 ----------
  make(scene, 'g_haibo', 90, 120, (g, w, h) => person(g, w, h, { robe: 0x3a4a5a, pants: 0x2a2a30, tall: 0.95, wide: 1.05, hat: 'cap', hatColor: 0x2a3a4a, item: 'rudder' }));
  make(scene, 'g_adi', 80, 116, (g, w, h) => person(g, w, h, { robe: 0xd88a3a, pants: 0x2a3a5a, skin: 0xc89a6a, tall: 1.0, hat: 'none', item: 'letter' }));
  make(scene, 'g_mipo', 80, 110, (g, w, h) => person(g, w, h, { robe: 0x6a6a7a, tall: 0.82, wide: 0.85, hat: 'bun', hatColor: 0xd8d8d8, item: 'sack', apron: 0xe8e2d0 }));
  make(scene, 'g_yigui', 90, 130, (g, w, h) => {
    person(g, w, h, { robe: 0x2a2a24, pants: 0x1a1a14, skin: 0x1a1a14, tall: 1.05, hat: 'straw', hatColor: 0x9a8a5a, paint: [0x1a1a14, 0x1a1a14] });
    g.fillStyle(0x7a9a4a, 0.5);
    for (let i = 0; i < 3; i++) g.fillCircle(w / 2 + 18 + i * 6, 40 - i * 8, 4 + i);
  });

  // ---------- 信徒與路人 ----------
  make(scene, 'n_caisao', 70, 110, (g, w, h) => person(g, w, h, { robe: 0x5a7a8a, pants: 0x2a3a4a, tall: 0.88, hat: 'scarf', hatColor: 0xd85a7a, item: 'none', apron: 0xe8b84a }));
  make(scene, 'n_hong', 76, 112, (g, w, h) => person(g, w, h, { robe: 0x8a6a4a, pants: 0x3a3a3a, tall: 0.92, wide: 1.1, hat: 'cap', hatColor: 0x2a2a2a, item: 'hammer' }));
  make(scene, 'n_acheng', 72, 112, (g, w, h) => person(g, w, h, { robe: 0xf4f2ea, trim: 0xc8372d, pants: 0x2a2a30, tall: 0.96, hat: 'band', hatColor: 0xc8372d, item: 'none' }));
  make(scene, 'n_huang', 76, 112, (g, w, h) => person(g, w, h, { robe: 0x2a3a6a, trim: 0xe9b949, tall: 0.95, wide: 1.15, hat: 'flat', hatColor: 0x1a1a1a, item: 'incense' }));
  make(scene, 'n_gangwu', 70, 110, (g, w, h) => person(g, w, h, { robe: 0x6a7a5a, tall: 0.86, hat: 'cap', hatColor: 0x2a4a6a, item: 'none' }));
  make(scene, 'n_doctor', 70, 112, (g, w, h) => person(g, w, h, { robe: 0xf4f4f4, trim: 0x6a9ad0, pants: 0x3a3a4a, tall: 0.95, hat: 'none', item: 'none' }));
  make(scene, 'n_ajuan', 70, 110, (g, w, h) => person(g, w, h, { robe: 0x9a5a7a, tall: 0.86, hat: 'bun', hatColor: 0x2a1c14, item: 'none', apron: 0xf0d0a0 }));

  // ---------- 戰場的小東西 ----------
  make(scene, 'flame', 50, 110, (g, w, h) => {
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(w / 2, h - 40, w, 80);
    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(w / 2, 2);
    g.lineTo(w / 2 + 18, h - 50);
    g.lineTo(w / 2 + 14, h - 6);
    g.lineTo(w / 2 - 14, h - 6);
    g.lineTo(w / 2 - 18, h - 50);
    g.closePath();
    g.fillPath();
  });
  make(scene, 'torch', 30, 120, (g, w, h) => {
    g.fillStyle(0x5a3a1a, 1);
    g.fillRect(w / 2 - 2, 30, 4, h - 30);
    g.fillStyle(0xff9a3a, 0.4);
    g.fillCircle(w / 2, 22, 14);
    g.fillStyle(0xffd76a, 1);
    g.fillTriangle(w / 2 - 7, 32, w / 2 + 7, 32, w / 2, 6);
  });
  // 金紙堆
  make(scene, 'jinzhi', 120, 70, (g, w, h) => {
    for (let i = 0; i < 14; i++) {
      const x = 12 + (i * 37) % (w - 30);
      const y = h - 8 - Math.floor(i / 4) * 14;
      g.fillStyle(i % 3 ? 0xe9c13a : 0xd8a82a, 1);
      g.fillRect(x, y - 12, 26, 12);
      g.fillStyle(0xb3261e, 1);
      g.fillRect(x + 10, y - 9, 6, 6);
    }
  });
}

// ---------- 背景：漁港 ----------
const HSIGNS = ['海產', '漁具', '製冰', '魚丸', '鮪魚', '雜貨', '金紙', '香舖', '冰塊', '船具', '米行', '鹹粥'];
const HWALLS = [0xc8d0c8, 0xd8c8a8, 0xb8c0b8, 0xd0b8a0, 0xa8b0b8, 0xc8b898];

/** 漁港的街屋：二樓、鐵皮雨遮、直立招牌 */
function makeHarborShop(scene: Phaser.Scene, key: string, i: number, night: boolean): void {
  if (scene.textures.exists(key)) return;
  const w = 200 + (i % 3) * 26;
  const h = 220 + (i % 4) * 18;
  const rt = scene.make.renderTexture({ width: w, height: h }, false);
  const g = scene.make.graphics({}, false);
  const wall = night ? lerpColor(HWALLS[i % HWALLS.length], 0x15122a, 0.72) : HWALLS[i % HWALLS.length];
  g.fillStyle(wall, 1);
  g.fillRect(0, 10, w, h - 10);
  // 鐵皮屋頂
  g.fillStyle(night ? 0x1a2a3a : [0x3a7a9a, 0x9a4a3a, 0x5a8a5a][i % 3], 1);
  g.fillRect(-4, 0, w + 8, 16);
  // 窗
  for (let c = 0; c < 2; c++) {
    const lit = night && (i + c) % 2 === 0;
    g.fillStyle(lit ? 0xffcf7a : night ? 0x0c0a14 : 0x3a4a5a, 0.9);
    g.fillRect(24 + c * (w / 2), 34, w / 2 - 50, 44);
    g.lineStyle(2, night ? 0x2a2438 : 0x6a6a6a, 1);
    g.strokeRect(24 + c * (w / 2), 34, w / 2 - 50, 44);
  }
  // 一樓：雨遮與店面
  const ay = h - 92;
  g.fillStyle(night ? 0x2a2a3a : [0x2b5aa8, 0xb3261e, 0x2f8f5a, 0xe9b949][i % 4], 1);
  g.fillRect(0, ay - 16, w, 14);
  g.fillStyle(night ? 0x0a0812 : 0x2a2622, 1);
  g.fillRect(0, ay - 2, w, 94);
  if (night) {
    g.fillStyle(0xffb54a, 0.35);
    g.fillRect(18, ay + 14, w - 70, 78);
  } else {
    // 保麗龍箱、冰塊
    g.fillStyle(0xf0f0f0, 1);
    for (let k = 0; k < 3; k++) g.fillRect(20 + k * 34, h - 30, 28, 22);
    g.fillStyle(0x9ad0f0, 0.8);
    g.fillRect(20, h - 40, 28, 10);
  }
  // 直立招牌
  const sx = w - 44;
  g.fillStyle(night ? 0xb3261e : [0xb3261e, 0x2b5aa8, 0x2f8f5a, 0xe9b949][(i + 1) % 4], 1);
  g.fillRect(sx, 22, 30, 110);
  g.lineStyle(2, 0xfbf3e2, 1);
  g.strokeRect(sx + 3, 25, 24, 104);
  rt.draw(g);
  const sign = HSIGNS[i % HSIGNS.length];
  const t = scene.make.text({ text: sign.split('').join('\n'), style: { fontFamily: FONT, fontSize: '19px', fontStyle: '900', color: night ? '#ffe6a8' : '#fbf3e2', align: 'center', lineSpacing: -2 } }, false);
  t.setOrigin(0.5, 0.5);
  rt.draw(t, sx + 15, 77);
  rt.saveTexture(key);
  t.destroy();
  g.destroy();
  rt.destroy();
}

/** 碼頭：一段看得到海的空地，停著漁船、插著旗 */
function makeQuay(scene: Phaser.Scene, key: string, night: boolean, i: number): void {
  if (scene.textures.exists(key)) return;
  const w = 260;
  const h = 220;
  const g = scene.make.graphics({}, false);
  g.fillStyle(night ? 0x0a1028 : 0x3a7ab0, 1);
  g.fillRect(0, h - 70, w, 70);
  g.lineStyle(2, night ? 0x2a3a6a : 0x8ac0e8, 0.7);
  for (let y = h - 60; y < h; y += 14) g.lineBetween(10, y, w - 10, y);
  // 漁船
  const hull = night ? 0x2a2a3a : [0x2b5aa8, 0xd8d8d0, 0x2f8f5a][i % 3];
  g.fillStyle(hull, 1);
  g.beginPath();
  g.moveTo(30, h - 80);
  g.lineTo(w - 20, h - 90);
  g.lineTo(w - 44, h - 50);
  g.lineTo(50, h - 50);
  g.closePath();
  g.fillPath();
  g.fillStyle(night ? 0x3a3a4a : 0xf4f2ea, 1);
  g.fillRect(90, h - 124, 60, 40);
  g.fillStyle(night ? 0x6a5a3a : 0x5a3a1a, 1);
  g.fillRect(170, h - 180, 4, 96);
  const fc = [0xe9c13a, 0xd23a2a, 0x2f8f5a, 0x2b5aa8];
  fc.forEach((c, k) => {
    g.fillStyle(night ? lerpColor(c, 0x000000, 0.6) : c, 1);
    g.fillTriangle(174, h - 180 + k * 18, 174, h - 166 + k * 18, 200, h - 173 + k * 18);
  });
  if (night) {
    g.fillStyle(0xffd76a, 0.9);
    g.fillCircle(w - 30, h - 94, 5);
  }
  // 繫船柱
  g.fillStyle(night ? 0x2a2a30 : 0x5a5a5a, 1);
  g.fillRect(14, h - 46, 14, 26);
  g.fillRect(10, h - 50, 22, 6);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** 遠方的海：水平線、漁船、遠山（小琉嶼） */
function makeSea(scene: Phaser.Scene, key: string, night: boolean): void {
  if (scene.textures.exists(key)) return;
  const w = 1024;
  const h = 200;
  const g = scene.make.graphics({}, false);
  // 小島
  g.fillStyle(night ? 0x14162e : 0x7a9ab0, 1);
  g.fillEllipse(760, h - 60, 260, 70);
  g.fillStyle(night ? 0x0a1028 : 0x4a8ac0, 1);
  g.fillRect(0, h - 70, w, 70);
  g.lineStyle(2, night ? 0x1a2a5a : 0x9ad0f0, 0.6);
  for (let y = h - 62; y < h; y += 12) for (let x = (y % 24) * 2; x < w; x += 90) g.lineBetween(x, y, x + 40, y);
  // 遠方的船
  for (let k = 0; k < 5; k++) {
    const x = 80 + k * 200;
    g.fillStyle(night ? 0x1a1a2a : 0x2a3a4a, 1);
    g.fillTriangle(x, h - 76, x + 40, h - 76, x + 34, h - 68);
    g.fillRect(x + 18, h - 100, 2, 24);
    if (night) {
      g.fillStyle(0xffd76a, 1);
      g.fillCircle(x + 20, h - 100, 3);
    }
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

/** 沙灘：防風林、消波塊 */
function makeShoreProp(scene: Phaser.Scene, key: string, kind: 'dune' | 'tetrapod'): void {
  if (scene.textures.exists(key)) return;
  const w = 240;
  const h = 180;
  const g = scene.make.graphics({}, false);
  if (kind === 'dune') {
    // 木麻黃防風林
    g.fillStyle(0x3a5a3a, 1);
    for (let k = 0; k < 4; k++) {
      const x = 30 + k * 56;
      g.fillStyle(0x5a4a3a, 1);
      g.fillRect(x - 3, h - 70, 6, 70);
      g.fillStyle([0x3a6a4a, 0x2f5a3a, 0x4a7a4a][k % 3], 1);
      g.fillTriangle(x - 26, h - 50, x + 26, h - 50, x, h - 160 + (k % 2) * 20);
    }
  } else {
    // 消波塊
    g.fillStyle(0x9a9a92, 1);
    for (let k = 0; k < 5; k++) {
      const x = 30 + k * 44;
      const y = h - 20 - (k % 2) * 30;
      g.fillTriangle(x - 24, y, x + 24, y, x, y - 44);
      g.fillStyle(0x7a7a72, 1);
      g.fillCircle(x, y - 14, 10);
      g.fillStyle(0x9a9a92, 1);
    }
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

function makeSandRoad(scene: Phaser.Scene, key: string, night: boolean): void {
  if (scene.textures.exists(key)) return;
  const w = 256;
  const h = FIELD_H - (GROUND_Y - 90);
  const g = scene.make.graphics({}, false);
  g.fillStyle(night ? 0x2a2630 : 0xd8c8a0, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(night ? 0x221e28 : 0xc8b890, 1);
  for (let i = 0; i < 40; i++) g.fillEllipse((i * 53) % w, 20 + ((i * 37) % (h - 30)), 18, 5);
  g.fillStyle(night ? 0x3a3448 : 0xe8dcbc, 1);
  g.fillRect(0, 0, w, 6);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function makeHarbor(scene: Phaser.Scene): void {
  makeHarborFigures(scene);
  for (let i = 0; i < 8; i++) {
    makeHarborShop(scene, `hshop${i}`, i, false);
    makeHarborShop(scene, `hshopN${i}`, i, true);
  }
  for (let i = 0; i < 3; i++) {
    makeQuay(scene, `quay${i}`, false, i);
    makeQuay(scene, `quayN${i}`, true, i);
  }
  makeSea(scene, 'seaFar', false);
  makeSea(scene, 'seaFarN', true);
  makeShoreProp(scene, 'dune', 'dune');
  makeShoreProp(scene, 'tetrapod', 'tetrapod');
  makeSandRoad(scene, 'sandroad', false);
  makeSandRoad(scene, 'sandN', true);
  makeTemple(scene, 'temple_daitian', '代天府');
}
