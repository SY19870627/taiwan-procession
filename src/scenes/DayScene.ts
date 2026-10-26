/**
 * 白天：隊伍出巡。上方是隊伍沿街前進的畫面（BandScene），下方是現在這件事的卡片和「前方」清單。
 * 路上會遇到人、鬼、小妖、線索、問話；停下來處理才花時辰，略過就走過去了。
 * 鬼收容回令旗下，晚上夜審。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { CARDS, ledger, bossEffects, type Card, type Option } from '../content/believers';
import { DAY_PLANS, collectHours, endOfDay3, evidenceFor, ghostMood, laterSightings, summary, takeDocs, talkBlocked, visible, type DayPlan, type Encounter, type RouteDef } from '../content/days';
import { CASES, EVIDENCE, evidenceOf } from '../content/cases';
import { run, caseDone, gainEvidence, isHeld } from '../state';
import { button, floatText, fullscreenButton, go, panel, txt, type Button } from '../ui/widgets';
import { BandScene, type Visitor } from './BandScene';

const HOUR_NAMES = ['辰', '巳', '午', '未', '申', '酉'];
const BAND_Y = 226;
const LIQI_TEXT = ['平靜', '鬼魂會躲起來', '鬼魂會逃走', '鬼魂都躲著隊伍'];

export class DayScene extends Phaser.Scene {
  private plan!: DayPlan;
  private band!: BandScene;
  private hourBoxes: Phaser.GameObjects.Text[] = [];
  private miracleDots: Phaser.GameObjects.Arc[] = [];
  private liqiPips: Phaser.GameObjects.Rectangle[] = [];
  private liqiTxt!: Phaser.GameObjects.Text;
  private slotBox?: Phaser.GameObjects.Container;
  private side!: Phaser.GameObjects.Container;
  private queue: (Encounter | 'fork')[] = [];
  private idx = 0;
  private busy = false;

  constructor() {
    super('day');
  }

  create(data: { day: number }): void {
    const day = data.day ?? 1;
    this.plan = DAY_PLANS[day];
    run.day = day;
    run.hours = this.plan.hours;
    run.miracles = this.plan.miracles;
    this.hourBoxes = [];
    this.miracleDots = [];
    this.liqiPips = [];
    this.busy = false;
    this.queue = [...this.plan.pre, 'fork'];
    this.idx = 0;
    this.cameras.main.fadeIn(400, 10, 8, 18);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a1a14, 0x2a1a14, 0x160d0a, 0x160d0a, 1);
    // 中間留空，讓下面的隊伍畫面（BandScene）透出來
    bg.fillRect(0, 0, W, BAND_Y);
    bg.fillRect(0, BAND_Y + BandScene.height(), W, H);
    this.drawHeader();
    this.side = this.add.container(0, 0);

    // 上方隊伍畫面
    this.scene.launch('band', { y: BAND_Y, theme: this.plan.theme, hour: this.hourNow() });
    this.band = this.scene.get('band') as BandScene;
    this.events.once('shutdown', () => this.scene.stop('band'));
    const fr = this.add.graphics().setDepth(5);
    fr.lineStyle(3, C.gold, 0.8);
    fr.strokeRect(0, BAND_Y - 2, W, BandScene.height() + 4);

    // 黃曆上的文獻
    const docs = takeDocs(this.plan);
    this.time.delayedCall(300, () => {
      this.scene.bringToTop();
      for (const [i, id] of docs.entries()) floatText(this, W / 2, BAND_Y + 120 + i * 40, `證物袋：${EVIDENCE[id].name}`, 0x9fe8c0, 24);
      this.band.walk(900, () => this.next());
    });
    this.panelMsg(`${this.plan.title}・起駕`, '隊伍出發了。路上遇到的人和鬼，停下來處理才花時辰；略過就走過去了。');
  }

  private hourNow(): number {
    return 8 + (this.plan.hours - run.hours) * 2;
  }

  // ---------- 上方資訊 ----------
  private drawHeader(): void {
    txt(this, 20, 16, `${this.plan.title}・白天`, 28, C.gold, { serif: true });
    txt(this, 20, 58, this.plan.area, 18, C.paper, { bold: false });
    button(this, 424, 40, 104, 44, '因果簿', () => this.showLedger(), { size: 18, fill: 0x4a2a3a });
    button(this, 538, 40, 104, 44, '證物袋', () => this.showEvidence(), { size: 18, fill: 0x2a4a3a });
    fullscreenButton(this);
    const g = this.add.graphics();
    g.fillStyle(0x1d1726, 0.88);
    g.fillRoundedRect(16, 86, W - 32, 50, 12);
    g.lineStyle(2, C.gold, 0.7);
    g.strokeRoundedRect(16, 86, W - 32, 50, 12);
    // 時辰、神蹟、戾氣
    txt(this, 30, 111, '時辰', 17, C.muted).setOrigin(0, 0.5);
    for (let i = 0; i < this.plan.hours; i++) {
      this.hourBoxes.push(txt(this, 72 + i * 38, 111, HOUR_NAMES[i], 20, '#1d1726', { serif: true, backgroundColor: '#e9b949', padding: { x: 5, y: 2 } }).setOrigin(0, 0.5));
    }
    txt(this, 310, 111, '神蹟', 17, C.muted).setOrigin(0, 0.5);
    for (let i = 0; i < this.plan.miracles; i++) {
      this.miracleDots.push(this.add.circle(364 + i * 26, 111, 9, 0xffd76a).setStrokeStyle(2, 0xb3261e));
    }
    txt(this, 430, 111, '戾氣', 17, 0xff9a8a).setOrigin(0, 0.5);
    for (let i = 0; i < 3; i++) this.liqiPips.push(this.add.rectangle(482 + i * 20, 111, 14, 14, 0x3a3442).setStrokeStyle(1, 0x9a6a6a));
    this.liqiTxt = txt(this, 546, 111, '', 14, C.muted, { bold: false }).setOrigin(0, 0.5);
    this.refreshHeader();
  }

  private refreshHeader(): void {
    const used = this.plan.hours - run.hours;
    this.hourBoxes.forEach((b, i) => b.setAlpha(i < used ? 0.25 : 1));
    this.miracleDots.forEach((d, i) => d.setFillStyle(i < run.miracles ? 0xffd76a : 0x3a3442));
    this.liqiPips.forEach((p, i) => p.setFillStyle(i < run.liqi ? 0xd23a2a : 0x3a3442));
    this.liqiTxt.setText(LIQI_TEXT[run.liqi]);
    this.drawSlots();
    this.band?.setHour?.(this.hourNow());
  }

  /** 令旗下：收容的鬼一個一格，畫出樣子、名字、查明幾層、怨氣；點了看牠的故事 */
  private drawSlots(pulse?: string): void {
    this.slotBox?.destroy();
    const c = this.add.container(0, 0).setDepth(6);
    this.slotBox = c;
    const top = 144;
    const h = 74;
    const g = this.add.graphics();
    g.fillStyle(0x16202e, 0.92);
    g.fillRoundedRect(16, top, W - 32, h, 12);
    g.lineStyle(2, 0x6a8ab8, 0.8);
    g.strokeRoundedRect(16, top, W - 32, h, 12);
    c.add(g);
    // 令旗
    c.add(this.add.image(48, top + h - 8, 'flag1').setOrigin(0.5, 1).setScale(0.42));
    c.add(txt(this, 74, top + 14, '令旗下', 15, 0x9fd0ff));
    c.add(txt(this, 74, top + 38, '今晚審', 13, C.muted, { bold: false }));
    const x0 = 132;
    const sw = (W - 32 - (x0 - 16) - 12 - 8 * (run.slots - 1)) / run.slots;
    for (let i = 0; i < run.slots; i++) {
      const sx = x0 + i * (sw + 8);
      const sy = top + 7;
      const sh = h - 14;
      const h1 = run.held[i];
      const sg = this.add.graphics();
      if (!h1) {
        sg.lineStyle(2, 0x4a5a72, 1);
        for (let d = 0; d < sw; d += 12) sg.lineBetween(sx + d, sy, sx + Math.min(sw, d + 6), sy);
        for (let d = 0; d < sw; d += 12) sg.lineBetween(sx + d, sy + sh, sx + Math.min(sw, d + 6), sy + sh);
        sg.lineBetween(sx, sy, sx, sy + sh);
        sg.lineBetween(sx + sw, sy, sx + sw, sy + sh);
        c.add(sg);
        c.add(txt(this, sx + sw / 2, sy + sh / 2, '空位', 15, 0x4a5a72).setOrigin(0.5));
        continue;
      }
      const k = CASES[h1.id];
      const st = run.cases[h1.id] ?? { truths: [] };
      sg.fillStyle(0x223450, 1);
      sg.fillRoundedRect(sx, sy, sw, sh, 8);
      sg.lineStyle(2, h1.grudge >= 2 ? 0xd2503a : 0x7fb0e0, 1);
      sg.strokeRoundedRect(sx, sy, sw, sh, 8);
      c.add(sg);
      const img = this.add.image(sx + 24, sy + sh - 2, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.85);
      img.setScale(Math.min((sh - 6) / img.height, 36 / img.width));
      c.add(img);
      c.add(txt(this, sx + 46, sy + 6, st.truths.length ? k.name : k.shortName, 15, 0xd8ecff));
      const grudge = '●'.repeat(h1.grudge) + '○'.repeat(3 - h1.grudge);
      c.add(txt(this, sx + 46, sy + 30, `查明${st.truths.length}／${k.truths.length}`, 12, 0x9fe8c0, { bold: false }));
      c.add(txt(this, sx + sw - 6, sy + 30, grudge, 12, h1.grudge ? 0xff9a8a : 0x6a7a92, { bold: false }).setOrigin(1, 0));
      const hit = this.add.rectangle(sx, sy, sw, sh, 0xffffff, 0.001).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.showHeld(h1.id));
      c.add(hit);
      if (pulse === h1.id) {
        const glow = this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, 0x9fd0ff, 0.5);
        c.add(glow);
        this.tweens.add({ targets: glow, alpha: 0, scaleX: 1.15, scaleY: 1.3, duration: 700, onComplete: () => glow.destroy() });
      }
    }
  }

  /** 點令旗下的鬼：看牠的故事和證據 */
  private showHeld(id: string): void {
    const k = CASES[id];
    const st = run.cases[id] ?? { truths: [] };
    const h1 = run.held.find((h) => h.id === id);
    this.overlay(st.truths.length ? `${k.name}（${k.dayName}）` : k.dayName, (x, y0, pw, add) => {
      const img = this.add.image(x + pw / 2, y0 + 220, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.8);
      img.setScale(Math.min(200 / img.height, 160 / img.width));
      add(img);
      let y = y0 + 240;
      const para = (s: string, color: number = C.paper, size = 18) => {
        const t = txt(this, x + 30, y, s, size, color, { bold: false, lineSpacing: 5, wordWrap: { width: pw - 60, useAdvancedWrap: true } });
        add(t);
        y += t.height + 14;
      };
      para(k.daySight);
      para(`牽連：${k.affects}`, 0xffd76a);
      para(`審清楚：${k.payoff}`, 0x9fe8c0);
      if (st.truths.length) para(`已查明：\n${st.truths.map((i) => `・${k.truths[i].summary}`).join('\n')}`, 0x9fe8c0, 16);
      const evs = evidenceOf(id);
      const have = evs.filter((e) => run.evidence.includes(e));
      para(`證據 ${have.length}／${evs.length}`, C.gold);
      for (const e of evs) para(run.evidence.includes(e) ? `✓ ${EVIDENCE[e].name}` : `✗ ${EVIDENCE[e].name}（${EVIDENCE[e].where}）`, run.evidence.includes(e) ? 0x9fe8c0 : 0xff9a8a, 16);
      if (h1) para(`怨氣 ${h1.grudge}／3（每過一夜沒審 +1，到 3 會掙脫）`, 0xff9a8a, 16);
    });
  }

  // ---------- 下方面板 ----------
  private resetSide(): { x: number; y: number; w: number; h: number } {
    this.side.destroy();
    this.side = this.add.container(0, 0).setDepth(30);
    const x = 16;
    const y = BAND_Y + BandScene.height() + 14;
    const w = W - 32;
    const h = H - y - 16;
    this.side.add(panel(this, x, y, w, h));
    return { x, y, w, h };
  }

  private add2<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.side.add(o);
    return o;
  }

  private panelMsg(title: string, body: string): void {
    const p = this.resetSide();
    this.add2(txt(this, p.x + 24, p.y + 18, title, 30, C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 68, body, 20, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
  }

  /** 「前方」清單：接下來會遇到的事（只看得到這條路上的） */
  private drawAhead(p: { x: number; y: number; w: number; h: number }): void {
    const rest = this.queue.slice(this.idx).filter((e): e is Encounter => e !== 'fork' && visible(run, e)).slice(0, 3);
    const top = p.y + p.h - 26 - Math.max(1, rest.length) * 34;
    const g = this.add2(this.add.graphics());
    g.lineStyle(1, 0x7a6a8e, 0.6);
    g.lineBetween(p.x + 20, top - 10, p.x + p.w - 20, top - 10);
    this.add2(txt(this, p.x + 24, top - 4, '前方', 16, C.muted));
    if (!rest.length) {
      this.add2(txt(this, p.x + 90, top - 4, this.queue[this.idx] === 'fork' ? '岔路' : '（這條路快走完了）', 16, C.muted, { bold: false }));
      return;
    }
    rest.forEach((e, i) => {
      const s = summary(run, e);
      const y = top + i * 34;
      this.add2(txt(this, p.x + 90, y - 4, s.icon, 16, '#1d1726', { backgroundColor: `#${s.color.toString(16).padStart(6, '0')}`, padding: { x: 5, y: 1 } }));
      this.add2(txt(this, p.x + 126, y - 2, s.title, 17, C.paper, { bold: false }));
      this.add2(txt(this, p.x + p.w - 24, y - 2, s.cost, 16, C.muted, { bold: false }).setOrigin(1, 0));
    });
  }

  // ---------- 流程 ----------
  private next(): void {
    // 跳過今天不會出現的事
    while (this.idx < this.queue.length) {
      const e = this.queue[this.idx];
      if (e === 'fork' || visible(run, e)) break;
      this.idx++;
    }
    if (this.idx >= this.queue.length) return this.endRoute();
    const e = this.queue[this.idx++];
    if (e === 'fork') return this.showFork();
    this.band.approach(this.visitorOf(e), () => this.show(e));
  }

  private visitorOf(e: Encounter): Visitor {
    switch (e.kind) {
      case 'person': return { tex: e.tex, kind: 'person' };
      case 'talk': return { tex: e.tex, kind: 'person' };
      case 'ghost': return { tex: CASES[e.caseId].tex, kind: 'ghost' };
      case 'imp': return { tex: e.tex, kind: 'imp', count: 3 };
      case 'clue': return { tex: 'spark', kind: 'clue' };
    }
  }

  private after(story: string, gained: string[]): void {
    const p = this.resetSide();
    this.add2(txt(this, p.x + 24, p.y + 24, story, 21, C.paper, { bold: false, lineSpacing: 10, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    let y = p.y + p.h - 260;
    for (const id of gained) {
      const ev = EVIDENCE[id];
      this.add2(txt(this, p.x + 24, y, `證物袋 ＋ 【${ev.kind}】${ev.name}`, 19, 0x9fe8c0));
      this.add2(txt(this, p.x + 24, y + 28, `　→ 審「${evidenceFor(id)}」時用得上（${this.ghostStatus(ev.ghost)}）`, 16, C.muted, { bold: false }));
      y += 64;
    }
    this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 240, 70, '繼續', () => {
      if (this.busy) return;
      this.busy = true;
      this.band.pass(false, () => { this.busy = false; this.next(); });
    }, { size: 26, fill: 0x8a1b14 }));
  }

  /** 這隻鬼現在的狀態（給證據、線索看的） */
  private ghostStatus(caseId: string): string {
    if (isHeld(caseId)) return '已收容';
    if (caseDone(caseId)) return '已經審過了';
    const later = laterSightings(caseId, this.plan.day);
    return later.length ? `還沒收容；之後在${later[0]}會遇到` : '還沒收容';
  }

  /** 花時辰（不夠就回傳 false） */
  private spend(hours: number): boolean {
    if (hours > run.hours) return false;
    run.hours -= hours;
    this.refreshHeader();
    return true;
  }

  private show(e: Encounter): void {
    switch (e.kind) {
      case 'person': return this.showPerson(e);
      case 'ghost': return this.showGhost(e);
      case 'imp': return this.showImp(e);
      case 'clue': return this.showClue(e);
      case 'talk': return this.showTalk(e);
    }
  }

  /** 共用的卡片外框：標題、地點、說明 */
  private cardHead(title: string, place: string, text: string, tag?: { s: string; color: string }): { p: { x: number; y: number; w: number; h: number }; y: number } {
    const p = this.resetSide();
    this.add2(txt(this, p.x + 24, p.y + 14, title, 30, C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 54, place, 17, C.muted));
    if (tag) this.add2(txt(this, p.x + p.w - 24, p.y + 20, tag.s, 17, 0xffffff, { backgroundColor: tag.color, padding: { x: 8, y: 4 } }).setOrigin(1, 0));
    const body = this.add2(txt(this, p.x + 24, p.y + 84, text, 19, C.paper, { bold: false, lineSpacing: 6, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    this.drawAhead(p);
    return { p, y: body.y + body.height + 16 };
  }

  /** 一個選項列：左邊按鈕、右邊花費與結果 */
  private optionRow(p: { x: number; w: number }, y: number, label: string, cost: string, result: string, why: string, onPick: () => void, gold = false): number {
    // 花費和結果都可能換行：先排字，再依高度畫底色
    const g = this.add2(this.add.graphics());
    const costT = this.add2(txt(this, p.x + 200, y + 12, cost, 15, gold ? 0xffd76a : C.muted, { bold: false, lineSpacing: 2, wordWrap: { width: p.w - 224, useAdvancedWrap: true } }));
    const resT = this.add2(txt(this, p.x + 200, costT.y + costT.height + 6, why ? `✕ ${why}` : result, 16, why ? 0xff9a8a : 0x9fe8c0, { bold: false, lineSpacing: 2, wordWrap: { width: p.w - 224, useAdvancedWrap: true } }));
    const optH = Math.max(92, resT.y + resT.height + 14 - y);
    g.fillStyle(gold ? 0x5a3a10 : 0x2f3a4a, why ? 0.35 : 0.8);
    g.fillRoundedRect(p.x + 16, y, p.w - 32, optH - 8, 10);
    const b = this.add2(button(this, p.x + 106, y + (optH - 8) / 2, 164, 52, label, onPick, { size: label.length > 6 ? 16 : 20, fill: gold ? 0x8a5a10 : 0x2f6f5a }));
    b.setEnabled(!why);
    return y + optH;
  }

  private skipRow(p: { x: number; w: number }, y: number, ignore: string, onSkip: () => void): void {
    const g = this.add2(this.add.graphics());
    g.lineStyle(1, 0x7a6a8e, 0.6);
    g.lineBetween(p.x + 24, y + 2, p.x + p.w - 24, y + 2);
    this.add2(button(this, p.x + 106, y + 40, 164, 50, '略過，繼續走', onSkip, { size: 17, fill: 0x3a3442 }));
    this.add2(txt(this, p.x + 200, y + 20, `不處理：${ignore}`, 16, 0xffb0a0, { bold: false, wordWrap: { width: p.w - 224, useAdvancedWrap: true } }));
  }

  private hoursWhy(h: number): string {
    if (h > run.hours) return `時辰不夠（剩 ${run.hours}）`;
    return '';
  }

  private skip(): void {
    if (this.busy) return;
    this.busy = true;
    this.band.pass(false, () => { this.busy = false; this.next(); });
  }

  // ----- 人 -----
  private blocked(o: Option): string {
    if (o.miracle && run.miracles <= 0) return '今天的神蹟已經用完';
    return this.hoursWhy(o.hours);
  }

  private costLine(o: Option): string {
    const parts = [`${o.hours} 時辰`];
    if (o.miracle) parts.push('神蹟・最後一戰小妖 +1 波');
    const newEv = (o.gives ?? []).filter((id) => !run.evidence.includes(id));
    if (newEv.length) parts.push(`得到證據：${newEv.map((id) => `${EVIDENCE[id].name}（審「${evidenceFor(id)}」用）`).join('、')}`);
    return parts.join('・');
  }

  private showPerson(e: Extract<Encounter, { kind: 'person' }>): void {
    const card = CARDS[e.card](run) as Card;
    const { p, y: y0 } = this.cardHead(card.who, e.place, card.text, card.deadline ? { s: `期限：${card.deadline}`, color: '#b3261e' } : undefined);
    let y = y0;
    for (const o of card.options) {
      y = this.optionRow(p, y, o.label, this.costLine(o), o.result, this.blocked(o), () => this.choosePerson(o), !!o.miracle);
    }
    this.skipRow(p, y, card.ignore, () => this.skip());
  }

  private choosePerson(o: Option): void {
    if (this.blocked(o) || this.busy) return;
    const before = run.evidence.length;
    this.spend(o.hours);
    if (o.miracle) {
      run.miracles--;
      run.bossAdds++;
      this.cameras.main.flash(500, 255, 230, 160);
    }
    const story = o.apply(run);
    this.refreshHeader();
    this.after(story, run.evidence.slice(before));
  }

  // ----- 鬼 -----
  private showGhost(e: Extract<Encounter, { kind: 'ghost' }>): void {
    const k = CASES[e.caseId];
    const mood = ghostMood(run, e.caseId);
    if (mood === 'fled') {
      const p = this.resetSide();
      this.add2(txt(this, p.x + 24, p.y + 18, k.dayName, 28, 0x9fd0ff, { serif: true }));
      this.add2(txt(this, p.x + 24, p.y + 70, `隊伍身上的戾氣太重。牠一感覺到，就逃走了。\n\n今天收不到牠：${k.harm}。`, 20, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
      this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 240, 70, '繼續', () => {
        if (this.busy) return;
        this.busy = true;
        this.band.pass(true, () => { this.busy = false; this.next(); });
      }, { size: 26, fill: 0x3a3442 }));
      return;
    }
    const hours = collectHours(run, e.caseId);
    const evs = evidenceOf(k.id);
    const have = evs.filter((id) => run.evidence.includes(id));
    const later = laterSightings(k.id, this.plan.day);
    const info = [
      `牽連：${k.affects}`,
      `審清楚：${k.payoff}`,
      `證據已有 ${have.length}／${evs.length}${have.length ? `：${have.map((id) => EVIDENCE[id].name).join('、')}` : ''}`,
      ...(have.length < evs.length ? [`還缺：${evs.filter((id) => !have.includes(id)).map((id) => EVIDENCE[id].name).join('、')}`] : []),
      later.length ? `今天不收，${later.join('、')}還會遇到` : '今天不收，之後就遇不到了',
    ].join('\n');
    const text = `${k.daySight}${mood === 'hiding' ? '\n牠感覺到隊伍的戾氣，躲了起來；要花 1 個時辰勸出來。' : ''}\n\n${info}`;
    const { p, y: y0 } = this.cardHead(k.dayName, `${e.place}（凡人看不見）`, text, { s: '有冤情的鬼', color: '#2b5aa8' });
    const full = run.held.length >= run.slots;
    const why = full ? '收容格滿了' : this.hoursWhy(hours);
    const extra = (k.onCollect ?? []).filter((id) => !run.evidence.includes(id));
    const cost = `${hours ? `${hours} 時辰（勸出來）・` : '不花時辰・'}佔收容格 1（剩 ${run.slots - run.held.length} 格）${extra.length ? `・得到證據：${extra.map((id) => EVIDENCE[id].name).join('、')}` : ''}`;
    const y = this.optionRow(p, y0, '收容', cost, '七爺八爺把牠帶回令旗下，今晚夜審', why, () => this.collect(e, hours));
    this.skipRow(p, y, k.harm, () => this.skip());
  }

  private collect(e: Extract<Encounter, { kind: 'ghost' }>, hours: number): void {
    if (this.busy || run.held.length >= run.slots || !this.spend(hours)) return;
    this.busy = true;
    const k = CASES[e.caseId];
    run.held.push({ id: e.caseId, grudge: 0 });
    run.cases[e.caseId] ??= { truths: [] };
    const gained = (k.onCollect ?? []).filter((id) => gainEvidence(id));
    this.refreshHeader();
    this.band.collect(() => {
      this.busy = false;
      this.drawSlots(e.caseId);
      this.after(`七爺的鎖鏈一甩，${k.dayName}沒有掙扎，跟著回到了令旗下。\n今晚升堂再審。`, gained);
    });
  }

  // ----- 小妖 -----
  private showImp(e: Extract<Encounter, { kind: 'imp' }>): void {
    const { p, y: y0 } = this.cardHead('小妖', e.place, e.text);
    const y = this.optionRow(p, y0, '驅散', '1 時辰', '當場打散，牠們不會跟到最後一戰', this.hoursWhy(1), () => {
      if (this.busy || !this.spend(1)) return;
      this.busy = true;
      this.refreshHeader();
      this.band.scatter(() => { this.busy = false; this.after('八將衝上前，小妖四散逃竄。', []); });
    });
    this.skipRow(p, y, '最後一戰小妖 +1 波', () => {
      run.bossAdds++;
      this.skip();
    });
  }

  // ----- 線索 -----
  private showClue(e: Extract<Encounter, { kind: 'clue' }>): void {
    const g = EVIDENCE[e.evidence].ghost;
    const { p, y: y0 } = this.cardHead('線索', e.place, `${e.text}\n\n跟「${CASES[g].dayName}」的案子有關（${this.ghostStatus(g)}）`);
    const y = this.optionRow(p, y0, '查看', `${e.hours} 時辰・得到物證`, `晚上審「${CASES[g].dayName}」時可以出示`, this.hoursWhy(e.hours), () => {
      if (this.busy || !this.spend(e.hours)) return;
      this.busy = true;
      gainEvidence(e.evidence);
      this.band.take(() => { this.busy = false; this.after(EVIDENCE[e.evidence].text, [e.evidence]); });
    });
    this.skipRow(p, y, '少一件證據', () => this.skip());
  }

  // ----- 問話 -----
  private showTalk(e: Extract<Encounter, { kind: 'talk' }>): void {
    if (talkBlocked(run)) {
      const p = this.resetSide();
      this.add2(txt(this, p.x + 24, p.y + 18, e.who, 28, C.gold, { serif: true }));
      this.add2(txt(this, p.x + 24, p.y + 70, '凡人看不見戾氣，卻覺得這支隊伍「氣很重」。他看了一眼，就轉身走開了。', 20, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
      this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 240, 70, '繼續', () => this.skip(), { size: 26, fill: 0x3a3442 }));
      return;
    }
    const g = EVIDENCE[e.evidence].ghost;
    const { p, y: y0 } = this.cardHead(e.who, e.place, `${e.text}\n\n跟「${CASES[g].dayName}」的案子有關（${this.ghostStatus(g)}）`);
    const y = this.optionRow(p, y0, '問話', `${e.hours} 時辰・得到證詞`, `晚上審「${CASES[g].dayName}」時可以出示`, this.hoursWhy(e.hours), () => {
      if (this.busy || !this.spend(e.hours)) return;
      gainEvidence(e.evidence);
      this.refreshHeader();
      this.after(EVIDENCE[e.evidence].text, [e.evidence]);
    });
    this.skipRow(p, y, '少一件證據', () => this.skip());
  }

  // ---------- 岔路 ----------
  private showFork(): void {
    const p = this.resetSide();
    this.add2(txt(this, p.x + 24, p.y + 14, '岔路', 30, C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 56, '時辰只夠走一條。另一條路上的人和鬼，今天就錯過了。', 17, C.paper, { bold: false, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    const routes = this.plan.routes;
    const blockH = (p.h - 100) / routes.length;
    routes.forEach((route, i) => {
      const by = p.y + 90 + i * blockH;
      const g = this.add2(this.add.graphics());
      g.fillStyle(route.color, 0.18);
      g.fillRoundedRect(p.x + 16, by, p.w - 32, blockH - 12, 10);
      g.lineStyle(2, route.color, 0.9);
      g.strokeRoundedRect(p.x + 16, by, p.w - 32, blockH - 12, 10);
      this.add2(txt(this, p.x + 32, by + 10, `${route.id}・${route.name}`, 24, 0xffffff, { serif: true }));
      const list = [...route.encounters, ...this.plan.post].filter((e) => visible(run, e));
      list.slice(0, 8).forEach((e, k) => {
        const s = summary(run, e);
        const y = by + 48 + k * 30;
        this.add2(txt(this, p.x + 32, y, s.icon, 15, '#1d1726', { backgroundColor: `#${s.color.toString(16).padStart(6, '0')}`, padding: { x: 4, y: 1 } }));
        this.add2(txt(this, p.x + 64, y + 1, s.title, 16, C.paper, { bold: false }));
        this.add2(txt(this, p.x + p.w - 200, y + 1, s.cost, 15, C.muted, { bold: false }).setOrigin(1, 0));
      });
      this.add2(button(this, p.x + p.w - 100, by + blockH - 50, 150, 52, `走${route.id}線`, () => this.chooseRoute(route), { size: 20, fill: route.color }));
    });
  }

  private chooseRoute(route: RouteDef): void {
    if (this.busy) return;
    this.queue = [...route.encounters, ...this.plan.post];
    this.idx = 0;
    this.panelMsg(`走${route.id}線・${route.name}`, '隊伍轉進巷子。');
    this.busy = true;
    this.band.walk(700, () => { this.busy = false; this.next(); });
  }

  // ---------- 一天結束 ----------
  private endRoute(): void {
    run.hours = 0;
    this.refreshHeader();
    this.endDay();
  }

  private endDay(): void {
    const p = this.resetSide();
    this.add2(txt(this, p.x + p.w / 2, p.y + 30, '日落・隊伍回廟', 32, C.gold, { serif: true }).setOrigin(0.5, 0));
    const lines = run.held.length
      ? `令旗下收容了 ${run.held.length} 個鬼：\n${run.held.map((h) => `・${CASES[h.id].dayName}`).join('\n')}\n\n今晚升堂夜審。`
      : '今天沒有收容任何鬼。';
    this.add2(txt(this, p.x + 24, p.y + 100, lines, 20, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    this.band.setHour(18);
    const day = this.plan.day;
    if (day === 3) endOfDay3(run);
    this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 260, 72, '入夜・升堂', () => go(this, 'trial', { night: day }), { size: 26, fill: 0x5a2a6a }));
  }

  // ---------- 因果簿、證物袋 ----------
  private overlay(title: string, build: (x: number, y: number, w: number, add: (o: Phaser.GameObjects.GameObject) => void) => void): void {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const pw = W - 32;
    const ph = H - 80;
    const x = 16;
    const y = 40;
    objs.push(this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0).setDepth(960).setInteractive());
    objs.push(panel(this, x, y, pw, ph).setDepth(961));
    objs.push(txt(this, x + 30, y + 20, title, 32, C.gold, { serif: true }).setDepth(962));
    build(x, y + 76, pw, (o) => { (o as unknown as { setDepth: (d: number) => void }).setDepth(962); objs.push(o); });
    let close: Button | null = null;
    close = button(this, x + pw / 2, y + ph - 50, 220, 60, '關閉', () => {
      for (const o of objs) o.destroy();
      close?.destroy();
    }, { size: 22, fill: 0x3a3442 });
    close.setDepth(963);
  }

  private showLedger(): void {
    this.overlay('因果簿', (x, y0, pw, add) => {
      const color = { good: 0x9fe8c0, warn: 0xffd76a, bad: 0xff9a8a, none: C.paper };
      let y = y0;
      for (const l of ledger(run)) {
        add(txt(this, x + 30, y, l.who, 22, C.paper, { serif: true }));
        const t = txt(this, x + 140, y + 3, l.state, 18, color[l.tone], { bold: false, lineSpacing: 4, wordWrap: { width: pw - 170, useAdvancedWrap: true } });
        add(t);
        y += Math.max(34, t.height) + 14;
      }
      y += 10;
      add(txt(this, x + 30, y, '令旗下的鬼', 22, C.gold, { serif: true }));
      y += 36;
      const held = run.held.length ? run.held.map((h) => `・${CASES[h.id].dayName}（怨氣 ${h.grudge}／3）`).join('\n') : '（沒有）';
      const t1 = txt(this, x + 30, y, held, 18, 0x9fd0ff, { bold: false, lineSpacing: 6 });
      add(t1);
      y += t1.height + 20;
      add(txt(this, x + 30, y, `戾氣 ${run.liqi}／3：${LIQI_TEXT[run.liqi]}`, 18, 0xff9a8a, { bold: false }));
      y += 40;
      add(txt(this, x + 30, y, '最後一戰', 22, C.gold, { serif: true }));
      add(txt(this, x + 30, y + 36, bossEffects(run).map((s) => `・${s}`).join('\n'), 17, C.paper, { bold: false, lineSpacing: 6, wordWrap: { width: pw - 60, useAdvancedWrap: true } }));
    });
  }

  private showEvidence(): void {
    this.overlay(`證物袋（${run.evidence.length}）`, (x, y0, pw, add) => {
      let y = y0;
      if (!run.evidence.length) add(txt(this, x + 30, y, '還沒有證據。路上的線索、問話，和信徒說的話都會收進來。', 18, C.muted, { bold: false, wordWrap: { width: pw - 60, useAdvancedWrap: true } }));
      // 依案子分組：每一隻鬼底下列出拿到的證據
      for (const k of Object.values(CASES)) {
        const mine = evidenceOf(k.id).filter((id) => run.evidence.includes(id));
        if (!mine.length) continue;
        add(txt(this, x + 30, y, `${k.dayName}（${this.ghostStatus(k.id)}）`, 20, 0x9fd0ff));
        y += 32;
        for (const id of mine) {
          const ev = EVIDENCE[id];
          add(txt(this, x + 40, y, `【${ev.kind}】${ev.name}`, 17, 0x9fe8c0));
          const t = txt(this, x + 40, y + 24, ev.text, 15, C.paper, { bold: false, lineSpacing: 3, wordWrap: { width: pw - 80, useAdvancedWrap: true } });
          add(t);
          y += 24 + t.height + 10;
        }
        y += 8;
      }
    });
  }
}
