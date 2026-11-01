/**
 * 第三章「點將問罪」畫面（夜審與白天路邊點將共用；規則在 core/dianjiang.ts）。
 *
 * 鬼在堂中說狠話（標類型），玩家點將：東營章將軍（說謊・證詞）、西營柳將軍（狡辯・物證文獻）、
 * 南營霄將軍（純嗆聲），或「讓牠說」「先跳過這句」。北營夜審不上場。
 * 點對：將軍立繪從旁滑入喊一句、證據卡拍在牠臉上、蓋「打臉」章、畫面震；揭開真相時播「回憶」。
 * 點錯：牠嗆回來，太子怒氣 +1（三團火）；滿 3 太子直接斬。氣焰歸零 → 跪地求饒 → 判決。
 *
 * 整個畫面蓋在場景上（depth 500），結束時呼叫 onClose。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import type { GhostCase, Verdict, VerdictDef } from '../content/cases';
import { CH, verdictName, type General } from '../content/chapter';
import { run } from '../state';
import { button, panel, txt } from './widgets';
import { flashback } from './talk';
import { banter } from './banter';
import { portraitKey, type Expr } from '../art/portraits';
import { isLooked, slayPreview, truthReel } from '../core/renown';
import {
  ANGER_MAX, COMBO_STREAK, TAUNT_TAG, available, expected, flareOf, forcedSlay, judge, knelt, matching, muted,
  openCase, pick, startFlare, verdictWhy, type Choice, type Judged, type Outcome, type Session,
} from '../core/dianjiang';

const D = 500;
const TAG_COLOR: Record<string, number> = { 說謊: 0x6fd39a, 狡辯: 0xe8e4da, 嗆聲: 0xff7a6a };

export interface DjOpts {
  k: GhostCase;
  mode: 'night' | 'roadside';
  /** 第幾天（第二天起合擊） */
  day: number;
  /** postpone：押回去改日再審；judged：下了判決（或被太子直接斬）；round：路邊這一輪說完、收手 */
  onClose: (how: 'postpone' | 'judged' | 'round') => void;
}

/** 互嗆輪到第幾組（夜審與路邊共用） */
const banterN: Record<string, number> = {};
function chat(scene: Phaser.Scene, key: string): void {
  const lib = CH().banter?.[key];
  if (!lib?.length) return;
  const n = (banterN[key] = (banterN[key] ?? -1) + 1);
  // 放在鬼的下半身那一帶：不蓋住狠話泡泡和下方按鈕
  banter(scene, lib[n % lib.length], 548, D + 60);
}

export function openDianjiang(scene: Phaser.Scene, o: DjOpts): void {
  new DianjiangView(scene, o);
}

class DianjiangView {
  private root: Phaser.GameObjects.Container;
  private s!: Session;
  private busy = false;
  private last: { line: string; expr: Expr; color: number } = { line: '', expr: 'normal', color: 0xfff3c4 };
  private ghost?: Phaser.GameObjects.Image;
  /** 打臉動畫播放時，泡泡裡留著剛被打臉的那一句 */
  private hold?: number;

  constructor(private scene: Phaser.Scene, private o: DjOpts) {
    this.root = scene.add.container(0, 0).setDepth(D);
    const k = o.k;
    const op = openCase(run, k, o.mode, o.day);
    this.s = op.session;
    const who = this.known() ? k.name : k.dayName;
    const lines = [o.mode === 'roadside' ? `路邊點將：${who}被押到路邊，五營圍成一圈。` : CH().trial.open(who)];
    if (op.overnight) lines.push('', op.overnight);
    if (op.truth !== undefined) lines.push(`（吐出一句實話：${k.truths[op.truth].summary}）`);
    if (op.kneel) lines.push('', '牠一上來就跪下了。');
    if (op.drops?.length) lines.push(this.dropText(op.drops));
    if (this.s.over === 'mute') lines.push('', '牠怨氣太重，縮成一團，不肯開口。（押一晚冷靜下來，怨氣 -1）');
    this.last = { line: lines.join('\n'), expr: op.kneel ? 'scared' : 'normal', color: 0xfff3c4 };
    this.render();
  }

  private known(): boolean {
    return (run.cases[this.o.k.id]?.truths.length ?? 0) > 0;
  }

