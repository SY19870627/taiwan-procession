/**
 * 夜晚：斬妖（靈界）。戰鬥邏輯在 core/battle.ts，這裡只負責畫出來。
 * 直式畫面：戰場（1280×720 的邏輯座標）整片縮小放進上方的戰鬥帶；
 * 下方的操作面板（時鐘、陣頭血量、法術按鈕）在另一個疊上去的場景 NightHud。
 */
import Phaser from 'phaser';
import { C, H, W, FIELD_W as FW, FIELD_H as FH, GROUND_Y, TIME_SCALE } from '../theme';
import { UNITS } from '../core/units';
import { Battle, BLESS_CD, SMITE_CD, type BattleEvent, type Fighter, type Side } from '../core/battle';
import { NIGHTS, nightSpawns } from '../content/nights';
import { Street } from '../art/backdrop';
import { run } from '../state';
import type { UnitId } from '../core/units';
import { palanquinStats, unitStats } from '../core/upgrades';
import { button, floatText, fullscreenButton, panel, txt, type Button } from '../ui/widgets';

export function availableUnits(): UnitId[] {
  const list: UnitId[] = ['bajiang', 'qiye', 'xingshi', 'paoshou'];
  if (run.allied) list.push('kaijiang');
  return list;
}

/** 戰鬥帶：畫面上的位置與縮放 */
export const BAND_Y = 132;
const ZOOM = W / FW;
export const BAND_H = Math.round(FH * ZOOM);
/** 戰場裡的人物放大一點，縮小後才看得清楚 */
const BIG = 1.6;

interface View {
  c: Phaser.GameObjects.Container;
  imgs: Phaser.GameObjects.Image[];
  hp: Phaser.GameObjects.Graphics;
  baseY: number;
  phase: number;
}

const UNIT_TEX: Record<string, string[]> = {
  qiye: ['qiye', 'baye'],
  bajiang: ['bajiang0', 'bajiang1'],
  xingshi: ['lion'],
  paoshou: ['paoshou', 'folk2'],
  kaijiang: ['kaijiang'],
  shiju: ['shiju_calm'],
};

export class NightScene extends Phaser.Scene {
  battle!: Battle;
  n = 1;
  private views = new Map<number, View>();
  private street?: Street;
  private palImg!: Phaser.GameObjects.Image;
  private palHp!: Phaser.GameObjects.Graphics;
  hud!: NightHud;
  speed = 1;
  private over = false;
  private t = 0;

  constructor() {
    super('night');
  }

  create(data: { night: number }): void {
    this.n = data.night ?? 1;
    this.views = new Map();
    this.over = false;
    this.speed = 1;
    this.t = 0;
    const def = NIGHTS[this.n];
    const units = availableUnits().map((id) => ({ id, side: (run.sides[id] ?? 1) as Side, stats: unitStats(id, run.ups, run.followers) }));
    this.battle = new Battle({
      mode: def.mode, fieldW: FW, duration: def.duration, spawns: nightSpawns(this.n, run.tonight), units, palanquin: palanquinStats(run.ups),
      boss: {
        hpMul: (run.b.xiaoyun === 'invited' ? 0.8 : 1) * (run.shijuEnraged ? 1.15 : 1),
        atkMul: run.shijuEnraged ? 1.5 : 1,
        chargeEvery: run.shijuEnraged ? 5 : 8,
        skipCharges: run.b.xiaoyun === 'invited' ? 1 : 0,
      },
      followers: run.followers, morale: run.morale, intel: run.intel,
    });
    // 戰鬥帶：整片戰場縮小放進畫面上方
    this.cameras.main.setViewport(0, BAND_Y, W, BAND_H).setZoom(ZOOM).centerOn(FW / 2, FH / 2);
    this.cameras.main.fadeIn(500, 10, 8, 18);
    this.drawBackground(def.mode);
    this.drawPalanquin();

    // 靈界色調：整個畫面罩一層紫藍色
    this.add.rectangle(0, 0, FW, FH, 0x3a1a6a, 0.16).setOrigin(0).setDepth(200).setBlendMode(Phaser.BlendModes.MULTIPLY);
    for (let i = 0; i < 12; i++) {
      const s = this.add.image(Phaser.Math.Between(0, FW), Phaser.Math.Between(GROUND_Y - 40, FH), 'smoke').setTint(0x9b7cff).setAlpha(0.1).setScale(Phaser.Math.FloatBetween(2, 4)).setDepth(150);
      this.tweens.add({ targets: s, x: s.x + Phaser.Math.Between(-150, 150), alpha: 0.03, duration: 4000 + i * 300, yoyo: true, repeat: -1 });
    }
    this.scene.launch('nighthud', { night: this });
    this.events.once('shutdown', () => this.scene.stop('nighthud'));
  }

