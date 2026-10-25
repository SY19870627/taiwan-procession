/**
 * 背景：白天的街景（會往後捲動）、夜晚的廟埕。全部程式繪製。
 */
import Phaser from 'phaser';
import { FONT, SERIF, FIELD_H as H, FIELD_W as W, GROUND_Y, lerpColor } from '../theme';

const SIGNS = ['香舖', '麵線', '青草茶', '金紙', '佛具', '冰果室', '布莊', '中藥', '雜貨', '肉圓', '米苔目', '刻印'];
const WALLS = [0xd9c3a0, 0xc9a98a, 0xb8a07a, 0xd8b8a0, 0xa8a090, 0xc0b090];

/** 騎樓街屋：一樓騎樓、二三樓窗戶、直立招牌 */
function makeShophouse(scene: Phaser.Scene, key: string, i: number, night: boolean): void {
  if (scene.textures.exists(key)) return;
  const w = 200 + (i % 3) * 30;
  const h = 250 + (i % 4) * 22;
  const rt = scene.make.renderTexture({ width: w, height: h }, false);
  const g = scene.make.graphics({}, false);
  const wall = night ? lerpColor(WALLS[i % WALLS.length], 0x15122a, 0.72) : WALLS[i % WALLS.length];
  const dark = night ? 0x0c0a14 : 0x3a2e28;
  g.fillStyle(wall, 1);
  g.fillRect(0, 0, w, h);
  // 女兒牆
  g.fillStyle(lerpColor(wall, 0x000000, 0.15), 1);
  g.fillRect(0, 0, w, 14);
  g.fillRect(w * 0.3, -2, w * 0.4, 10);
  // 窗戶
  const floors = Math.floor((h - 110) / 64);
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < 2; c++) {
      const wx = 26 + c * (w / 2);
      const wy = 30 + f * 64;
      const lit = night && (i + f + c) % 3 !== 0;
      g.fillStyle(lit ? 0xffcf7a : dark, lit ? 0.95 : 0.85);
      g.fillRect(wx, wy, w / 2 - 52, 40);
      g.fillStyle(lerpColor(wall, 0x000000, 0.3), 1);
      g.fillRect(wx - 3, wy + 40, w / 2 - 46, 4);
      // 鐵窗
      g.lineStyle(2, night ? 0x2a2438 : 0x5a4a40, 1);
      for (let k = 1; k < 4; k++) g.lineBetween(wx + k * ((w / 2 - 52) / 4), wy, wx + k * ((w / 2 - 52) / 4), wy + 40);
    }
  }
  // 騎樓
  const ay = h - 96;
  g.fillStyle(night ? 0x0a0812 : 0x2a201c, 1);
  g.fillRect(0, ay, w, 96);
  g.fillStyle(lerpColor(wall, 0x000000, 0.1), 1);
  g.fillRect(0, ay - 10, w, 12);
  g.fillRect(0, ay, 16, 96);
  g.fillRect(w - 16, ay, 16, 96);
  g.fillRect(w / 2 - 8, ay, 16, 96);
  // 店門透出的光
  if (night) {
    g.fillStyle(0xffb54a, 0.35);
    g.fillRect(24, ay + 20, w / 2 - 40, 76);
  } else {
    g.fillStyle(0x6a5a4a, 1);
    g.fillRect(24, ay + 20, w / 2 - 40, 76);
    g.fillRect(w / 2 + 16, ay + 20, w / 2 - 40, 76);
  }
  // 直立招牌
  const sx = w - 46;
  g.fillStyle(night ? 0xb3261e : [0xb3261e, 0x2b5aa8, 0x2f8f5a, 0xe9b949][i % 4], 1);
  g.fillRect(sx, 22, 30, 120);
  g.lineStyle(2, 0xfbf3e2, 1);
  g.strokeRect(sx + 3, 25, 24, 114);
  rt.draw(g);
  const sign = SIGNS[i % SIGNS.length];
  const txt = scene.make.text({ text: sign.split('').join('\n'), style: { fontFamily: FONT, fontSize: '19px', fontStyle: '900', color: night ? '#ffe6a8' : '#fbf3e2', align: 'center', lineSpacing: -4 } }, false);
  txt.setOrigin(0.5, 0.5);
  rt.draw(txt, sx + 15, 82);
  rt.saveTexture(key);
  txt.destroy();
  g.destroy();
  rt.destroy();
}

