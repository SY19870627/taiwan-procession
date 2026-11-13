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
/** 天空上面切掉一段（街景、隊伍都在下半部），讓下方面板的字可以放大 */
const CROP = 150;

export interface BandData {
  y: number;
  theme: StreetTheme;
  hour: number;
  /** 隊伍的排列：貼圖、x、大小（面向右邊前進） */
  line: [string, number, number][];
  /** 溪水倒流（第三章第三天） */
  reverse?: boolean;
  /** 第四章起：正式背景圖的主題（bg_<art>_far／_near；沒有圖就用 theme 的程式畫街景） */
  art?: string;
}

/** 路上遇到的東西長什麼樣子 */
export interface Visitor {
  tex: string;
  kind: 'person' | 'ghost' | 'imp' | 'clue';
  /** 小妖一次出現幾隻 */
  count?: number;
  /** 第四章牽路仔：從隊伍後面（隊尾）冒出來，不是從前方走近 */
  tail?: boolean;
}

export class BandScene extends Phaser.Scene {
  private street!: Street;
  private members: { img: Phaser.GameObjects.Image; baseY: number; phase: number }[] = [];
  private walking = false;
  private visitor?: Phaser.GameObjects.Container;
  private target = 0;
  private arrive?: () => void;
  private t = 0;
  private reverse = false;
  private hour?: number;
  private art?: string;

  constructor() {
    super('band');
  }

  static height(): number {
    return Math.round((FH - CROP) * ZOOM);
  }

  create(data: BandData): void {
    this.members = [];
    this.walking = false;
    this.visitor = undefined;
    this.arrive = undefined;
    this.cameras.main.setViewport(0, data.y, W, BandScene.height()).setZoom(ZOOM).centerOn(FW / 2, CROP + (FH - CROP) / 2);
    this.cameras.main.fadeIn(400, 10, 8, 18);
    this.reverse = !!data.reverse;
    this.hour = data.hour;
    this.art = data.art;
    this.street = new Street(this, { night: false, theme: data.theme, hour: data.hour, reverse: this.reverse, art: this.art });
    // 第三章的正式背景圖如果比這個畫面晚載到（例如直接用網址跳進來），載到時換上
    const onArt = (k: string) => {
      const theme = this.street.themeName;
      if (!k.startsWith(`bg_${theme}_`) && !(this.art && k.startsWith(`bg_${this.art}_`))) return;
      this.street.destroy();
      this.street = new Street(this, { night: false, theme, hour: this.hour, reverse: this.reverse, art: this.art });
    };
    this.game.events.on('artloaded', onArt);
    this.events.once('shutdown', () => this.game.events.off('artloaded', onArt));
    // 隊伍（每一章不同，見 content/chapter.ts 的 band）
    for (const [key, x, sc] of data.line) {
      const img = this.add.image(x, GROUND_Y + 10, key).setOrigin(0.5, 1).setScale(sc * BIG).setDepth(20 + x / 100);
      this.members.push({ img, baseY: GROUND_Y + 10, phase: Math.random() * 6 });
    }
  }

  setHour(hour: number): void {
    this.hour = hour;
    this.street.setHour(hour);
  }

  /** 換街景（第三章岔路後：庄頭線進鴨母寮，會合後回到庄頭）：畫面暗一下再換 */
  setTheme(theme: StreetTheme, hour: number, done?: () => void): void {
    if (this.street.themeName === theme) return done?.();
    const cam = this.cameras.main;
    cam.fadeOut(220, 10, 8, 18);
    cam.once('camerafadeoutcomplete', () => {
      this.street.destroy();
      this.hour = hour;
      this.street = new Street(this, { night: false, theme, hour, reverse: this.reverse, art: this.art });
      cam.fadeIn(320, 10, 8, 18);
      done?.();
    });
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
    if (v.tail) {
      // 隊尾：從畫面左邊（隊伍後面）追上來，停在最後一個人旁邊；牠面向隊伍（朝右）
      for (const o of c.list) if (o instanceof Phaser.GameObjects.Image) o.setFlipX(false);
      const last = Math.min(...this.members.map((m) => m.img.x), 400);
      c.setX(-160).setData('tailing', true);
      this.arrive = undefined;
      this.walking = true;
      this.tweens.add({
        targets: c, x: Math.max(80, last - 110), duration: 1400, ease: 'Sine.out',
        onComplete: () => { c.setData('tailing', false); this.walking = false; done(); },
      });
      return;
    }
    this.target = 1020;
    this.arrive = done;
    this.walking = true;
  }

