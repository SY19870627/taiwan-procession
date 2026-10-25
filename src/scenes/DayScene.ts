/**
 * 白天：祈福。隊伍在畫面上原地前進、背景往後捲，沿途遇到事件；走完一天就天黑。
 */
import Phaser from 'phaser';
import { C, H, W, GROUND_Y, TIME_SCALE, lerpColor } from '../theme';
import { Street } from '../art/backdrop';
import { Procession } from '../art/procession';
import { DAYS, type DayEvent, type Outcome } from '../content/days';
import { run, applyDelta } from '../state';
import { ResourceBar, button, floatText, fullscreenButton, go, panel, txt } from '../ui/widgets';

export class DayScene extends Phaser.Scene {
  private street!: Street;
  private proc!: Procession;
  private bar!: ResourceBar;
  private day = 1;
  private p = 0;
  private paused = false;
  private fast = false;
  private done = new Set<number>();
  private clock!: Phaser.GameObjects.Text;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private dusk!: Phaser.GameObjects.Rectangle;
  private ended = false;
  private skyTimer = 0;
  private smokeTimer = 0;

  constructor() {
    super('day');
  }

  create(data: { day: number }): void {
    this.day = data.day ?? 1;
    run.day = this.day;
    this.p = 0;
    this.paused = false;
    this.fast = false;
    this.ended = false;
    this.done = new Set();
    const def = DAYS[this.day];
    this.cameras.main.fadeIn(500, 10, 8, 18);
    this.street = new Street(this, { night: false, theme: def.theme, hour: 8 });
    this.street.setRuralMix(def.ruralFrom);
    this.proc = new Procession(this, W - 70, 0.78, run.followers);
    this.dusk = this.add.rectangle(0, 0, W, H, 0x2a1440, 0).setOrigin(0).setDepth(300);

    // 上方：標題、時鐘、資源
    const top = this.add.graphics().setDepth(890);
    top.fillStyle(0x1d1726, 0.82);
    top.fillRoundedRect(16, 14, 470, 76, 12);
    top.lineStyle(2, C.gold, 0.7);
    top.strokeRoundedRect(16, 14, 470, 76, 12);
    txt(this, 34, 22, `${def.title}・白天祈福`, 26, C.gold, { serif: true }).setDepth(891);
    txt(this, 34, 58, def.route, 18, C.paper, { bold: false }).setDepth(891);
    this.clock = txt(this, 470, 34, '08:00', 24, C.paper).setOrigin(1, 0.5).setDepth(891);
    this.bar = new ResourceBar(this, 500, 14);
    // 路程進度條（事件位置標成小點）
    const px = 500;
    const pw = 420;
    this.add.rectangle(px, 76, pw, 8, 0x3a3442).setOrigin(0, 0.5).setDepth(890);
    this.progressFill = this.add.rectangle(px, 76, 0, 8, C.gold).setOrigin(0, 0.5).setDepth(891);
    for (const ev of def.events) this.add.circle(px + pw * ev.at, 76, 6, ev.jiao ? C.red : C.paper).setDepth(892);
    // 新聞跑馬燈（陽間看到的怪事）
    this.ticker(def.news);
    // 快轉、全螢幕
    const fastBtn = button(this, W - 90, H - 110, 140, 56, '快轉 ▶▶', () => {
      this.fast = !this.fast;
      fastBtn.setLabel(this.fast ? '正常 ▶' : '快轉 ▶▶');
    }, { size: 20, fill: 0x2a2236 });
    fastBtn.setDepth(895);
    fullscreenButton(this);
  }

  private ticker(news: string[]): void {
    const y = H - 26;
    this.add.rectangle(0, y, W, 44, 0x0d0a14, 0.85).setOrigin(0, 0.5).setDepth(880);
    const label = txt(this, 0, y, '　新聞快報　', 20, 0x1d1726, { backgroundColor: '#e9b949', padding: { x: 4, y: 6 } }).setOrigin(0, 0.5).setDepth(882);
    const line = news.join('　　　◆　　　');
    const t = txt(this, W, y, line, 20, C.paper, { bold: false }).setOrigin(0, 0.5).setDepth(881);
    const loop = () => {
      t.x = W;
      this.tweens.add({ targets: t, x: label.width - t.width - 40, duration: (t.width + W) * 9, ease: 'Linear', onComplete: loop });
    };
    loop();
  }

