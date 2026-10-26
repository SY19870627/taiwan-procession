/**
 * 黃曆頁：每天開頭翻開一頁泛黃的舊黃曆。
 * 直書、紅色日期、宜忌沖煞、一段廟誌舊聞；第二天起有「昨日」欄，寫出前一天沒照顧到的人發生了什麼。
 * 序章（標題之後）也用這一頁，最後請玩家擲筊。
 */
import Phaser from 'phaser';
import { C, H, W, hex } from '../theme';
import { PROLOGUE, PROLOGUE_JIAO, type Almanac } from '../content/believers';
import { DAY_PLANS } from '../content/days';
import { sfx } from '../audio/sfx';
import { run } from '../state';
import { button, fullscreenButton, go, panel, txt } from '../ui/widgets';
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

  create(data: { day?: number; prologue?: boolean }): void {
    const prologue = !!data.prologue;
    const day = data.day ?? 1;
    this.restartData = { day, prologue };
    const a: Almanac = prologue ? PROLOGUE : DAY_PLANS[day].almanac(run);
    const yesterday = prologue ? [] : run.yesterday;
    this.cameras.main.fadeIn(600, 10, 8, 18);
    sfx.page();

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
    this.vtext(x, top, `【${a.source}】`, 28, RED, colH);
    x -= 50;
    x = this.vtext(x, top, a.text, 30, INK, colH);
    // 昨日
    if (yesterday.length) {
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
    else {
      const plan = DAY_PLANS[day];
      txt(this, W / 2, H - 126, `${plan.title}・${plan.area}`, 24, C.paper, { serif: true }).setOrigin(0.5);
      button(this, W / 2, H - 62, 280, 76, '起　駕', () => go(this, 'cut', { kind: 'depart', title: `${plan.title}・起駕`, sub: plan.area, next: { key: 'day', data: { day } } }), { size: 32, fill: 0x8a1b14 });
    }
    fullscreenButton(this);
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
    const j = PROLOGUE_JIAO;
    const pw = W - 40;
    const ph = 600;
    const x = (W - pw) / 2;
    const y = (H - ph) / 2;
    const open = () => {
      const objs: Phaser.GameObjects.GameObject[] = [];
      objs.push(this.add.rectangle(0, 0, W, H, 0x000000, 0.4).setOrigin(0).setDepth(900).setInteractive());
      objs.push(panel(this, x, y, pw, ph).setDepth(901));
      objs.push(txt(this, W / 2, y + 36, `擲筊・請示：${j.ask}`, 30, C.gold, { serif: true }).setOrigin(0.5).setDepth(902));
      const rules = ['照傳統擲三次：', '聖杯（一平一凸）：王爺應允', '笑杯（兩平）：王爺在笑', '陰杯（兩凸）：王爺要大家小心'];
      objs.push(txt(this, x + 32, y + 76, rules.join('\n'), 19, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: pw - 64, useAdvancedWrap: true } }).setDepth(902));
      const rows: Phaser.GameObjects.Text[] = [];
      for (let i = 0; i < j.times; i++) rows.push(txt(this, x + 32, y + 230 + i * 34, `第 ${i + 1} 次：`, 20, C.muted, { bold: false }).setDepth(902));
      objs.push(...rows);
      const results: JiaoResult[] = [];
      let anim: Phaser.GameObjects.GameObject[] = [];
      const tb = button(this, W / 2, y + ph - 56, 260, 70, `擲　筊（1／${j.times}）`, () => {
        tb.setEnabled(false);
        for (const o of anim) o.destroy();
        anim = throwJiao(this, y + 340, 903, (r) => {
          results.push(r);
          const i = results.length - 1;
          rows[i].setText(`第 ${i + 1} 次：${JIAO_NAME[r]}（${JIAO_RULE[r]}）　${j[r].text}`).setColor(r === 'holy' ? '#e9b949' : r === 'yin' ? '#ff9a8a' : '#fbf3e2');
          if (results.length < j.times) {
            tb.setLabel(`再擲（${results.length + 1}／${j.times}）`).setEnabled(true);
            return;
          }
          tb.destroy();
          const lines: string[] = [];
          if (results.every((x2) => x2 === 'holy')) lines.push(j.allHoly.text);
          lines.push(j.done);
          objs.push(txt(this, W / 2, y + ph - 130, lines.join('\n'), 19, C.paper, { bold: false, align: 'center', lineSpacing: 6, wordWrap: { width: pw - 64, useAdvancedWrap: true } }).setOrigin(0.5, 0).setDepth(903));
          button(this, W / 2, y + ph + 60, 280, 72, '翻到明天', () => go(this, 'almanac', { day: 1 }), { size: 26, fill: 0x8a1b14 }).setDepth(903);
        });
      }, { size: 28, fill: 0x8a1b14 });
      tb.setDepth(903);
      objs.push(tb);
    };
    txt(this, W / 2, H - 126, '阿土伯：「香斷了三次……王爺有話要說。」', 22, C.paper, { serif: true }).setOrigin(0.5);
    const ask = button(this, W / 2, H - 62, 280, 76, '請示王爺', () => { ask.setEnabled(false); open(); }, { size: 30, fill: 0x8a1b14 });
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
