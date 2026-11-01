/**
 * 引擎內演出播放器（docs/第一二章_熱鬧化計畫.md §4）：照 content/stage/ 的腳本，讓陣頭小人在場景上走位、
 * 頭上冒泡泡，鏡頭推近拉遠、震動、閃白、鞭炮、狀聲字。StoryScene 遇到有腳本的過場就用這個播。
 *
 * 鏡頭不用 Phaser 的相機縮放（那樣泡泡、字幕也會跟著放大），而是把整個舞台放在一個容器裡縮放、平移；
 * 泡泡與字幕畫在容器外面，位置照鏡頭最後停的地方算，所以永遠在畫面裡、字也不會變大。
 *
 * 手機直式（畫面比較高）：地平線往下、演員放大（stageLayout），地面下方畫前景（廟埕石板、山路草叢、海邊浪花），
 * 畫面下 40% 是字幕區（旁白放這裡）；泡泡掛在說話者頭上，不超出畫面、不蓋左上的地名與右上的略過鈕。
 */
import Phaser from 'phaser';
import { C, W } from '../theme';
import { SPEAKERS, type SpeakerId } from '../content/story';
import type { StageBeat, StageFore, StageMove, StageScript } from '../content/stage';
import { STAGE_SIZES } from '../art/stageSpec';
import { actorScale, bubbleBox, farBandHeight, stageLayout, type StageLayout } from '../core/stageLayout';
import { txt } from './widgets';

const BUBBLE_W = 400;

export interface StageOptions {
  /** 播完或略過 */
  onDone: () => void;
  /** 直接跳到第幾拍（從 0 算），前面的走位、鏡頭一次到位（截圖、驗收用） */
  startBeat?: number;
  /** 畫面高度（預設是遊戲目前的高度） */
  height?: number;
}

export class StagePlayer {
  private scene: Phaser.Scene;
  private sc: StageScript;
  private opts: StageOptions;
  private H: number;
  private L: StageLayout;
  private world: Phaser.GameObjects.Container;
  private actors = new Map<string, Phaser.GameObjects.Image>();
  /** 每個演員腳本上的縮放（換圖時照這個重新算） */
  private base = new Map<string, number>();
  private extras = new Map<string, Phaser.GameObjects.GameObject>();
  private cam = { x: W / 2, y: 0, zoom: 1 };
  private i = -1;
  private ui: Phaser.GameObjects.GameObject[] = [];
  private beatAt = 0;
  private done = false;

