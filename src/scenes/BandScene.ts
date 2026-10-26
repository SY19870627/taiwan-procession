/**
 * 白天的隊伍畫面：整支進香隊伍沿街前進（橫向街景整片縮小放進上方的帶狀區域）。
 * 路上遇到的人、鬼、小妖、線索從右邊走近；隊伍停下來處理，處理完繼續走。
 * 由 DayScene 控制（approach / pass / walk）。
 */
import Phaser from 'phaser';
import { W, FIELD_W as FW, FIELD_H as FH, GROUND_Y } from '../theme';
import { Street, type StreetTheme } from '../art/backdrop';

const ZOOM = W / FW;
/** 隊伍裡的人物放大一點，縮小後才看得清楚 */
const BIG = 1.5;
const SPEED = 260;

export interface BandData {
  y: number;
  theme: StreetTheme;
  hour: number;
  /** 隊伍的排列：貼圖、x、大小（面向右邊前進） */
  line: [string, number, number][];
}

/** 路上遇到的東西長什麼樣子 */
export interface Visitor {
  tex: string;
  kind: 'person' | 'ghost' | 'imp' | 'clue';
  /** 小妖一次出現幾隻 */
  count?: number;
}

export class BandScene extends Phaser.Scene {
  private street!: Street;
  private members: { img: Phaser.GameObjects.Image; baseY: number; phase: number }[] = [];
  private walking = false;
  private visitor?: Phaser.GameObjects.Container;
  private target = 0;
  private arrive?: () => void;
  private t = 0;

  constructor() {
    super('band');
  }

  static height(): number {
    return Math.round(FH * ZOOM);
  }

  create(data: BandData): void {
    this.members = [];
    this.walking = false;
    this.visitor = undefined;
    this.arrive = undefined;
    this.cameras.main.setViewport(0, data.y, W, BandScene.height()).setZoom(ZOOM).centerOn(FW / 2, FH / 2);
    this.cameras.main.fadeIn(400, 10, 8, 18);
    this.street = new Street(this, { night: false, theme: data.theme, hour: data.hour });
    // 隊伍（每一章不同，見 content/chapter.ts 的 band）
    for (const [key, x, sc] of data.line) {
      const img = this.add.image(x, GROUND_Y + 10, key).setOrigin(0.5, 1).setScale(sc * BIG).setDepth(20 + x / 100);
      this.members.push({ img, baseY: GROUND_Y + 10, phase: Math.random() * 6 });
    }
  }

  setHour(hour: number): void {
    this.street.setHour(hour);
  }

  /** 隊伍往前走一段（純走路，沒有東西） */
  walk(ms: number, done: () => void): void {
    this.walking = true;
    this.time.delayedCall(ms, () => {
      this.walking = false;
      done();
    });
  }

  /** 一個東西從右邊走近，到隊伍前面停下來 */
  approach(v: Visitor, done: () => void): void {
    this.visitor?.destroy();
    const c = this.add.container(FW + 160, GROUND_Y + 10).setDepth(30);
    const n = v.count ?? 1;
    for (let i = 0; i < n; i++) {
      const img = this.add.image((i - (n - 1) / 2) * 70, 0, v.tex).setOrigin(0.5, 1);
      if (v.kind === 'person') img.setScale(0.72 * BIG).setFlipX(true);
      if (v.kind === 'ghost') {
        img.setScale(0.72 * BIG).setFlipX(true).setTint(0x9ad0ff).setAlpha(0.55);
        img.setData('float', true);
      }
      if (v.kind === 'imp') {
        img.setScale(0.85 * BIG).setFlipX(true).setY(-20);
        img.setData('float', true);
      }
      if (v.kind === 'clue') {
        img.setTexture('spark').setScale(4.5).setOrigin(0.5).setY(-40).setTint(0x9fe8c0);
        this.tweens.add({ targets: img, alpha: 0.4, scale: 5.5, duration: 700, yoyo: true, repeat: -1 });
      }
      c.add(img);
    }
    if (v.kind === 'ghost') {
      const glow = this.add.circle(0, -110, 90, 0x7fd6ff, 0.12);
      c.addAt(glow, 0);
    }
    this.visitor = c;
    this.target = 1020;
    this.arrive = done;
    this.walking = true;
  }

