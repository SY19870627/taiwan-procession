import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { button, fullscreenButton, go, txt } from '../ui/widgets';

export class TitleScene extends Phaser.Scene {
  rebuildable = true;

  constructor() {
    super('title');
  }

  create(): void {
    this.cameras.main.fadeIn(500, 10, 8, 18);
    // 直式構圖：上方標題、中間廟與神轎、下方起駕
    const G = Math.round(H * 0.64);
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0b0a1c, 0x0b0a1c, 0x2a1d44, 0x2a1d44, 1);
    sky.fillRect(0, 0, W, H);
    // 月亮
    this.add.circle(W * 0.8, 420, 46, 0xfff3c4, 0.9);
    this.add.circle(W * 0.8, 420, 80, 0xfff3c4, 0.08);
    this.add.tileSprite(0, G - 70, W, 260, 'mtnFarN').setOrigin(0, 1);
    // 廟
    this.add.image(W / 2, G + 10, 'temple_qingling').setOrigin(0.5, 1).setScale(0.72).setTint(0x8a7090);
    const ground = this.add.graphics();
    ground.fillStyle(0x1a1622, 1);
    ground.fillRect(0, G + 8, W, H - G);
    ground.lineStyle(1, 0x2a2434, 1);
    for (let x = -200; x < W + 200; x += 60) ground.lineBetween(x, G + 8, x + (x - W / 2) * 0.5, H);
    // 燈籠串
    for (let i = 0; i < 7; i++) {
      const lx = 50 + i * 103;
      const l = this.add.image(lx, 330 + Math.sin(i) * 10, 'lantern').setScale(0.7);
      this.tweens.add({ targets: l, angle: { from: -4, to: 4 }, duration: 1600 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // 神轎與神光
    const glow = this.add.circle(W / 2, G - 100, 120, 0xffd76a, 0.12);
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.2, duration: 1800, yoyo: true, repeat: -1 });
    this.add.image(W / 2, G + 90, 'palanquin').setOrigin(0.5, 1).setScale(0.9);
    this.add.image(W / 2 - 230, G + 110, 'qiye').setOrigin(0.5, 1).setScale(0.85);
    this.add.image(W / 2 - 160, G + 100, 'baye').setOrigin(0.5, 1).setScale(0.85);
    this.add.image(W / 2 + 170, G + 100, 'flag3').setOrigin(0.5, 1).setScale(0.85);
    this.add.image(W / 2 + 240, G + 110, 'flag1').setOrigin(0.5, 1).setScale(0.85);
    // 靈界霧氣
    for (let i = 0; i < 10; i++) {
      const s = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(G - 60, H - 160), 'smoke').setTint(0x9b7cff).setAlpha(0.12).setScale(Phaser.Math.FloatBetween(2, 4));
      this.tweens.add({ targets: s, x: s.x + 120, alpha: 0.03, duration: 5000 + i * 400, yoyo: true, repeat: -1 });
    }
    // 標題
    const title = txt(this, W / 2, 150, '遶　境', 120, C.gold, { serif: true, stroke: '#3a0e0a', strokeThickness: 10 }).setOrigin(0.5);
    title.setShadow(0, 6, '#000000', 12, true, true);
    txt(this, W / 2, 238, '原型試玩・萬舺暗訪／東津迎王／新瀛出營', 28, C.paper, { serif: true }).setOrigin(0.5);
    txt(this, W / 2, 280, '白天出巡收容，晚上升堂審鬼。凡人什麼都看不見。', 22, C.muted, { bold: false }).setOrigin(0.5);
    button(this, W / 2, H - 110, 300, 90, '起　駕', () => go(this, 'chapters'), { size: 38, fill: 0x8a1b14 });
    fullscreenButton(this);
    // 版本號（左下角小字）；放在測試區 /test/ 底下時前面加「測試版」
    const testTag = location.pathname.includes('/test/') ? '測試版・' : '';
    txt(this, 12, H - 12, testTag + __VERSION__, 14, C.muted, { bold: false }).setOrigin(0, 1).setAlpha(0.7);
    // 開發者資訊（右下角：小字署名＋三顆金框小按鈕，連結開新分頁）
    this.devInfo();
  }

  /**
   * 開發者資訊。尺寸用 CSS px 想，再依畫面縮放換回遊戲座標，
   * 保證手機上字 ≥12px、每顆按鈕 ≥44×44、按鈕間距 ≥8px、離畫面底緣 ≥16px
   * （#game 本身已用 env(safe-area-inset-bottom) 讓出底部橫條，這裡是再往上留的邊距）。
   */
  private devInfo(): void {
    const canvas = this.game.canvas;
    const cssW = canvas?.getBoundingClientRect().width || this.scale.displaySize.width;
    const s = cssW > 0 ? Math.min(1, cssW / W) : 0.6; // 每 1 遊戲 px 等於幾 CSS px
    const css = (px: number) => Math.ceil(px / s);
    const font = css(13);
    const btnH = css(46);
    const gap = css(10);
    const labels = ['GitHub ↗', 'Threads ↗', '方格子 ↗'];
    const urls = [
      'https://github.com/SY19870627',
      'https://www.threads.com/@ye.c.feng',
      'https://vocus.cc/user/@SY19870627',
    ];
    const texts = labels.map((l) => txt(this, 0, 0, l, font, C.gold, { bold: false }).setOrigin(0.5));
    const btnW = Math.max(css(46), ...texts.map((t) => Math.ceil(t.width) + css(14)));
    // 排成兩欄（每列兩顆，最後一列不滿就置中），整組靠右
    const cols = 2;
    const rows = Math.ceil(texts.length / cols);
    const gridW = cols * btnW + (cols - 1) * gap;
    const gridH = rows * btnH + (rows - 1) * gap;
    // 靠右留 12px（太窄放不下才縮成 6px）。整組放得進起駕按鈕（寬 300、上緣 H - 155）右邊，
    // 就和它底緣對齊（H - 65）；放不下（手機）就整組移到起駕按鈕上方再留 8px
    const gridR = W - css(W - css(12) - gridW >= css(12) ? 12 : 6);
    const cx = gridR - gridW / 2;
    const besideGo = gridR - gridW >= W / 2 + 150 + css(8);
    // 螢幕很窄時再往上留夠 16px
    const bottom = besideGo ? H - Math.max(65, css(16)) : Math.min(H - 155 - css(8), H - css(16));
    texts.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, texts.length - row * cols);
      const rowW = inRow * btnW + (inRow - 1) * gap;
      const bx = cx - rowW / 2 + btnW / 2 + col * (btnW + gap);
      const by = bottom - gridH + btnH / 2 + row * (btnH + gap);
      this.devLink(t, bx, by, btnW, btnH, urls[i]);
    });
    const top = bottom - gridH;
    const sign = txt(this, 0, 0, '開發者：SY', css(12), C.muted, { bold: false }).setAlpha(0.9);
    // 署名平常在整組上方；整組移到起駕上方時改放左側，免得壓到持旗的人
    if (besideGo) sign.setOrigin(0.5, 1).setPosition(cx, top - css(6));
    else sign.setOrigin(1, 0.5).setPosition(gridR - gridW - css(8), top + gridH / 2);
  }

  /** 金框小按鈕：文字本身用 padding 撐成整顆按鈕大小，可點範圍＝整顆按鈕；手指放開才開新分頁 */
  private devLink(t: Phaser.GameObjects.Text, x: number, y: number, w: number, h: number, url: string): void {
    const padX = Math.max(0, (w - t.width) / 2);
    const padY = Math.max(0, (h - t.height) / 2);
    t.setPadding(padX, padY, padX, padY).setPosition(x, y).setOrigin(0.5).setDepth(1);
    const g = this.add.graphics();
    const r = Math.min(12, h / 4);
    const draw = (hover: boolean) => {
      g.clear();
      g.fillStyle(0x000000, 0.25);
      g.fillRoundedRect(x - w / 2, y - h / 2 + 3, w, h, r);
      g.fillStyle(hover ? 0x3a3048 : C.panel, hover ? 0.85 : 0.6);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
      g.lineStyle(2, C.gold, hover ? 0.9 : 0.45);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    };
    draw(false);
    t.setAlpha(0.85);
    t.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, t.width, t.height), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    let downAt: { x: number; y: number } | null = null;
    t.on('pointerover', () => { t.setAlpha(1); draw(true); });
    t.on('pointerout', () => { t.setAlpha(0.85); draw(false); downAt = null; });
    t.on('pointerdown', (p: Phaser.Input.Pointer) => { downAt = { x: p.x, y: p.y }; });
    t.on('pointerup', (p: Phaser.Input.Pointer) => {
      const ok = !downAt || Math.hypot(p.x - downAt.x, p.y - downAt.y) < 24;
      downAt = null;
      if (ok) window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
}
