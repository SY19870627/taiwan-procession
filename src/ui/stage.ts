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
import { ART, CUTSCENES, SPEAKERS, type SpeakerId } from '../content/story';
import type { StageActor, StageBeat, StageFore, StageMove, StageScript } from '../content/stage';
import { portraitKey, portraitThumb, type Expr } from '../art/portraits';
import { actorScale, bubbleBox, farBandHeight, nearBand, pickFar, stageLayout, stageSize, type StageLayout } from '../core/stageLayout';
import { fittedCams } from '../core/stageEdges';
import { wrapWidth } from '../core/layout';
import { txt } from './widgets';
import { clearLine, noteLine } from '../debug/probe';

const BUBBLE_W = 400;

/**
 * 站在地上、要畫落地影的演員（視覺修正：原本像浮在地上）。第一、二章的陣頭小人與神轎；海上的船、黑潮、飄著的東西不畫。
 * 神轎（畫師圖底下有一圈淡白的影子）的影子疊在轎子前面，把那圈淡白壓暗；其他人的影子在腳後面。
 */
const SHADOW: Record<string, { w: number; front?: boolean; a?: number }> = {
  st_wenpan: { w: 0.7 }, st_wupan: { w: 0.7 }, st_baoma: { w: 0.6 }, st_zhongjun: { w: 0.7 }, st_xunbu: { w: 0.7 },
  // 修正第 4 輪：畫師的站姿蹄下已有淡淡的陰影與煞氣，程式的影子窄一點、淡一點，疊起來只看得到一層
  st_shiju: { w: 0.55, a: 0.22 }, st_shiju_calm: { w: 0.75 }, st_shiju_look: { w: 0.75 }, st_shiju_kneel: { w: 0.8 },
  // 修正第 3 輪：青嶺王神轎新圖去掉了底部白邊與地面陰影，影子改回轎子後面（程式補）
  st_jiao_qingling: { w: 0.95 }, jb_blue: { w: 1.05 },
  st_qiye: { w: 0.7 }, st_baye: { w: 0.8 }, st_jiaoban: { w: 0.7 }, st_wangjiao: { w: 0.75 }, st_taizijiao: { w: 0.7 },
  st_wangjiao_carried: { w: 0.85 }, st_taizijiao_carried: { w: 0.85 },
  qiye: { w: 0.9 }, baye: { w: 0.9 }, jiaoban: { w: 0.9 },
};

/**
 * 修正第 3 輪補交的圖比先前的 st_ 圖飽和：播放時降一點彩度（WebGL 的顏色矩陣，不改圖檔），和同畫面的判官、中軍府一致。
 * 值是 saturate 的量（負的是降）。
 */
const MUTE: Record<string, number> = { st_qiye: -0.15, st_baye: -0.15, st_jiaoban: -0.25, st_wangjiao: -0.25, st_taizijiao: -0.5 };
// 修正第 4 輪的扛轎版畫師已經降過兩成彩度，這裡不再降（st_wangjiao_carried、st_taizijiao_carried 不在表上）

