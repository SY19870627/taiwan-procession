/**
 * 最後一戰。戰鬥邏輯在 core/boss.ts，這裡負責畫出來。每一章的戰場不同：
 *  - 第一章：芝嶺巖惠澤宮廟埕，喚回石駒（打到煞氣歸零）。
 *  - 第二章：大鵬澳沙灘，護送王船出海（王船走到岸邊）；黑潮在海裡，觸手從沙裡伸出來拖船。
 * 上方：戰場（1280×720 邏輯座標）整片縮小放進戰鬥帶。
 * 下方（BossHud）：目標進度、神轎（王船）、陣頭卡片（點一下換前排／後排）、主神的兩個法術、超渡技能、陣前審問。
 */
import Phaser from 'phaser';
import { C, H, W, FIELD_W as FW, FIELD_H as FH, GROUND_Y, TIME_SCALE } from '../theme';
import { BossBattle, FRONT_MAX, SKILLS, SPELLS, TIDE_X, type BossEvent, type SkillId, type Unit } from '../core/boss';
import { CH } from '../content/chapter';
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
  private ropes!: Phaser.GameObjects.Graphics;
  private waveImg?: Phaser.GameObjects.Image;
  private fire: Phaser.GameObjects.Image[] = [];
  private scroll: Phaser.GameObjects.TileSprite[] = [];
  private lastProg = 0;
  private t = 0;
  private over = false;

  constructor() {
    super('boss');
  }

  get escort(): boolean {
    return this.battle.mode === 'escort';
  }

  create(): void {
    this.views = new Map();
    this.over = false;
    this.speed = 1;
    this.t = 0;
    this.fire = [];
    this.scroll = [];
    this.lastProg = 0;
    this.waveImg = undefined;
    this.battle = new BossBattle(CH().finale.setup(run));
    this.cameras.main.setViewport(0, BAND_Y, W, BAND_H).setZoom(ZOOM).centerOn(FW / 2, FH / 2);
    this.cameras.main.fadeIn(500, 10, 8, 18);
    if (this.escort) this.drawBeach();
    else this.drawBackground();
    const glow = this.add.circle(this.battle.palanquin.x, GROUND_Y - 80, 110, 0xffd76a, 0.12).setDepth(5);
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.22, duration: 1300, yoyo: true, repeat: -1 });
    if (this.escort) {
      this.palImg = this.add.image(this.battle.palanquin.x + 10, GROUND_Y + 14, 'wangchuan').setOrigin(0.5, 1).setScale(0.95).setDepth(18);
    } else {
      this.palImg = this.add.image(this.battle.palanquin.x, GROUND_Y + 10, 'palanquin').setOrigin(0.5, 1).setScale(0.78 * BIG).setDepth(20);
    }
    this.palHp = this.add.graphics().setDepth(210);
    this.ropes = this.add.graphics().setDepth(19);
    this.add.rectangle(0, 0, FW, FH, this.escort ? 0x1a2a6a : 0x3a1a6a, 0.16).setOrigin(0).setDepth(200).setBlendMode(Phaser.BlendModes.MULTIPLY);
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

  /** 第二章：大鵬澳的夜。遠方是海和漁火，腳下是沙灘；王船往右走，沙灘往左捲 */
  private drawBeach(): void {
    const sky = this.add.graphics().setDepth(-100);
    sky.fillGradientStyle(0x050816, 0x050816, 0x1a1a44, 0x1a1a44, 1);
    sky.fillRect(0, 0, FW, GROUND_Y);
    this.add.circle(FW * 0.18, 100, 36, 0xfff3c4, 0.8).setDepth(-99);
    for (let i = 0; i < 40; i++) this.add.circle(Phaser.Math.Between(0, FW), Phaser.Math.Between(10, 240), 1.5, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8)).setDepth(-99);
    const sea = this.add.tileSprite(0, GROUND_Y - 70, FW, 200, 'seaFarN').setOrigin(0, 1).setDepth(-95);
    this.scroll.push(sea);
    // 右邊（海那邊）越來越暗：黑潮在那裡
    const dark = this.add.graphics().setDepth(-90);
    for (let i = 0; i < 24; i++) {
      dark.fillStyle(0x05040c, 0.025 * i);
      dark.fillRect(FW * 0.6 + i * 22, 0, 22, GROUND_Y - 60);
    }
    const sand = this.add.tileSprite(0, GROUND_Y - 84, FW, FH - GROUND_Y + 84, 'sandN').setOrigin(0, 0).setDepth(-70);
    this.scroll.push(sand);
    // 沿路的金紙堆與火把
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(80 + i * 230, GROUND_Y - 70, i % 2 ? 'torch' : 'jinzhi').setOrigin(0.5, 1).setDepth(-65).setScale(0.9);
      p.setData('scroll', true);
      if (i % 2) this.tweens.add({ targets: p, alpha: 0.7, duration: 300 + i * 40, yoyo: true, repeat: -1 });
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
      const big = k === 'heichao';
      img.setScale(big ? 1.25 : (enemy ? (boss ? 0.95 : 0.9) : 0.72) * BIG);
      img.setFlipX(enemy && !big && k !== 'chu');
      if (ghost) img.setTint(0x9ad0ff).setAlpha(0.8);
      img.setData('bx', img.x);
      return img;
    });
    const hp = this.add.graphics();
    c.add([...imgs, hp]);
    c.setDepth(enemy ? (keys[0] === 'heichao' ? 8 : 35) : 30);
    v = { c, imgs, hp, phase: Math.random() * 6 };
    this.views.set(uid, v);
    return v;
  }

  private sync(): void {
    const seen = new Set<number>();
    const b = this.battle;
    const F = CH().finale;
    for (const u of b.units) {
      const st = F.members[u.key];
      const ghost = F.ghostMembers.includes(u.key);
      const v = this.viewFor(u.uid, st.tex, false, ghost);
      seen.add(u.uid);
      v.c.x = u.x;
      let y = GROUND_Y + 10 + (u.row === 'back' ? -12 : 0);
      if (u.moving > 0) y -= Math.abs(Math.sin(this.t * 10 + v.phase)) * 8;
      v.c.y = y;
      v.c.setAlpha(u.alive ? (u.row === 'back' && u.moving <= 0 ? 0.85 : 1) : 0);
      for (const img of v.imgs) {
        if (u.flash > 0.5) img.setTintFill(0xffffff);
        else if (ghost) img.setTint(0x9ad0ff);
        else img.clearTint();
      }
      this.bar(v, u.alive && u.hp < u.maxHp, u.hp / u.maxHp, -240, 80, 0x6fe08a);
    }
    this.ropes.clear();
    for (const e of b.enemies) {
      const boss = e === b.boss;
      const tex = boss ? (this.escort ? 'heichao' : 'shiju') : e.id;
      const v = this.viewFor(e.uid, [tex], true);
      seen.add(e.uid);
      v.c.x = e.x;
      let y = GROUND_Y + 10;
      if (boss && this.escort) {
        // 黑潮：浪頭升起時整團長高
        const rise = e.state === 'paw' ? Math.min(1, e.stateTime / 2.5) : e.state === 'charge' ? 1 : 0;
        v.c.y = GROUND_Y + 40 - rise * 60 + Math.sin(this.t * 1.5) * 6;
        v.c.setScale(1 + rise * 0.25);
        for (const img of v.imgs) img.setTint(e.state === 'paw' ? 0x9a8aff : e.state === 'breath' ? 0x5a6a8a : 0xffffff);
        continue;
      }
      if (e.id === 'chu') {
        // 觸手：在原地搖，拉一條繩子拖著王船
        for (const img of v.imgs) img.angle = Math.sin(this.t * 2.4 + v.phase) * 8;
        if (e.alive) {
          this.ropes.lineStyle(6, 0x1a1a3a, 0.85);
          this.ropes.beginPath();
          this.ropes.moveTo(e.x, GROUND_Y - 40);
          this.ropes.lineTo((e.x + b.palanquin.x) / 2, GROUND_Y + 10 + Math.sin(this.t * 3 + v.phase) * 10);
          this.ropes.lineTo(b.palanquin.x + 80, GROUND_Y - 30);
          this.ropes.strokePath();
        }
      } else if (!boss && e.id !== 'kui') y -= 10 + Math.sin(this.t * 3 + v.phase) * 6;
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
        if (e.id !== 'chu') img.angle = e.stun > 0 ? Math.sin(this.t * 20) * 8 : 0;
      }
      if (!boss) this.bar(v, e.alive && e.hp < e.maxHp, e.hp / e.maxHp, e.id === 'chu' ? -230 : -140, 60, 0xd04aff);
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
    // 捲浪
    if (b.wave) {
      if (!this.waveImg) this.waveImg = this.add.image(b.wave.x, GROUND_Y + 30, 'wave').setOrigin(0.3, 1).setDepth(60).setScale(1.2);
      this.waveImg.x = b.wave.x;
    } else if (this.waveImg) {
      const w = this.waveImg;
      this.waveImg = undefined;
      this.tweens.add({ targets: w, alpha: 0, scaleY: 0.3, duration: 400, onComplete: () => w.destroy() });
    }
    // 王船往前走：沙灘和海往左捲
    if (this.escort) {
      const d = (b.shipProg - this.lastProg) * 2600;
      this.lastProg = b.shipProg;
      if (d !== 0) {
        this.scroll[0].tilePositionX += d * 0.2;
        this.scroll[1].tilePositionX += d;
        for (const o of this.children.list) {
          const img = o as Phaser.GameObjects.Image;
          if (img.getData?.('scroll')) {
            img.x -= d;
            if (img.x < -100) img.x += 1380;
          }
        }
      }
      // 王船走路時微微搖晃
      this.palImg.y = GROUND_Y + 14 - (b.shipSpeed > 0 ? Math.abs(Math.sin(this.t * 4)) * 4 : 0);
      for (const f of this.fire) f.setAlpha(b.fireT > 0 ? 0.6 + Math.sin(this.t * 18 + f.x) * 0.3 : 0);
    }
    const p = b.palanquin;
    if (p.flash > 0.5) this.palImg.setTint(0xff8080);
    else this.palImg.clearTint();
    this.palHp.clear();
    const hy = this.escort ? GROUND_Y - 330 : GROUND_Y - 300;
    this.palHp.fillStyle(0x000000, 0.65);
    this.palHp.fillRoundedRect(p.x - 99, hy, 198, 24, 8);
    this.palHp.fillStyle(p.hp / p.maxHp > 0.35 ? 0xffd76a : 0xff5a4a, 1);
    this.palHp.fillRoundedRect(p.x - 95, hy + 4, 190 * Math.max(0, p.hp / p.maxHp), 16, 6);
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
    const esc = this.escort;
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
          this.hud.toast(esc ? '黑潮的浪頭升起來了！馬上要捲浪：血少的退到後排' : '石駒刨地！馬上要衝鋒：血少的退到後排', 0xff6a6a, 2600);
          break;
        case 'charge':
          this.cameras.main.shake(500, 0.008);
          break;
        case 'breath':
          this.hud.toast(esc ? '退潮了：王船順著退潮走得快' : run.intel.bellyWound ? '石駒喘息中：打肚子的舊傷！把輸出推上前排' : '石駒喘息中：趁現在猛攻', 0xffd0d0, 2600);
          break;
        case 'callout':
          if (esc) this.hud.toast('浪頭半路散了', 0xfff3c4, 2400);
          else this.hud.toast(run.b.xiaoyun === 'invited' && !this.hud.usedCallout ? '小芸：「石駒，不要！」' : '石駒停了下來', 0xfff3c4, 2400);
          this.hud.usedCallout = true;
          break;
        case 'smite':
          this.lightning(e.x, e.r);
          break;
        case 'bless':
          this.ring(this.battle.palanquin.x, 260, 0x8ff0a4);
          break;
        case 'fire':
          this.flames(e.x0, e.x1);
          this.hud.toast('五王火：火牆擋在陣前', 0xffb04a);
          break;
        case 'decree':
          this.decree(e.x);
          if (e.id === 'chu') this.hud.toast('王令：觸手被押上王船，鬆手了', 0xffd76a);
          break;
        case 'grab':
          this.ring(e.x, 120, 0x5a5aaa);
          this.hud.toast('觸手從沙裡伸出來，拖住王船！（王令、五王火）', 0xb0b0ff, 2400);
          break;
        case 'pushback':
          this.hud.toast('前排沒人：浪打上王船，往回推了一段', 0xff8a8a, 2400);
          break;
        case 'palanquin':
          this.cameras.main.shake(120, 0.004);
          break;
        case 'trial':
          this.hud.trial(e.round);
          break;
        case 'skill':
          if (e.id === 'huichun' || e.id === 'pingan') {
            this.ring(FW / 2 - 100, 420, 0x8ff0a4);
            this.hud.toast(e.id === 'pingan' ? '平安米：全隊回血' : '回春符：全隊回血', 0x8ff0a4);
          }
          if (e.id === 'hanshuang') {
            this.cameras.main.flash(300, 160, 220, 255);
            this.hud.toast('寒霜令：小妖都定住了', 0xa8e0ff);
          }
          if (e.id === 'zhensha') this.hud.toast('鎮煞鈴：石駒停了下來', 0xfff3c4, 2400);
          if (e.id === 'dingfeng') this.hud.toast('定風旗：浪頭散了', 0xfff3c4, 2400);
          if (e.id === 'shunfeng') {
            this.cameras.main.flash(200, 200, 230, 255);
            this.hud.toast('順風令：王船乘風走得飛快', 0xbfe8ff, 2400);
          }
          break;
        case 'end':
          this.over = true;
          this.time.delayedCall(600, () => this.hud.finish(e.result));
          break;
      }
    }
  }

  private shot(from: number, to: number, kind: 'firecracker' | 'flag'): void {
    const color = this.escort ? (kind === 'flag' ? 0x8ff0c4 : 0xf2f0e6) : kind === 'firecracker' ? 0xff4a3a : 0x8ff0c4;
    const p = this.add.image(from, GROUND_Y - 70, 'spark').setTint(color).setDepth(70).setScale(1.4);
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

  /** 五王火：一排火焰（五種顏色的王火） */
  private flames(x0: number, x1: number): void {
    for (const f of this.fire) f.destroy();
    this.fire = [];
    const colors = [0xffd76a, 0xff6a3a, 0xffffff, 0x8ff0a4, 0x9fd0ff];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / (n - 1);
      const f = this.add.image(x, GROUND_Y + 20, 'flame').setOrigin(0.5, 1).setTint(colors[i % 5]).setDepth(55).setScale(1.3, 1.6);
      this.fire.push(f);
    }
    this.cameras.main.flash(200, 255, 160, 80);
  }

  /** 王令：金光一閃，妖怪縮成一點飛向王船 */
  private decree(x: number): void {
    const s = this.add.image(x, GROUND_Y - 80, 'decree').setDepth(250).setScale(0.6).setAlpha(0.9);
    this.tweens.add({ targets: s, x: this.battle.palanquin.x + 60, y: GROUND_Y - 140, scale: 0.15, alpha: 0, duration: 700, ease: 'Cubic.in', onComplete: () => s.destroy() });
    this.ft(x, GROUND_Y - 220, '押上王船', 0xffd76a, 24);
  }
}

