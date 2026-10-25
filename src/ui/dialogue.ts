/**
 * 對話框：角色立繪、名字、逐字顯示。點一下畫面：文字還在跑就全部顯示，跑完就下一句。
 * 過場（StoryScene）和判官審判（JudgeScene）共用。
 */
import Phaser from 'phaser';
import { C, H, W, SERIF } from '../theme';
import { SPEAKERS, type Line } from '../content/story';
import { txt } from './widgets';

export class Dialogue {
  private scene: Phaser.Scene;
  private lines: Line[];
  private i = -1;
  private box: Phaser.GameObjects.Graphics;
  private nameTag: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private portraits = new Map<string, Phaser.GameObjects.Container>();
  private typing?: Phaser.Time.TimerEvent;
  private full = '';
  private onDone: () => void;
  private onFx?: (fx: NonNullable<Line['fx']>) => void;
  private finished = false;

  constructor(scene: Phaser.Scene, lines: Line[], onDone: () => void, onFx?: (fx: NonNullable<Line['fx']>) => void) {
    this.scene = scene;
    this.lines = lines;
    this.onDone = onDone;
    this.onFx = onFx;
    const bx = 40;
    const by = H - 210;
    const bw = W - 80;
    this.box = scene.add.graphics().setDepth(500);
    this.box.fillStyle(0x000000, 0.4);
    this.box.fillRoundedRect(bx + 4, by + 6, bw, 180, 18);
    this.box.fillStyle(0x17121f, 0.94);
    this.box.fillRoundedRect(bx, by, bw, 180, 18);
    this.box.lineStyle(3, C.gold, 0.9);
    this.box.strokeRoundedRect(bx, by, bw, 180, 18);
    this.nameTag = txt(scene, bx + 32, by - 22, '', 26, C.gold, { serif: true, backgroundColor: '#17121f', padding: { x: 14, y: 6 } }).setDepth(501);
    this.body = txt(scene, bx + 36, by + 34, '', 30, C.paper, { bold: false, lineSpacing: 10, wordWrap: { width: bw - 72, useAdvancedWrap: true } }).setDepth(501);
    this.hint = txt(scene, bx + bw - 30, by + 150, '▼ 點一下繼續', 18, C.muted).setOrigin(1, 0.5).setDepth(501).setAlpha(0);
    scene.tweens.add({ targets: this.hint, y: by + 144, duration: 500, yoyo: true, repeat: -1 });
    // 整個畫面都可以點
    const hit = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setDepth(499).setInteractive();
    hit.on('pointerup', () => this.advance());
    scene.input.keyboard?.on('keydown-SPACE', () => this.advance());
    scene.input.keyboard?.on('keydown-ENTER', () => this.advance());
    this.next();
  }

  private portrait(who: Exclude<Line['who'], 'narrator'>): Phaser.GameObjects.Container {
    const sp = SPEAKERS[who];
    const key = sp.tex + sp.side;
    let c = this.portraits.get(key);
    if (c) return c;
    const x = sp.side === 'left' ? W * 0.2 : W * 0.8;
    const y = H - 200;
    c = this.scene.add.container(x, y).setDepth(400);
    const img = this.scene.add.image(0, 0, sp.tex).setOrigin(0.5, 1).setScale(sp.scale);
    // 立繪面向畫面中央：右邊的角色往左看
    if (sp.side === 'right' && sp.tex !== 'decree') img.setFlipX(true);
    c.add(img);
    if (sp.tex === 'decree') {
      img.setOrigin(0.5, 0.5).setY(-130);
      c.add(txt(this.scene, 0, -130, '令', 64, 0x8a1b14, { serif: true }).setOrigin(0.5));
      this.scene.tweens.add({ targets: img, scale: sp.scale * 1.08, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    c.setAlpha(0);
    this.portraits.set(key, c);
    return c;
  }

  private next(): void {
    this.i++;
    if (this.i >= this.lines.length) {
      if (!this.finished) {
        this.finished = true;
        this.onDone();
      }
      return;
    }
    const line = this.lines[this.i];
    // 立繪：說話的人亮、其他人暗
    let active: Phaser.GameObjects.Container | undefined;
    if (line.who !== 'narrator') active = this.portrait(line.who);
    for (const c of this.portraits.values()) {
      if (c === active) {
        this.scene.tweens.add({ targets: c, alpha: 1, duration: 200 });
        c.setDepth(401);
        this.scene.tweens.add({ targets: c, y: H - 206, duration: 120, yoyo: true });
      } else if (c.alpha > 0) {
        this.scene.tweens.add({ targets: c, alpha: 0.35, duration: 200 });
        c.setDepth(400);
      }
    }
    if (line.who === 'narrator') {
      this.nameTag.setVisible(false);
      this.body.setFontFamily(SERIF).setColor('#d9cbe8');
    } else {
      this.nameTag.setVisible(true).setText(SPEAKERS[line.who].name);
      this.body.setFontFamily('"Noto Sans TC", sans-serif').setColor('#fbf3e2');
    }
    if (line.fx) this.onFx?.(line.fx);
    this.full = line.text;
    this.body.setText('');
    this.hint.setAlpha(0);
    let n = 0;
    this.typing?.remove();
    this.typing = this.scene.time.addEvent({
      delay: 32,
      repeat: this.full.length - 1,
      callback: () => {
        n++;
        this.body.setText(this.full.slice(0, n));
        if (n >= this.full.length) this.hint.setAlpha(1);
      },
    });
  }

  advance(): void {
    if (this.finished) return;
    if (this.typing && this.typing.getRepeatCount() > 0) {
      this.typing.remove();
      this.typing = undefined;
      this.body.setText(this.full);
      this.hint.setAlpha(1);
      return;
    }
    this.next();
  }

  skip(): void {
    if (this.finished) return;
    this.typing?.remove();
    this.finished = true;
    this.onDone();
  }
}