  /** 戰場裡的浮動文字：戰場縮小了，字要放大 */
  private ft(x: number, y: number, s: string, color: number, size = 26): void {
    floatText(this, x, y, s, color, Math.round(size * 1.7));
  }

  /** 離開夜戰：戰鬥帶和操作面板一起淡出 */
  leave(key: string, data?: object, ms = 400): void {
    this.hud.cameras.main.fadeOut(ms, 10, 8, 18);
    this.cameras.main.fadeOut(ms, 10, 8, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('nighthud');
      this.scene.start(key, data);
    });
  }

  // ---------- 背景 ----------
  private drawBackground(mode: string): void {
    if (mode === 'patrol') {
      this.street = new Street(this, { night: true, theme: 'city' });
      return;
    }
    const sky = this.add.graphics().setDepth(-100);
    sky.fillGradientStyle(0x0b0a1c, 0x0b0a1c, 0x231d40, 0x231d40, 1);
    sky.fillRect(0, 0, FW, GROUND_Y);
    this.add.circle(FW * 0.12, 110, 40, 0xfff3c4, 0.85).setDepth(-99);
    this.add.tileSprite(0, GROUND_Y - 130, FW, 260, 'mtnFarN').setOrigin(0, 1).setDepth(-95);
    if (this.n === 3) {
      for (let i = 0; i < Math.ceil(FW / 240) + 1; i++) this.add.image(i * 240, GROUND_Y - 110, `ruralN${i % 2 === 0 ? 0 : 2}`).setOrigin(0, 1).setDepth(-92);
    } else {
      for (let i = 0; i < Math.ceil(FW / 220) + 1; i++) this.add.image(i * 230 - 60, GROUND_Y - 110, `shopN${(i * 3) % 8}`).setOrigin(0, 1).setDepth(-92).setTint(0x6a6080);
    }
    const temple = this.n === 2 ? 'temple_zhuang' : 'temple_huize';
    this.add.image(this.battle.palanquin.x, GROUND_Y - 80, temple).setOrigin(0.5, 1).setScale(0.82).setDepth(-80).setTint(0xb8a0c0);
    // 廟埕石板
    const g = this.add.graphics().setDepth(-70);
    g.fillStyle(0x2a2632, 1);
    g.fillRect(0, GROUND_Y - 84, FW, FH - GROUND_Y + 84);
    g.lineStyle(1, 0x3a3444, 1);
    for (let y = GROUND_Y - 84; y < FH; y += 36) g.lineBetween(0, y, FW, y);
    for (let x = -200; x < FW + 200; x += 70) g.lineBetween(x, GROUND_Y - 84, x + (x - FW / 2) * 0.4, FH);
    // 燈籠串
    for (let i = 0; i < Math.ceil(FW / 120); i++) {
      const l = this.add.image(30 + i * 120, 150 + Math.abs(Math.sin(i * 0.9)) * 18, 'lantern').setScale(0.7).setDepth(-60);
      this.tweens.add({ targets: l, angle: { from: -3, to: 3 }, duration: 1500 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  private drawPalanquin(): void {
    const p = this.battle.palanquin;
    const glow = this.add.circle(p.x, GROUND_Y - 80, 110, 0xffd76a, 0.12).setDepth(5);
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.22, duration: 1300, yoyo: true, repeat: -1 });
    this.palImg = this.add.image(p.x, GROUND_Y + 10, 'palanquin').setOrigin(0.5, 1).setScale(0.78 * BIG).setDepth(20);
    this.palHp = this.add.graphics().setDepth(210);
  }

  // ---------- 每幀 ----------
  update(_t: number, dms: number): void {
    const dt = Math.min(0.05, dms / 1000);
    this.t += dt;
    if (!this.over) {
      const steps = this.speed * TIME_SCALE;
      for (let i = 0; i < steps; i++) this.battle.step(dt);
      if (this.street) this.street.update(dt, 40 * this.speed);
    }
    this.sync();
    this.handle(this.battle.drainEvents());
  }

  private viewFor(f: Fighter): View {
    let v = this.views.get(f.uid);
    if (v) return v;
    const c = this.add.container(f.x, GROUND_Y + 10);
    const imgs: Phaser.GameObjects.Image[] = [];
    if (f.team === 'unit') {
      const keys = UNIT_TEX[f.id] ?? ['folk0'];
      keys.forEach((k, i) => {
        const img = this.add.image((i - (keys.length - 1) / 2) * 34 * BIG, (i % 2) * 6, k).setOrigin(0.5, 1).setScale(0.72 * BIG);
        img.setData('bx', img.x);
        // 陣頭面向外側（面向妖怪來的方向）
        img.setFlipX(f.side === -1);
        imgs.push(img);
      });
    } else {
      const key = f.id === 'boss' ? 'shiju' : (f.id as string);
      const img = this.add.image(0, 0, key).setOrigin(0.5, 1).setScale((f.id === 'boss' ? 0.95 : 0.9) * BIG);
      img.setData('bx', 0);
      // 妖怪面向神轎
      img.setFlipX(f.side === 1);
      imgs.push(img);
    }
    c.add(imgs);
    const hp = this.add.graphics();
    c.add(hp);
    const baseY = GROUND_Y + 10 + (f.uid % 3) * 8;
    c.setDepth(30 + (f.uid % 3) + (f.team === 'enemy' ? 5 : 0));
    v = { c, imgs, hp, baseY, phase: Math.random() * 6 };
    this.views.set(f.uid, v);
    if (f.team === 'enemy') {
      c.setAlpha(0);
      this.tweens.add({ targets: c, alpha: 1, duration: 400 });
    }
    return v;
  }

  private sync(): void {
    const seen = new Set<number>();
    for (const f of this.battle.fighters) {
      const v = this.viewFor(f);
      seen.add(f.uid);
      v.c.x = f.x;
      // 動作：走路上下晃、打架往前戳、喘息時趴低
      const dir = f.team === 'unit' ? f.side : -f.side;
      let y = v.baseY;
      let dx = 0;
      if (f.state === 'walk') y -= Math.abs(Math.sin(this.t * 8 + v.phase)) * 5;
      if (f.state === 'fight') dx = Math.max(0, Math.sin(this.t * 9 + v.phase)) * 8 * dir;
      if (f.state === 'charge') y -= Math.abs(Math.sin(this.t * 20)) * 10;
      if (f.state === 'breath') y += 6;
      const dazed = f.team === 'enemy' && f.stun > 0;
      if (f.team === 'enemy' && f.id !== 'kui' && f.id !== 'boss') y -= 10 + Math.sin(this.t * 3 + v.phase) * 6;
      v.c.y = y;
      for (const img of v.imgs) img.x = (img.getData('bx') as number) + dx;
      for (const img of v.imgs) {
        if (f.flash > 0.5) img.setTintFill(0xffffff);
        else if (f.id === 'boss' && f.state === 'breath') img.setTint(0xffb0b0);
        else if (dazed) img.setTint(0xc8c8ff);
        else if (f.team === 'enemy' && f.slow > 0) img.setTint(0xffc890);
        else img.clearTint();
        img.angle = dazed ? Math.sin(this.t * 20) * 8 : 0;
      }
      // 血條
      v.hp.clear();
      if (f.alive && f.hp < f.maxHp && f.id !== 'boss') {
        const w = f.team === 'unit' ? 80 : 60;
        const top = f.team === 'unit' ? -240 : -140;
        v.hp.fillStyle(0x000000, 0.6);
        v.hp.fillRect(-w / 2 - 2, top - 2, w + 4, 14);
        v.hp.fillStyle(f.team === 'unit' ? 0x6fe08a : 0xd04aff, 1);
        v.hp.fillRect(-w / 2, top, w * Math.max(0, f.hp / f.maxHp), 10);
      }
      if (!f.alive && v.c.alpha === 1 && !v.c.getData('dying')) {
        v.c.setData('dying', true);
        this.tweens.add({ targets: v.c, alpha: 0, y: v.c.y + 10, duration: 500 });
      }
    }
    for (const [uid, v] of this.views) {
      if (!seen.has(uid)) {
        this.tweens.add({ targets: v.c, alpha: 0, duration: 300, onComplete: () => v.c.destroy() });
        this.views.delete(uid);
      }
    }
    // 神轎
    const p = this.battle.palanquin;
    if (p.flash > 0.5) this.palImg.setTint(0xff8080);
    else this.palImg.clearTint();
    this.palHp.clear();
    const w = 190;
    this.palHp.fillStyle(0x000000, 0.65);
    this.palHp.fillRoundedRect(p.x - w / 2 - 4, GROUND_Y - 300, w + 8, 24, 8);
    this.palHp.fillStyle(p.hp / p.maxHp > 0.35 ? 0xffd76a : 0xff5a4a, 1);
    this.palHp.fillRoundedRect(p.x - w / 2, GROUND_Y - 296, w * (p.hp / p.maxHp), 16, 6);
  }

  // ---------- 特效 ----------
  private handle(events: BattleEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'hit':
          if (e.weak) this.ft(e.x, GROUND_Y - 140, `破綻！${e.dmg}`, 0xff8a8a, 24);
          break;
        case 'shot':
          this.shot(e.fromX, e.toX, e.kind);
          break;
        case 'quake':
          this.ring(e.x, e.r, 0xe9b949);
          break;
        case 'capture':
          this.capture(e.x);
          break;
        case 'die': {
          const sm = this.add.image(e.x, GROUND_Y - 30, 'smoke').setTint(0x9b7cff).setAlpha(0.6).setDepth(60);
          this.tweens.add({ targets: sm, scale: 2.5, alpha: 0, y: sm.y - 50, duration: 700, onComplete: () => sm.destroy() });
          break;
        }
        case 'smite':
          this.lightning(e.x, e.r);
          break;
        case 'bless':
          this.ring(this.battle.palanquin.x, 260, 0x8ff0a4);
          this.ft(this.battle.palanquin.x, GROUND_Y - 200, '淨符・回復', 0x8ff0a4);
          break;
        case 'palanquin':
          this.cameras.main.shake(120, 0.004);
          break;
        case 'charge':
          this.ft(FW / 2, 200, '石駒衝鋒！', 0xff6a6a, 40);
          this.cameras.main.shake(500, 0.006);
          break;
        case 'chain':
          this.chain(e.fromX, e.toX);
          break;
        case 'block':
          this.ft(e.x, GROUND_Y - 150, '格擋', 0xbfe0ff, 22);
          break;
        case 'knock':
          this.ft(e.x, GROUND_Y - 120, '震退', 0xffd76a, 22);
          break;
        case 'callout':
          this.ft(FW / 2, 250, '小芸：「石駒，不要！」', 0xfff3c4, 36);
          break;
        case 'breath':
          this.ft(this.battle.palanquin.x + 160, GROUND_Y - 180, run.intel.bellyWound ? '喘息中・打肚子的舊傷！' : '喘息中', 0xffd0d0, 26);
          break;
        case 'end':
          // 雞啼：剩下的妖怪散去
          if (e.result === 'win') {
            for (const [uid, v] of this.views) {
              const f = this.battle.fighters.find((x) => x.uid === uid);
              if (f?.team === 'enemy') this.tweens.add({ targets: v.c, alpha: 0, y: v.c.y - 30, duration: 800 });
            }
          }
          this.time.delayedCall(600, () => this.hud.finish(e.result));
          this.over = true;
          break;
        default:
          break;
      }
    }
  }

  private shot(from: number, to: number, kind: 'firecracker' | 'flag'): void {
    const p = this.add.image(from, GROUND_Y - 70, 'spark').setTint(kind === 'firecracker' ? 0xff4a3a : 0x8ff0c4).setDepth(70).setScale(0.9);
    this.tweens.add({
      targets: p, x: to, duration: 260, ease: 'Linear',
      onUpdate: (tw) => (p.y = GROUND_Y - 70 - Math.sin(tw.progress * Math.PI) * 80),
      onComplete: () => {
        p.destroy();
        for (let i = 0; i < 8; i++) {
          const s = this.add.image(to, GROUND_Y - 50, 'spark').setTint(Phaser.Math.RND.pick([0xff4a3a, 0xffd76a])).setScale(0.5).setDepth(70);
          this.tweens.add({ targets: s, x: to + Phaser.Math.Between(-40, 40), y: s.y - Phaser.Math.Between(10, 60), alpha: 0, duration: 400, onComplete: () => s.destroy() });
        }
      },
    });
  }

  /** 勾魂鎖：從七爺八爺甩出一條鎖鏈，把遠處的妖怪拉過來 */
  private chain(fromX: number, toX: number): void {
    const g = this.add.graphics().setDepth(68);
    const y = GROUND_Y - 60;
    g.lineStyle(4, 0xc8c8d8, 1);
    g.lineBetween(fromX, y, toX, y);
    for (let x = Math.min(fromX, toX); x < Math.max(fromX, toX); x += 14) g.strokeCircle(x, y, 4);
    this.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
    this.ft((fromX + toX) / 2, GROUND_Y - 130, '勾魂鎖！', 0xe8e8ff, 26);
  }

  private ring(x: number, r: number, color: number): void {
    const g = this.add.circle(x, GROUND_Y - 20, 10, color, 0).setStrokeStyle(4, color, 0.9).setDepth(65);
    g.setScale(1, 0.35);
    this.tweens.add({ targets: g, radius: r, alpha: 0, duration: 450, onComplete: () => g.destroy() });
  }

  private capture(x: number): void {
    this.ft(x, GROUND_Y - 120, '捉拿！', 0x9fe8c0, 30);
    const beam = this.add.rectangle(x, GROUND_Y - 300, 30, 600, 0xffffff, 0.5).setDepth(66);
    this.tweens.add({ targets: beam, scaleX: 0, alpha: 0, duration: 500, onComplete: () => beam.destroy() });
  }

  private lightning(x: number, r: number): void {
    this.cameras.main.flash(180, 200, 180, 255);
    const g = this.add.graphics().setDepth(260);
    g.lineStyle(6, 0xe8d8ff, 1);
    g.beginPath();
    let px = x;
    g.moveTo(px, 0);
    for (let y = 40; y <= GROUND_Y; y += 40) {
      px = x + Phaser.Math.Between(-30, 30);
      g.lineTo(px, y);
    }
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => g.destroy() });
    this.ring(x, r, 0xc8a0ff);
    this.ft(x, GROUND_Y - 240, '天令！', 0xe8d8ff, 36);
  }
}