  constructor(scene: Phaser.Scene, sc: StageScript, opts: StageOptions) {
    this.scene = scene;
    this.sc = sc;
    this.opts = opts;
    this.H = opts.height ?? scene.scale.height;
    this.L = stageLayout(this.H);
    const { G, k } = this.L;
    const H = this.H;

    // 天空不跟鏡頭動（遠到看不出來）
    const sky = scene.add.graphics();
    sky.fillGradientStyle(sc.sky[0], sc.sky[0], sc.sky[1], sc.sky[1], 1);
    sky.fillRect(0, 0, W, H);
    if (sc.mood === 'temple') scene.add.circle(W * 0.8, H * 0.12, 30, 0xfff3c4, 0.7);
    if (sc.mood === 'dawn') scene.add.circle(W * 0.78, G - 40, 46, 0xffd9a0, 0.6);

    // 舞台：遠景、廟、地面、演員、前景都在這個容器裡，鏡頭就是縮放、平移它
    this.world = scene.add.container(0, 0);
    if (sc.far && scene.textures.exists(sc.far)) {
      const fh = farBandHeight(scene.textures.get(sc.far).getSourceImage().height);
      this.world.add(scene.add.tileSprite(-100, G - 30, W + 200, fh, sc.far).setOrigin(0, 1).setAlpha(0.85));
    }
    if (sc.temple && scene.textures.exists(sc.temple)) {
      this.world.add(scene.add.image(W / 2 + 60, G + 8, sc.temple).setOrigin(0.5, 1).setScale(0.8 * k).setTint(0x8a6a50));
    }
    const ground = scene.add.graphics();
    ground.fillStyle(sc.ground, 1);
    ground.fillRect(-100, G, W + 200, H - G + 200);
    ground.lineStyle(1, 0x3a3444, 1);
    for (let y = G; y < H + 200; y += 40) ground.lineBetween(-100, y, W + 100, y);
    this.world.add(ground);
    // 海邊：遠景的海和沙灘之間補一段近海（浪一條一條打上來）
    if (sc.fore === 'sea') {
      const night = sc.mood === 'demon';
      const sea = scene.add.graphics();
      sea.fillStyle(night ? 0x0a1028 : 0x3a5a7a, 1);
      sea.fillRect(-100, G - 32, W + 200, 40);
      sea.lineStyle(2, night ? 0x2a3a6a : 0xcfe0f0, 0.55);
      for (let n = 0, y = G - 26; y < G + 6; n++, y += 9) {
        for (let x = -80 + (n % 2) * 45; x < W + 80; x += 110) sea.lineBetween(x, y, x + 50, y);
      }
      sea.lineStyle(3, 0xe8eef4, night ? 0.25 : 0.6);
      sea.lineBetween(-100, G + 8, W + 100, G + 8);
      this.world.add(sea);
    }
    if (sc.mood === 'temple') {
      for (let n = 0; n < 5; n++) this.world.add(scene.add.image(80 + n * 140, G - 330 * k, 'lantern').setScale(0.7 * k));
    }
    for (const a of sc.actors) {
      if (!scene.textures.exists(a.tex)) continue;
      const img = scene.add.image(a.x, G + a.y * k, a.tex).setFlipX(!!a.flip).setAlpha(a.alpha ?? 1);
      this.base.set(a.id, a.scale);
      img.setScale(actorScale(a.tex, a.scale, k, img.height));
      if (a.center) img.setOrigin(0.5); else img.setOrigin(0.5, 1);
      if (a.tint !== undefined) img.setTint(a.tint);
      if (a.tex === 'decree') {
        scene.tweens.add({ targets: img, scale: img.scale * 1.06, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        const glow = scene.add.circle(a.x, G + a.y * k, 70 * k, 0xffd76a, 0).setBlendMode(Phaser.BlendModes.ADD);
        this.world.add(glow);
        // 旨意上的「令」字（和過場對話框裡的一樣）
        const ling = txt(scene, a.x, G + a.y * k, '令', 48, 0x8a1b14, { serif: true }).setOrigin(0.5).setAlpha(a.alpha ?? 1);
        this.extras.set('decreeGlow', glow);
        this.extras.set('decreeLing', ling);
      }
      if (a.tex === 'smoke') scene.tweens.add({ targets: img, angle: 360, duration: 20000, repeat: -1 });
      this.world.add(img);
      this.actors.set(a.id, img);
    }
    // 「令」字要疊在旨意圖上面
    const ling = this.extras.get('decreeLing');
    if (ling) this.world.add(ling);
    this.foreground(sc.fore ?? (sc.mood === 'temple' ? 'temple' : 'mountain'));

    const label = sc.mood === 'demon' ? '妖怪視角' : '神明視角';
    txt(scene, 24, 26, `${label}｜${sc.place}`, 22, sc.mood === 'demon' ? 0xc9a0ff : C.gold, { serif: true }).setDepth(600);
    const hit = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setDepth(499).setInteractive();
    hit.on('pointerup', () => this.advance());
    scene.input.keyboard?.on('keydown-SPACE', () => this.advance());
    scene.input.keyboard?.on('keydown-ENTER', () => this.advance());

    const start = opts.startBeat;
    if (start !== undefined && start > 0) {
      // 直接跳到第 start 拍：前面每一拍的走位、鏡頭、換圖一次到位，不播特效與泡泡
      const last = Math.min(start, sc.beats.length - 1);
      for (let n = 0; n < last; n++) this.stageBeat(sc.beats[n], true);
      this.i = last - 1;
      this.next(true);
    } else scene.time.delayedCall(500, () => this.next());
  }

  /** 略過：直接結束 */
  skip(): void {
    this.finish();
  }

  private advance(): void {
    // 剛換下一拍的前 0.3 秒不收點擊（連點不會一口氣跳過去）
    if (this.i < 0 || this.scene.time.now - this.beatAt < 300) return;
    this.next();
  }

  private next(instant = false): void {
    if (this.done) return;
    this.i++;
    for (const o of this.ui) o.destroy();
    this.ui = [];
    const beat = this.sc.beats[this.i];
    if (!beat) return this.finish();
    this.beatAt = this.scene.time.now;
    this.stageBeat(beat, instant);
    if (!instant) {
      if (beat.fx) this.fx(beat.fx);
      if (beat.sfx) this.scene.time.delayedCall(200, () => this.sfx(beat.sfx!));
    }
    if (beat.at) this.bubble(beat, instant);
    else this.caption(beat.text, instant);
  }

  /** 一拍的鏡頭與走位 */
  private stageBeat(beat: StageBeat, instant: boolean): void {
    if (beat.cam) this.moveCam(beat.cam, instant);
    for (const m of beat.moves ?? []) this.move(m, instant);
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.opts.onDone();
  }

  /** 鏡頭看向 (x, 地面 + y)，放大 zoom 倍；不讓舞台邊緣露出來 */
  private moveCam(c: NonNullable<StageBeat['cam']>, instant: boolean): void {
    this.cam = { x: c.x, y: c.y * this.L.k, zoom: c.zoom };
    const t = this.camTransform();
    if (instant) this.world.setPosition(t.x, t.y).setScale(c.zoom);
    else this.scene.tweens.add({ targets: this.world, x: t.x, y: t.y, scale: c.zoom, duration: c.ms ?? 1000, ease: 'Sine.inOut' });
  }

  private camTransform(): { x: number; y: number; z: number } {
    const { x, y, zoom: z } = this.cam;
    const fy = this.L.G + y;
    return {
      x: Phaser.Math.Clamp(W / 2 - x * z, W - W * z, 0),
      y: Phaser.Math.Clamp(fy * (1 - z), this.H - this.H * z, 0),
      z,
    };
  }

  /** 舞台座標 → 鏡頭停下來之後的畫面座標 */
  private toScreen(x: number, y: number): { x: number; y: number } {
    const t = this.camTransform();
    return { x: t.x + x * t.z, y: t.y + y * t.z };
  }

  private move(m: StageMove, instant: boolean): void {
    const img = this.actors.get(m.id);
    if (!img) return;
    const { G, k } = this.L;
    const ms = instant ? 0 : m.ms ?? 800;
    if (m.scale !== undefined) this.base.set(m.id, m.scale);
    const to: Record<string, number> = {};
    if (m.x !== undefined) to.x = m.x;
    if (m.y !== undefined) to.y = G + m.y * k;
    if (m.alpha !== undefined) to.alpha = m.alpha;
    if (m.angle !== undefined) to.angle = m.angle;
    const tex = m.tex && this.scene.textures.exists(m.tex) ? m.tex : undefined;
    const retex = () => {
      if (!tex) return;
      img.setTexture(tex);
      img.setScale(actorScale(tex, this.base.get(m.id) ?? 1, k, img.height));
    };
    if (m.scale !== undefined && !tex) to.scale = actorScale(img.texture.key, m.scale, k, img.height);
    const glow = this.extras.get('decreeGlow') as Phaser.GameObjects.Arc | undefined;
    const ling = this.extras.get('decreeLing') as Phaser.GameObjects.Text | undefined;
    if (instant) {
      img.setPosition(to.x ?? img.x, to.y ?? img.y);
      if (to.alpha !== undefined) img.setAlpha(to.alpha);
      if (to.scale !== undefined) img.setScale(to.scale);
      if (to.angle !== undefined) img.setAngle(to.angle);
      if (m.flip !== undefined) img.setFlipX(m.flip);
      retex();
      if (m.id === 'decree') {
        glow?.setPosition(glow.x, to.y ?? glow.y).setFillStyle(0xffd76a, 0.3 * (to.alpha ?? img.alpha));
        ling?.setPosition(ling.x, to.y ?? ling.y).setAlpha(to.alpha ?? ling.alpha);
      }
    } else {
      this.scene.tweens.add({ targets: img, ...to, duration: ms, ease: 'Sine.inOut' });
      if (m.id === 'decree') {
        if (glow) this.scene.tweens.add({ targets: glow, fillAlpha: 0.3 * (to.alpha ?? img.alpha), y: to.y ?? glow.y, duration: ms });
        if (ling) this.scene.tweens.add({ targets: ling, alpha: to.alpha ?? ling.alpha, y: to.y ?? ling.y, duration: ms });
      }
      let hop: Phaser.Tweens.Tween | undefined;
      if (m.hop) {
        const sx = img.scaleX;
        hop = this.scene.tweens.add({ targets: img, scaleY: img.scaleY * 0.96, scaleX: sx * 1.02, duration: 140, yoyo: true, repeat: Math.max(0, Math.round(ms / 280) - 1) });
      }
      // 換圖時先停掉一跳一跳（不然跳完會回到舊圖的縮放）
      if (tex) this.scene.time.delayedCall(ms / 2, () => { hop?.stop(); retex(); });
      // 翻面：有換圖就和換圖一起翻，沒有就走完再翻
      if (m.flip !== undefined) this.scene.time.delayedCall(tex ? ms / 2 : ms, () => img.setFlipX(m.flip!));
    }
    if (m.tint === null) {
      if (instant) img.clearTint();
      else this.scene.time.delayedCall(ms / 2, () => img.clearTint());
    } else if (m.tint !== undefined) img.setTint(m.tint);
  }

  /** 演員這一拍最後會停在哪裡、頭頂在哪裡（舞台座標） */
  private headOf(id: string, beat?: StageBeat): { x: number; top: number } | undefined {
    const a = this.sc.actors.find((x) => x.id === id);
    const img = this.actors.get(id);
    if (!a || !img) return undefined;
    const { G, k } = this.L;
    const mv = beat?.moves?.find((m) => m.id === id);
    const ax = mv?.x ?? img.x;
    const ay = mv?.y !== undefined ? G + mv.y * k : img.y;
    let h = img.displayHeight;
    if (mv?.tex && STAGE_SIZES[mv.tex]) h = STAGE_SIZES[mv.tex][1] * actorScale(mv.tex, mv.scale ?? this.base.get(id) ?? 1, k, STAGE_SIZES[mv.tex][1]);
    else if (mv?.scale !== undefined) h = img.height * actorScale(img.texture.key, mv.scale, k, img.height);
    return { x: ax, top: a.center ? ay - h / 2 : ay - h };
  }

  /** 對話泡泡：掛在演員頭上（照鏡頭停下來的位置算），尾巴指向說話的人 */
  private bubble(beat: StageBeat, instant: boolean): void {
    const head = this.headOf(beat.at!, beat);
    if (!head) return this.caption(beat.text, instant);
    const scene = this.scene;
    const p = this.toScreen(head.x, head.top);
    const name = beat.name ?? (beat.who && beat.who !== 'narrator' ? SPEAKERS[beat.who as Exclude<SpeakerId, 'narrator'>].name : '');
    const body = txt(scene, 0, 0, beat.text, 28, C.ink, { wordWrap: { width: BUBBLE_W - 40, useAdvancedWrap: true }, lineSpacing: 6 });
    const bw = Math.max(150, body.width + 40);
    const bh = body.height + 32;
    const { x: bx, y: by, tipX, tipY } = bubbleBox(p.x, p.y, bw, bh, this.L, this.H);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(4, 6, bw, bh, 18);
    g.fillStyle(C.paper, 1);
    g.fillRoundedRect(0, 0, bw, bh, 18);
    g.fillTriangle(tipX - bx - 14, bh - 2, tipX - bx + 14, bh - 2, tipX - bx, tipY - by);
    const demon = beat.who === 'shiju' || beat.who === 'heichao' || beat.who === 'jiao';
    g.lineStyle(3, demon ? 0x6a3a9a : C.temple, 1);
    g.strokeRoundedRect(0, 0, bw, bh, 18);
    body.setPosition(20, 16);
    const parts: Phaser.GameObjects.GameObject[] = [g, body];
    if (name) parts.push(txt(scene, 14, -20, name, 20, C.gold, { serif: true, backgroundColor: '#17121f', padding: { x: 10, y: 3 } }));
    const c = scene.add.container(bx, by, parts).setDepth(450);
    if (instant) c.setAlpha(1);
    else {
      c.setAlpha(0).setScale(0.85);
      scene.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 220, ease: 'Back.out', delay: 120 });
    }
    this.ui.push(c, this.hint(bx + bw - 6, by + bh + 4, instant));
  }

