/**
 * 【原型】引擎內演出：照 content/protoStage.ts 的腳本，讓陣頭小人在場景上走位、頭上冒泡泡，鏡頭推近拉遠。
 * 只在網址加 ?proto=stage（&id=recall 或 dusk3）時從 BootScene 進來；正式流程不會走到這裡。
 *
 * 鏡頭不用 Phaser 的相機縮放（那樣泡泡、字幕也會跟著放大），而是把整個舞台放在一個容器裡縮放、平移；
 * 泡泡與字幕畫在容器外面，位置照鏡頭最後停的地方算，所以永遠在畫面裡、字也不會變大。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { SPEAKERS, type SpeakerId } from '../content/story';
import { STAGE_SCRIPTS, type StageBeat, type StageScript } from '../content/protoStage';
import { button, go, txt } from '../ui/widgets';

export interface ProtoStageData {
  id?: string;
}

const BUBBLE_W = 380;

export class ProtoStageScene extends Phaser.Scene {
  private world!: Phaser.GameObjects.Container;
  private actors = new Map<string, Phaser.GameObjects.Image>();
  private cam = { x: W / 2, y: 0, zoom: 1 };
  private G = 0;
  private i = -1;
  private ui: Phaser.GameObjects.GameObject[] = [];
  private beatAt = 0;
  private done = false;
  private sc!: StageScript;

  constructor() {
    super('protoStage');
  }

  create(data: ProtoStageData): void {
    this.sc = STAGE_SCRIPTS[data.id ?? 'recall'] ?? STAGE_SCRIPTS.recall;
    const sc = this.sc;
    this.actors.clear();
    this.i = -1;
    this.done = false;
    this.ui = [];
    this.G = Math.round(H * 0.66);
    this.cam = { x: W / 2, y: 0, zoom: 1 };
    this.cameras.main.fadeIn(400, 10, 8, 18);

    // 天空不跟鏡頭動（遠到看不出來）
    const sky = this.add.graphics();
    sky.fillGradientStyle(sc.sky[0], sc.sky[0], sc.sky[1], sc.sky[1], 1);
    sky.fillRect(0, 0, W, H);
    if (sc.mood === 'temple') this.add.circle(W * 0.8, H * 0.12, 30, 0xfff3c4, 0.7);

    // 舞台：遠景、廟、地面、演員都在這個容器裡，鏡頭就是縮放、平移它
    this.world = this.add.container(0, 0);
    const G = this.G;
    if (sc.far) this.world.add(this.add.tileSprite(-100, G - 30, W + 200, 260, sc.far).setOrigin(0, 1).setAlpha(0.85));
    if (sc.temple) this.world.add(this.add.image(W / 2 + 60, G + 8, sc.temple).setOrigin(0.5, 1).setScale(0.8).setTint(0x8a6a50));
    const ground = this.add.graphics();
    ground.fillStyle(sc.ground, 1);
    ground.fillRect(-100, G, W + 200, H - G + 100);
    ground.lineStyle(1, 0x3a3444, 1);
    for (let y = G; y < H + 100; y += 40) ground.lineBetween(-100, y, W + 100, y);
    this.world.add(ground);
    if (sc.mood === 'temple') {
      for (let i = 0; i < 5; i++) this.world.add(this.add.image(80 + i * 140, G - 330, 'lantern').setScale(0.7));
    }
    for (const a of sc.actors) {
      if (!this.textures.exists(a.tex)) continue;
      const img = this.add.image(a.x, G + a.y, a.tex).setScale(a.scale).setFlipX(!!a.flip).setAlpha(a.alpha ?? 1);
      if (a.center) img.setOrigin(0.5); else img.setOrigin(0.5, 1);
      if (a.tint !== undefined) img.setTint(a.tint);
      if (a.tex === 'decree') {
        this.tweens.add({ targets: img, scale: a.scale * 1.06, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        const glow = this.add.circle(a.x, G + a.y, 70, 0xffd76a, 0).setBlendMode(Phaser.BlendModes.ADD);
        this.world.add(glow);
        // 旨意上的「令」字（和過場對話框裡的一樣）
        const ling = txt(this, a.x, G + a.y, '令', 48, 0x8a1b14, { serif: true }).setOrigin(0.5).setAlpha(0);
        this.world.add(ling);
        this.actors.set('decreeLing', ling as unknown as Phaser.GameObjects.Image);
        this.actors.set('decreeGlow', glow as unknown as Phaser.GameObjects.Image);
      }
      if (a.tex === 'smoke') this.tweens.add({ targets: img, angle: 360, duration: 20000, repeat: -1 });
      this.world.add(img);
      this.actors.set(a.id, img);
    }
    // 「令」字要疊在旨意圖上面
    const ling = this.actors.get('decreeLing');
    if (ling) this.world.bringToTop(ling);

    const label = sc.mood === 'demon' ? '妖怪視角' : '神明視角';
    txt(this, 24, 26, `${label}｜${sc.place}`, 22, sc.mood === 'demon' ? 0xc9a0ff : C.gold, { serif: true }).setDepth(600);
    txt(this, 24, 58, '【原型】引擎內演出・暫代美術', 16, C.muted, { bold: false }).setDepth(600);
    button(this, W - 90, 40, 120, 50, '略過 ▶▶', () => this.finish(), { size: 18, fill: 0x2a2236 }).setDepth(700);
    button(this, W - 130, H - 50, 220, 50, '對照原本的過場', () => {
      if (this.done) return;
      this.done = true;
      go(this, 'story', { id: sc.id, next: { key: 'protoStage', data: { id: sc.id } } });
    }, { size: 18, fill: 0x2a2236 }).setDepth(700);
    const hit = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setDepth(499).setInteractive();
    hit.on('pointerup', () => this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.time.delayedCall(500, () => this.next());
  }

  private advance(): void {
    // 剛換下一拍的前 0.3 秒不收點擊（連點不會一口氣跳過去）
    if (this.i < 0 || this.time.now - this.beatAt < 300) return;
    this.next();
  }

  private next(): void {
    if (this.done) return;
    this.i++;
    for (const o of this.ui) o.destroy();
    this.ui = [];
    const beat = this.sc.beats[this.i];
    if (!beat) return this.finish();
    this.beatAt = this.time.now;
    if (beat.cam) this.moveCam(beat.cam);
    for (const m of beat.moves ?? []) this.move(m);
    if (beat.fx) this.fx(beat.fx);
    if (beat.sfx) this.time.delayedCall(200, () => this.sfx(beat.sfx!));
    if (beat.at) this.bubble(beat);
    else this.caption(beat.text);
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    go(this, 'title');
  }

  /** 鏡頭看向 (x, 地面 + y)，放大 zoom 倍；不讓舞台邊緣露出來 */
  private moveCam(c: NonNullable<StageBeat['cam']>): void {
    this.cam = { x: c.x, y: c.y, zoom: c.zoom };
    const t = this.camTransform();
    this.tweens.add({ targets: this.world, x: t.x, y: t.y, scale: c.zoom, duration: c.ms ?? 1000, ease: 'Sine.inOut' });
  }

  private camTransform(): { x: number; y: number; z: number } {
    const { x, y, zoom: z } = this.cam;
    const fy = this.G + y;
    return {
      x: Phaser.Math.Clamp(W / 2 - x * z, W - W * z, 0),
      y: Phaser.Math.Clamp(fy * (1 - z), H - H * z, 0),
      z,
    };
  }

  /** 舞台座標 → 鏡頭停下來之後的畫面座標 */
  private toScreen(x: number, y: number): { x: number; y: number } {
    const t = this.camTransform();
    return { x: t.x + x * t.z, y: t.y + y * t.z };
  }

  private move(m: NonNullable<StageBeat['moves']>[number]): void {
    const img = this.actors.get(m.id);
    if (!img) return;
    const ms = m.ms ?? 800;
    const to: Record<string, number> = {};
    if (m.x !== undefined) to.x = m.x;
    if (m.y !== undefined) to.y = this.G + m.y;
    if (m.alpha !== undefined) to.alpha = m.alpha;
    if (m.scale !== undefined) to.scale = m.scale;
    this.tweens.add({ targets: img, ...to, duration: ms, ease: 'Sine.inOut' });
    if (m.id === 'decree') {
      const glow = this.actors.get('decreeGlow') as unknown as Phaser.GameObjects.Arc | undefined;
      if (glow) this.tweens.add({ targets: glow, fillAlpha: 0.3, y: to.y ?? glow.y, duration: ms });
      const ling = this.actors.get('decreeLing');
      if (ling) this.tweens.add({ targets: ling, alpha: to.alpha ?? ling.alpha, y: to.y ?? ling.y, duration: ms });
    }
    if (m.hop) {
      const sx = img.scaleX;
      this.tweens.add({ targets: img, scaleY: img.scaleY * 0.96, scaleX: sx * 1.02, duration: 140, yoyo: true, repeat: Math.max(0, Math.round(ms / 280) - 1) });
    }
    if (m.tex && this.textures.exists(m.tex)) this.time.delayedCall(ms / 2, () => img.setTexture(m.tex!));
    if (m.tint === null) this.time.delayedCall(ms / 2, () => img.clearTint());
    else if (m.tint !== undefined) img.setTint(m.tint);
  }

  /** 對話泡泡：掛在演員頭上（照鏡頭停下來的位置算），尾巴指向說話的人 */
  private bubble(beat: StageBeat): void {
    const a = this.sc.actors.find((x) => x.id === beat.at);
    const img = this.actors.get(beat.at!);
    if (!a || !img) return this.caption(beat.text);
    // 演員這一拍最後會走到哪裡
    const mv = beat.moves?.find((m) => m.id === a.id);
    const ax = mv?.x ?? img.x;
    const ay = mv?.y !== undefined ? this.G + mv.y : img.y;
    const h = img.height * (mv?.scale ?? Math.abs(img.scaleY));
    const top = a.center ? ay - h / 2 : ay - h;
    const p = this.toScreen(ax, top);
    const name = beat.name ?? (beat.who && beat.who !== 'narrator' ? SPEAKERS[beat.who as Exclude<SpeakerId, 'narrator'>].name : '');
    const body = txt(this, 0, 0, beat.text, 26, C.ink, { wordWrap: { width: BUBBLE_W - 36, useAdvancedWrap: true }, lineSpacing: 6 });
    const bw = Math.max(140, body.width + 36);
    const bh = body.height + 30;
    const bx = Phaser.Math.Clamp(p.x - bw / 2, 12, W - bw - 12);
    const by = Phaser.Math.Clamp(p.y - bh - 34, 100, H - bh - 140);
    const tipX = Phaser.Math.Clamp(p.x, bx + 24, bx + bw - 24);
    const tipY = Math.max(by + bh + 10, Math.min(p.y - 4, by + bh + 34));
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(4, 6, bw, bh, 18);
    g.fillStyle(C.paper, 1);
    g.fillRoundedRect(0, 0, bw, bh, 18);
    g.fillTriangle(tipX - bx - 14, bh - 2, tipX - bx + 14, bh - 2, tipX - bx, tipY - by);
    g.lineStyle(3, beat.who === 'shiju' ? 0x6a3a9a : C.temple, 1);
    g.strokeRoundedRect(0, 0, bw, bh, 18);
    body.setPosition(18, 15);
    const parts: Phaser.GameObjects.GameObject[] = [g, body];
    if (name) {
      const tag = txt(this, 14, -18, name, 18, C.gold, { serif: true, backgroundColor: '#17121f', padding: { x: 10, y: 3 } });
      parts.push(tag);
    }
    const c = this.add.container(bx, by, parts).setDepth(450).setAlpha(0).setScale(0.85);
    this.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 220, ease: 'Back.out', delay: 120 });
    this.ui.push(c, this.hint(bx + bw - 6, by + bh + 4));
  }

  /** 旁白字幕：畫面下方一條 */
  private caption(s: string): void {
    const t = txt(this, W / 2, H - 170, s, 24, 0xd9cbe8, { serif: true, align: 'center', wordWrap: { width: W - 100, useAdvancedWrap: true }, lineSpacing: 8 }).setOrigin(0.5).setDepth(451).setAlpha(0);
    const bg = this.add.rectangle(W / 2, H - 170, W - 40, t.height + 36, 0x0a0812, 0.75).setStrokeStyle(2, C.gold, 0.6).setDepth(450).setAlpha(0);
    this.tweens.add({ targets: [t, bg], alpha: 1, duration: 300 });
    this.ui.push(t, bg, this.hint(W - 40, H - 170 + t.height / 2 + 30));
  }

  private hint(x: number, y: number): Phaser.GameObjects.Text {
    const h = txt(this, x, y, '▼', 18, C.muted).setOrigin(1, 0).setDepth(452).setAlpha(0);
    this.tweens.add({ targets: h, alpha: 1, duration: 300, delay: 600 });
    return h;
  }

  /** 狀聲字（沒有音效系統）：在演員旁邊放大淡出 */
  private sfx(s: NonNullable<StageBeat['sfx']>): void {
    const img = this.actors.get(s.at);
    if (!img) return;
    const p = this.toScreen(img.x, img.y - img.displayHeight);
    const t = txt(this, Phaser.Math.Clamp(p.x + 60, 80, W - 80), Math.max(120, p.y - 20), s.text, 40, s.color ?? 0xff5a3a, { stroke: '#120a10', strokeThickness: 7 })
      .setOrigin(0.5).setDepth(460).setScale(0.5).setAngle(-8);
    this.tweens.add({ targets: t, scale: 1.25, alpha: 0, y: t.y - 40, duration: 1100, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  private fx(k: NonNullable<StageBeat['fx']>): void {
    if (k === 'shake') this.cameras.main.shake(400, 0.01);
    if (k === 'flash') this.cameras.main.flash(400, 255, 230, 160);
    if (k === 'firecracker') {
      this.cameras.main.shake(400, 0.008);
      for (let n = 0; n < 4; n++) {
        this.time.delayedCall(n * 260, () => {
          const x = Phaser.Math.Between(80, W - 80);
          const y = this.G - Phaser.Math.Between(120, 320);
          for (let i = 0; i < 14; i++) {
            const s = this.add.image(x, y, 'spark').setTint(Phaser.Math.RND.pick([0xff4a3a, 0xffd76a, 0xffffff])).setScale(Phaser.Math.FloatBetween(0.6, 1.4)).setDepth(430);
            this.tweens.add({ targets: s, x: x + Phaser.Math.Between(-90, 90), y: y + Phaser.Math.Between(-90, 60), alpha: 0, duration: 600, onComplete: () => s.destroy() });
          }
        });
      }
    }
  }
}
