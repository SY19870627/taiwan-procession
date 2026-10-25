/**
 * 隊伍整備：一次看一個成員（神轎、各陣頭），左右切換，每項屬性分開升級。
 * 從白天畫面或布陣畫面打開，蓋在原本的畫面上面；關掉後回到原畫面繼續。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { run } from '../state';
import { MAX_LV, MEMBERS, costOf, lvOf, type MemberDef, type MemberKey, type StatDef } from '../core/upgrades';
import { ResourceBar, button, floatText, panel, txt } from '../ui/widgets';

export interface UnitSceneData {
  /** 打開時先看哪一位 */
  focus?: MemberKey;
  /** 從哪個畫面打開（關掉時回去） */
  from: string;
}

export function availableMembers(): MemberDef[] {
  return MEMBERS.filter((m) => m.key !== 'kaijiang' || run.allied);
}

export class UnitScene extends Phaser.Scene {
  private list: MemberDef[] = [];
  private idx = 0;
  private from = 'day';
  private bar!: ResourceBar;
  private stage!: Phaser.GameObjects.Container;
  private detail!: Phaser.GameObjects.Container;
  private tabs: Phaser.GameObjects.Text[] = [];
  private stageW = 0;
  private sliding = false;

  constructor() {
    super('unit');
  }

