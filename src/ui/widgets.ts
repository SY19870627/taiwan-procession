import Phaser from 'phaser';
import { FONT, SERIF, C, hex, W } from '../theme';
import { run } from '../state';
import { canFullscreen, isFullscreen, toggleFullscreen } from '../mobile';

export function txt(
  scene: Phaser.Scene, x: number, y: number, s: string, size = 22, color: number | string = C.paper,
  opt: Partial<Phaser.Types.GameObjects.Text.TextStyle> & { serif?: boolean; bold?: boolean } = {},
): Phaser.GameObjects.Text {
  const { serif, bold, ...rest } = opt;
  return scene.add.text(x, y, s, {
    fontFamily: serif ? SERIF : FONT,
    fontSize: `${size}px`,
    fontStyle: bold === false ? '400' : '700',
    color: typeof color === 'number' ? hex(color) : color,
    ...rest,
  });
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = C.panel, alpha = 0.94): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(x + 4, y + 6, w, h, 16);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(3, C.gold, 0.85);
  g.strokeRoundedRect(x, y, w, h, 16);
  return g;
}

export interface Button extends Phaser.GameObjects.Container {
  setEnabled(on: boolean): Button;
  setLabel(s: string): Button;
}

/** 按鈕：手指放開才觸發，按住拖走不算 */
export function button(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onClick: () => void,
  opt: { fill?: number; edge?: number; size?: number; color?: number } = {},
): Button {
  const c = scene.add.container(x, y) as Button;
  const g = scene.add.graphics();
  const fill = opt.fill ?? 0x5a2a2a;
  const edge = opt.edge ?? C.gold;
  let enabled = true;
  let hover = false;
  const draw = () => {
    g.clear();
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 14);
    g.fillStyle(enabled ? (hover ? Phaser.Display.Color.ValueToColor(fill).lighten(12).color : fill) : 0x3a3442, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.fillStyle(0xffffff, enabled ? 0.1 : 0.04);
    g.fillRoundedRect(-w / 2, -h / 2, w, h * 0.45, 14);
    g.lineStyle(3, enabled ? edge : 0x5a5266, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  };
  draw();
  const t = txt(scene, 0, 0, label, opt.size ?? 24, opt.color ?? C.paper).setOrigin(0.5);
  const hit = scene.add.rectangle(0, 0, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  c.add([g, t, hit]);
  let downAt: { x: number; y: number } | null = null;
  hit.on('pointerover', () => { hover = true; draw(); });
  hit.on('pointerout', () => { hover = false; downAt = null; draw(); });
  hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
    downAt = { x: p.x, y: p.y };
    if (enabled) scene.tweens.add({ targets: c, scale: 0.95, duration: 60, yoyo: true });
  });
  hit.on('pointerup', (p: Phaser.Input.Pointer) => {
    if (!enabled || !downAt) return;
    const moved = Math.hypot(p.x - downAt.x, p.y - downAt.y);
    downAt = null;
    if (moved < 24) onClick();
  });
  c.setEnabled = (on: boolean) => {
    enabled = on;
    draw();
    t.setAlpha(on ? 1 : 0.5);
    return c;
  };
  c.setLabel = (s: string) => {
    t.setText(s);
    return c;
  };
  c.setSize(w, h);
  return c;
}

/** 右上角全螢幕按鈕（瀏覽器支援才出現） */
export function fullscreenButton(scene: Phaser.Scene): void {
  if (!canFullscreen()) return;
  const b = button(scene, W - 46, 40, 64, 52, isFullscreen() ? '縮小' : '全螢幕', () => {
    toggleFullscreen();
    scene.time.delayedCall(300, () => b.setLabel(isFullscreen() ? '縮小' : '全螢幕'));
  }, { size: 16, fill: 0x2a2236 });
  b.setDepth(1000).setAlpha(0.85);
}

/** 上方資源列：香火、信徒、士氣 */
export class ResourceBar {
  private scene: Phaser.Scene;
  private texts: Phaser.GameObjects.Text[] = [];
  private last = { incense: -1, followers: -1, morale: -1 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    const items = ['香火', '信徒', '士氣'];
    const g = scene.add.graphics().setDepth(900);
    g.fillStyle(0x1d1726, 0.82);
    g.fillRoundedRect(x, y, 420, 50, 12);
    g.lineStyle(2, C.gold, 0.7);
    g.strokeRoundedRect(x, y, 420, 50, 12);
    items.forEach((label, i) => {
      txt(scene, x + 18 + i * 140, y + 25, label, 18, C.muted).setOrigin(0, 0.5).setDepth(901);
      this.texts.push(txt(scene, x + 66 + i * 140, y + 25, '0', 24, C.gold).setOrigin(0, 0.5).setDepth(901));
    });
    this.refresh();
  }

  refresh(incenseOverride?: number): void {
    const now = { incense: incenseOverride ?? run.incense, followers: run.followers, morale: run.morale };
    const vals = [now.incense, now.followers, now.morale];
    const keys = ['incense', 'followers', 'morale'] as const;
    vals.forEach((v, i) => {
      const prev = this.last[keys[i]];
      this.texts[i].setText(String(Math.round(v)));
      if (prev >= 0 && v !== prev) {
        this.texts[i].setColor(v > prev ? '#8ff0a4' : '#ff8a8a');
        this.scene.tweens.add({ targets: this.texts[i], scale: 1.3, duration: 120, yoyo: true });
        this.scene.time.delayedCall(700, () => this.texts[i].setColor(hex(C.gold)));
      }
    });
    this.last = now;
  }
}

/** 淡出後切換場景 */
export function go(scene: Phaser.Scene, key: string, data?: object, ms = 400): void {
  scene.cameras.main.fadeOut(ms, 10, 8, 18);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

/** 浮動文字（+香火等） */
export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color = C.gold, size = 26): void {
  const t = txt(scene, x, y, s, size, color, { stroke: '#1d1726', strokeThickness: 5 }).setOrigin(0.5).setDepth(950);
  scene.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 1200, ease: 'Cubic.out', onComplete: () => t.destroy() });
}