  update(_t: number, dms: number): void {
    const dt = Math.min(0.05, dms / 1000);
    this.proc.update(this.paused ? 0 : dt * (this.fast ? 1.6 : 1));
    if (this.paused || this.ended) return;
    const def = DAYS[this.day];
    const mul = (this.fast ? 2 : 1) * TIME_SCALE;
    this.p = Math.min(1, this.p + (dt * mul) / def.length);
    this.street.update(dt, 110 * mul);
    this.street.setRuralMix(def.ruralFrom + (def.ruralTo - def.ruralFrom) * this.p);
    const hour = 8 + this.p * 10;
    this.skyTimer -= dt;
    if (this.skyTimer <= 0) {
      this.skyTimer = 0.4;
      this.street.setHour(hour);
      // 傍晚開始轉暗
      this.dusk.setAlpha(Math.max(0, (hour - 16.5) / 1.5) * 0.35);
    }
    const hh = Math.floor(hour);
    this.clock.setText(`${String(hh).padStart(2, '0')}:${String(Math.floor((hour - hh) * 60 / 10) * 10).padStart(2, '0')}`);
    this.progressFill.width = 420 * this.p;
    // 隊伍前面偶爾放鞭炮
    this.smokeTimer -= dt;
    if (this.smokeTimer <= 0) {
      this.smokeTimer = Phaser.Math.FloatBetween(3, 6);
      this.firecracker(W - Phaser.Math.Between(140, 420));
    }
    for (let i = 0; i < def.events.length; i++) {
      if (!this.done.has(i) && this.p >= def.events[i].at) {
        this.done.add(i);
        this.showEvent(def.events[i]);
        return;
      }
    }
    if (this.p >= 1) this.endDay();
  }

  private firecracker(x: number): void {
    for (let i = 0; i < 14; i++) {
      const sp = this.add.image(x + Phaser.Math.Between(-30, 30), GROUND_Y - Phaser.Math.Between(0, 40), 'spark')
        .setTint(Phaser.Math.RND.pick([0xff4a3a, 0xffd76a])).setScale(Phaser.Math.FloatBetween(0.3, 0.8)).setDepth(40);
      this.tweens.add({ targets: sp, y: sp.y - Phaser.Math.Between(20, 70), x: sp.x - Phaser.Math.Between(0, 60), alpha: 0, duration: 600, onComplete: () => sp.destroy() });
    }
    for (let i = 0; i < 3; i++) {
      const sm = this.add.image(x + i * 12, GROUND_Y - 10, 'smoke').setAlpha(0.35).setScale(0.8).setDepth(39);
      this.tweens.add({ targets: sm, x: sm.x - 120, y: sm.y - 40, scale: 2.4, alpha: 0, duration: 2200, onComplete: () => sm.destroy() });
    }
  }

  // ---------- 事件 ----------
  private showEvent(ev: DayEvent): void {
    this.paused = true;
    const objs: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      objs.push(o);
      (o as unknown as Phaser.GameObjects.Components.Depth).setDepth?.(920);
      return o;
    };
    const close = () => {
      for (const o of objs) o.destroy();
      this.paused = false;
    };
    const pw = Math.min(820, W - 80);
    const ph = 420;
    const x = (W - pw) / 2;
    const y = 110;
    add(this.add.rectangle(0, 0, W, H, 0x000000, 0.35).setOrigin(0).setInteractive());
    add(panel(this, x, y, pw, ph));
    add(txt(this, W / 2, y + 40, ev.jiao ? `擲筊・${ev.title}` : ev.title, 34, C.gold, { serif: true }).setOrigin(0.5));
    const body = add(txt(this, x + 50, y + 90, ev.text, 26, C.paper, { bold: false, lineSpacing: 10, wordWrap: { width: pw - 100, useAdvancedWrap: true } }));

    const showResult = (o: Outcome, extra?: () => void) => {
      body.setText(o.text);
      this.apply(o);
      extra?.();
      add(button(this, W / 2, y + ph - 60, 220, 66, '繼續', close, { size: 26, fill: 0x2f6f5a }));
    };

