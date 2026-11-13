/**
 * 白天：隊伍出巡。上方是隊伍沿街前進的畫面（BandScene），下方是現在這件事的卡片和「前方」清單。
 * 路上會遇到人、鬼、小妖、線索、問話；停下來處理才花時辰，略過就走過去了。
 * 鬼收容回令旗下，晚上夜審。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import type { Card, Option } from '../content/believers';
import type { DayPlan, Encounter, RouteDef } from '../content/days';
import { CH, collectHours, evidenceFor, evidenceOf, ghostMood, laterSightings, summary, takeDocs, talkBlocked, visible, type ImpRule } from '../content/chapter';
import { run, caseDone, gainEvidence, isHeld } from '../state';
import { button, floatText, fullscreenButton, go, panel, txt, type Button } from '../ui/widgets';
import { BandScene, type Visitor } from './BandScene';
import { splitStory, talk } from '../ui/talk';
import { portraitKey, portraitThumb } from '../art/portraits';
import { muted } from '../core/dianjiang';
import { openDianjiang } from '../ui/dianjiang';
import { CATCH_HOURS, LOOK_HOURS, LOOK_TAG, ROADSIDE_HOURS, WEIMING_MAX, collectGrudge, escortGhost, impsFlee, isLooked, lookAt, natureOf, slayGhost, slayPreview, truthReel, weimingText } from '../core/renown';
import { flashback } from '../ui/talk';
import { banter } from '../ui/banter';
import type { GhostCase } from '../content/cases';
import {
  REPORT_NOTE, afterFork, applyBroadcast, beforeFork, betChoices, betResultText, followOf, optionWhy, report, resolveBet, resolveStray,
  skipStray, strayChoices, useStall, type Step,
} from '../core/procession';
import { SPEAKER_TEX } from '../content/story';
import { playStory } from './StoryScene';

/** 第四章：故事裡「名字：「……」」的那句算那個人說的（ui/split.ts）；前三章照舊 */
const say = (story: string, who?: { name: string; tex?: string; ghost?: boolean }) => splitStory(story, who, CH().follow ? SPEAKER_TEX : undefined);

/** 按鈕上的字太長就斷成兩行（逗號、冒號後面優先） */
function twoLines(label: string): string {
  if (label.length <= 7) return label;
  const mid = Math.ceil(label.length / 2);
  let at = -1;
  for (let d = 0; d <= 4 && at < 0; d++) {
    for (const i of [mid + d, mid - d]) if (/[，：、]/.test(label[i - 1] ?? '')) { at = i; break; }
  }
  if (at < 0) at = mid;
  return `${label.slice(0, at)}\n${label.slice(at)}`;
}

const HOUR_NAMES = ['辰', '巳', '午', '未', '申', '酉'];
const BAND_Y = 226;
const LIQI_TEXT = ['平靜', '鬼魂會躲起來', '鬼魂會逃走', '鬼魂都躲著隊伍'];
/** 第三章：戾氣讓鬼躲起來時用風火輪追，所以說法不同 */
const LIQI_TEXT3 = ['平靜', '膽小的鬼會躲（風火輪追）', '鬼魂會躲或逃', '鬼魂都躲著隊伍'];

/** 蓋在畫面上的清單下方的動作按鈕（第三章營旗格：看相、快判、路邊點將） */
interface ActionDef {
  label: string;
  /** 按鈕下面的小字（花費） */
  sub: string;
  /** 不能按的理由 */
  why?: string;
  fill?: number;
  onPick: () => void;
}

export class DayScene extends Phaser.Scene {
  private plan!: DayPlan;
  private band!: BandScene;
  private hourBoxes: Phaser.GameObjects.Text[] = [];
  private miracleDots: Phaser.GameObjects.Arc[] = [];
  private liqiPips: Phaser.GameObjects.Rectangle[] = [];
  private liqiTxt!: Phaser.GameObjects.Text;
  private weimingPips: Phaser.GameObjects.Rectangle[] = [];
  private weimingTxt?: Phaser.GameObjects.Text;
  /** 第三章：追回來（威名嚇跑）或風火輪追到（戾氣躲起來）的鬼，現在可以處理了 */
  private caught?: { id: string; grudge: number };
  /** 目前面板上的卡片：營旗格做了快判之後重畫（例如格子空出來了） */
  private redraw?: () => void;
  private slotBox?: Phaser.GameObjects.Container;
  private side!: Phaser.GameObjects.Container;
  /** 接下來的事；字串是段落標記（fork 岔路；第四章另有 detour 臨時轉進、detourEnd 轉進結束、rest 停駕點） */
  private queue: Step[] = [];
  private idx = 0;
  /** 第四章：現在走在哪一段（pre、甲／乙、detour、rest）；點心站「這一段」只能幫一件事 */
  private seg = 'pre';
  /** 岔路換了街景時：會合後（queue 的這一格起）換回當天的街景 */
  private rejoinAt = -1;
  private busy = false;
  /** 第四章：日落傳消息前的對話播過了 */
  private broadcastHeard = false;
  /** 第四章：駐駕前的過場（stay.story）播過了 */
  private stayStoryPlayed = false;
  /** 互嗆台詞輪到第幾組 */
  private banterN: Record<string, number> = {};
  /** 走近第幾件事（第三章：每走三件事冒一組走路的互嗆） */
  private walkN = 0;

  constructor() {
    super('day');
  }

  create(data: { day: number }): void {
    const day = data.day ?? 1;
    this.plan = CH().days[day];
    run.day = day;
    run.hours = this.plan.hours;
    run.miracles = this.plan.miracles;
    const imp = CH().imp;
    run.decrees = imp.mode === 'decree' ? imp.perDay : 0;
    this.hourBoxes = [];
    this.miracleDots = [];
    this.liqiPips = [];
    this.weimingPips = [];
    this.weimingTxt = undefined;
    this.caught = undefined;
    this.redraw = undefined;
    this.busy = false;
    this.broadcastHeard = false;
    this.stayStoryPlayed = false;
    // 第四章跟轎：出發後的事依前一天傳消息的標籤加（core/procession.ts）；其他章照舊
    this.queue = this.plan.follow ? beforeFork(this.plan, run) : [...this.plan.pre, 'fork'];
    this.seg = 'pre';
    this.idx = 0;
    this.walkN = 0;
    this.rejoinAt = -1;
    this.cameras.main.fadeIn(400, 10, 8, 18);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a1a14, 0x2a1a14, 0x160d0a, 0x160d0a, 1);
    // 中間留空，讓下面的隊伍畫面（BandScene）透出來
    bg.fillRect(0, 0, W, BAND_Y);
    bg.fillRect(0, BAND_Y + BandScene.height(), W, H);
    this.drawHeader();
    this.side = this.add.container(0, 0);

    // 上方隊伍畫面
    this.scene.launch('band', { y: BAND_Y, theme: this.plan.theme, hour: this.hourNow(), line: CH().band(day), reverse: this.plan.reverseRiver, art: this.plan.art });
    this.band = this.scene.get('band') as BandScene;
    this.events.once('shutdown', () => this.scene.stop('band'));
    const fr = this.add.graphics().setDepth(5);
    fr.lineStyle(3, C.gold, 0.8);
    fr.strokeRect(0, BAND_Y - 2, W, BandScene.height() + 4);

