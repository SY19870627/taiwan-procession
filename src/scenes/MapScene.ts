/**
 * 白天：街區地圖。選一條路線，神轎沿路停轎，處理每一站的信徒卡。
 * 時辰有限、神蹟稀少；每個選項的花費、結果、不處理的後果都寫在卡上。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { DAY_PLANS, MIRACLE_COST, MIRACLE_WAVES, ledger, nightEffects, type Card, type DayPlan, type Option, type Route, type Stop } from '../content/believers';
import { run, applyDelta } from '../state';
import { ResourceBar, button, floatText, fullscreenButton, go, panel, txt, type Button } from '../ui/widgets';

const HOUR_NAMES = ['辰', '巳', '午', '未', '申'];
const PANEL_W = 540;

export class MapScene extends Phaser.Scene {
  private plan!: DayPlan;
  private bar!: ResourceBar;
  private hourBoxes: Phaser.GameObjects.Text[] = [];
  private miracleDots: Phaser.GameObjects.Arc[] = [];
  private side!: Phaser.GameObjects.Container;
  private routeGfx = new Map<string, Phaser.GameObjects.Graphics>();
  private icon!: Phaser.GameObjects.Image;
  private mapRect = { x: 20, y: 104, w: 0, h: 0 };
  private chosen?: Route;
  private stopIdx = 0;
  private busy = false;

  constructor() {
    super('map');
  }

  create(data: { day: number }): void {
    const day = data.day ?? 1;
    this.plan = DAY_PLANS[day];
    run.day = day;
    run.hours = this.plan.hours;
    run.miracles = this.plan.miracles;
    run.tonight = { miracles: 0, cleared: false };
    this.chosen = undefined;
    this.stopIdx = 0;
    this.busy = false;
    this.hourBoxes = [];
    this.miracleDots = [];
    this.routeGfx = new Map();
    this.visited = new Set();
    this.markers = undefined;
    this.mapRect = { x: 20, y: 104, w: W - PANEL_W - 60, h: H - 124 };
    this.cameras.main.fadeIn(500, 10, 8, 18);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a1a14, 0x2a1a14, 0x160d0a, 0x160d0a, 1);
    bg.fillRect(0, 0, W, H);
    this.drawMap();
    this.drawHeader();
    this.side = this.add.container(0, 0);
    this.showRouteChoice();

    const mr = this.mapRect;
    button(this, mr.x + 90, mr.y + mr.h - 40, 160, 52, '因果簿', () => this.showLedger(), { size: 22, fill: 0x4a2a3a }).setDepth(50);
    button(this, mr.x + 260, mr.y + mr.h - 40, 160, 52, '隊伍整備', () => {
      if (this.busy) return;
      this.scene.pause();
      this.scene.launch('unit', { from: 'map' });
    }, { size: 22, fill: 0x4a2a3a }).setDepth(50);
    this.events.off('resume');
    this.events.on('resume', () => this.refreshHeader());
    fullscreenButton(this);
  }

  // ---------- 地圖 ----------
  private pt(s: { x: number; y: number }): { x: number; y: number } {
    const r = this.mapRect;
    return { x: r.x + 40 + s.x * (r.w - 80), y: r.y + 30 + s.y * (r.h - 110) };
  }

  private drawMap(): void {
    const r = this.mapRect;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRect(r.x + 5, r.y + 6, r.w, r.h);
    g.fillStyle(0xe8dcbc, 1);
    g.fillRect(r.x, r.y, r.w, r.h);
    const rnd = new Phaser.Math.RandomDataGenerator([`map${this.plan.day}`]);
    for (let i = 0; i < 24; i++) {
      g.fillStyle(0xc9a76a, rnd.realInRange(0.04, 0.12));
      g.fillEllipse(r.x + rnd.between(0, r.w), r.y + rnd.between(0, r.h), rnd.between(40, 200), rnd.between(20, 100));
    }
    // 田
    if (this.plan.map.fields) {
      for (let i = 0; i < 14; i++) {
        g.fillStyle(0x8aa86a, 0.35);
        g.fillRect(r.x + rnd.between(40, r.w - 120), r.y + rnd.between(40, r.h - 120), rnd.between(50, 110), rnd.between(30, 70));
      }
    }
    // 山
    if (this.plan.map.hill) {
      const hx = r.x + r.w * 0.86;
      const hy = r.y + r.h * 0.2;
      for (let k = 5; k > 0; k--) {
        g.lineStyle(2, 0x6a7a4a, 0.5);
        g.strokeEllipse(hx, hy, 60 + k * 50, 40 + k * 32);
      }
      txt(this, hx, hy + 10, '芝嶺巖', 20, 0x4a5a2a, { serif: true }).setOrigin(0.5);
    }
    // 街道
    g.lineStyle(3, 0xc0a880, 0.6);
    for (let x = r.x + 60; x < r.x + r.w; x += 90 + rnd.between(-20, 20)) g.lineBetween(x, r.y, x + rnd.between(-30, 30), r.y + r.h);
    for (let y = r.y + 50; y < r.y + r.h; y += 80 + rnd.between(-15, 15)) g.lineBetween(r.x, y, r.x + r.w, y + rnd.between(-20, 20));
    // 河
    if (this.plan.map.river) {
      g.lineStyle(34, 0x7fa6b8, 0.55);
      g.beginPath();
      g.moveTo(r.x + 30, r.y);
      for (let y = 0; y <= r.h; y += 40) g.lineTo(r.x + 24 + Math.sin(y / 70) * 16, r.y + y);
      g.strokePath();
    }
    g.lineStyle(3, 0x8a6a3a, 1);
    g.strokeRect(r.x, r.y, r.w, r.h);
    txt(this, r.x + r.w - 16, r.y + 12, `${this.plan.area}`, 22, 0x5a3a1a, { serif: true }).setOrigin(1, 0);

    // 路線
    const start = this.pt(this.plan.start);
    for (const route of this.plan.routes) {
      const rg = this.add.graphics();
      this.routeGfx.set(route.id, rg);
      this.drawRoute(rg, route, 1);
    }
    // 起點
    this.add.circle(start.x, start.y, 16, 0xb3261e).setStrokeStyle(3, 0xe9b949);
    txt(this, start.x, start.y + 22, this.plan.start.label, 18, 0x5a1a10, { serif: true }).setOrigin(0.5, 0);
    this.drawMarkers();
    this.icon = this.add.image(start.x, start.y - 6, 'palanquin').setScale(0.24).setOrigin(0.5, 1).setDepth(20);
    this.tweens.add({ targets: this.icon, y: start.y - 10, duration: 500, yoyo: true, repeat: -1 });
  }

  private markers?: Phaser.GameObjects.Container;
  private visited = new Set<string>();

  /** 停轎地點：急事紅色、一般金色、平靜灰色；處理過的打勾 */
  private drawMarkers(): void {
    this.markers?.destroy();
    this.markers = this.add.container(0, 0).setDepth(10);
    const seen = new Set<string>();
    for (const route of this.plan.routes) {
      for (const s of route.stops) {
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        const p = this.pt(s);
        const card = s.card(run);
        const done = this.visited.has(s.id);
        const urgent = !!card?.deadline && !done;
        const fill = done ? 0x2f8f5a : card ? (urgent ? 0xd23a2a : 0xe9b949) : 0x9a8a6a;
        this.markers.add(this.add.circle(p.x, p.y, 13, fill).setStrokeStyle(3, 0x3a2410));
        if (done) this.markers.add(txt(this, p.x, p.y, '✓', 16, 0xffffff).setOrigin(0.5));
        this.markers.add(txt(this, p.x, p.y + 18, card ? `${s.place}\n${card.who}` : s.place, 17, 0x3a2410, { align: 'center' }).setOrigin(0.5, 0));
        if (urgent) this.markers.add(txt(this, p.x, p.y - 20, '急', 16, 0xffffff, { backgroundColor: '#d23a2a', padding: { x: 4, y: 1 } }).setOrigin(0.5, 1));
      }
    }
  }

  private drawRoute(g: Phaser.GameObjects.Graphics, route: Route, alpha: number): void {
    g.clear();
    const pts = [this.pt(this.plan.start), ...route.stops.map((s) => this.pt(s))];
    g.lineStyle(8, route.color, 0.75 * alpha);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
    g.strokePath();
    const mid = pts[1];
    if (alpha > 0.5) txt(this, (pts[0].x + mid.x) / 2, (pts[0].y + mid.y) / 2 - 18, `${route.id}`, 22, 0xffffff, { backgroundColor: `#${route.color.toString(16).padStart(6, '0')}`, padding: { x: 6, y: 2 } }).setOrigin(0.5);
  }

  // ---------- 上方資訊 ----------
  private drawHeader(): void {
    const g = this.add.graphics();
    g.fillStyle(0x1d1726, 0.88);
    g.fillRoundedRect(16, 12, 640, 80, 12);
    g.lineStyle(2, C.gold, 0.7);
    g.strokeRoundedRect(16, 12, 640, 80, 12);
    txt(this, 34, 20, `${this.plan.title}・白天`, 28, C.gold, { serif: true });
    txt(this, 34, 58, this.plan.area, 18, C.paper, { bold: false });
    txt(this, 290, 22, '時辰', 18, C.muted);
    for (let i = 0; i < this.plan.hours; i++) {
      this.hourBoxes.push(txt(this, 340 + i * 44, 30, HOUR_NAMES[i], 24, '#1d1726', { serif: true, backgroundColor: '#e9b949', padding: { x: 7, y: 3 } }).setOrigin(0, 0.5));
    }
    txt(this, 290, 64, '神蹟', 18, C.muted);
    for (let i = 0; i < this.plan.miracles; i++) {
      this.miracleDots.push(this.add.circle(354 + i * 32, 66, 11, 0xffd76a).setStrokeStyle(2, 0xb3261e));
    }
    txt(this, 430, 64, `每次：香火 ${MIRACLE_COST}、今晚妖怪 +${MIRACLE_WAVES} 波`, 15, C.muted, { bold: false }).setOrigin(0, 0.5);
    this.bar = new ResourceBar(this, W - 520, 20);
    this.refreshHeader();
  }

  private refreshHeader(): void {
    const used = this.plan.hours - run.hours;
    this.hourBoxes.forEach((b, i) => b.setAlpha(i < used ? 0.25 : 1));
    this.miracleDots.forEach((d, i) => d.setFillStyle(i < run.miracles ? 0xffd76a : 0x3a3442));
    this.bar.refresh();
  }

  // ---------- 右側面板 ----------
  private resetSide(): { x: number; y: number; w: number; h: number } {
    this.side.destroy();
    this.side = this.add.container(0, 0).setDepth(30);
    const x = W - PANEL_W - 24;
    const y = 104;
    const w = PANEL_W;
    const h = H - 124;
    this.side.add(panel(this, x, y, w, h));
    return { x, y, w, h };
  }

  private add2<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.side.add(o);
    return o;
  }

  /** 一張卡上，最便宜的選項要幾個時辰 */
  private minHours(card: Card | null): number {
    if (!card) return 0;
    return Math.min(...card.options.map((o) => o.hours));
  }

  private showRouteChoice(): void {
    const p = this.resetSide();
    this.add2(txt(this, p.x + 24, p.y + 16, '選擇今天的路線', 28, C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 54, `時辰只夠走一條。另一條路上的人，今天沒人照顧。`, 17, C.paper, { bold: false, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    const blockH = (p.h - 110) / this.plan.routes.length;
    this.plan.routes.forEach((route, i) => {
      const by = p.y + 92 + i * blockH;
      const g = this.add2(this.add.graphics());
      g.fillStyle(route.color, 0.18);
      g.fillRoundedRect(p.x + 16, by, p.w - 32, blockH - 12, 10);
      g.lineStyle(2, route.color, 0.9);
      g.strokeRoundedRect(p.x + 16, by, p.w - 32, blockH - 12, 10);
      let total = 0;
      const lines: string[] = [];
      for (const s of route.stops) {
        const c = s.card(run);
        const hrs = this.minHours(c);
        total += hrs;
        lines.push(c ? `・${s.place}　${c.who}${c.deadline ? `【急・${c.deadline}】` : ''}　${hrs} 時辰起` : `・${s.place}　（今天平靜）`);
      }
      this.add2(txt(this, p.x + 32, by + 12, `${route.id}・${route.name}`, 24, 0xffffff, { serif: true }));
      this.add2(txt(this, p.x + 32, by + 46, lines.join('\n'), 17, C.paper, { bold: false, lineSpacing: 6, wordWrap: { width: p.w - 64, useAdvancedWrap: true } }));
      const b = this.add2(button(this, p.x + p.w - 110, by + blockH - 46, 160, 46, `走${route.id}線`, () => this.chooseRoute(route), { size: 20, fill: route.color }));
      this.add2(txt(this, p.x + p.w - 200, by + blockH - 46, `最少 ${total} 時辰`, 16, C.muted, { bold: false }).setOrigin(1, 0.5));
      b.on('pointerover', () => this.highlight(route.id));
    });
  }

  private highlight(id: string): void {
    for (const route of this.plan.routes) this.drawRoute(this.routeGfx.get(route.id)!, route, route.id === id ? 1 : 0.25);
  }

  private chooseRoute(route: Route): void {
    this.chosen = route;
    this.highlight(route.id);
    this.stopIdx = 0;
    this.nextStop();
  }

  private nextStop(): void {
    const route = this.chosen!;
    if (this.stopIdx >= route.stops.length) return this.endRoute();
    const stop = route.stops[this.stopIdx++];
    const p = this.pt(stop);
    this.busy = true;
    this.tweens.killTweensOf(this.icon);
    this.tweens.add({
      targets: this.icon, x: p.x, y: p.y - 6, duration: 700, ease: 'Sine.inOut',
      onComplete: () => {
        this.busy = false;
        const card = stop.card(run);
        if (!card) {
          floatText(this, p.x, p.y - 40, '今天很平靜', 0x5a3a1a, 20);
          this.time.delayedCall(500, () => this.nextStop());
          return;
        }
        this.showCard(stop, card);
      },
    });
  }

  /** 為什麼這個選項不能選（空字串表示可以） */
  private blocked(o: Option): string {
    if (o.needs === 'salt' && !run.intel.salt) return '需要情報：小魍怕鹽米';
    if (o.hours > run.hours) return `時辰不夠（剩 ${run.hours}）`;
    const cost = (o.incense ?? 0) + (o.miracle ? MIRACLE_COST : 0);
    if (cost > run.incense) return `香火不夠（需要 ${cost}）`;
    if (o.miracle && run.miracles <= 0) return '今天的神蹟已經用完';
    return '';
  }

  private costLine(o: Option): string {
    const parts = [`${o.hours} 時辰`];
    if (o.incense) parts.push(`香火 ${o.incense}`);
    if (o.miracle) parts.push(`神蹟・香火 ${MIRACLE_COST}・今晚妖怪 +${MIRACLE_WAVES} 波（正面）`);
    return parts.join('・');
  }

  private current?: Stop;

  private showCard(stop: Stop, card: Card): void {
    this.current = stop;
    const p = this.resetSide();
    this.add2(txt(this, p.x + 24, p.y + 14, card.who, 32, C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 56, stop.place, 18, C.muted));
    if (card.deadline) this.add2(txt(this, p.x + p.w - 24, p.y + 22, `期限：${card.deadline}`, 18, 0xffffff, { backgroundColor: '#b3261e', padding: { x: 8, y: 4 } }).setOrigin(1, 0));
    const body = this.add2(txt(this, p.x + 24, p.y + 88, card.text, 19, C.paper, { bold: false, lineSpacing: 6, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    let y = body.y + body.height + 14;
    const optH = 96;
    for (const o of card.options) {
      const why = this.blocked(o);
      const g = this.add2(this.add.graphics());
      g.fillStyle(o.miracle ? 0x5a3a10 : 0x2f3a4a, why ? 0.35 : 0.8);
      g.fillRoundedRect(p.x + 16, y, p.w - 32, optH - 8, 10);
      const b = this.add2(button(this, p.x + 110, y + 30, 170, 46, o.label, () => this.choose(o), { size: o.label.length > 6 ? 17 : 20, fill: o.miracle ? 0x8a5a10 : 0x2f6f5a }));
      b.setEnabled(!why);
      this.add2(txt(this, p.x + 206, y + 12, this.costLine(o), 15, o.miracle ? 0xffd76a : C.muted, { bold: false, wordWrap: { width: p.w - 230, useAdvancedWrap: true } }));
      this.add2(txt(this, p.x + 206, y + 40, why ? `✕ ${why}` : `結果：${o.result}`, 17, why ? 0xff9a8a : 0x9fe8c0, { bold: false, wordWrap: { width: p.w - 230, useAdvancedWrap: true } }));
      y += optH;
    }
    // 不處理
    const g = this.add2(this.add.graphics());
    g.lineStyle(1, 0x7a6a8e, 0.6);
    g.lineBetween(p.x + 24, y + 4, p.x + p.w - 24, y + 4);
    this.add2(button(this, p.x + 110, y + 42, 170, 46, '不停，繼續走', () => this.skip(), { size: 18, fill: 0x3a3442 }));
    this.add2(txt(this, p.x + 206, y + 24, `不處理：${card.ignore}`, 17, 0xffb0a0, { bold: false, wordWrap: { width: p.w - 230, useAdvancedWrap: true } }));
  }

  private choose(o: Option): void {
    if (this.blocked(o)) return;
    run.hours -= o.hours;
    if (o.incense) run.incense -= o.incense;
    if (o.miracle) {
      run.incense -= MIRACLE_COST;
      run.miracles--;
      run.tonight.miracles++;
      this.cameras.main.flash(500, 255, 230, 160);
    }
    const before = { f: run.followers, i: run.incense, m: run.morale };
    const story = o.apply(run);
    if (this.current) this.visited.add(this.current.id);
    this.drawMarkers();
    this.refreshHeader();
    const ix = this.icon.x;
    const iy = this.icon.y - 60;
    if (run.followers !== before.f) floatText(this, ix, iy, `信徒 +${run.followers - before.f}`, 0x2f8f5a, 24);
    if (run.incense !== before.i) floatText(this, ix + 80, iy + 20, `香火 ${run.incense > before.i ? '+' : ''}${run.incense - before.i}`, 0xb3261e, 22);
    if (run.morale !== before.m) floatText(this, ix - 80, iy + 20, `士氣 +${run.morale - before.m}`, 0x2b5aa8, 22);
    const p = this.resetSide();
    this.add2(txt(this, p.x + 24, p.y + 18, o.label, 30, C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 70, story, 21, C.paper, { bold: false, lineSpacing: 10, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    if (o.miracle) this.add2(txt(this, p.x + 24, p.y + p.h - 150, `天機外洩：今晚妖怪 +${MIRACLE_WAVES} 波，從正面來。`, 18, 0xffd76a, { wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    this.add2(button(this, p.x + p.w / 2, p.y + p.h - 60, 220, 60, '繼續', () => this.nextStop(), { size: 24, fill: 0x8a1b14 }));
  }

  private skip(): void {
    this.nextStop();
  }

  /** 路線走完：剩下的時辰拿來上香或休息，然後天黑 */
  private endRoute(): void {
    const p = this.resetSide();
    const n = run.hours;
    if (n <= 0) return this.endDay();
    this.add2(txt(this, p.x + 24, p.y + 18, `還剩 ${n} 個時辰`, 30, C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 70, '路線上的事都處理完了。剩下的時間要怎麼用？', 19, C.paper, { bold: false, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    const finish = (d: { incense?: number; morale?: number }) => {
      applyDelta(d);
      run.hours = 0;
      this.refreshHeader();
      this.endDay();
    };
    this.add2(button(this, p.x + p.w / 2, p.y + 180, 300, 60, `上香祈福（香火 +${5 * n}）`, () => finish({ incense: 5 * n }), { size: 20, fill: 0x8a1b14 }));
    this.add2(button(this, p.x + p.w / 2, p.y + 260, 300, 60, `提早休息（士氣 +${5 * n}）`, () => finish({ morale: 5 * n }), { size: 20, fill: 0x2b5aa8 }));
  }

  private endDay(): void {
    run.yesterday = this.plan.endOfDay(run);
    const p = this.resetSide();
    this.add2(txt(this, p.x + p.w / 2, p.y + 40, '日落・隊伍駐駕', 32, C.gold, { serif: true }).setOrigin(0.5, 0));
    const eff = nightEffects(run, this.plan.day);
    this.add2(txt(this, p.x + 24, p.y + 110, eff.length ? `今晚：\n${eff.map((s) => `・${s}`).join('\n')}` : '今晚：沒有特別的狀況。', 19, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    const dusk = this.add.rectangle(0, 0, W, H, 0x2a1440, 0).setOrigin(0).setDepth(25);
    this.tweens.add({ targets: dusk, alpha: 0.35, duration: 1200 });
    this.add2(button(this, p.x + p.w / 2, p.y + p.h - 60, 240, 62, '入夜', () => {
      const day = this.plan.day;
      if (day === 3) go(this, 'story', { id: 'dusk3', next: { key: 'prep', data: { night: 3 } } });
      else go(this, 'prep', { night: day });
    }, { size: 26, fill: 0x5a2a6a }));
  }

  // ---------- 因果簿 ----------
  private showLedger(): void {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const pw = Math.min(W - 80, 900);
    const ph = 600;
    const x = (W - pw) / 2;
    const y = (H - ph) / 2;
    objs.push(this.add.rectangle(0, 0, W, H, 0x000000, 0.5).setOrigin(0).setDepth(900).setInteractive());
    objs.push(panel(this, x, y, pw, ph).setDepth(901));
    objs.push(txt(this, x + 30, y + 20, '因果簿', 32, C.gold, { serif: true }).setDepth(902));
    const color = { good: 0x9fe8c0, warn: 0xffd76a, bad: 0xff9a8a, none: C.paper };
    ledger(run).forEach((l, i) => {
      objs.push(txt(this, x + 40, y + 80 + i * 52, l.who, 24, C.paper, { serif: true }).setDepth(902));
      objs.push(txt(this, x + 180, y + 84 + i * 52, l.state, 20, color[l.tone], { bold: false, wordWrap: { width: pw - 220, useAdvancedWrap: true } }).setDepth(902));
    });
    const eff = nightEffects(run, this.plan.day);
    objs.push(txt(this, x + 40, y + 360, '今晚的戰況', 24, C.gold, { serif: true }).setDepth(902));
    objs.push(txt(this, x + 40, y + 400, eff.length ? eff.map((s) => `・${s}`).join('\n') : '（目前沒有特別的狀況）', 19, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: pw - 80, useAdvancedWrap: true } }).setDepth(902));
    let close: Button | null = null;
    close = button(this, x + pw / 2, y + ph - 46, 200, 56, '關閉', () => {
      for (const o of objs) o.destroy();
      close?.destroy();
    }, { size: 22, fill: 0x3a3442 });
    close.setDepth(903);
  }
}