  create(data: UnitSceneData): void {
    this.from = data.from ?? 'day';
    this.list = availableMembers();
    this.idx = Math.max(0, this.list.findIndex((m) => m.key === data.focus));
    this.tabs = [];
    this.sliding = false;
    this.stageW = Math.round(W * 0.42);

    // 背景：廟裡的偏殿，暗紅色調
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1018, 0x1a1018, 0x3a1e26, 0x3a1e26, 1);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(0x24161c, 1);
    bg.fillRect(0, 520, this.stageW + 20, H - 520);
    bg.lineStyle(1, 0x3a2830, 1);
    for (let x = 0; x < this.stageW + 20; x += 54) bg.lineBetween(x, 520, x - 30, H);
    // 舞台聚光
    const cx = this.stageW / 2 + 20;
    this.add.ellipse(cx, 524, this.stageW * 0.8, 70, 0xffd76a, 0.12);
    const halo = this.add.circle(cx, 360, 190, 0xffd76a, 0.06);
    this.tweens.add({ targets: halo, scale: 1.08, alpha: 0.1, duration: 1600, yoyo: true, repeat: -1 });
    // 兩側燈籠
    for (const lx of [40, this.stageW]) {
      const l = this.add.image(lx, 130, 'lantern').setScale(0.9);
      this.tweens.add({ targets: l, angle: { from: -4, to: 4 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    // 上方：返回、標題、香火
    button(this, 86, 46, 132, 56, '◀ 返回', () => this.close(), { size: 22, fill: 0x2a2236 }).setDepth(50);
    txt(this, 172, 22, '隊伍整備', 34, C.gold, { serif: true });
    txt(this, 176, 66, '左右切換成員，每項屬性分開升級', 17, C.muted, { bold: false });
    this.bar = new ResourceBar(this, W - 520, 20);

    this.stage = this.add.container(0, 0);
    this.detail = this.add.container(0, 0);

    // 左右切換
    button(this, 52, 340, 64, 120, '◀', () => this.go(-1), { size: 34, fill: 0x3a2430 }).setDepth(40);
    button(this, this.stageW - 12, 340, 64, 120, '▶', () => this.go(1), { size: 34, fill: 0x3a2430 }).setDepth(40);
    // 舞台上左右滑動也能切換
    const swipe = this.add.rectangle(cx, 340, this.stageW - 160, 360, 0xffffff, 0.001).setInteractive();
    let downX: number | null = null;
    swipe.on('pointerdown', (p: Phaser.Input.Pointer) => (downX = p.x));
    swipe.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (downX === null) return;
      const dx = p.x - downX;
      downX = null;
      if (Math.abs(dx) > 60) this.go(dx < 0 ? 1 : -1);
    });
    this.input.keyboard?.on('keydown-LEFT', () => this.go(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.go(1));
    this.input.keyboard?.on('keydown-ESC', () => this.close());

    // 下方：成員分頁（點名字直接跳過去）
    const tabW = Math.min(150, (this.stageW - 20) / this.list.length);
    this.list.forEach((m, i) => {
      const t = txt(this, 30 + tabW * i + tabW / 2, 664, m.name.replace('惠澤宮', ''), 17, C.muted)
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).setPadding(4, 10, 4, 10);
      t.on('pointerup', () => this.go(i - this.idx));
      this.tabs.push(t);
    });

    this.render(0);
    this.cameras.main.fadeIn(250, 10, 8, 18);
  }

  private go(step: number): void {
    if (this.sliding || step === 0) return;
    this.idx = (this.idx + step + this.list.length) % this.list.length;
    this.render(step > 0 ? 1 : -1);
  }

  /** 畫目前這位成員：左邊立繪、右邊細節 */
  private render(dir: number): void {
    const m = this.list[this.idx];
    const cx = this.stageW / 2 + 20;
    // 立繪：舊的滑出、新的滑入
    const old = this.stage;
    if (dir !== 0) {
      this.sliding = true;
      this.tweens.add({ targets: old, x: -dir * 300, alpha: 0, duration: 200, onComplete: () => old.destroy() });
    } else {
      old.destroy();
    }
    this.stage = this.add.container(dir * 300, 0).setAlpha(dir ? 0 : 1);
    const imgs = m.tex.map((k) => this.add.image(0, 0, k).setOrigin(0.5, 1));
    const tallest = Math.max(...imgs.map((i) => i.height));
    const widest = imgs.reduce((a, i) => a + i.width, 0);
    const scale = Math.min(320 / tallest, (this.stageW - 200) / widest, 2.4);
    let x = cx - (widest * scale) / 2;
    for (const img of imgs) {
      img.setScale(scale).setPosition(x + (img.width * scale) / 2, 520);
      x += img.width * scale;
      this.stage.add(img);
      this.tweens.add({ targets: img, y: 514, duration: 900 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    this.stage.add(txt(this, cx, 560, m.name, 36, C.gold, { serif: true }).setOrigin(0.5));
    this.stage.add(txt(this, cx, 604, m.role, 19, C.paper, { bold: false }).setOrigin(0.5));
    if (dir !== 0) {
      this.tweens.add({ targets: this.stage, x: 0, alpha: 1, duration: 220, ease: 'Cubic.out', onComplete: () => (this.sliding = false) });
    }
    this.tabs.forEach((t, i) => {
      t.setColor(i === this.idx ? '#e9b949' : '#9a8fae');
      t.setFontSize(i === this.idx ? 19 : 17);
    });
    this.renderDetail(m);
  }

  private renderDetail(m: MemberDef): void {
    this.detail.destroy();
    this.detail = this.add.container(0, 0);
    const px = this.stageW + 50;
    const pw = W - px - 30;
    const py = 104;
    const ph = H - py - 20;
    this.detail.add(panel(this, px, py, pw, ph));
    let lore = m.lore;
    if (m.key === 'paoshou') lore += `\n目前信徒 ${run.followers} 人：火力 ×${(1 + run.followers / 30).toFixed(2)}`;
    const loreT = txt(this, px + 28, py + 22, lore, 19, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: pw - 56, useAdvancedWrap: true } });
    this.detail.add(loreT);
    // 特性標籤＋目前布陣位置
    const tags = [...m.tags];
    if (m.key !== 'palanquin') {
      const side = run.sides[m.key] ?? 1;
      tags.push(`布陣：${side === 1 ? '前方／右側' : '後方／左側'}`);
    }
    let tx = px + 28;
    const ty = loreT.y + loreT.height + 22;
    for (const t of tags) {
      const chip = txt(this, tx, ty, t, 17, 0xfbe7b0, { backgroundColor: '#4a2a3a', padding: { x: 10, y: 5 } });
      this.detail.add(chip);
      tx += chip.width + 10;
    }
    const rowsTop = Math.max(ty + 50, py + 150);
    const rowH = Math.min(92, (py + ph - 20 - rowsTop) / m.stats.length);
    m.stats.forEach((s, i) => this.statRow(m, s, px, rowsTop + i * rowH, pw, rowH));
    if (m.locked) this.detail.add(txt(this, px + pw / 2, py + ph - 30, m.locked, 18, C.muted, { bold: false }).setOrigin(0.5));
  }

  private statRow(m: MemberDef, s: StatDef, px: number, y: number, pw: number, rowH: number): void {
    const lv = lvOf(run.ups, m.key, s.key);
    const max = lv >= MAX_LV;
    const g = this.add.graphics();
    g.lineStyle(1, 0x5a4a6e, 0.6);
    g.lineBetween(px + 24, y, px + pw - 24, y);
    this.detail.add(g);
    const cy = y + rowH / 2;
    this.detail.add(txt(this, px + 28, cy - 18, s.name, 26, C.gold, { serif: true }).setOrigin(0, 0.5));
    this.detail.add(txt(this, px + 28, cy + 16, s.desc, 15, C.muted, { bold: false }).setOrigin(0, 0.5));
    // 等級格子
    const pipX = px + 120;
    for (let k = 1; k <= MAX_LV; k++) {
      this.detail.add(this.add.rectangle(pipX + (k - 1) * 22, cy - 18, 16, 16, k <= lv ? C.gold : 0x3a3442).setStrokeStyle(1, 0x7a6a8e));
    }
    // 數值：現在 → 下一級
    const now = s.show(lv, m.key);
    const valX = px + pw * 0.56;
    this.detail.add(txt(this, valX, cy, now, 28, C.paper).setOrigin(1, 0.5));
    if (!max && !m.locked) this.detail.add(txt(this, valX + 12, cy, `→ ${s.show(lv + 1, m.key)}`, 22, 0x9fe8c0).setOrigin(0, 0.5));
    if (m.locked) return;
    const cost = costOf(run.ups, m.key, s.key);
    const can = !max && run.incense >= cost;
    const b = button(this, px + pw - 110, cy, 180, Math.min(60, rowH - 16), max ? '已滿級' : `升級　香火 ${cost}`, () => {
      if (!can) return;
      run.incense -= cost;
      const ups = (run.ups[m.key] ??= {});
      ups[s.key] = lv + 1;
      this.bar.refresh();
      floatText(this, valX, cy - 30, `${s.name} Lv${lv + 1}`, 0x9fe8c0, 24);
      for (const img of this.stage.list) {
        if (img instanceof Phaser.GameObjects.Image) this.tweens.add({ targets: img, scaleX: img.scaleX * 1.06, scaleY: img.scaleY * 1.06, duration: 120, yoyo: true });
      }
      this.cameras.main.flash(120, 255, 220, 140);
      this.renderDetail(m);
    }, { size: 20, fill: max ? 0x3a3442 : 0x2f6f5a });
    b.setEnabled(can);
    this.detail.add(b);
    if (!max && !can) this.detail.add(txt(this, px + pw - 110, cy + 38, '香火不足', 14, 0xff8a8a, { bold: false }).setOrigin(0.5));
  }

  private close(): void {
    this.scene.stop();
    this.scene.resume(this.from);
  }
}