    // 黃曆上的文獻
    const docs = takeDocs(this.plan);
    this.time.delayedCall(300, () => {
      this.scene.bringToTop();
      for (const [i, id] of docs.entries()) floatText(this, W / 2, BAND_Y + 120 + i * 40, `證物袋：${CH().evidence[id].name}`, 0x9fe8c0, 24);
      this.band.walk(900, () => this.next());
      this.banter('depart');
    });
    this.panelMsg(`${this.plan.title}・起駕`, this.plan.follow
      ? '頭旗出發了，轎子跟在後面。往哪裡走，只有媽祖知道。路上遇到的事，停下來處理才花時辰；略過就走過去了。'
      : '隊伍出發了。路上遇到的人和鬼，停下來處理才花時辰；略過就走過去了。');
  }

  /** 神蹟的叫法（第四章：稟報） */
  private miracleLabel(): string {
    return CH().follow?.reportLabel ?? '神蹟';
  }

  private hourNow(): number {
    return 8 + (this.plan.hours - run.hours) * 2;
  }

  // ---------- 上方資訊 ----------
  private drawHeader(): void {
    txt(this, 20, 16, `${this.plan.title}・白天`, 28, C.gold, { serif: true });
    txt(this, 20, 58, this.plan.area, 18, C.paper, { bold: false });
    button(this, 396, 40, 100, 44, '因果簿', () => this.showLedger(), { size: 18, fill: 0x4a2a3a });
    button(this, 502, 40, 100, 44, '證物袋', () => this.showEvidence(), { size: 18, fill: 0x2a4a3a });
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
    if (this.renown()) {
      // 第三章：戾氣與威名並排，下面一行寫目前的影響
      txt(this, 304, 111, '神蹟', 17, C.muted).setOrigin(0, 0.5);
      for (let i = 0; i < this.plan.miracles; i++) {
        this.miracleDots.push(this.add.circle(352 + i * 22, 111, 8, 0xffd76a).setStrokeStyle(2, 0xb3261e));
      }
      txt(this, 400, 101, '戾氣', 16, 0xff9a8a).setOrigin(0, 0.5);
      for (let i = 0; i < 3; i++) this.liqiPips.push(this.add.rectangle(450 + i * 16, 101, 12, 12, 0x3a3442).setStrokeStyle(1, 0x9a6a6a));
      this.liqiTxt = txt(this, 400, 124, '', 13, C.muted, { bold: false }).setOrigin(0, 0.5);
      txt(this, 530, 101, '威名', 16, 0xffd76a).setOrigin(0, 0.5);
      for (let i = 0; i < WEIMING_MAX; i++) this.weimingPips.push(this.add.rectangle(580 + i * 16, 101, 12, 12, 0x3a3442).setStrokeStyle(1, 0xb08a3a));
      this.weimingTxt = txt(this, 530, 124, '', 13, C.muted, { bold: false }).setOrigin(0, 0.5);
    } else {
      txt(this, 310, 111, this.miracleLabel(), 17, C.muted).setOrigin(0, 0.5);
      for (let i = 0; i < this.plan.miracles; i++) {
        this.miracleDots.push(this.add.circle(364 + i * 26, 111, 9, 0xffd76a).setStrokeStyle(2, 0xb3261e));
      }
      txt(this, 430, 111, '戾氣', 17, 0xff9a8a).setOrigin(0, 0.5);
      for (let i = 0; i < 3; i++) this.liqiPips.push(this.add.rectangle(482 + i * 20, 111, 14, 14, 0x3a3442).setStrokeStyle(1, 0x9a6a6a));
      this.liqiTxt = txt(this, 546, 111, '', 14, C.muted, { bold: false }).setOrigin(0, 0.5);
    }
    this.refreshHeader();
  }

  private refreshHeader(): void {
    const used = this.plan.hours - run.hours;
    this.hourBoxes.forEach((b, i) => b.setAlpha(i < used ? 0.25 : 1));
    this.miracleDots.forEach((d, i) => d.setFillStyle(i < run.miracles ? 0xffd76a : 0x3a3442));
    this.liqiPips.forEach((p, i) => p.setFillStyle(i < run.liqi ? 0xd23a2a : 0x3a3442));
    this.liqiTxt.setText((this.renown() ? LIQI_TEXT3 : LIQI_TEXT)[run.liqi]);
    this.weimingPips.forEach((p, i) => p.setFillStyle(i < run.weiming ? 0xffd76a : 0x3a3442));
    this.weimingTxt?.setText(weimingText(run.weiming));
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
    c.add(this.add.image(48, top + h - 8, CH().held.icon).setOrigin(0.5, 1).setScale(0.42 * 150 / Math.max(150, this.textures.get(CH().held.icon).getSourceImage().height)));
    c.add(txt(this, 72, top + 12, CH().held.label, 17, 0x9fd0ff));
    c.add(txt(this, 72, top + 40, CH().held.sub, 14, C.muted, { bold: false }));
    const x0 = 132;
    const sw = (W - 32 - (x0 - 16) - 12 - 8 * (run.slots - 1)) / run.slots;
    for (let i = 0; i < run.slots; i++) {
      const sx = x0 + i * (sw + 8);
      const sy = top + 7;
      const sh = h - 14;
      const h1 = run.held[i];
      const camp = CH().slotLabels?.[i];
      if (camp) {
        this.drawCampSlot(c, sx, sy, sw, sh, camp, h1, pulse);
        continue;
      }
      const sg = this.add.graphics();
      if (!h1) {
        sg.lineStyle(2, 0x4a5a72, 1);
        for (let d = 0; d < sw; d += 12) sg.lineBetween(sx + d, sy, sx + Math.min(sw, d + 6), sy);
        for (let d = 0; d < sw; d += 12) sg.lineBetween(sx + d, sy + sh, sx + Math.min(sw, d + 6), sy + sh);
        sg.lineBetween(sx, sy, sx, sy + sh);
        sg.lineBetween(sx + sw, sy, sx + sw, sy + sh);
        c.add(sg);
        c.add(txt(this, sx + sw / 2, sy + sh / 2, '空位', 18, 0x4a5a72).setOrigin(0.5));
        continue;
      }
      const k = CH().cases[h1.id];
      const st = run.cases[h1.id] ?? { truths: [] };
      sg.fillStyle(0x223450, 1);
      sg.fillRoundedRect(sx, sy, sw, sh, 8);
      sg.lineStyle(2, h1.grudge >= 2 ? 0xd2503a : 0x7fb0e0, 1);
      sg.strokeRoundedRect(sx, sy, sw, sh, 8);
      c.add(sg);
      const img = this.add.image(sx + 24, sy + sh - 2, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.85);
      img.setScale(Math.min((sh - 6) / img.height, 36 / img.width));
      c.add(img);
      c.add(txt(this, sx + 44, sy + 4, st.truths.length ? k.name : k.shortName, 18, 0xd8ecff));
      const grudge = '●'.repeat(h1.grudge) + '○'.repeat(3 - h1.grudge);
      if (h1.dest) {
        // 第四章問歸處：已經決定帶著走，到那裡之前一直佔著這格
        c.add(txt(this, sx + 44, sy + 32, `往${CH().guihu?.dests[h1.dest]?.name ?? h1.dest}`, 15, 0xffd76a, { bold: false }));
      } else {
        c.add(txt(this, sx + 44, sy + 32, `查明${st.truths.length}／${k.truths.length}`, 15, 0x9fe8c0, { bold: false }));
        c.add(txt(this, sx + sw - 6, sy + 32, grudge, 14, h1.grudge ? 0xff9a8a : 0x6a7a92, { bold: false }).setOrigin(1, 0));
      }
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

  /**
   * 第三章營旗下的一格：外框是營色（東青、南紅、西白、北黑、中黃），左上寫哪一營；
   * 有鬼的話寫短稱、查明幾層、怨氣，北營看過相的右上角標「十惡／有冤／該斬」，被太子壓過一晚的標「壓」。
   */
  private drawCampSlot(c: Phaser.GameObjects.Container, sx: number, sy: number, sw: number, sh: number, camp: { label: string; color: number }, h1: (typeof run.held)[number] | undefined, pulse?: string): void {
    const sg = this.add.graphics();
    // 北營是黑色：外框太暗看不見，改用灰邊
    const edge = camp.color === 0x2a2a34 ? 0x8a8a9a : camp.color;
    const campTxt = (y: number) => txt(this, sx + 6, y, camp.label, 13, edge, { bold: true });
    if (!h1) {
      sg.lineStyle(2, edge, 0.55);
      for (let d = 0; d < sw; d += 12) sg.lineBetween(sx + d, sy, sx + Math.min(sw, d + 6), sy);
      for (let d = 0; d < sw; d += 12) sg.lineBetween(sx + d, sy + sh, sx + Math.min(sw, d + 6), sy + sh);
      sg.lineBetween(sx, sy, sx, sy + sh);
      sg.lineBetween(sx + sw, sy, sx + sw, sy + sh);
      c.add(sg);
      c.add(campTxt(sy + 3).setAlpha(0.8));
      c.add(txt(this, sx + sw / 2, sy + sh / 2 + 7, '空位', 17, 0x4a5a72).setOrigin(0.5));
      return;
    }
    const k = CH().cases[h1.id];
    const st = run.cases[h1.id] ?? { truths: [] };
    sg.fillStyle(0x223450, 1);
    sg.fillRoundedRect(sx, sy, sw, sh, 8);
    sg.fillStyle(edge, 0.25);
    sg.fillRoundedRect(sx, sy, sw, 18, { tl: 8, tr: 8, bl: 0, br: 0 });
    sg.lineStyle(3, h1.grudge >= 2 ? 0xd2503a : edge, 1);
    sg.strokeRoundedRect(sx, sy, sw, sh, 8);
    c.add(sg);
    c.add(campTxt(sy + 2));
    if (isLooked(run, h1.id)) {
      const tag = LOOK_TAG[natureOf(k)];
      c.add(txt(this, sx + sw - 4, sy + 2, tag.s, 12, 0xffffff, { backgroundColor: tag.color, padding: { x: 3, y: 0 } }).setOrigin(1, 0));
    }
    c.add(txt(this, sx + sw / 2, sy + 22, st.truths.length ? k.name : k.shortName, 16, 0xd8ecff).setOrigin(0.5, 0));
    c.add(txt(this, sx + 6, sy + sh - 18, `查明${st.truths.length}／${k.truths.length}${h1.tamed ? '・壓' : ''}`, 12, 0x9fe8c0, { bold: false }));
    c.add(txt(this, sx + sw - 5, sy + sh - 18, '●'.repeat(h1.grudge) + '○'.repeat(3 - h1.grudge), 11, h1.grudge ? 0xff9a8a : 0x6a7a92, { bold: false }).setOrigin(1, 0));
    const hit = this.add.rectangle(sx, sy, sw, sh, 0xffffff, 0.001).setOrigin(0).setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => this.showHeld(h1.id));
    c.add(hit);
    if (pulse === h1.id) {
      const glow = this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, edge, 0.5);
      c.add(glow);
      this.tweens.add({ targets: glow, alpha: 0, scaleX: 1.15, scaleY: 1.3, duration: 700, onComplete: () => glow.destroy() });
    }
  }

  /** 點令旗下的鬼：看牠的故事和證據 */
  private showHeld(id: string): void {
    const k = CH().cases[id];
    const st = run.cases[id] ?? { truths: [] };
    const h1 = run.held.find((h) => h.id === id);
    this.overlay(st.truths.length ? `${k.name}（${k.dayName}）` : k.dayName, (x, y0, pw, add) => {
      const img = this.add.image(x + pw / 2, y0 + 220, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.8);
      img.setScale(Math.min(200 / img.height, 160 / img.width));
      add(img);
      let y = y0 + 240;
      const para = (s: string, color: number = C.paper, size = 21) => {
        const t = txt(this, x + 30, y, s, size, color, { bold: false, lineSpacing: 5, wordWrap: { width: pw - 60, useAdvancedWrap: true } });
        add(t);
        y += t.height + 14;
      };
      para(k.daySight);
      para(`牽連：${k.affects}`, 0xffd76a);
      // 第三章外表會騙人：看過相或查明過真相，才寫審清楚的好處（裡面會說出牠是什麼）
      if (!this.renown() || isLooked(run, id) || st.truths.length) para(`審清楚：${k.payoff}`, 0x9fe8c0);
      if (st.truths.length) para(`已查明：\n${st.truths.map((i) => `・${k.truths[i].summary}`).join('\n')}`, 0x9fe8c0, 19);
      const evs = evidenceOf(id);
      const have = evs.filter((e) => run.evidence.includes(e));
      para(`證據 ${have.length}／${evs.length}`, C.gold);
      for (const e of evs) para(run.evidence.includes(e) ? `✓ ${CH().evidence[e].name}` : `✗ ${CH().evidence[e].name}（${CH().evidence[e].where}）`, run.evidence.includes(e) ? 0x9fe8c0 : 0xff9a8a, 19);
      if (h1 && this.renown()) {
        para(`怨氣：${h1.grudge}／3。風火輪追來、被南營嚇到才會加；押著過夜由太子壓下去，不加怨氣。`, 0xff9a8a, 19);
        if (isLooked(run, id)) para(`北營看過相：${LOOK_TAG[natureOf(k)].s}　廉將軍：${k.lookLine ?? ''}`, 0xd8c8ff, 19);
        else para('還沒看過相：身分不明（十惡、真惡、還是冤魂？）', C.muted, 19);
        const lost = (k.dropsOnTrial ?? []).filter((e) => !run.evidence.includes(e));
        if (lost.length) para(`注意：牠身上有東西。不審直接斬，就拿不到「${lost.map((e) => CH().evidence[e].name).join('、')}」`, 0xffd76a, 19);
        para(`太子親斬：${slayPreview(run, k, CH())}`, 0xff9a8a, 19);
        para('快判（太子親斬、押送）不花時辰、不佔今晚的審案名額；路邊點將花 1 時辰。', C.muted, 18);
      } else if (h1?.dest) {
        para(`跟在頭旗後面走，要帶到${CH().guihu?.dests[h1.dest]?.name ?? h1.dest}才放得下；在那之前一直佔著一格。`, 0xffd76a, 19);
      } else if (h1 && CH().overnight === 'carry') {
        para(`怨氣 ${h1.grudge}／3。跟在頭旗後面過夜不加怨氣；今晚問歸處。`, 0xff9a8a, 19);
      } else if (h1) para(`怨氣 ${h1.grudge}／3（每過一夜沒審 +1，到 3 會掙脫）`, 0xff9a8a, 19);
    }, h1 && this.renown() ? (close) => this.heldActions(k, close) : undefined);
  }

  /** 第三章營旗格的動作：北營看相、太子親斬、押送、路邊點將 */
  private heldActions(k: GhostCase, close: () => void): ActionDef[] {
    const looked = isLooked(run, k.id);
    return [
      {
        label: '北營看相', sub: looked ? '已看過' : `${LOOK_HOURS} 時辰`,
        why: looked ? '已看過' : this.hoursWhy(LOOK_HOURS),
        onPick: () => { close(); this.look(k, () => this.afterQuick()); },
      },
      {
        label: '太子親斬', sub: '0 時辰・空出格子', fill: 0x8a1b14,
        onPick: () => { close(); this.slay(k, false, () => this.afterQuick()); },
      },
      {
        label: '押送', sub: '0 時辰・空出格子', fill: 0x4a3a6a,
        onPick: () => { close(); this.escort(k, false, () => this.afterQuick()); },
      },
      {
        label: '路邊點將', sub: `${ROADSIDE_HOURS} 時辰・審一輪狠話`,
        why: muted(run, k) ? '牠縮起來不肯開口' : this.hoursWhy(ROADSIDE_HOURS),
        fill: 0x8a5a14,
        onPick: () => { close(); this.roadside(k); },
      },
    ];
  }

  /**
   * 路邊點將：花 1 時辰，在白天畫面上開點將問罪（與夜審同一個畫面，ui/dianjiang.ts）。
   * 只審一輪狠話；不佔今晚的 2 案名額。進度（氣焰、查明的真相）留著，晚上接著審；跪了可以當場判決。
   */
  private roadside(k: GhostCase): void {
    if (this.busy || !this.spend(ROADSIDE_HOURS)) return;
    this.busy = true;
    openDianjiang(this, {
      k, mode: 'roadside', day: this.plan.day,
      onClose: () => {
        this.busy = false;
        this.afterQuick();
      },
    });
  }

  /** 營旗格做完快判或看相：格子、上方資訊重畫，面板上的卡片也重畫（格子可能空出來了） */
  private afterQuick(): void {
    this.refreshHeader();
    this.redraw?.();
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
    this.add2(txt(this, p.x + 24, p.y + 70, body, 23, C.paper, { bold: false, lineSpacing: 10, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
  }

  /** 「前方」清單：接下來會遇到的事（只看得到這條路上的，列兩件） */
  private drawAhead(p: { x: number; y: number; w: number; h: number }): void {
    // 只看到下一個段落標記（岔路、臨時轉進、停駕點）之前的事
    const upto = this.queue.slice(this.idx);
    const cut = upto.findIndex((e) => typeof e === 'string');
    const rest = (cut >= 0 ? upto.slice(0, cut) : upto).filter((e): e is Encounter => typeof e !== 'string' && visible(run, e)).slice(0, 2);
    const top = p.y + p.h - 22 - Math.max(1, rest.length) * 38;
    const g = this.add2(this.add.graphics());
    g.lineStyle(1, 0x7a6a8e, 0.6);
    g.lineBetween(p.x + 20, top - 10, p.x + p.w - 20, top - 10);
    this.add2(txt(this, p.x + 24, top - 2, '前方', 19, C.muted));
    if (!rest.length) {
      const mark = cut >= 0 ? upto[cut] : undefined;
      // 第一～三章照原本的寫法（只看下一格是不是岔路）
      const label = !this.plan.follow ? (this.queue[this.idx] === 'fork' ? '岔路' : '（這條路快走完了）')
        : mark === 'fork' ? '岔路' : mark === 'rest' ? '停駕點' : mark === 'detourEnd' ? '回到隊伍' : mark === 'detour' ? '（轎子好像要轉彎）' : '（這條路快走完了）';
      this.add2(txt(this, p.x + 90, top - 2, label, 19, C.muted, { bold: false }));
      return;
    }
    rest.forEach((e, i) => {
      const s = summary(run, e);
      const y = top + i * 38;
      this.add2(txt(this, p.x + 90, y - 4, s.icon, 19, '#1d1726', { backgroundColor: `#${s.color.toString(16).padStart(6, '0')}`, padding: { x: 5, y: 1 } }));
      this.add2(txt(this, p.x + 128, y - 2, s.title, 20, C.paper, { bold: false }));
      this.add2(txt(this, p.x + p.w - 24, y, s.cost, 17, C.muted, { bold: false }).setOrigin(1, 0));
    });
  }

  // ---------- 流程 ----------
  private next(): void {
    // 跳過今天不會出現的事
    while (this.idx < this.queue.length) {
      const e = this.queue[this.idx];
      if (typeof e === 'string' || visible(run, e)) break;
      this.idx++;
    }
    if (this.idx >= this.queue.length) return this.endRoute();
    if (this.rejoinAt >= 0 && this.idx >= this.rejoinAt) {
      // 兩條路會合：街景換回當天的
      this.rejoinAt = -1;
      return this.band.setTheme(this.plan.theme, this.hourNow(), () => this.next());
    }
    const e = this.queue[this.idx++];
    this.caught = undefined;
    this.redraw = undefined;
    if (e === 'fork') return this.plan.follow ? this.showBet() : this.showFork();
    if (e === 'detour') return this.showDetour();
    if (e === 'detourEnd') return this.showDetourWhy();
    if (e === 'rest') return this.showRest();
    // 走近的這段時間，面板上還是上一件事的卡片：先擋住，免得按到舊卡片的「略過」把走近的這件事一起略過
    this.busy = true;
    // 第四章：走近時先看到的樣子（預覽）
    const peek = 'peek' in e ? e.peek : undefined;
    if (peek) this.panelMsg(e.place, peek);
    const stray = e.kind === 'imp' && CH().imp.mode === 'stray';
    if (stray) this.banter('stray');
    else if (this.walkN++ % 3 === 1) this.banter(`walk${this.plan.day}`);
    this.band.approach(this.visitorOf(e), () => { this.busy = false; this.show(e); });
  }

  private visitorOf(e: Encounter): Visitor {
    switch (e.kind) {
      case 'person': return { tex: e.tex, kind: 'person' };
      case 'talk': return { tex: e.tex, kind: 'person' };
      case 'ghost': return { tex: CH().cases[e.caseId].tex, kind: 'ghost' };
      // 第四章牽路仔：只找隊尾落隊的人，從隊伍後面冒出來（一隻）
      case 'imp': return CH().imp.mode === 'stray' ? { tex: e.tex, kind: 'imp', count: 1, tail: true } : { tex: e.tex, kind: 'imp', count: 3 };
      case 'clue': return { tex: 'spark', kind: 'clue' };
    }
  }

  /**
   * 處理完一件事：故事用對話演出一句一句播（說話的人有立繪），
   * 播完如果拿到證據，面板列出來；沒有就直接繼續走。
   */
  private after(story: string, gained: string[], who?: { name: string; tex?: string; ghost?: boolean }): void {
    talk(this, say(story, who), () => {
      if (!gained.length) {
        this.busy = true;
        this.band.pass(false, () => { this.busy = false; this.next(); });
        return;
      }
      const p = this.resetSide();
      this.add2(txt(this, p.x + 24, p.y + 20, '證物袋', 28, C.gold, { serif: true }));
      let y = p.y + 76;
      for (const id of gained) {
        const ev = CH().evidence[id];
        this.add2(txt(this, p.x + 24, y, `＋【${ev.kind}】${ev.name}`, 23, 0x9fe8c0));
        const t = this.add2(txt(this, p.x + 24, y + 36, `審「${evidenceFor(id)}」時用得上（${this.ghostStatus(ev.ghost)}）`, 20, C.muted, { bold: false, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
        y = t.y + t.height + 24;
      }
      this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 240, 70, '繼續', () => {
        if (this.busy) return;
        this.busy = true;
        this.band.pass(false, () => { this.busy = false; this.next(); });
      }, { size: 26, fill: 0x8a1b14 }));
    });
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

  /** 共用的卡片外框：（立繪）標題、地點、說明 */
  private cardHead(title: string, place: string, text: string, tag?: { s: string; color: string }, tex?: string, ghost = false, who?: string): { p: { x: number; y: number; w: number; h: number }; y: number } {
    const p = this.resetSide();
    let tx = p.x + 24;
    const art = portraitKey(this, who ?? title);
    if (art) {
      // 立繪圖：左上角放頭像
      const g = this.add2(this.add.graphics());
      g.fillStyle(ghost ? 0x1e2a44 : 0x3a2e24, 1);
      g.fillRoundedRect(p.x + 16, p.y + 10, 96, 96, 12);
      const img = this.add2(portraitThumb(this, art, p.x + 16, p.y + 10, 96));
      if (ghost) img.setAlpha(0.9);
      const frame = this.add2(this.add.graphics());
      frame.lineStyle(2, ghost ? 0x7fb8ff : C.gold, 0.8);
      frame.strokeRoundedRect(p.x + 16, p.y + 10, 96, 96, 12);
      tx = p.x + 124;
    } else if (tex) {
      // 立繪放在左上角，標題往右
      const img = this.add2(this.add.image(p.x + 64, p.y + 100, tex).setOrigin(0.5, 1));
      img.setScale(Math.min(88 / img.height, 80 / img.width));
      if (ghost) img.setTint(0x9ad0ff).setAlpha(0.8);
      tx = p.x + 118;
    }
    this.add2(txt(this, tx, p.y + 14, title, 30, C.gold, { serif: true }));
    this.add2(txt(this, tx, p.y + 58, place, 20, C.muted));
    if (tag) this.add2(txt(this, p.x + p.w - 24, p.y + 18, tag.s, 19, 0xffffff, { backgroundColor: tag.color, padding: { x: 8, y: 4 } }).setOrigin(1, 0));
    const body = this.add2(txt(this, p.x + 24, p.y + 112, text, 22, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    this.drawAhead(p);
    return { p, y: body.y + body.height + 16 };
  }

  /** 一個選項列：左邊按鈕、右邊花費與結果 */
  private optionRow(p: { x: number; w: number }, y: number, label: string, cost: string, result: string, why: string, onPick: () => void, gold = false): number {
    // 花費和結果都可能換行：先排字，再依高度畫底色
    const g = this.add2(this.add.graphics());
    const costT = this.add2(txt(this, p.x + 200, y + 12, cost.replace(/(\d) /g, '$1\u00a0'), 18, gold ? 0xffd76a : C.muted, { bold: false, lineSpacing: 3, wordWrap: { width: p.w - 224, useAdvancedWrap: true } }));
    const resT = this.add2(txt(this, p.x + 200, costT.y + costT.height + 6, why ? `✕ ${why}` : result, 20, why ? 0xff9a8a : 0x9fe8c0, { bold: false, lineSpacing: 3, wordWrap: { width: p.w - 224, useAdvancedWrap: true } }));
    const optH = Math.max(96, resT.y + resT.height + 14 - y);
    g.fillStyle(gold ? 0x5a3a10 : 0x2f3a4a, why ? 0.35 : 0.8);
    g.fillRoundedRect(p.x + 16, y, p.w - 32, optH - 8, 10);
    // 第四章的按鈕字比較長（例如「起一陣風，讓隔壁的阿伯看到他的腳」）：斷成兩行
    const lab = this.plan.follow ? twoLines(label) : label;
    const longest = Math.max(...lab.split('\n').map((s) => s.length));
    const size = lab.includes('\n') ? (longest > 8 ? 15 : 17) : label.length > 9 ? 15 : label.length > 6 ? 18 : label.length > 4 ? 20 : 24;
    const b = this.add2(button(this, p.x + 106, y + (optH - 8) / 2, 164, lab.includes('\n') ? 64 : 52, lab, onPick, { size, fill: gold ? 0x8a5a10 : 0x2f6f5a }));
    b.setEnabled(!why);
    return y + optH;
  }

  private skipRow(p: { x: number; w: number }, y: number, ignore: string, onSkip: () => void, label = '略過'): void {
    const g = this.add2(this.add.graphics());
    g.lineStyle(1, 0x7a6a8e, 0.6);
    g.lineBetween(p.x + 24, y + 2, p.x + p.w - 24, y + 2);
    this.add2(button(this, p.x + 106, y + 40, 164, 52, label, onSkip, { size: 22, fill: 0x3a3442 }));
    this.add2(txt(this, p.x + 200, y + 18, `不處理：${ignore}`, 19, 0xffb0a0, { bold: false, wordWrap: { width: p.w - 224, useAdvancedWrap: true } }));
  }

  private hoursWhy(h: number): string {
    if (h > run.hours) return `時辰不夠（剩 ${run.hours}）`;
    return '';
  }

  private skip(fled = false): void {
    if (this.busy) return;
    this.busy = true;
    this.caught = undefined;
    this.band.pass(fled, () => { this.busy = false; this.next(); });
  }

  /** 第三章的規則（威名、快判、風火輪）：slayRule 是 renown 的章節 */
  private renown(): boolean {
    return CH().slayRule === 'renown';
  }

  /** 互嗆：一句一行的小字幕，不擋操作（台詞庫見各章的 banter） */
  private banter(key: string): void {
    const lib = CH().banter?.[key];
    if (!lib?.length) return;
    const n = (this.banterN[key] = (this.banterN[key] ?? -1) + 1);
    banter(this, lib[n % lib.length], BAND_Y + 8);
  }

  // ----- 人 -----
  private blocked(o: Option): string {
    // 第四章：稟報次數、點心站（這一段已經在幫別的事）
    if (CH().follow) return optionWhy(run, o, this.seg);
    if (o.miracle && run.miracles <= 0) return '今天的神蹟已經用完';
    return this.hoursWhy(o.hours);
  }

  private costLine(o: Option): string {
    const parts = [`${o.hours} 時辰`];
    if (o.miracle) parts.push('神蹟（最後一戰小妖 +1 波）');
    if (o.report) parts.push(`${this.miracleLabel()} 1 次（${REPORT_NOTE}）`);
    if (o.stall) parts.push(`點心站「${o.stall}」（這一段不能再幫別的）`);
    const newEv = (o.gives ?? []).filter((id) => !run.evidence.includes(id));
    if (newEv.length) parts.push(`得到：${newEv.map((id) => CH().evidence[id].name).join('、')}`);
    return parts.join('・');
  }

  private showPerson(e: Extract<Encounter, { kind: 'person' }>): void {
    this.redraw = () => this.showPerson(e);
    const card = CH().cards[e.card](run) as Card;
    const { p, y: y0 } = this.cardHead(card.who, e.place, card.text, card.deadline ? { s: `期限：${card.deadline}`, color: '#b3261e' } : undefined, e.tex);
    let y = y0;
    for (const o of card.options) {
      y = this.optionRow(p, y, o.label, this.costLine(o), o.result, this.blocked(o), () => this.choosePerson(o, { name: card.who, tex: e.tex }), !!o.miracle || !!o.report);
    }
    this.skipRow(p, y, card.ignore, () => {
      // 第四章：略過的事，天亮「昨日」寫出沒辦的結果
      if (card.missed && !this.busy) run.flags[`missed_${e.card}`] = true;
      this.skip();
    });
  }

  private choosePerson(o: Option, who: { name: string; tex: string }): void {
    if (this.blocked(o) || this.busy) return;
    const before = run.evidence.length;
    this.spend(o.hours);
    if (o.miracle) {
      run.miracles--;
      run.bossAdds++;
      this.cameras.main.flash(500, 255, 230, 160);
    }
    if (o.stall) useStall(run, this.seg, o.stall);
    // 第四章稟報：報到轎前。轎子停不停由內容決定（不是亂數）；不加最後一戰的小妖
    const rep = o.report ? report(run, o) : undefined;
    const story = [o.apply(run), rep?.text].filter(Boolean).join('\n');
    this.refreshHeader();
    this.after(story, run.evidence.slice(before), who);
  }

  // ----- 鬼 -----
  private showGhost(e: Extract<Encounter, { kind: 'ghost' }>): void {
    const k = CH().cases[e.caseId];
    this.redraw = () => this.showGhost(e);
    const mood = this.caught?.id === k.id ? 'normal' : ghostMood(run, e.caseId);
    if (mood === 'fled') {
      const p = this.resetSide();
      this.add2(txt(this, p.x + 24, p.y + 18, k.dayName, 30, 0x9fd0ff, { serif: true }));
      this.add2(txt(this, p.x + 24, p.y + 72, `隊伍身上的戾氣太重。牠一感覺到，就逃走了。\n\n今天收不到牠：${k.harm}。`, 23, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
      this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 240, 70, '繼續', () => {
        if (this.busy) return;
        this.busy = true;
        this.band.pass(true, () => { this.busy = false; this.next(); });
      }, { size: 26, fill: 0x3a3442 }));
      return;
    }
    if (this.renown()) return this.showGhost3(e, k, mood);
    const hours = collectHours(run, e.caseId);
    const evs = evidenceOf(k.id);
    const have = evs.filter((id) => run.evidence.includes(id));
    const later = laterSightings(k.id, this.plan.day);
    // 細節（審清楚的好處、缺哪些證據）收在令旗下的格子裡，點了看
    const info = [
      ...(k.affects ? [`牽連：${k.affects}`] : []),
      `證據 ${have.length}／${evs.length}・${later.length ? `之後在${later[0]}還會遇到` : '今天不收，之後就遇不到了'}`,
    ].join('\n');
    const text = `${k.daySight}${mood === 'hiding' ? '\n牠感覺到隊伍的戾氣，躲了起來；要花 1 個時辰勸出來。' : ''}\n\n${info}`;
    // 第四章的鬼不是「有冤情」：是沒地方去、要帶到歸處的
    const tag = k.meet ? { s: '沒地方去的', color: '#2b5aa8' } : { s: '有冤情的鬼', color: '#2b5aa8' };
    const { p, y: y0 } = this.cardHead(k.dayName, `${e.place}（凡人看不見）`, text, tag, k.tex, true, k.id);
    const full = run.held.length >= run.slots;
    const why = full ? `${CH().held.label}的格子滿了` : this.hoursWhy(hours);
    const extra = (k.onCollect ?? []).filter((id) => !run.evidence.includes(id));
    const cost = `${hours ? `${hours} 時辰（勸出來）・` : '不花時辰・'}佔 1 格（剩 ${run.slots - run.held.length} 格）${extra.length ? `・得到：${extra.map((id) => CH().evidence[id].name).join('、')}` : ''}`;
    const m = k.meet;
    const y = this.optionRow(p, y0, m?.take ?? '收容', cost, m?.takeResult ?? `帶回${CH().held.label}，今晚夜審`, why, () => this.collect(e, hours));
    this.skipRow(p, y, k.harm, () => {
      if (!m) return this.skip();
      // 第四章：先不帶，播他自己走開的樣子
      if (this.busy) return;
      this.busy = true;
      talk(this, say(m.left), () => { this.busy = false; this.skip(); });
    }, m?.skip);
  }

  /**
   * 第三章的鬼卡：
   *  - 威名嚇跑（scared）：先花 1 時辰追回，不追就錯過
   *  - 戾氣躲起來（hiding）：風火輪追，不花時辰，追到的鬼收容後怨氣 +1
   *  - 追到了或照常：收容、北營看相、太子親斬、押送（快判不花時辰、不佔夜審名額）
   */
  private showGhost3(e: Extract<Encounter, { kind: 'ghost' }>, k: GhostCase, mood: string): void {
    const evs = evidenceOf(k.id);
    const have = evs.filter((id) => run.evidence.includes(id));
    const later = laterSightings(k.id, this.plan.day);
    const info = [
      `牽連：${k.affects}`,
      `證據 ${have.length}／${evs.length}・${later.length ? `之後在${later[0]}還會遇到` : '今天不收，之後就遇不到了'}`,
    ].join('\n');
    const looked = isLooked(run, k.id);
    const tag = looked ? LOOK_TAG[natureOf(k)] : { s: '身分未明', color: '#4a4a5a' };
    const place = `${e.place}（凡人看不見）`;
    if (mood === 'scared') {
      const { p, y } = this.cardHead(k.dayName, place, `${k.daySight}\n太子的威名傳開了：牠一看到隊伍，就往巷子裡跑。\n\n${info}`, tag, k.tex, true, k.id);
      const y2 = this.optionRow(p, y, '追回', `${CATCH_HOURS} 時辰`, '追上之後可以收容、看相或快判', this.hoursWhy(CATCH_HOURS), () => {
        if (this.busy || !this.spend(CATCH_HOURS)) return;
        this.busy = true;
        this.band.chase(() => { this.busy = false; this.caught = { id: k.id, grudge: 0 }; this.showGhost(e); });
      });
      this.skipRow(p, y2, `牠跑掉了，${k.harm}`, () => this.skip(true));
      this.banter('scared');
      return;
    }
    if (mood === 'hiding') {
      const { p, y } = this.cardHead(k.dayName, place, `${k.daySight}\n牠感覺到隊伍的戾氣，躲了起來。\n\n${info}`, tag, k.tex, true, k.id);
      const grudge = collectGrudge('hiding', CH());
      const y2 = this.optionRow(p, y, '風火輪追', `不花時辰・追到之後收容，怨氣 +${grudge}`, '太子踩著風火輪追上去，把牠揪回來', '', () => {
        if (this.busy) return;
        this.busy = true;
        this.banter('chase');
        this.band.chase(() => { this.busy = false; this.caught = { id: k.id, grudge }; this.showGhost(e); });
      }, true);
      this.skipRow(p, y2, k.harm, () => this.skip(true));
      return;
    }
    const lost = (k.dropsOnTrial ?? []).filter((id) => !run.evidence.includes(id));
    const warn = looked && lost.length ? `\n廉將軍：牠身上有東西。不審直接斬，就拿不到「${lost.map((id) => CH().evidence[id].name).join('、')}」。` : '';
    const { p, y: y0 } = this.cardHead(k.dayName, place, `${k.daySight}${warn}\n${info}`, tag, k.tex, true, k.id);
    const full = run.held.length >= run.slots;
    const extra = (k.onCollect ?? []).filter((id) => !run.evidence.includes(id));
    const grudge = this.caught?.id === k.id ? this.caught.grudge : 0;
    // 四個動作排成一列：收容、北營看相、太子親斬、押送（快判不花時辰、不佔夜審名額）
    let y = this.actionGrid(p, y0, [
      {
        label: '收容', sub: `佔 1 格（剩 ${run.slots - run.held.length}）${grudge ? `・怨氣 +${grudge}` : ''}${extra.length ? `・得到${extra.map((id) => CH().evidence[id].name).join('、')}` : ''}`,
        why: full ? '營旗下滿了' : '', onPick: () => this.collect(e, 0),
      },
      {
        label: '北營看相', sub: looked ? `看過了：${tag.s}` : `${LOOK_HOURS} 時辰・看出身分`,
        why: looked ? '已看過' : this.hoursWhy(LOOK_HOURS), onPick: () => this.look(k, () => this.showGhost(e)),
      },
      { label: '太子親斬', sub: '0 時辰・當場斬', fill: 0x8a1b14, onPick: () => this.slay(k, true) },
      { label: '押送', sub: '0 時辰・押去地府', fill: 0x4a3a6a, onPick: () => this.escort(k, true) },
    ]);
    const note = this.add2(txt(this, p.x + 28, y, `太子親斬：${slayPreview(run, k, CH())}${full ? '\n營旗下滿了：可以點上方的營旗格快判，空出格子。' : ''}`, 17, 0xffb0a0, { bold: false, lineSpacing: 3, wordWrap: { width: p.w - 56, useAdvancedWrap: true } }));
    y = note.y + note.height + 10;
    this.skipRow(p, y, k.harm, () => this.skip());
  }

  /** 一列動作按鈕（下面一行小字寫花費；不能按的寫理由） */
  private actionGrid(p: { x: number; w: number }, y: number, list: ActionDef[]): number {
    const bw = (p.w - 32 - 8 * (list.length - 1)) / list.length;
    let bottom = y;
    list.forEach((a, i) => {
      const bx = p.x + 16 + bw / 2 + i * (bw + 8);
      const b = this.add2(button(this, bx, y + 28, bw, 54, a.label, () => { if (!a.why && !this.busy) a.onPick(); }, { size: 21, fill: a.fill ?? 0x2f6f5a }));
      b.setEnabled(!a.why);
      const show = a.why && a.why !== '已看過' ? `✕ ${a.why}` : a.sub;
      const t = this.add2(txt(this, bx, y + 60, show, 14, a.why && a.why !== '已看過' ? 0xff9a8a : C.muted, { bold: false, align: 'center', lineSpacing: 2, wordWrap: { width: bw - 4, useAdvancedWrap: true } }).setOrigin(0.5, 0));
      bottom = Math.max(bottom, t.y + t.height);
    });
    return bottom + 10;
  }

  /** 北營看相：花 1 時辰，廉將軍說一句話，格子／鬼卡標上身分 */
  private look(k: GhostCase, done: () => void): void {
    if (this.busy || !this.spend(LOOK_HOURS)) return;
    lookAt(run, k);
    this.refreshHeader();
    this.banter('look');
    talk(this, splitStory(`北營廉將軍走上前，看了牠一眼。${k.lookLine ?? ''}`, { name: '廉將軍' }), done);
  }

  /** 太子親斬（路上當場斬或營旗格快判）：依身分算威名或戾氣；斬錯了播真相回憶、記遺憾 */
  private slay(k: GhostCase, onRoad: boolean, done?: () => void): void {
    if (this.busy) return;
    const st = run.cases[k.id] ?? { truths: [] };
    const name = st.truths.length ? k.name : k.dayName;
    const res = slayGhost(run, k, CH());
    this.caught = undefined;
    this.cameras.main.flash(300, 255, 255, 255);
    this.cameras.main.shake(300, 0.01);
    const lines = [CH().trial.slayLine(name)];
    if (res.weiming) lines.push(`威名 +${res.weiming}`);
    else if (!res.wronged) lines.push('牠還沒被揭穿：威名不加，也不加戾氣');
    if (res.lost.length) lines.push(`沒審就斬：拿不到「${res.lost.map((id) => CH().evidence[id].name).join('、')}」了`);
    if (res.wronged) lines.push(CH().trial.wrongedLine, `牠是有冤的：戾氣 +${res.liqi}・因果簿記下遺憾`);
    lines.push(...CH().verdictEffects(run, k.id, 'slay').filter(Boolean));
    this.refreshHeader();
    this.banter(res.wronged ? 'wronged' : 'slay');
    const tell = () => {
      if (onRoad) {
        this.busy = true;
        this.band.smite(() => { this.busy = false; this.after(lines.join('\n'), []); });
      } else talk(this, splitStory(lines.join('\n')), () => done?.());
    };
    if (!res.wronged) return tell();
    // 斬錯了：斬完才看到牠的冤情
    const reel = truthReel(k);
    this.busy = true;
    this.time.delayedCall(350, () => flashback(this, { tex: portraitKey(this, k.id, 'sad') ?? k.tex, name: k.name, reveal: reel.reveal, summary: reel.summary, fx: k.memory }, () => { this.busy = false; tell(); }));
  }

  /** 快判押送：不花時辰、空出格子 */
  private escort(k: GhostCase, onRoad: boolean, done?: () => void): void {
    if (this.busy) return;
    const st = run.cases[k.id] ?? { truths: [] };
    const name = st.truths.length ? k.name : k.dayName;
    escortGhost(run, k);
    this.caught = undefined;
    const lines = [`五營兵將押著${name}，往地府去了。`, ...CH().verdictEffects(run, k.id, 'escort').filter(Boolean)];
    this.refreshHeader();
    this.banter('escort');
    if (onRoad) {
      this.busy = true;
      this.band.collect(() => { this.busy = false; this.after(lines.join('\n'), []); });
    } else talk(this, splitStory(lines.join('\n')), () => done?.());
  }

  private collect(e: Extract<Encounter, { kind: 'ghost' }>, hours: number): void {
    if (this.busy || run.held.length >= run.slots || !this.spend(hours)) return;
    this.busy = true;
    const k = CH().cases[e.caseId];
    const grudge = this.caught?.id === k.id ? this.caught.grudge : 0;
    this.caught = undefined;
    run.held.push({ id: e.caseId, grudge, ...(isLooked(run, e.caseId) ? { looked: true } : {}) });
    // 第三章原本就每次收容都播；第一、二章有台詞庫以後也播（沒有台詞的章節，banter() 自己跳過）
    this.banter('collect');
    run.cases[e.caseId] ??= { truths: [] };
    const gained = (k.onCollect ?? []).filter((id) => gainEvidence(id));
    this.refreshHeader();
    this.band.collect(() => {
      this.busy = false;
      this.drawSlots(e.caseId);
      this.after(k.meet?.taken ?? CH().held.collect(k.dayName), gained, k.meet ? { name: k.name, tex: k.tex, ghost: true } : undefined);
    });
  }

  // ----- 小妖 -----
  private showImp(e: Extract<Encounter, { kind: 'imp' }>): void {
    const rule = CH().imp;
    if (rule.mode === 'stray') return this.showStray(e, rule);
    if (rule.mode === 'scatter') {
      const { p, y: y0 } = this.cardHead('小妖', e.place, e.text, undefined, e.tex);
      const y = this.optionRow(p, y0, rule.verb, `${rule.hours} 時辰`, rule.result, this.hoursWhy(rule.hours), () => {
        if (this.busy || !this.spend(rule.hours)) return;
        this.busy = true;
        this.refreshHeader();
        this.banter('imp');
        this.band.scatter(() => { this.busy = false; this.after(rule.story, []); });
      });
      this.skipRow(p, y, '最後一戰小妖 +1 波', () => this.skipImp());
      return;
    }
    if (rule.mode === 'ring') {
      // 乾坤圈（第三章）：不花時辰、不加戾氣
      if (impsFlee(run, CH())) {
        // 威名 ≥1：小妖看到隊伍自己逃（算清掉，不會跟到最後一戰）
        const { p } = this.cardHead('小妖', e.place, `${e.text}\n\n太子的威名傳開了：小妖遠遠看到五營旗，自己逃回水溝裡。\n不用出手，牠們也不會跟到最後一戰。`, { s: `威名 ${run.weiming}`, color: '#8a5a10' }, e.tex);
        this.add2(button(this, p.x + p.w / 2, p.y + p.h - 160, 240, 64, '繼續', () => this.skip(true), { size: 24, fill: 0x2f6f5a }));
        this.banter('flee');
        return;
      }
      const { p, y: y0 } = this.cardHead('小妖', e.place, e.text, undefined, e.tex);
      const y = this.optionRow(p, y0, rule.verb, '不花時辰・不加戾氣', rule.result, '', () => {
        if (this.busy) return;
        this.busy = true;
        this.banter('ring');
        this.band.ring(() => { this.busy = false; this.after(rule.story, []); });
      }, true);
      this.skipRow(p, y, `最後一戰蝦兵 +${rule.skipAdds} 波`, () => this.skipImp());
      return;
    }
    // 押煞上船：用王令，不花時辰；王令每天有限
    const { p, y: y0 } = this.cardHead('小妖', e.place, `${e.text}\n今天的王令還有 ${run.decrees}／${rule.perDay} 道。`, undefined, e.tex);
    const why = run.decrees <= 0 ? '今天的王令用完了' : '';
    const y = this.optionRow(p, y0, rule.verb, `王令 1 道・不花時辰`, rule.result, why, () => {
      if (this.busy || run.decrees <= 0) return;
      this.busy = true;
      run.decrees--;
      this.refreshHeader();
      this.banter('imp');
      this.band.toShip(() => { this.busy = false; this.after(rule.story, []); });
    }, true);
    this.skipRow(p, y, '最後一戰小妖 +1 波', () => this.skipImp());
  }

  private skipImp(): void {
    if (this.busy) return;
    const rule = CH().imp;
    if (rule.mode === 'stray') skipStray(run);
    else run.bossAdds += rule.mode === 'ring' ? rule.skipAdds : 1;
    this.skip();
  }

  /**
   * 第四章牽路仔：只對隊尾落隊的人下手（轎、頭旗、香擔牠碰不到）。
   * 派兵回頭喊花時辰；附近有點心站可以託人顧（0 時辰，那一攤這一段不能再幫別的）。略過：有人沒跟上。
   */
  private showStray(e: Extract<Encounter, { kind: 'imp' }>, rule: Extract<ImpRule, { mode: 'stray' }>): void {
    this.redraw = () => this.showStray(e, rule);
    const near = e.stall ? `\n附近有點心站「${e.stall}」。` : '';
    const { p, y: y0 } = this.cardHead('牽路仔', e.place, `${e.text}${near}`, { s: '隊尾', color: '#6a4a8a' }, e.tex);
    let y = y0;
    for (const c of strayChoices(run, e, this.seg, rule.hours)) {
      const res = c.how === 'shout' ? rule.result : '點心站的人幫忙把人拉回來';
      y = this.optionRow(p, y, c.how === 'shout' ? rule.verb : c.label, c.cost, res, c.why, () => {
        if (this.busy || !resolveStray(run, e, this.seg, c.how, rule.hours)) return;
        this.busy = true;
        this.refreshHeader();
        this.band.scatter(() => { this.busy = false; this.after(c.how === 'shout' ? rule.story : rule.entrustStory, []); });
      }, c.how === 'entrust');
    }
    this.skipRow(p, y, rule.skip, () => this.skipImp());
  }

  // ----- 線索 -----
  private showClue(e: Extract<Encounter, { kind: 'clue' }>): void {
    this.redraw = () => this.showClue(e);
    const g = CH().evidence[e.evidence].ghost;
    const { p, y: y0 } = this.cardHead('線索', e.place, `${e.text}\n跟「${CH().cases[g].dayName}」的案子有關（${this.ghostStatus(g)}）`);
    const y = this.optionRow(p, y0, '查看', `${e.hours} 時辰・得到物證`, `晚上審「${CH().cases[g].dayName}」時可以出示`, this.hoursWhy(e.hours), () => {
      if (this.busy || !this.spend(e.hours)) return;
      this.busy = true;
      gainEvidence(e.evidence);
      this.band.take(() => { this.busy = false; this.after(e.story ?? CH().evidence[e.evidence].text, [e.evidence]); });
    });
    this.skipRow(p, y, '少一件證據', () => this.skip());
  }

  // ----- 問話 -----
  private showTalk(e: Extract<Encounter, { kind: 'talk' }>): void {
    this.redraw = () => this.showTalk(e);
    if (talkBlocked(run)) {
      const p = this.resetSide();
      this.add2(txt(this, p.x + 24, p.y + 18, e.who, 28, C.gold, { serif: true }));
      this.add2(txt(this, p.x + 24, p.y + 72, '凡人看不見戾氣，卻覺得這支隊伍「氣很重」。他看了一眼，就轉身走開了。', 23, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
      this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 240, 70, '繼續', () => this.skip(), { size: 26, fill: 0x3a3442 }));
      return;
    }
    const g = CH().evidence[e.evidence].ghost;
    const { p, y: y0 } = this.cardHead(e.who, e.place, `${e.text}\n跟「${CH().cases[g].dayName}」的案子有關（${this.ghostStatus(g)}）`, undefined, e.tex);
    const y = this.optionRow(p, y0, '問話', `${e.hours} 時辰・得到${CH().evidence[e.evidence].kind}`, `晚上審「${CH().cases[g].dayName}」時可以出示`, this.hoursWhy(e.hours), () => {
      if (this.busy || !this.spend(e.hours)) return;
      gainEvidence(e.evidence);
      this.refreshHeader();
      this.after(CH().evidence[e.evidence].text, [e.evidence], { name: e.who, tex: e.tex });
    });
    this.skipRow(p, y, '少一件證據', () => this.skip());
  }

  // ---------- 岔路 ----------
  private showFork(): void {
    const p = this.resetSide();
    this.add2(txt(this, p.x + 24, p.y + 14, '岔路', 30, C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 56, '時辰只夠走一條。另一條路上的人和鬼，今天就錯過了。', 20, C.paper, { bold: false, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
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
      const max = Math.max(1, Math.floor((blockH - 12 - 50 - 58) / 36));
      list.slice(0, max).forEach((e, k) => {
        const s = summary(run, e);
        const y = by + 50 + k * 36;
        this.add2(txt(this, p.x + 32, y, s.icon, 18, '#1d1726', { backgroundColor: `#${s.color.toString(16).padStart(6, '0')}`, padding: { x: 4, y: 1 } }));
        this.add2(txt(this, p.x + 68, y + 1, s.title, 20, C.paper, { bold: false }));
      });
      if (list.length > max) this.add2(txt(this, p.x + 32, by + 50 + max * 36, `……還有 ${list.length - max} 件`, 18, C.muted, { bold: false }));
      this.add2(button(this, p.x + p.w - 100, by + blockH - 48, 160, 56, `走${route.id}線`, () => this.chooseRoute(route), { size: 24, fill: route.color }));
    });
  }

  private chooseRoute(route: RouteDef): void {
    if (this.busy) return;
    this.queue = [...route.encounters, ...this.plan.post];
    this.idx = 0;
    this.panelMsg(`走${route.id}線・${route.name}`, '隊伍轉進巷子。');
    this.banter('fork');
    this.busy = true;
    const walk = () => this.band.walk(700, () => { this.busy = false; this.next(); });
    // 第三章：岔路後換街景（例如庄頭線進鴨母寮），會合後換回來
    if (route.theme && route.theme !== this.plan.theme) {
      this.rejoinAt = this.plan.post.length ? route.encounters.length : -1;
      this.band.setTheme(route.theme, this.hourNow(), walk);
    } else walk();
  }

  // ---------- 第四章：跟轎（core/procession.ts） ----------
  /** 一個段落畫面：標題、說明、一顆繼續的按鈕 */
  private stepPanel(title: string, body: string, label: string, go2: () => void): void {
    const p = this.resetSide();
    this.add2(txt(this, p.x + 24, p.y + 18, title, 30, C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 70, body, 22, C.paper, { bold: false, lineSpacing: 9, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 260, 70, label, () => {
      if (this.busy) return;
      go2();
    }, { size: 26, fill: 0x8a1b14 }));
  }

  /**
   * 行轎岔路：轎子往哪走由內容決定，玩家只決定先鋒押哪（押甲／押乙／留在轎邊）。
   * 每個選項先寫明押中、押錯各會怎樣（選擇一律明講代價）。
   */
  private showBet(): void {
    const f = this.plan.follow!;
    this.banter('bet');
    // 第四章（有線索、路況的天）：先看路況與線索，再押兵（一頁放不下）
    if (f.clues?.length || this.plan.routes.some((rt) => rt.preview)) return this.showBetInfo();
    this.showBetPick();
  }

  /** 岔路口的路況：說明、已經拿到的線索、兵馬的提示、兩條路看得到的樣子 */
  private showBetInfo(): void {
    const f = this.plan.follow!;
    const p = this.resetSide();
    const wrap = { bold: false, lineSpacing: 5, wordWrap: { width: p.w - 48, useAdvancedWrap: true } };
    this.add2(txt(this, p.x + 24, p.y + 14, '行轎岔路', 30, C.gold, { serif: true }));
    const intro = this.add2(txt(this, p.x + 24, p.y + 58, `${f.hint}\n${f.intro ?? ''}`, 19, C.paper, wrap));
    let y = intro.y + intro.height + 12;
    // 已經拿到的線索（拿到任何一條都指向轎子會走的那條）
    if (f.clues?.length) {
      const got = f.clues.filter((c) => c.got(run)).map((c) => `・${c.text}`);
      const t = this.add2(txt(this, p.x + 24, y, `已經知道的（${got.length}／${f.clues.length}）：\n${got.join('\n')}`, 18, 0xffd76a, wrap));
      y = t.y + t.height + 10;
    }
    if (f.hints) {
      const t = this.add2(txt(this, p.x + 24, y, f.hints, 18, C.paper, wrap));
      y = t.y + t.height + 12;
    }
    for (const rt of this.plan.routes) {
      const body = rt.preview ? `\n${rt.preview.join('\n')}${rt.note ? `\n（${rt.note}）` : ''}` : '';
      const t = this.add2(txt(this, p.x + 24, y, `${rt.id}・${rt.name}${body}`, 18, rt.color, { ...wrap, bold: true }));
      y = t.y + t.height + 10;
    }
    this.add2(button(this, p.x + p.w / 2, p.y + p.h - 56, 300, 70, '決定前哨去哪', () => {
      if (this.busy) return;
      this.showBetPick();
    }, { size: 24, fill: 0x8a1b14 }));
  }

  /** 押兵：押甲／押乙／留在轎邊（每個選項寫明押中、押錯各會怎樣） */
  private showBetPick(): void {
    const f = this.plan.follow!;
    const p = this.resetSide();
    const wrap = { bold: false, lineSpacing: 5, wordWrap: { width: p.w - 48, useAdvancedWrap: true } };
    this.add2(txt(this, p.x + 24, p.y + 14, '行轎岔路', 30, C.gold, { serif: true }));
    const intro = this.add2(txt(this, p.x + 24, p.y + 58, f.intro ?? `轎子往哪走，只有媽祖知道。你能決定的是先鋒兵馬先押在哪條路等。\n${f.hint}`, 19, C.paper, wrap));
    let y = intro.y + intro.height + 10;
    // 兩條路上看得到什麼（哪邊有小妖、哪邊有人在等）
    for (const rt of this.plan.routes) {
      const list = rt.encounters.filter((e) => visible(run, e)).map((e) => summary(run, e).icon).join('');
      const t = this.add2(txt(this, p.x + 24, y, `${rt.id}・${rt.name}：${list || '（看不出有什麼）'}`, 19, rt.color, { ...wrap, bold: true }));
      y = t.y + t.height + 6;
    }
    y += 6;
    if (f.clues?.length) this.add2(button(this, p.x + p.w - 90, p.y + 30, 140, 44, '◀ 再看路況', () => { if (!this.busy) this.showBetInfo(); }, { size: 18, fill: 0x3a3442 }));
    for (const c of betChoices(this.plan)) {
      const stay = c.bet === 'stay';
      const own = f.bets?.[c.bet];
      if (own) y = this.optionRow(p, y, own.label, own.small, '', '', () => this.bet(c.bet), !stay);
      else y = this.optionRow(p, y, c.label, stay ? '先鋒留在轎邊' : `押中：${c.ifRight}`, stay ? '不賺不賠' : `押錯：${c.ifWrong}`, '', () => this.bet(c.bet), !stay);
    }
  }

  private bet(choice: string): void {
    if (this.busy) return;
    const f = this.plan.follow!;
    const before = run.hours;
    const o = resolveBet(run, this.plan, choice);
    const diff = run.hours - before;
    this.refreshHeader();
    const rt = this.plan.routes.find((x) => x.id === f.goes);
    const res = o.result === 'hit'
      ? `押中了。先鋒已經在${f.goes}路等著${o.cleared.length ? '，路上的牽路仔先清掉了' : ''}。${o.full ? '時辰本來就是滿的，沒有多出來' : `時辰 ${diff >= 0 ? '+' : ''}${diff}`}。`
      : o.result === 'miss' ? `押錯了。先鋒兵馬要從另一條路趕回來。時辰 ${diff}。` : '先鋒留在轎邊。不賺不賠。';
    const go2 = () => {
      this.band.poseJiao('st_jiao4_carry');
      this.queue = afterFork(this.plan, run);
      this.idx = 0;
      this.seg = f.goes;
      this.busy = true;
      this.band.walk(700, () => { this.busy = false; this.next(); });
    };
    if (!f.results) {
      this.banter('fork');
      this.stepPanel(`轎子往${f.goes}・${rt?.name ?? ''}`, `${f.turn}\n\n${res}`, '跟上', go2);
      return;
    }
    // 第四章：行轎演出（三個選項都播）→ 押中／押錯／留在轎邊的對話 → 實際時辰變化
    // 第 3 輪：隊伍裡的轎第一句（路口停住、頓）換 st_jiao4_pause，之後（往小路踩）換 st_jiao4_turn，「跟上」換回扛著走。
    // 字不動：同一段字在 turn 第一行之後切成兩段播（第一行「停住、頓」自己一個框，其餘照舊）
    // 作者定案 A：押中但時辰已滿 → 不加，最後一行系統句換成 results.hitFull（betResultText）
    this.busy = true;
    const said = betResultText(f, o);
    const [stop, ...rest] = f.turn.split('\n');
    const first = say(stop);
    const lines = [...first, ...say(`${rest.join('\n')}\n${said}`)];
    const cut = first.length;
    this.band.poseJiao('st_jiao4_pause');
    const after = () => {
      this.busy = false;
      this.banter(`bet_${o.result}`);
      const real = `時辰 ${diff >= 0 ? '+' : ''}${diff}（剩 ${run.hours}）`;
      this.stepPanel(`轎子往${f.goes}・${rt?.name ?? ''}`, `${said.split('\n').pop()}\n${real}`, '跟上', go2);
    };
    talk(this, lines.slice(0, cut), () => {
      this.band.poseJiao('st_jiao4_turn');
      talk(this, lines.slice(cut), after);
    });
  }

  /** 臨時轉進：甲乙都不是，轎子拐進第三個地方。沒得猜，事後才有解釋 */
  private showDetour(): void {
    const d = this.plan.follow!.detour!;
    this.seg = 'detour';
    this.stepPanel(`臨時轉進・${d.name}`, `${d.text}\n\n（這一次沒得猜，只能跟。）`, '跟進去', () => {
      this.busy = true;
      const walk = () => this.band.walk(700, () => { this.busy = false; this.next(); });
      // 第四章：轉進的過場（有演出腳本就播演出，見 content/stage/ch4.ts）
      if (d.story) playStory(this, d.story, () => { this.banter('detour'); walk(); });
      else walk();
    });
  }

  private showDetourWhy(): void {
    const d = this.plan.follow!.detour!;
    this.stepPanel('事後才知道', d.why, '繼續', () => this.next());
  }

  /** 停駕點：短暫休息（之後是會合後的事、駐駕）。有寫 art／theme 就換街景（第四章：賢仔車行） */
  private showRest(): void {
    const r = this.plan.follow!.rest;
    this.seg = 'rest';
    if (r.art || r.theme) this.band.setScene(r.theme ?? this.plan.theme, r.art, this.hourNow());
    const go2 = () => {
      this.busy = true;
      this.band.walk(500, () => { this.busy = false; this.next(); });
    };
    // 第二天・北津派出所：停駕等信徒集結（先看停駕，再看等人集結；有過場就蓋在畫面上播）
    const g = r.gather;
    if (g) {
      this.stepPanel(`停駕・${r.name}`, r.text, '等人集結', () => {
        this.stepPanel(g.title, g.text, '繼續', () => {
          if (!g.story) return go2();
          this.busy = true;
          playStory(this, g.story, () => { this.busy = false; go2(); });
        });
      });
      return;
    }
    this.stepPanel(`停駕・${r.name}`, r.text, '繼續', go2);
  }

  /** 日落傳消息：讓跟轎台拍到哪一件事 → 明天的事件池換人（代價照例明講） */
  private showBroadcast(p: { x: number; y: number; w: number; h: number }, y0: number): void {
    let y = y0;
    this.add2(txt(this, p.x + 24, y, '傳消息：讓跟轎台拍到哪一件？', 22, C.gold, { serif: true }));
    y += 40;
    if (this.plan.broadcastNote) {
      const t = this.add2(txt(this, p.x + 24, y, this.plan.broadcastNote, 18, C.muted, { bold: false, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
      y = t.y + t.height + 10;
    }
    for (const o of this.plan.broadcast ?? []) {
      const none = !o.tags.length || o.chain === 0;
      const pick = () => {
        if (this.busy) return;
        applyBroadcast(run, this.plan.day, o);
        if (!o.said) return this.endDay();
        this.busy = true;
        talk(this, say(o.said), () => { this.busy = false; this.endDay(); });
      };
      if (o.said) y = this.optionRow(p, y, o.label, `明天多來的人：${o.brings}`, `明天的代價：${o.cost}`, '', pick, !none);
      else y = this.optionRow(p, y, none ? '不拍' : '讓他拍', `拍到：${o.label}・明天多來：${o.brings}`, `明天的代價：${o.cost}`, '', pick, !none);
    }
  }

  // ---------- 一天結束 ----------
  private endRoute(): void {
    run.hours = 0;
    this.refreshHeader();
    this.endDay();
  }

  private endDay(): void {
    if (this.plan.follow) return this.endDayFollow();
    const p = this.resetSide();
    this.add2(txt(this, p.x + p.w / 2, p.y + 30, '日落・隊伍回廟', 32, C.gold, { serif: true }).setOrigin(0.5, 0));
    this.redraw = undefined;
    const camps = CH().slotLabels;
    const lines = camps
      ? this.campSummary(camps)
      : run.held.length
        ? `${CH().held.label}收容了 ${run.held.length} 個鬼：\n${run.held.map((h) => `・${CH().cases[h.id].dayName}`).join('\n')}\n\n今晚升堂夜審。`
        : '今天沒有收容任何鬼。';
    this.add2(txt(this, p.x + 24, p.y + 100, lines, 23, C.paper, { bold: false, lineSpacing: 10, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    this.band.setHour(18);
    this.banter('dusk');
    const day = this.plan.day;
    if (day === 3) CH().endOfDay3(run);
    this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 260, 72, '入夜・升堂', () => go(this, 'cut', { kind: 'dusk', title: '日落・升堂', sub: `今晚審${CH().held.label}的鬼`, next: { key: 'trial', data: { night: day } } }), { size: 26, fill: 0x5a2a6a }));
  }

  /**
   * 第四章日落：駐駕（過夜的地方）→ 傳消息（三選一，換明天的事件池）→ 入夜問歸處。
   * 頭旗下帶著走的鬼（已決定歸處）也列出來：到了那裡才放下。
   */
  private endDayFollow(): void {
    const f = this.plan.follow!;
    // 駐駕前的過場（第二天：入廟三進三退 sanjin4）：只播一次，播完再畫日落
    const st = f.stay.story;
    if (st && !this.stayStoryPlayed) {
      this.stayStoryPlayed = true;
      this.busy = true;
      playStory(this, st, () => { this.busy = false; this.endDayFollow(); });
      return;
    }
    const p = this.resetSide();
    this.redraw = undefined;
    this.add2(txt(this, p.x + p.w / 2, p.y + 24, `日落・駐駕${f.stay.name}`, 30, C.gold, { serif: true }).setOrigin(0.5, 0));
    const held = run.held.length
      ? `頭旗下 ${run.held.length}／${run.slots}：${run.held.map((h) => `${CH().cases[h.id].dayName}${h.dest ? `（往${CH().guihu?.dests[h.dest]?.name ?? h.dest}）` : ''}`).join('、')}`
      : '頭旗下沒有跟著的鬼。';
    const t = this.add2(txt(this, p.x + 24, p.y + 76, `${f.stay.text}\n${held}`, 20, C.paper, { bold: false, lineSpacing: 6, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    this.band.setHour(18);
    const day = this.plan.day;
    const chosen = followOf(run).broadcast[day];
    if (this.plan.broadcast?.length && !chosen) {
      this.showBroadcast(p, t.y + t.height + 18);
      // 第四章：先聽阿睿講要剪哪一段
      const intro = this.plan.broadcastIntro;
      if (intro && !this.broadcastHeard) {
        this.broadcastHeard = true;
        this.busy = true;
        talk(this, say(intro), () => { this.busy = false; });
      }
      return;
    }
    this.banter('dusk');
    if (chosen) {
      const o = this.plan.broadcast?.find((b) => b.id === chosen);
      if (o) this.add2(txt(this, p.x + 24, t.y + t.height + 18, `跟轎台拍到：${o.label}\n明天多來：${o.brings}\n明天的代價：${o.cost}`, 20, 0xffd76a, { bold: false, lineSpacing: 6, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    }
    if (day === 3) CH().endOfDay3(run);
    this.add2(button(this, p.x + p.w / 2, p.y + p.h - 70, 260, 72, '入夜・問歸處', () => go(this, 'cut', { kind: 'dusk', title: '日落・駐駕', sub: `今晚問${CH().held.label}的鬼要去哪裡`, next: { key: 'trial', data: { night: day } } }), { size: 26, fill: 0x5a2a6a }));
  }

  /** 第三章收工頁：營旗下五格各押著誰、今晚能審幾案 */
  private campSummary(camps: { label: string }[]): string {
    const rows = camps.map((c, i) => {
      const h = run.held[i];
      if (!h) return `${c.label}：（空）`;
      const k = CH().cases[h.id];
      const tag = isLooked(run, h.id) ? `【${LOOK_TAG[natureOf(k)].s}】` : '';
      return `${c.label}：${k.dayName}${tag}`;
    });
    const per = CH().trial.perNight;
    const tail = run.held.length
      ? `今晚點將問罪${per ? `，最多審 ${per} 案` : ''}；其他的押在營旗下過夜，由太子壓一晚。\n營旗格還可以點開快判（太子親斬、押送）。`
      : '營旗下是空的。';
    return `營旗下 ${run.held.length}／${run.slots}：\n${rows.join('\n')}\n\n${tail}`;
  }

  // ---------- 因果簿、證物袋 ----------
  /** 蓋在畫面上的清單（因果簿、證物袋、鬼的故事）。內容太長可以上下拖動 */
  private overlay(title: string, build: (x: number, y: number, w: number, add: (o: Phaser.GameObjects.GameObject) => void) => void, actions?: (close: () => void) => ActionDef[]): void {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const pw = W - 32;
    const ph = H - 80;
    const x = 16;
    const y = 40;
    const top = y + 76;
    const actH = actions ? 112 : 0;
    const viewH = ph - 76 - 100 - actH;
    const scrim = this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0).setDepth(960).setInteractive();
    objs.push(scrim);
    objs.push(panel(this, x, y, pw, ph).setDepth(961));
    objs.push(txt(this, x + 30, y + 20, title, 32, C.gold, { serif: true }).setDepth(962));
    const content = this.add.container(0, 0).setDepth(962);
    objs.push(content);
    build(x, top, pw, (o) => content.add(o));
    const maskG = this.make.graphics({}, false);
    maskG.fillRect(x, top - 4, pw, viewH + 8);
    content.setMask(maskG.createGeometryMask());
    objs.push(maskG);
    // 內容高度超過可視範圍：拖動捲動
    const b = content.getBounds();
    const overflow = Math.max(0, b.bottom - (top + viewH));
    if (overflow > 0) {
      const tip = txt(this, x + pw - 24, y + 30, '上下拖動看更多', 18, C.muted, { bold: false }).setOrigin(1, 0).setDepth(962);
      objs.push(tip);
      let lastY: number | null = null;
      scrim.on('pointerdown', (p: Phaser.Input.Pointer) => { lastY = p.y; });
      scrim.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (lastY === null || !p.isDown) return;
        content.y = Phaser.Math.Clamp(content.y + (p.y - lastY), -overflow - 20, 0);
        lastY = p.y;
      });
      scrim.on('pointerup', () => { lastY = null; });
    }
    let close: Button | null = null;
    const shut = () => {
      for (const o of objs) o.destroy();
      close?.destroy();
    };
    close = button(this, x + pw / 2, y + ph - 50, 220, 60, '關閉', shut, { size: 24, fill: 0x3a3442 });
    close.setDepth(963);
    if (actions) {
      // 動作按鈕排一列，放在關閉鈕上面（不跟著內容捲動）
      const list = actions(shut);
      const ay = y + ph - 100 - actH / 2 - 4;
      const bw = (pw - 40 - 10 * (list.length - 1)) / list.length;
      const g = this.add.graphics().setDepth(962);
      g.lineStyle(1, 0x7a6a8e, 0.6);
      g.lineBetween(x + 20, ay - actH / 2, x + pw - 20, ay - actH / 2);
      objs.push(g);
      list.forEach((a, i) => {
        const bx = x + 20 + bw / 2 + i * (bw + 10);
        const b = button(this, bx, ay - 14, bw, 54, a.label, () => { if (!a.why) a.onPick(); }, { size: 20, fill: a.fill ?? 0x2f6f5a });
        b.setEnabled(!a.why).setDepth(963);
        objs.push(b);
        const blocked = !!a.why && a.why !== '已看過';
        objs.push(txt(this, bx, ay + 18, blocked ? a.why! : a.sub, 14, blocked ? 0xff9a8a : C.muted, { bold: false, align: 'center', wordWrap: { width: bw - 4, useAdvancedWrap: true } }).setOrigin(0.5, 0).setDepth(963));
      });
    }
  }

  private showLedger(): void {
    this.overlay('因果簿', (x, y0, pw, add) => {
      const color = { good: 0x9fe8c0, warn: 0xffd76a, bad: 0xff9a8a, none: C.paper };
      let y = y0;
      for (const l of CH().ledger(run)) {
        add(txt(this, x + 30, y, l.who, 24, C.paper, { serif: true }));
        const t = txt(this, x + 140, y + 3, l.state, 21, color[l.tone], { bold: false, lineSpacing: 4, wordWrap: { width: pw - 170, useAdvancedWrap: true } });
        add(t);
        y += Math.max(36, t.height) + 16;
      }
      y += 10;
      add(txt(this, x + 30, y, `${CH().held.label}的鬼`, 22, C.gold, { serif: true }));
      y += 36;
      const held = run.held.length ? run.held.map((h) => `・${CH().cases[h.id].dayName}（怨氣 ${h.grudge}／3）`).join('\n') : '（沒有）';
      const t1 = txt(this, x + 30, y, held, 21, 0x9fd0ff, { bold: false, lineSpacing: 6 });
      add(t1);
      y += t1.height + 20;
      add(txt(this, x + 30, y, `戾氣 ${run.liqi}／3：${(this.renown() ? LIQI_TEXT3 : LIQI_TEXT)[run.liqi]}`, 21, 0xff9a8a, { bold: false }));
      y += 40;
      if (this.renown()) {
        add(txt(this, x + 30, y, `威名 ${run.weiming}／${WEIMING_MAX}：${weimingText(run.weiming)}`, 21, 0xffd76a, { bold: false }));
        y += 40;
      }
      add(txt(this, x + 30, y, '最後一戰', 22, C.gold, { serif: true }));
      add(txt(this, x + 30, y + 36, CH().bossEffects(run).map((s) => `・${s}`).join('\n'), 20, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: pw - 60, useAdvancedWrap: true } }));
    });
  }

  private showEvidence(): void {
    this.overlay(`證物袋（${run.evidence.length}）`, (x, y0, pw, add) => {
      let y = y0;
      if (!run.evidence.length) add(txt(this, x + 30, y, '還沒有證據。路上的線索、問話，和信徒說的話都會收進來。', 21, C.muted, { bold: false, wordWrap: { width: pw - 60, useAdvancedWrap: true } }));
      // 依案子分組：每一隻鬼底下列出拿到的證據
      for (const k of Object.values(CH().cases)) {
        const mine = evidenceOf(k.id).filter((id) => run.evidence.includes(id));
        if (!mine.length) continue;
        add(txt(this, x + 30, y, `${k.dayName}（${this.ghostStatus(k.id)}）`, 23, 0x9fd0ff, { wordWrap: { width: pw - 60, useAdvancedWrap: true } }));
        y += 40;
        for (const id of mine) {
          const ev = CH().evidence[id];
          add(txt(this, x + 40, y, `【${ev.kind}】${ev.name}`, 21, 0x9fe8c0));
          const t = txt(this, x + 40, y + 32, ev.text, 20, C.paper, { bold: false, lineSpacing: 5, wordWrap: { width: pw - 80, useAdvancedWrap: true } });
          add(t);
          y += 32 + t.height + 16;
        }
        y += 8;
      }
    });
  }
}