/** 夜戰的操作面板：上方標題與時間、下方陣頭血量與法術按鈕 */
export class NightHud extends Phaser.Scene {
  private night!: NightScene;
  private clock!: Phaser.GameObjects.Text;
  private moon!: Phaser.GameObjects.Arc;
  private capTxt!: Phaser.GameObjects.Text;
  private bossBar?: Phaser.GameObjects.Graphics;
  private smiteBtn!: Button;
  private smiteFill!: Phaser.GameObjects.Rectangle;
  private blessFill!: Phaser.GameObjects.Rectangle;
  private blessBtn!: Button;
  private cards: { uid: number; bar: Phaser.GameObjects.Graphics; hpTxt: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text; x: number; y: number; w: number }[] = [];
  private palBar!: Phaser.GameObjects.Graphics;
  private palTxt!: Phaser.GameObjects.Text;
  private readonly moonX = 30;
  private moonW = W - 130;
  private skillW = 300;
  private skillH = 130;

  constructor() {
    super('nighthud');
  }

  private get battle(): Battle {
    return this.night.battle;
  }

  create(data: { night: NightScene }): void {
    this.night = data.night;
    this.night.hud = this;
    this.cards = [];
    this.cameras.main.fadeIn(500, 10, 8, 18);
    const def = NIGHTS[this.night.n];

    // 上方：標題、地點、時間、月亮進度
    txt(this, 24, 16, def.title, 32, C.gold, { serif: true });
    txt(this, 24, 58, def.place, 20, C.paper, { bold: false });
    this.clock = txt(this, W - 96, 34, '19:00', 30, C.paper).setOrigin(1, 0.5);
    this.add.rectangle(this.moonX, 106, this.moonW, 6, 0x3a3442).setOrigin(0, 0.5);
    txt(this, this.moonX + this.moonW + 10, 106, '雞啼', 20, C.gold).setOrigin(0, 0.5);
    this.moon = this.add.circle(this.moonX, 106, 12, 0xfff3c4);
    fullscreenButton(this);

    // 戰鬥帶的框
    const fr = this.add.graphics();
    fr.lineStyle(3, C.gold, 0.8);
    fr.lineBetween(0, BAND_Y - 2, W, BAND_Y - 2);
    fr.lineBetween(0, BAND_Y + BAND_H + 1, W, BAND_Y + BAND_H + 1);
    const sn = def.sideNames;
    txt(this, 10, BAND_Y + 8, `◀ ${sn[-1 as Side]}`, 18, C.muted).setAlpha(0.8);
    txt(this, W - 10, BAND_Y + 8, `${sn[1 as Side]} ▶`, 18, C.muted).setOrigin(1, 0).setAlpha(0.8);

    // 下方面板
    const py = BAND_Y + BAND_H + 4;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1526, 0x1a1526, 0x0e0b16, 0x0e0b16, 1);
    bg.fillRect(0, py, W, H - py);