/** 最後一戰的操作面板 */
export class BossHud extends Phaser.Scene {
  private boss!: BossScene;
  usedCallout = false;
  private clock!: Phaser.GameObjects.Text;
  private moon!: Phaser.GameObjects.Arc;
  private bossBar!: Phaser.GameObjects.Graphics;
  private goalTxt!: Phaser.GameObjects.Text;
  private palBar!: Phaser.GameObjects.Graphics;
  private palTxt!: Phaser.GameObjects.Text;
  private frontTxt!: Phaser.GameObjects.Text;
  private toastTxt!: Phaser.GameObjects.Text;
  private cards: { uid: number; bg: Phaser.GameObjects.Graphics; bar: Phaser.GameObjects.Graphics; state: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text; x: number; y: number; w: number; h: number }[] = [];
  private skillBtns: { id: SkillId; btn: Button }[] = [];
  private spellBtns: Button[] = [];
  private spellFills: Phaser.GameObjects.Rectangle[] = [];
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
    this.spellBtns = [];
    this.spellFills = [];
    this.ok = [false, false, false];
    this.usedCallout = false;
    const F = CH().finale;
    const esc = this.battle.mode === 'escort';
    this.cameras.main.fadeIn(500, 10, 8, 18);
    txt(this, 24, 16, F.title, 30, C.gold, { serif: true });
    txt(this, 24, 58, F.place, 20, C.paper, { bold: false });
    this.clock = txt(this, W - 96, 34, '19:00', 30, C.paper).setOrigin(1, 0.5);
    this.add.rectangle(this.moonX, 106, this.moonW, 6, 0x3a3442).setOrigin(0, 0.5);
    txt(this, this.moonX + this.moonW + 10, 106, '雞啼', 20, C.gold).setOrigin(0, 0.5);
    this.moon = this.add.circle(this.moonX, 106, 12, 0xfff3c4);
    fullscreenButton(this);
    const fr = this.add.graphics();
    fr.lineStyle(3, C.gold, 0.8);
    fr.lineBetween(0, BAND_Y - 2, W, BAND_Y - 2);
    fr.lineBetween(0, BAND_Y + BAND_H + 1, W, BAND_Y + BAND_H + 1);
    txt(this, 10, BAND_Y + 8, esc ? '◀ 王船' : '◀ 神轎', 18, C.muted).setAlpha(0.8);
    txt(this, W - 10, BAND_Y + 8, F.bossFrom, 18, C.muted).setOrigin(1, 0).setAlpha(0.8);
    this.toastTxt = txt(this, W / 2, BAND_Y + BAND_H - 40, '', 24, 0xffffff, { align: 'center', stroke: '#1d1726', strokeThickness: 6, wordWrap: { width: W - 40, useAdvancedWrap: true } }).setOrigin(0.5).setDepth(50);

