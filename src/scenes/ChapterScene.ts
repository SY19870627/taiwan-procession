/**
 * 大地圖（出巡圖）：選章節。一章一個地方的祭典與魔王。
 * 目前可以玩「萬舺・青嶺王暗訪」與「東津・迎王」，其他章節先標在地圖上（尚未開放）。
 * 遊戲中一律用虛構名稱（見設計文件 14.5 命名原則）。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { startChapter } from '../content/chapter';
import { button, fullscreenButton, go, panel, txt, type Button } from '../ui/widgets';

interface Chapter {
  id: string;
  /** 地名 */
  place: string;
  /** 章名 */
  title: string;
  lon: number;
  lat: number;
  open: boolean;
  /** 簡介 */
  desc: string;
  /** 規模 */
  scale: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 'wanjia', place: '萬舺', title: '青嶺王暗訪', lon: 121.5, lat: 25.04, open: true,
    desc: '正日遶境前，青嶺王夜巡暗訪，捉拿陰陽兩界作祟者。芝嶺巖的石駒醒了，一路往北，像在找什麼。',
    scale: '三天晝夜・五位信徒・四個有冤情的鬼・魔王石駒',
  },
  {
    id: 'dajia', place: '大岬', title: '遶境進香', lon: 120.62, lat: 24.35, open: false,
    desc: '九天八夜、三百多公里的長路。每晚駐駕在不同的廟，路上遇到的鬼比哪一次都多。',
    scale: '九天八夜・長途章節',
  },
  {
    id: 'lanze', place: '蘭澤潭', title: '潭底的聲音', lon: 120.47, lat: 23.46, open: false,
    desc: '潭邊的人說，夜裡聽得到有人在水底唱歌。',
    scale: '尚未開放',
  },
  {
    id: 'dongjin', place: '東津', title: '迎王', lon: 120.45, lat: 22.46, open: true,
    desc: '三年一科的迎王，代天巡狩的千歲爺駐駕代天府。雲王爺開路、千歲爺調閱案卷。王船出海那晚，送走的是瘟疫，還是別的什麼？',
    scale: '三天＋送王・五位信徒・四個有冤情的鬼・魔王黑潮',
  },
  {
    id: 'lishan', place: '鯉山', title: '鯉山之夜', lon: 121.14, lat: 22.76, open: false,
    desc: '山形像一條鯉魚。老人說，牠每隔幾十年就會翻一次身。',
    scale: '尚未開放',
  },
];

/** 臺灣本島輪廓（經緯度，大致形狀） */
const OUTLINE: [number, number][] = [
  [121.54, 25.3], [121.75, 25.15], [121.92, 25.1], [122.0, 25.01], [121.86, 24.84], [121.83, 24.65], [121.87, 24.58],
  [121.7, 24.25], [121.6, 23.98], [121.5, 23.6], [121.4, 23.25], [121.2, 22.85], [121.05, 22.6], [120.9, 22.35],
  [120.88, 22.1], [120.85, 21.9], [120.72, 21.94], [120.68, 22.2], [120.6, 22.36], [120.45, 22.46], [120.3, 22.55],
  [120.25, 22.72], [120.15, 22.95], [120.1, 23.1], [120.12, 23.35], [120.16, 23.55], [120.2, 23.75], [120.35, 23.98],
  [120.45, 24.12], [120.52, 24.3], [120.62, 24.45], [120.75, 24.62], [120.9, 24.8], [121.02, 24.98], [121.2, 25.08],
  [121.4, 25.18], [121.54, 25.3],
];