/** 田、樹叢、遠山（郊區、山邊用） */
function makeRural(scene: Phaser.Scene, key: string, i: number, night: boolean): void {
  if (scene.textures.exists(key)) return;
  const w = 240;
  const h = 200;
  const g = scene.make.graphics({}, false);
  const green = night ? 0x16241e : [0x4f8a4a, 0x5a9a50, 0x467a42][i % 3];
  if (i % 2 === 0) {
    // 樹叢
    g.fillStyle(lerpColor(green, 0x000000, 0.2), 1);
    g.fillCircle(60, h - 70, 52);
    g.fillCircle(130, h - 90, 64);
    g.fillCircle(190, h - 66, 48);
    g.fillStyle(green, 1);
    g.fillCircle(100, h - 60, 46);
    g.fillCircle(170, h - 56, 40);
  } else {
    // 菜園與農舍
    g.fillStyle(night ? 0x2a2018 : 0x8a6a3a, 1);
    g.fillRect(0, h - 40, w, 40);
    g.fillStyle(green, 1);
    for (let k = 0; k < 8; k++) g.fillEllipse(16 + k * 30, h - 36, 22, 12);
    g.fillStyle(night ? 0x2a2430 : 0xc9b08a, 1);
    g.fillRect(140, h - 120, 80, 80);
    g.fillStyle(night ? 0x3a1612 : 0x9a3a2a, 1);
    g.fillTriangle(130, h - 118, 230, h - 118, 180, h - 156);
    g.fillStyle(night ? 0xffcf7a : 0x3a2e28, night ? 0.9 : 1);
    g.fillRect(164, h - 96, 22, 22);
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

function makeMountains(scene: Phaser.Scene, key: string, color: number, seed: number, height: number): void {
  if (scene.textures.exists(key)) return;
  const w = 1024;
  const g = scene.make.graphics({}, false);
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(0, height);
  let y = height * 0.5;
  for (let x = 0; x <= w; x += 32) {
    y = height * 0.35 + Math.sin((x + seed) / 140) * height * 0.18 + Math.sin((x + seed * 3) / 57) * height * 0.08;
    g.lineTo(x, y);
  }
  g.lineTo(w, height);
  g.closePath();
  g.fillPath();
  g.generateTexture(key, w, height);
  g.destroy();
}

/** 遠方城市剪影 */
function makeSkyline(scene: Phaser.Scene, key: string, color: number, night: boolean): void {
  if (scene.textures.exists(key)) return;
  const w = 1024;
  const h = 220;
  const g = scene.make.graphics({}, false);
  let x = 0;
  let k = 0;
  while (x < w) {
    const bw = 40 + ((k * 37) % 50);
    const bh = 60 + ((k * 53) % 130);
    g.fillStyle(color, 1);
    g.fillRect(x, h - bh, bw, bh);
    if (night) {
      g.fillStyle(0xffcf7a, 0.5);
      for (let wy = h - bh + 10; wy < h - 10; wy += 18) for (let wx = x + 6; wx < x + bw - 8; wx += 12) if ((wx + wy + k) % 5 === 0) g.fillRect(wx, wy, 5, 7);
    }
    x += bw + 6;
    k++;
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

function makeRoad(scene: Phaser.Scene, key: string, night: boolean): void {
  if (scene.textures.exists(key)) return;
  const w = 256;
  const h = H - (GROUND_Y - 90);
  const g = scene.make.graphics({}, false);
  // 人行道
  g.fillStyle(night ? 0x2a2634 : 0xb8ab94, 1);
  g.fillRect(0, 0, w, 26);
  g.fillStyle(night ? 0x1e1b26 : 0x9c8f78, 1);
  for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 2, 26);
  g.fillRect(0, 24, w, 4);
  // 馬路
  g.fillStyle(night ? 0x1a1822 : 0x55525c, 1);
  g.fillRect(0, 28, w, h - 28);
  g.fillStyle(night ? 0x3a3648 : 0xe8e2d0, 1);
  g.fillRect(20, 150, 90, 6);
  g.fillRect(148, 150, 90, 6);
  g.generateTexture(key, w, h);
  g.destroy();
}

function makeLantern(scene: Phaser.Scene): void {
  if (scene.textures.exists('lantern')) return;
  const g = scene.make.graphics({}, false);
  g.fillStyle(0xff6a3a, 0.25);
  g.fillCircle(30, 34, 28);
  g.fillStyle(0xd62b2b, 1);
  g.fillEllipse(30, 34, 30, 36);
  g.fillStyle(0xe9b949, 1);
  g.fillRect(22, 14, 16, 4);
  g.fillRect(22, 50, 16, 4);
  g.fillRect(29, 4, 2, 10);
  g.generateTexture('lantern', 60, 64);
  g.destroy();
}

/** 廟宇正面：紅柱、燕尾脊、匾額 */
export function makeTemple(scene: Phaser.Scene, key: string, plaque: string): void {
  if (scene.textures.exists(key)) return;
  const w = 760;
  const h = 400;
  const rt = scene.make.renderTexture({ width: w, height: h }, false);
  const g = scene.make.graphics({}, false);
  const cx = w / 2;
  // 台基
  g.fillStyle(0x3a3440, 1);
  g.fillRect(40, h - 30, w - 80, 30);
  // 牆
  g.fillStyle(0x5a1a16, 1);
  g.fillRect(70, 150, w - 140, h - 180);
  // 門
  g.fillStyle(0x7a1f18, 1);
  g.fillRect(cx - 90, 200, 180, h - 230);
  g.fillStyle(0xe9b949, 1);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) g.fillCircle(cx - 70 + c * 28, 222 + r * 30, 3);
  g.fillStyle(0x3a0e0a, 1);
  g.fillRect(cx - 2, 200, 4, h - 230);
  // 側門
  for (const dx of [-230, 170]) {
    g.fillStyle(0x7a1f18, 1);
    g.fillRect(cx + dx, 230, 60, h - 260);
  }
  // 柱子
  g.fillStyle(0xb3261e, 1);
  for (const dx of [-300, -130, 110, 280]) g.fillRect(cx + dx, 150, 20, h - 180);
  // 屋頂（兩層、燕尾脊）
  const roof = (y: number, half: number, thick: number) => {
    g.fillStyle(0x2a1a1a, 1);
    g.beginPath();
    g.moveTo(cx - half, y);
    g.lineTo(cx + half, y);
    g.lineTo(cx + half - 40, y - thick);
    g.lineTo(cx - half + 40, y - thick);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xb3261e, 1);
    g.fillRect(cx - half + 40, y - thick - 8, (half - 40) * 2, 10);
    // 燕尾
    g.fillTriangle(cx - half + 40, y - thick - 8, cx - half + 70, y - thick + 2, cx - half - 6, y - thick - 46);
    g.fillTriangle(cx + half - 40, y - thick - 8, cx + half - 70, y - thick + 2, cx + half + 6, y - thick - 46);
  };
  roof(160, 360, 40);
  roof(96, 250, 34);
  // 剪黏裝飾（屋脊上的寶珠與雙龍剪影）
  g.fillStyle(0xe9b949, 1);
  g.fillCircle(cx, 44, 12);
  g.fillStyle(0x3f9e83, 1);
  g.fillEllipse(cx - 60, 50, 70, 12);
  g.fillEllipse(cx + 60, 50, 70, 12);
  // 匾額
  g.fillStyle(0x1d1726, 1);
  g.fillRect(cx - 100, 162, 200, 34);
  g.lineStyle(3, 0xe9b949, 1);
  g.strokeRect(cx - 100, 162, 200, 34);
  rt.draw(g);
  const t = scene.make.text({ text: plaque, style: { fontFamily: SERIF, fontSize: '24px', fontStyle: '900', color: '#e9b949' } }, false);
  t.setOrigin(0.5, 0.5);
  rt.draw(t, cx, 179);
  rt.saveTexture(key);
  t.destroy();
  g.destroy();
  rt.destroy();
}

export function makeBackdropTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < 8; i++) {
    makeShophouse(scene, `shop${i}`, i, false);
    makeShophouse(scene, `shopN${i}`, i, true);
  }
  for (let i = 0; i < 4; i++) {
    makeRural(scene, `rural${i}`, i, false);
    makeRural(scene, `ruralN${i}`, i, true);
  }
  makeMountains(scene, 'mtnFar', 0x8aa6c0, 0, 260);
  makeMountains(scene, 'mtnNear', 0x5f7f6a, 400, 220);
  makeMountains(scene, 'mtnFarN', 0x1e1d38, 0, 260);
  makeSkyline(scene, 'skyline', 0x9ab0c4, false);
  makeSkyline(scene, 'skylineN', 0x1a1830, true);
  makeRoad(scene, 'road', false);
  makeRoad(scene, 'roadN', true);
  makeLantern(scene);
}