  private dropText(ids: string[]): string {
    return `牠身上掉出了「${ids.map((id) => CH().evidence[id].name).join('、')}」，收進證物袋。`;
  }

  private add<T extends Phaser.GameObjects.GameObject>(g: T): T {
    this.root.add(g);
    return g;
  }

  private clear(): void {
    this.root.removeAll(true);
    this.ghost = undefined;
  }

  private close(how: 'postpone' | 'judged' | 'round'): void {
    this.root.destroy();
    this.o.onClose(how);
  }

  // ---------- 堂上 ----------
  private render(): void {
    this.clear();
    const sc = this.scene;
    const k = this.o.k;
    const h = run.held.find((x) => x.id === k.id);
    const bg = this.add(sc.add.rectangle(0, 0, W, H, 0x0a0610, this.o.mode === 'night' ? 0.72 : 0.9).setOrigin(0).setInteractive());
    bg.on('pointerup', () => undefined);
    const title = `${this.o.mode === 'roadside' ? '路邊點將' : '點將問罪'}・${this.known() ? `${k.name}（${k.dayName}）` : k.dayName}`;
    this.add(txt(sc, W / 2, 26, title, 26, 0x9fd0ff, { serif: true, backgroundColor: '#140c1c', padding: { x: 12, y: 4 }, wordWrap: { width: W - 150, useAdvancedWrap: true }, align: 'center' }).setOrigin(0.5, 0));

    // 氣焰格（紅）與太子怒氣（三團火）
    const max = startFlare(run, k);
    const f = flareOf(run, k);
    this.add(txt(sc, 30, 82, '氣焰', 20, 0xffb08a));
    for (let i = 0; i < max; i++) {
      const on = i < f;
      this.add(sc.add.rectangle(84 + i * 34, 94, 28, 22, on ? 0xe0502a : 0x3a3442).setOrigin(0, 0.5).setStrokeStyle(2, on ? 0xffd08a : 0x5a5266));
    }
    this.add(txt(sc, W - 30 - ANGER_MAX * 38 - 104, 82, '太子怒氣', 20, 0xffd76a));
    for (let i = 0; i < ANGER_MAX; i++) {
      const lit = i < this.s.anger;
      const fx = W - 30 - (ANGER_MAX - i) * 38 + 16;
      const g = this.add(sc.add.graphics());
      g.fillStyle(lit ? 0xff5a1a : 0x3a3442, 1);
      g.fillTriangle(fx - 11, 104, fx + 11, 104, fx, 76);
      g.fillCircle(fx, 100, 11);
      if (lit) {
        g.fillStyle(0xffd76a, 1);
        g.fillCircle(fx, 101, 5);
      }
    }
    const st = run.cases[k.id] ?? { truths: [] };
    const bits = [`已查明 ${st.truths.length}／${k.truths.length}`];
    if (h) bits.push(`怨氣 ${h.grudge}／3`);
    if (this.s.combo) bits.push(`連擊 ${Math.min(this.s.streak, COMBO_STREAK)}／${COMBO_STREAK}（再點對一次＝合擊）`);
    if (this.s.roundLeft !== undefined) bits.push(`這一輪還剩 ${Math.max(0, this.s.roundLeft)} 句`);
    if (isLooked(run, k.id)) bits.push('北營看過相');
    this.add(txt(sc, W / 2, 120, bits.join('・'), 17, C.muted, { bold: false, align: 'center', wordWrap: { width: W - 40, useAdvancedWrap: true } }).setOrigin(0.5, 0));

    // 鬼：跪了換害怕的表情
    const kneeling = knelt(run, k);
    const expr: Expr = kneeling ? 'scared' : this.last.expr;
    const glow = this.add(sc.add.circle(W / 2, 470, 150, kneeling ? 0xffd76a : 0x7fd6ff, 0.1));
    sc.tweens.add({ targets: glow, scale: 1.08, duration: 1400, yoyo: true, repeat: -1 });
    const art = portraitKey(sc, k.id, expr);
    const img = art
      ? this.add(sc.add.image(W / 2, 640, art).setOrigin(0.5, 1).setAlpha(0.95))
      : this.add(sc.add.image(W / 2, 630, k.tex).setOrigin(0.5, 1).setTint(0x9ad0ff).setAlpha(0.8));
    img.setScale(art ? 340 / img.height : Math.min(300 / img.height, 220 / img.width));
    if (kneeling) img.setScale(img.scaleX * 0.9).setY(img.y + 20);
    this.ghost = img;
    sc.tweens.add({ targets: img, y: img.y - 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    if (kneeling) this.add(txt(sc, W / 2, 600, '跪地求饒', 30, 0xffd76a, { serif: true, stroke: '#3a0e0a', strokeThickness: 6 }).setOrigin(0.5).setAngle(-6));

    // 狠話（標類型）
    const t = this.hold !== undefined ? k.taunts?.[this.hold] : this.s.cur >= 0 && !this.s.over ? k.taunts?.[this.s.cur] : undefined;
    const by = 160;
    if (t) {
      const tag = TAUNT_TAG[t.type];
      const g = this.add(sc.add.graphics());
      g.fillStyle(0xf6efe0, 0.96);
      g.fillRoundedRect(40, by, W - 80, 116, 16);
      g.fillTriangle(W / 2 - 16, by + 114, W / 2 + 16, by + 114, W / 2, by + 140);
      this.add(txt(sc, 56, by + 10, `【${tag}】`, 20, 0x1d1726, { backgroundColor: Phaser.Display.Color.IntegerToColor(TAG_COLOR[tag]).rgba, padding: { x: 4, y: 1 } }));
      this.add(txt(sc, 56, by + 42, t.line, 22, 0x1d1726, { lineSpacing: 4, wordWrap: { width: W - 112, useAdvancedWrap: true } }));
    } else if (kneeling) {
      this.add(txt(sc, W / 2, by + 40, '牠跪在地上，不敢再嘴硬了。', 24, 0xffd76a, { serif: true }).setOrigin(0.5, 0));
    }

    // 最新的回應
    const p = { x: 16, y: 660, w: W - 32, h: H - 676 };
    this.add(panel(sc, p.x, p.y, p.w, p.h));
    const resp = this.add(txt(sc, p.x + 22, p.y + 14, this.last.line, 21, this.last.color, { bold: false, lineSpacing: 6, wordWrap: { width: p.w - 44, useAdvancedWrap: true } }));
    let y = Math.max(p.y + 96, resp.y + resp.height + 14);
    const line = this.add(sc.add.graphics());
    line.lineStyle(1, 0x7a6a8e, 0.6);
    line.lineBetween(p.x + 20, y - 6, p.x + p.w - 20, y - 6);

    const live = !!t && !this.busy;
    // 三位將軍（北營夜審不上場）
    const gens = CH().trial.generals ?? [];
    const gw = (p.w - 48) / 3;
    gens.forEach((gn, i) => {
      const bx = p.x + 16 + gw / 2 + i * (gw + 8);
      const ev = t ? matching(run, t, gn.camp) : undefined;
      const b = this.add(button(sc, bx, y + 34, gw, 62, gn.name.replace('・', '\n'), () => this.choose(gn.camp), { size: 18, fill: this.campFill(gn) }));
      b.setEnabled(live);
      let hint = gn.does;
      let color: number = C.muted;
      if (t && gn.camp !== 'south' && expected(t) === gn.camp) {
        hint = ev ? `◆ 對得上：${CH().evidence[ev].name}` : `◇ 拿不出對得上的${gn.camp === 'east' ? '證詞' : '物證、文獻'}`;
        color = ev ? 0xffd76a : 0xff9a8a;
      }
      this.add(txt(sc, bx, y + 70, hint, 15, color, { bold: false, align: 'center', wordWrap: { width: gw - 6, useAdvancedWrap: true } }).setOrigin(0.5, 0));
    });
    y += 128;
    const hw = (p.w - 40) / 2;
    const listen = this.add(button(sc, p.x + 16 + hw / 2, y + 26, hw, 52, '讓牠說（不點將）', () => this.choose('listen'), { size: 19, fill: 0x2b5aa8 }));
    listen.setEnabled(live);
    const skip = this.add(button(sc, p.x + 24 + hw * 1.5, y + 26, hw, 52, '先跳過這句', () => this.choose('skip'), { size: 19, fill: 0x3a3442 }));
    skip.setEnabled(live);
    y += 62;
    this.add(txt(sc, p.x + 22, y, '說謊→東營帶證詞・狡辯→西營帶物證文獻・嗆聲→南營；嘴硬的苦主，讓牠說。點錯太子怒氣 +1，滿 3 直接斬。', 15, C.muted, { bold: false, lineSpacing: 2, wordWrap: { width: p.w - 44, useAdvancedWrap: true } }));

    // 底下：押回去／下判決
    const backLabel = this.o.mode === 'roadside' ? '收手，回到路上' : '先押著，改日再審';
    const bb = this.add(button(sc, p.x + 24 + 140, p.y + p.h - 46, 280, 64, backLabel, () => !this.busy && this.close(this.o.mode === 'roadside' ? 'round' : 'postpone'), { size: 20, fill: 0x3a3442 }));
    bb.setEnabled(!this.busy);
    const vb = this.add(button(sc, p.x + p.w - 24 - 140, p.y + p.h - 46, 280, 64, kneeling ? '下判決（跪了）' : '下判決', () => !this.busy && this.verdicts(), { size: 22, fill: 0x8a1b14 }));
    vb.setEnabled(!this.busy);
    if (this.s.over === 'round') this.add(txt(sc, W / 2, p.y + p.h - 92, '這一輪狠話說完了（路邊只審一輪）。進度會留著，晚上接著審。', 16, 0xffd76a, { bold: false, align: 'center', wordWrap: { width: p.w - 40, useAdvancedWrap: true } }).setOrigin(0.5, 1));
    else if (this.s.over === 'done') this.add(txt(sc, W / 2, p.y + p.h - 92, '該問的都問完了，可以下判決。', 16, 0x9fe8c0, { bold: false }).setOrigin(0.5, 1));
    else if (kneeling && available(run, k).length) this.add(txt(sc, W / 2, p.y + p.h - 92, `還有 ${available(run, k).length} 句連著真相，可以繼續問，或直接判。`, 16, 0x9fe8c0, { bold: false }).setOrigin(0.5, 1));
  }

  private campFill(g: General): number {
    return g.camp === 'east' ? 0x2a6a46 : g.camp === 'west' ? 0x6a6458 : 0x8a2a20;
  }

  // ---------- 點將 ----------
  private choose(c: Choice): void {
    if (this.busy || this.s.over) return;
    const k = this.o.k;
    const out = pick(run, k, this.s, c);
    if (out.kind === 'mute') {
      this.last = { line: `${k.wrong}\n（牠縮起來了，不肯再開口。）`, expr: 'sad', color: 0xff9a8a };
      return this.render();
    }
    if (out.kind === 'skip') {
      this.last = { line: '（先跳過這句，聽牠下一句。）', expr: 'normal', color: C.muted };
      return this.render();
    }
    if (out.kind === 'hit') return this.hit(out, c);
    this.miss(out, c);
  }

  private hit(out: Outcome, c: Choice): void {
    const k = this.o.k;
    const gen = (CH().trial.generals ?? []).find((g) => g.camp === c);
    const lines = [out.line];
    if (out.heart) lines.push(out.heart);
    if (out.combo) lines.unshift('【合擊】太子與將軍一起上！氣焰 -2');
    if (out.kneel) lines.push('', '氣焰歸零：牠跪地求饒了。可以下判決。');
    if (out.drops?.length) lines.push(this.dropText(out.drops));
    const finish = () => {
      this.busy = false;
      this.hold = undefined;
      this.last = { line: lines.join('\n'), expr: out.truth !== undefined ? 'sad' : out.kneel ? 'scared' : 'surprised', color: 0xfff3c4 };
      if (out.kneel) chat(this.scene, 'kneel');
      else if (out.combo) chat(this.scene, 'combo');
      else if (c !== 'listen') chat(this.scene, 'hit');
      if (out.truth !== undefined) {
        const t = k.truths[out.truth];
        flashback(this.scene, { tex: portraitKey(this.scene, k.id, 'sad') ?? k.tex, name: k.name, reveal: t.reveal, summary: t.summary, fx: k.memory }, () => this.render());
        return;
      }
      this.render();
    };
    this.busy = true;
    this.hold = out.taunt;
    this.last = { line: gen ? `${gen.name}上前！` : '太子沒有開口，讓牠說。', expr: 'normal', color: 0xffd76a };
    this.render();
    if (c === 'listen' || !gen) {
      // 讓牠說：太子不開口，鬼慢慢把話說完
      if (this.ghost) this.scene.tweens.add({ targets: this.ghost, alpha: 0.7, duration: 300, yoyo: true });
      this.scene.time.delayedCall(500, finish);
      return;
    }
    this.strike(gen, out, finish);
  }

  /** 打臉動畫：將軍立繪從旁滑入＋喊一句、證據卡拍在臉上、蓋「打臉」章、畫面震 */
  private strike(gen: General, out: Outcome, done: () => void): void {
    const sc = this.scene;
    const objs: Phaser.GameObjects.GameObject[] = [];
    const fromLeft = gen.camp !== 'south';
    const art = portraitKey(sc, gen.portrait, out.combo ? 'fierce' : 'angry');
    const gx = fromLeft ? 150 : W - 150;
    const gimg = art ? sc.add.image(fromLeft ? -200 : W + 200, 640, art).setOrigin(0.5, 1) : sc.add.image(fromLeft ? -200 : W + 200, 640, gen.camp === 'east' ? 'w3_zhang' : gen.camp === 'west' ? 'w3_liu' : 'w3_xiao').setOrigin(0.5, 1);
    gimg.setScale(art ? 360 / gimg.height : 2).setDepth(D + 20).setFlipX(!fromLeft);
    objs.push(gimg);
    sc.tweens.add({ targets: gimg, x: gx, duration: 220, ease: 'Cubic.out' });
    const shout = gen.shout[Phaser.Math.Between(0, gen.shout.length - 1)];
    const say = txt(sc, gx, 300, shout, 24, 0xffffff, { stroke: '#120a10', strokeThickness: 6, align: 'center', wordWrap: { width: 320, useAdvancedWrap: true } }).setOrigin(0.5).setDepth(D + 22).setAlpha(0);
    objs.push(say);
    sc.tweens.add({ targets: say, alpha: 1, delay: 160, duration: 160 });
    // 合擊：太子從另一邊一起上
    if (out.combo) {
      const tz = portraitKey(sc, '太子', 'fierce');
      if (tz) {
        const ti = sc.add.image(fromLeft ? W + 200 : -200, 640, tz).setOrigin(0.5, 1).setDepth(D + 19).setFlipX(fromLeft);
        ti.setScale(360 / ti.height);
        objs.push(ti);
        sc.tweens.add({ targets: ti, x: fromLeft ? W - 150 : 150, duration: 240, ease: 'Cubic.out' });
      }
      const cb = txt(sc, W / 2, 380, '合　擊', 52, 0xffd76a, { serif: true, stroke: '#5a1a0a', strokeThickness: 8 }).setOrigin(0.5).setDepth(D + 24).setScale(2).setAlpha(0);
      objs.push(cb);
      sc.tweens.add({ targets: cb, scale: 1, alpha: 1, delay: 200, duration: 220, ease: 'Back.out' });
    }
    // 證據卡飛到牠臉上
    if (out.evidence) {
      const ev = CH().evidence[out.evidence];
      const card = sc.add.container(gx, 420).setDepth(D + 23);
      const cbg = sc.add.rectangle(0, 0, 230, 96, 0xf6efe0).setStrokeStyle(4, 0xa3261c);
      const ct = txt(sc, 0, -14, `【${ev.kind}】`, 16, 0xa3261c).setOrigin(0.5);
      const cn = txt(sc, 0, 16, ev.name, 19, 0x1d1726, { align: 'center', wordWrap: { width: 214, useAdvancedWrap: true } }).setOrigin(0.5);
      card.add([cbg, ct, cn]);
      card.setScale(0.4).setAlpha(0);
      objs.push(card);
      sc.tweens.add({ targets: card, x: W / 2, y: 430, scale: 1, alpha: 1, angle: fromLeft ? 12 : -12, delay: 280, duration: 260, ease: 'Quad.in' });
    }
    // 蓋章＋震
    sc.time.delayedCall(560, () => {
      sc.cameras.main.shake(260, 0.014);
      if (this.ghost) sc.tweens.add({ targets: this.ghost, x: this.ghost.x + (fromLeft ? 26 : -26), duration: 70, yoyo: true, repeat: 1 });
      const stamp = txt(sc, W / 2 + 90, 500, '打臉', 54, 0xd2302a, { serif: true, stroke: '#fff3c4', strokeThickness: 4 }).setOrigin(0.5).setDepth(D + 25).setAngle(-14).setScale(2.6).setAlpha(0);
      objs.push(stamp);
      sc.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: 160, ease: 'Quad.in' });
    });
    sc.time.delayedCall(1250, () => {
      sc.tweens.add({ targets: objs, alpha: 0, duration: 220, onComplete: () => { for (const g of objs) g.destroy(); done(); } });
    });
  }

