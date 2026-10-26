/**
 * 最後一戰：喚回石駒。戰鬥邏輯在 core/boss.ts，這裡負責畫出來。
 * 上方：戰場（1280×720 邏輯座標）整片縮小放進戰鬥帶。
 * 下方（BossHud）：石駒煞氣、神轎、陣頭卡片（點一下換前排／後排）、天令與淨符、陣前審問。
 */
import Phaser from 'phaser';
import { C, H, W, FIELD_W as FW, FIELD_H as FH, GROUND_Y, TIME_SCALE } from '../theme';
import { BossBattle, BLESS_CD, FRONT_MAX, SKILLS, SMITE_CD, type BossEvent, type SkillId, type Unit } from '../core/boss';
import { FINALE_ROUNDS, FINALE_WRONG, MEMBER_STATS, finaleSetup } from '../content/finale';
import { EVIDENCE } from '../content/cases';
import { run } from '../state';
import { button, floatText, fullscreenButton, panel, txt, type Button } from '../ui/widgets';

export const BAND_Y = 132;
const ZOOM = W / FW;
export const BAND_H = Math.round(FH * ZOOM);
const BIG = 1.6;

interface View {
  c: Phaser.GameObjects.Container;
  imgs: Phaser.GameObjects.Image[];
  hp: Phaser.GameObjects.Graphics;
  phase: number;
}

export class BossScene extends Phaser.Scene {
  battle!: BossBattle;
  hud!: BossHud;
  speed = 1;
  private views = new Map<number, View>();
  private palImg!: Phaser.GameObjects.Image;
  private palHp!: Phaser.GameObjects.Graphics;
  private t = 0;
  private over = false;

  constructor() {
    super('boss');
  }

