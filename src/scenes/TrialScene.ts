/**
 * 夜審：白天收容的鬼押上堂來審。每一章的神明審法不同（見 content/chapter.ts 的 trial）：
 *  - 審問供詞（青嶺王・文武判官）：供詞一句一句列出；可以追問，也可以在某一句上出示證據。
 *  - 調閱案卷（代天巡狩・中軍府）：案卷上的記載有塗改、缺頁、模糊；
 *    塗改要用物證、缺頁要用文獻、模糊要用證詞來補正。補對了就揭開一層真相，補錯了「駁回」。
 * 出示（補正）錯了，怨氣 +1；怨氣到 3，牠就不肯再開口。
 * 查到一個段落就可以下判決，也可以改日再審（天亮時怨氣 +1）。
 *  - 點將問罪（太子爺・第三章）：畫面在 ui/dianjiang.ts（與白天路邊點將共用），規則在 core/dianjiang.ts。
 *    每晚 2 案；大廳上可以快判（太子親斬、押送，不算名額）；天亮押著的鬼被太子壓一晚（不加怨氣、不掙脫）。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { DEFECT_NEEDS, type GhostCase, type VerdictDef } from '../content/cases';
import { CH, evidenceOf, ghostWord, playableDays, verdictName } from '../content/chapter';
import { playStory } from './StoryScene';
import { run } from '../state';
import { button, fullscreenButton, go, panel, txt, type Button } from '../ui/widgets';
import { flashback, splitStory, talk } from '../ui/talk';
import { SPEAKER_TEX } from '../content/story';
import { isLooked, LOOK_TAG, natureOf, slayGhost, slayPreview, truthReel } from '../core/renown';
import { beginNight, canOpen, dawnHeld, flareOf, judge as judge3, knelt, muted, useTrial } from '../core/dianjiang';
import { chat, openDianjiang, resultScreen } from '../ui/dianjiang';
import { banterStrip } from '../ui/banter';
import { TRIAL } from '../core/layout';
import { isBorrowedPortrait, portraitKey, portraitThumb, type Expr } from '../art/portraits';
import { arrive, carrying, judgeGuihu, pending, rightVerdict } from '../core/guihu';
import { APO_SCARE_LINE4, SCARE_FLAG4, shouldScareApo4 } from '../content/ch4/missed';
import { scareApo4 } from '../ui/scare4';

const WATCHES = 3;
const DEFECT_COLOR: Record<string, number> = { 塗改: 0xff9a6a, 缺頁: 0xd9b0ff, 模糊: 0x9fd0ff };

export class TrialScene extends Phaser.Scene {
  private n = 1;
  private watch = 0;
  private layer!: Phaser.GameObjects.Container;
  private messages: string[] = [];
  /** 夜審互嗆（t_*）每個場合輪到第幾組 */
  private quipN: Record<string, number> = {};
  /** 第四章問歸處：每個鬼對照錯了幾次（只用來輪流換反應句；不加怨氣） */
  private wrongN: Record<string, number> = {};
  /** 現在下方面板的上緣（夜審互嗆字幕條貼在它上面） */
  private panelTop: number = TRIAL.panelY;

  constructor() {
    super('trial');
  }

  create(data: { night: number; scare?: boolean; fun?: boolean; ask?: string; panel?: string }): void {
    this.n = data.night ?? 1;
    this.watch = 0;
    this.messages = [];
    this.quipN = {};
    const T = CH().trial;
    // 第三章每晚 2 案（其他章不限，trialsLeft 不設）
    beginNight(run, CH());
    if (T.style === 'dianjiang') this.time.delayedCall(700, () => chat(this, 'lobby'));
    // 第四章問歸處：歸處到了的鬼，開審前放下（空出頭旗下的格子）；有放下的過場就排在開審前播
    const G = CH().guihu;
    const before: string[] = [];
    const ns = CH().nightStory?.[this.n];
    if (ns) before.push(ns);
    if (T.style === 'guihu' && G) {
      for (const a of arrive(run, this.n, G)) {
        this.messages.push(`${CH().cases[a.id].name}到了${G.dests[a.dest]?.name ?? a.dest}，放下了。`);
        const rs = G.releaseStory?.[a.id];
        if (rs) before.push(rs);
      }
    }
    this.cameras.main.fadeIn(500, 10, 8, 18);
    const bg = this.add.graphics();
    const dossier = T.style === 'dossier';
    // 代天府是深藍與金；青嶺宮是紅
    const [top, bottom, pillar] = dossier ? [0x0e1a2e, 0x060a14, 0x1f3a6a] : [0x2a0e0c, 0x120808, 0x5a1410];
    bg.fillGradientStyle(top, top, bottom, bottom, 1);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(pillar, 1);
    bg.fillRect(40, 0, 26, 520);
    bg.fillRect(W - 66, 0, 26, 520);
    bg.fillStyle(dossier ? 0x0c1220 : 0x1d1010, 1);
    bg.fillRect(0, 500, W, H - 500);
    if (dossier) {
      // 案桌與卷宗
      bg.fillStyle(0x5a3a1a, 1);
      bg.fillRect(W / 2 - 170, 470, 340, 30);
      bg.fillStyle(0xe8dcbc, 1);
      for (let i = 0; i < 4; i++) bg.fillRect(W / 2 - 150 + i * 80, 452 - (i % 2) * 6, 60, 18);
      bg.lineStyle(2, 0xa3261c, 1);
      for (let i = 0; i < 4; i++) bg.strokeRect(W / 2 - 150 + i * 80, 452 - (i % 2) * 6, 60, 18);
    }
    txt(this, W / 2, 30, T.plaque, 26, C.gold, { serif: true, backgroundColor: dossier ? '#0e2244' : '#3a0e0a', padding: { x: 18, y: 6 } }).setOrigin(0.5, 0);
    T.officers.forEach((o, i) => {
      const x = i === 0 ? 120 : W - 120;
      // 有立繪圖就用圖；右邊那位翻過來面向中間
      const art = portraitKey(this, o.label);
      const img = art
        ? this.add.image(x, TRIAL.officer.bottom, art).setOrigin(0.5, 1).setFlipX(i === 1)
        : this.add.image(x, 500, o.tex).setOrigin(0.5, 1).setScale(1.2).setFlipX(i === 1);
      if (art) img.setScale(Math.min(TRIAL.officer.h / img.height, 190 / img.width)).setAlpha(0.95);
      // 換色只給借來的圖（武判官、巡捕的立繪還沒到時）；畫師的正式立繪不換色
      if (o.tint && (!art || isBorrowedPortrait(o.label, art))) img.setTint(o.tint);
      txt(this, x, 510, o.label, 16, C.muted).setOrigin(0.5, 0);
    });
    fullscreenButton(this);
    this.layer = this.add.container(0, 0);
    this.lobby();
    // 第四章：開審前的對話（車行半夜、前哨與押尾）
    const intro = T.intro?.(this.n);
    // 有鬼放下的那一夜（第二夜：草鞋丁還願）開場的互嗆換成 t_released
    const released = before.length > (ns ? 1 : 0);
    const open = () => { if (intro) talk(this, splitStory(intro, undefined, SPEAKER_TEX), () => this.quip(released ? 't_released' : 't_open')); };
    // 第四章：開審前的過場（第二夜：進火 jinhuo4 → 草鞋丁到北津放下），一段一段蓋在大廳上播，播完才開場對話
    const playNext = (): void => {
      const s = before.shift();
      if (!s) return open();
      playStory(this, s, playNext);
    };
    // 開發用（截圖）：&scare=1 跳過開審前的對話，直接播 N1-4 阿婆的 jump scare（立繪在背景載入，等一下再播）
    if (data.scare && run.chapter === 'baishadun' && T.style === 'guihu') this.time.delayedCall(900, () => this.scareApo());
    // 開發用（截圖）：&preset=missed&fun=1 跳過開審前的對話，草鞋丁直接判一個錯的歸處（判決頁接 N1-2 搞笑）
    else if (data.fun && run.chapter === 'baishadun' && T.style === 'guihu') this.time.delayedCall(900, () => this.funCaoxie());
    // 開發用（截圖，tools/shots-ch4-voice.mjs）：&ask=lobby 跳過開審前的對話，停在大廳；&ask=<案>（要先 &held=<案>）直接問那個鬼，
    // 再加 &panel=verdicts 直接開判決面板
    else if (data.ask && run.chapter === 'baishadun' && T.style === 'guihu') {
      const k = CH().cases[data.ask];
      if (k && run.held.some((h) => h.id === k.id)) this.time.delayedCall(300, () => (data.panel === 'verdicts' ? this.verdicts(k) : this.open(k)));
    } else if (before.length || intro) this.time.delayedCall(450, playNext);
  }

  // ---------- 堂上：選要審哪一個 ----------
  private reset(): Phaser.GameObjects.Container {
    this.layer.destroy();
    this.layer = this.add.container(0, 0).setDepth(10);
    return this.layer;
  }

  private add2<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.layer.add(o);
    return o;
  }

  private lobby(): void {
    if (CH().trial.style === 'dianjiang') return this.lobbyDj();
    this.reset();
    const T = CH().trial;
    const left = WATCHES - this.watch;
    this.add2(txt(this, W / 2, 90, T.lobbyTitle(this.n), 34, C.gold, { serif: true }).setOrigin(0.5, 0));
    this.add2(txt(this, W / 2, 140, `今夜還剩 ${left} 更（審一個花一更）`, 23, C.paper, { bold: false }).setOrigin(0.5, 0));
    const p = { x: 16, y: 560, w: W - 32, h: H - 576 };
    this.add2(panel(this, p.x, p.y, p.w, p.h));
    this.panelTop = p.y;
    // 第四章問歸處：已經決定帶著走的鬼不用再問，只列出來（到了歸處才放下）
    const guihu = T.style === 'guihu';
    const list = guihu ? pending(run) : run.held;
    if (guihu) {
      const carried = carrying(run).map((h) => `${CH().cases[h.id].name}（往${CH().guihu?.dests[h.dest!]?.name ?? h.dest}）`);
      const info = [T.note ?? '', T.nightNote?.[this.n] ?? '', ...this.messages.slice(-2), carried.length ? `跟在頭旗後面走：${carried.join('、')}` : ''].filter(Boolean).join('\n');
      if (info) this.add2(txt(this, W / 2, 180, info, 19, 0xffd76a, { bold: false, align: 'center', lineSpacing: 4, wordWrap: { width: W - 80, useAdvancedWrap: true } }).setOrigin(0.5, 0));
    }
    if (!list.length || left <= 0) {
      this.add2(txt(this, p.x + 24, p.y + 24, list.length ? '更鼓響了五下。今夜到此為止。' : `${CH().held.label}沒有要${guihu ? '問' : '審'}的${ghostWord()}了。`, 24, C.paper, { bold: false }));
      this.add2(button(this, W / 2, p.y + p.h - 70, 280, 76, this.n === 3 ? T.finalLabel : '天亮', () => this.finish(), { size: 28, fill: 0x8a1b14 }));
      return;
    }
    this.add2(txt(this, p.x + 24, p.y + 18, `${CH().held.label}的${ghostWord()}`, 26, C.gold, { serif: true }));
    list.forEach((h, i) => {
      const k = CH().cases[h.id];
      const st = run.cases[h.id] ?? { truths: [] };
      const y = p.y + 70 + i * 120;
      const g = this.add2(this.add.graphics());
      g.fillStyle(0x241d32, 1);
      g.fillRoundedRect(p.x + 16, y, p.w - 32, 108, 12);
      const art = portraitKey(this, k.id);
      if (art) this.add2(portraitThumb(this, art, p.x + 26, y + 8, 92)).setAlpha(0.92);
      else {
        const img = this.add2(this.add.image(p.x + 70, y + 102, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.7));
        img.setScale(Math.min(96 / img.height, 70 / img.width));
      }
      this.add2(txt(this, p.x + 124, y + 12, k.dayName, 24, 0x9fd0ff));
      this.add2(txt(this, p.x + 124, y + 52, `已查明 ${st.truths.length}／${k.truths.length}${guihu ? '' : `・怨氣 ${h.grudge}／3`}`, 20, C.muted, { bold: false }));
      this.add2(button(this, p.x + p.w - 90, y + 54, 130, 56, guihu ? '問' : '升堂', () => this.open(k), { size: 22, fill: 0x8a1b14 }));
    });
    this.add2(button(this, W / 2, p.y + p.h - 60, 300, 64, '今夜不再審，天亮', () => this.finish(), { size: 20, fill: 0x3a3442 }));
  }

  // ---------- 審一個 ----------
  private caseState(k: GhostCase) {
    return (run.cases[k.id] ??= { truths: [] });
  }

  private heldOf(k: GhostCase) {
    return run.held.find((h) => h.id === k.id)!;
  }

  private open(k: GhostCase): void {
    this.watch++;
    this.say(k, k.openLines ? `${CH().trial.open(k.dayName)}\n${k.openLines}` : CH().trial.open(k.dayName), 'normal');
    // 第四章：問哪個鬼就播那個鬼的互嗆（t_open_<id>），沒有就用 t_open
    const own = `t_open_${k.id}`;
    if (CH().banter?.[own] && this.heldOf(k).grudge < 3) this.quip(own);
    else this.quip(this.heldOf(k).grudge >= 3 ? 't_mute' : 't_open');
  }

  /** 畫審問畫面；line 是最新的一句回應 */
  private say(k: GhostCase, line: string, expr: Expr = 'normal'): void {
    this.reset();
    const T = CH().trial;
    const dossier = T.style === 'dossier';
    const st = this.caseState(k);
    const held = this.heldOf(k);
    // 鬼：有立繪圖就用圖（依表情），沒有就用程式畫的小人
    const G = TRIAL.glow;
    const glow = this.add2(this.add.circle(G.x, G.y, G.r, 0x7fd6ff, 0.1));
    this.tweens.add({ targets: glow, scale: G.pulse, duration: 1400, yoyo: true, repeat: -1 });
    const art = portraitKey(this, k.id, held.grudge >= 3 ? 'angry' : expr);
    const img = art
      ? this.add2(this.add.image(W / 2, TRIAL.ghost.bottom, art).setOrigin(0.5, 1).setAlpha(0.95))
      : this.add2(this.add.image(W / 2, dossier ? 440 : 480, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.75));
    img.setScale(art ? TRIAL.ghost.h / img.height : Math.min((dossier ? 260 : 300) / img.height, 220 / img.width));
    this.tweens.add({ targets: img, y: img.y - (art ? 6 : 10), duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const known = st.truths.length > 0;
    this.add2(txt(this, W / 2, 96, `${dossier ? '案卷：' : ''}${known ? `${k.name}（${k.dayName}）` : k.dayName}`, 26, 0x9fd0ff, { serif: true }).setOrigin(0.5, 0));
    const mute = held.grudge >= 3;
    this.add2(txt(this, W / 2, 134, `已查明 ${st.truths.length}／${k.truths.length}${T.style === 'guihu' ? '' : `　怨氣 ${held.grudge}／3`}`, 18, held.grudge >= 2 ? 0xff9a8a : C.muted, { bold: !!held.grudge }).setOrigin(0.5, 0).setFontSize(20));
    this.add2(txt(this, W / 2, 164, mute ? '怨氣衝天，牠不肯再開口：只能下判決，或押回去（天亮就會掙脫）' : T.rule, 18, mute ? 0xff9a8a : C.muted, { bold: false, align: 'center', wordWrap: { width: W - 120, useAdvancedWrap: true } }).setOrigin(0.5, 0));

    // 最新的回應
    const p = { x: 16, y: TRIAL.panelY, w: W - 32, h: H - 16 - TRIAL.panelY };
    this.add2(panel(this, p.x, p.y, p.w, p.h));
    this.panelTop = p.y;
    const resp = this.add2(txt(this, p.x + 24, p.y + 18, line, 24, 0xfff3c4, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    let y = Math.max(p.y + 110, resp.y + resp.height + 16);
    const g = this.add2(this.add.graphics());
    g.lineStyle(1, 0x7a6a8e, 0.6);
    g.lineBetween(p.x + 20, y - 8, p.x + p.w - 20, y - 8);
    this.add2(txt(this, p.x + 24, y, T.listTitle, 21, C.muted));
    if (dossier) this.add2(txt(this, p.x + p.w - 24, y + 2, '塗改→物證　缺頁→文獻　模糊→證詞', 17, C.muted, { bold: false }).setOrigin(1, 0));
    y += 36;
    // 一句一句：已戳破（補正）的換成真相
    const rowH = Math.min(128, Math.floor((p.y + p.h - 120 - y) / k.statements.length));
    k.statements.forEach((s, i) => {
      const ti = k.truths.findIndex((t) => t.stmt === i);
      const solved = ti >= 0 && st.truths.includes(ti);
      const bg = this.add2(this.add.graphics());
      bg.fillStyle(solved ? 0x2f4a3a : dossier ? 0x1e2638 : 0x2a2236, 1);
      bg.fillRoundedRect(p.x + 16, y, p.w - 32, rowH - 8, 10);
      if (solved) {
        this.add2(txt(this, p.x + 30, y + 8, `${dossier ? '補正：' : '真相：'}${k.truths[ti].summary}`, 19, 0x9fe8c0, { bold: false, lineSpacing: 3, wordWrap: { width: p.w - 60, useAdvancedWrap: true } }));
      } else {
        this.add2(txt(this, p.x + 30, y + 8, `「${s}」`, 21, C.paper, { bold: false, lineSpacing: 3, wordWrap: { width: p.w - 250, useAdvancedWrap: true } }));
        const t = ti >= 0 ? k.truths[ti] : null;
        const has = t ? t.evidence.some((id) => run.evidence.includes(id)) : false;
                if (dossier) {
          // 案卷：標出毛病和該用哪一種證據
          const d = k.dossier?.[i] ?? null;
          const hint = !d ? '・記載無誤' : `【${d}】要${DEFECT_NEEDS[d]}・${has ? '手上有' : '還沒有'}`;
          this.add2(txt(this, p.x + 30, y + rowH - 36, hint, 18, !d ? C.muted : has ? DEFECT_COLOR[d] : 0xff9a8a, { bold: !!d }));
        } else if (t) {
          // 有疑點的句子：手上有對得上的證據就標出來；沒有就寫去哪裡找
          const hint = has ? '◆ 疑點・手上有證據' : '◇ 疑點・還缺證據';
          this.add2(txt(this, p.x + 30, y + rowH - 36, hint, 18, has ? 0xffd76a : 0xff9a8a, { bold: false }));
        }
        // 第四章：先寫問的那一句，再寫他的回答
        const q = k.pressQ?.[i] ? `${k.pressQ[i]}\n` : '';
        this.add2(button(this, p.x + p.w - 176, y + rowH / 2 - 4, 92, 50, T.ask, () => this.say(k, `${q}${k.dayName}：${k.press[i]}`), { size: 21, fill: 0x3a3442 })).setEnabled(!mute);
        // 案卷上「記載無誤」的那一筆不用補正
        const fixable = !dossier || !!k.dossier?.[i];
        const pb = this.add2(button(this, p.x + p.w - 76, y + rowH / 2 - 4, 92, 50, T.show, () => this.present(k, i), { size: 21, fill: has ? 0x8a6a10 : 0x2f6f5a }));
        pb.setEnabled(has && !mute && fixable);
      }
      y += rowH;
    });
    // 證據不足可以先押著：已查明的真相會保留，明天白天再去找證據
    this.add2(button(this, p.x + 24 + 150, p.y + p.h - 56, 300, 70, '先押著，改日再審', () => this.postpone(k), { size: 20, fill: 0x3a3442 }));
    this.add2(button(this, p.x + p.w - 24 - 150, p.y + p.h - 56, 300, 70, '下判決', () => this.verdicts(k), { size: 26, fill: 0x8a1b14 }));
    if (this.n < 3) this.add2(txt(this, p.x + 24 + 150, p.y + p.h - 98, CH().overnight === 'carry' ? '真相會保留・跟著走不加怨氣' : '真相會保留・天亮時怨氣 +1', 17, C.muted, { bold: false }).setOrigin(0.5, 1));
  }

  /** 出示（補正）證據：列出這個案子相關的證據，挑一件 */
  private present(k: GhostCase, stmt: number): void {
    const T = CH().trial;
    const objs: Phaser.GameObjects.GameObject[] = [];
    const x = 16;
    const y = 60;
    const pw = W - 32;
    const ph = H - 120;
    objs.push(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setDepth(900).setInteractive());
    objs.push(panel(this, x, y, pw, ph).setDepth(901));
    objs.push(txt(this, x + 24, y + 18, `${T.show}：「${k.statements[stmt]}」`, 23, C.gold, { wordWrap: { width: pw - 48, useAdvancedWrap: true } }).setDepth(902));
    const close = () => { for (const o of objs) o.destroy(); };
    let yy = y + 130;
    const d = k.dossier?.[stmt];
    objs.push(txt(this, x + 24, y + 84, d ? `這一筆是【${d}】，要用${DEFECT_NEEDS[d]}。跟這個案子有關的證據：` : '跟這個案子有關的證據：', 19, C.muted, { bold: false, wordWrap: { width: pw - 48, useAdvancedWrap: true } }).setDepth(902));
    const mine = evidenceOf(k.id).filter((id) => run.evidence.includes(id));
    for (const id of mine) {
      const ev = CH().evidence[id];
      const b: Button = button(this, x + pw / 2, yy + 30, pw - 40, 60, `【${ev.kind}】${ev.name}`, () => { close(); this.check(k, stmt, id); }, { size: 21, fill: 0x2a3a4a });
      b.setDepth(903);
      objs.push(b);
      const t = txt(this, x + 34, yy + 68, ev.text, 19, C.paper, { bold: false, lineSpacing: 4, wordWrap: { width: pw - 68, useAdvancedWrap: true } }).setDepth(902);
      objs.push(t);
      yy += 84 + t.height;
    }
    const cb = button(this, x + pw / 2, y + ph - 50, 200, 56, '收回', close, { size: 20, fill: 0x3a3442 });
    cb.setDepth(903);
    objs.push(cb);
  }

  private check(k: GhostCase, stmt: number, evId: string): void {
    const T = CH().trial;
    const st = this.caseState(k);
    const ti = k.truths.findIndex((t) => t.stmt === stmt && t.evidence.includes(evId));
    if (ti >= 0 && !st.truths.includes(ti)) {
      st.truths.push(ti);
      const t = k.truths[ti];
      // 揭開真相：先播一段回憶，再回到堂上
      flashback(this, { tex: portraitKey(this, k.id, 'sad') ?? k.tex, name: k.name, reveal: t.reveal, summary: t.summary, fx: k.memory }, () => {
        this.say(k, `${T.record}：${t.summary}`, 'sad');
        this.quip('t_hit');
      });
      return;
    }
    // 出示錯了：鬼起疑，怨氣 +1；到 3 就不肯再開口。
    // 第四章（問歸處，第 C3 輪爽Game）：錯了不加怨氣，可以一直再試（只換一句反應）
    const held = this.heldOf(k);
    const calm = T.style === 'guihu';
    if (calm) this.wrongN[k.id] = (this.wrongN[k.id] ?? 0) + 1;
    else held.grudge = Math.min(3, held.grudge + 1);
    const n = calm ? this.wrongN[k.id] : held.grudge;
    this.cameras.main.shake(200, 0.006);
    const tail = held.grudge >= 3 ? '牠怨氣衝天，不肯再開口了。' : T.wrongTail;
    // 第四章：出示錯的反應有幾句就輪流用（第一次錯用第一句）
    const wrong = k.wrongs?.length ? k.wrongs[(n - 1) % k.wrongs.length] : k.wrong;
    this.say(k, `【${CH().evidence[evId].name}】\n${wrong}\n（${tail}）`, 'angry');
    this.quip(held.grudge >= 3 ? 't_mute' : 't_miss');
  }

  // ---------- 判決 ----------
  private why(k: GhostCase, v: VerdictDef): string {
    const st = this.caseState(k);
    const miss = (v.needs ?? []).filter((i) => !st.truths.includes(i));
    const word = CH().trial.style === 'dossier' ? '筆的記載' : '句的真相';
    if (miss.length) return `還沒查明：${miss.map((i) => `第 ${k.truths[i].stmt + 1} ${word}`).join('、')}`;
    if (v.extra && !v.extra.test(run)) return v.extra.why;
    return '';
  }

  private verdicts(k: GhostCase): void {
    this.reset();
    const st = this.caseState(k);
    const p = { x: 16, y: 90, w: W - 32, h: H - 106 };
    this.add2(panel(this, p.x, p.y, p.w, p.h));
    this.add2(txt(this, p.x + 24, p.y + 16, `判決：${st.truths.length ? k.name : k.dayName}`, 28, C.gold, { serif: true }));
    const unsolved = k.truths.length - st.truths.length;
    this.add2(txt(this, p.x + 24, p.y + 58, unsolved ? `還有 ${unsolved} 層真相未明。` : '真相都查明了。', 20, unsolved ? 0xffd76a : 0x9fe8c0, { bold: false }));
    let y = p.y + 96;
    const boxH = k.verdicts.length > 4 ? 112 : 128;
    for (const v of k.verdicts) {
      const why = this.why(k, v);
      let result = v.result;
      if (v.verdict === 'ship') result += '。不加戾氣；王船重一些（最後一戰走得慢一點）';
      if (v.verdict === 'slay' && CH().slayRule === 'renown') result += `（${slayPreview(run, k, CH())}）`;
      else if (v.verdict === 'slay' && k.innocent && unsolved) result += '（若牠有冤：戾氣再 +1，記遺憾）';
      else if (v.verdict === 'slay' && k.innocent) result += '（牠有冤：戾氣再 +1，記遺憾）';
      const g = this.add2(this.add.graphics());
      g.fillStyle(v.verdict === 'slay' ? 0x4a1a1a : v.verdict === 'ship' ? 0x1e3a4a : 0x2f3a4a, why ? 0.35 : 0.85);
      g.fillRoundedRect(p.x + 16, y, p.w - 32, boxH, 10);
      const name = verdictName(v.verdict);
      const fill = v.verdict === 'slay' ? 0x8a1b14 : v.verdict === 'release' ? 0x2f6f5a : v.verdict === 'ship' ? 0x1f5a8a : 0x4a3a6a;
      const b = this.add2(button(this, p.x + 100, y + boxH / 2, 150, 60, name, () => this.judge(k, v), { size: name.length > 4 ? 18 : 22, fill }));
      b.setEnabled(!why);
      this.add2(txt(this, p.x + 190, y + 10, why ? `✕ ${why}` : result, 19, why ? 0xff9a8a : C.paper, { bold: false, lineSpacing: 4, wordWrap: { width: p.w - 214, useAdvancedWrap: true } }));
      y += boxH + 12;
    }
    this.quip('t_verdicts');
    this.add2(button(this, p.x + p.w / 2 - 150, p.y + p.h - 56, 260, 62, '◀ 再問問', () => this.say(k, CH().trial.again), { size: 22, fill: 0x3a3442 }));
    this.add2(button(this, p.x + p.w / 2 + 150, p.y + p.h - 56, 260, 62, '改日再審', () => this.postpone(k), { size: 22, fill: 0x3a3442 }));
    this.add2(txt(this, p.x + p.w / 2 + 150, p.y + p.h - 14, CH().overnight === 'carry' ? '先跟著走，明天可以再找證據' : '怨氣 +1，明天可以再找證據', 16, C.muted, { bold: false }).setOrigin(0.5));
  }

  private postpone(k: GhostCase): void {
    this.messages.push(`${k.dayName}改日再審。`);
    this.lobby();
    const st = this.caseState(k);
    const left = k.truths.length - st.truths.length;
    if (left) {
      const miss = k.truths.filter((_, i) => !st.truths.includes(i)).map((t) => CH().evidence[t.evidence[0]].where);
      this.add2(txt(this, W / 2, 190, `${k.dayName}先押在${CH().held.label}。\n還缺的證據可以到：\n${[...new Set(miss)].join('\n')}`, 20, 0xffd76a, { bold: false, align: 'center', lineSpacing: 4, wordWrap: { width: W - 80, useAdvancedWrap: true } }).setOrigin(0.5, 0));
    }
  }

  private judge(k: GhostCase, v: VerdictDef): void {
    if (this.why(k, v)) return;
    const T = CH().trial;
    const st = this.caseState(k);
    const lines: string[] = [];
    const name = st.truths.length ? k.name : k.dayName;
    // 第四章問歸處：帶著走的留在格子裡（跨天佔格），其他的空出格子；對鬼不斬（core/guihu.ts）
    const G = CH().guihu;
    if (T.style === 'guihu' && G) {
      const sys = judgeGuihu(run, k, v, G, this.n);
      // 有寫判決之後的話（第四章劇本）就只播那段；沒寫就照按鈕小字＋系統說明
      lines.push(...(v.after ? [v.after] : [v.result, '', ...sys]));
    }
    else {
      st.verdict = v.verdict;
      run.held = run.held.filter((h) => h.id !== k.id);
    }
    // 問歸處的四種判決（tobeijin／tohome／here／leave）不在下面任何一個 case 裡
    switch (v.verdict) {
      case 'release': {
        run.liqi = Math.max(0, run.liqi - 1);
        lines.push(`${k.name}對著王爺拜了三拜，身影慢慢淡去。`, '戾氣 -1');
        const sk = CH().releaseSkill(k.id);
        if (sk) lines.push('', `亡魂得渡，王爺的神威增長了。`, `最後一戰多一個技能「${sk.name}」：${sk.desc}`);
        break;
      }
      case 'recruit':
        run.flags[`recruit_${k.id}`] = true;
        lines.push(`${k.name}跪下來：${T.recruitSay}`, '最後一戰會加入隊伍');
        break;
      case 'escort':
        lines.push(`七爺八爺押著${k.name}，往地府去了。`);
        break;
      case 'ship':
        run.flags[`ship_${k.id}`] = true;
        lines.push(T.shipLine(name), '不加戾氣・王船重了一些（最後一戰走得慢一點）');
        break;
      case 'slay': {
        this.cameras.main.flash(300, 255, 255, 255);
        this.cameras.main.shake(300, 0.01);
        if (CH().slayRule === 'renown') {
          // 第三章：看斬的是誰（core/renown.ts；與白天快判同一套）
          const res = slayGhost(run, k, CH());
          lines.push(T.slayLine(name), res.weiming ? `威名 +${res.weiming}` : res.wronged ? '' : '不加戾氣');
          if (res.lost.length) lines.push(`沒審清楚就斬：拿不到「${res.lost.map((id) => CH().evidence[id].name).join('、')}」了`);
          if (res.wronged) lines.push(T.wrongedLine, `牠是有冤的：戾氣 +${res.liqi}・記遺憾`);
          break;
        }
        run.liqi = Math.min(3, run.liqi + 1);
        lines.push(T.slayLine(name), '戾氣 +1');
        if (k.innocent) {
          run.liqi = Math.min(3, run.liqi + 1);
          run.flags[`wronged_${k.id}`] = true;
          lines.push(T.wrongedLine, '牠是有冤的：戾氣再 +1・記遺憾');
        }
        break;
      }
      case 'free':
        if (st.truths.length < k.truths.length) run.flags[`freed_${k.id}`] = true;
        lines.push(`${k.dayName}頭也不回地跑出了廟門。`);
        break;
    }
    // 判決對信徒的影響（每一章自己的）
    lines.push(...CH().verdictEffects(run, k.id, v.verdict));
    this.reset();
    // 判決後的神情
    const face: Partial<Record<VerdictDef['verdict'], Expr>> = { release: 'relieved', recruit: 'relieved', ship: 'relieved', free: 'relieved', escort: 'sad', slay: 'surprised' };
    const art = portraitKey(this, k.id, face[v.verdict] ?? 'normal');
    if (art) {
      const img = this.add2(this.add.image(W / 2, TRIAL.verdict.bottom, art).setOrigin(0.5, 1));
      img.setScale(TRIAL.verdict.h / img.height);
      if (v.verdict === 'release' || v.verdict === 'ship') this.tweens.add({ targets: img, alpha: 0.3, delay: 1800, duration: 2600 });
      else if (v.verdict === 'slay') this.tweens.add({ targets: img, alpha: 0, delay: 500, duration: 900 });
      else img.setAlpha(0.95);
    }
    const p = { x: 16, y: TRIAL.verdict.panelY, w: W - 32, h: H - 16 - TRIAL.verdict.panelY };
    this.add2(panel(this, p.x, p.y, p.w, p.h));
    this.panelTop = p.y;
    this.add2(txt(this, p.x + 24, p.y + 18, verdictName(v.verdict), 32, v.verdict === 'slay' ? 0xff8a8a : C.gold, { serif: true }));
    // 判決之後的字（第四章還會接漏掉收尾）放不下「繼續」上面就縮字（23 → 17）
    const body = (size: number) => txt(this, p.x + 24, p.y + 72, lines.join('\n'), size, C.paper, { bold: false, lineSpacing: Math.round(size * 0.43), wordWrap: { width: p.w - 48, useAdvancedWrap: true } });
    let size = 23;
    let bt = body(size);
    while (bt.y + bt.height > p.y + p.h - 115 && size > 17) {
      bt.destroy();
      size -= 2;
      bt = body(size);
    }
    this.add2(bt);
    this.add2(button(this, W / 2, p.y + p.h - 70, 240, 70, '繼續', () => this.backToLobby(k), { size: 24, fill: 0x8a1b14 }));
    // 有冤的被斬了，換一組（不是一般的斬）
    this.quip(v.verdict === 'slay' && k.innocent ? 't_wronged' : `t_${v.verdict}`, 600);
  }

  /** 判完按「繼續」回列表；第四章 N1-4：阿婆還有真相沒對出來，回列表那一下 jump scare（一局一次，只改 flags） */
  private backToLobby(k: GhostCase): void {
    this.lobby();
    if (run.chapter === 'baishadun' && CH().trial.style === 'guihu' && shouldScareApo4(run, k.id, run.cases[k.id], this.n)) this.scareApo();
  }

  /** &fun=1 開發用：草鞋丁判一個不是正解、也不缺真相就能判的歸處（找不到就停在列表） */
  private funCaoxie(): void {
    const k = CH().cases.caoxie;
    if (!k || !run.held.some((h) => h.id === 'caoxie')) return;
    const right = rightVerdict(k);
    const v = k.verdicts.find((x) => x.verdict !== right && !this.why(k, x));
    if (v) this.judge(k, v);
  }

  /** N1-4 的畫面＋台詞（&scare=1 開發用直接叫這個） */
  private scareApo(): void {
    run.flags[SCARE_FLAG4.apo] = true;
    const k = CH().cases.apo;
    const face = portraitKey(this, 'apo', 'surprised') ?? portraitKey(this, 'apo') ?? k?.tex ?? 'folk3';
    const smile = portraitKey(this, 'apo', 'smile') ?? portraitKey(this, 'apo') ?? face;
    scareApo4(this, face, smile, () => talk(this, splitStory(APO_SCARE_LINE4, undefined, SPEAKER_TEX), () => undefined));
  }

  /**
   * 第一、二章夜審互嗆（各章 banter 的 t_* 台詞）：一句一行，不擋操作。
   * 全寬字幕條，貼在當時下方面板的上緣上面（core/layout.ts 的 TRIAL.strip）：只蓋判官與鬼的腰部以下、不蓋面板；
   * 堂上左邊那位說話字就靠左（◀），右邊那位靠右（▶）。
   * 第三章沒有 t_* 台詞（點將問罪用 ui/dianjiang.ts 的 chat），這裡自己跳過。
   */
  private quip(key: string, delay = 350): void {
    // 第四章：同一個場合每夜不同的，寫成「場合@第幾夜」（例如 t_open@2）；沒有就用通用的
    const lib = CH().banter?.[`${key}@${this.n}`] ?? CH().banter?.[key];
    if (!lib?.length) return;
    const n = (this.quipN[key] = (this.quipN[key] ?? -1) + 1);
    const right = CH().trial.officers[1]?.label;
    const S = TRIAL.strip;
    this.time.delayedCall(delay, () =>
      banterStrip(this, lib[n % lib.length], { bottom: this.panelTop - S.gap, side: (who) => (who === right ? 'right' : 'left'), size: S.size, rowH: S.rowH, rows: S.rows }),
    );
  }

  // ---------- 第三章：點將問罪的大廳 ----------
  private lobbyDj(): void {
    this.reset();
    const T = CH().trial;
    const left = run.trialsLeft ?? 0;
    this.add2(txt(this, W / 2, 90, T.lobbyTitle(this.n), 34, C.gold, { serif: true }).setOrigin(0.5, 0));
    this.add2(txt(this, W / 2, 140, `今晚還能審 ${left} 案（升堂就算一案；快判不算）`, 22, left ? C.paper : 0xff9a8a, { bold: false }).setOrigin(0.5, 0));
    const p = { x: 16, y: 190, w: W - 32, h: H - 206 };
    this.add2(panel(this, p.x, p.y, p.w, p.h));
    for (const m of this.messages.slice(-2)) this.add2(txt(this, W / 2, 174, m, 17, 0xffd76a, { bold: false }).setOrigin(0.5, 1));
    if (!run.held.length) {
      this.add2(txt(this, p.x + 24, p.y + 24, `${CH().held.label}沒有要審的${ghostWord()}了。`, 24, C.paper, { bold: false }));
    } else {
      this.add2(txt(this, p.x + 24, p.y + 16, `${CH().held.label}的${ghostWord()}`, 26, C.gold, { serif: true }));
      const rowH = Math.min(176, Math.floor((p.h - 190) / Math.max(1, run.held.length)));
      run.held.forEach((h, i) => {
        const k = CH().cases[h.id];
        const st = run.cases[h.id] ?? { truths: [] };
        const y = p.y + 62 + i * rowH;
        const g = this.add2(this.add.graphics());
        g.fillStyle(0x241d32, 1);
        g.fillRoundedRect(p.x + 16, y, p.w - 32, rowH - 10, 12);
        const art = portraitKey(this, k.id);
        const th = Math.min(92, rowH - 30);
        if (art) this.add2(portraitThumb(this, art, p.x + 26, y + 8, th)).setAlpha(0.92);
        else {
          const img = this.add2(this.add.image(p.x + 70, y + th + 6, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.7));
          img.setScale(Math.min(th / img.height, 70 / img.width));
        }
        const tag = isLooked(run, h.id) ? `【${LOOK_TAG[natureOf(k)].s}】` : '';
        this.add2(txt(this, p.x + 128, y + 8, `${st.truths.length ? k.name : k.dayName}${tag}`, 21, 0x9fd0ff, { wordWrap: { width: p.w - 300, useAdvancedWrap: true } }));
        const bits = [`查明 ${st.truths.length}／${k.truths.length}`, `氣焰 ${st.dj ? flareOf(run, k) : (k.flare ?? 3)}`, `怨氣 ${h.grudge}／3`];
        if (h.tamed) bits.push('壓過一晚');
        if (knelt(run, k)) bits.push('跪了');
        this.add2(txt(this, p.x + 128, y + 40, bits.join('・'), 17, C.muted, { bold: false, wordWrap: { width: p.w - 300, useAdvancedWrap: true } }));
        const mute = muted(run, k);
        const ob = this.add2(button(this, p.x + p.w - 92, y + 34, 132, 52, '升堂', () => this.openDj(k), { size: 22, fill: 0x8a1b14 }));
        ob.setEnabled(canOpen(run) && !mute);
        if (mute) this.add2(txt(this, p.x + 128, y + 66, '縮起來不肯開口（押一晚冷靜下來，怨氣 -1）', 15, 0xff9a8a, { bold: false }));
        // 快判：太子親斬、押送（不花名額）
        const by = y + rowH - 40;
        if (rowH >= 140) {
          this.add2(button(this, p.x + 200, by, 150, 44, '太子親斬', () => this.quick(k, 'slay'), { size: 18, fill: 0x6a1a14 }));
          this.add2(button(this, p.x + 360, by, 150, 44, '押送', () => this.quick(k, 'escort'), { size: 18, fill: 0x4a3a6a }));
          this.add2(txt(this, p.x + 444, by, '快判不算名額', 14, C.muted, { bold: false }).setOrigin(0, 0.5));
        }
      });
    }
    this.add2(txt(this, W / 2, p.y + p.h - 110, run.held.length ? '沒審的押在營旗下過夜：太子壓一晚，不加怨氣、不會掙脫；明天氣焰 -1。' : '', 16, C.muted, { bold: false, align: 'center', wordWrap: { width: p.w - 40, useAdvancedWrap: true } }).setOrigin(0.5, 1));
    const label = this.n === 3 ? T.finalLabel : run.held.length && left ? '今夜不再審，天亮' : '天亮';
    this.add2(button(this, W / 2, p.y + p.h - 56, 300, 66, label, () => this.finish(), { size: 22, fill: run.held.length && left ? 0x3a3442 : 0x8a1b14 }));
  }

  private openDj(k: GhostCase): void {
    if (!canOpen(run)) return;
    useTrial(run);
    this.reset();
    openDianjiang(this, {
      k, mode: 'night', day: this.n,
      onClose: (how) => {
        if (how === 'postpone') this.messages.push(`${k.dayName}押回營旗下，改日再審。`);
        this.lobbyDj();
      },
    });
  }

  /** 大廳快判：太子親斬或押送（不花名額） */
  private quick(k: GhostCase, verdict: 'slay' | 'escort'): void {
    const v = k.verdicts.find((x) => x.verdict === verdict) ?? { verdict, result: '' };
    if (verdict === 'slay') {
      this.cameras.main.flash(300, 255, 255, 255);
      this.cameras.main.shake(300, 0.01);
    }
    const j = judge3(run, k, v, CH());
    const root = this.reset();
    const show = () => resultScreen(this, root, k, verdict, j.lines, () => this.lobbyDj());
    if (!j.wronged) return show();
    const reel = truthReel(k);
    flashback(this, { tex: portraitKey(this, k.id, 'sad') ?? k.tex, name: k.name, reveal: reel.reveal, summary: reel.summary, fx: k.memory }, show);
  }

  // ---------- 天亮 ----------
  private finish(): void {
    // 第一、二章：沒審的鬼怨氣 +1，到 3 會掙脫；第三章：太子壓一晚（core/dianjiang.ts）；第四章：跟著走，不加怨氣
    const out = dawnHeld(run, CH());
    const F = CH().finale;
    // 試玩版（第四章只做到第一天）：這一夜天亮之後接試玩結束畫面，不翻到下一天
    const last = playableDays();
    if (last !== undefined && this.n >= last) {
      run.yesterday = [...out, ...CH().dawn(run, this.n)];
      // 第四章：雞啼 → 天亮過場（tianliang4_1）→ 試玩結束畫面
      const s = CH().sliceStory;
      go(this, 'cut', { kind: 'dawn', title: '雞啼・天亮', sub: '試玩到這裡', next: s ? { key: 'story', data: { id: s, next: { key: 'sliceEnd' } } } : { key: 'sliceEnd' } });
      return;
    }
    if (this.n >= 3) {
      go(this, 'story', { id: F.story, next: { key: 'cut', data: { kind: 'boss', title: F.cutTitle, sub: F.cutSub, next: { key: 'boss' } } } });
      return;
    }
    run.yesterday = [...out, ...CH().dawn(run, this.n)];
    const dawn = { key: 'cut', data: { kind: 'dawn', title: '雞啼・天亮', sub: `第${'二三'[this.n - 1]}天`, next: { key: 'almanac', data: { day: this.n + 1 } } } };
    // 第三章：第三天之前先播「溪水倒流」（妖怪視角）
    const story = CH().dawnStory?.[this.n + 1];
    if (story) go(this, 'story', { id: story, next: dawn });
    else go(this, dawn.key, dawn.data);
  }
}