    if (ev.choices) {
      const btns = ev.choices.map((c, i) =>
        add(button(this, W / 2 + (i === 0 ? -1 : 1) * (pw / 4), y + ph - 70, pw / 2 - 50, 76, c.label, () => {
          for (const b of btns) b.destroy();
          showResult(c.outcome);
        }, { size: 24, fill: i === 0 ? 0x8a1b14 : 0x3a3a5a })));
    } else if (ev.jiao) {
      const j = ev.jiao;
      const ask = add(txt(this, W / 2, y + 200, `請示：${j.ask}`, 30, C.gold).setOrigin(0.5));
      const throwBtn = add(button(this, W / 2, y + ph - 70, 260, 76, '擲　筊', () => {
        throwBtn.destroy();
        this.throwJiao(y + 230, add, (r) => {
          const o = r === 'holy' ? j.holy : r === 'laugh' ? j.laugh : j.yin;
          const name = r === 'holy' ? '聖杯' : r === 'laugh' ? '笑杯' : '陰杯';
          ask.destroy();
          add(txt(this, W / 2, y + 205, name, 44, r === 'holy' ? C.gold : C.paper, { serif: true }).setOrigin(0.5));
          showResult(o);
        });
      }, { size: 30, fill: 0x8a1b14 }));
    }
  }

  /** 擲筊動畫：兩片筊往上拋、轉幾圈、落地。聖杯 50%、笑杯 25%、陰杯 25% */
  private throwJiao(y: number, add: <T extends Phaser.GameObjects.GameObject>(o: T) => T, cb: (r: 'holy' | 'laugh' | 'yin') => void): void {
    const roll = Math.random();
    const r: 'holy' | 'laugh' | 'yin' = roll < 0.5 ? 'holy' : roll < 0.75 ? 'laugh' : 'yin';
    const faces = r === 'holy' ? ['jiao_flat', 'jiao_round'] : r === 'laugh' ? ['jiao_flat', 'jiao_flat'] : ['jiao_round', 'jiao_round'];
    let landed = 0;
    [-70, 70].forEach((dx, i) => {
      const img = add(this.add.image(W / 2 + dx * 0.3, y + 40, 'jiao_flat').setScale(1.4));
      this.tweens.add({ targets: img, y: y - 120, duration: 380, ease: 'Quad.out', yoyo: true });
      this.tweens.add({ targets: img, x: W / 2 + dx, angle: 720 + i * 180, duration: 760, ease: 'Linear', onComplete: () => {
        img.setTexture(faces[i]).setAngle(i ? 180 : 0);
        if (faces[i] === 'jiao_round') img.setFlipY(true);
        this.cameras.main.shake(80, 0.004);
        if (++landed === 2) this.time.delayedCall(300, () => cb(r));
      } });
    });
  }

  private apply(o: Outcome): void {
    const before = run.followers;
    applyDelta(o);
    if (o.effect === 'ally') run.allied = true;
    if (o.effect === 'bellyWound') run.intel.bellyWound = true;
    if (o.effect === 'mainSideRight') run.intel.mainSide = 1;
    this.bar.refresh();
    this.proc.syncFollowers(run.followers);
    const cx = W / 2;
    if (o.incense) floatText(this, cx - 120, 560, `香火 ${o.incense > 0 ? '+' : ''}${o.incense}`, C.gold);
    if (o.followers) floatText(this, cx, 600, `信徒 ${run.followers - before >= 0 ? '+' : ''}${run.followers - before}`, 0x8ff0a4);
    if (o.morale) floatText(this, cx + 120, 560, `士氣 ${o.morale > 0 ? '+' : ''}${o.morale}`, 0x9fd0ff);
  }

  private endDay(): void {
    this.ended = true;
    this.proc.walking = false;
    this.proc.setTint(lerpColor(0xffffff, 0x6a5a9a, 0.4));
    const t = txt(this, W / 2, H / 2 - 60, '日落・隊伍駐駕', 48, C.gold, { serif: true, stroke: '#1d1726', strokeThickness: 8 }).setOrigin(0.5).setDepth(950).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 600 });
    this.tweens.add({ targets: this.dusk, alpha: 0.6, duration: 1500 });
    this.time.delayedCall(2000, () => go(this, 'story', { id: DAYS[this.day].dusk, next: { key: 'prep', data: { night: this.day } } }, 700));
  }
}
