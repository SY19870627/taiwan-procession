/**
 * 夜晚：斬妖（靈界）。戰鬥邏輯在 core/battle.ts，這裡只負責畫出來和兩個法術按鈕。
 */
import Phaser from 'phaser';
import { C, H, W, GROUND_Y, TIME_SCALE } from '../theme';
import { Battle, BLESS_COST, SMITE_COST, type BattleEvent, type Fighter, type Side } from '../core/battle';
import { NIGHTS, nightSpawns } from '../content/nights';
import { Street } from '../art/backdrop';
import { run } from '../state';
import { availableUnits } from './PrepScene';
import { palanquinStats, unitStats } from '../core/upgrades';
import { ResourceBar, button, floatText, fullscreenButton, go, panel, txt, type Button } from '../ui/widgets';

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
  private battle!: Battle;
  private n = 1;
  private views = new Map<number, View>();
  private street?: Street;
  private palImg!: Phaser.GameObjects.Image;
  private palHp!: Phaser.GameObjects.Graphics;
  private bar!: ResourceBar;
  private clock!: Phaser.GameObjects.Text;
  private moon!: Phaser.GameObjects.Arc;
  private capTxt!: Phaser.GameObjects.Text;
  private bossBar?: Phaser.GameObjects.Graphics;
  private smiteBtn!: Button;
  private blessBtn!: Button;
  private speed = 1;
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
      mode: def.mode, fieldW: W, duration: def.duration, spawns: nightSpawns(this.n, run.tonight), units, palanquin: palanquinStats(run.ups),
      boss: {
        hpMul: run.b.xiaoyun === 'invited' ? 0.8 : 1,
        atkMul: run.shijuEnraged ? 1.3 : 1,
        chargeEvery: run.shijuEnraged ? 6 : 8,
        skipCharges: run.b.xiaoyun === 'invited' ? 1 : 0,
      },
      followers: run.followers, morale: run.morale, incense: run.incense, intel: run.intel,
    });
    this.cameras.main.fadeIn(500, 10, 8, 18);
    this.drawBackground(def.mode);
    this.drawPalanquin();

    // 靈界色調：整個畫面罩一層紫藍色
    this.add.rectangle(0, 0, W, H, 0x3a1a6a, 0.16).setOrigin(0).setDepth(200).setBlendMode(Phaser.BlendModes.MULTIPLY);
    for (let i = 0; i < 12; i++) {
      const s = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(GROUND_Y - 40, H), 'smoke').setTint(0x9b7cff).setAlpha(0.1).setScale(Phaser.Math.FloatBetween(2, 4)).setDepth(150);
      this.tweens.add({ targets: s, x: s.x + Phaser.Math.Between(-150, 150), alpha: 0.03, duration: 4000 + i * 300, yoyo: true, repeat: -1 });
    }
    this.drawHud(def.title, def.place);
    fullscreenButton(this);
  }

  // ---------- 背景 ----------
  private drawBackground(mode: string): void {
    if (mode === 'patrol') {
      this.street = new Street(this, { night: true, theme: 'city' });
      return;
    }
    const sky = this.add.graphics().setDepth(-100);
    sky.fillGradientStyle(0x0b0a1c, 0x0b0a1c, 0x231d40, 0x231d40, 1);
    sky.fillRect(0, 0, W, GROUND_Y);
    this.add.circle(W * 0.12, 110, 40, 0xfff3c4, 0.85).setDepth(-99);
    this.add.tileSprite(0, GROUND_Y - 130, W, 260, 'mtnFarN').setOrigin(0, 1).setDepth(-95);
    if (this.n === 3) {
      for (let i = 0; i < Math.ceil(W / 240) + 1; i++) this.add.image(i * 240, GROUND_Y - 110, `ruralN${i % 2 === 0 ? 0 : 2}`).setOrigin(0, 1).setDepth(-92);
    } else {
      for (let i = 0; i < Math.ceil(W / 220) + 1; i++) this.add.image(i * 230 - 60, GROUND_Y - 110, `shopN${(i * 3) % 8}`).setOrigin(0, 1).setDepth(-92).setTint(0x6a6080);
    }
    const temple = this.n === 2 ? 'temple_zhuang' : 'temple_huize';
    this.add.image(this.battle.palanquin.x, GROUND_Y - 80, temple).setOrigin(0.5, 1).setScale(0.82).setDepth(-80).setTint(0xb8a0c0);
    // 廟埕石板
    const g = this.add.graphics().setDepth(-70);
    g.fillStyle(0x2a2632, 1);
    g.fillRect(0, GROUND_Y - 84, W, H - GROUND_Y + 84);
    g.lineStyle(1, 0x3a3444, 1);
    for (let y = GROUND_Y - 84; y < H; y += 36) g.lineBetween(0, y, W, y);
    for (let x = -200; x < W + 200; x += 70) g.lineBetween(x, GROUND_Y - 84, x + (x - W / 2) * 0.4, H);
    // 燈籠串
    for (let i = 0; i < Math.ceil(W / 120); i++) {
      const l = this.add.image(30 + i * 120, 150 + Math.abs(Math.sin(i * 0.9)) * 18, 'lantern').setScale(0.7).setDepth(-60);
      this.tweens.add({ targets: l, angle: { from: -3, to: 3 }, duration: 1500 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  private drawPalanquin(): void {
    const p = this.battle.palanquin;
    const glow = this.add.circle(p.x, GROUND_Y - 80, 110, 0xffd76a, 0.12).setDepth(5);
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.22, duration: 1300, yoyo: true, repeat: -1 });
    this.palImg = this.add.image(p.x, GROUND_Y + 10, 'palanquin').setOrigin(0.5, 1).setScale(0.78).setDepth(20);
    this.palHp = this.add.graphics().setDepth(210);
  }

  // ---------- 介面 ----------
  private drawHud(title: string, place: string): void {
    const top = this.add.graphics().setDepth(890);
    top.fillStyle(0x1d1726, 0.85);
    top.fillRoundedRect(16, 14, 420, 76, 12);
    top.lineStyle(2, C.gold, 0.7);
    top.strokeRoundedRect(16, 14, 420, 76, 12);
    txt(this, 34, 22, title, 26, C.gold, { serif: true }).setDepth(891);
    txt(this, 34, 58, place, 18, C.paper, { bold: false }).setDepth(891);
    this.clock = txt(this, 420, 34, '19:00', 24, C.paper).setOrigin(1, 0.5).setDepth(891);
    // 夜晚進度：月亮從左走到右，走到底就雞啼天亮
    const tx = 460;
    const tw = Math.max(160, Math.min(360, W - 1060));
    this.add.rectangle(tx, 52, tw, 6, 0x3a3442).setOrigin(0, 0.5).setDepth(890);
    txt(this, tx + tw + 12, 52, '雞啼', 18, C.gold).setOrigin(0, 0.5).setDepth(890);
    this.moon = this.add.circle(tx, 52, 11, 0xfff3c4).setDepth(891);
    this.bar = new ResourceBar(this, W - 520, 14);
    this.capTxt = txt(this, 34, 104, '捉拿 0', 22, 0x9fe8c0).setDepth(891);
    if (this.battle.setup.mode === 'boss') this.bossBar = this.add.graphics().setDepth(890);

    this.smiteBtn = button(this, W - 300, H - 58, 170, 70, `天令 ${SMITE_COST}`, () => {
      if (this.battle.smite()) this.bar.refresh(this.battle.incense);
    }, { size: 26, fill: 0x5a2a8a });
    this.blessBtn = button(this, W - 110, H - 58, 170, 70, `淨符 ${BLESS_COST}`, () => {
      if (this.battle.bless()) this.bar.refresh(this.battle.incense);
    }, { size: 26, fill: 0x2f6f5a });
    for (const b of [this.smiteBtn, this.blessBtn]) b.setDepth(895);
    const sp = button(this, 90, H - 58, 130, 56, '速度 x1', () => {
      this.speed = this.speed === 1 ? 2 : 1;
      sp.setLabel(`速度 x${this.speed}`);
    }, { size: 20, fill: 0x2a2236 });
    sp.setDepth(895);
    this.bar.refresh(this.battle.incense);
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
    this.hud();
  }

  private viewFor(f: Fighter): View {
    let v = this.views.get(f.uid);
    if (v) return v;
    const c = this.add.container(f.x, GROUND_Y + 10);
    const imgs: Phaser.GameObjects.Image[] = [];
    if (f.team === 'unit') {
      const keys = UNIT_TEX[f.id] ?? ['folk0'];
      keys.forEach((k, i) => {
        const img = this.add.image((i - (keys.length - 1) / 2) * 34, (i % 2) * 6, k).setOrigin(0.5, 1).setScale(0.72);
        img.setData('bx', img.x);
        // 陣頭面向外側（面向妖怪來的方向）
        img.setFlipX(f.side === -1);
        imgs.push(img);
      });
    } else {
      const key = f.id === 'boss' ? 'shiju' : (f.id as string);
      const img = this.add.image(0, 0, key).setOrigin(0.5, 1).setScale(f.id === 'boss' ? 0.95 : 0.9);
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
      if (f.team === 'enemy' && f.id !== 'kui' && f.id !== 'boss') y -= 10 + Math.sin(this.t * 3 + v.phase) * 6;
      v.c.y = y;
      for (const img of v.imgs) img.x = (img.getData('bx') as number) + dx;
      for (const img of v.imgs) {
        if (f.flash > 0.5) img.setTintFill(0xffffff);
        else if (f.id === 'boss' && f.state === 'breath') img.setTint(0xffb0b0);
        else img.clearTint();
      }
      // 血條
      v.hp.clear();
      if (f.alive && f.hp < f.maxHp && f.id !== 'boss') {
        const w = f.team === 'unit' ? 60 : 44;
        const top = f.team === 'unit' ? -150 : -86;
        v.hp.fillStyle(0x000000, 0.6);
        v.hp.fillRect(-w / 2 - 1, top - 1, w + 2, 8);
        v.hp.fillStyle(f.team === 'unit' ? 0x6fe08a : 0xd04aff, 1);
        v.hp.fillRect(-w / 2, top, w * Math.max(0, f.hp / f.maxHp), 6);
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
    const w = 150;
    this.palHp.fillStyle(0x000000, 0.65);
    this.palHp.fillRoundedRect(p.x - w / 2 - 3, GROUND_Y - 180, w + 6, 16, 6);
    this.palHp.fillStyle(p.hp / p.maxHp > 0.35 ? 0xffd76a : 0xff5a4a, 1);
    this.palHp.fillRoundedRect(p.x - w / 2, GROUND_Y - 177, w * (p.hp / p.maxHp), 10, 4);
  }

  private hud(): void {
    const prog = this.battle.progress;
    const hours = 19 + prog * 10;
    const hh = Math.floor(hours) % 24;
    this.clock.setText(`${String(hh).padStart(2, '0')}:${String(Math.floor(((hours % 1) * 60) / 10) * 10).padStart(2, '0')}`);
    const tw = Math.max(160, Math.min(360, W - 1060));
    this.moon.x = 460 + tw * prog;
    this.capTxt.setText(`捉拿 ${this.battle.captured}`);
    this.smiteBtn.setEnabled(this.battle.canSmite());
    this.blessBtn.setEnabled(this.battle.canBless());
    if (this.bossBar) {
      const b = this.battle.boss;
      const frac = b ? Math.max(0, b.hp / b.maxHp) : 0;
      const bw = Math.min(560, W - 900);
      const bx = W / 2 - bw / 2 + 180;
      this.bossBar.clear();
      this.bossBar.fillStyle(0x000000, 0.7);
      this.bossBar.fillRoundedRect(bx - 4, 100, bw + 8, 26, 8);
      this.bossBar.fillStyle(0x9b3cff, 1);
      this.bossBar.fillRoundedRect(bx, 104, bw * frac, 18, 6);
      if (!this.bossBar.getData('label')) {
        this.bossBar.setData('label', true);
        txt(this, bx, 76, '石駒的煞氣', 20, 0xd9b0ff).setDepth(891);
      }
    }
  }

  // ---------- 特效 ----------
  private handle(events: BattleEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'hit':
          if (e.weak) floatText(this, e.x, GROUND_Y - 140, `破綻！${e.dmg}`, 0xff8a8a, 24);
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
          floatText(this, this.battle.palanquin.x, GROUND_Y - 200, '淨符・回復', 0x8ff0a4);
          break;
        case 'palanquin':
          this.cameras.main.shake(120, 0.004);
          break;
        case 'charge':
          floatText(this, W / 2, 200, '石駒衝鋒！', 0xff6a6a, 40);
          this.cameras.main.shake(500, 0.006);
          break;
        case 'callout':
          floatText(this, W / 2, 230, '小芸：「石駒，不要！」', 0xfff3c4, 36);
          break;
        case 'breath':
          floatText(this, this.battle.palanquin.x + 160, GROUND_Y - 180, run.intel.bellyWound ? '喘息中・打肚子的舊傷！' : '喘息中', 0xffd0d0, 26);
          break;
        case 'end':
          // 雞啼：剩下的妖怪散去
          if (e.result === 'win') {
            for (const [uid, v] of this.views) {
              const f = this.battle.fighters.find((x) => x.uid === uid);
              if (f?.team === 'enemy') this.tweens.add({ targets: v.c, alpha: 0, y: v.c.y - 30, duration: 800 });
            }
          }
          this.time.delayedCall(600, () => this.finish(e.result));
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

  private ring(x: number, r: number, color: number): void {
    const g = this.add.circle(x, GROUND_Y - 20, 10, color, 0).setStrokeStyle(4, color, 0.9).setDepth(65);
    g.setScale(1, 0.35);
    this.tweens.add({ targets: g, radius: r, alpha: 0, duration: 450, onComplete: () => g.destroy() });
  }

  private capture(x: number): void {
    floatText(this, x, GROUND_Y - 120, '捉拿！', 0x9fe8c0, 30);
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
    floatText(this, x, GROUND_Y - 240, '天令！', 0xe8d8ff, 36);
  }

  // ---------- 結束 ----------
  private finish(result: 'win' | 'lose'): void {
    run.incense = this.battle.incense;
    const captured = this.battle.captured;
    const mode = this.battle.setup.mode;
    if (result === 'win' && mode === 'boss') {
      run.shijuJoined = true;
      run.totalCaptured += captured;
      go(this, 'story', { id: 'recall', next: { key: 'end' } }, 800);
      return;
    }
    if (result === 'lose' && mode === 'boss' && this.battle.palanquin.hp > 0) {
      // 天亮了還沒喚回：石駒退回山裡，再來一次
      run.retries++;
      run.incense = Math.max(run.incense, 30);
      go(this, 'story', { id: 'retreat', next: { key: 'prep', data: { night: 3 } } }, 800);
      return;
    }
    const pw = 640;
    const ph = 330;
    const x = (W - pw) / 2;
    const y = (H - ph) / 2 - 20;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.45).setOrigin(0).setDepth(960).setInteractive();
    panel(this, x, y, pw, ph).setDepth(961);
    if (result === 'win') {
      run.captured = captured;
      run.totalCaptured += captured;
      txt(this, W / 2, y + 60, '雞啼・天亮了', 44, C.gold, { serif: true }).setOrigin(0.5).setDepth(962);
      txt(this, W / 2, y + 140, `神轎平安，撐過了這一夜。\n捉拿小妖 ${captured} 名，天亮後交給判官審問。`, 24, C.paper, { bold: false, align: 'center', lineSpacing: 10 }).setOrigin(0.5).setDepth(962);
      button(this, W / 2, y + ph - 60, 260, 70, '天亮・審判', () => go(this, 'judge', { night: this.n }), { size: 28, fill: 0x8a1b14 }).setDepth(963);
    } else {
      run.retries++;
      run.incense = Math.max(run.incense, 30);
      txt(this, W / 2, y + 60, '神轎被衝破了……', 40, 0xff8a8a, { serif: true }).setOrigin(0.5).setDepth(962);
      txt(this, W / 2, y + 140, '隊伍退回廟裡重整。\n試著換個布陣、升級陣頭，或多用法術。', 24, C.paper, { bold: false, align: 'center', lineSpacing: 10 }).setOrigin(0.5).setDepth(962);
      button(this, W / 2, y + ph - 60, 260, 70, '重整再戰', () => go(this, 'prep', { night: this.n }), { size: 28, fill: 0x2f6f5a }).setDepth(963);
    }
  }
}