    // 捉拿數、速度
    let y = py + 22;
    this.capTxt = txt(this, 24, y, '捉拿 0', 26, 0x9fe8c0);
    const sp = button(this, W - 90, y + 16, 140, 52, '速度 x1', () => {
      this.night.speed = this.night.speed === 1 ? 2 : 1;
      sp.setLabel(`速度 x${this.night.speed}`);
    }, { size: 20, fill: 0x2a2236 });
    y += 64;

    // 魔王的煞氣
    if (this.battle.setup.mode === 'boss') {
      txt(this, 24, y, '石駒的煞氣', 20, 0xd9b0ff);
      this.bossBar = this.add.graphics();
      this.bossBar.setData('y', y + 30);
      y += 66;
    }

    // 神轎
    txt(this, 24, y, '神轎', 22, C.gold);
    this.palTxt = txt(this, W - 24, y, '', 20, C.paper, { bold: false }).setOrigin(1, 0);
    this.palBar = this.add.graphics();
    this.palBar.setData('y', y + 32);
    y += 66;

    // 陣頭：左側一欄、右側一欄
    const units = this.battle.fighters.filter((f) => f.team === 'unit');
    const colW = (W - 24 * 2 - 16) / 2;
    txt(this, 24, y, `◀ ${sn[-1 as Side]}`, 18, C.muted);
    txt(this, 24 + colW + 16, y, `${sn[1 as Side]} ▶`, 18, C.muted);
    y += 30;
    const rows = { [-1]: 0, [1]: 0 } as Record<number, number>;
    for (const f of units) {
      const col = f.side === -1 ? 0 : 1;
      const cx = 24 + col * (colW + 16);
      const cy = y + rows[f.side] * 104;
      rows[f.side]++;
      const g = this.add.graphics();
      g.fillStyle(0x241d32, 1);
      g.fillRoundedRect(cx, cy, colW, 94, 12);
      g.lineStyle(2, 0x5a4a6e, 1);
      g.strokeRoundedRect(cx, cy, colW, 94, 12);
      const icon = this.add.image(cx + 44, cy + 88, (UNIT_TEX[f.id] ?? ['folk0'])[0]).setOrigin(0.5, 1);
      icon.setScale(Math.min(80 / icon.height, 76 / icon.width));
      const name = txt(this, cx + 88, cy + 14, UNITS[f.id as keyof typeof UNITS]?.name ?? f.id, 22, C.paper);
      const hpTxt = txt(this, cx + colW - 12, cy + 18, '', 16, C.muted, { bold: false }).setOrigin(1, 0);
      const bar = this.add.graphics();
      this.cards.push({ uid: f.uid, bar, hpTxt, name, x: cx + 88, y: cy + 60, w: colW - 102 });
    }