    const py = BAND_Y + BAND_H + 4;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1526, 0x1a1526, 0x0e0b16, 0x0e0b16, 1);
    bg.fillRect(0, py, W, H - py);
    let y = py + 16;
    txt(this, 24, y, esc ? '王船離沙灘' : '石駒的煞氣', 20, esc ? 0x9fd0ff : 0xd9b0ff);
    this.goalTxt = txt(this, 190, y, '', 19, C.muted, { bold: false });
    const sp = button(this, W - 90, y + 14, 140, 48, '速度 x1', () => {
      this.boss.speed = this.boss.speed === 1 ? 2 : 1;
      sp.setLabel(`速度 x${this.boss.speed}`);
    }, { size: 20, fill: 0x2a2236 });
    this.bossBar = this.add.graphics().setData('y', y + 32);
    y += 64;
    txt(this, 24, y, esc ? '王船船身' : '神轎', 20, C.gold);
    this.palTxt = txt(this, W - 24, y, '', 18, C.paper, { bold: false }).setOrigin(1, 0);
    this.palBar = this.add.graphics().setData('y', y + 30);
    y += 62;
    this.frontTxt = txt(this, 24, y, '', 18, C.paper);
    txt(this, W - 24, y + 2, '點卡片換前後排（走 2 秒）', 18, C.muted, { bold: false }).setOrigin(1, 0);
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
      const st = F.members[u.key];
      const icon = this.add.image(cx + 40, cy + cardH - 6, st.tex[0]).setOrigin(0.5, 1);
      icon.setScale(Math.min((cardH - 14) / icon.height, 64 / icon.width));
      if (F.ghostMembers.includes(u.key)) icon.setTint(0x9ad0ff);
      const name = txt(this, cx + 80, cy + 10, st.name, st.name.length > 6 ? 17 : 20, C.paper);
      const state = txt(this, cx + 80, cy + 36, '', 17, C.muted, { bold: false });
      const bar = this.add.graphics();
      const hit = this.add.rectangle(cx, cy, colW, cardH, 0xffffff, 0.001).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        if (this.battle.swap(u.uid)) this.cameras.main.flash(80, 255, 240, 200);
        else if (u.row === 'back' && this.battle.frontCount() >= FRONT_MAX) this.toast(`前排最多 ${FRONT_MAX} 個，先讓一個退下來`, 0xffd76a);
      });
      this.cards.push({ uid: u.uid, bg: cardBg, bar, state, name, x: cx, y: cy, w: colW, h: cardH });
    });

    // 主神的兩個法術
    const skillH = 110;
    const by = H - 24 - skillH / 2;
    this.skillW = (W - 48 - 24) / 2;
    const fills = [0x5a2a8a, 0x2f6f5a];
    const fillsEsc = [0x9a3a10, 0x8a6a10];
    ([0, 1] as const).forEach((i) => {
      const id = this.battle.spells[i];
      const x = i === 0 ? 24 + this.skillW / 2 : W - 24 - this.skillW / 2;
      const b = button(this, x, by, this.skillW, skillH, SPELLS[id].name, () => this.battle.cast(i), { size: 34, fill: (esc ? fillsEsc : fills)[i] });
      this.spellBtns.push(b);
      this.spellFills.push(this.add.rectangle(x - this.skillW / 2, by - skillH / 2, this.skillW, skillH, 0x000000, 0.45).setOrigin(0).setDepth(5));
      txt(this, x, by - skillH / 2 - 18, SPELLS[id].desc, 17, C.muted, { bold: false, align: 'center', wordWrap: { width: this.skillW, useAdvancedWrap: true } }).setOrigin(0.5);
    });
    // 超渡的鬼回報的技能
    this.skillBtns = [];
    if (skills.length) {
      const sy = by - skillH / 2 - 76;
      const sw = (W - 48 - 12 * (skills.length - 1)) / skills.length;
      txt(this, 24, sy - 60, '超渡亡魂，神威增長：', 18, 0xffd76a, { bold: false });
      skills.forEach((id, i) => {
        const btn = button(this, 24 + sw / 2 + i * (sw + 12), sy, sw, 60, SKILLS[id].name, () => this.battle.skill(id), { size: 22, fill: 0x7a5a10 });
        this.skillBtns.push({ id, btn });
      });
    }
    this.time.delayedCall(700, () => this.toast(esc
      ? '點陣頭卡片換前排／後排。觸手會拖住王船：用王令押走、五王火燒掉'
      : '點陣頭卡片換前排／後排。前排挨打，後排近戰會回血：輪流上陣扛傷害', 0xfff3c4, 4200));
  }

  toast(s: string, color: number, ms = 1800): void {
    this.toastTxt.setText(s).setColor(`#${color.toString(16).padStart(6, '0')}`).setAlpha(1);
    this.tweens.killTweensOf(this.toastTxt);
    this.tweens.add({ targets: this.toastTxt, alpha: 0, delay: ms, duration: 400 });
  }

  update(): void {
    if (!this.boss?.battle) return;
    const b = this.battle;
    const esc = b.mode === 'escort';
    const hours = 19 + b.timeFrac * 10;
    this.clock.setText(`${String(Math.floor(hours) % 24).padStart(2, '0')}:${String(Math.floor(((hours % 1) * 60) / 10) * 10).padStart(2, '0')}`);
    this.moon.x = this.moonX + this.moonW * b.timeFrac;
    const bw = W - 48;
    const frac = esc ? b.shipProg : Math.max(0, b.boss.hp / b.boss.maxHp);
    const by = this.bossBar.getData('y') as number;
    this.bossBar.clear();
    this.bossBar.fillStyle(0x000000, 0.7);
    this.bossBar.fillRoundedRect(24, by - 2, bw, 22, 8);
    this.bossBar.fillStyle(esc ? 0x3a8ad0 : 0x9b3cff, 1);
    this.bossBar.fillRoundedRect(26, by, (bw - 4) * frac, 18, 6);
    // 陣前審問的刻度
    this.bossBar.fillStyle(0xffd76a, 1);
    for (const f of b.trialMarks) this.bossBar.fillRect(26 + (bw - 4) * f - 1, by - 4, 3, 26);
    if (esc) {
      const g = b.grabbing;
      this.goalTxt.setText(b.windT > 0 ? '順風！' : g ? `被 ${g} 隻觸手拖住${b.shipSpeed <= 0 ? '，動不了' : ''}` : b.boss.state === 'breath' ? '退潮・走得快' : '前進中').setColor(g && b.windT <= 0 ? '#ff9a8a' : '#9fe8c0');
    }
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
      const wait = id === 'zhensha' ? '（等衝鋒）' : id === 'dingfeng' ? '（等捲浪）' : '';
      btn.setLabel(cd > 0 ? `${SKILLS[id].name} ${Math.ceil(cd)}秒` : wait && !b.canSkill(id) ? `${SKILLS[id].name}${wait}` : SKILLS[id].name);
    }
    ([0, 1] as const).forEach((i) => {
      const id = b.spells[i];
      this.spellBtns[i].setEnabled(b.canSpell(i));
      this.spellFills[i].width = this.skillW * (b.spellCd[i] / SPELLS[id].cd);
      this.spellBtns[i].setLabel(b.spellCd[i] > 0 ? `${SPELLS[id].name} ${Math.ceil(b.spellCd[i])}秒` : SPELLS[id].name);
    });
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
    const bossName = CH().finale.bossName;
    if (!u.alive) s = '倒下';
    else if (u.moving > 0) s = u.targetRow === 'front' ? '走上前排…' : '退回後排…';
    else if (u.row === 'front') s = `前排${'①②③'[u.slot] ?? ''}${u.slot === 0 && this.battle.mode !== 'escort' ? `・${bossName}打這個` : ''}`;
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
   * 戰鬥帶上方播一段動畫：魔王說話 → 證據卡飛入 → 結果。
   */
  trial(round: number): void {
    const F = CH().finale;
    const r = F.rounds[round - 1];
    // 依序找：到場的人 → 對得上的證據
    const person = (r.people ?? []).find((p) => p.test(run));
    const ev = r.evidence.find((id) => run.evidence.includes(id));
    const ok = !!person || !!ev;
    this.ok[round - 1] = ok;
    this.battle.answer(round, ok);
    const E = CH().evidence;
    const used = person ? { tag: '上前', name: person.label.replace('請', '').replace('上前', ''), say: person.say } : ev ? { tag: E[ev].kind, name: E[ev].name, say: E[ev].text } : null;
    this.playTrial(round, `${F.bossName}：${r.line}`, used, ok ? `${r.ok}\n${r.effect}` : `手上沒有能說動牠的證據。\n${F.wrong}`, ok);
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
    const say = txt(this, 24, top + 54, line, 23, 0xd9b0ff, { wordWrap: { width: W - 48, useAdvancedWrap: true } });
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
      card.add(txt(this, -cw / 2 + 18, -ch / 2 + 46, used.say, 18, 0x2a1a10, { serif: true, lineSpacing: 3, wordWrap: { width: cw - 36, useAdvancedWrap: true } }));
    } else {
      card.add(txt(this, 0, 0, '（沒有證據）', 22, 0x9a8fae).setOrigin(0.5));
    }
    card.setScale(0.6).setAlpha(0);
    c.add(card);
    this.tweens.add({ targets: card, y: top + 110 + ch / 2, scale: 1, alpha: 1, delay: 500, duration: 380, ease: 'Back.out' });
    // 結果：蓋章＋一行字
    const stamp = txt(this, W - 90, top + 96, ok ? '說動' : '無效', 30, ok ? 0x2f8f5a : 0xb3261e, { serif: true, backgroundColor: '#eee0bd', padding: { x: 8, y: 4 } }).setOrigin(0.5).setAngle(-12).setScale(2.4).setAlpha(0);
    const res = txt(this, 24, top + h - 70, result, 20, ok ? 0x9fe8c0 : 0xff9a8a, { lineSpacing: 4, wordWrap: { width: W - 48, useAdvancedWrap: true } }).setAlpha(0);
    c.add([stamp, res]);
    this.tweens.add({ targets: stamp, scale: 1, alpha: 1, delay: 1100, duration: 220, ease: 'Quad.in', onComplete: () => this.cameras.main.shake(120, 0.004) });
    this.tweens.add({ targets: res, alpha: 1, delay: 1300, duration: 300 });
    // 魔王的反應（戰場那邊）
    this.time.delayedCall(1200, () => {
      if (ok) this.boss.cameras.main.flash(250, 255, 240, 200);
      else this.boss.cameras.main.shake(300, 0.006);
      const bx = this.battle.mode === 'escort' ? TIDE_X - 120 : this.battle.boss.x;
      this.boss.ft(bx, GROUND_Y - 260, ok ? '動搖了' : '更兇了', ok ? 0xfff3c4 : 0xff6a6a, 34);
    });
    // 幾秒後滑出
    this.tweens.add({ targets: c, x: W, delay: 4200, duration: 300, ease: 'Cubic.in', onComplete: () => c.destroy() });
  }

  // ---------- 結束 ----------
  finish(result: 'subdued' | 'lose' | 'dawn'): void {
    const F = CH().finale;
    const esc = this.battle.mode === 'escort';
    const m = this.add.container(0, 0).setDepth(950);
    m.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive());
    const x = 16;
    const pw = W - 32;
    if (result === 'subdued') {
      const last = this.ok[2];
      m.add(panel(this, x, 220, pw, 760));
      m.add(txt(this, W / 2, 260, F.winTitle, 36, C.gold, { serif: true }).setOrigin(0.5, 0));
      m.add(txt(this, x + 24, 320, F.winText, 20, C.paper, { bold: false, wordWrap: { width: pw - 48, useAdvancedWrap: true } }));
      let yy = 380;
      const fills: Record<string, number> = { recall: 0x2f6f5a, return: 0x4a3a6a, slay: 0x8a1b14 };
      for (const o of F.ends) {
        const why = o.needLast && !last ? '陣前審問最後一輪沒有說動牠' : '';
        const b = button(this, x + 110, yy + 50, 170, 70, o.label, () => this.end(o.kind), { size: o.label.length > 3 ? 20 : 24, fill: fills[o.kind] });
        b.setEnabled(!why);
        m.add(b);
        m.add(txt(this, x + 210, yy + 26, why ? `✕ ${why}` : o.desc, 18, why ? 0xff9a8a : C.paper, { bold: false, wordWrap: { width: pw - 230, useAdvancedWrap: true } }));
        yy += 130;
      }
      return;
    }
    run.retries++;
    m.add(panel(this, x, 360, pw, 420));
    const lose = esc ? '王船被拖住了……' : '神轎被衝破了……';
    m.add(txt(this, W / 2, 400, result === 'dawn' ? '雞啼・天亮了' : lose, 36, result === 'dawn' ? C.gold : 0xff8a8a, { serif: true }).setOrigin(0.5, 0));
    m.add(txt(this, x + 24, 470, result === 'dawn' ? F.dawnText : F.loseText, 20, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: pw - 48, useAdvancedWrap: true } }));
    m.add(button(this, W / 2, 700, 280, 72, '重整再戰', () => this.boss.leave('boss'), { size: 26, fill: 0x2f6f5a }));
  }

  private end(kind: 'recall' | 'return' | 'slay'): void {
    run.shijuEnd = kind;
    run.shijuJoined = kind === 'recall';
    if (kind === 'slay') run.liqi = Math.min(3, run.liqi + 1);
    if (kind === 'recall') this.boss.leave('story', { id: CH().finale.recallStory, next: { key: 'end' } }, 800);
    else this.boss.leave('end', undefined, 800);
  }
}