  create(): void {
    this.views = new Map();
    this.over = false;
    this.speed = 1;
    this.t = 0;
    this.battle = new BossBattle(finaleSetup(run));
    this.cameras.main.setViewport(0, BAND_Y, W, BAND_H).setZoom(ZOOM).centerOn(FW / 2, FH / 2);
    this.cameras.main.fadeIn(500, 10, 8, 18);
    this.drawBackground();
    const glow = this.add.circle(this.battle.palanquin.x, GROUND_Y - 80, 110, 0xffd76a, 0.12).setDepth(5);
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.22, duration: 1300, yoyo: true, repeat: -1 });
    this.palImg = this.add.image(this.battle.palanquin.x, GROUND_Y + 10, 'palanquin').setOrigin(0.5, 1).setScale(0.78 * BIG).setDepth(20);
    this.palHp = this.add.graphics().setDepth(210);
    this.add.rectangle(0, 0, FW, FH, 0x3a1a6a, 0.16).setOrigin(0).setDepth(200).setBlendMode(Phaser.BlendModes.MULTIPLY);
    // 前排的位置標示
    const g = this.add.graphics().setDepth(-60);
    g.fillStyle(0xd23a2a, 0.12);
    g.fillRect(500, GROUND_Y - 60, 170, 90);
    this.scene.launch('bosshud', { boss: this });
    this.events.once('shutdown', () => this.scene.stop('bosshud'));
  }

  private drawBackground(): void {
    const sky = this.add.graphics().setDepth(-100);
    sky.fillGradientStyle(0x0b0a1c, 0x0b0a1c, 0x231d40, 0x231d40, 1);
    sky.fillRect(0, 0, FW, GROUND_Y);
    this.add.circle(FW * 0.12, 110, 40, 0xfff3c4, 0.85).setDepth(-99);
    this.add.tileSprite(0, GROUND_Y - 130, FW, 260, 'mtnFarN').setOrigin(0, 1).setDepth(-95);
    for (let i = 0; i < Math.ceil(FW / 240) + 1; i++) this.add.image(i * 240, GROUND_Y - 110, `ruralN${i % 2 === 0 ? 0 : 2}`).setOrigin(0, 1).setDepth(-92);
    this.add.image(this.battle.palanquin.x + 60, GROUND_Y - 80, 'temple_huize').setOrigin(0.5, 1).setScale(0.7).setDepth(-80).setTint(0xb8a0c0);
    const g = this.add.graphics().setDepth(-70);
    g.fillStyle(0x2a2632, 1);
    g.fillRect(0, GROUND_Y - 84, FW, FH - GROUND_Y + 84);
    g.lineStyle(1, 0x3a3444, 1);
    for (let y = GROUND_Y - 84; y < FH; y += 36) g.lineBetween(0, y, FW, y);
    for (let i = 0; i < Math.ceil(FW / 120); i++) {
      const l = this.add.image(30 + i * 120, 150 + Math.abs(Math.sin(i * 0.9)) * 18, 'lantern').setScale(0.7).setDepth(-60);
      this.tweens.add({ targets: l, angle: { from: -3, to: 3 }, duration: 1500 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  ft(x: number, y: number, s: string, color: number, size = 26): void {
    floatText(this, x, y, s, color, Math.round(size * 1.7));
  }

  leave(key: string, data?: object, ms = 400): void {
    this.hud.cameras.main.fadeOut(ms, 10, 8, 18);
    this.cameras.main.fadeOut(ms, 10, 8, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('bosshud');
      this.scene.start(key, data);
    });
  }

  update(_t: number, dms: number): void {
    const dt = Math.min(0.05, dms / 1000);
    this.t += dt;
    if (!this.over) {
      const steps = this.speed * TIME_SCALE;
      for (let i = 0; i < steps; i++) this.battle.step(dt);
    }
    this.sync();
    this.handle(this.battle.drainEvents());
  }

  // ---------- 畫出單位 ----------
  private viewFor(uid: number, keys: string[], enemy: boolean, ghost = false): View {
    let v = this.views.get(uid);
    if (v) return v;
    const c = this.add.container(0, GROUND_Y + 10);
    const imgs = keys.map((k, i) => {
      const img = this.add.image((i - (keys.length - 1) / 2) * 34 * BIG, (i % 2) * 6, k).setOrigin(0.5, 1);
      const boss = k === 'shiju';
      img.setScale((enemy ? (boss ? 0.95 : 0.9) : 0.72) * BIG);
      img.setFlipX(!enemy ? false : true);
      if (!enemy) img.setFlipX(false);
      if (ghost) img.setTint(0x9ad0ff).setAlpha(0.8);
      img.setData('bx', img.x);
      return img;
    });
    const hp = this.add.graphics();
    c.add([...imgs, hp]);
    c.setDepth(enemy ? 35 : 30);
    v = { c, imgs, hp, phase: Math.random() * 6 };
    this.views.set(uid, v);
    return v;
  }

  private sync(): void {
    const seen = new Set<number>();
    const b = this.battle;
    for (const u of b.units) {
      const st = MEMBER_STATS[u.key];
      const v = this.viewFor(u.uid, st.tex, false, ['biao', 'gui', 'tian'].includes(u.key));
      seen.add(u.uid);
      v.c.x = u.x;
      let y = GROUND_Y + 10 + (u.row === 'back' ? -12 : 0);
      if (u.moving > 0) y -= Math.abs(Math.sin(this.t * 10 + v.phase)) * 8;
      v.c.y = y;
      v.c.setAlpha(u.alive ? (u.row === 'back' && u.moving <= 0 ? 0.85 : 1) : 0);
      for (const img of v.imgs) {
        if (u.flash > 0.5) img.setTintFill(0xffffff);
        else if (['biao', 'gui', 'tian'].includes(u.key)) img.setTint(0x9ad0ff);
        else img.clearTint();
      }
      this.bar(v, u.alive && u.hp < u.maxHp, u.hp / u.maxHp, -240, 80, 0x6fe08a);
    }
    for (const e of b.enemies) {
      const boss = e === b.boss;
      const v = this.viewFor(e.uid, [boss ? 'shiju' : e.id], true);
      seen.add(e.uid);
      v.c.x = e.x;
      let y = GROUND_Y + 10;
      if (!boss && e.id !== 'kui') y -= 10 + Math.sin(this.t * 3 + v.phase) * 6;
      if (e.state === 'charge') y -= Math.abs(Math.sin(this.t * 20)) * 12;
      if (e.state === 'paw') y -= Math.abs(Math.sin(this.t * 14)) * 6;
      if (e.state === 'breath') y += 8;
      v.c.y = y;
      for (const img of v.imgs) {
        if (e.flash > 0.5) img.setTintFill(0xffffff);
        else if (boss && e.state === 'breath') img.setTint(0xffb0b0);
        else if (boss && e.state === 'paw') img.setTint(0xff6a6a);
        else if (e.stun > 0) img.setTint(0xc8c8ff);
        else if (e.slow > 0) img.setTint(0xa8e0ff);
        else img.clearTint();
        img.angle = e.stun > 0 ? Math.sin(this.t * 20) * 8 : 0;
      }
      if (!boss) this.bar(v, e.alive && e.hp < e.maxHp, e.hp / e.maxHp, -140, 60, 0xd04aff);
      if (!e.alive && !v.c.getData('dying')) {
        v.c.setData('dying', true);
        this.tweens.add({ targets: v.c, alpha: 0, duration: 400 });
      }
    }
    for (const [uid, v] of this.views) {
      if (!seen.has(uid)) {
        v.c.destroy();
        this.views.delete(uid);
      }
    }
    const p = b.palanquin;
    if (p.flash > 0.5) this.palImg.setTint(0xff8080);
    else this.palImg.clearTint();
    this.palHp.clear();
    this.palHp.fillStyle(0x000000, 0.65);
    this.palHp.fillRoundedRect(p.x - 99, GROUND_Y - 300, 198, 24, 8);
    this.palHp.fillStyle(p.hp / p.maxHp > 0.35 ? 0xffd76a : 0xff5a4a, 1);
    this.palHp.fillRoundedRect(p.x - 95, GROUND_Y - 296, 190 * Math.max(0, p.hp / p.maxHp), 16, 6);
  }

  private bar(v: View, show: boolean, frac: number, top: number, w: number, color: number): void {
    v.hp.clear();
    if (!show) return;
    v.hp.fillStyle(0x000000, 0.6);
    v.hp.fillRect(-w / 2 - 2, top - 2, w + 4, 14);
    v.hp.fillStyle(color, 1);
    v.hp.fillRect(-w / 2, top, w * Math.max(0, frac), 10);
  }

  // ---------- 特效 ----------
  private handle(events: BossEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'hit':
          if (e.weak) this.ft(e.x, GROUND_Y - 160, `打肚子！${e.dmg}`, 0xff8a8a, 24);
          break;
        case 'shot':
          this.shot(e.fromX, e.toX, e.kind);
          break;
        case 'quake':
          this.ring(e.x, e.r, 0xe9b949);
          break;
        case 'chain': {
          const g = this.add.graphics().setDepth(68);
          g.lineStyle(4, 0xc8c8d8, 1);
          g.lineBetween(e.fromX, GROUND_Y - 60, e.toX, GROUND_Y - 60);
          this.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
          break;
        }
        case 'block':
          this.ft(e.x, GROUND_Y - 150, '格擋', 0xbfe0ff, 22);
          break;
        case 'heal':
          this.ft(e.x, GROUND_Y - 170, `+${e.amount}`, 0x8ff0a4, 22);
          break;
        case 'die':
          if (e.ally) {
            this.ft(e.x, GROUND_Y - 200, `${e.name}倒下了`, 0xff8a8a, 26);
            this.hud.toast(`${e.name}倒下了`, 0xff8a8a);
          }
          break;
        case 'paw':
          this.cameras.main.shake(300, 0.003);
          this.hud.toast('石駒刨地！馬上要衝鋒：血少的退到後排', 0xff6a6a, 2600);
          break;
        case 'charge':
          this.cameras.main.shake(500, 0.008);
          break;
        case 'breath':
          this.hud.toast(run.intel.bellyWound ? '石駒喘息中：打肚子的舊傷！把輸出推上前排' : '石駒喘息中：趁現在猛攻', 0xffd0d0, 2600);
          break;
        case 'callout':
          this.hud.toast(run.b.xiaoyun === 'invited' && !this.hud.usedCallout ? '小芸：「石駒，不要！」' : '石駒停了下來', 0xfff3c4, 2400);
          this.hud.usedCallout = true;
          break;
        case 'smite':
          this.lightning(e.x, e.r);
          break;
        case 'bless':
          this.ring(this.battle.palanquin.x, 260, 0x8ff0a4);
          break;
        case 'palanquin':
          this.cameras.main.shake(120, 0.004);
          break;
        case 'trial':
          this.hud.trial(e.round);
          break;
        case 'skill':
          if (e.id === 'huichun') {
            this.ring(FW / 2 - 100, 420, 0x8ff0a4);
            this.hud.toast('回春符：全隊回血', 0x8ff0a4);
          }
          if (e.id === 'hanshuang') {
            this.cameras.main.flash(300, 160, 220, 255);
            this.hud.toast('寒霜令：小妖都定住了', 0xa8e0ff);
          }
          if (e.id === 'zhensha') this.hud.toast('鎮煞鈴：石駒停了下來', 0xfff3c4, 2400);
          break;
        case 'end':
          this.over = true;
          this.time.delayedCall(600, () => this.hud.finish(e.result));
          break;
      }
    }
  }

  private shot(from: number, to: number, kind: 'firecracker' | 'flag'): void {
    const p = this.add.image(from, GROUND_Y - 70, 'spark').setTint(kind === 'firecracker' ? 0xff4a3a : 0x8ff0c4).setDepth(70).setScale(1.4);
    this.tweens.add({
      targets: p, x: to, duration: 280,
      onUpdate: (tw) => (p.y = GROUND_Y - 70 - Math.sin(tw.progress * Math.PI) * 90),
      onComplete: () => p.destroy(),
    });
  }

  private ring(x: number, r: number, color: number): void {
    const g = this.add.circle(x, GROUND_Y - 20, 10, color, 0).setStrokeStyle(5, color, 0.9).setDepth(65);
    g.setScale(1, 0.35);
    this.tweens.add({ targets: g, radius: r, alpha: 0, duration: 450, onComplete: () => g.destroy() });
  }

  private lightning(x: number, r: number): void {
    this.cameras.main.flash(180, 200, 180, 255);
    const g = this.add.graphics().setDepth(260);
    g.lineStyle(8, 0xe8d8ff, 1);
    g.beginPath();
    g.moveTo(x, 0);
    for (let y = 40; y <= GROUND_Y; y += 40) g.lineTo(x + Phaser.Math.Between(-30, 30), y);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => g.destroy() });
    this.ring(x, r, 0xc8a0ff);
  }
}