  private miss(out: Outcome, c: Choice): void {
    const k = this.o.k;
    const sc = this.scene;
    const why = out.why === 'noEvidence' ? `（${c === 'east' ? '章將軍' : '柳將軍'}上前，手上卻拿不出對得上的證據。）`
      : out.why === 'scaredWronged' ? '（霄將軍一吼，牠嚇得縮成一團。怨氣 +1）'
        : out.why === 'listenEvil' ? '（太子沒開口，牠以為太子怕了，更囂張了。）'
          : '（派錯人了。）';
    const lines = [why, out.why === 'scaredWronged' ? (k.taunts?.[out.taunt]?.miss ?? '') : `「${(k.taunts?.[out.taunt]?.miss ?? k.wrong).replace(/^「|」$/g, '')}」`];
    if (knelt(run, k)) lines.push('（牠跪著發抖。太子沒有再被激。）');
    else lines.push(`太子的火氣上來了。怒氣 ${this.s.anger}／${ANGER_MAX}`);
    if (muted(run, k)) lines.push('牠怨氣衝天，縮起來不肯再開口了。');
    this.last = { line: lines.filter(Boolean).join('\n'), expr: out.why === 'scaredWronged' ? 'scared' : 'cocky', color: 0xff9a8a };
    sc.cameras.main.shake(200, 0.006);
    if (out.forced) {
      this.busy = true;
      this.render();
      chat(sc, 'forced');
      sc.time.delayedCall(700, () => this.forced());
      return;
    }
    chat(sc, 'miss');
    this.render();
  }