  /** 換街景與正式背景圖（第四章停駕點：車行 garage）；畫面暗一下再換 */
  setScene(theme: StreetTheme, art: string | undefined, hour: number, done?: () => void): void {
    if (this.street.themeName === theme && this.art === art) return done?.();
    this.art = art;
    const cam = this.cameras.main;
    cam.fadeOut(220, 10, 8, 18);
    cam.once('camerafadeoutcomplete', () => {
      this.street.destroy();
      this.hour = hour;
      this.street = new Street(this, { night: false, theme, hour, reverse: this.reverse, art });
      cam.fadeIn(320, 10, 8, 18);
      done?.();
    });
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

  /** 隊伍裡太子神轎的位置（第三章；其他章取中間） */
  private palanquin(): { x: number; y: number } {
    const m = this.members.find((x) => x.img.texture.key === 'w3_palanquin') ?? this.members[Math.floor(this.members.length / 2)];
    return m ? { x: m.img.x, y: m.img.y - m.img.displayHeight * 0.75 } : { x: 600, y: GROUND_Y - 200 };
  }

  /**
   * 乾坤圈（第三章）：圈從太子轎裡轉著飛出去，一隻一隻打爆小妖（水花＋火花），畫面震一下，圈再飛回來。
   */
  ring(done: () => void): void {
    const v = this.visitor;
    if (!v) return done();
    this.visitor = undefined;
    const from = this.palanquin();
    const r = this.add.image(from.x, from.y, 'x3_ring').setDepth(46).setScale(1.6);
    this.tweens.add({ targets: r, angle: 720 * 3, duration: 1500 });
    const imps = v.list.filter((o): o is Phaser.GameObjects.Image => o instanceof Phaser.GameObjects.Image);
    const hit = (i: number) => {
      if (i >= imps.length) {
        // 圈飛回轎上
        v.destroy();
        this.tweens.add({ targets: r, x: from.x, y: from.y, scale: 1.2, duration: 420, ease: 'Cubic.in', onComplete: () => { r.destroy(); done(); } });
        return;
      }
      const img = imps[i];
      img.setData('float', false);
      const tx = v.x + img.x;
      const ty = v.y + img.y - img.displayHeight / 2;
      this.tweens.add({
        targets: r, x: tx, y: ty, duration: i ? 160 : 300, ease: 'Sine.out',
        onComplete: () => {
          this.burst(tx, ty);
          img.destroy();
          this.cameras.main.shake(120, 0.006);
          hit(i + 1);
        },
      });
    };
    hit(0);
  }

  /** 小妖炸開：水花＋金色火花 */
  private burst(x: number, y: number): void {
    const flash = this.add.circle(x, y, 26, 0xfff1b0, 0.9).setDepth(47);
    this.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 320, onComplete: () => flash.destroy() });
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const d = this.add.circle(x, y, k % 2 ? 7 : 5, k % 2 ? 0x9fd8ff : 0xffb347, 0.95).setDepth(47);
      this.tweens.add({ targets: d, x: x + Math.cos(a) * 110, y: y + Math.sin(a) * 90 + 40, alpha: 0, duration: 520, ease: 'Cubic.out', onComplete: () => d.destroy() });
    }
  }

  /** 風火輪追（或追回被威名嚇跑的鬼）：一道火痕從隊伍衝到牠身後，把牠揪回隊伍前面 */
  chase(done: () => void): void {
    const v = this.visitor;
    if (!v) return done();
    const from = this.palanquin();
    const trail = this.add.image(from.x, GROUND_Y - 10, 'x3_firetrail').setOrigin(0, 0.5).setDepth(44).setScale(0.3, 1.2);
    const wheel = this.add.image(from.x, GROUND_Y - 20, 'x3_wheel').setDepth(45).setScale(1.6);
    this.tweens.add({ targets: wheel, angle: 1080, duration: 900 });
    // 牠先往右逃一段
    this.tweens.add({ targets: v, x: v.x + 220, duration: 300, ease: 'Cubic.out' });
    this.tweens.add({
      targets: wheel, x: v.x + 300, duration: 420, delay: 120, ease: 'Cubic.in',
      onUpdate: () => trail.setScale(Math.max(0.3, (wheel.x - from.x) / 160), 1.2),
      onComplete: () => {
        this.cameras.main.shake(150, 0.005);
        this.tweens.add({ targets: [v], x: this.target, duration: 380, ease: 'Back.out' });
        this.tweens.add({ targets: wheel, x: from.x, alpha: 0, duration: 420, delay: 100, onComplete: () => wheel.destroy() });
        this.tweens.add({ targets: trail, alpha: 0, duration: 500, onComplete: () => { trail.destroy(); done(); } });
      },
    });
  }

  /** 太子親斬：火尖槍一道紅光劈下，鬼散成黑煙 */
  smite(done: () => void): void {
    const v = this.visitor;
    if (!v) return done();
    this.visitor = undefined;
    const slash = this.add.rectangle(v.x, v.y - 140, 18, 360, 0xff6a3a, 0.9).setDepth(46).setAngle(18).setScale(1, 0);
    this.tweens.add({ targets: slash, scaleY: 1, duration: 140, yoyo: true, hold: 120, onComplete: () => slash.destroy() });
    this.cameras.main.shake(260, 0.01);
    for (let k = 0; k < 8; k++) {
      const s = this.add.circle(v.x + Phaser.Math.Between(-50, 50), v.y - Phaser.Math.Between(40, 200), Phaser.Math.Between(18, 34), 0x1a1420, 0.7).setDepth(45);
      this.tweens.add({ targets: s, y: s.y - 120, scale: 2, alpha: 0, duration: 900, delay: 120 + k * 30, onComplete: () => s.destroy() });
    }
    this.tweens.add({ targets: v, alpha: 0, duration: 500, delay: 150, onComplete: () => { v.destroy(); done(); } });
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
    if (!this.walking) this.street.idle(dt);
    if (this.walking) {
      this.street.update(dt, SPEED);
      if (this.visitor && !this.visitor.getData('tailing')) {
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
