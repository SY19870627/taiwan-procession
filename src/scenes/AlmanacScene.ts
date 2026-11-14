/**
 * 黃曆頁：每天開頭翻開一頁泛黃的舊黃曆。
 * 直書、紅色日期、宜忌沖煞、一段廟誌舊聞；第二天起有「昨日」欄，寫出前一天沒照顧到的人發生了什麼。
 * 序章（標題之後）也用這一頁，最後請玩家擲筊。
 */
import Phaser from 'phaser';
import { C, H, W, hex } from '../theme';
import type { Almanac } from '../content/believers';
import { CH } from '../content/chapter';
import { run } from '../state';
import { button, fitText, fullscreenButton, go, panel, txt } from '../ui/widgets';
import { JIAO_NAME, JIAO_RULE, throwJiao, type JiaoResult } from '../ui/jiao';

const INK = 0x2a1a10;
const RED = 0xa3261c;
const PAPER = 0xeee0bd;

export class AlmanacScene extends Phaser.Scene {
  rebuildable = true;
  restartData: object = {};

  constructor() {
    super('almanac');
  }

  create(data: { day?: number; prologue?: boolean; epilogue?: boolean }): void {
    const prologue = !!data.prologue;
    // 第四章：收尾的黃曆（開爐，第 12 天）。「昨日」欄寫最後一戰被帶到下游沙洲的人
    const ep = data.epilogue ? CH().epilogue : undefined;
    const day = data.day ?? 1;
    this.restartData = { day, prologue, epilogue: !!ep };
    const a: Almanac = prologue ? CH().prologue : ep ? ep.almanac(run) : CH().days[day].almanac(run);
    const yesterday = prologue ? [] : run.yesterday;
    this.cameras.main.fadeIn(600, 10, 8, 18);

    // 桌面
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a1a14, 0x2a1a14, 0x120a08, 0x120a08, 1);
    bg.fillRect(0, 0, W, H);

    // 紙
    // 直式：一整頁直書黃曆，下方留按鈕
    const pw = W - 32;
    const ph = H - 170;
    const px = (W - pw) / 2;
    const py = 18;
    this.drawPaper(px, py, pw, ph);

    // 由右往左排：日期 → 宜忌 → 沖煞 → 舊聞 → 昨日
    let x = px + pw - 70;
    const top = py + 84;
    const colH = ph - 134;
    // 日期
    txt(this, x, top - 18, '農曆', 20, RED, { serif: true }).setOrigin(0.5, 0);
    this.vtext(x, top + 16, a.lunar, 62, RED, colH);
    x -= 110;
    // 宜
    this.seal(x, top + 6, '宜', RED);
    this.vtext(x, top + 64, a.yi, 28, INK, colH - 60);
    x -= 62;
    this.seal(x, top + 6, '忌', INK);
    this.vtext(x, top + 64, a.ji, 28, INK, colH - 60);
    x -= 62;
    if (a.chong) {
      this.vtext(x, top + 6, a.chong, 24, RED, colH);
      x -= 56;
    }
    // 分隔線
    const g = this.add.graphics();
    g.lineStyle(2, RED, 0.7);
    g.lineBetween(x + 6, top - 10, x + 6, py + ph - 40);
    x -= 36;
    // 舊聞
    // 第四章開爐那頁：劇本沒有舊聞，source 是空的就不寫【】
    if (a.source) {
      this.vtext(x, top, `【${a.source}】`, 28, RED, colH);
      x -= 50;
    }
    x = this.vtext(x, top, a.text, 30, INK, colH);
    // 第四章：「昨日」是漏掉的化解版（最多 6 句、每句七八十字），直書的紙放不下——改成蓋在黃曆上的橫書小卡（字太多可以上下拖動）
    const card4 = CH().id === 'baishadun' && yesterday.length > 0;
    // 昨日
    if (yesterday.length && !card4) {
      // 分隔線放在上一欄的左邊緣外面，不壓到字
      x -= 28;
      const g2 = this.add.graphics();
      g2.lineStyle(2, RED, 0.7);
      g2.lineBetween(x, top - 10, x, py + ph - 40);
      x -= 32;
      this.vtext(x, top, '【昨日】', 26, RED, colH);
      x -= 44;
      // 字太多就縮小，直到放得進紙的左邊界
      const text = yesterday.join('\n');
      const size = [27, 24, 22, 20, 18].find((sz) => x - (this.countCols(text, sz, colH) - 1) * sz * 1.3 - sz / 2 >= px + 30) ?? 18;
      this.vtext(x, top, text, size, 0x4a2a1a, colH);
    }