    // 法術：冷卻制（天令 15 秒、淨符 25 秒）
    const by = H - 30 - this.skillH / 2;
    this.skillW = (W - 24 * 2 - 24) / 2;
    const sx = 24 + this.skillW / 2;
    const bx = W - 24 - this.skillW / 2;
    txt(this, sx, by - this.skillH / 2 - 26, '雷擊最多妖怪的地方', 17, C.muted, { bold: false }).setOrigin(0.5);
    txt(this, bx, by - this.skillH / 2 - 26, '神轎與陣頭回血', 17, C.muted, { bold: false }).setOrigin(0.5);
    this.smiteBtn = button(this, sx, by, this.skillW, this.skillH, '天令', () => this.battle.smite(), { size: 36, fill: 0x5a2a8a });
    this.blessBtn = button(this, bx, by, this.skillW, this.skillH, '淨符', () => this.battle.bless(), { size: 36, fill: 0x2f6f5a });
    this.smiteFill = this.add.rectangle(sx - this.skillW / 2, by - this.skillH / 2, this.skillW, this.skillH, 0x000000, 0.45).setOrigin(0, 0).setDepth(5);
    this.blessFill = this.add.rectangle(bx - this.skillW / 2, by - this.skillH / 2, this.skillW, this.skillH, 0x000000, 0.45).setOrigin(0, 0).setDepth(5);
    for (const b of [this.smiteBtn, this.blessBtn]) b.setDepth(4);
  }

  update(): void {
    if (!this.night?.battle) return;
    const b = this.battle;
    const prog = b.progress;
    const hours = 19 + prog * 10;
    const hh = Math.floor(hours) % 24;
    this.clock.setText(`${String(hh).padStart(2, '0')}:${String(Math.floor(((hours % 1) * 60) / 10) * 10).padStart(2, '0')}`);
    this.moon.x = this.moonX + this.moonW * prog;
    this.capTxt.setText(`捉拿 ${b.captured}`);
    this.smiteBtn.setEnabled(b.canSmite());
    this.blessBtn.setEnabled(b.canBless());
    // 冷卻：按鈕上蓋一層會慢慢縮短的暗色，並顯示剩餘秒數
    this.smiteFill.width = this.skillW * (b.smiteCd / SMITE_CD);
    this.blessFill.width = this.skillW * (b.blessCd / BLESS_CD);
    this.smiteBtn.setLabel(b.smiteCd > 0 ? `天令 ${Math.ceil(b.smiteCd)}秒` : '天令');
    this.blessBtn.setLabel(b.blessCd > 0 ? `淨符 ${Math.ceil(b.blessCd)}秒` : '淨符');
    const bw = W - 48;
    if (this.bossBar) {
      const boss = b.boss;
      const frac = boss ? Math.max(0, boss.hp / boss.maxHp) : 0;
      const y = this.bossBar.getData('y') as number;
      this.bossBar.clear();
      this.bossBar.fillStyle(0x000000, 0.7);
      this.bossBar.fillRoundedRect(24, y - 2, bw, 22, 8);
      this.bossBar.fillStyle(0x9b3cff, 1);
      this.bossBar.fillRoundedRect(26, y, (bw - 4) * frac, 18, 6);
    }
    const p = b.palanquin;
    const py = this.palBar.getData('y') as number;
    this.palBar.clear();
    this.palBar.fillStyle(0x000000, 0.7);
    this.palBar.fillRoundedRect(24, py - 2, bw, 22, 8);
    this.palBar.fillStyle(p.hp / p.maxHp > 0.35 ? 0xffd76a : 0xff5a4a, 1);
    this.palBar.fillRoundedRect(26, py, (bw - 4) * Math.max(0, p.hp / p.maxHp), 18, 6);
    this.palTxt.setText(`${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`);
    for (const c of this.cards) {
      const f = b.fighters.find((x) => x.uid === c.uid);
      const frac = f && f.alive ? Math.max(0, f.hp / f.maxHp) : 0;
      c.bar.clear();
      c.bar.fillStyle(0x000000, 0.6);
      c.bar.fillRoundedRect(c.x - 2, c.y - 2, c.w + 4, 18, 6);
      c.bar.fillStyle(frac > 0.35 ? 0x6fe08a : 0xff8a5a, 1);
      c.bar.fillRoundedRect(c.x, c.y, c.w * frac, 14, 5);
      c.hpTxt.setText(frac > 0 ? `${Math.ceil(f!.hp)}` : '倒下');
      c.name.setAlpha(frac > 0 ? 1 : 0.45);
    }
  }

  finish(result: 'win' | 'lose'): void {
    const captured = this.battle.captured;
    const mode = this.battle.setup.mode;
    if (result === 'win' && mode === 'boss') {
      run.shijuJoined = true;
      run.totalCaptured += captured;
      this.night.leave('story', { id: 'recall', next: { key: 'end' } }, 800);
      return;
    }
    if (result === 'lose' && mode === 'boss' && this.battle.palanquin.hp > 0) {
      // 天亮了還沒喚回：石駒退回山裡，再來一次
      run.retries++;
      run.incense = Math.max(run.incense, 30);
      this.night.leave('story', { id: 'retreat', next: { key: 'night', data: { night: 3 } } }, 800);
      return;
    }
    const pw = 660;
    const ph = 360;
    const x = (W - pw) / 2;
    const y = (H - ph) / 2 - 20;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.45).setOrigin(0).setDepth(960).setInteractive();
    panel(this, x, y, pw, ph).setDepth(961);
    if (result === 'win') {
      run.captured = captured;
      run.totalCaptured += captured;
      txt(this, W / 2, y + 60, '雞啼・天亮了', 44, C.gold, { serif: true }).setOrigin(0.5).setDepth(962);
      txt(this, W / 2, y + 150, `神轎平安，撐過了這一夜。\n捉拿小妖 ${captured} 名，\n天亮後交給判官審問。`, 24, C.paper, { bold: false, align: 'center', lineSpacing: 10 }).setOrigin(0.5).setDepth(962);
      button(this, W / 2, y + ph - 60, 260, 70, '天亮・審判', () => this.night.leave('trial', { night: this.night.n }), { size: 28, fill: 0x8a1b14 }).setDepth(963);
    } else {
      run.retries++;
      run.incense = Math.max(run.incense, 30);
      txt(this, W / 2, y + 60, '神轎被衝破了……', 40, 0xff8a8a, { serif: true }).setOrigin(0.5).setDepth(962);
      txt(this, W / 2, y + 150, '隊伍退回廟裡重整。\n試著換個布陣、升級陣頭，\n或多用法術。', 24, C.paper, { bold: false, align: 'center', lineSpacing: 10 }).setOrigin(0.5).setDepth(962);
      button(this, W / 2, y + ph - 60, 260, 70, '重整再戰', () => this.night.leave('night', { night: this.night.n }), { size: 28, fill: 0x2f6f5a }).setDepth(963);
    }
  }
}
