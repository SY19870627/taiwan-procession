/**
 * 角色貼圖：全部用程式畫，開場時一次產生成貼圖（generateTexture），之後當一般圖片用。
 * 座標慣例：腳底在貼圖底部中央。
 */
import Phaser from 'phaser';

export type G = Phaser.GameObjects.Graphics;

export function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G, w: number, h: number) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g, w, h);
  g.generateTexture(key, w, h);
  g.destroy();
}

export const SKIN = 0xe8b98a;
export const DARK = 0x231a2c;

export interface PersonOpt {
  robe: number;
  trim?: number;
  pants?: number;
  skin?: number;
  /** 身高倍率（1 ≈ 96px） */
  tall?: number;
  /** 身體寬度倍率 */
  wide?: number;
  hat?: 'none' | 'cap' | 'tall' | 'flat' | 'bun' | 'helmet' | 'scarf' | 'straw' | 'band';
  hatColor?: number;
  /** 臉譜：上半臉、下半臉顏色 */
  paint?: [number, number];
  tongue?: boolean;
  /** 手上拿的東西 */
  item?: 'incense' | 'fan' | 'club' | 'chain' | 'gong' | 'flag' | 'firecracker' | 'brush' | 'rudder' | 'letter' | 'sack' | 'hammer' | 'basket' | 'token' | 'none';
  /** 圍裙 */
  apron?: number;
}

