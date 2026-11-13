/**
 * 結局：信徒錄。黃曆紙樣式，一人一欄寫出這三天之後每個人的結局。
 */
import Phaser from 'phaser';
import { portraitKey, portraitThumb } from '../art/portraits';
import { C, H, W } from '../theme';
import { run } from '../state';
import { CH } from '../content/chapter';
import { button, go, txt, type Button } from '../ui/widgets';
import { paginate } from '../core/pages';

const INK = 0x2a1a10;
const RED = 0xa3261c;

export class EndScene extends Phaser.Scene {
  rebuildable = true;

  constructor() {
    super('end');
  }

  create(): void {
    this.cameras.main.fadeIn(800, 10, 8, 18);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a1a14, 0x2a1a14, 0x120a08, 0x120a08, 1);
    bg.fillRect(0, 0, W, H);
    // 直式：一整頁信徒錄，一人兩行（名字＋結局）
    const pw = W - 32;
    const ph = H - 190;
    const px = (W - pw) / 2;
    const py = 16;
    const g = this.add.graphics();
    g.fillStyle(0xeee0bd, 1);
    g.fillRect(px, py, pw, ph);
    const rnd = new Phaser.Math.RandomDataGenerator(['end']);
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0xc9a76a, rnd.realInRange(0.05, 0.12));
      g.fillEllipse(px + rnd.between(0, pw), py + rnd.between(0, ph), rnd.between(40, 180), rnd.between(20, 90));
    }
    g.lineStyle(4, RED, 0.85);
    g.strokeRect(px + 18, py + 18, pw - 36, ph - 36);

    txt(this, W / 2, py + 64, '信　徒　錄', 48, RED, { serif: true }).setOrigin(0.5);
    txt(this, W / 2, py + 114, CH().endSub, 20, INK, { serif: true }).setOrigin(0.5);

    const list = CH().epitaphs(run);
    const ghosts = CH().ghostEpitaphs(run);
    const good = list.filter((e) => e.good).length;
    const eased = ghosts.filter((e) => e.good).length;
    // 隨船（第二章）；第四章的「路過」標籤不算（第 C3 輪：不圓滿也不寫遺憾）
    const shipped = ghosts.filter((e) => e.tag === '隨船').length;
    // 一人兩行：名字＋結局（字小一點，十個人才放得下）。每一列先畫在自己的容器裡量高度，
    // 一頁放不下就分頁（第三章 15 列；第一、二章 10 列一頁放得下，畫面不變）
    const items: { c: Phaser.GameObjects.Container; h: number; head: boolean }[] = [];
    const row = (who: string, good: boolean, text: string, tag?: string, ghost = false) => {
      const c = this.add.container(0, 0);
      // 有立繪圖的放小頭像在名字前面
      const art = portraitKey(this, who.replace(/[（(【].*$/, ''), good ? (ghost ? 'relieved' : 'smile') : 'sad');
      let nx = px + 44;
      if (art) {
        c.add(portraitThumb(this, art, px + 44, -4, 32));
        nx += 40;
      }
      c.add(txt(this, nx, 0, who, 22, INK, { serif: true }));
      c.add(txt(this, px + pw - 44, 2, tag ?? (good ? '圓滿' : '遺憾'), 16, 0xfbf3e2, { backgroundColor: tag ? '#2b5a8a' : good ? '#2f6f5a' : '#7a3a2a', padding: { x: 6, y: 2 } }).setOrigin(1, 0));
      const t = txt(this, px + 44, 32, text, 18, INK, { serif: true, lineSpacing: 4, wordWrap: { width: pw - 88, useAdvancedWrap: true } });
      c.add(t);
      items.push({ c, h: t.y + t.height + 16, head: false });
    };
    const head = (s: string) => {
      const c = this.add.container(0, 0, [txt(this, px + 44, 0, s, 18, RED, { serif: true })]);
      items.push({ c, h: 30, head: true });
    };
    head('【信徒】');
    // 第四章（第 C3 輪）信徒沒辦成的標「路過」（tag）；第一～三章信徒沒有 tag，畫面不變
    for (const e of list) row(e.who, e.good, e.text, e.tag);
    head('【鬼】');
    for (const e of ghosts) row(e.who, e.good, e.text, e.tag, true);
    const sj = CH().finalEpitaph(run);
    row(sj.who, sj.good, sj.text, sj.tag, true);
    const top = py + 150;
    const pages = paginate(items.map((i) => i.h), py + ph - 96 - top, items.map((i) => i.head));
    for (const pg of pages) {
      let y = top;
      for (const i of pg) {
        items[i].c.setY(y);
        y += items[i].h;
      }
    }
    let page = 0;
    const pageTxt = txt(this, W / 2, py + ph - 92, '', 16, INK, { bold: false }).setOrigin(0.5);
    const show = (n: number) => {
      page = Phaser.Math.Clamp(n, 0, pages.length - 1);
      pages.forEach((pg, k) => pg.forEach((i) => items[i].c.setVisible(k === page)));
      pageTxt.setText(pages.length > 1 ? `第 ${page + 1}／${pages.length} 頁` : '');
      prev?.setEnabled(page > 0);
      next?.setEnabled(page < pages.length - 1);
    };
    let prev: Button | undefined;
    let next: Button | undefined;
    if (pages.length > 1) {
      prev = button(this, px + 120, py + ph - 92, 150, 44, '◀ 上一頁', () => show(page - 1), { size: 18, fill: 0x6a4a2a });
      next = button(this, px + pw - 120, py + ph - 92, 150, 44, '下一頁 ▶', () => show(page + 1), { size: 18, fill: 0x6a4a2a });
    }
    show(0);
    txt(this, W / 2, py + ph - 56, `照顧了 ${good}／${list.length} 位信徒・化解了 ${eased}／${ghosts.length} 個鬼${shipped ? `・${shipped} 個隨船走了` : ''}`, 24, RED, { serif: true }).setOrigin(0.5);

    // 第三章另外寫威名
    const weiming = CH().slayRule === 'renown' ? `・威名 ${run.weiming}` : '';
    txt(this, W / 2, H - 150, `戾氣 ${run.liqi}${weiming}・重整再戰 ${run.retries} 次`, 17, C.muted, { bold: false }).setOrigin(0.5);
    button(this, W / 2, H - 70, 300, 80, '再走一次', () => go(this, 'title'), { size: 30, fill: 0x8a1b14 });
  }
}