  /** 怒氣滿 3：太子不聽勸，直接斬 */
  private forced(): void {
    const sc = this.scene;
    const k = this.o.k;
    sc.cameras.main.flash(300, 255, 120, 60);
    sc.cameras.main.shake(400, 0.016);
    const j = forcedSlay(run, k, CH());
    this.busy = false;
    this.afterJudge(k, 'slay', j);
  }

  // ---------- 判決 ----------
  private verdicts(): void {
    this.clear();
    const sc = this.scene;
    const k = this.o.k;
    const st = run.cases[k.id] ?? { truths: [] };
    this.add(sc.add.rectangle(0, 0, W, H, 0x0a0610, 0.92).setOrigin(0).setInteractive());
    const p = { x: 16, y: 90, w: W - 32, h: H - 106 };
    this.add(panel(sc, p.x, p.y, p.w, p.h));
    this.add(txt(sc, p.x + 24, p.y + 16, `判決：${st.truths.length ? k.name : k.dayName}`, 28, C.gold, { serif: true }));
    const unsolved = k.truths.length - st.truths.length;
    const kneel = knelt(run, k);
    this.add(txt(sc, p.x + 24, p.y + 58, `${kneel ? '牠跪地求饒了。' : '牠還沒跪下（氣焰還沒歸零）。'}${unsolved ? `還有 ${unsolved} 層真相未明。` : '真相都查明了。'}`, 19, unsolved || !kneel ? 0xffd76a : 0x9fe8c0, { bold: false, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
    let y = p.y + 100;
    const boxH = 132;
    // 看過相、或真相全查明才知道牠是什麼；否則斬的說明三種都寫（D40）
    const sure = isLooked(run, k.id) || unsolved === 0;
    for (const v of k.verdicts) {
      const why = verdictWhy(run, k, v);
      const result = v.verdict === 'slay' ? `太子親斬：${slayPreview(run, k, CH(), sure)}${sure ? `\n${v.result}` : ''}` : v.result;
      const g = this.add(sc.add.graphics());
      g.fillStyle(v.verdict === 'slay' ? 0x4a1a1a : 0x2f3a4a, why ? 0.35 : 0.85);
      g.fillRoundedRect(p.x + 16, y, p.w - 32, boxH, 10);
      const name = verdictName(v.verdict);
      const fill = v.verdict === 'slay' ? 0x8a1b14 : v.verdict === 'release' ? 0x2f6f5a : 0x4a3a6a;
      const b = this.add(button(sc, p.x + 100, y + boxH / 2, 150, 60, name, () => this.judge(v), { size: name.length > 4 ? 18 : 22, fill }));
      b.setEnabled(!why);
      this.add(txt(sc, p.x + 190, y + 10, why ? `✕ ${why}` : result, 18, why ? 0xff9a8a : C.paper, { bold: false, lineSpacing: 4, wordWrap: { width: p.w - 214, useAdvancedWrap: true } }));
      y += boxH + 12;
    }
    const canAsk = !this.s.over || this.s.over === 'done';
    const back = this.add(button(sc, p.x + p.w / 2 - 150, p.y + p.h - 56, 260, 62, '◀ 再問問', () => this.render(), { size: 22, fill: 0x3a3442 }));
    back.setEnabled(canAsk || this.s.over === 'round' || this.s.over === 'mute');
    this.add(button(sc, p.x + p.w / 2 + 150, p.y + p.h - 56, 260, 62, this.o.mode === 'roadside' ? '回到路上' : '改日再審', () => this.close(this.o.mode === 'roadside' ? 'round' : 'postpone'), { size: 22, fill: 0x3a3442 }));
    this.add(txt(sc, p.x + p.w / 2 + 150, p.y + p.h - 14, '押回營旗下：太子壓一晚，明天氣焰 -1', 15, C.muted, { bold: false }).setOrigin(0.5));
  }

  private judge(v: VerdictDef): void {
    const k = this.o.k;
    if (verdictWhy(run, k, v)) return;
    if (v.verdict === 'slay') {
      this.scene.cameras.main.flash(300, 255, 255, 255);
      this.scene.cameras.main.shake(300, 0.01);
    }
    this.afterJudge(k, v.verdict, judge(run, k, v, CH()));
  }

  private afterJudge(k: GhostCase, verdict: Verdict, j: Judged): void {
    chat(this.scene, verdict === 'slay' ? (j.wronged ? 'wronged' : 'slay') : 'judge');
    const show = () => resultScreen(this.scene, this.root, k, verdict, j.lines, () => this.close('judged'));
    this.clear();
    if (!j.wronged) return show();
    // 斬錯了：斬完才看到牠的冤情
    const reel = truthReel(k);
    flashback(this.scene, { tex: portraitKey(this.scene, k.id, 'sad') ?? k.tex, name: k.name, reveal: reel.reveal, summary: reel.summary, fx: k.memory }, show);
  }
}

/** 判決後的畫面：鬼的神情＋結果＋「繼續」（夜審大廳的快判也用） */
export function resultScreen(scene: Phaser.Scene, root: Phaser.GameObjects.Container, k: GhostCase, verdict: Verdict, lines: string[], onDone: () => void): void {
  root.removeAll(true);
  root.add(scene.add.rectangle(0, 0, W, H, 0x0a0610, 0.85).setOrigin(0).setInteractive());
  const face: Partial<Record<Verdict, Expr>> = { release: 'relieved', recruit: 'relieved', escort: 'sad', slay: 'scared' };
  const art = portraitKey(scene, k.id, face[verdict] ?? 'normal');
  if (art) {
    const img = scene.add.image(W / 2, 620, art).setOrigin(0.5, 1);
    img.setScale(380 / img.height);
    root.add(img);
    if (verdict === 'release') scene.tweens.add({ targets: img, alpha: 0.3, delay: 1800, duration: 2600 });
    else if (verdict === 'slay') scene.tweens.add({ targets: img, alpha: 0, delay: 500, duration: 900 });
  }
  const p = { x: 16, y: 640, w: W - 32, h: H - 656 };
  root.add(panel(scene, p.x, p.y, p.w, p.h));
  root.add(txt(scene, p.x + 24, p.y + 18, verdictName(verdict), 32, verdict === 'slay' ? 0xff8a8a : C.gold, { serif: true }));
  root.add(txt(scene, p.x + 24, p.y + 72, lines.join('\n'), 22, C.paper, { bold: false, lineSpacing: 9, wordWrap: { width: p.w - 48, useAdvancedWrap: true } }));
  root.add(button(scene, W / 2, p.y + p.h - 60, 240, 70, '繼續', onDone, { size: 24, fill: 0x8a1b14 }));
}