/** 一般人形：腳 → 長袍 → 手 → 頭 → 帽子 → 手持物 */
export function person(g: G, w: number, h: number, o: PersonOpt): void {
  const t = o.tall ?? 1;
  const k = o.wide ?? 1;
  const cx = w / 2;
  const foot = h - 2;
  const bodyH = 52 * t;
  const headR = 11 * Math.min(1.15, 0.85 + t * 0.15);
  const top = foot - 16 * t - bodyH;
  // 腳
  g.fillStyle(o.pants ?? DARK, 1);
  g.fillRect(cx - 9 * k, foot - 16 * t, 7 * k, 16 * t);
  g.fillRect(cx + 2 * k, foot - 16 * t, 7 * k, 16 * t);
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 10 * k, foot - 3, 9 * k, 3);
  g.fillRect(cx + 1 * k, foot - 3, 9 * k, 3);
  // 長袍（梯形）
  g.fillStyle(o.robe, 1);
  g.beginPath();
  g.moveTo(cx - 11 * k, top);
  g.lineTo(cx + 11 * k, top);
  g.lineTo(cx + 17 * k, foot - 14 * t);
  g.lineTo(cx - 17 * k, foot - 14 * t);
  g.closePath();
  g.fillPath();
  if (o.trim !== undefined) {
    g.fillStyle(o.trim, 1);
    g.fillRect(cx - 17 * k, foot - 19 * t, 34 * k, 5 * t);
    g.fillRect(cx - 2, top, 4, bodyH - 4);
    g.fillRect(cx - 12 * k, top + bodyH * 0.38, 24 * k, 4);
  }
  if (o.apron !== undefined) {
    g.fillStyle(o.apron, 1);
    g.fillRect(cx - 10 * k, top + bodyH * 0.35, 20 * k, bodyH * 0.6);
  }
  // 手臂
  g.fillStyle(o.robe, 1);
  g.fillRect(cx - 17 * k, top + 4, 7 * k, bodyH * 0.55);
  g.fillRect(cx + 10 * k, top + 4, 7 * k, bodyH * 0.55);
  g.fillStyle(o.skin ?? SKIN, 1);
  g.fillCircle(cx - 13.5 * k, top + 6 + bodyH * 0.55, 3.5);
  g.fillCircle(cx + 13.5 * k, top + 6 + bodyH * 0.55, 3.5);
  // 頭
  const hy = top - headR + 2;
  g.fillStyle(o.skin ?? SKIN, 1);
  g.fillCircle(cx, hy, headR);
  if (o.paint) {
    g.fillStyle(o.paint[0], 1);
    g.slice(cx, hy, headR, Math.PI, 0, false);
    g.fillPath();
    g.fillStyle(o.paint[1], 1);
    g.slice(cx, hy, headR, 0, Math.PI, false);
    g.fillPath();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, hy - 1, 2.2);
    g.fillCircle(cx + 4, hy - 1, 2.2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 4, hy - 1, 1);
    g.fillCircle(cx + 4, hy - 1, 1);
  } else {
    g.fillStyle(0x2a1c14, 1);
    g.fillCircle(cx - 4, hy, 1.4);
    g.fillCircle(cx + 4, hy, 1.4);
  }
  if (o.tongue) {
    g.fillStyle(0xd0202a, 1);
    g.fillRoundedRect(cx - 2.5, hy + 4, 5, 22 * t, 2);
  }
  // 帽子
  const hc = o.hatColor ?? DARK;
  g.fillStyle(hc, 1);
  switch (o.hat) {
    case 'cap':
      g.slice(cx, hy - 2, headR + 1, Math.PI, 0, false);
      g.fillPath();
      g.fillRect(cx - headR - 4, hy - 3, headR * 2 + 8, 3);
      break;
    case 'tall':
      g.fillRect(cx - headR + 1, hy - headR - 34 * t, headR * 2 - 2, 34 * t + 4);
      g.fillStyle(0x222222, 1);
      g.fillRect(cx - 2, hy - headR - 28 * t, 4, 22 * t);
      break;
    case 'flat':
      g.fillRect(cx - headR - 7, hy - headR - 2, headR * 2 + 14, 6);
      g.fillRect(cx - headR + 2, hy - headR - 10, headR * 2 - 4, 9);
      break;
    case 'bun':
      g.fillCircle(cx, hy - headR - 2, 5);
      g.slice(cx, hy - 1, headR, Math.PI, 0, false);
      g.fillPath();
      break;
    case 'helmet':
      g.slice(cx, hy - 2, headR + 2, Math.PI, 0, false);
      g.fillPath();
      g.fillStyle(0xe9b949, 1);
      g.fillCircle(cx, hy - headR - 3, 3.5);
      g.fillRect(cx - headR - 2, hy - 3, headR * 2 + 4, 3);
      break;
    case 'scarf':
      g.fillRect(cx - headR, hy - headR, headR * 2, 6);
      break;
    case 'straw':
      // 斗笠：寬寬的尖帽
      g.fillTriangle(cx - headR - 14, hy - 2, cx + headR + 14, hy - 2, cx, hy - headR - 16);
      break;
    case 'band':
      g.fillRect(cx - headR, hy - headR * 0.5, headR * 2, 4);
      g.fillTriangle(cx + headR - 2, hy - headR * 0.5, cx + headR + 8, hy - headR * 0.5 + 8, cx + headR + 2, hy - headR * 0.5 + 10);
      break;
    default:
      break;
  }
  // 手持物（右手）
  const hx = cx + 13.5 * k;
  const handY = top + 6 + bodyH * 0.55;
  switch (o.item) {
    case 'incense':
      g.fillStyle(0x7a3b1a, 1);
      g.fillRect(hx - 1, handY - 26, 2, 26);
      g.fillStyle(0xff9a3c, 1);
      g.fillCircle(hx, handY - 27, 2);
      break;
    case 'fan':
      g.fillStyle(0xf3e3b5, 1);
      g.slice(hx, handY - 2, 16, -Math.PI * 0.85, -Math.PI * 0.15, false);
      g.fillPath();
      g.lineStyle(1, 0x8a6a3a, 1);
      g.strokeCircle(hx, handY - 2, 2);
      break;
    case 'club':
      g.fillStyle(0x6b3b1f, 1);
      g.fillRect(hx - 2.5, handY - 40, 5, 44);
      g.fillStyle(0xc8372d, 1);
      g.fillRect(hx - 3.5, handY - 40, 7, 8);
      break;
    case 'chain':
      g.lineStyle(2, 0xb9b9c4, 1);
      for (let i = 0; i < 4; i++) g.strokeEllipse(hx, handY + 4 + i * 6, 6, 8);
      break;
    case 'gong':
      g.fillStyle(0xd9a641, 1);
      g.fillCircle(hx + 4, handY, 9);
      g.fillStyle(0xb07f22, 1);
      g.fillCircle(hx + 4, handY, 4);
      break;
    case 'flag':
      g.fillStyle(0x6b3b1f, 1);
      g.fillRect(hx - 1.5, handY - 70, 3, 76);
      break;
    case 'firecracker':
      g.fillStyle(0x6b3b1f, 1);
      g.fillRect(hx - 1, handY - 34, 2, 34);
      g.fillStyle(0xd62b2b, 1);
      for (let i = 0; i < 6; i++) g.fillRect(hx + 1, handY - 32 + i * 5, 6, 4);
      break;
    case 'rudder':
      // 斷掉的舵：一截木柄＋半片舵葉
      g.fillStyle(0x4a3220, 1);
      g.fillRect(hx - 3, handY - 46, 6, 50);
      g.fillStyle(0x5a3e28, 1);
      g.fillTriangle(hx - 3, handY + 4, hx - 3, handY + 30, hx - 22, handY + 22);
      g.lineStyle(1, 0x2a1a10, 1);
      g.lineBetween(hx - 3, handY - 8, hx + 3, handY - 14);
      break;
    case 'letter':
      g.fillStyle(0xf4efe0, 1);
      g.fillRect(hx - 4, handY - 14, 14, 10);
      g.lineStyle(1, 0xa3261c, 1);
      g.strokeRect(hx - 4, handY - 14, 14, 10);
      break;
    case 'sack':
      g.fillStyle(0xd8c8a0, 1);
      g.fillRoundedRect(hx - 4, handY - 30, 22, 30, 6);
      g.fillStyle(0xa3261c, 1);
      g.fillRect(hx, handY - 20, 14, 3);
      break;
    case 'hammer':
      g.fillStyle(0x6b3b1f, 1);
      g.fillRect(hx - 1.5, handY - 26, 3, 28);
      g.fillStyle(0x8a8a90, 1);
      g.fillRect(hx - 6, handY - 30, 12, 6);
      break;
    case 'basket':
      g.fillStyle(0x9a7a3a, 1);
      g.fillEllipse(hx + 2, handY, 20, 12);
      g.fillStyle(0xf4f4f0, 1);
      g.fillEllipse(hx + 2, handY - 4, 14, 6);
      break;
    case 'token':
      // 令牌
      g.fillStyle(0xe9b949, 1);
      g.fillRoundedRect(hx - 5, handY - 26, 10, 22, 3);
      g.fillStyle(0xa3261c, 1);
      g.fillRect(hx - 2, handY - 22, 4, 12);
      break;
    case 'brush':
      g.fillStyle(0x6b3b1f, 1);
      g.fillRect(hx - 1, handY - 22, 2, 22);
      g.fillStyle(0x111111, 1);
      g.fillTriangle(hx - 3, handY - 22, hx + 3, handY - 22, hx, handY - 30);
      break;
    default:
      break;
  }
}

