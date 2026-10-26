import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { CUTSCENES } from '../content/story';
import { Dialogue } from '../ui/dialogue';
import { button, go, txt } from '../ui/widgets';

export interface StoryData {
  id: string;
  next: { key: string; data?: object };
}

/** 過場：妖怪視角是紫色調，廟裡是金色調 */
export class StoryScene extends Phaser.Scene {
  constructor() {
    super('story');
  }

  create(data: StoryData): void {
    const cs = CUTSCENES[data.id] ?? CUTSCENES.opening;
    const next = data.next ?? { key: 'title' };
    this.cameras.main.fadeIn(400, 10, 8, 18);
    const [top, bottom] = cs.mood === 'demon' ? [0x0a0614, 0x2e1446] : cs.mood === 'temple' ? [0x1a0e08, 0x5a3412] : [0x2a2a4a, 0xd88a5a];
    const bg = this.add.graphics();
    bg.fillGradientStyle(top, top, bottom, bottom, 1);
    bg.fillRect(0, 0, W, H);
    // 飄動的煙或光點
    const tint = cs.mood === 'demon' ? 0x9b3cff : 0xffd76a;
    for (let i = 0; i < 14; i++) {
      const s = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H - 200), cs.mood === 'demon' ? 'smoke' : 'spark')
        .setTint(tint).setAlpha(0.12).setScale(Phaser.Math.FloatBetween(1, cs.mood === 'demon' ? 4 : 1.2));
      this.tweens.add({ targets: s, y: s.y - 60, x: s.x + Phaser.Math.Between(-40, 40), alpha: 0.02, duration: 4000 + i * 300, yoyo: true, repeat: -1 });
    }
    // 遠景剪影：山或海（第二章在海邊）
    if (cs.bg === 'sea') {
      const sea = this.add.graphics();
      sea.fillStyle(cs.mood === 'demon' ? 0x0a0c22 : 0x2a2a44, 1);
      sea.fillRect(0, H * 0.5, W, H * 0.5);
      sea.lineStyle(2, cs.mood === 'demon' ? 0x3a2a6a : 0x8a7a6a, 0.5);
      for (let y = H * 0.52; y < H; y += 26) for (let x = ((y / 26) % 2) * 30; x < W; x += 80) sea.lineBetween(x, y, x + 36, y);
      this.add.image(W * 0.3, H * 0.56, 'wangchuan').setOrigin(0.5, 1).setScale(0.9).setTint(cs.mood === 'demon' ? 0x6a5a8a : 0xffe0b0);
    } else if (cs.mood !== 'temple') this.add.tileSprite(0, H * 0.62, W, 260, 'mtnFarN').setOrigin(0, 1).setAlpha(0.8);
    else this.add.image(W / 2, H * 0.62, cs.temple ?? 'temple_huize').setOrigin(0.5, 1).setScale(0.9).setTint(0x7a5a3a);
    const label = cs.mood === 'demon' ? '妖怪視角' : '神明視角';
    txt(this, 24, 26, `${label}｜${cs.place}`, 22, cs.mood === 'demon' ? 0xc9a0ff : C.gold, { serif: true }).setDepth(600);
    const fx = (k: 'shake' | 'firecracker' | 'flash') => {
      if (k === 'shake') { this.cameras.main.shake(300, 0.008); }
      if (k === 'flash') { this.cameras.main.flash(400, 255, 230, 160); }
      if (k === 'firecracker') {
        this.cameras.main.shake(400, 0.012);
        this.cameras.main.flash(150, 255, 120, 80);
        for (let i = 0; i < 40; i++) {
          const sp = this.add.image(W / 2 + Phaser.Math.Between(-300, 300), H / 2 + Phaser.Math.Between(-150, 50), 'spark')
            .setTint(Phaser.Math.RND.pick([0xff4a3a, 0xffd76a, 0xffffff])).setDepth(450).setScale(Phaser.Math.FloatBetween(0.5, 1.4));
          this.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-120, 120), y: sp.y + Phaser.Math.Between(40, 200), alpha: 0, duration: 700, onComplete: () => sp.destroy() });
        }
      }
    };
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      go(this, next.key, next.data);
    };
    const dlg = new Dialogue(this, cs.lines, finish, fx);
    button(this, W - 90, 40, 120, 50, '略過 ▶▶', () => dlg.skip(), { size: 18, fill: 0x2a2236 }).setDepth(700);
  }
}
