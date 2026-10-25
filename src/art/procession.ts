/**
 * 進香隊伍（白天用）：照真實進香的順序由前往後排，站在畫面上原地踏步，背景往後捲。
 * 最前面是報馬仔，接著五方旗、鼓亭、醒獅、八將、七爺八爺、涼傘、神轎，最後是信徒。
 */
import Phaser from 'phaser';
import { GROUND_Y } from '../theme';
import { FOLK_KEYS } from './figures';

interface Member {
  img: Phaser.GameObjects.Image;
  baseY: number;
  phase: number;
  /** 走路時上下晃的幅度 */
  bob: number;
  sway: number;
}

const ORDER: { key: string; gap: number; bob?: number; sway?: number; dy?: number }[] = [
  { key: 'baoma', gap: 0 },
  { key: 'flag0', gap: 70, sway: 3 },
  { key: 'flag1', gap: 34, sway: 3, dy: -8 },
  { key: 'flag2', gap: 34, sway: 3 },
  { key: 'flag3', gap: 34, sway: 3, dy: -8 },
  { key: 'flag4', gap: 34, sway: 3 },
  { key: 'drum', gap: 104, bob: 2 },
  { key: 'lion', gap: 130, bob: 6, sway: 4 },
  { key: 'bajiang0', gap: 110 },
  { key: 'bajiang1', gap: 46, dy: -6 },
  { key: 'bajiang2', gap: 46 },
  { key: 'bajiang3', gap: 46, dy: -6 },
  { key: 'qiye', gap: 80, bob: 4, sway: 3 },
  { key: 'baye', gap: 48, bob: 3 },
  { key: 'umbrella', gap: 78, sway: 2 },
  { key: 'palanquin', gap: 120, bob: 2, sway: 1 },
];

export class Procession {
  private scene: Phaser.Scene;
  private members: Member[] = [];
  private followers: Member[] = [];
  private scale: number;
  private rearX = 0;
  /** 神轎的 x（畫面座標） */
  palanquinX = 0;
  walking = true;
  private t = 0;

  constructor(scene: Phaser.Scene, frontX: number, scale: number, followers: number) {
    this.scene = scene;
    this.scale = scale;
    let x = frontX;
    for (const o of ORDER) {
      x -= o.gap * scale;
      const y = GROUND_Y + (o.dy ?? 0) * scale;
      const img = scene.add.image(x, y, o.key).setOrigin(0.5, 1).setScale(scale).setDepth(10 + y / 100);
      this.members.push({ img, baseY: y, phase: Math.random() * Math.PI * 2, bob: o.bob ?? 3, sway: o.sway ?? 1.5 });
      if (o.key === 'palanquin') this.palanquinX = x;
    }
    // 神轎的神光
    const glow = scene.add.circle(this.palanquinX, GROUND_Y - 100 * scale, 70 * scale, 0xffd76a, 0.15).setDepth(9);
    scene.tweens.add({ targets: glow, scale: 1.2, alpha: 0.25, duration: 1400, yoyo: true, repeat: -1 });
    this.rearX = x - 110 * scale;
    for (let i = 0; i < Math.min(followers, 18); i++) this.addFollower(false);
  }

  /** 隊伍後面多一位信徒（walkIn：從畫面左邊走進來） */
  addFollower(walkIn = true): void {
    const i = this.followers.length;
    if (i >= 18) return;
    const x = this.rearX - (i >> 1) * 40 * this.scale;
    const y = GROUND_Y + (i % 2 ? -12 : 6) * this.scale;
    const img = this.scene.add.image(walkIn ? -40 : x, y, FOLK_KEYS[i % FOLK_KEYS.length]).setOrigin(0.5, 1).setScale(this.scale).setDepth(10 + y / 100);
    if (walkIn) this.scene.tweens.add({ targets: img, x, duration: 1800, ease: 'Sine.out' });
    this.followers.push({ img, baseY: y, phase: Math.random() * Math.PI * 2, bob: 3, sway: 1.5 });
  }

  removeFollower(): void {
    const f = this.followers.pop();
    if (f) this.scene.tweens.add({ targets: f.img, alpha: 0, duration: 600, onComplete: () => f.img.destroy() });
  }

  /** 讓畫面上的信徒數跟實際人數一致（最多畫 18 位） */
  syncFollowers(n: number): void {
    const want = Math.min(18, n);
    while (this.followers.length < want) this.addFollower(true);
    while (this.followers.length > want) this.removeFollower();
  }

  update(dt: number): void {
    if (this.walking) this.t += dt;
    for (const m of [...this.members, ...this.followers]) {
      const s = Math.sin(this.t * 7 + m.phase);
      m.img.y = m.baseY - Math.abs(s) * m.bob * this.scale;
      m.img.angle = Math.sin(this.t * 3.5 + m.phase) * m.sway;
    }
  }

  /** 天黑之後：隊伍罩上一層夜色 */
  setTint(c: number): void {
    for (const m of [...this.members, ...this.followers]) m.img.setTint(c);
  }
}