/** 程式畫的暫代小人（還沒有畫師的 B 組圖）：加一圈深色描邊，和畫師圖並排時不那麼突兀 */
const OUTLINE = new Set(['qiye', 'baye', 'jiaoban']);
/** 泡泡裡立繪小頭像的大小 */
const FACE = 76;

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
  /** 遠景帶、近景（正式背景圖晚一點才載到時換上去） */
  private farBand?: Phaser.GameObjects.TileSprite;
  /** 廟（有的話；泡泡要讓開它的匾額） */
  private temple?: Phaser.GameObjects.Image;
  private nearBand?: Phaser.GameObjects.TileSprite;
  /** 近景要插在舞台容器的第幾層（堤防後面的演員之後） */
  private nearAt = 0;
  /** 每個演員正在跳的動畫（正式圖換上來時要停掉） */
  private hops = new Map<string, Phaser.Tweens.Tween>();
  /** 這一拍的泡泡有沒有放小頭像 */
  private hasFace = false;
  /** 落地影與描邊（每一幀跟著演員走） */
  private shadows = new Map<string, { e: Phaser.GameObjects.Ellipse; w: number }>();
  private outlines = new Map<string, Phaser.GameObjects.Image[]>();
  /** 鏡頭現在（停好之後）的位置；每一拍的鏡頭照 fittedCams（腳本的鏡頭，裁到人就自動讓開，core/stageEdges.ts） */
  private camT = { x: 0, y: 0, z: 1 };
  private fits: { x: number; y: number; z: number }[];
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
    this.fits = fittedCams(sc, this.H);
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
    // 遠景：正式圖沒載到就用暫代（第三章 bg_* → x3_*）
    const far = pickFar(sc, (t) => scene.textures.exists(t));
    if (far) {
      const fh = farBandHeight(scene.textures.get(far.key).getSourceImage().height);
      const band = scene.add.tileSprite(-100, G + (sc.farY ?? -30), W + 200, fh, far.key).setOrigin(0, 1).setAlpha(0.85);
      if (far.tint !== undefined) band.setTint(far.tint);
      this.world.add(band);
      this.farBand = band;
    }
    if (sc.temple && scene.textures.exists(sc.temple)) {
      this.temple = scene.add.image(W / 2 + 60, G + 8, sc.temple).setOrigin(0.5, 1).setScale(0.8 * k).setTint(0x8a6a50);
      this.world.add(this.temple);
    }
    const ground = scene.add.graphics();
    ground.fillStyle(sc.ground, 1);
    // 遠景帶往下接到地面線以下（溪面接到堤防）時，地面從遠景下緣開始畫
    const groundTop = G + Math.max(0, sc.farY ?? 0);
    ground.fillRect(-100, groundTop, W + 200, H - groundTop + 200);
    ground.lineStyle(1, 0x3a3444, 1);
    for (let y = groundTop; y < H + 200; y += 40) ground.lineBetween(-100, y, W + 100, y);
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
    // 站在近景後面的（水裡的蛟、蝦兵）先放，再放近景（堤防），其他演員站在堤防上
    for (const a of sc.actors) if (a.behind) this.addActor(a);
    this.nearAt = this.world.length;
    this.addNear();
    for (const a of sc.actors) if (!a.behind) this.addActor(a);
    // 「令」字要疊在旨意圖上面
    const ling = this.extras.get('decreeLing');
    if (ling) this.world.add(ling);
    this.foreground(sc.fore ?? (sc.mood === 'temple' ? 'temple' : 'mountain'));
    this.syncDecor();
    scene.events.on('update', this.syncDecor, this);
    scene.events.once('shutdown', () => scene.events.off('update', this.syncDecor, this));
    this.watchArt();
    this.ready();
  }

  /** 近景（溪邊堤防）：正式圖有載到才畫，插在堤防後面的演員之後 */
  private addNear(): void {
    const { scene, sc } = this;
    if (this.nearBand || !sc.near || !scene.textures.exists(sc.near)) return;
    const { G, k } = this.L;
    const nb = nearBand(G, k, scene.textures.get(sc.near).getSourceImage().height);
    const near = scene.add.tileSprite(-100, nb.top, W + 200, nb.h, sc.near).setOrigin(0, 0).setTileScale(nb.s);
    if (sc.nearTint !== undefined) near.setTint(sc.nearTint);
    this.world.addAt(near, this.nearAt);
    this.nearBand = near;
  }

  /**
   * 演出開始後才載到的正式圖（深層連結一開就播，AssetScene 還在背後載）：
   *  - 正式背景（遠景、近景）：換掉暫代、補上近景；
   *  - 戰鬥圖、演出小人（AssetScene 已經換好貼圖、保持顯示高度）：停掉一跳一跳的縮放動畫
   *    （不然動畫會把縮放設回舊圖的倍數，正式圖會變好幾倍大），照設計尺寸重新算縮放。
   */
  private watchArt(): void {
    const game = this.scene.game;
    const onBg = (key: string) => {
      if (this.done) return;
      const { sc } = this;
      // 立繪載到了：這一拍的泡泡還沒有小頭像就重畫（不重播動畫）
      const beat = sc.beats[this.i];
      if (key.startsWith('pt_') && beat?.at && !this.hasFace && this.faceKey(beat) === key) {
        for (const o of this.ui) o.destroy();
        this.ui = [];
        this.bubble(beat, true);
      }
      if (key === sc.near) this.addNear();
      if (key === sc.far && this.farBand && this.farBand.texture.key !== key) {
        this.farBand.setTexture(key).setSize(this.farBand.width, farBandHeight(this.scene.textures.get(key).getSourceImage().height));
        if (sc.farTint !== undefined) this.farBand.setTint(sc.farTint);
      }
    };
    const onArt = (key: string) => {
      if (this.done) return;
      for (const [id, img] of this.actors) {
        if (img.texture.key !== key) continue;
        this.hops.get(id)?.stop();
        img.setScale(actorScale(key, this.base.get(id) ?? 1, this.L.k, img.height));
      }
    };
    game.events.on('artloaded', onBg);
    game.events.on('battleart', onArt);
    this.scene.events.once('shutdown', () => {
      game.events.off('artloaded', onBg);
      game.events.off('battleart', onArt);
    });
  }

  /** 把一個演員放上舞台 */
  private addActor(a: StageActor): void {
    const scene = this.scene;
    const { G, k } = this.L;
    if (!scene.textures.exists(a.tex)) return;
    const img = scene.add.image(a.x, G + a.y * k, a.tex).setFlipX(!!a.flip).setAlpha(a.alpha ?? 1);
    this.base.set(a.id, a.scale);
    img.setScale(actorScale(a.tex, a.scale, k, img.height));
    if (a.center) img.setOrigin(0.5); else img.setOrigin(0.5, 1);
    if (a.tint !== undefined) img.setTint(a.tint);
    if (MUTE[a.tex]) img.preFX?.addColorMatrix().saturate(MUTE[a.tex]);
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
    const sh = !a.center && !a.behind ? SHADOW[a.tex] : undefined;
    if (sh && !sh.front) this.addShadow(a.id, sh.w);
    if (OUTLINE.has(a.tex)) {
      const outs = [[-3, 0], [3, 0], [0, -3], [0, 3]].map(([dx, dy]) => {
        const o = scene.add.image(0, 0, a.tex).setOrigin(img.originX, img.originY).setTintFill(0x120a10).setData('d', [dx, dy]);
        this.world.add(o);
        return o;
      });
      this.outlines.set(a.id, outs);
    }
    this.world.add(img);
    this.actors.set(a.id, img);
    if (sh?.front) this.addShadow(a.id, sh.w);
  }

  private addShadow(id: string, w: number): void {
    const e = this.scene.add.ellipse(0, 0, 100, 18, 0x08060c, 1);
    this.world.add(e);
    this.shadows.set(id, { e, w });
  }

  /** 落地影、描邊跟著演員（位置、大小、翻面、透明度、換圖） */
  private syncDecor(): void {
    for (const [id, { e, w }] of this.shadows) {
      const img = this.actors.get(id);
      if (!img) continue;
      // 換圖後照新圖的寬度與濃淡（例如石駒站姿 → 跪）
      const cur = SHADOW[img.texture.key];
      const dw = img.displayWidth * (cur?.w ?? w);
      e.setPosition(img.x, img.y - 3).setScale(dw / 100, Math.max(0.5, (dw * 0.14) / 18)).setAlpha((cur?.a ?? 0.5) * img.alpha);
    }
    for (const [id, outs] of this.outlines) {
      const img = this.actors.get(id);
      if (!img) continue;
      for (const o of outs) {
        const [dx, dy] = o.getData('d') as number[];
        if (o.texture.key !== img.texture.key) o.setTexture(img.texture.key);
        o.setPosition(img.x + dx, img.y + dy).setScale(img.scaleX, img.scaleY).setFlipX(img.flipX).setAngle(img.angle).setAlpha(0.9 * img.alpha);
      }
    }
  }

  /** 地名、點擊、從第幾拍開始 */
  private ready(): void {
    const { scene, sc, opts, H } = this;
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
    noteLine(beat.name ?? (beat.who && beat.who !== 'narrator' ? SPEAKERS[beat.who as Exclude<SpeakerId, 'narrator'>].name : ''), beat.text, this.i, this.scene.scene.key);
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
    this.moveCam(this.sc.beats.indexOf(beat), beat.cam?.ms, instant);
    for (const m of beat.moves ?? []) this.move(m, instant);
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    clearLine(this.scene.scene.key);
    this.opts.onDone();
  }

  /** 鏡頭看向第 n 拍的位置（腳本的鏡頭：看向 (x, 地面 + y)、放大 zoom 倍，不露出舞台邊緣；裁到人就自動讓開） */
  private moveCam(n: number, ms: number | undefined, instant: boolean): void {
    const t = this.fits[n];
    if (!t || (t.x === this.camT.x && t.y === this.camT.y && t.z === this.camT.z)) return;
    this.camT = t;
    if (instant) this.world.setPosition(t.x, t.y).setScale(t.z);
    else this.scene.tweens.add({ targets: this.world, x: t.x, y: t.y, scale: t.z, duration: ms ?? 800, ease: 'Sine.inOut' });
  }

  private camTransform(): { x: number; y: number; z: number } {
    return this.camT;
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
        this.hops.set(m.id, hop);
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
    const size = mv?.tex ? stageSize(mv.tex) : undefined;
    if (mv?.tex && size) h = size[1] * actorScale(mv.tex, mv.scale ?? this.base.get(id) ?? 1, k, size[1]);
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
    // 標點不放行首（「今年打幾隻／？我賭十隻」）：寬一點或窄一點再換一次
    body.setWordWrapWidth(wrapWidth(BUBBLE_W - 40, BUBBLE_W, 28, (w) => {
      body.setWordWrapWidth(w, true);
      return body.getWrappedText();
    }), true);
    // 第三章：泡泡左邊放說話者的立繪小頭像（表情照原台詞）
    const face = this.faceKey(beat);
    this.hasFace = !!face;
    const fw = face ? FACE + 14 : 0;
    const bw = Math.max(150, body.width + 40 + fw);
    const bh = Math.max(body.height, face ? FACE : 0) + 32;
    const { x: bx, y: by, tipX, tipY } = bubbleBox(p.x, p.y, bw, bh, this.L, this.H, this.plaqueBox());
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(4, 6, bw, bh, 18);
    g.fillStyle(C.paper, 1);
    g.fillRoundedRect(0, 0, bw, bh, 18);
    g.fillTriangle(tipX - bx - 14, bh - 2, tipX - bx + 14, bh - 2, tipX - bx, tipY - by);
    const demon = beat.who === 'shiju' || beat.who === 'heichao' || beat.who === 'jiao' || beat.who === 'zhizha' || beat.who === 'xiabing';
    g.lineStyle(3, demon ? 0x6a3a9a : C.temple, 1);
    g.strokeRoundedRect(0, 0, bw, bh, 18);
    body.setPosition(20 + fw, 16);
    const parts: Phaser.GameObjects.GameObject[] = [g, body];
    if (face) parts.push(portraitThumb(scene, face, 16, 16, FACE));
    if (name) parts.push(txt(scene, 14, -20, name, 20, C.gold, { serif: true, backgroundColor: '#17121f', padding: { x: 10, y: 3 } }));
    const c = scene.add.container(bx, by, parts).setDepth(450);
    if (instant) c.setAlpha(1);
    else {
      c.setAlpha(0).setScale(0.85);
      scene.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 220, ease: 'Back.out', delay: 120 });
    }
    // 「下一句」的 ▼ 放泡泡右下角外面；會壓到匾額就改放泡泡右邊（修正第 2 輪）
    const pq = this.plaqueBox();
    const under = { x: bx + bw - 24, y: by + bh + 4, w: 18, h: 22 };
    const hitPlaque = pq && under.x < pq.x + pq.w && pq.x < under.x + under.w && under.y < pq.y + pq.h && pq.y < under.y + under.h;
    const hint = hitPlaque && bx + bw + 24 <= W ? this.hint(bx + bw + 22, by + bh - 26, instant) : this.hint(bx + bw - 6, by + bh + 4, instant);
    this.ui.push(c, hint);
  }

  /**
   * 廟的匾額在畫面上的位置（程式畫的廟：art/backdrop.ts 的 makeTemple，760×400 圖裡 (280, 162)～(480, 196)）；
   * 泡泡要讓開，匾上的廟名要完整露出來。沒有廟就不用讓。
   */
  private plaqueBox(): { x: number; y: number; w: number; h: number } | undefined {
    if (!this.temple) return undefined;
    const { x: ix, y: iy, scaleX: s } = this.temple;
    const a = this.toScreen(ix + (280 - 380) * s, iy - (400 - 162) * s);
    const b = this.toScreen(ix + (480 - 380) * s, iy - (400 - 196) * s);
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  }

  /** 泡泡旁邊的立繪小頭像（腳本有 faces、說話的人有立繪、圖已載到才有） */
  private faceKey(beat: StageBeat): string | undefined {
    if (!this.sc.faces || !beat.who || beat.who === 'narrator') return undefined;
    const art = ART[beat.who];
    if (!art) return undefined;
    const line = beat.src !== undefined ? CUTSCENES[this.sc.id]?.lines[beat.src] : undefined;
    return portraitKey(this.scene, art[0], (line?.expr ?? art[1]) as Expr);
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
    } else if (kind === 'river') {
      // 溪邊（第三章）：堤防下的河灘＋近處的蘆葦剪影（天亮偏土色，晚上偏暗）
      const night = this.sc.mood === 'demon';
      g.fillStyle(night ? 0x16161e : 0x3a362e, 1);
      g.fillRect(-100, foreTop, W + 200, bottom - foreTop);
      g.fillStyle(night ? 0x1e2028 : 0x4a4436, 1);
      for (let n = 0; n < 8; n++) g.fillEllipse(-20 + n * 110 + ((n * 31) % 30), foreTop + (30 + ((n * 47) % 4) * 22) * k, 120 * k, 26 * k);
      g.fillStyle(night ? 0x0a0a10 : 0x1c1a14, 1);
      for (let n = 0; n < 18; n++) {
        const x = n * 44 + ((n * 17) % 20);
        g.fillTriangle(x - 8, this.H + 10, x + 8, this.H + 10, x + ((n % 3) - 1) * 18, this.H - (90 + (n % 5) * 24) * k);
        // 蘆葦穗
        g.fillEllipse(x + ((n % 3) - 1) * 18, this.H - (96 + (n % 5) * 24) * k, 8 * k, 26 * k);
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