/** 依時間（小時）回傳天空上下兩色 */
export function skyColors(hour: number): [number, number] {
  const keys: [number, number, number][] = [
    [6, 0x5a6a9a, 0xf0c49a],
    [8, 0x8fc6e8, 0xf6e2c0],
    [12, 0x6fb6ea, 0xcfe9f7],
    [16, 0x76b4e2, 0xd8ecf5],
    [17.5, 0xe58a5c, 0xf6cf8f],
    [18.5, 0x5a4a8a, 0xd77a6a],
    [19.5, 0x1f2048, 0x3b3366],
    [24, 0x0c0b1e, 0x1d1a3a],
  ];
  if (hour <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) {
    if (hour <= keys[i][0]) {
      const [h0, a0, b0] = keys[i - 1];
      const [h1, a1, b1] = keys[i];
      const t = (hour - h0) / (h1 - h0);
      return [lerpColor(a0, a1, t), lerpColor(b0, b1, t)];
    }
  }
  const last = keys[keys.length - 1];
  return [last[1], last[2]];
}

export type StreetTheme = 'city' | 'mixed' | 'hill';

/**
 * 會往後捲動的街景：天空、遠景（城市或山）、街屋或田園、馬路。
 * update(dt, speed) 每幀呼叫，speed 是像素／秒。
 */