/** 最後一戰的操作面板 */
export class BossHud extends Phaser.Scene {
  private boss!: BossScene;
  usedCallout = false;
  private clock!: Phaser.GameObjects.Text;
  private moon!: Phaser.GameObjects.Arc;
  private bossBar!: Phaser.GameObjects.Graphics;
  private palBar!: Phaser.GameObjects.Graphics;
  private palTxt!: Phaser.GameObjects.Text;
  private frontTxt!: Phaser.GameObjects.Text;
  private toastTxt!: Phaser.GameObjects.Text;
  private cards: { uid: number; bg: Phaser.GameObjects.Graphics; bar: Phaser.GameObjects.Graphics; state: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text; x: number; y: number; w: number; h: number }[] = [];
  private skillBtns: { id: SkillId; btn: Button }[] = [];
  private smiteBtn!: Button;
  private blessBtn!: Button;
  private smiteFill!: Phaser.GameObjects.Rectangle;
  private blessFill!: Phaser.GameObjects.Rectangle;
  private skillW = 300;
  private readonly moonX = 30;
  private moonW = W - 130;
  private ok = [false, false, false];

  constructor() {
    super('bosshud');
  }

  private get battle(): BossBattle {
    return this.boss.battle;
  }

  create(data: { boss: BossScene }): void {
    this.boss = data.boss;
    this.boss.hud = this;
    this.cards = [];
    this.ok = [false, false, false];
    this.usedCallout = false;
    this.cameras.main.fadeIn(500, 10, 8, 18);
    txt(this, 24, 16, '最後一戰・喚回石駒', 30, C.gold, { serif: true });
    txt(this, 24, 58, '芝嶺巖惠澤宮', 20, C.paper, { bold: false });
    this.clock = txt(this, W - 96, 34, '19:00', 30, C.paper).setOrigin(1, 0.5);
    this.add.rectangle(this.moonX, 106, this.moonW, 6, 0x3a3442).setOrigin(0, 0.5);
    txt(this, this.moonX + this.moonW + 10, 106, '雞啼', 20, C.gold).setOrigin(0, 0.5);
    this.moon = this.add.circle(this.moonX, 106, 12, 0xfff3c4);
    fullscreenButton(this);
    const fr = this.add.graphics();
    fr.lineStyle(3, C.gold, 0.8);
    fr.lineBetween(0, BAND_Y - 2, W, BAND_Y - 2);
    fr.lineBetween(0, BAND_Y + BAND_H + 1, W, BAND_Y + BAND_H + 1);
    txt(this, 10, BAND_Y + 8, '◀ 神轎', 18, C.muted).setAlpha(0.8);
    txt(this, W - 10, BAND_Y + 8, '石駒從北邊來 ▶', 18, C.muted).setOrigin(1, 0).setAlpha(0.8);
    this.toastTxt = txt(this, W / 2, BAND_Y + BAND_H - 40, '', 24, 0xffffff, { align: 'center', stroke: '#1d1726', strokeThickness: 6, wordWrap: { width: W - 40, useAdvancedWrap: true } }).setOrigin(0.5).setDepth(50);

    const py = BAND_Y + BAND_H + 4;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1526, 0x1a1526, 0x0e0b16, 0x0e0b16, 1);
    bg.fillRect(0, py, W, H - py);
    let y = py + 16;
    txt(this, 24, y, '石駒的煞氣', 20, 0xd9b0ff);
    const sp = button(this, W - 90, y + 14, 140, 48, '速度 x1', () => {
      this.boss.speed = this.boss.speed === 1 ? 2 : 1;
      sp.setLabel(`速度 x${this.boss.speed}`);
    }, { size: 20, fill: 0x2a2236 });
    this.bossBar = this.add.graphics().setData('y', y + 32);
    y += 64;
    txt(this, 24, y, '神轎', 20, C.gold);
    this.palTxt = txt(this, W - 24, y, '', 18, C.paper, { bold: false }).setOrigin(1, 0);
    this.palBar = this.add.graphics().setData('y', y + 30);
    y += 62;
    this.frontTxt = txt(this, 24, y, '', 18, C.paper);
    txt(this, W - 24, y + 2, '點陣頭：換前排／後排（走 2 秒）', 15, C.muted, { bold: false }).setOrigin(1, 0);
    y += 32;
    // 陣頭卡片：位置固定，方便點；卡片上標前排、後排
    const units = this.battle.units;
    const colW = (W - 48 - 16) / 2;
    const skills = this.battle.setup.skills;
    const cardH = Math.min(96, Math.floor((H - 210 - (skills.length ? 86 : 0) - y) / Math.ceil(units.length / 2)) - 10);
    units.forEach((u, i) => {
      const cx = 24 + (i % 2) * (colW + 16);
      const cy = y + Math.floor(i / 2) * (cardH + 10);
      const cardBg = this.add.graphics();
      const st = MEMBER_STATS[u.key];
      const icon = this.add.image(cx + 40, cy + cardH - 6, st.tex[0]).setOrigin(0.5, 1);
      icon.setScale(Math.min((cardH - 14) / icon.height, 64 / icon.width));
      if (['biao', 'gui', 'tian'].includes(u.key)) icon.setTint(0x9ad0ff);
      const name = txt(this, cx + 80, cy + 10, st.name, 20, C.paper);
      const state = txt(this, cx + 80, cy + 36, '', 15, C.muted, { bold: false });
      const bar = this.add.graphics();
      const hit = this.add.rectangle(cx, cy, colW, cardH, 0xffffff, 0.001).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        if (this.battle.swap(u.uid)) this.cameras.main.flash(80, 255, 240, 200);
        else if (u.row === 'back' && this.battle.frontCount() >= FRONT_MAX) this.toast(`前排最多 ${FRONT_MAX} 個，先讓一個退下來`, 0xffd76a);
      });
      this.cards.push({ uid: u.uid, bg: cardBg, bar, state, name, x: cx, y: cy, w: colW, h: cardH });
    });

    // 法術
    const skillH = 110;
    const by = H - 24 - skillH / 2;
    this.skillW = (W - 48 - 24) / 2;
    const sx = 24 + this.skillW / 2;
    const bx = W - 24 - this.skillW / 2;
    this.smiteBtn = button(this, sx, by, this.skillW, skillH, '天令', () => this.battle.smite(), { size: 34, fill: 0x5a2a8a });
    this.blessBtn = button(this, bx, by, this.skillW, skillH, '淨符', () => this.battle.bless(), { size: 34, fill: 0x2f6f5a });
    this.smiteFill = this.add.rectangle(sx - this.skillW / 2, by - skillH / 2, this.skillW, skillH, 0x000000, 0.45).setOrigin(0).setDepth(5);
    this.blessFill = this.add.rectangle(bx - this.skillW / 2, by - skillH / 2, this.skillW, skillH, 0x000000, 0.45).setOrigin(0).setDepth(5);
    txt(this, sx, by - skillH / 2 - 18, '雷擊最前面的妖群', 15, C.muted, { bold: false }).setOrigin(0.5);
    txt(this, bx, by - skillH / 2 - 18, '神轎與陣頭回血', 15, C.muted, { bold: false }).setOrigin(0.5);
    // 超渡的鬼回報的技能
    this.skillBtns = [];
    if (skills.length) {
      const sy = by - skillH / 2 - 76;
      const sw = (W - 48 - 12 * (skills.length - 1)) / skills.length;
      txt(this, 24, sy - 60, '超渡亡魂，神威增長：', 15, 0xffd76a, { bold: false });
      skills.forEach((id, i) => {
        const btn = button(this, 24 + sw / 2 + i * (sw + 12), sy, sw, 60, SKILLS[id].name, () => this.battle.skill(id), { size: 22, fill: 0x7a5a10 });
        this.skillBtns.push({ id, btn });
      });
    }
    this.time.delayedCall(700, () => this.toast('點陣頭卡片換前排／後排。前排挨打，後排近戰會回血：輪流上陣扛傷害', 0xfff3c4, 4200));
  }

  toast(s: string, color: number, ms = 1800): void {
    this.toastTxt.setText(s).setColor(`#${color.toString(16).padStart(6, '0')}`).setAlpha(1);
    this.tweens.killTweensOf(this.toastTxt);
    this.tweens.add({ targets: this.toastTxt, alpha: 0, delay: ms, duration: 400 });
  }

  update(): void {
    if (!this.boss?.battle) return;
    const b = this.battle;
    const hours = 19 + b.progress * 10;
    this.clock.setText(`${String(Math.floor(hours) % 24).padStart(2, '0')}:${String(Math.floor(((hours % 1) * 60) / 10) * 10).padStart(2, '0')}`);
    this.moon.x = this.moonX + this.moonW * b.progress;
    const bw = W - 48;
    const bossFrac = Math.max(0, b.boss.hp / b.boss.maxHp);
    const by = this.bossBar.getData('y') as number;
    this.bossBar.clear();
    this.bossBar.fillStyle(0x000000, 0.7);
    this.bossBar.fillRoundedRect(24, by - 2, bw, 22, 8);
    this.bossBar.fillStyle(0x9b3cff, 1);
    this.bossBar.fillRoundedRect(26, by, (bw - 4) * bossFrac, 18, 6);
    // 陣前審問的刻度
    this.bossBar.fillStyle(0xffd76a, 1);
    for (const f of [0.7, 0.4, 0.1]) this.bossBar.fillRect(26 + (bw - 4) * f - 1, by - 4, 3, 26);
    const p = b.palanquin;
    const py = this.palBar.getData('y') as number;
    this.palBar.clear();
    this.palBar.fillStyle(0x000000, 0.7);
    this.palBar.fillRoundedRect(24, py - 2, bw, 22, 8);
    this.palBar.fillStyle(p.hp / p.maxHp > 0.35 ? 0xffd76a : 0xff5a4a, 1);
    this.palBar.fillRoundedRect(26, py, (bw - 4) * Math.max(0, p.hp / p.maxHp), 18, 6);
    this.palTxt.setText(`${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`);
    this.frontTxt.setText(`前排 ${b.frontCount()}／${FRONT_MAX}`);
    for (const c of this.cards) this.drawCard(c, b.units.find((u) => u.uid === c.uid)!);
    for (const { id, btn } of this.skillBtns) {
      const cd = b.skillCd[id] ?? 0;
      btn.setEnabled(b.canSkill(id));
      btn.setLabel(cd > 0 ? `${SKILLS[id].name} ${Math.ceil(cd)}秒` : id === 'zhensha' && !b.canSkill(id) ? `${SKILLS[id].name}（等衝鋒）` : SKILLS[id].name);
    }
    this.smiteBtn.setEnabled(b.canSmite());
    this.blessBtn.setEnabled(b.canBless());
    this.smiteFill.width = this.skillW * (b.smiteCd / SMITE_CD);
    this.blessFill.width = this.skillW * (b.blessCd / BLESS_CD);
    this.smiteBtn.setLabel(b.smiteCd > 0 ? `天令 ${Math.ceil(b.smiteCd)}秒` : '天令');
    this.blessBtn.setLabel(b.blessCd > 0 ? `淨符 ${Math.ceil(b.blessCd)}秒` : '淨符');
  }

  private drawCard(c: BossHud['cards'][number], u: Unit): void {
    const front = u.moving > 0 ? u.targetRow === 'front' : u.row === 'front';
    const frac = u.alive ? u.hp / u.maxHp : 0;
    c.bg.clear();
    c.bg.fillStyle(!u.alive ? 0x1a1620 : front ? 0x3a1e22 : 0x1e2638, 1);
    c.bg.fillRoundedRect(c.x, c.y, c.w, c.h, 12);
    c.bg.lineStyle(3, !u.alive ? 0x3a3442 : front ? 0xd2503a : 0x4a6a9a, 1);
    c.bg.strokeRoundedRect(c.x, c.y, c.w, c.h, 12);
    let s = '';
    if (!u.alive) s = '倒下';
    else if (u.moving > 0) s = u.targetRow === 'front' ? '走上前排…' : '退回後排…';
    else if (u.row === 'front') s = `前排${'①②③'[u.slot] ?? ''}${u.slot === 0 ? '・石駒打這個' : ''}`;
    else s = u.role === 'melee' ? (u.hp < u.maxHp ? '後排・回血中' : '後排・待命') : u.role === 'ranged' ? '後排・射擊中' : '後排・支援中';
    c.state.setText(s).setColor(!u.alive ? '#6a6070' : front ? '#ffb0a0' : '#a8c8ff');
    c.name.setAlpha(u.alive ? 1 : 0.4);
    c.bar.clear();
    const bx = c.x + 80;
    const bw = c.w - 96;
    const by = c.y + c.h - 22;
    c.bar.fillStyle(0x000000, 0.6);
    c.bar.fillRoundedRect(bx - 2, by - 2, bw + 4, 16, 6);
    c.bar.fillStyle(frac > 0.35 ? 0x6fe08a : 0xff8a5a, 1);
    c.bar.fillRoundedRect(bx, by, bw * frac, 12, 5);
  }

  // ---------- 陣前審問 ----------
  /**
   * 陣前審問：自動出示手上對得上的證據（或請人上前），戰鬥不暫停。
   * 戰鬥帶上方播一段動畫：石駒說話 → 證據卡飛入 → 結果。
   */
  trial(round: number): void {
    const r = FINALE_ROUNDS[round - 1];
    // 依序找：到場的人 → 對得上的證據
    const person = (r.people ?? []).find((p) => p.test(run));
    const ev = r.evidence.find((id) => run.evidence.includes(id));
    const ok = !!person || !!ev;
    this.ok[round - 1] = ok;
    this.battle.answer(round, ok);
    const used = person ? { tag: '上前', name: person.label.replace('請', '').replace('上前', ''), say: person.say } : ev ? { tag: EVIDENCE[ev].kind, name: EVIDENCE[ev].name, say: EVIDENCE[ev].text } : null;
    this.playTrial(round, r.line, used, ok ? `${r.ok}\n${r.effect}` : `手上沒有能說動牠的證據。\n${FINALE_WRONG}`, ok);
  }

  private playTrial(round: number, line: string, used: { tag: string; name: string; say: string } | null, result: string, ok: boolean): void {
    // 動畫期間先把提示字收起來，避免疊在一起
    this.tweens.killTweensOf(this.toastTxt);
    this.toastTxt.setAlpha(0);
    const c = this.add.container(0, 0).setDepth(800);
    const top = BAND_Y + 8;
    const h = BAND_H - 16;
    // 底：半透明黑幕從左滑入
    const bg = this.add.rectangle(0, top, W, h, 0x0a0614, 0.82).setOrigin(0);
    const edge = this.add.graphics();
    edge.lineStyle(3, C.gold, 0.9);
    edge.lineBetween(0, top, W, top);
    edge.lineBetween(0, top + h, W, top + h);
    const title = txt(this, 24, top + 14, `陣前審問　${round}／3`, 24, C.gold, { serif: true });
    const say = txt(this, 24, top + 54, `石駒：${line}`, 20, 0xd9b0ff, { wordWrap: { width: W - 48, useAdvancedWrap: true } });
    c.add([bg, edge, title, say]);
    c.x = -W;
    this.tweens.add({ targets: c, x: 0, duration: 260, ease: 'Cubic.out' });
    // 證據卡：從下方飛上來、放大、蓋章
    const card = this.add.container(W / 2, top + h + 120);
    const cw = W - 120;
    const ch = 120;
    const g = this.add.graphics();
    g.fillStyle(used ? 0xeee0bd : 0x3a3442, 1);
    g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
    g.lineStyle(3, used ? 0xa3261c : 0x6a6070, 1);
    g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
    card.add(g);
    if (used) {
      card.add(txt(this, -cw / 2 + 18, -ch / 2 + 12, `【${used.tag}】${used.name}`, 22, 0xa3261c, { serif: true }));
      card.add(txt(this, -cw / 2 + 18, -ch / 2 + 46, used.say, 16, 0x2a1a10, { serif: true, lineSpacing: 2, wordWrap: { width: cw - 36, useAdvancedWrap: true } }));
    } else {
      card.add(txt(this, 0, 0, '（沒有證據）', 22, 0x9a8fae).setOrigin(0.5));
    }
    card.setScale(0.6).setAlpha(0);
    c.add(card);
    this.tweens.add({ targets: card, y: top + 110 + ch / 2, scale: 1, alpha: 1, delay: 500, duration: 380, ease: 'Back.out' });
    // 結果：蓋章＋一行字
    const stamp = txt(this, W - 90, top + 96, ok ? '說動' : '無效', 30, ok ? 0x2f8f5a : 0xb3261e, { serif: true, backgroundColor: '#eee0bd', padding: { x: 8, y: 4 } }).setOrigin(0.5).setAngle(-12).setScale(2.4).setAlpha(0);
    const res = txt(this, 24, top + h - 62, result, 17, ok ? 0x9fe8c0 : 0xff9a8a, { lineSpacing: 4, wordWrap: { width: W - 48, useAdvancedWrap: true } }).setAlpha(0);
    c.add([stamp, res]);
    this.tweens.add({ targets: stamp, scale: 1, alpha: 1, delay: 1100, duration: 220, ease: 'Quad.in', onComplete: () => this.cameras.main.shake(120, 0.004) });
    this.tweens.add({ targets: res, alpha: 1, delay: 1300, duration: 300 });
    // 石駒的反應（戰場那邊）
    this.time.delayedCall(1200, () => {
      if (ok) this.boss.cameras.main.flash(250, 255, 240, 200);
      else this.boss.cameras.main.shake(300, 0.006);
      this.boss.ft(this.battle.boss.x, GROUND_Y - 260, ok ? '動搖了' : '更兇了', ok ? 0xfff3c4 : 0xff6a6a, 34);
    });
    // 幾秒後滑出
    this.tweens.add({ targets: c, x: W, delay: 4200, duration: 300, ease: 'Cubic.in', onComplete: () => c.destroy() });
  }

  // ---------- 結束 ----------
  finish(result: 'subdued' | 'lose' | 'dawn'): void {
    const m = this.add.container(0, 0).setDepth(950);
    m.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive());
    const x = 16;
    const pw = W - 32;
    if (result === 'subdued') {
      const recall = this.ok[2];
      m.add(panel(this, x, 220, pw, 760));
      m.add(txt(this, W / 2, 260, '石駒的煞氣散了', 36, C.gold, { serif: true }).setOrigin(0.5, 0));
      m.add(txt(this, x + 24, 320, '牠跪在廟埕上，喘著氣，看著你們。要怎麼判？', 20, C.paper, { bold: false, wordWrap: { width: pw - 48, useAdvancedWrap: true } }));
      const opts: { label: string; why: string; desc: string; act: () => void; fill: number }[] = [
        { label: '喚回', why: recall ? '' : '陣前審問最後一輪沒有說動牠', desc: '石駒歸隊，成為青嶺王的坐騎', fill: 0x2f6f5a, act: () => this.end('recall') },
        { label: '送回山中', why: '', desc: '牠回到山裡繼續等；不再下山作亂', fill: 0x4a3a6a, act: () => this.end('return') },
        { label: '斬', why: '', desc: '石駒化為碎石。戾氣 +1，記遺憾', fill: 0x8a1b14, act: () => this.end('slay') },
      ];
      let yy = 380;
      for (const o of opts) {
        const b = button(this, x + 110, yy + 50, 170, 70, o.label, o.act, { size: 24, fill: o.fill });
        b.setEnabled(!o.why);
        m.add(b);
        m.add(txt(this, x + 210, yy + 26, o.why ? `✕ ${o.why}` : o.desc, 18, o.why ? 0xff9a8a : C.paper, { bold: false, wordWrap: { width: pw - 230, useAdvancedWrap: true } }));
        yy += 130;
      }
      return;
    }
    run.retries++;
    m.add(panel(this, x, 360, pw, 420));
    m.add(txt(this, W / 2, 400, result === 'dawn' ? '雞啼・天亮了' : '神轎被衝破了……', 36, result === 'dawn' ? C.gold : 0xff8a8a, { serif: true }).setOrigin(0.5, 0));
    m.add(txt(this, x + 24, 470, result === 'dawn' ? '石駒退回山裡。今晚再試一次：\n下次石駒的煞氣會少一些。' : '隊伍退回廟裡重整。\n試著把血少的陣頭輪流退到後排回血；石駒刨地時先讓脆的退下來。\n下次石駒的煞氣會少一些。', 20, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: pw - 48, useAdvancedWrap: true } }));
    m.add(button(this, W / 2, 700, 280, 72, '重整再戰', () => this.boss.leave('boss'), { size: 26, fill: 0x2f6f5a }));
  }

  private end(kind: 'recall' | 'return' | 'slay'): void {
    run.shijuEnd = kind;
    run.shijuJoined = kind === 'recall';
    if (kind === 'slay') run.liqi = Math.min(3, run.liqi + 1);
    if (kind === 'recall') this.boss.leave('story', { id: 'recall', next: { key: 'end' } }, 800);
    else this.boss.leave('end', undefined, 800);
  }
}