/** 神轎：四個轎班扛著；轎衫、轎身、轎頂的顏色可以換（第二章各千歲的轎班轎衫顏色不同） */
export function drawPalanquin(g: G, w: number, h: number, o: { shirt: number; body: number; roof: number; sash?: number }): void {
  const cx = w / 2;
  // 轎班
  for (const dx of [-62, -26, 26, 62]) {
    g.fillStyle(DARK, 1);
    g.fillRect(cx + dx - 6, h - 18, 5, 16);
    g.fillRect(cx + dx + 1, h - 18, 5, 16);
    g.fillStyle(o.shirt, 1);
    g.fillRect(cx + dx - 9, h - 58, 18, 42);
    g.fillStyle(o.sash ?? 0xc8372d, 1);
    g.fillRect(cx + dx - 9, h - 38, 18, 4);
    g.fillStyle(SKIN, 1);
    g.fillCircle(cx + dx, h - 66, 9);
    g.fillStyle(o.sash ?? 0xc8372d, 1);
    g.fillRect(cx + dx - 9, h - 74, 18, 4);
  }
  // 轎槓
  g.fillStyle(0x5a2e14, 1);
  g.fillRect(cx - 96, h - 62, 192, 7);
  // 轎身
  g.fillStyle(o.body, 1);
  g.fillRect(cx - 44, h - 128, 88, 68);
  g.fillStyle(0xe9b949, 1);
  g.fillRect(cx - 44, h - 128, 88, 6);
  g.fillRect(cx - 44, h - 66, 88, 6);
  g.fillRect(cx - 44, h - 128, 6, 68);
  g.fillRect(cx + 38, h - 128, 6, 68);
  // 轎窗與神光
  g.fillStyle(0x2a1208, 1);
  g.fillRect(cx - 26, h - 116, 52, 42);
  g.fillStyle(0xffd76a, 0.9);
  g.fillCircle(cx, h - 96, 14);
  g.fillStyle(0xfff3c4, 1);
  g.fillCircle(cx, h - 96, 7);
  // 轎頂（燕尾）
  g.fillStyle(o.roof, 1);
  g.beginPath();
  g.moveTo(cx - 62, h - 126);
  g.lineTo(cx + 62, h - 126);
  g.lineTo(cx + 40, h - 150);
  g.lineTo(cx - 40, h - 150);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xe9b949, 1);
  g.fillTriangle(cx - 66, h - 122, cx - 50, h - 128, cx - 70, h - 140);
  g.fillTriangle(cx + 66, h - 122, cx + 50, h - 128, cx + 70, h - 140);
  g.fillCircle(cx, h - 160, 8);
  g.fillRect(cx - 2, h - 156, 4, 8);
}