  /** 處理完（或略過）：隊伍繼續走，那個東西往後退出畫面 */
  pass(fled = false, done?: () => void): void {
    const v = this.visitor;
    this.arrive = undefined;
    if (v && fled) {
      // 逃走：一溜煙往右邊消失
      this.tweens.add({ targets: v, x: v.x + 500, alpha: 0, duration: 500, onComplete: () => v.destroy() });
      this.visitor = undefined;
    }
    this.walking = true;
    this.time.delayedCall(700, () => {
      this.walking = false;
      done?.();
    });
  }

  /** 收容：鬼被七爺的鎖鏈帶走，縮進令旗 */
  collect(done: () => void): void {
    const v = this.visitor;
    if (!v) return done();
    this.visitor = undefined;
    const g = this.add.graphics().setDepth(40);
    g.lineStyle(5, 0xc8c8d8, 1);
    g.lineBetween(700, GROUND_Y - 80, v.x, GROUND_Y - 80);
    this.tweens.add({ targets: g, alpha: 0, duration: 600, onComplete: () => g.destroy() });
    this.tweens.add({ targets: v, x: 820, y: GROUND_Y - 200, scale: 0.1, alpha: 0, duration: 700, ease: 'Cubic.in', onComplete: () => { v.destroy(); done(); } });
  }

  /** 驅散：小妖被打散 */
  scatter(done: () => void): void {
    const v = this.visitor;
    if (!v) return done();
    this.visitor = undefined;
    this.cameras.main.shake(200, 0.004);
    v.list.forEach((o, i) => {
      this.tweens.add({ targets: o, x: (o as Phaser.GameObjects.Image).x + 200 + i * 80, y: -200, alpha: 0, duration: 600 });
    });
    this.time.delayedCall(650, () => { v.destroy(); done(); });
  }

  /** 押煞上船：王令一亮，小妖自己飄向隊伍後面的王船，縮成一點金光 */
  toShip(done: () => void): void {
    const v = this.visitor;
    if (!v) return done();
    this.visitor = undefined;
    const flash = this.add.circle(840, GROUND_Y - 260, 30, 0xffd76a, 0.8).setDepth(45);
    this.tweens.add({ targets: flash, scale: 4, alpha: 0, duration: 600, onComplete: () => flash.destroy() });
    v.list.forEach((o, i) => {
      const img = o as Phaser.GameObjects.Image;
      img.setData('float', false);
      this.tweens.add({ targets: img, x: -v.x + 120 - i * 40, y: -120 - i * 20, scale: 0.3, alpha: 0, duration: 1100, delay: 200 + i * 120, ease: 'Sine.inOut' });
    });
    this.time.delayedCall(1500, () => { v.destroy(); done(); });
  }

  /** 線索、問話拿到了：光點收起來 */
  take(done: () => void): void {
    const v = this.visitor;
    if (!v) return done();
    this.tweens.add({ targets: v, alpha: 0, y: v.y - 60, duration: 400, onComplete: () => { v.destroy(); done(); } });
    this.visitor = undefined;
  }

  update(_t: number, dms: number): void {
    const dt = Math.min(0.05, dms / 1000);
    this.t += dt;
    if (this.walking) {
      this.street.update(dt, SPEED);
      if (this.visitor) {
        this.visitor.x -= SPEED * dt;
        if (this.arrive && this.visitor.x <= this.target) {
          this.visitor.x = this.target;
          this.walking = false;
          const cb = this.arrive;
          this.arrive = undefined;
          cb();
        }
        if (!this.arrive && this.visitor.x < -200) {
          this.visitor.destroy();
          this.visitor = undefined;
        }
      }
    }
    for (const m of this.members) {
      m.img.y = m.baseY - (this.walking ? Math.abs(Math.sin(this.t * 8 + m.phase)) * 6 : 0);
    }
    if (this.visitor) {
      for (const o of this.visitor.list) {
        if (o instanceof Phaser.GameObjects.Image && o.getData('float')) o.y = -10 - Math.sin(this.t * 3 + o.x) * 8;
      }
    }
  }
}