    // 下方按鈕
    if (prologue) this.prologueJiao();
    else if (ep) {
      fitText(txt(this, W / 2, H - 126, `${ep.title}・${ep.area}`, 24, C.paper, { serif: true }).setOrigin(0.5), W - 40, 18);
      button(this, W / 2, H - 62, 280, 76, ep.button, () => go(this, 'story', { id: ep.story, next: { key: 'end' } }), { size: 30, fill: 0x8a1b14 });
    } else {
      const plan = CH().days[day];
      fitText(txt(this, W / 2, H - 126, `${plan.title}・${plan.area}`, 24, C.paper, { serif: true }).setOrigin(0.5), W - 40, 18);
      // 第四章：起駕之後先播出發的過場（第二天：chufa4_2），再到白天
      const ds = CH().departStory?.[day];
      const toDay = ds ? { key: 'story', data: { id: ds, next: { key: 'day', data: { day } } } } : { key: 'day', data: { day } };
      button(this, W / 2, H - 62, 280, 76, '起　駕', () => go(this, 'cut', { kind: 'depart', title: `${plan.title}・起駕`, sub: plan.area, next: toDay }), { size: 32, fill: 0x8a1b14 });
      const unlock = CH().unlocks?.[day];
      if (card4) this.time.delayedCall(700, () => this.yesterdayCard(yesterday, unlock ? () => this.unlockCard(unlock) : undefined));
      else if (unlock) this.time.delayedCall(700, () => this.unlockCard(unlock));
    }
    if (card4 && ep) this.time.delayedCall(700, () => this.yesterdayCard(yesterday));
    fullscreenButton(this);
  }

  /**
   * 第四章的「昨日」小卡（橫書，蓋在黃曆上）：一句一段；放不下先縮字（22 → 18），還是放不下就上下拖動。
   * 關掉之後接 then（今日說明卡）。
   */
  private yesterdayCard(lines: string[], then?: () => void): void {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const pw = W - 64;
    const x = 32;
    const maxH = H - 260;
    const pad = 32;
    const head = 84;
    const foot = 110;
    const body = (size: number) => txt(this, x + pad, 0, lines.join('\n\n'), size, hex(0x4a2a1a), {
      serif: true, bold: false, lineSpacing: Math.round(size * 0.45), wordWrap: { width: pw - pad * 2, useAdvancedWrap: true },
    }).setDepth(902);
    let size = 22;
    let t = body(size);
    while (t.height > maxH - head - foot && size > 18) {
      t.destroy();
      size -= 2;
      t = body(size);
    }
    const viewH = Math.min(t.height, maxH - head - foot);
    const ph = viewH + head + foot;
    const y = (H - ph) / 2;
    const top = y + head;
    t.setY(top);
    const scrim = this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setDepth(900).setInteractive();
    objs.push(scrim);
    const g = this.add.graphics().setDepth(901);
    g.fillStyle(PAPER, 1);
    g.fillRect(x, y, pw, ph);
    g.lineStyle(3, RED, 0.85);
    g.strokeRect(x + 10, y + 10, pw - 20, ph - 20);
    objs.push(g);
    objs.push(txt(this, x + pad, y + 28, '【昨日】', 30, hex(RED), { serif: true }).setDepth(902));
    objs.push(t);
    const overflow = Math.max(0, t.height - viewH);
    if (overflow > 0) {
      const maskG = this.make.graphics({}, false);
      maskG.fillRect(x, top - 4, pw, viewH + 8);
      t.setMask(maskG.createGeometryMask());
      objs.push(maskG);
      objs.push(txt(this, x + pw - pad, y + 36, '上下拖動看更多', 18, hex(0x8a6a4a), { bold: false }).setOrigin(1, 0).setDepth(902));
      let lastY: number | null = null;
      scrim.on('pointerdown', (p: Phaser.Input.Pointer) => { lastY = p.y; });
      scrim.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (lastY === null || !p.isDown) return;
        t.y = Phaser.Math.Clamp(t.y + (p.y - lastY), top - overflow, top);
        lastY = p.y;
      });
      scrim.on('pointerup', () => { lastY = null; });
      this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
        if (t.active) t.y = Phaser.Math.Clamp(t.y - dy * 0.5, top - overflow, top);
      });
    }
    const b = button(this, W / 2, y + ph - 56, 220, 64, '知道了', () => {
      for (const o of objs) o.destroy();
      then?.();
    }, { size: 24, fill: 0x8a1b14 });
    b.setDepth(903);
    objs.push(b);
  }

  /** 黃曆之後的卡：第三章是成長解鎖（第一天各將一招、第二天合擊、第三天五營合陣）；第一、二章是今日陣頭（只說明，沒有營旗條與「成長」） */
  private unlockCard(u: { title: string; text: string }): void {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const pw = W - 80;
    const x = 40;
    const body = txt(this, x + 32, 0, u.text, 22, C.paper, { bold: false, lineSpacing: 10, wordWrap: { width: pw - 64, useAdvancedWrap: true } }).setDepth(902);
    const ph = body.height + 230;
    const y = (H - ph) / 2;
    body.setY(y + 110);
    objs.push(this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setDepth(900).setInteractive());
    objs.push(panel(this, x, y, pw, ph).setDepth(901));
    // 五色營旗條
    const camps = CH().slotLabels ?? [];
    camps.forEach((c, i) => objs.push(this.add.rectangle(x + 32 + i * 34, y + 30, 26, 14, c.color).setOrigin(0, 0.5).setStrokeStyle(1, 0xe9b949, 0.8).setDepth(902)));
    if (camps.length) objs.push(txt(this, x + 32 + camps.length * 34 + 8, y + 30, '成長', 20, 0xffd76a).setOrigin(0, 0.5).setDepth(902));
    objs.push(txt(this, x + 32, y + 52, u.title, 32, C.gold, { serif: true }).setDepth(902));
    objs.push(body);
    const b = button(this, W / 2, y + ph - 56, 220, 64, '知道了', () => { for (const o of objs) o.destroy(); }, { size: 24, fill: 0x8a1b14 });
    b.setDepth(903);
    objs.push(b);
    for (const o of objs) {
      (o as Phaser.GameObjects.Components.AlphaSingle & Phaser.GameObjects.GameObject).setAlpha?.(0);
      this.tweens.add({ targets: o, alpha: 1, duration: 300 });
    }
  }

  /** 泛黃的紙：底色、斑點、雙紅框 */
  private drawPaper(x: number, y: number, w: number, h: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRect(x + 6, y + 8, w, h);
    g.fillStyle(PAPER, 1);
    g.fillRect(x, y, w, h);
    // 歲月的斑點與邊緣泛黃
    const rnd = new Phaser.Math.RandomDataGenerator(['almanac']);
    for (let i = 0; i < 40; i++) {
      g.fillStyle(0xc9a76a, rnd.realInRange(0.05, 0.14));
      g.fillEllipse(x + rnd.between(0, w), y + rnd.between(0, h), rnd.between(30, 160), rnd.between(20, 90));
    }
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0xb08850, 0.12);
      g.fillRect(x, y + i * 3, w, 3);
      g.fillRect(x, y + h - (i + 1) * 3, w, 3);
      g.fillRect(x + i * 3, y, 3, h);
      g.fillRect(x + w - (i + 1) * 3, y, 3, h);
    }
    g.lineStyle(4, RED, 0.85);
    g.strokeRect(x + 20, y + 20, w - 40, h - 40);
    g.lineStyle(1.5, RED, 0.85);
    g.strokeRect(x + 28, y + 28, w - 56, h - 56);
  }

  /** 印章樣式的「宜」「忌」 */
  private seal(x: number, y: number, ch: string, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(x, y + 20, 22);
    txt(this, x, y + 20, ch, 28, PAPER, { serif: true }).setOrigin(0.5);
  }

  /**
   * 直書：從 xRight 那一欄開始往左排，每欄最多放得下 colH 高度的字。
   * 回傳最後一欄的 x（下一段可以接著往左排）。
   */
  private vtext(xRight: number, y: number, s: string, size: number, color: number, colH: number, lh = 1.0): number {
    // 實際量一個字的行高，避免字排出紙外
    const probe = txt(this, 0, 0, '字\n字', size, hex(color), { serif: true, lineSpacing: size * (lh - 1) });
    const lineH = probe.height / 2;
    probe.destroy();
    const per = Math.max(1, Math.floor(colH / lineH));
    const cols: string[] = [];
    for (const para of s.split('\n')) {
      const chars = Array.from(toVertical(para));
      // 標點不放在一欄的開頭（避頭點）：遇到就留在上一欄的最後
      const PUNCT = '，。、；：！？﹂﹄︶︼︙';
      let i = 0;
      while (i < chars.length) {
        let end = Math.min(chars.length, i + per);
        if (end < chars.length && PUNCT.includes(chars[end])) end++;
        cols.push(chars.slice(i, end).join('\n'));
        i = end;
      }
    }
    let x = xRight;
    const colW = size * 1.3;
    cols.forEach((c, i) => {
      x = xRight - i * colW;
      txt(this, x, y, c, size, hex(color), { serif: true, align: 'center', lineSpacing: size * (lh - 1) }).setOrigin(0.5, 0);
    });
    return x;
  }

  /** 直書會排成幾欄（不畫，只算） */
  private countCols(s: string, size: number, colH: number): number {
    const probe = txt(this, 0, 0, '字\n字', size, '#000', { serif: true });
    const lineH = probe.height / 2;
    probe.destroy();
    const per = Math.max(1, Math.floor(colH / lineH));
    return s.split('\n').reduce((n, para) => n + Math.ceil(Array.from(toVertical(para)).length / per), 0);
  }

  /** 序章：擲筊請示「明日是否照常暗訪？」，三種結果事先寫明 */
  private prologueJiao(): void {
    const j = CH().jiao;
    const pw = W - 40;
    const x = (W - pw) / 2;
    const open = () => {
      const objs: Phaser.GameObjects.GameObject[] = [];
      // 標題：第四章的「今年往北津進香，三月初五深夜起駕，可否？」30 號字一行放不下（左右超出畫面）——
      // 先縮字（最小 22），還放不下才換行，換行多出來的高度（dy）整個彈窗往下讓（放得下的章節：dy = 0，跟原本一樣）
      const title = txt(this, W / 2, 0, `擲筊・請示：${j.ask}`, 30, C.gold, { serif: true }).setOrigin(0.5).setDepth(902);
      const h0 = title.height;
      fitText(title, pw - 64, 22);
      const dy = Math.max(0, Math.ceil(title.height - h0));
      const ph = 600 + dy;
      const y = (H - ph) / 2;
      if (title.height > h0) title.setOrigin(0.5, 0).setY(y + 36 - h0 / 2);
      else title.setY(y + 36);
      objs.push(this.add.rectangle(0, 0, W, H, 0x000000, 0.4).setOrigin(0).setDepth(900).setInteractive());
      objs.push(panel(this, x, y, pw, ph).setDepth(901));
      objs.push(title);
      // 第四章（j.lines）：擲到聖筊為止；笑杯、陰杯重擲，三個聖筊日子才定
      const until = !!j.lines;
      const rules = until
        ? [`要連得 ${j.times} 個聖筊（一平一凸），日子才定。`, `笑杯（兩平）：${j.laugh.text.replace(/。$/, '')}`, `陰杯（兩凸）：${j.yin.text.replace(/。$/, '')}`]
        : ['照傳統擲三次：', `聖杯（一平一凸）：${j.holy.text.replace(/。$/, '')}`, `笑杯（兩平）：${j.laugh.text.replace(/。$/, '')}`, `陰杯（兩凸）：${j.yin.text.replace(/。$/, '')}`];
      objs.push(txt(this, x + 32, y + dy + 76, rules.join('\n'), 19, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: pw - 64, useAdvancedWrap: true } }).setDepth(902));
      const rows: Phaser.GameObjects.Text[] = [];
      const rowY = until ? 214 : 230;
      const rowH = until ? 50 : 34;
      for (let i = 0; i < j.times; i++) rows.push(txt(this, x + 32, y + dy + rowY + i * rowH, `第 ${i + 1} 次：`, until ? 18 : 20, C.muted, { bold: false, wordWrap: { width: pw - 64, useAdvancedWrap: true } }).setDepth(902));
      objs.push(...rows);
      const results: JiaoResult[] = [];
      let anim: Phaser.GameObjects.GameObject[] = [];
      const tb = button(this, W / 2, y + ph - 56, 260, 70, `擲　筊（1／${j.times}）`, () => {
        tb.setEnabled(false);
        for (const o of anim) o.destroy();
        anim = throwJiao(this, y + dy + 340 + (until ? 30 : 0), 903, (r) => {
          if (until && r !== 'holy') {
            // 不算次數：寫出這一筊，再擲一次
            const i = results.length;
            rows[i].setText(`第 ${i + 1} 次：${JIAO_NAME[r]}　${j[r].text}`).setColor(r === 'yin' ? '#ff9a8a' : '#fbf3e2');
            tb.setLabel(`再擲（${i + 1}／${j.times}）`).setEnabled(true);
            return;
          }
          results.push(r);
          const i = results.length - 1;
          if (until) rows[i].setText(`第 ${i + 1} 次：${JIAO_NAME.holy}　${j.lines![i] ?? j.holy.text}`).setColor('#e9b949');
          else rows[i].setText(`第 ${i + 1} 次：${JIAO_NAME[r]}（${JIAO_RULE[r]}）　${j[r].text}`).setColor(r === 'holy' ? '#e9b949' : r === 'yin' ? '#ff9a8a' : '#fbf3e2');
          if (results.length < j.times) {
            tb.setLabel(`再擲（${results.length + 1}／${j.times}）`).setEnabled(true);
            return;
          }
          tb.destroy();
          const lines: string[] = [];
          if (results.every((x2) => x2 === 'holy')) lines.push(j.allHoly.text);
          lines.push(j.done);
          objs.push(txt(this, W / 2, y + ph - 130, lines.join('\n'), 19, C.paper, { bold: false, align: 'center', lineSpacing: 6, wordWrap: { width: pw - 64, useAdvancedWrap: true } }).setOrigin(0.5, 0).setDepth(903));
          // 第三章：擲筊之後先播「開營」（五將登場、營旗下押著三個鬼），再翻到第一天
          const story = CH().prologueStory;
          // 第四章：放頭旗（qitou4）之後再播深夜起駕（qijia4），才翻到第一天
          const day1 = { key: 'almanac', data: { day: 1 } };
          const opening = CH().openingStory;
          const after = opening ? { key: 'story', data: { id: opening, next: day1 } } : day1;
          button(this, W / 2, y + ph + 60, 280, 72, '翻到明天', () => (story
            ? go(this, 'story', { id: story, next: after })
            : go(this, 'almanac', { day: 1 })), { size: 26, fill: 0x8a1b14 }).setDepth(903);
        });
      }, { size: 28, fill: 0x8a1b14 });
      tb.setDepth(903);
      objs.push(tb);
    };
    txt(this, W / 2, H - 126, CH().prologueLine, 22, C.paper, { serif: true, align: 'center', wordWrap: { width: W - 40, useAdvancedWrap: true } }).setOrigin(0.5);
    const ask = button(this, W / 2, H - 62, 280, 76, CH().askLabel ?? (CH().look === 'plain' ? '請示太子' : '請示王爺'), () => { ask.setEnabled(false); open(); }, { size: 30, fill: 0x8a1b14 });
  }
}


/**
 * 直書用的標點：括號、引號、刪節號要換成直排的字形，方向才會正確。
 * 例如「」→﹁﹂、【】→︻︼、（）→︵︶、……→︙
 */
const VERTICAL: Record<string, string> = {
  '「': '﹁', '」': '﹂', '『': '﹃', '』': '﹄',
  '【': '︻', '】': '︼', '（': '︵', '）': '︶', '(': '︵', ')': '︶',
  '〔': '︹', '〕': '︺', '《': '︽', '》': '︾', '〈': '︿', '〉': '﹀',
  '—': '︱', '－': '︱', '～': '≀',
};

export function toVertical(s: string): string {
  return Array.from(s.replace(/……/g, '︙').replace(/…/g, '︙')).map((c) => VERTICAL[c] ?? c).join('');
}