const FLAG_COLORS = [0xf2f0e6, 0x2f8f5a, 0x22232b, 0xd23a2a, 0xe7c13a];

export function makeFigures(scene: Phaser.Scene): void {
  // 報馬仔：小個子、斗笠、銅鑼、一把小涼傘
  make(scene, 'baoma', 90, 120, (g, w, h) => {
    person(g, w, h, { robe: 0x3c5a7a, trim: 0xd9c08a, tall: 0.9, hat: 'cap', hatColor: 0xc9a25a, item: 'gong' });
    g.fillStyle(0xe9b949, 1);
    g.slice(w / 2 - 14, 28, 22, Math.PI, 0, false);
    g.fillPath();
    g.fillStyle(0x6b3b1f, 1);
    g.fillRect(w / 2 - 15, 28, 2, 40);
  });

  // 五方旗：五種顏色
  FLAG_COLORS.forEach((c, i) => {
    make(scene, `flag${i}`, 100, 150, (g, w, h) => {
      person(g, w, h, { robe: 0x6a2b2b, trim: 0xe9b949, hat: 'scarf', hatColor: 0xc8372d, item: 'flag' });
      const px = w / 2 + 13.5;
      g.fillStyle(c, 1);
      g.fillTriangle(px + 2, 6, px + 2, 46, px + 34, 26);
      g.lineStyle(2, 0xe9b949, 1);
      g.strokeTriangle(px + 2, 6, px + 2, 46, px + 34, 26);
    });
  });

  // 鼓亭：兩人扛著的小亭子
  make(scene, 'drum', 150, 130, (g, w, h) => {
    const cx = w / 2;
    for (const dx of [-42, 42]) {
      g.fillStyle(DARK, 1);
      g.fillRect(cx + dx - 6, h - 18, 5, 16);
      g.fillRect(cx + dx + 1, h - 18, 5, 16);
      g.fillStyle(0x2f4f6f, 1);
      g.fillRect(cx + dx - 9, h - 56, 18, 40);
      g.fillStyle(SKIN, 1);
      g.fillCircle(cx + dx, h - 64, 9);
    }
    g.fillStyle(0x6b3b1f, 1);
    g.fillRect(cx - 62, h - 54, 124, 5);
    g.fillStyle(0xb3261e, 1);
    g.fillRect(cx - 30, h - 104, 60, 52);
    g.fillStyle(0xe9b949, 1);
    g.fillRect(cx - 30, h - 104, 60, 6);
    g.fillStyle(0x8a1b14, 1);
    g.fillTriangle(cx - 40, h - 104, cx + 40, h - 104, cx, h - 126);
    g.fillStyle(0xc9884a, 1);
    g.fillEllipse(cx, h - 76, 34, 26);
    g.fillStyle(0xf0d7a8, 1);
    g.fillEllipse(cx, h - 76, 26, 18);
  });

  // 醒獅：大獅頭 + 披布 + 兩雙腳
  make(scene, 'lion', 150, 120, (g, w, h) => {
    const cx = w / 2;
    g.fillStyle(DARK, 1);
    for (const dx of [-44, -32, 20, 32]) g.fillRect(cx + dx, h - 22, 7, 20);
    g.fillStyle(0xe9b949, 1);
    g.fillRoundedRect(cx - 52, h - 66, 100, 46, 18);
    g.fillStyle(0xc8372d, 1);
    for (let i = 0; i < 5; i++) g.fillRect(cx - 48 + i * 20, h - 30, 10, 10);
    // 獅頭
    const hx = cx + 40;
    const hy = h - 72;
    g.fillStyle(0xd62b2b, 1);
    g.fillCircle(hx, hy, 30);
    g.fillStyle(0xf2f0e6, 1);
    g.fillCircle(hx, hy - 24, 10);
    g.fillStyle(0xe9b949, 1);
    g.fillEllipse(hx + 8, hy + 10, 34, 18);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(hx - 8, hy - 6, 8);
    g.fillCircle(hx + 12, hy - 6, 8);
    g.fillStyle(0x111111, 1);
    g.fillCircle(hx - 6, hy - 6, 4);
    g.fillCircle(hx + 14, hy - 6, 4);
    g.fillStyle(0x2f8f5a, 1);
    g.fillRect(hx - 18, hy - 18, 36, 4);
  });

  // 八將：臉譜四種
  const PAINTS: [number, number][] = [[0xd62b2b, 0x111111], [0x111111, 0xf2f0e6], [0x2f8f5a, 0xd62b2b], [0xf2f0e6, 0x2b5aa8]];
  PAINTS.forEach((p, i) => {
    make(scene, `bajiang${i}`, 90, 130, (g, w, h) => {
      person(g, w, h, { robe: [0x7a2a2a, 0x2b3a5a, 0x3a5a2b, 0x5a2b5a][i], trim: 0xe9b949, paint: p, hat: 'helmet', hatColor: 0x2a1c14, item: i % 2 ? 'club' : 'fan', wide: 1.05 });
    });
  });

  // 七爺：高瘦、白袍、高帽、長舌
  make(scene, 'qiye', 90, 190, (g, w, h) => {
    person(g, w, h, { robe: 0xeeeae0, trim: 0x2b2b2b, skin: 0xf4efe6, tall: 1.55, wide: 0.95, hat: 'tall', hatColor: 0xeeeae0, tongue: true, item: 'fan', paint: [0xf4efe6, 0xf4efe6] });
  });
  // 八爺：矮胖、黑臉、黑袍、平帽、手銬
  make(scene, 'baye', 100, 120, (g, w, h) => {
    person(g, w, h, { robe: 0x22232b, trim: 0xb9b9c4, skin: 0x2b2b30, tall: 0.95, wide: 1.4, hat: 'flat', hatColor: 0x111111, item: 'chain', paint: [0x2b2b30, 0x2b2b30] });
  });

  // 文判官：紅臉、黑紗帽、拿筆
  make(scene, 'judge', 100, 140, (g, w, h) => {
    person(g, w, h, { robe: 0x2b3a5a, trim: 0xe9b949, paint: [0xb3261e, 0xb3261e], hat: 'flat', hatColor: 0x111111, item: 'brush', tall: 1.1, wide: 1.15 });
  });

  // 神轎：四個轎班扛著
  make(scene, 'palanquin', 200, 190, (g, w, h) => drawPalanquin(g, w, h, { shirt: 0xf2f0e6, body: 0x8a1b14, roof: 0xb3261e }));

  // 涼傘
  make(scene, 'umbrella', 90, 170, (g, w, h) => {
    person(g, w, h, { robe: 0x3a2b5a, trim: 0xe9b949, hat: 'cap', hatColor: 0xc8372d, item: 'flag' });
    const px = w / 2 + 13.5;
    g.fillStyle(0xe9b949, 1);
    g.fillRoundedRect(px - 34, 6, 68, 26, 10);
    g.fillStyle(0xc8372d, 1);
    for (let i = 0; i < 6; i++) g.fillRect(px - 32 + i * 11, 28, 8, 14);
  });

  // 信徒（多種配色）
  const FOLK = [0x4a6a8a, 0x8a5a3a, 0x5a7a4a, 0x7a4a6a, 0x9a8a5a, 0x3a5a6a];
  FOLK.forEach((c, i) => {
    make(scene, `folk${i}`, 70, 110, (g, w, h) => {
      person(g, w, h, { robe: c, tall: 0.85 + (i % 3) * 0.06, hat: i % 3 === 0 ? 'cap' : i % 3 === 1 ? 'bun' : 'none', hatColor: i % 2 ? 0xc8372d : 0x2a1c14, item: 'incense' });
    });
  });

  // 鞭炮組（信徒拿鞭炮）
  make(scene, 'paoshou', 80, 110, (g, w, h) => {
    person(g, w, h, { robe: 0x8a3a2a, trim: 0xe9b949, tall: 0.9, hat: 'scarf', hatColor: 0xc8372d, item: 'firecracker' });
  });

  // 惠澤宮令旗隊：綠袍＋三角令旗
  make(scene, 'kaijiang', 100, 160, (g, w, h) => {
    person(g, w, h, { robe: 0x2f6f5a, trim: 0xe9b949, hat: 'helmet', hatColor: 0x1f3f33, item: 'flag', wide: 1.1 });
    const px = w / 2 + 14.5;
    g.fillStyle(0xe9b949, 1);
    g.fillTriangle(px + 2, 18, px + 2, 50, px + 30, 34);
    g.fillStyle(0x2f6f5a, 1);
    g.fillCircle(px + 12, 34, 5);
  });

  // 石駒：石頭馬（煞氣版、喚回版）
  for (const calm of [false, true]) {
    make(scene, calm ? 'shiju_calm' : 'shiju', 230, 200, (g, w, h) => {
      const glow = calm ? 0xe9b949 : 0x9b3cff;
      g.fillStyle(glow, calm ? 0.18 : 0.28);
      g.fillEllipse(w / 2, h - 80, 220, 150);
      const stone = calm ? 0x9a948a : 0x6f6a72;
      const dark = calm ? 0x6f6a62 : 0x4a4550;
      // 腳
      g.fillStyle(dark, 1);
      for (const x of [52, 76, 140, 164]) g.fillRect(x, h - 62, 16, 60);
      // 身體
      g.fillStyle(stone, 1);
      g.fillEllipse(110, h - 86, 150, 72);
      // 脖子與頭（朝右）
      g.beginPath();
      g.moveTo(150, h - 112);
      g.lineTo(178, h - 168);
      g.lineTo(204, h - 160);
      g.lineTo(186, h - 100);
      g.closePath();
      g.fillPath();
      g.fillEllipse(198, h - 160, 52, 30);
      // 鬃毛
      g.fillStyle(dark, 1);
      for (let i = 0; i < 5; i++) g.fillTriangle(156 + i * 6, h - 116 - i * 10, 166 + i * 6, h - 120 - i * 10, 150 + i * 6, h - 130 - i * 10);
      // 尾巴
      g.fillTriangle(38, h - 100, 50, h - 92, 14, h - 50);
      // 裂縫
      g.lineStyle(2, calm ? 0x5a554e : glow, 1);
      g.beginPath();
      g.moveTo(80, h - 116);
      g.lineTo(92, h - 98);
      g.lineTo(84, h - 82);
      g.lineTo(100, h - 70);
      g.strokePath();
      g.beginPath();
      g.moveTo(130, h - 120);
      g.lineTo(124, h - 104);
      g.lineTo(136, h - 92);
      g.strokePath();
      // 肚子上的舊傷（鑿洞）
      g.fillStyle(0x1a1420, 1);
      g.fillEllipse(110, h - 62, 26, 12);
      if (!calm) {
        g.fillStyle(glow, 0.8);
        g.fillEllipse(110, h - 62, 14, 6);
      }
      // 眼
      g.fillStyle(calm ? 0x2a1c14 : 0xff4fd8, 1);
      g.fillCircle(206, h - 166, 4);
    });
  }

  // 小魍：暗紫色一團、大白眼、拖著尾巴
  make(scene, 'wang', 70, 70, (g, w, h) => {
    g.fillStyle(0x9b3cff, 0.25);
    g.fillCircle(w / 2, h - 30, 30);
    g.fillStyle(0x3a2250, 1);
    g.fillCircle(w / 2, h - 32, 22);
    g.fillTriangle(w / 2 - 18, h - 24, w / 2 + 18, h - 24, w / 2 + 4, h - 2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(w / 2 - 8, h - 36, 7);
    g.fillCircle(w / 2 + 8, h - 36, 7);
    g.fillStyle(0x111111, 1);
    g.fillCircle(w / 2 - 7, h - 35, 3);
    g.fillCircle(w / 2 + 9, h - 35, 3);
    g.fillStyle(0xff6b9a, 1);
    g.fillRect(w / 2 - 5, h - 24, 10, 3);
  });

  // 疾魅：細長的藍色鬼火
  make(scene, 'mei', 60, 80, (g, w, h) => {
    g.fillStyle(0x7fd6ff, 0.25);
    g.fillEllipse(w / 2, h - 34, 50, 70);
    g.fillStyle(0x3f8fd0, 1);
    g.beginPath();
    g.moveTo(w / 2, 4);
    g.lineTo(w / 2 + 16, h - 34);
    g.lineTo(w / 2 + 8, h - 6);
    g.lineTo(w / 2 - 8, h - 6);
    g.lineTo(w / 2 - 16, h - 34);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xbfeaff, 1);
    g.fillEllipse(w / 2, h - 30, 14, 26);
    g.fillStyle(0x10203a, 1);
    g.fillCircle(w / 2 - 5, h - 36, 2.5);
    g.fillCircle(w / 2 + 5, h - 36, 2.5);
  });

  // 石屑傀：碎石堆起來的人形，眼睛發光
  make(scene, 'kui', 90, 100, (g, w, h) => {
    g.fillStyle(0x9b3cff, 0.2);
    g.fillEllipse(w / 2, h - 44, 84, 92);
    g.fillStyle(0x5f5a62, 1);
    g.fillRoundedRect(w / 2 - 26, h - 70, 52, 56, 10);
    g.fillStyle(0x77727a, 1);
    g.fillRoundedRect(w / 2 - 18, h - 92, 36, 28, 8);
    g.fillStyle(0x4a4550, 1);
    g.fillRect(w / 2 - 22, h - 16, 16, 16);
    g.fillRect(w / 2 + 6, h - 16, 16, 16);
    g.fillRoundedRect(w / 2 - 40, h - 66, 16, 34, 6);
    g.fillRoundedRect(w / 2 + 24, h - 66, 16, 34, 6);
    g.fillStyle(0xff4fd8, 1);
    g.fillCircle(w / 2 - 7, h - 80, 3);
    g.fillCircle(w / 2 + 7, h - 80, 3);
  });

  // 神明旨意：不畫神明的臉，用香煙與金光、令字表示
  make(scene, 'decree', 160, 160, (g, w, h) => {
    for (let i = 6; i > 0; i--) {
      g.fillStyle(0xffd76a, 0.06 * i);
      g.fillCircle(w / 2, h / 2, 12 * i + 6);
    }
    g.fillStyle(0xfff3c4, 1);
    g.fillCircle(w / 2, h / 2, 18);
  });

  // 筊杯（擲筊用）：正面（平）、反面（凸）
  // 筊（側面看）：平面朝上＝上面是平的、下面是弧；凸面朝上＝弧形拱起
  make(scene, 'jiao_flat', 70, 40, (g, w) => {
    g.fillStyle(0xb3261e, 1);
    g.slice(w / 2, 6, 32, 0, Math.PI, false);
    g.fillPath();
    g.fillStyle(0xf0a090, 1);
    g.fillRect(w / 2 - 32, 4, 64, 5);
  });
  make(scene, 'jiao_round', 70, 40, (g, w, h) => {
    g.fillStyle(0x8a1b14, 1);
    g.slice(w / 2, h - 4, 32, Math.PI, 0, false);
    g.fillPath();
    g.fillStyle(0xd84a3a, 1);
    g.slice(w / 2, h - 4, 24, Math.PI * 1.1, Math.PI * 1.6, false);
    g.fillPath();
  });

  // 小粒子：火花、煙
  make(scene, 'spark', 12, 12, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(6, 6, 5);
  });
  make(scene, 'smoke', 40, 40, (g) => {
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(20, 20, 18);
  });
}

export const FOLK_KEYS = ['folk0', 'folk1', 'folk2', 'folk3', 'folk4', 'folk5'];