  /** 旁白字幕：畫面下 40% 的字幕區 */
  private caption(s: string, instant: boolean): void {
    const scene = this.scene;
    const y = this.L.capY;
    const t = txt(scene, W / 2, y, s, 26, 0xe9ddf4, { serif: true, align: 'center', wordWrap: { width: W - 100, useAdvancedWrap: true }, lineSpacing: 8 }).setOrigin(0.5).setDepth(451);
    const bg = scene.add.rectangle(W / 2, y, W - 40, t.height + 40, 0x0a0812, 0.8).setStrokeStyle(2, C.gold, 0.6).setDepth(450);
    if (!instant) {
      t.setAlpha(0);
      bg.setAlpha(0);
      scene.tweens.add({ targets: [t, bg], alpha: 1, duration: 300 });
    }
    this.ui.push(t, bg, this.hint(W - 40, y + t.height / 2 + 26, instant));
  }

  private hint(x: number, y: number, instant: boolean): Phaser.GameObjects.Text {
    const h = txt(this.scene, x, Math.min(y, this.H - 28), '▼', 18, C.muted).setOrigin(1, 0).setDepth(452);
    if (instant) return h;
    h.setAlpha(0);
    this.scene.tweens.add({ targets: h, alpha: 1, duration: 300, delay: 600 });
    return h;
  }