export class Street {
  private scene: Phaser.Scene;
  private sky: Phaser.GameObjects.Graphics;
  private far: Phaser.GameObjects.TileSprite;
  private near?: Phaser.GameObjects.TileSprite;
  private road: Phaser.GameObjects.TileSprite;
  private props: Phaser.GameObjects.Image[] = [];
  private nextX = 0;
  private k = 0;
  private night: boolean;
  private theme: StreetTheme;
  /** 走了多遠（像素） */
  distance = 0;
  /** 0–1：從城市漸漸變成鄉間（第二天用） */
  ruralMix = 0;

  constructor(scene: Phaser.Scene, opts: { night: boolean; theme: StreetTheme; hour?: number }) {
    this.scene = scene;
    this.night = opts.night;
    this.theme = opts.theme;
    this.sky = scene.add.graphics().setDepth(-100);
    this.setHour(opts.hour ?? (opts.night ? 21 : 9));
    const farKey = opts.night ? (opts.theme === 'city' ? 'skylineN' : 'mtnFarN') : opts.theme === 'city' ? 'skyline' : 'mtnFar';
    this.far = scene.add.tileSprite(0, GROUND_Y - 110, W, scene.textures.get(farKey).getSourceImage().height, farKey).setOrigin(0, 1).setDepth(-90);
    if (opts.theme !== 'city') {
      this.near = scene.add.tileSprite(0, GROUND_Y - 90, W, 220, opts.night ? 'mtnFarN' : 'mtnNear').setOrigin(0, 1).setDepth(-85);
      if (opts.night) this.near.setTint(0x2a2a40);
    }
    this.road = scene.add.tileSprite(0, GROUND_Y - 90, W, H - (GROUND_Y - 90), opts.night ? 'roadN' : 'road').setOrigin(0, 0).setDepth(-60);
    this.ruralMix = opts.theme === 'city' ? 0 : opts.theme === 'hill' ? 0.8 : 0.3;
    while (this.nextX < W + 300) this.addProp();
  }

  setHour(hour: number): void {
    const [top, bottom] = this.night ? [0x0b0a1c, 0x231d40] : skyColors(hour);
    this.sky.clear();
    this.sky.fillGradientStyle(top, top, bottom, bottom, 1);
    this.sky.fillRect(0, 0, W, GROUND_Y);
  }

  /** 在右邊接一棟新的街屋（或樹叢、田） */
  private addProp(): void {
    const rural = Math.random() < this.ruralMix;
    const n = this.night ? 'N' : '';
    const key = rural ? `rural${n}${this.k % 4}` : `shop${n}${(this.k * 3) % 8}`;
    const img = this.scene.add.image(this.nextX, GROUND_Y - 88, key).setOrigin(0, 1).setDepth(-70);
    this.props.push(img);
    this.nextX += img.width + (rural ? 10 : 0);
    // 夜裡的騎樓掛燈籠
    if (this.night && !rural && this.k % 2 === 0) {
      const l = this.scene.add.image(img.x + img.width * 0.25, GROUND_Y - 170, 'lantern').setDepth(-65);
      this.props.push(l);
    }
    this.k++;
  }

  update(dt: number, speed: number): void {
    const dx = speed * dt;
    this.distance += dx;
    this.far.tilePositionX += dx * 0.15;
    if (this.near) this.near.tilePositionX += dx * 0.35;
    this.road.tilePositionX += dx;
    for (const p of this.props) p.x -= dx;
    this.nextX -= dx;
    while (this.props.length && this.props[0].x + this.props[0].width < -40) this.props.shift()!.destroy();
    while (this.nextX < W + 300) this.addProp();
  }

  setRuralMix(v: number): void {
    this.ruralMix = v;
  }

  get themeName(): StreetTheme {
    return this.theme;
  }
}
