/**
 * 夜審：青嶺宮升堂，審問白天收容的鬼。
 * 供詞一句一句列出；可以追問，也可以在某一句上出示證據。出示對了就揭開一層真相。
 * 查到一個段落就可以下判決：化解超渡、收編、押送地府、斬（或放走）。也可以改日再審（怨氣 +1）。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { CASES, EVIDENCE, VERDICT_NAME, evidenceOf, type GhostCase, type VerdictDef } from '../content/cases';
import { dawn } from '../content/days';
import { gain } from '../content/believers';
import { RELEASE_SKILL } from '../content/finale';
import { SKILLS } from '../core/boss';
import { run } from '../state';
import { button, fullscreenButton, go, panel, txt, type Button } from '../ui/widgets';

const WATCHES = 3;

export class TrialScene extends Phaser.Scene {
  private n = 1;
  private watch = 0;
  private layer!: Phaser.GameObjects.Container;
  private messages: string[] = [];

  constructor() {
    super('trial');
  }

  create(data: { night: number }): void {
    this.n = data.night ?? 1;
    this.watch = 0;
    this.messages = [];
    this.cameras.main.fadeIn(500, 10, 8, 18);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a0e0c, 0x2a0e0c, 0x120808, 0x120808, 1);
    bg.fillRect(0, 0, W, H);
    // 廟內：紅柱、匾額
    bg.fillStyle(0x5a1410, 1);
    bg.fillRect(40, 0, 26, 520);
    bg.fillRect(W - 66, 0, 26, 520);
    bg.fillStyle(0x1d1010, 1);
    bg.fillRect(0, 500, W, H - 500);
    txt(this, W / 2, 30, '明　察　秋　毫', 26, C.gold, { serif: true, backgroundColor: '#3a0e0a', padding: { x: 18, y: 6 } }).setOrigin(0.5, 0);
    // 文武判官
    this.add.image(120, 500, 'judge').setOrigin(0.5, 1).setScale(1.2);
    this.add.image(W - 120, 500, 'judge').setOrigin(0.5, 1).setScale(1.2).setFlipX(true).setTint(0x9a6a6a);
    txt(this, 120, 510, '文判官', 16, C.muted).setOrigin(0.5, 0);
    txt(this, W - 120, 510, '武判官', 16, C.muted).setOrigin(0.5, 0);
    fullscreenButton(this);
    this.layer = this.add.container(0, 0);
    this.lobby();
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
    this.reset();
    const left = WATCHES - this.watch;
    this.add2(txt(this, W / 2, 90, `第 ${this.n} 夜・升堂`, 36, C.gold, { serif: true }).setOrigin(0.5, 0));
    this.add2(txt(this, W / 2, 140, `今夜還剩 ${left} 更（審一個花一更）`, 20, C.paper, { bold: false }).setOrigin(0.5, 0));
    const p = { x: 16, y: 560, w: W - 32, h: H - 576 };
    this.add2(panel(this, p.x, p.y, p.w, p.h));
    if (!run.held.length || left <= 0) {
      this.add2(txt(this, p.x + 24, p.y + 24, run.held.length ? '更鼓響了五下。今夜到此為止。' : '令旗下沒有要審的鬼了。', 22, C.paper, { bold: false }));
      this.add2(button(this, W / 2, p.y + p.h - 70, 280, 76, this.n === 3 ? '出陣・喚回石駒' : '天亮', () => this.finish(), { size: 28, fill: 0x8a1b14 }));
      return;
    }
    this.add2(txt(this, p.x + 24, p.y + 18, '令旗下的鬼', 26, C.gold, { serif: true }));
    run.held.forEach((h, i) => {
      const k = CASES[h.id];
      const st = run.cases[h.id] ?? { truths: [] };
      const y = p.y + 70 + i * 120;
      const g = this.add2(this.add.graphics());
      g.fillStyle(0x241d32, 1);
      g.fillRoundedRect(p.x + 16, y, p.w - 32, 108, 12);
      const img = this.add2(this.add.image(p.x + 70, y + 102, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.7));
      img.setScale(Math.min(96 / img.height, 70 / img.width));
      this.add2(txt(this, p.x + 124, y + 14, k.dayName, 22, 0x9fd0ff));
      this.add2(txt(this, p.x + 124, y + 48, `已查明 ${st.truths.length}／${k.truths.length}・怨氣 ${h.grudge}／3`, 17, C.muted, { bold: false }));
      this.add2(button(this, p.x + p.w - 90, y + 54, 130, 56, '升堂', () => this.open(k), { size: 22, fill: 0x8a1b14 }));
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
    this.say(k, `${k.dayName}被押上堂來。\n文判官：「報上名來，說說你為什麼留在陽間。」`);
  }

  /** 畫審問畫面；line 是最新的一句回應 */
  private say(k: GhostCase, line: string): void {
    this.reset();
    const st = this.caseState(k);
    const held = this.heldOf(k);
    // 鬼
    const glow = this.add2(this.add.circle(W / 2, 330, 120, 0x7fd6ff, 0.1));
    this.tweens.add({ targets: glow, scale: 1.1, duration: 1400, yoyo: true, repeat: -1 });
    const img = this.add2(this.add.image(W / 2, 480, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.75));
    img.setScale(Math.min(300 / img.height, 220 / img.width));
    this.tweens.add({ targets: img, y: 470, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const known = st.truths.length > 0;
    this.add2(txt(this, W / 2, 96, known ? `${k.name}（${k.dayName}）` : k.dayName, 26, 0x9fd0ff, { serif: true }).setOrigin(0.5, 0));
    const mute = held.grudge >= 3;
    this.add2(txt(this, W / 2, 134, `已查明 ${st.truths.length}／${k.truths.length}　怨氣 ${held.grudge}／3`, 18, held.grudge >= 2 ? 0xff9a8a : C.muted, { bold: !!held.grudge }).setOrigin(0.5, 0));
    this.add2(txt(this, W / 2, 164, mute ? '怨氣衝天，牠不肯再開口：只能下判決，或押回去（天亮就會掙脫）' : '出示錯的證據，怨氣 +1；怨氣到 3，牠就不肯再開口', 15, mute ? 0xff9a8a : C.muted, { bold: false, align: 'center', wordWrap: { width: W - 120, useAdvancedWrap: true } }).setOrigin(0.5, 0));

    // 最新的回應
    const p = { x: 16, y: 530, w: W - 32, h: H - 546 };
    this.add2(panel(this, p.x, p.y, p.w, p.h));
    const resp = this.add2(txt(this, p.x + 24, p.y + 18, line, 19, 0xfff3c4, { bold: false, lineSpacing: 6, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    let y = Math.max(p.y + 110, resp.y + resp.height + 16);
    const g = this.add2(this.add.graphics());
    g.lineStyle(1, 0x7a6a8e, 0.6);
    g.lineBetween(p.x + 20, y - 8, p.x + p.w - 20, y - 8);
    this.add2(txt(this, p.x + 24, y, '供詞', 18, C.muted));
    y += 30;
    // 供詞：已戳破的一句換成真相
    k.statements.forEach((s, i) => {
      const ti = k.truths.findIndex((t) => t.stmt === i);
      const solved = ti >= 0 && st.truths.includes(ti);
      const rowH = 96;
      const bg = this.add2(this.add.graphics());
      bg.fillStyle(solved ? 0x2f4a3a : 0x2a2236, 1);
      bg.fillRoundedRect(p.x + 16, y, p.w - 32, rowH - 8, 10);
      if (solved) {
        this.add2(txt(this, p.x + 30, y + 8, `真相：${k.truths[ti].summary}`, 16, 0x9fe8c0, { bold: false, lineSpacing: 2, wordWrap: { width: p.w - 60, useAdvancedWrap: true } }));
      } else {
        this.add2(txt(this, p.x + 30, y + 8, `「${s}」`, 18, C.paper, { bold: false, wordWrap: { width: p.w - 260, useAdvancedWrap: true } }));
        // 有疑點的句子：手上有對得上的證據就標出來；沒有就寫去哪裡找
        const t = ti >= 0 ? k.truths[ti] : null;
        const has = t ? t.evidence.some((id) => run.evidence.includes(id)) : false;
        if (t) {
          const hint = has ? '◆ 疑點：手上的證據對得上' : `◇ 疑點：缺證據（${EVIDENCE[t.evidence[0]].where}）`;
          this.add2(txt(this, p.x + 30, y + rowH - 32, hint, 14, has ? 0xffd76a : 0xff9a8a, { bold: false, wordWrap: { width: p.w - 260, useAdvancedWrap: true } }));
        }
        this.add2(button(this, p.x + p.w - 176, y + rowH / 2 - 4, 92, 50, '追問', () => this.say(k, k.press[i]), { size: 18, fill: 0x3a3442 })).setEnabled(!mute);
        const pb = this.add2(button(this, p.x + p.w - 76, y + rowH / 2 - 4, 92, 50, '出示', () => this.present(k, i), { size: 18, fill: has ? 0x8a6a10 : 0x2f6f5a }));
        pb.setEnabled(has && !mute);
      }
      y += rowH;
    });
    // 證據不足可以先押著：已查明的真相會保留，明天白天再去找證據
    this.add2(button(this, p.x + 24 + 150, p.y + p.h - 56, 300, 70, '先押著，改日再審', () => this.postpone(k), { size: 20, fill: 0x3a3442 }));
    this.add2(button(this, p.x + p.w - 24 - 150, p.y + p.h - 56, 300, 70, '下判決', () => this.verdicts(k), { size: 26, fill: 0x8a1b14 }));
    if (this.n < 3) this.add2(txt(this, p.x + 24 + 150, p.y + p.h - 98, '真相會保留・天亮時怨氣 +1', 14, C.muted, { bold: false }).setOrigin(0.5, 1));
  }

  /** 出示證據：列出證物袋，挑一件 */
  private present(k: GhostCase, stmt: number): void {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const x = 16;
    const y = 60;
    const pw = W - 32;
    const ph = H - 120;
    objs.push(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setDepth(900).setInteractive());
    objs.push(panel(this, x, y, pw, ph).setDepth(901));
    objs.push(txt(this, x + 24, y + 18, `出示證據：「${k.statements[stmt]}」`, 20, C.gold, { wordWrap: { width: pw - 48, useAdvancedWrap: true } }).setDepth(902));
    const close = () => { for (const o of objs) o.destroy(); };
    let yy = y + 100;
    objs.push(txt(this, x + 24, y + 60, '跟這個案子有關的證據：', 16, C.muted, { bold: false }).setDepth(902));
    const mine = evidenceOf(k.id).filter((id) => run.evidence.includes(id));
    for (const id of mine) {
      const ev = EVIDENCE[id];
      const b: Button = button(this, x + pw / 2, yy + 30, pw - 40, 60, `【${ev.kind}】${ev.name}`, () => { close(); this.check(k, stmt, id); }, { size: 18, fill: 0x2a3a4a });
      b.setDepth(903);
      objs.push(b);
      const t = txt(this, x + 34, yy + 66, ev.text, 15, C.paper, { bold: false, lineSpacing: 3, wordWrap: { width: pw - 68, useAdvancedWrap: true } }).setDepth(902);
      objs.push(t);
      yy += 78 + t.height;
    }
    const cb = button(this, x + pw / 2, y + ph - 50, 200, 56, '收回', close, { size: 20, fill: 0x3a3442 });
    cb.setDepth(903);
    objs.push(cb);
  }

  private check(k: GhostCase, stmt: number, evId: string): void {
    const st = this.caseState(k);
    const ti = k.truths.findIndex((t) => t.stmt === stmt && t.evidence.includes(evId));
    if (ti >= 0 && !st.truths.includes(ti)) {
      st.truths.push(ti);
      this.cameras.main.flash(200, 255, 240, 200);
      this.say(k, `${k.truths[ti].reveal}\n\n文判官提筆記下：${k.truths[ti].summary}`);
      return;
    }
    // 出示錯了：鬼起疑，怨氣 +1；到 3 就不肯再開口
    const held = this.heldOf(k);
    held.grudge = Math.min(3, held.grudge + 1);
    this.cameras.main.shake(200, 0.006);
    const tail = held.grudge >= 3 ? '牠怨氣衝天，不肯再開口了。' : '對不上。鬼起了疑心，怨氣 +1。';
    this.say(k, `【${EVIDENCE[evId].name}】\n${k.wrong}\n（${tail}）`);
  }

  // ---------- 判決 ----------
  private why(k: GhostCase, v: VerdictDef): string {
    const st = this.caseState(k);
    const miss = (v.needs ?? []).filter((i) => !st.truths.includes(i));
    if (miss.length) return `還沒查明：${miss.map((i) => `第 ${k.truths[i].stmt + 1} 句的真相`).join('、')}`;
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
    this.add2(txt(this, p.x + 24, p.y + 58, unsolved ? `還有 ${unsolved} 層真相未明。` : '真相都查明了。', 17, unsolved ? 0xffd76a : 0x9fe8c0, { bold: false }));
    let y = p.y + 96;
    for (const v of k.verdicts) {
      const why = this.why(k, v);
      let result = v.result;
      if (v.verdict === 'slay' && k.innocent && unsolved) result += '（若牠有冤：戾氣再 +1，記遺憾）';
      else if (v.verdict === 'slay' && k.innocent) result += '（牠有冤：戾氣再 +1，記遺憾）';
      const g = this.add2(this.add.graphics());
      g.fillStyle(v.verdict === 'slay' ? 0x4a1a1a : 0x2f3a4a, why ? 0.35 : 0.85);
      g.fillRoundedRect(p.x + 16, y, p.w - 32, 112, 10);
      const b = this.add2(button(this, p.x + 100, y + 56, 150, 60, VERDICT_NAME[v.verdict], () => this.judge(k, v), { size: 22, fill: v.verdict === 'slay' ? 0x8a1b14 : v.verdict === 'release' ? 0x2f6f5a : 0x4a3a6a }));
      b.setEnabled(!why);
      this.add2(txt(this, p.x + 190, y + 14, why ? `✕ ${why}` : result, 17, why ? 0xff9a8a : C.paper, { bold: false, lineSpacing: 4, wordWrap: { width: p.w - 214, useAdvancedWrap: true } }));
      y += 124;
    }
    this.add2(button(this, p.x + p.w / 2 - 150, p.y + p.h - 56, 260, 62, '◀ 再問問', () => this.say(k, '文判官：「不急，再問問。」'), { size: 20, fill: 0x3a3442 }));
    this.add2(button(this, p.x + p.w / 2 + 150, p.y + p.h - 56, 260, 62, '改日再審', () => this.postpone(k), { size: 20, fill: 0x3a3442 }));
    this.add2(txt(this, p.x + p.w / 2 + 150, p.y + p.h - 16, '怨氣 +1，明天可以再找證據', 14, C.muted, { bold: false }).setOrigin(0.5));
  }

  private postpone(k: GhostCase): void {
    this.messages.push(`${k.dayName}改日再審。`);
    this.lobby();
    const st = this.caseState(k);
    const left = k.truths.length - st.truths.length;
    if (left) {
      const miss = k.truths.filter((_, i) => !st.truths.includes(i)).map((t) => EVIDENCE[t.evidence[0]].where);
      this.add2(txt(this, W / 2, 190, `${k.dayName}先押在令旗下。\n還缺的證據可以到：\n${[...new Set(miss)].join('\n')}`, 17, 0xffd76a, { bold: false, align: 'center', lineSpacing: 4, wordWrap: { width: W - 80, useAdvancedWrap: true } }).setOrigin(0.5, 0));
    }
  }

  private judge(k: GhostCase, v: VerdictDef): void {
    if (this.why(k, v)) return;
    const st = this.caseState(k);
    st.verdict = v.verdict;
    run.held = run.held.filter((h) => h.id !== k.id);
    const lines: string[] = [];
    switch (v.verdict) {
      case 'release':
        run.liqi = Math.max(0, run.liqi - 1);
        gain(run, { followers: 6, incense: 5 });
        lines.push(`${k.name}對著王爺拜了三拜，身影慢慢淡去。`, '戾氣 -1・信徒 +6・香火 +5');
        if (RELEASE_SKILL[k.id]) lines.push('', `亡魂得渡，王爺的神威增長了。`, `最後一戰多一個技能「${SKILLS[RELEASE_SKILL[k.id]].name}」：${SKILLS[RELEASE_SKILL[k.id]].desc}`);
        break;
      case 'recruit':
        run.flags[`recruit_${k.id}`] = true;
        lines.push(`${k.name}跪下來：「願隨王爺左右，贖我的罪。」`, '最後一戰會加入隊伍');
        break;
      case 'escort':
        lines.push(`七爺八爺押著${k.name}，往地府去了。`);
        break;
      case 'slay': {
        run.liqi = Math.min(3, run.liqi + 1);
        this.cameras.main.flash(300, 255, 255, 255);
        this.cameras.main.shake(300, 0.01);
        lines.push(`武判官手起刀落。${st.truths.length ? k.name : k.dayName}化成一縷青煙，散了。`, '戾氣 +1');
        if (k.innocent) {
          run.liqi = Math.min(3, run.liqi + 1);
          gain(run, { morale: -10 });
          run.flags[`wronged_${k.id}`] = true;
          lines.push('文判官放下了筆，很久沒有說話。', '牠是有冤的：戾氣再 +1・士氣 -10・記遺憾');
        }
        break;
      }
      case 'free':
        if (st.truths.length < k.truths.length) run.flags[`freed_${k.id}`] = true;
        lines.push(`${k.dayName}頭也不回地跑出了廟門。`);
        break;
    }
    // 判決對信徒的影響
    if (k.id === 'gui' && run.b.axiu !== 'regret' && run.b.axiu !== 'cured') {
      run.b.axiu = 'cured';
      lines.push('', '當晚，阿弟睡得很沉，燒也退了。');
    }
    if (k.id === 'tian' && v.verdict === 'release') {
      run.b.azhe = 'stayed';
      lines.push('', '小芸替阿添公傳了話。阿哲照著煮出那鍋黑糖水，說味道跟小時候一模一樣。');
    }
    if (k.id === 'biao' && v.verdict === 'free' && run.flags.freed_biao && run.b.xiaoyun !== 'protected' && run.b.xiaoyun !== 'invited') {
      run.b.xiaoyun = 'lost';
      lines.push('', '隔天，河邊又傳出有孩子差點落水。小芸再也不敢靠近那條河。');
    }
    this.reset();
    const p = { x: 16, y: 560, w: W - 32, h: H - 576 };
    this.add2(panel(this, p.x, p.y, p.w, p.h));
    this.add2(txt(this, p.x + 24, p.y + 18, VERDICT_NAME[v.verdict], 32, v.verdict === 'slay' ? 0xff8a8a : C.gold, { serif: true }));
    this.add2(txt(this, p.x + 24, p.y + 72, lines.join('\n'), 20, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    this.add2(button(this, W / 2, p.y + p.h - 70, 240, 70, '繼續', () => this.lobby(), { size: 24, fill: 0x8a1b14 }));
  }

  // ---------- 天亮 ----------
  private finish(): void {
    // 沒審的鬼怨氣 +1；到 3 會掙脫
    const out: string[] = [];
    for (const h of [...run.held]) {
      h.grudge++;
      if (h.grudge >= 3) {
        run.held = run.held.filter((x) => x !== h);
        (run.cases[h.id] ??= { truths: [] }).escaped = true;
        out.push(`令旗下的${CASES[h.id].dayName}怨氣太重，掙脫逃走了。`);
      }
    }
    if (this.n >= 3) {
      go(this, 'story', { id: 'dusk3', next: { key: 'boss' } });
      return;
    }
    run.yesterday = [...out, ...dawn(run, this.n)];
    go(this, 'almanac', { day: this.n + 1 });
  }
}