export class ChapterScene extends Phaser.Scene {
  private info?: Phaser.GameObjects.Container;
  private marks: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super('chapters');
  }

  create(): void {
    this.marks = [];
    this.cameras.main.fadeIn(400, 10, 8, 18);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a2433, 0x1a2433, 0x0c1220, 0x0c1220, 1);
    bg.fillRect(0, 0, W, H);
    // 海浪紋
    bg.lineStyle(1, 0x2a3a52, 0.6);
    for (let y = 120; y < H - 300; y += 26) {
      for (let x = (y / 26) % 2 ? 0 : 20; x < W; x += 60) bg.strokeEllipse(x, y, 30, 8);
    }
    txt(this, 24, 18, '出　巡　圖', 34, C.gold, { serif: true });
    txt(this, 26, 66, '選一個地方出巡', 18, C.muted, { bold: false });
    fullscreenButton(this);

    // 地圖區域
    const mapTop = 110;
    const mapH = H - mapTop - 330;
    const proj = (lon: number, lat: number) => {
      const kx = (W - 120) / 2.2;
      const ky = mapH / 3.55;
      const k = Math.min(kx, ky);
      const cx = W / 2;
      const cy = mapTop + mapH / 2;
      return { x: cx + (lon - 121.0) * k, y: cy - (lat - 23.6) * k * 1.08 };
    };
    // 島
    const pts = OUTLINE.map(([lo, la]) => proj(lo, la));
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillPoints(pts.map((p) => new Phaser.Math.Vector2(p.x + 6, p.y + 8)), true);
    g.fillStyle(0xe8dcbc, 1);
    g.fillPoints(pts.map((p) => new Phaser.Math.Vector2(p.x, p.y)), true);
    g.lineStyle(3, 0x8a6a3a, 1);
    g.strokePoints(pts.map((p) => new Phaser.Math.Vector2(p.x, p.y)), true);
    // 中央山脈
    g.lineStyle(2, 0x8a9a6a, 0.7);
    for (const [lo, la] of [[121.25, 24.6], [121.15, 24.1], [121.0, 23.6], [120.9, 23.1], [120.82, 22.6]]) {
      const p = proj(lo, la);
      g.strokeTriangle(p.x - 16, p.y + 10, p.x, p.y - 12, p.x + 16, p.y + 10);
    }

    // 章節點
    CHAPTERS.forEach((ch, i) => {
      const p = proj(ch.lon, ch.lat);
      if (ch.open) {
        const glow = this.add.circle(p.x, p.y, 26, 0xffd76a, 0.25);
        this.tweens.add({ targets: glow, scale: 1.4, alpha: 0.05, duration: 1200, repeat: -1 });
      }
      const m = this.add.circle(p.x, p.y, ch.open ? 13 : 10, ch.open ? 0xb3261e : 0x6a6070).setStrokeStyle(3, ch.open ? 0xe9b949 : 0x9a8fae);
      this.marks.push(m);
      const left = p.x > W / 2 ? -1 : 1;
      const label = txt(this, p.x + left * 22, p.y, `${ch.place}${ch.open ? '' : '（未開放）'}`, ch.open ? 22 : 17, ch.open ? 0x5a1a10 : 0x6a6070, { serif: true, backgroundColor: ch.open ? '#e9b949' : undefined, padding: ch.open ? { x: 6, y: 2 } : undefined }).setOrigin(left > 0 ? 0 : 1, 0.5);
      const hit = this.add.circle(p.x, p.y, 34, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.select(i));
      label.setInteractive({ useHandCursor: true }).on('pointerup', () => this.select(i));
    });
    this.select(0);
  }

  private select(i: number): void {
    this.marks.forEach((m, k) => m.setScale(k === i ? 1.4 : 1));
    const ch = CHAPTERS[i];
    this.info?.destroy();
    const c = this.add.container(0, 0);
    this.info = c;
    const y = H - 312;
    c.add(panel(this, 16, y, W - 32, 296));
    c.add(txt(this, 40, y + 18, `${ch.place}・${ch.title}`, 30, ch.open ? C.gold : C.muted, { serif: true }));
    c.add(txt(this, 40, y + 62, ch.scale, 16, ch.open ? 0x9fe8c0 : C.muted, { bold: false }));
    c.add(txt(this, 40, y + 92, ch.desc, 19, C.paper, { bold: false, lineSpacing: 6, wordWrap: { width: W - 80, useAdvancedWrap: true } }));
    const b: Button = button(this, W / 2, y + 296 - 56, 300, 72, ch.open ? '出　巡' : '尚未開放', () => {
      if (!ch.open) return;
      startChapter(ch.id);
      go(this, 'almanac', { prologue: true });
    }, { size: 30, fill: 0x8a1b14 });
    b.setEnabled(ch.open);
    c.add(b);
  }
}