  /** 狀聲字（沒有音效系統）：在演員旁邊放大淡出 */
  private sfx(s: NonNullable<StageBeat['sfx']>): void {
    if (this.done) return;
    const img = this.actors.get(s.at);
    if (!img) return;
    const p = this.toScreen(img.x, img.y - img.displayHeight);
    const t = txt(this.scene, Phaser.Math.Clamp(p.x + 60, 80, W - 80), Math.max(120, p.y - 20), s.text, 40, s.color ?? 0xff5a3a, { stroke: '#120a10', strokeThickness: 7 })
      .setOrigin(0.5).setDepth(460).setScale(0.5).setAngle(-8);
    this.scene.tweens.add({ targets: t, scale: 1.25, alpha: 0, y: t.y - 40, duration: 1100, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  private fx(kind: NonNullable<StageBeat['fx']>): void {
    const scene = this.scene;
    const cam = scene.cameras.main;
    if (kind === 'shake') cam.shake(400, 0.01);
    if (kind === 'flash') cam.flash(400, 255, 230, 160);
    if (kind === 'firecracker') {
      cam.shake(400, 0.008);
      for (let n = 0; n < 4; n++) {
        scene.time.delayedCall(n * 260, () => {
          const x = Phaser.Math.Between(80, W - 80);
          const y = this.L.G - Phaser.Math.Between(120, 320);
          for (let i = 0; i < 14; i++) {
            const s = scene.add.image(x, y, 'spark').setTint(Phaser.Math.RND.pick([0xff4a3a, 0xffd76a, 0xffffff])).setScale(Phaser.Math.FloatBetween(0.6, 1.4)).setDepth(430);
            scene.tweens.add({ targets: s, x: x + Phaser.Math.Between(-90, 90), y: y + Phaser.Math.Between(-90, 60), alpha: 0, duration: 600, onComplete: () => s.destroy() });
          }
        });
      }
    }
  }

  /** 前景：演員腳底下面到畫面底部（手機直式下半部不再只有一片平地） */
  private foreground(kind: StageFore): void {
    if (kind === 'none') return;
    const scene = this.scene;
    const { k, foreTop } = this.L;
    const bottom = this.H + 200;
    const g = scene.add.graphics();
    if (kind === 'temple') {
      // 廟埕石板：越近越寬
      g.fillStyle(0x3a3440, 1);
      g.fillRect(-100, foreTop, W + 200, bottom - foreTop);
      g.lineStyle(2, 0x2a2430, 1);
      let y = foreTop;
      let row = 0;
      for (let hgt = 26 * k; y < bottom; y += hgt, hgt *= 1.18, row++) {
        g.lineBetween(-100, y, W + 100, y);
        const sw = 90 * (hgt / (26 * k));
        for (let x = -100 + (row % 2) * sw * 0.5; x < W + 100; x += sw) g.lineBetween(x, y, x, y + hgt);
      }
      // 香爐（左右兩個，剪影）
      for (const [x, s] of [[70, 1], [W - 70, 0.85]] as const) this.censer(g, x, foreTop + 150 * k, s * k);
      // 圍觀的信眾（最前排的頭和肩膀）
      this.crowd(g, this.H + 20, k);
    } else if (kind === 'mountain') {
      g.fillStyle(0x15111c, 1);
      g.fillRect(-100, foreTop, W + 200, bottom - foreTop);
      // 草叢與石頭
      for (let n = 0; n < 9; n++) {
        const x = -40 + n * 100 + ((n * 37) % 40);
        const y = foreTop + 30 * k + ((n * 53) % 5) * 26 * k;
        g.fillStyle(0x221b2a, 1);
        g.fillEllipse(x, y, 90 * k, 34 * k);
        g.fillStyle(0x2c3a2c, 1);
        for (let b = 0; b < 6; b++) g.fillTriangle(x - 30 * k + b * 12 * k, y, x - 24 * k + b * 12 * k, y, x - 27 * k + b * 12 * k + ((b % 2) - 0.5) * 10 * k, y - (24 + (b % 3) * 10) * k);
      }
      // 近處的大草叢（剪影）
      g.fillStyle(0x0c0910, 1);
      for (let n = 0; n < 14; n++) {
        const x = n * 56;
        g.fillTriangle(x - 30, this.H + 10, x + 30, this.H + 10, x + ((n % 3) - 1) * 14, this.H - (70 + (n % 4) * 26) * k);
      }
    } else {
      // 海邊：沙灘＋浪花（白天、天亮是沙色，晚上偏暗）
      g.fillStyle(this.sc.mood === 'demon' ? 0x2a2638 : 0x5a4c50, 1);
      g.fillRect(-100, foreTop, W + 200, bottom - foreTop);
      g.lineStyle(3, 0xcfe0f0, this.sc.mood === 'demon' ? 0.3 : 0.4);
      for (let n = 0, y = foreTop + 20; y < this.H + 20; n++, y += 36 * k) {
        for (let x = -60 + (n % 2) * 50; x < W + 60; x += 120) g.lineBetween(x, y, x + 60, y);
      }
    }
    this.world.add(g);
  }

  /** 香爐剪影（三隻腳、兩個耳朵、上面冒煙） */
  private censer(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number): void {
    g.fillStyle(0x1a1418, 1);
    g.fillRect(x - 40 * s, y - 14 * s, 10 * s, 24 * s);
    g.fillRect(x + 30 * s, y - 14 * s, 10 * s, 24 * s);
    g.fillEllipse(x, y - 40 * s, 110 * s, 70 * s);
    g.fillRect(x - 60 * s, y - 80 * s, 120 * s, 14 * s);
    g.fillRect(x - 58 * s, y - 104 * s, 12 * s, 28 * s);
    g.fillRect(x + 46 * s, y - 104 * s, 12 * s, 28 * s);
    g.fillStyle(0xe9b949, 0.5);
    g.fillRect(x - 50 * s, y - 46 * s, 100 * s, 4 * s);
    g.fillStyle(0xd9cbe8, 0.12);
    for (let n = 0; n < 4; n++) g.fillCircle(x + Math.sin(n) * 10 * s, y - (110 + n * 30) * s, (14 + n * 6) * s);
  }

  /** 最前排信眾的剪影 */
  private crowd(g: Phaser.GameObjects.Graphics, base: number, k: number): void {
    g.fillStyle(0x0e0a12, 1);
    for (let n = 0; n < 11; n++) {
      const x = 10 + n * 70 + ((n * 29) % 24);
      const hgt = (54 + ((n * 41) % 4) * 12) * k;
      g.fillEllipse(x, base - hgt * 0.3, 74 * k, hgt);
      g.fillCircle(x + ((n % 3) - 1) * 4, base - hgt * 0.75, 17 * k);
    }
  }
}
