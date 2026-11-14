/**
 * 最後一戰。戰鬥邏輯在 core/boss.ts，這裡負責畫出來。每一章的戰場不同：
 *  - 第一章：芝嶺巖惠澤宮廟埕，喚回石駒（打到煞氣歸零）。
 *  - 第二章：大鵬澳沙灘，護送王船出海（王船走到岸邊）；黑潮在海裡，觸手從沙裡伸出來拖船。
 *  - 第三章：疾水溪舊渡口，斬蛟或收蛟。浪頭預告、翻江水牆、拖人的水繩、五色營旗、五營合陣、
 *    太子出轎、乾坤圈、陣前審問第 3 輪的鏡頭特寫與太子全開。
 * 上方：戰場（1280×720 邏輯座標）整片縮小放進戰鬥帶。
 * 下方（BossHud）：目標進度、神轎（王船）、陣頭卡片（點一下換前排／後排）、主神的兩個法術、超渡技能、陣前審問。
 */
import Phaser from 'phaser';
import { C, H, W, FIELD_W as FW, FIELD_H as FH, GROUND_Y, TIME_SCALE } from '../theme';
import { BossBattle, CUE_TIME, FLAG_TIME, FRONT_MAX, FRONT_X, JIAO_CAMPS, JIAO_HOME, SKILLS, SPELLS, TIDE_X, type BossEvent, type JiaoCamp, type SkillId, type Unit } from '../core/boss';
import { CH } from '../content/chapter';
import { FULLPOWER_CUES3 } from '../content/ch3/finale';
import { BOSS_NIGHT_BG, CAMP_COLORS } from '../art/xinyingSpec';
import { CH4_FORD_BG } from '../art/baishadunSpec';
import { CHEER4, MEMBER_STATS4, chainVisual4, cheerLine4 } from '../content/ch4/finale';
import { slayBoss } from '../core/renown';
import { fitBattleArt } from '../art/xinyingBattle';
import { run } from '../state';
import { banter } from '../ui/banter';
import { BanterPicker } from '../core/banterPick';
import { button, floatText, fullscreenButton, panel, txt, type Button } from '../ui/widgets';
import type { BanterLine } from '../content/chapter';

/** 五營的名字（HUD 的營旗列） */
const CAMP_NAME: Record<JiaoCamp, string> = { east: '東', south: '南', west: '西', north: '北', center: '中' };
/** 戰場上方五面營旗的位置（逐一立起）：放在溪面上空、月亮下面，不和左上角的互嗆字幕疊在一起 */
const FLAG_X = [760, 840, 920, 1000, 1080];
/** 營旗旗竿底的高度（插滿時旗竿高 FLAG_POLE） */
const FLAG_BASE = 250;
const FLAG_POLE = 150;
/** 第三章：前排①在畫面上的位置、前排每格在畫面上拉開多少（只改畫的位置，戰鬥邏輯照 core/boss.ts） */
const SHOW_FRONT0 = 620;
const SHOW_GAP = 90;
/** 太子出轎時，我方整排往左讓多少（太子站在前排①前面、蛟頭左邊） */
const SHOW_TAIZI_ROOM = 70;

/**
 * 第四章戰鬥圖（b4_*，520×420）：暫代與正式圖都縮到指定的顯示高度（寬照比例）。
 * 正式圖載完 AssetScene 會換貼圖，sync 每幀再算一次。
 */
function fitFord(img: Phaser.GameObjects.Image, h: number): void {
  const src = img.texture.getSourceImage() as { height: number };
  if (src.height > 0) img.setScale(h / src.height);
}

export const BAND_Y = 132;
/** 陣前審問動畫的長度（滑出結束）；互嗆等它播完才插嘴 */
export const TRIAL_ANIM_MS = 4500;
/** 第四章陣前審問：魔王那句右邊留給印章的寬度（印章中心 x = W − 90、寬約 84，再留 4px） */
export const TRIAL_STAMP_ROOM = 112;
const ZOOM = W / FW;
export const BAND_H = Math.round(FH * ZOOM);
const BIG = 1.6;

interface View {
  c: Phaser.GameObjects.Container;
  imgs: Phaser.GameObjects.Image[];
  hp: Phaser.GameObjects.Graphics;
  phase: number;
}

/** 柳將軍射斷水繩時箭從哪裡飛出（後排） */
const BACK_X_LIU = 380;
/** 第三章：程式畫的神轎在夜景裡略調暗 */
const PAL_TINT = 0xc8c0d8;

export class BossScene extends Phaser.Scene {
  battle!: BossBattle;
  hud!: BossHud;
  speed = 1;
  private views = new Map<number, View>();
  private palImg!: Phaser.GameObjects.Image;
  private palHp!: Phaser.GameObjects.Graphics;
  private ropes!: Phaser.GameObjects.Graphics;
  private waveImg?: Phaser.GameObjects.Image;
  private fire: Phaser.GameObjects.Image[] = [];
  private scroll: Phaser.GameObjects.TileSprite[] = [];
  private lastProg = 0;
  private t = 0;
  private over = false;
  /** 第三章：五面營旗、水繩、太子全開的光 */
  private flagG?: Phaser.GameObjects.Graphics;
  private lastCombo = 0;
  /** 0–1：太子出轎時我方往左讓位（慢慢滑過去，不要瞬間跳） */
  private tzShift = 0;
  /** 第四章：蓋住整個戰場的霧（霧起時變濃） */
  private fogRect?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('boss');
  }

  get escort(): boolean {
    return this.battle.mode === 'escort';
  }

  get jiao(): boolean {
    return this.battle.mode === 'jiao';
  }

  /** 第四章・渾水溪・茫渡 */
  get ford(): boolean {
    return this.battle.mode === 'ford';
  }

  create(): void {
    this.views = new Map();
    this.over = false;
    this.speed = 1;
    this.t = 0;
    this.fire = [];
    this.scroll = [];
    this.lastProg = 0;
    this.lastCombo = 0;
    this.tzShift = 0;
    this.waveImg = undefined;
    this.flagG = undefined;
    this.battle = new BossBattle(CH().finale.setup(run));
    this.cameras.main.setViewport(0, BAND_Y, W, BAND_H).setZoom(ZOOM).centerOn(FW / 2, FH / 2);
    this.cameras.main.fadeIn(500, 10, 8, 18);
    this.fogRect = undefined;
    if (this.ford) this.drawFord();
    else if (this.escort) this.drawBeach();
    else if (CH().look === 'plain') this.drawRiver();
    else this.drawBackground();
    const glow = this.add.circle(this.battle.palanquin.x, GROUND_Y - 80, 110, 0xffd76a, 0.12).setDepth(5);
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.22, duration: 1300, yoyo: true, repeat: -1 });
    if (this.ford) {
      // 第四章：要顧的不是轎（轎子先過去了），是還在水裡的隊伍——畫成人鏈（b4_renlian）
      this.palImg = this.add.image(this.battle.palanquin.x, GROUND_Y + 20, 'b4_renlian').setOrigin(0.5, 1).setDepth(18);
      fitFord(this.palImg, 240);
      this.fordCrossing();
      this.fordChainVisual();
    } else if (this.escort) {
      this.palImg = this.add.image(this.battle.palanquin.x + 10, GROUND_Y + 14, 'wangchuan').setOrigin(0.5, 1).setScale(0.95).setDepth(18);
    } else {
      const key = CH().look === 'plain' ? 'w3_palanquin' : 'palanquin';
      if (CH().look === 'plain') this.palOutline(key);
      this.palImg = this.add.image(this.battle.palanquin.x, GROUND_Y + 10, key).setOrigin(0.5, 1).setScale(0.78 * BIG).setDepth(20);
      if (CH().look === 'plain') this.palImg.setTint(PAL_TINT);
    }
    this.palHp = this.add.graphics().setDepth(210);
    this.ropes = this.add.graphics().setDepth(19);
    this.add.rectangle(0, 0, FW, FH, this.escort ? 0x1a2a6a : 0x3a1a6a, 0.16).setOrigin(0).setDepth(200).setBlendMode(Phaser.BlendModes.MULTIPLY);
    // 前排的位置標示
    const g = this.add.graphics().setDepth(-60);
    g.fillStyle(0xd23a2a, 0.12);
    if (this.jiao) g.fillRect(this.showX(FRONT_X[2]) - 60, GROUND_Y - 60, this.showX(FRONT_X[0]) - this.showX(FRONT_X[2]) + 120, 90);
    else g.fillRect(500, GROUND_Y - 60, 170, 90);
    if (this.jiao) this.flagG = this.add.graphics().setDepth(190);
    this.scene.launch('bosshud', { boss: this });
    this.events.once('shutdown', () => this.scene.stop('bosshud'));
  }

  /**
   * 第三章：我方在畫面上的 x。正式戰鬥圖比暫代圖寬，照邏輯位置畫會擠成一團，所以前排三格拉開
   * （SHOW_GAP）、後排往神轎靠一點；太子出轎站在前排①前面。只改畫的位置，打不打得到照 core/boss.ts。
   */
  showX(x: number, taizi = false): number {
    if (!this.jiao) return x;
    if (taizi) return x - 25;
    const room = SHOW_TAIZI_ROOM * this.tzShift;
    const front = FRONT_X[0] - FRONT_X[1];
    if (x >= FRONT_X[2]) return SHOW_FRONT0 + (x - FRONT_X[0]) * (SHOW_GAP / front) - room;
    // 後排離前排越遠讓得越少（最少 4 成），不要擠到神轎上
    const k = Phaser.Math.Clamp(0.4 + ((x - (FRONT_X[2] - 100)) / 100) * 0.6, 0.4, 1);
    return SHOW_FRONT0 - 2 * SHOW_GAP - (FRONT_X[2] - x) * 0.6 - room * k;
  }

  /** 第三章：程式畫的神轎放在正式夜景上，加腳下影子和深色描邊（正式神轎圖還沒有） */
  private palOutline(key: string): void {
    const x = this.battle.palanquin.x;
    this.add.ellipse(x, GROUND_Y + 8, 250, 36, 0x000000, 0.45).setDepth(19);
    for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) {
      this.add.image(x + dx, GROUND_Y + 10 + dy, key).setOrigin(0.5, 1).setScale(0.78 * BIG).setTintFill(0x07060e).setAlpha(0.85).setDepth(19.5);
    }
  }

  private drawBackground(): void {
    const sky = this.add.graphics().setDepth(-100);
    sky.fillGradientStyle(0x0b0a1c, 0x0b0a1c, 0x231d40, 0x231d40, 1);
    sky.fillRect(0, 0, FW, GROUND_Y);
    this.add.circle(FW * 0.12, 110, 40, 0xfff3c4, 0.85).setDepth(-99);
    this.add.tileSprite(0, GROUND_Y - 130, FW, 260, 'mtnFarN').setOrigin(0, 1).setDepth(-95);
    for (let i = 0; i < Math.ceil(FW / 240) + 1; i++) this.add.image(i * 240, GROUND_Y - 110, `ruralN${i % 2 === 0 ? 0 : 2}`).setOrigin(0, 1).setDepth(-92);
    this.add.image(this.battle.palanquin.x + 60, GROUND_Y - 80, 'temple_huize').setOrigin(0.5, 1).setScale(0.7).setDepth(-80).setTint(0xb8a0c0);
    const g = this.add.graphics().setDepth(-70);
    g.fillStyle(0x2a2632, 1);
    g.fillRect(0, GROUND_Y - 84, FW, FH - GROUND_Y + 84);
    g.lineStyle(1, 0x3a3444, 1);
    for (let y = GROUND_Y - 84; y < FH; y += 36) g.lineBetween(0, y, FW, y);
    for (let i = 0; i < Math.ceil(FW / 120); i++) {
      const l = this.add.image(30 + i * 120, 150 + Math.abs(Math.sin(i * 0.9)) * 18, 'lantern').setScale(0.7).setDepth(-60);
      this.tweens.add({ targets: l, angle: { from: -3, to: 3 }, duration: 1500 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  /**
   * 第三章：疾水溪舊渡口的夜（【暫代美術】程式畫）。遠方對岸與鐵橋、倒流的溪面、近岸護岸與蘆葦、
   * 岸邊插著五營旗竿與何伯的茶攤；太子殿在隊伍後面。jiao 模式用這個背景。
   * 正式的整張夜景（BOSS_NIGHT_BG）載到了就蓋在上面；還在載的話載完再蓋上。
   */
  private drawRiver(): void {
    const cover = () => this.riverNight();
    if (this.textures.exists(BOSS_NIGHT_BG)) cover();
    else {
      const on = (k: string) => { if (k === BOSS_NIGHT_BG) cover(); };
      this.game.events.on('artloaded', on);
      this.events.once('shutdown', () => this.game.events.off('artloaded', on));
    }
    const sky = this.add.graphics().setDepth(-100);
    sky.fillGradientStyle(0x050a16, 0x050a16, 0x1a2440, 0x1a2440, 1);
    sky.fillRect(0, 0, FW, GROUND_Y);
    this.add.circle(FW * 0.14, 100, 38, 0xfff3c4, 0.85).setDepth(-99);
    for (let i = 0; i < 30; i++) this.add.circle(Phaser.Math.Between(0, FW), Phaser.Math.Between(10, 220), 1.5, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8)).setDepth(-99);
    this.add.tileSprite(0, GROUND_Y - 170, FW, 200, 'x3_riverFarN').setOrigin(0, 1).setDepth(-95);
    const water = this.add.tileSprite(0, GROUND_Y - 88, FW, 90, 'x3_waterN').setOrigin(0, 1).setDepth(-94);
    // 溪水倒流（往右）
    this.tweens.add({ targets: water, tilePositionX: -4000, duration: 60000, repeat: -1 });
    this.add.tileSprite(0, GROUND_Y - 88, FW, 24, 'x3_leveeN').setOrigin(0, 1).setDepth(-93);
    // 右邊（蛟那邊）越來越暗
    const dark = this.add.graphics().setDepth(-90);
    for (let i = 0; i < 24; i++) {
      dark.fillStyle(0x020610, 0.025 * i);
      dark.fillRect(FW * 0.6 + i * 22, 0, 22, GROUND_Y - 60);
    }
    this.add.image(this.battle.palanquin.x - 40, GROUND_Y - 84, 'temple_taizi').setOrigin(0.5, 1).setScale(0.5).setDepth(-92).setTint(0x8a8ab0);
    this.add.tileSprite(0, GROUND_Y - 90, FW, FH - GROUND_Y + 90, 'x3_levroadN').setOrigin(0, 0).setDepth(-70);
    const props: [string, number][] = [['x3_reedsN', 20], ['x3_teastallN', 160], ['x3_flagpoleN', 430], ['x3_reedsN', 620], ['x3_stepsN', 820], ['x3_reedsN', 1060]];
    for (const [k, x] of props) this.add.image(x, GROUND_Y - 88, k).setOrigin(0, 1).setDepth(-65);
  }

  /** 正式夜景：整張蓋住程式畫的天空、對岸、溪面、護岸與路（太子殿與岸邊擺設圖裡已經有茶攤，不另外擺） */
  private riverNight(): void {
    // 放大 1.15 倍、往下推 60：圖裡的岸邊延伸到前排站的位置（x 500～670），蛟那邊才是溪面；月亮不會被切掉
    this.add.image(0, FH + 60, BOSS_NIGHT_BG).setOrigin(0, 1).setDisplaySize(FW * 1.15, FH * 1.15).setDepth(-64);
    // 右邊（蛟那邊）越來越暗
    const dark = this.add.graphics().setDepth(-63);
    for (let i = 0; i < 24; i++) {
      dark.fillStyle(0x020610, 0.015 * i);
      dark.fillRect(FW * 0.6 + i * 22, 0, 22, FH);
    }
  }

  /** 第二章：大鵬澳的夜。遠方是海和漁火，腳下是沙灘；王船往右走，沙灘往左捲 */
  private drawBeach(): void {
    const sky = this.add.graphics().setDepth(-100);
    sky.fillGradientStyle(0x050816, 0x050816, 0x1a1a44, 0x1a1a44, 1);
    sky.fillRect(0, 0, FW, GROUND_Y);
    this.add.circle(FW * 0.18, 100, 36, 0xfff3c4, 0.8).setDepth(-99);
    for (let i = 0; i < 40; i++) this.add.circle(Phaser.Math.Between(0, FW), Phaser.Math.Between(10, 240), 1.5, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8)).setDepth(-99);
    const sea = this.add.tileSprite(0, GROUND_Y - 70, FW, 200, 'seaFarN').setOrigin(0, 1).setDepth(-95);
    this.scroll.push(sea);
    // 右邊（海那邊）越來越暗：黑潮在那裡
    const dark = this.add.graphics().setDepth(-90);
    for (let i = 0; i < 24; i++) {
      dark.fillStyle(0x05040c, 0.025 * i);
      dark.fillRect(FW * 0.6 + i * 22, 0, 22, GROUND_Y - 60);
    }
    const sand = this.add.tileSprite(0, GROUND_Y - 84, FW, FH - GROUND_Y + 84, 'sandN').setOrigin(0, 0).setDepth(-70);
    this.scroll.push(sand);
    // 沿路的金紙堆與火把
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(80 + i * 230, GROUND_Y - 70, i % 2 ? 'torch' : 'jinzhi').setOrigin(0.5, 1).setDepth(-65).setScale(0.9);
      p.setData('scroll', true);
      if (i % 2) this.tweens.add({ targets: p, alpha: 0.7, duration: 300 + i * 40, yoyo: true, repeat: -1 });
    }
  }

  /**
   * 第四章：渾水溪的夜（【暫代美術】程式畫）：夜空、對岸、溪面、近岸淺灘、霧。
   * 正式的整張夜景 bg_ford.webp（1280×720，夜、霧、溪面、對岸一點粉紅）載到了就蓋在上面；還在載的話載完再蓋上。
   */
  private drawFord(): void {
    const cover = () => this.add.image(0, 0, CH4_FORD_BG).setOrigin(0).setDisplaySize(FW, FH).setDepth(-64);
    if (this.textures.exists(CH4_FORD_BG)) cover();
    else {
      const on = (k: string) => { if (k === CH4_FORD_BG) cover(); };
      this.game.events.on('artloaded', on);
      this.events.once('shutdown', () => this.game.events.off('artloaded', on));
    }
    const sky = this.add.graphics().setDepth(-100);
    sky.fillGradientStyle(0x060a14, 0x060a14, 0x1a2230, 0x1a2230, 1);
    sky.fillRect(0, 0, FW, GROUND_Y);
    this.add.circle(FW * 0.2, 96, 30, 0xfff3c4, 0.5).setDepth(-99);
    const g = this.add.graphics().setDepth(-90);
    // 對岸：一條暗暗的堤防
    g.fillStyle(0x10141c, 1);
    g.fillRect(0, GROUND_Y - 190, FW, 26);
    // 溪面：一整片，從對岸鋪到腳下
    g.fillGradientStyle(0x1a2a3a, 0x1a2a3a, 0x2a3a4a, 0x2a3a4a, 1);
    g.fillRect(0, GROUND_Y - 164, FW, FH - GROUND_Y + 164);
    g.lineStyle(2, 0x5a7a8a, 0.4);
    for (let y = GROUND_Y - 150; y < FH; y += 28) for (let x = ((y / 28) % 2) * 40; x < FW; x += 110) g.lineBetween(x, y, x + 50, y);
    // 近岸淺灘（人站的地方）
    g.fillStyle(0x3a4a52, 0.55);
    g.fillRect(0, GROUND_Y - 70, FW, 100);
    // 茫渡那邊（右）越來越濃的霧
    const dark = this.add.graphics().setDepth(-63);
    for (let i = 0; i < 24; i++) {
      dark.fillStyle(0xc8d0d8, 0.012 * i);
      dark.fillRect(FW * 0.55 + i * 24, 0, 24, FH);
    }
    // 整片霧：霧起時變濃（sync）
    this.fogRect = this.add.rectangle(0, 0, FW, FH, 0xd8e0e8, 1).setOrigin(0).setDepth(190).setAlpha(0.08);
  }

  /**
   * 第四章開場：轎子（st_jiao4_ford）先過溪，越走越遠，最後只剩對岸一點粉紅色。
   * 之後戰場上沒有轎（轎、頭旗、香擔都不是可以點的東西，也不在戰鬥裡）。
   */
  private fordCrossing(): void {
    const far = { x: FW - 150, y: GROUND_Y - 186 };
    const jiao = this.add.image(320, GROUND_Y - 20, 'st_jiao4_ford').setOrigin(0.5, 1).setDepth(-80).setScale(0.55);
    const dot = this.add.circle(far.x, far.y - 6, 7, 0xf29ab8, 0).setDepth(-62);
    this.tweens.add({
      targets: jiao, x: far.x, y: far.y, scale: 0.08, duration: 4200, ease: 'Sine.inOut',
      onComplete: () => {
        jiao.destroy();
        dot.setFillStyle(0xf29ab8, 0.95);
        this.tweens.add({ targets: dot, alpha: 0.45, duration: 1100, yoyo: true, repeat: -1 });
      },
    });
  }

  /**
   * 第四章：人鏈越長，畫面越熱鬧（作者定案：「越多人只是畫面特效越多而已」）——
   * 堤防上多幾盞手機的燈、水裡多幾個牽手的人影。只是畫面，不碰戰鬥（content/ch4/finale.ts 的 chainVisual4）。
   */
  private fordChainVisual(): void {
    const { figures, lights } = chainVisual4(this.battle.setup.ford?.chain ?? 0);
    for (let i = 0; i < lights; i++) {
      const lx = 30 + ((i * 97) % Math.round(FW * 0.5));
      const ly = GROUND_Y - 184 + ((i * 7) % 12);
      const l = this.add.circle(lx, ly, 3, 0xfff3c4, 0.85).setDepth(-61);
      this.tweens.add({ targets: l, alpha: 0.3, duration: 700 + ((i * 131) % 900), yoyo: true, repeat: -1 });
    }
    // 人影排在兵馬後面（遠一點的水裡），不擋卡片和兵馬
    const g = this.add.graphics().setDepth(15);
    for (let i = 0; i < figures; i++) {
      const fx = 60 + i * 48;
      const fy = GROUND_Y - 110 + (i % 2) * 6;
      g.fillStyle(0x1a2230, 0.8);
      g.fillCircle(fx, fy - 62, 9);
      g.fillRoundedRect(fx - 9, fy - 52, 18, 52, 6);
      // 牽著旁邊的人
      if (i > 0) {
        g.lineStyle(3, 0x1a2230, 0.8);
        g.lineBetween(fx - 39, fy - 38, fx - 9, fy - 38);
      }
    }
    // 第 C3 輪：判對歸處的鬼來幫忙——只是畫面上的影子（淡藍、會晃），不上場、不碰戰鬥數值（setup.ford.ghosts）
    let shared = 0;
    (this.battle.setup.ford?.ghosts ?? []).forEach((id, i) => {
      const tex = MEMBER_STATS4[id]?.tex[0];
      if (!tex || !this.textures.exists(tex)) return;
      const img = this.add.image(FW * 0.5 - 90 - i * 110, GROUND_Y - 96, tex).setOrigin(0.5, 1).setDepth(16).setTint(0x9ad0ff).setAlpha(0.55);
      img.setScale(Math.min(1.4, 150 / Math.max(1, img.height)));
      this.tweens.add({ targets: img, alpha: 0.3, y: img.y - 6, duration: 1400 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      // 鬼影子喊頭旗加油（CHEER4）：開場錯開冒一次，之後每 8 秒左右再冒一下。只是畫面
      const line = cheerLine4(id, CHEER4.byId[id] ? 0 : shared++);
      this.ghostCheer(img.x, img.y - img.displayHeight - 14, line, 600 + i * 900);
    });
  }

  /** 第四章：鬼影子旁邊的小字（加油），delay 毫秒後第一次出現，之後約每 8 秒再出現一次 */
  private ghostCheer(x: number, y: number, line: string, delay: number): void {
    const t = txt(this, x, y, line, 30, 0xcfe8ff, { stroke: '#1d1726', strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(60).setAlpha(0);
    const show = (hold: number): void => {
      if (this.over || !t.active) return;
      this.tweens.killTweensOf(t);
      t.setAlpha(0).setY(y + 8);
      this.tweens.add({ targets: t, alpha: 0.9, y, duration: 350, ease: 'Cubic.out' });
      this.tweens.add({ targets: t, alpha: 0, delay: hold, duration: 600 });
    };
    this.time.delayedCall(delay, () => {
      show(3200);
      this.time.addEvent({ delay: 8000, loop: true, callback: () => show(1800) });
    });
  }

  ft(x: number, y: number, s: string, color: number, size = 26): void {
    floatText(this, x, y, s, color, Math.round(size * 1.7));
  }

  leave(key: string, data?: object, ms = 400): void {
    this.hud.cameras.main.fadeOut(ms, 10, 8, 18);
    this.cameras.main.fadeOut(ms, 10, 8, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('bosshud');
      this.scene.start(key, data);
    });
  }

  update(_t: number, dms: number): void {
    const dt = Math.min(0.05, dms / 1000);
    this.t += dt;
    if (!this.over) {
      const steps = this.speed * TIME_SCALE;
      for (let i = 0; i < steps; i++) this.battle.step(dt);
    }
    this.sync();
    this.handle(this.battle.drainEvents());
  }

  // ---------- 畫出單位 ----------
  private viewFor(uid: number, keys: string[], enemy: boolean, ghost = false): View {
    let v = this.views.get(uid);
    if (v) return v;
    const c = this.add.container(0, GROUND_Y + 10);
    const imgs = keys.map((k, i) => {
      const img = this.add.image((i - (keys.length - 1) / 2) * 34 * BIG, (i % 2) * 6, k).setOrigin(0.5, 1);
      const boss = k === 'shiju';
      const big = k === 'heichao';
      // 蛟的圖本來就面向左（隊伍那邊），不翻
      const jiao = k === 'jiao';
      // 第三章的正式戰鬥圖（太子、四將、蛟）縮到和暫代圖一樣大，sync 每幀依目前的貼圖再算一次
      const base = big ? 1.25 : jiao ? 0.8 : (enemy ? (boss ? 0.95 : 0.9) : 0.72) * BIG;
      img.setData('bs', base);
      // 蛟：頭在圖的左邊（錨點），身子在溪裡往右拖
      fitBattleArt(img, base);
      img.setFlipX(enemy && !big && !jiao && k !== 'chu' && !k.startsWith('b4_mangdu'));
      if (ghost) img.setTint(0x9ad0ff).setAlpha(0.8);
      img.setData('bx', img.x);
      return img;
    });
    const hp = this.add.graphics();
    c.add([...imgs, hp]);
    c.setDepth(enemy ? (keys[0] === 'heichao' ? 8 : 35) : 30);
    v = { c, imgs, hp, phase: Math.random() * 6 };
    this.views.set(uid, v);
    return v;
  }

  private sync(): void {
    const seen = new Set<number>();
    const b = this.battle;
    const F = CH().finale;
    this.ropes.clear();
    if (this.jiao) {
      const want = b.taiziOut ? 1 : 0;
      this.tzShift += Phaser.Math.Clamp(want - this.tzShift, -0.05, 0.05);
    }
    for (const u of b.units) {
      const st = F.members[u.key];
      const ghost = F.ghostMembers.includes(u.key);
      const v = this.viewFor(u.uid, st.tex, false, ghost);
      seen.add(u.uid);
      v.c.x = this.showX(u.x, u.taizi);
      let y = GROUND_Y + 10 + (u.row === 'back' ? -12 : 0);
      if (u.moving > 0) y -= Math.abs(Math.sin(this.t * 10 + v.phase)) * 8;
      const dragged = b.drag?.uid === u.uid;
      if (dragged) {
        // 被水繩拖著往溪邊滑
        v.c.x = this.showX(u.x) + Math.min(1, b.drag!.t / 3) * 120 + Math.sin(this.t * 30) * 4;
      }
      if ((u.sunk ?? 0) > 0) y += 40 + Math.sin(this.t * 3 + v.phase) * 4;
      v.c.y = y;
      for (const img of v.imgs) fitBattleArt(img, img.getData('bs'));
      v.c.setAlpha(u.alive ? ((u.sunk ?? 0) > 0 ? 0.5 : u.row === 'back' && u.moving <= 0 ? 0.85 : 1) : 0);
      for (const img of v.imgs) {
        if (u.flash > 0.5) img.setTintFill(0xffffff);
        else if ((u.sunk ?? 0) > 0) img.setTint(0x6a9ac8);
        else if (b.fullT > 0) img.setTint(Math.sin(this.t * 8) > 0 ? 0xffe8a0 : 0xffd060);
        // 第四章：被茫渡拉住的人變灰
        else if ((u.hold ?? 0) > 0) img.setTint(0x8aa0c0);
        else if (ghost) img.setTint(0x9ad0ff);
        else img.clearTint();
      }
      if (dragged && u.alive) {
        // 水繩：從溪裡伸出來纏住這個人
        this.ropes.lineStyle(7, 0x2a5a6a, 0.9);
        this.ropes.beginPath();
        this.ropes.moveTo(JIAO_HOME - 120, GROUND_Y - 70);
        this.ropes.lineTo((JIAO_HOME - 120 + v.c.x) / 2, GROUND_Y - 10 + Math.sin(this.t * 6) * 12);
        this.ropes.lineTo(v.c.x, y - 60);
        this.ropes.strokePath();
      }
      this.bar(v, u.alive && u.hp < u.maxHp, u.hp / u.maxHp, -240, 80, 0x6fe08a);
    }
    // 第三章：浪頭升起時蛟整條拱起來，蝦兵退到蛟後面、變淡，不擋住蛟
    const rising = this.jiao && (b.boss.state === 'paw' || b.boss.state === 'back' || b.boss.state === 'charge');
    const riseLeft = rising ? (this.views.get(b.boss.uid)?.imgs[0].getBounds().x ?? JIAO_HOME - 260) : FW;
    for (const e of b.enemies) {
      const boss = e === b.boss;
      const tex = this.ford ? (boss ? 'b4_mangdu' : 'b4_qianlu') : boss ? (this.escort ? 'heichao' : CH().look === 'plain' ? 'jiao' : 'shiju') : e.id;
      const v = this.viewFor(e.uid, [tex], true);
      seen.add(e.uid);
      v.c.x = e.x;
      let y = GROUND_Y + 10;
      if (boss && this.ford) {
        // 茫渡：霧裡的人影；喘息時現出渡船的樣子（b4_mangdu_boat）。霧起時退回霧裡、變淡
        const img = v.imgs[0];
        img.setTexture(e.state === 'breath' ? 'b4_mangdu_boat' : 'b4_mangdu');
        fitFord(img, 320);
        const away = e.state === 'back' || e.state === 'paw' || e.state === 'charge';
        v.c.y = GROUND_Y + 30 + Math.sin(this.t * 1.4) * 6;
        v.c.setAlpha(away ? 0.55 : 0.95);
        if (e.flash > 0.5) img.setTintFill(0xffffff);
        else if (e.state === 'breath') img.setTint(0xffd0b0);
        else if (e.state === 'paw') img.setTint(0xc8d8e8);
        else img.clearTint();
        continue;
      }
      if (boss && this.jiao) {
        // 蛟：退回溪裡、浪頭升起時整條拱起來（jiao_rise）；喘息時頭摔在岸上
        const rise = e.state === 'paw' || e.state === 'back' || e.state === 'charge';
        v.imgs[0].setTexture(rise ? 'jiao_rise' : 'jiao');
        fitBattleArt(v.imgs[0], v.imgs[0].getData('bs'));
        v.c.setDepth(rise ? 40 : 35);
        v.c.y = GROUND_Y + 40 + (e.state === 'breath' ? 24 : 0) + Math.sin(this.t * 1.6) * 6 - (e.state === 'paw' ? Math.min(1, e.stateTime / 2.5) * 30 : 0);
        for (const img of v.imgs) {
          if (e.flash > 0.5) img.setTintFill(0xffffff);
          else if (e.state === 'breath') img.setTint(0xffb0b0);
          else if (e.state === 'paw') img.setTint(0x9adfff);
          else img.clearTint();
        }
        continue;
      }
      if (boss && this.escort) {
        // 黑潮：浪頭升起時整團長高
        const rise = e.state === 'paw' ? Math.min(1, e.stateTime / 2.5) : e.state === 'charge' ? 1 : 0;
        v.c.y = GROUND_Y + 40 - rise * 60 + Math.sin(this.t * 1.5) * 6;
        v.c.setScale(1 + rise * 0.25);
        for (const img of v.imgs) img.setTint(e.state === 'paw' ? 0x9a8aff : e.state === 'breath' ? 0x5a6a8a : 0xffffff);
        continue;
      }
      if (e.id === 'chu') {
        // 觸手：在原地搖，拉一條繩子拖著王船
        for (const img of v.imgs) img.angle = Math.sin(this.t * 2.4 + v.phase) * 8;
        if (e.alive) {
          this.ropes.lineStyle(6, 0x1a1a3a, 0.85);
          this.ropes.beginPath();
          this.ropes.moveTo(e.x, GROUND_Y - 40);
          this.ropes.lineTo((e.x + b.palanquin.x) / 2, GROUND_Y + 10 + Math.sin(this.t * 3 + v.phase) * 10);
          this.ropes.lineTo(b.palanquin.x + 80, GROUND_Y - 30);
          this.ropes.strokePath();
        }
      } else if (!boss && e.id !== 'kui') y -= 10 + Math.sin(this.t * 3 + v.phase) * 6;
      if (e.state === 'charge') y -= Math.abs(Math.sin(this.t * 20)) * 12;
      if (e.state === 'paw') y -= Math.abs(Math.sin(this.t * 14)) * 6;
      if (e.state === 'breath') y += 8;
      v.c.y = y;
      for (const img of v.imgs) {
        if (e.flash > 0.5) img.setTintFill(0xffffff);
        else if (boss && e.state === 'breath') img.setTint(0xffb0b0);
        else if (boss && e.state === 'paw') img.setTint(0xff6a6a);
        else if (e.stun > 0) img.setTint(0xc8c8ff);
        else if (e.slow > 0) img.setTint(0xa8e0ff);
        else img.clearTint();
        if (e.id !== 'chu') img.angle = e.stun > 0 ? Math.sin(this.t * 20) * 8 : 0;
      }
      // 第四章：牽路仔群（b4_qianlu，520×420）縮到小妖的大小
      if (this.ford && !boss) fitFord(v.imgs[0], 130);
      if (this.jiao && !boss && e.alive) {
        // 蝦兵從右邊進場：停在畫面裡（右緣留 8）淡入，不要半隻出畫；浪頭升起時在蛟後面、變淡
        const hw = v.imgs[0].displayWidth / 2;
        const edge = FW - hw - 8;
        v.c.x = Math.min(e.x, edge);
        const enter = Phaser.Math.Clamp(1 - (e.x - edge) / 60, 0, 1);
        v.c.setAlpha(enter * (v.c.x + hw > riseLeft ? 0.4 : 1));
      }
      // 第三章的蝦兵血條放在腳下，不和蛟頭同高
      if (!boss) this.bar(v, e.alive && e.hp < e.maxHp, e.hp / e.maxHp, e.id === 'chu' ? -230 : this.jiao ? 4 : -140, 60, 0xd04aff);
      if (!e.alive && !v.c.getData('dying')) {
        v.c.setData('dying', true);
        this.tweens.add({ targets: v.c, alpha: 0, duration: 400 });
      }
    }
    for (const [uid, v] of this.views) {
      if (!seen.has(uid)) {
        v.c.destroy();
        this.views.delete(uid);
      }
    }
    // 捲浪
    if (b.wave) {
      if (!this.waveImg) this.waveImg = this.add.image(b.wave.x, GROUND_Y + 30, this.jiao ? 'x3_wave' : 'wave').setOrigin(0.3, 1).setDepth(60).setScale(this.jiao ? 1.1 : 1.2);
      this.waveImg.x = b.wave.x;
    } else if (this.waveImg) {
      const w = this.waveImg;
      this.waveImg = undefined;
      this.tweens.add({ targets: w, alpha: 0, scaleY: 0.3, duration: 400, onComplete: () => w.destroy() });
    }
    // 王船往前走：沙灘和海往左捲
    if (this.escort) {
      const d = (b.shipProg - this.lastProg) * 2600;
      this.lastProg = b.shipProg;
      if (d !== 0) {
        this.scroll[0].tilePositionX += d * 0.2;
        this.scroll[1].tilePositionX += d;
        for (const o of this.children.list) {
          const img = o as Phaser.GameObjects.Image;
          if (img.getData?.('scroll')) {
            img.x -= d;
            if (img.x < -100) img.x += 1380;
          }
        }
      }
      // 王船走路時微微搖晃
      this.palImg.y = GROUND_Y + 14 - (b.shipSpeed > 0 ? Math.abs(Math.sin(this.t * 4)) * 4 : 0);
      for (const f of this.fire) f.setAlpha(b.fireT > 0 ? 0.6 + Math.sin(this.t * 18 + f.x) * 0.3 : 0);
    }
    const p = b.palanquin;
    if (p.flash > 0.5) this.palImg.setTint(0xff8080);
    else if (CH().look === 'plain' && !this.escort) this.palImg.setTint(PAL_TINT);
    else this.palImg.clearTint();
    this.palHp.clear();
    const hy = this.escort ? GROUND_Y - 330 : GROUND_Y - 300;
    this.palHp.fillStyle(0x000000, 0.65);
    this.palHp.fillRoundedRect(p.x - 99, hy, 198, 24, 8);
    this.palHp.fillStyle(p.hp / p.maxHp > 0.35 ? 0xffd76a : 0xff5a4a, 1);
    this.palHp.fillRoundedRect(p.x - 95, hy + 4, 190 * Math.max(0, p.hp / p.maxHp), 16, 6);
    if (this.flagG) this.drawFlags();
    // 第四章：霧起時整片變濃
    if (this.fogRect) {
      const st = b.boss.state;
      const want = st === 'charge' ? 0.5 : st === 'paw' ? 0.12 + 0.38 * Math.min(1, b.boss.stateTime / 2.5) : b.lure ? 0.18 : 0.08;
      this.fogRect.setAlpha(this.fogRect.alpha + (want - this.fogRect.alpha) * 0.08);
      if (this.palImg.texture.key === 'b4_renlian') fitFord(this.palImg, 240);
    }
  }

  /** 第三章：戰鬥帶上方五面營旗，站前排的時間越久旗竿越高，插好了旗子展開 */
  private drawFlags(): void {
    const g = this.flagG!;
    const prog = this.battle.flagProgress;
    g.clear();
    JIAO_CAMPS.forEach((c, i) => {
      const x = FLAG_X[i];
      const base = FLAG_BASE;
      const f = prog[c];
      const top = base - FLAG_POLE * f;
      // 還沒插的旗位只畫地上的旗座（營色），旗竿照站前排的時間長高
      g.fillStyle(0x2a2230, 0.9);
      g.fillRect(x - 12, base - 4, 24, 10);
      g.fillStyle(CAMP_COLORS[c], 0.85);
      g.fillRect(x - 12, base - 4, 24, 3);
      if (f > 0.02) {
        g.fillStyle(0x8a6a3a, f >= 1 ? 1 : 0.75);
        g.fillRect(x - 3, top, 6, base - top);
      }
      if (f >= 1) {
        const wave = Math.sin(this.t * 5 + i) * 4;
        g.fillStyle(CAMP_COLORS[c], 1);
        g.beginPath();
        g.moveTo(x + 3, top);
        g.lineTo(x + 62, top + 20 + wave);
        g.lineTo(x + 3, top + 44);
        g.closePath();
        g.fillPath();
        g.lineStyle(3, 0xe9b949, 1);
        g.strokePath();
      }
    });
  }

  private bar(v: View, show: boolean, frac: number, top: number, w: number, color: number): void {
    v.hp.clear();
    if (!show) return;
    v.hp.fillStyle(0x000000, 0.6);
    v.hp.fillRect(-w / 2 - 2, top - 2, w + 4, 14);
    v.hp.fillStyle(color, 1);
    v.hp.fillRect(-w / 2, top, w * Math.max(0, frac), 10);
  }

  // ---------- 特效 ----------
  private handle(events: BossEvent[]): void {
    const esc = this.escort;
    for (const e of events) {
      // 第四章：茫渡的霧、學人講話、人鏈、喊名（其他事件照共用的處理）
      if (this.ford && this.fordEvent(e)) continue;
      switch (e.type) {
        case 'hit':
          if (e.weak) this.ft(e.x, GROUND_Y - 160, `${this.jiao ? (this.battle.setup.bellyWound ? '打下巴！' : '喘息！') : '打肚子！'}${e.dmg}`, 0xff8a8a, 24);
          break;
        case 'shot':
          this.shot(this.showX(e.fromX), e.toX, e.kind);
          break;
        case 'quake':
          this.ring(e.x, e.r, 0xe9b949);
          this.hud.chat('b_quake');
          break;
        case 'chain': {
          const g = this.add.graphics().setDepth(68);
          g.lineStyle(4, 0xc8c8d8, 1);
          g.lineBetween(e.fromX, GROUND_Y - 60, e.toX, GROUND_Y - 60);
          this.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
          this.hud.chat('b_chain');
          break;
        }
        case 'block':
          this.ft(this.showX(e.x), GROUND_Y - 150, '格擋', 0xbfe0ff, 22);
          break;
        case 'heal':
          this.ft(this.showX(e.x), GROUND_Y - 170, `+${e.amount}`, 0x8ff0a4, 22);
          break;
        case 'die':
          if (e.ally) {
            this.ft(this.showX(e.x), GROUND_Y - 200, `${e.name}倒下了`, 0xff8a8a, 26);
            this.hud.toast(`${e.name}倒下了`, 0xff8a8a);
            this.hud.chat('b_down');
          }
          break;
        case 'paw':
          this.cameras.main.shake(300, 0.003);
          this.hud.toast(this.jiao ? '蛟退回溪裡，浪頭升起來了！要翻江：讓北營廉將軍站前排（傷害減半）、血少的退下' : esc ? '黑潮的浪頭升起來了！馬上要捲浪：血少的退到後排' : '石駒刨地！馬上要衝鋒：血少的退到後排', 0xff6a6a, 2600);
          this.hud.chat(this.jiao ? 'b_wave' : 'b_paw');
          break;
        case 'charge':
          this.cameras.main.shake(500, 0.008);
          this.hud.chat('b_charge');
          break;
        case 'breath':
          if (this.jiao) {
            this.hud.toast(this.battle.setup.bellyWound ? '渡伯：「牠喘氣的時候下巴露出來，就打那裡！」' : '蛟的頭摔在岸上喘氣：趁現在猛攻', 0xffd0d0, 2600);
            this.hud.chat('b_breath');
            break;
          }
          this.hud.toast(esc ? '退潮了：王船順著退潮走得快' : run.intel.bellyWound ? '石駒喘息中：打肚子的舊傷！把輸出推上前排' : '石駒喘息中：趁現在猛攻', 0xffd0d0, 2600);
          this.hud.chat('b_breath');
          break;
        case 'callout':
          if (esc || this.jiao) this.hud.toast(this.jiao ? '浪頭半路散了：蛟動搖了' : '浪頭半路散了', 0xfff3c4, 2400);
          else this.hud.toast(run.b.xiaoyun === 'invited' && !this.hud.usedCallout ? '小芸：「石駒，不要！」' : '石駒停了下來', 0xfff3c4, 2400);
          this.hud.usedCallout = true;
          break;
        case 'smite':
          this.lightning(e.x, e.r);
          break;
        case 'bless':
          this.ring(this.battle.palanquin.x, 260, 0x8ff0a4);
          break;
        case 'fire':
          this.flames(e.x0, e.x1);
          this.hud.toast('五王火：火牆擋在陣前', 0xffb04a);
          break;
        case 'decree':
          this.decree(e.x);
          if (e.id === 'chu') this.hud.toast('王令：觸手被押上王船，鬆手了', 0xffd76a);
          break;
        case 'grab':
          this.ring(e.x, 120, 0x5a5aaa);
          this.hud.toast('觸手從沙裡伸出來，拖住王船！（王令、五王火）', 0xb0b0ff, 2400);
          this.hud.chat('b_grab');
          break;
        case 'pushback':
          this.hud.toast('前排沒人：浪打上王船，往回推了一段', 0xff8a8a, 2400);
          this.hud.chat('b_shipLow');
          break;
        case 'palanquin':
          this.cameras.main.shake(120, 0.004);
          break;
        case 'trial':
          this.hud.trial(e.round);
          break;
        case 'skill':
          if (e.id === 'huichun' || e.id === 'pingan') {
            this.ring(FW / 2 - 100, 420, 0x8ff0a4);
            this.hud.toast(e.id === 'pingan' ? '平安米：全隊回血' : '回春符：全隊回血', 0x8ff0a4);
          }
          if (e.id === 'hanshuang') {
            this.cameras.main.flash(300, 160, 220, 255);
            this.hud.toast('寒霜令：小妖都定住了', 0xa8e0ff);
          }
          if (e.id === 'zhensha') this.hud.toast('鎮煞鈴：石駒停了下來', 0xfff3c4, 2400);
          if (e.id === 'dingfeng') this.hud.toast('定風旗：浪頭散了', 0xfff3c4, 2400);
          if (e.id === 'baidu') {
            this.ring(JIAO_HOME - 200, 200, 0x9adfff);
            this.hud.toast('擺渡篙：渡伯的竹篙一撐，浪頭散了，蛟摔在岸上', 0xfff3c4, 2400);
          }
          if (e.id === 'qunya') {
            this.ducks(false);
            this.hud.toast('群鴨陣：鴨群衝到前排，替大家擋蛟的下一擊', 0xfff3c4, 2400);
          }
          if (e.id === 'shunfeng') {
            this.cameras.main.flash(200, 200, 230, 255);
            this.hud.toast('順風令：王船乘風走得飛快', 0xbfe8ff, 2400);
          }
          break;
        // ----- 第三章・蛟 -----（戰鬥中的提示字與渡伯、紙紮童的喊話是自行補的【待定】，計畫 §7 Q26）
        case 'drag':
          this.cameras.main.shake(200, 0.004);
          this.hud.toast(`水繩纏住了${e.name}，往溪裡拖！（柳將軍在後排會射斷）`, 0x9adfff, 2400);
          break;
        case 'cut':
          this.shot(this.showX(BACK_X_LIU), this.showX(e.x) + 90, 'flag');
          this.ft(this.showX(e.x) + 60, GROUND_Y - 200, '柳將軍：「中。」', 0xf4f2ea, 24);
          this.hud.chat('b_snipe');
          break;
        case 'paper':
          this.ft(this.showX(e.x) + 60, GROUND_Y - 200, '紙人替身被拖下去了', 0xf4e2b0, 24);
          this.hud.toast('紙紮童：「我的紙人借你！」', 0xf4e2b0);
          break;
        case 'sunk':
          this.ring(this.showX(e.x) + 120, 120, 0x2a5a6a);
          this.hud.toast(`${e.name}被拖進水裡！10 秒爬不上來`, 0xff8a8a, 2400);
          this.hud.chat('b_sunk');
          break;
        case 'flag':
          this.ft(FLAG_X[JIAO_CAMPS.indexOf(e.camp)] + 30, FLAG_BASE - FLAG_POLE - 20, `${CAMP_NAME[e.camp]}營旗插下`, CAMP_COLORS[e.camp] === CAMP_COLORS.north ? 0xc8c8d8 : CAMP_COLORS[e.camp], 24);
          this.cameras.main.shake(80, 0.003);
          this.hud.chat('b_flag');
          break;
        case 'formation':
          this.formation();
          this.hud.chat('b_formation', true);
          break;
        case 'qiankun':
          this.qiankun();
          this.hud.chat('b_qiankun');
          break;
        case 'chujiao':
          this.chujiao();
          this.hud.chat('b_chujiao', true);
          break;
        case 'taiziBack':
          this.hud.toast('太子回轎了', 0xffd76a);
          this.hud.chat('b_back');
          break;
        case 'cover':
          this.ft(this.showX(e.x), GROUND_Y - 190, '章將軍擋下', 0x8fe0b0, 22);
          break;
        case 'combo':
          if (this.t - this.lastCombo > 1.2) {
            this.lastCombo = this.t;
            // 字放在角色頭頂上方（血條上面），不壓在太子身上
            this.ft(this.showX(e.x) + 40, GROUND_Y - 300, '合擊！', 0xff8a5a, 28);
            this.hud.chat('b_combo');
          }
          break;
        case 'duck':
          this.ducks(true);
          this.hud.toast('鴨群擋下了蛟！', 0xfff3c4);
          this.hud.chat('b_ducks', true);
          break;
        case 'fullpower':
          this.cameras.main.flash(500, 255, 220, 120);
          this.cameras.main.shake(400, 0.006);
          this.hud.fullPower(e.sec);
          break;
        case 'end':
          this.over = true;
          this.time.delayedCall(600, () => this.hud.finish(e.result));
          break;
      }
    }
  }

  /**
   * 第四章・茫渡的事件（處理了回傳 true）。提示字是系統說明；角色的話都放在互嗆（content/ch4/banter.ts 的 b_*，【待定】）。
   */
  private fordEvent(e: BossEvent): boolean {
    const b = this.battle;
    switch (e.type) {
      case 'paw':
        this.hud.toast('霧從下游漫上來了！要起霧：揮頭旗可以把霧打散', 0xc8d8e8, 2600);
        this.hud.chat('b_fog');
        return true;
      case 'charge':
        this.cameras.main.shake(300, 0.003);
        this.hud.toast('起霧了：前排都被拉住，霧裡有人在叫名字', 0xc8d8e8, 2400);
        return true;
      case 'breath':
        this.hud.toast(b.setup.bellyWound ? '霧散了，茫渡現出渡船的樣子：知道牠是擺渡的，打下去更痛' : '霧散了，茫渡現出渡船的樣子：趁現在猛攻', 0xffd0b0, 2600);
        this.hud.chat('b_boat');
        return true;
      case 'callout':
        this.hud.toast('霧起不來了：茫渡動搖了', 0xfff3c4, 2400);
        return true;
      case 'hold':
        this.ft(e.x, GROUND_Y - 190, '被拉住', 0xa8c0e0, 20);
        this.hud.chat('b_hold');
        return true;
      case 'lure':
        this.hud.toast(`霧裡學人講話，在叫「${e.name}」……他往下游走了幾步。（喊名可以馬上喊回來）`, 0xd8e0ff, 3000);
        this.hud.chat('b_lure', true);
        return true;
      case 'chainHold':
        this.ring(b.palanquin.x + 80, 160, 0xffd76a);
        this.ft(b.palanquin.x + 60, GROUND_Y - 260, `人鏈拉住了${e.name}`, 0xffd76a, 24);
        this.hud.toast(`前兩天幫過的人下水牽住了「${e.name}」。人鏈還剩 ${e.left} 段`, 0xffd76a, 2600);
        // 人鏈的台詞（7-3）一段一段播；播完了才是一般的 b_chainHold
        this.hud.chainNext();
        return true;
      case 'called':
        this.ft(b.palanquin.x + 60, GROUND_Y - 260, `${e.name}回來了`, 0x9fe8c0, 24);
        this.hud.toast(`押尾喊了「${e.name}」的名字。他回頭了`, 0x9fe8c0, 2400);
        this.hud.chat('b_called');
        return true;
      case 'returned':
        // 沒有人鏈段數時：被叫的人自己走回來（一定回來）
        this.ft(b.palanquin.x + 60, GROUND_Y - 260, `${e.name}回來了`, 0x9fe8c0, 24);
        this.hud.toast(`「${e.name}」走了幾步，覺得那個聲音不對，自己走回來了`, 0x9fe8c0, 2400);
        return true;
      case 'huiqi':
        this.cameras.main.flash(200, 255, 240, 200);
        this.ring(FW / 2, 420, 0xffd76a);
        this.hud.toast('頭旗一揮：被拉住的都掙開了，牽路仔往後退', 0xffd76a, 2200);
        this.hud.chat('b_huiqi');
        return true;
      default:
        return false;
    }
  }

  private shot(from: number, to: number, kind: 'firecracker' | 'flag'): void {
    const color = this.escort ? (kind === 'flag' ? 0x8ff0c4 : 0xf2f0e6) : kind === 'firecracker' ? 0xff4a3a : 0x8ff0c4;
    const p = this.add.image(from, GROUND_Y - 70, 'spark').setTint(color).setDepth(70).setScale(1.4);
    this.tweens.add({
      targets: p, x: to, duration: 280,
      onUpdate: (tw) => (p.y = GROUND_Y - 70 - Math.sin(tw.progress * Math.PI) * 90),
      onComplete: () => p.destroy(),
    });
  }

  private ring(x: number, r: number, color: number): void {
    const g = this.add.circle(x, GROUND_Y - 20, 10, color, 0).setStrokeStyle(5, color, 0.9).setDepth(65);
    g.setScale(1, 0.35);
    this.tweens.add({ targets: g, radius: r, alpha: 0, duration: 450, onComplete: () => g.destroy() });
  }

  private lightning(x: number, r: number): void {
    this.cameras.main.flash(180, 200, 180, 255);
    const g = this.add.graphics().setDepth(260);
    g.lineStyle(8, 0xe8d8ff, 1);
    g.beginPath();
    g.moveTo(x, 0);
    for (let y = 40; y <= GROUND_Y; y += 40) g.lineTo(x + Phaser.Math.Between(-30, 30), y);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => g.destroy() });
    this.ring(x, r, 0xc8a0ff);
  }

  /** 五王火：一排火焰（五種顏色的王火） */
  private flames(x0: number, x1: number): void {
    for (const f of this.fire) f.destroy();
    this.fire = [];
    const colors = [0xffd76a, 0xff6a3a, 0xffffff, 0x8ff0a4, 0x9fd0ff];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / (n - 1);
      const f = this.add.image(x, GROUND_Y + 20, 'flame').setOrigin(0.5, 1).setTint(colors[i % 5]).setDepth(55).setScale(1.3, 1.6);
      this.fire.push(f);
    }
    this.cameras.main.flash(200, 255, 160, 80);
  }

  /** 五營合陣：五色光從五面旗射出，蓋滿全畫面 */
  private formation(): void {
    this.cameras.main.shake(600, 0.01);
    JIAO_CAMPS.forEach((c, i) => {
      const r = this.add.rectangle(i * (FW / 5), 0, FW / 5, FH, CAMP_COLORS[c], 0).setOrigin(0).setDepth(280).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: r, alpha: { from: 0, to: 0.55 }, duration: 220, delay: i * 90, yoyo: true, hold: 400, onComplete: () => r.destroy() });
      const beam = this.add.rectangle(FLAG_X[i], 0, 18, FH, CAMP_COLORS[c], 0.9).setOrigin(0.5, 0).setDepth(285);
      this.tweens.add({ targets: beam, x: this.battle.boss.x, scaleX: 3, alpha: 0, duration: 900, delay: i * 90, ease: 'Cubic.in', onComplete: () => beam.destroy() });
    });
    this.ft(FW / 2, 300, '五營合陣！', 0xffd76a, 48);
    this.hud.toast('五營合陣：蝦兵全清、蛟受重傷！旗子倒下，重新插旗', 0xffd76a, 3000);
  }

  /** 乾坤圈：從神轎飛出，掃過全場再飛回來 */
  private qiankun(): void {
    const ringImg = this.add.image(this.battle.palanquin.x, GROUND_Y - 160, 'x3_ring').setDepth(270).setScale(2);
    this.tweens.add({ targets: ringImg, angle: 1080, duration: 900 });
    this.tweens.add({
      targets: ringImg, x: FW - 80, duration: 450, ease: 'Quad.out', yoyo: true,
      onUpdate: (tw) => (ringImg.y = GROUND_Y - 160 + Math.sin(tw.progress * Math.PI) * 90),
      onComplete: () => ringImg.destroy(),
    });
    this.cameras.main.shake(160, 0.005);
    this.time.delayedCall(250, () => {
      for (const e of this.battle.enemies) if (e.id === 'xia') this.ring(e.x, 60, 0xffd76a);
    });
  }

  /** 太子出轎：踩著風火輪從轎裡衝出來 */
  private chujiao(): void {
    const tz = this.battle.taiziOut;
    const x = tz ? this.showX(tz.x, true) : this.battle.palanquin.x + 300;
    const trail = this.add.image(this.battle.palanquin.x, GROUND_Y - 10, 'x3_firetrail').setOrigin(0, 0.5).setDepth(40).setScale(1.5);
    this.tweens.add({ targets: trail, scaleX: (x - this.battle.palanquin.x) / 160, alpha: 0, duration: 700, onComplete: () => trail.destroy() });
    this.cameras.main.flash(200, 255, 120, 80);
    this.hud.toast('太子出轎！站滿 5 秒插中營旗；霄將軍在前排就合擊', 0xffb04a, 2600);
  }

  /** 鴨群：一排白鴨從左邊衝到前排（群鴨陣、陣前審問鴨母婆上前） */
  ducks(hit: boolean): void {
    for (let i = 0; i < 8; i++) {
      const d = this.add.image(-40 - i * 40, GROUND_Y + 20 - (i % 2) * 14, 'x3_duck').setDepth(45).setScale(2);
      this.tweens.add({
        targets: d, x: 700 + (i % 3) * 30, duration: 900 + i * 60, ease: 'Quad.out',
        onComplete: () => this.tweens.add({ targets: d, alpha: 0, delay: hit ? 100 : 1600, duration: 400, onComplete: () => d.destroy() }),
      });
    }
  }

  /** 陣前審問第 3 輪：鏡頭停在太子（轎）身上 2 秒，戰鬥不停 */
  closeUp(): void {
    const cam = this.cameras.main;
    const tz = this.battle.taiziOut;
    const x = tz ? this.showX(tz.x, true) : this.battle.palanquin.x;
    cam.pan(x, GROUND_Y - 160, 500, 'Sine.easeInOut');
    cam.zoomTo(ZOOM * 1.8, 500, 'Sine.easeInOut');
    this.time.delayedCall(500 + 2000, () => {
      cam.pan(FW / 2, FH / 2, 600, 'Sine.easeInOut');
      cam.zoomTo(ZOOM, 600, 'Sine.easeInOut');
    });
  }

  /** 王令：金光一閃，妖怪縮成一點飛向王船 */
  private decree(x: number): void {
    const s = this.add.image(x, GROUND_Y - 80, 'decree').setDepth(250).setScale(0.6).setAlpha(0.9);
    this.tweens.add({ targets: s, x: this.battle.palanquin.x + 60, y: GROUND_Y - 140, scale: 0.15, alpha: 0, duration: 700, ease: 'Cubic.in', onComplete: () => s.destroy() });
    this.ft(x, GROUND_Y - 220, '押上王船', 0xffd76a, 24);
  }
}

/** 最後一戰的操作面板 */
export class BossHud extends Phaser.Scene {
  private boss!: BossScene;
  usedCallout = false;
  private clock!: Phaser.GameObjects.Text;
  private moon!: Phaser.GameObjects.Arc;
  private bossBar!: Phaser.GameObjects.Graphics;
  private goalTxt!: Phaser.GameObjects.Text;
  private palBar!: Phaser.GameObjects.Graphics;
  private palTxt!: Phaser.GameObjects.Text;
  private frontTxt!: Phaser.GameObjects.Text;
  private toastTxt!: Phaser.GameObjects.Text;
  private cards: { uid: number; bg: Phaser.GameObjects.Graphics; bar: Phaser.GameObjects.Graphics; state: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text; x: number; y: number; w: number; h: number }[] = [];
  private skillBtns: { id: SkillId; btn: Button }[] = [];
  private spellBtns: Button[] = [];
  private spellFills: Phaser.GameObjects.Rectangle[] = [];
  private skillW = 300;
  private readonly moonX = 30;
  private moonW = W - 130;
  private ok = [false, false, false];
  /** 第三章：營旗列、全開的字幕 */
  private flagBar?: Phaser.GameObjects.Graphics;
  private flagBox = { x: 0, y: 0, w: 0, h: 0 };
  private cueBox?: Phaser.GameObjects.Container;
  private cueTxt?: Phaser.GameObjects.Text;
  private cueShown = -1;
  /** 戰鬥中的互嗆（兩組之間至少隔幾秒，不洗版） */
  private chatter = new BanterPicker(undefined);
  /** 第四章：人鏈一段一段出現時的台詞（還沒播的，一次播一組） */
  private chainQueue: BanterLine[][] = [];
  /** 第四章：只講一次的台詞已經講過的場合（FinaleDef.chatKey 用） */
  private chatSaid = new Set<string>();
  /** 第四章：陣前審問的對答、人鏈台詞播放中，這段時間不插一般的互嗆 */
  private quietUntil = 0;
  /** 第四章漏掉收尾 F-2：說不動茫渡的那段播過了 */
  private wrongFunPlayed = false;
  /** 第四章：正在播的陣前審問那一條（換輪時先清掉上一輪，不疊在一起） */
  private trialC?: Phaser.GameObjects.Container;
  /** 第四章：審問那一條還在的時候來的提示字，等它滑出再顯示（不疊在審問結果上） */
  private pendingToast?: [string, number, number];

  constructor() {
    super('bosshud');
  }

  /** 直接播一串台詞（陣前審問的對答、人鏈）：播的這段時間一般的互嗆不插嘴 */
  say(lines: BanterLine[], depth = 255): void {
    if (!lines.length) return;
    this.quietUntil = this.time.now + lines.length * 2200 + 800;
    banter(this, lines, BAND_Y + 34, depth, undefined, { alpha: 0.88, rows: 2 });
  }

  /** 第四章：人鏈又拉住一個人——播下一組人鏈台詞；播完了就照一般的互嗆 */
  chainNext(): void {
    const next = this.chainQueue.shift();
    if (next) this.say(next);
    else this.chat('b_chainHold');
  }

  private get battle(): BossBattle {
    return this.boss.battle;
  }

  create(data: { boss: BossScene }): void {
    this.boss = data.boss;
    this.boss.hud = this;
    this.cards = [];
    this.spellBtns = [];
    this.spellFills = [];
    this.ok = [false, false, false];
    this.usedCallout = false;
    this.flagBar = undefined;
    this.cueBox = undefined;
    this.cueTxt = undefined;
    this.cueShown = -1;
    this.chatter = new BanterPicker(CH().banter, 7000);
    this.chatSaid = new Set();
    this.quietUntil = 0;
    this.wrongFunPlayed = false;
    this.trialC = undefined;
    this.pendingToast = undefined;
    const F = CH().finale;
    // 第四章：人鏈的台詞（一段一段出現；一段都沒有就播「沒有人下水」那兩句）。開打的互嗆之後先播第一組，之後每拉住一個人播下一組
    this.chainQueue = F.chainLines?.(run) ?? [];
    const esc = this.battle.mode === 'escort';
    const jiao = this.battle.mode === 'jiao';
    const ford = this.battle.mode === 'ford';
    this.cameras.main.fadeIn(500, 10, 8, 18);
    // 互嗆：這一章有這個場合的台詞才播（第三章 key 都已存在，行為不變；第一、二章第 7 階段加上）
    // 第四章：開打前有說明卡（briefing），按了才開始，開打的互嗆、人鏈台詞也從那時候算
    const begin = (): void => {
      this.time.delayedCall(1500, () => this.chat('b_start', true));
      if (this.chainQueue.length) this.time.delayedCall(7000, () => this.chainNext());
    };
    txt(this, 24, 16, F.title, 30, C.gold, { serif: true });
    txt(this, 24, 58, F.place, 20, C.paper, { bold: false });
    this.clock = txt(this, W - 96, 34, '19:00', 30, C.paper).setOrigin(1, 0.5);
    this.add.rectangle(this.moonX, 106, this.moonW, 6, 0x3a3442).setOrigin(0, 0.5);
    txt(this, this.moonX + this.moonW + 10, 106, '雞啼', 20, C.gold).setOrigin(0, 0.5);
    this.moon = this.add.circle(this.moonX, 106, 12, 0xfff3c4);
    fullscreenButton(this);
    const fr = this.add.graphics();
    fr.lineStyle(3, C.gold, 0.8);
    fr.lineBetween(0, BAND_Y - 2, W, BAND_Y - 2);
    fr.lineBetween(0, BAND_Y + BAND_H + 1, W, BAND_Y + BAND_H + 1);
    txt(this, 10, BAND_Y + 8, esc ? '◀ 王船' : ford ? '◀ 人鏈・還在水裡的隊伍' : '◀ 神轎', 18, C.muted).setAlpha(0.8);
    txt(this, W - 10, BAND_Y + 8, F.bossFrom, 18, C.muted).setOrigin(1, 0).setAlpha(0.8);
    this.toastTxt = txt(this, W / 2, BAND_Y + BAND_H - 40, '', 24, 0xffffff, { align: 'center', stroke: '#1d1726', strokeThickness: 6, wordWrap: { width: W - 40, useAdvancedWrap: true } }).setOrigin(0.5).setDepth(50);

    const py = BAND_Y + BAND_H + 4;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1526, 0x1a1526, 0x0e0b16, 0x0e0b16, 1);
    bg.fillRect(0, py, W, H - py);
    let y = py + 16;
    txt(this, 24, y, esc ? '王船離沙灘' : jiao ? `${F.bossName}的力氣` : ford ? `${F.bossName}的霧` : '石駒的煞氣', 20, esc ? 0x9fd0ff : 0xd9b0ff);
    this.goalTxt = txt(this, 190, y, '', 19, C.muted, { bold: false });
    const sp = button(this, W - 90, y + 14, 140, 48, '速度 x1', () => {
      this.boss.speed = this.boss.speed === 1 ? 2 : 1;
      sp.setLabel(`速度 x${this.boss.speed}`);
    }, { size: 20, fill: 0x2a2236 });
    this.bossBar = this.add.graphics().setData('y', y + 32);
    y += 64;
    txt(this, 24, y, esc ? '王船船身' : ford ? '水裡的隊伍' : '神轎', 20, C.gold);
    this.palTxt = txt(this, W - 24, y, '', 18, C.paper, { bold: false }).setOrigin(1, 0);
    this.palBar = this.add.graphics().setData('y', y + 30);
    y += 62;
    this.frontTxt = txt(this, 24, y, '', 18, C.paper);
    if (jiao) {
      // 五面營旗的進度（和「前排 N／3」同一行，不多佔高度）：四將在前排連續站滿 5 秒、太子出轎站滿 5 秒
      const camps = this.battle.setup.jiao!.camps;
      const who = (c: JiaoCamp) => (Object.keys(camps).find((k) => camps[k] === c) ?? '');
      this.flagBox = { x: 130, y: y - 3, w: (W - 130 - 24) / 5, h: 28 };
      this.flagBar = this.add.graphics();
      JIAO_CAMPS.forEach((c, i) => {
        const k = who(c);
        const name = k === 'taizi' ? '太子' : (F.members[k]?.name.split('・')[1] ?? '').replace('將軍', '');
        txt(this, this.flagBox.x + i * this.flagBox.w + this.flagBox.w / 2, this.flagBox.y + this.flagBox.h / 2, `${CAMP_NAME[c]}營・${name}`, 16, C.paper, { stroke: '#1d1726', strokeThickness: 4 }).setOrigin(0.5).setDepth(3);
      });
    } else txt(this, W - 24, y + 2, '點卡片換前後排（走 2 秒）', 18, C.muted, { bold: false }).setOrigin(1, 0);
    y += 32;
    // 陣頭卡片：位置固定，方便點；卡片上標前排、後排
    const units = this.battle.units;
    const colW = (W - 48 - 16) / 2;
    const skills = this.battle.setup.skills;
    const cardH = Math.min(96, Math.floor((H - 210 - (skills.length ? 86 : 0) - y) / Math.ceil(units.length / 2)) - 10);
    units.forEach((u, i) => {
      const cx = 24 + (i % 2) * (colW + 16);
      const cy = y + Math.floor(i / 2) * (cardH + 10);
      const cardBg = this.add.graphics();
      const st = F.members[u.key];
      const icon = this.add.image(cx + 40, cy + cardH - 6, st.tex[0]).setOrigin(0.5, 1);
      icon.setScale(Math.min((cardH - 14) / icon.height, 64 / icon.width));
      if (F.ghostMembers.includes(u.key)) icon.setTint(0x9ad0ff);
      const name = txt(this, cx + 80, cy + 10, st.name, st.name.length > 6 ? 17 : 20, C.paper);
      const state = txt(this, cx + 80, cy + 36, '', 17, C.muted, { bold: false });
      const bar = this.add.graphics();
      const hit = this.add.rectangle(cx, cy, colW, cardH, 0xffffff, 0.001).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        if (this.battle.swap(u.uid)) this.cameras.main.flash(80, 255, 240, 200);
        else if (u.row === 'back' && this.battle.frontCount() >= FRONT_MAX) this.toast(`前排最多 ${FRONT_MAX} 個，先讓一個退下來`, 0xffd76a);
      });
      this.cards.push({ uid: u.uid, bg: cardBg, bar, state, name, x: cx, y: cy, w: colW, h: cardH });
    });

    // 主神的兩個法術
    const skillH = 110;
    const by = H - 24 - skillH / 2;
    this.skillW = (W - 48 - 24) / 2;
    const fills = [0x5a2a8a, 0x2f6f5a];
    const fillsEsc = [0x9a3a10, 0x8a6a10];
    ([0, 1] as const).forEach((i) => {
      const id = this.battle.spells[i];
      const x = i === 0 ? 24 + this.skillW / 2 : W - 24 - this.skillW / 2;
      const b = button(this, x, by, this.skillW, skillH, SPELLS[id].name, () => this.battle.cast(i), { size: 34, fill: (esc ? fillsEsc : fills)[i] });
      this.spellBtns.push(b);
      this.spellFills.push(this.add.rectangle(x - this.skillW / 2, by - skillH / 2, this.skillW, skillH, 0x000000, 0.45).setOrigin(0).setDepth(5));
      txt(this, x, by - skillH / 2 - 18, SPELLS[id].desc, 17, C.muted, { bold: false, align: 'center', wordWrap: { width: this.skillW, useAdvancedWrap: true } }).setOrigin(0.5);
    });
    // 超渡的鬼回報的技能
    this.skillBtns = [];
    if (skills.length) {
      const sy = by - skillH / 2 - 76;
      const sw = (W - 48 - 12 * (skills.length - 1)) / skills.length;
      txt(this, 24, sy - 60, '超渡亡魂，神威增長：', 18, 0xffd76a, { bold: false });
      skills.forEach((id, i) => {
        const btn = button(this, 24 + sw / 2 + i * (sw + 12), sy, sw, 60, SKILLS[id].name, () => this.battle.skill(id), { size: 22, fill: 0x7a5a10 });
        this.skillBtns.push({ id, btn });
      });
    }
    this.time.delayedCall(700, () => this.toast(esc
      ? '點陣頭卡片換前排／後排。觸手會拖住王船：用王令押走、五王火燒掉'
      : jiao ? '點卡片換前後排（走 2 秒）。四將輪流上前排站滿 5 秒插營旗，太子出轎插中營旗：五面插齊就是五營合陣。柳將軍留在後排才射得斷水繩'
        : ford ? '轎子先過溪了。茫渡不打人，牠拉住前排、起霧叫水裡的人：被拉住的換下來就掙開；有人往霧裡走就「喊名」；人鏈會幫忙牽，沒喊到的自己也會走回來'
          : '點陣頭卡片換前排／後排。前排挨打，後排近戰會回血：輪流上陣扛傷害', 0xfff3c4, 5200));
    if (jiao) {
      // 陣前審問第 3 輪的字幕（戰鬥帶中間，戰鬥不停）
      const cy = BAND_Y + BAND_H * 0.3;
      this.cueBox = this.add.container(0, 0).setDepth(820).setAlpha(0);
      const top = this.add.rectangle(0, BAND_Y, W, 40, 0x000000, 0.85).setOrigin(0);
      const bot = this.add.rectangle(0, BAND_Y + BAND_H - 40, W, 40, 0x000000, 0.85).setOrigin(0);
      this.cueTxt = txt(this, W / 2, cy, '', 26, 0xfff3c4, { align: 'center', serif: true, stroke: '#1d1726', strokeThickness: 6, wordWrap: { width: W - 60, useAdvancedWrap: true } }).setOrigin(0.5);
      this.cueBox.add([top, bot, this.cueTxt]);
    }
    // 第四章：開打前的說明卡（蓋在操作面板上，戰鬥先停著；轎子過溪的開場照樣在上面播）
    const brief = F.briefing;
    if (!brief) return begin();
    this.battle.paused = true;
    const c = this.add.container(0, 0).setDepth(900);
    const top = BAND_Y + BAND_H + 4;
    c.add(this.add.rectangle(0, top, W, H - top, 0x000000, 0.7).setOrigin(0).setInteractive());
    c.add(panel(this, 16, top + 24, W - 32, H - top - 48));
    c.add(txt(this, W / 2, top + 50, brief.title, 32, C.gold, { serif: true }).setOrigin(0.5, 0));
    c.add(txt(this, 44, top + 110, brief.text, 21, C.paper, { bold: false, lineSpacing: 10, wordWrap: { width: W - 88, useAdvancedWrap: true } }));
    c.add(button(this, W / 2, H - 110, 260, 76, '開始', () => {
      c.destroy();
      this.battle.paused = false;
      begin();
    }, { size: 28, fill: 0x8a1b14 }));
  }

  /** 第三章：陣前審問第 3 輪之後，依戰鬥時間播字幕（凡人的聲音只有請到奶嘴、陣頭跳完才有） */
  private updateCues(): void {
    const b = this.battle;
    if (!this.cueBox || !this.cueTxt) return;
    if (b.cueT < 0) {
      if (this.cueShown >= 0 && this.cueBox.alpha > 0 && !this.tweens.isTweening(this.cueBox)) this.tweens.add({ targets: this.cueBox, alpha: 0, duration: 400 });
      return;
    }
    const voices = { aling: run.b.aling === 'pacifier', akai: run.b.akai === 'danced' };
    const lines = FULLPOWER_CUES3.filter((c) => !c.voice || voices[c.voice]);
    const shown = lines.filter((c) => c.at <= b.cueT);
    if (shown.length - 1 === this.cueShown) return;
    this.cueShown = shown.length - 1;
    // 同一時間點的字幕（兩種凡人的聲音）一起顯示
    const last = shown[shown.length - 1];
    const now = shown.filter((c) => c.at === last.at);
    this.cueTxt.setText(now.map((c) => (c.who ? `${c.who}：${c.text}` : c.text)).join('\n'));
    this.cueTxt.setColor(last.who === '太子' ? '#ffd76a' : last.voice ? '#ffd0e0' : '#fff3c4');
    this.cueTxt.setAlpha(0);
    this.tweens.add({ targets: this.cueTxt, alpha: 1, duration: 250 });
    this.cueBox.setAlpha(1);
  }

  /** 第三章：太子全開 */
  fullPower(sec: number): void {
    if (this.cueBox) this.tweens.add({ targets: this.cueBox, alpha: 0, delay: 600, duration: 400 });
    this.toast(`太子全開！${sec} 秒：全員攻擊 ×1.5、法術冷卻 ×0.4、太子出轎可以再用`, 0xffd76a, 3200);
  }

  /** 互嗆（三章共用；第一、二章第 7 階段加上）：一句一行從右邊滑進戰鬥帶上方，不擋操作；10% 特寫字幕播放時不插嘴 */
  chat(key: string, force = false): void {
    if (this.cueBox && this.cueBox.alpha > 0) return;
    // 第四章：陣前審問的對答、人鏈台詞還在播
    if (this.time.now < this.quietUntil) return;
    // 第四章：有條件、只講一次的那幾組換場合（content/ch4/finale.ts 的 fordChatKey4）：
    // 'b_fog' → 'b_xianzai'（賢仔的車燈）、'b_lure' → 'b_xiuzhi'（橋上的鈴）／'b_lureChain'（人鏈出現以後茫渡那句）
    const k = CH().finale.chatKey?.(run, key, this.chatSaid, this.battle) ?? key;
    if (k !== key) this.chatSaid.add(k);
    const lines = this.chatter.pick(k, this.time.now, force || k !== key);
    // 字幕疊在戰場特效（飛過去的王令、旨意）上面、底色不透明，字不會被壓住；
    // 最多兩行（修正第 2 輪，Q26：第三句會疊到神轎／王船的血條），第三句來就把第一句收掉
    if (lines) banter(this, lines, BAND_Y + 34, 255, undefined, { alpha: 0.88, rows: 2 });
  }

  toast(s: string, color: number, ms = 1800): void {
    // 第四章：陣前審問那一條還在（半透明底），提示字會透出來疊在審問結果上：等它滑出再顯示
    if (this.trialC?.active) {
      this.pendingToast = [s, color, ms];
      return;
    }
    this.toastTxt.setText(s).setColor(`#${color.toString(16).padStart(6, '0')}`).setAlpha(1);
    this.tweens.killTweensOf(this.toastTxt);
    this.tweens.add({ targets: this.toastTxt, alpha: 0, delay: ms, duration: 400 });
  }

  update(): void {
    if (!this.boss?.battle) return;
    const b = this.battle;
    const esc = b.mode === 'escort';
    const hours = 19 + b.timeFrac * 10;
    this.clock.setText(`${String(Math.floor(hours) % 24).padStart(2, '0')}:${String(Math.floor(((hours % 1) * 60) / 10) * 10).padStart(2, '0')}`);
    this.moon.x = this.moonX + this.moonW * b.timeFrac;
    const bw = W - 48;
    const frac = esc ? b.shipProg : Math.max(0, b.boss.hp / b.boss.maxHp);
    const by = this.bossBar.getData('y') as number;
    this.bossBar.clear();
    this.bossBar.fillStyle(0x000000, 0.7);
    this.bossBar.fillRoundedRect(24, by - 2, bw, 22, 8);
    this.bossBar.fillStyle(esc ? 0x3a8ad0 : 0x9b3cff, 1);
    this.bossBar.fillRoundedRect(26, by, (bw - 4) * frac, 18, 6);
    // 陣前審問的刻度
    this.bossBar.fillStyle(0xffd76a, 1);
    for (const f of b.trialMarks) this.bossBar.fillRect(26 + (bw - 4) * f - 1, by - 4, 3, 26);
    if (b.mode === 'jiao') {
      const st = b.boss.state;
      const s = b.fullT > 0 ? `太子全開 ${Math.ceil(b.fullT)} 秒` : st === 'back' || st === 'paw' ? '浪頭升起：要翻江了！' : st === 'charge' ? '翻江！' : st === 'breath' ? '喘息中・猛攻' : b.taiziT > 0 ? `太子出轎 ${Math.ceil(b.taiziT)} 秒` : '';
      this.goalTxt.setText(s).setColor(st === 'paw' || st === 'back' || st === 'charge' ? '#ff9a8a' : '#9fe8c0');
      this.drawFlagBar();
      this.updateCues();
    }
    if (b.mode === 'ford') {
      // 第四章：人鏈還剩幾段（畫面計數）、霧裡有沒有人正被叫走
      const st = b.boss.state;
      const head = b.lure ? `霧在叫「${b.lure.name}」` : st === 'paw' ? '霧要起了' : st === 'charge' ? '霧裡' : st === 'breath' ? '現出渡船・猛攻' : '';
      this.goalTxt.setText(`${head ? `${head}　` : ''}人鏈 ${b.chainLeft} 段`).setColor(b.lure || st === 'charge' ? '#ff9a8a' : '#9fe8c0');
    }
    if (esc) {
      const g = b.grabbing;
      this.goalTxt.setText(b.windT > 0 ? '順風！' : g ? `被 ${g} 隻觸手拖住${b.shipSpeed <= 0 ? '，動不了' : ''}` : b.boss.state === 'breath' ? '退潮・走得快' : '前進中').setColor(g && b.windT <= 0 ? '#ff9a8a' : '#9fe8c0');
    }
    const p = b.palanquin;
    const py = this.palBar.getData('y') as number;
    this.palBar.clear();
    this.palBar.fillStyle(0x000000, 0.7);
    this.palBar.fillRoundedRect(24, py - 2, bw, 22, 8);
    this.palBar.fillStyle(p.hp / p.maxHp > 0.35 ? 0xffd76a : 0xff5a4a, 1);
    this.palBar.fillRoundedRect(26, py, (bw - 4) * Math.max(0, p.hp / p.maxHp), 18, 6);
    this.palTxt.setText(`${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`);
    this.frontTxt.setText(`前排 ${b.frontCount()}／${FRONT_MAX}`);
    for (const c of this.cards) this.drawCard(c, b.units.find((u) => u.uid === c.uid)!);
    for (const { id, btn } of this.skillBtns) {
      const cd = b.skillCd[id] ?? 0;
      btn.setEnabled(b.canSkill(id));
      const wait = id === 'zhensha' ? '（等衝鋒）' : id === 'dingfeng' ? '（等捲浪）' : id === 'baidu' ? '（等翻江）' : id === 'qunya' ? '（鴨群待命）' : '';
      btn.setLabel(cd > 0 ? `${SKILLS[id].name} ${Math.ceil(cd)}秒` : wait && !b.canSkill(id) ? `${SKILLS[id].name}${wait}` : SKILLS[id].name);
    }
    ([0, 1] as const).forEach((i) => {
      const id = b.spells[i];
      this.spellBtns[i].setEnabled(b.canSpell(i));
      this.spellFills[i].width = this.skillW * (b.spellCd[i] / SPELLS[id].cd);
      this.spellBtns[i].setLabel(id === 'chujiao' && b.taiziT > 0 ? `出轎中 ${Math.ceil(b.taiziT)}秒` : b.spellCd[i] > 0 ? `${SPELLS[id].name} ${Math.ceil(b.spellCd[i])}秒` : SPELLS[id].name);
    });
  }

  /** 第三章：營旗列（插好的整格上營色，還在站的依秒數填一部分） */
  private drawFlagBar(): void {
    if (!this.flagBar) return;
    const g = this.flagBar;
    const { x, y, w, h } = this.flagBox;
    const prog = this.battle.flagProgress;
    g.clear();
    JIAO_CAMPS.forEach((c, i) => {
      const bx = x + i * w + 3;
      g.fillStyle(0x000000, 0.6);
      g.fillRoundedRect(bx, y, w - 6, h, 6);
      const f = prog[c];
      if (f > 0) {
        // 北營黑色在深色底上看不清楚，營旗列用淺一點的灰黑
        g.fillStyle(c === 'north' ? 0x5a5a72 : CAMP_COLORS[c], f >= 1 ? 1 : 0.55);
        g.fillRoundedRect(bx, y, (w - 6) * f, h, 6);
      }
      g.lineStyle(2, f >= 1 ? 0xffd76a : 0x4a4256, 1);
      g.strokeRoundedRect(bx, y, w - 6, h, 6);
    });
  }

  private drawCard(c: BossHud['cards'][number], u: Unit): void {
    const front = u.moving > 0 ? u.targetRow === 'front' : u.row === 'front';
    const frac = u.alive ? u.hp / u.maxHp : 0;
    c.bg.clear();
    c.bg.fillStyle(!u.alive ? 0x1a1620 : front ? 0x3a1e22 : 0x1e2638, 1);
    c.bg.fillRoundedRect(c.x, c.y, c.w, c.h, 12);
    c.bg.lineStyle(3, !u.alive ? 0x3a3442 : front ? 0xd2503a : 0x4a6a9a, 1);
    c.bg.strokeRoundedRect(c.x, c.y, c.w, c.h, 12);
    let s = '';
    const bossName = CH().finale.bossName;
    const b = this.battle;
    const camp = b.setup.jiao?.camps[u.key];
    if (!u.alive) s = '倒下';
    else if (b.drag?.uid === u.uid) s = '被水繩拖向溪裡！';
    else if ((u.sunk ?? 0) > 0) s = `落水・${Math.ceil(u.sunk!)}秒爬不上來`;
    else if ((u.hold ?? 0) > 0 && u.moving <= 0) s = `被${bossName}拉住・換位掙開`;
    else if (camp && u.row === 'front' && u.moving <= 0 && !b.planted[camp]) s = `前排・插${CAMP_NAME[camp]}營旗 ${Math.min(FLAG_TIME, u.stand ?? 0).toFixed(1)}/${FLAG_TIME}`;
    else if (u.moving > 0) s = u.targetRow === 'front' ? '走上前排…' : '退回後排…';
    else if (u.row === 'front') s = `前排${'①②③'[u.slot] ?? ''}${u.slot === 0 && this.battle.mode !== 'escort' && !b.taiziOut ? `・${bossName}${b.mode === 'ford' ? '拉' : '打'}這個` : ''}`;
    else s = u.role === 'melee' ? (u.hp < u.maxHp ? '後排・回血中' : '後排・待命') : u.role === 'ranged' ? '後排・射擊中' : '後排・支援中';
    c.state.setText(s).setColor(!u.alive ? '#6a6070' : front ? '#ffb0a0' : '#a8c8ff');
    c.name.setAlpha(u.alive ? 1 : 0.4);
    c.bar.clear();
    const bx = c.x + 80;
    const bw = c.w - 96;
    const by = c.y + c.h - 22;
    c.bar.fillStyle(0x000000, 0.6);
    c.bar.fillRoundedRect(bx - 2, by - 2, bw + 4, 16, 6);
    c.bar.fillStyle(frac > 0.35 ? 0x6fe08a : 0xff8a5a, 1);
    c.bar.fillRoundedRect(bx, by, bw * frac, 12, 5);
  }

  // ---------- 陣前審問 ----------
  /**
   * 陣前審問：自動出示手上對得上的證據（或請人上前），戰鬥不暫停。
   * 戰鬥帶上方播一段動畫：魔王說話 → 證據卡飛入 → 結果。
   */
  trial(round: number): void {
    const F = CH().finale;
    const r = F.rounds[round - 1];
    // 依序找：到場的人 → 對得上的證據
    const person = (r.people ?? []).find((p) => p.test(run));
    const ev = r.evidence.find((id) => run.evidence.includes(id));
    const ok = !!person || !!ev;
    this.ok[round - 1] = ok;
    this.battle.answer(round, ok);
    if (this.battle.mode === 'jiao' && round === 3) {
      // 第三章 10%：不出示證據，鏡頭停在太子身上 2 秒，字幕連播（updateCues），CUE_TIME 秒後太子全開
      this.tweens.killTweensOf(this.toastTxt);
      this.toastTxt.setAlpha(0);
      this.boss.closeUp();
      this.cueShown = -1;
      const say = txt(this, 24, BAND_Y + 48, `${F.bossName}：${r.line}`, 23, 0xd9b0ff, { stroke: '#1d1726', strokeThickness: 6, wordWrap: { width: W - 48, useAdvancedWrap: true } }).setDepth(830);
      this.tweens.add({ targets: say, alpha: 0, delay: CUE_TIME * 1000 * 0.5, duration: 500, onComplete: () => say.destroy() });
      return;
    }
    if (person?.id === 'yamupo') this.boss.ducks(false);
    // 第四章：誰上前說動的記下來（斬的結局：第三輪押尾問過名字，押尾那句換掉）
    if (person) run.flags[`finale_${person.id}`] = true;
    // 審問動畫滑出後才插嘴（不疊在審問字幕上）。第四章：說動了就播那一輪的對答（共用的先播，再接上前的人或出示證據的那幾句）
    let talkLines = ok ? [...(r.sharedLines ?? []), ...((person ? person.lines : r.okLines) ?? [])] : [];
    // 第四章漏掉收尾 F-2（搞笑）：第一次說不動時茫渡自己找台階下（只播一次，不改數值）
    if (!ok && F.wrongLines?.length && !this.wrongFunPlayed) {
      this.wrongFunPlayed = true;
      talkLines = F.wrongLines;
    }
    if (talkLines.length) this.time.delayedCall(TRIAL_ANIM_MS, () => this.say(talkLines));
    else this.time.delayedCall(TRIAL_ANIM_MS, () => this.chat(ok ? 'b_trial' : 'b_trialMiss', true));
    const E = CH().evidence;
    const used = person ? { tag: '上前', name: person.label.replace('請', '').replace('上前', ''), say: person.say } : ev ? { tag: E[ev].kind, name: E[ev].name, say: E[ev].text } : null;
    const okText = person?.ok ?? r.ok;
    this.playTrial(round, `${F.bossName}：${r.line}`, used, ok ? `${okText}\n${r.effect}` : `手上沒有能說動牠的證據。\n${F.wrong}`, ok);
  }

  private playTrial(round: number, line: string, used: { tag: string; name: string; say: string } | null, result: string, ok: boolean): void {
    // 動畫期間先把提示字收起來，避免疊在一起
    this.tweens.killTweensOf(this.toastTxt);
    this.toastTxt.setAlpha(0);
    // 第四章（ford）：審問那一條的字不被印章、互嗆、上一輪蓋到（別章照舊）
    const ford = this.battle.mode === 'ford';
    if (ford) {
      // 上一輪還沒滑出（或滑出動畫還在播）：直接清掉，不疊在新一輪上（等著的提示字留給這一輪滑出後再放）
      const wait = this.pendingToast;
      this.pendingToast = undefined;
      this.trialC?.destroy();
      this.trialC = undefined;
      this.pendingToast = wait;
    }
    const c = this.add.container(0, 0).setDepth(800);
    const top = BAND_Y + 8;
    const h = BAND_H - 16;
    // 底：半透明黑幕從左滑入
    const bg = this.add.rectangle(0, top, W, h, 0x0a0614, 0.82).setOrigin(0);
    const edge = this.add.graphics();
    edge.lineStyle(3, C.gold, 0.9);
    edge.lineBetween(0, top, W, top);
    edge.lineBetween(0, top + h, W, top + h);
    const title = txt(this, 24, top + 14, `陣前審問　${round}／3`, 24, C.gold, { serif: true });
    // 第四章：右邊留出印章的位置（印章中心 x = W − 90，寬約 84），字換行在印章左邊
    const sayW = ford ? W - 48 - TRIAL_STAMP_ROOM : W - 48;
    const say = txt(this, 24, top + 54, line, 23, 0xd9b0ff, { wordWrap: { width: sayW, useAdvancedWrap: true } });
    const items: Phaser.GameObjects.GameObject[] = [bg];
    if (ford) {
      // 標題、茫渡那句後面墊不透明的底：後面的互嗆字幕（同一個場景、depth 255）、戰場飄字不會透出來疊在字上
      const sayBottom = say.y + say.height;
      items.push(this.add.rectangle(0, top, W, Math.max(sayBottom, BAND_Y + 34 + 2 * 38) + 8 - top, 0x0a0614, 1).setOrigin(0));
    }
    items.push(edge, title, say);
    c.add(items);
    c.x = -W;
    this.tweens.add({ targets: c, x: 0, duration: 260, ease: 'Cubic.out' });
    // 證據卡：從下方飛上來、放大、蓋章
    const card = this.add.container(W / 2, top + h + 120);
    const cw = W - 120;
    const ch = 120;
    // 第四章：茫渡那句換成三行時，卡片往下讓（不壓到字）
    const cardTop = ford ? Math.max(top + 110, say.y + say.height + 10) : top + 110;
    const g = this.add.graphics();
    g.fillStyle(used ? 0xeee0bd : 0x3a3442, 1);
    g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
    g.lineStyle(3, used ? 0xa3261c : 0x6a6070, 1);
    g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
    card.add(g);
    if (used) {
      card.add(txt(this, -cw / 2 + 18, -ch / 2 + 12, `【${used.tag}】${used.name}`, 22, 0xa3261c, { serif: true }));
      card.add(txt(this, -cw / 2 + 18, -ch / 2 + 46, used.say, 18, 0x2a1a10, { serif: true, lineSpacing: 3, wordWrap: { width: cw - 36, useAdvancedWrap: true } }));
    } else {
      card.add(txt(this, 0, 0, '（沒有證據）', 22, 0x9a8fae).setOrigin(0.5));
    }
    card.setScale(0.6).setAlpha(0);
    c.add(card);
    this.tweens.add({ targets: card, y: cardTop + ch / 2, scale: 1, alpha: 1, delay: 500, duration: 380, ease: 'Back.out' });
    // 結果：蓋章＋一行字
    const stamp = txt(this, W - 90, top + 96, ok ? '說動' : '無效', 30, ok ? 0x2f8f5a : 0xb3261e, { serif: true, backgroundColor: '#eee0bd', padding: { x: 8, y: 4 } }).setOrigin(0.5).setAngle(-12).setScale(2.4).setAlpha(0);
    const res = txt(this, 24, top + h - 70, result, 20, ok ? 0x9fe8c0 : 0xff9a8a, { lineSpacing: 4, wordWrap: { width: W - 48, useAdvancedWrap: true } }).setAlpha(0);
    c.add([stamp, res]);
    this.tweens.add({ targets: stamp, scale: 1, alpha: 1, delay: 1100, duration: 220, ease: 'Quad.in', onComplete: () => this.cameras.main.shake(120, 0.004) });
    this.tweens.add({ targets: res, alpha: 1, delay: 1300, duration: 300 });
    // 魔王的反應（戰場那邊）
    this.time.delayedCall(1200, () => {
      if (ok) this.boss.cameras.main.flash(250, 255, 240, 200);
      else this.boss.cameras.main.shake(300, 0.006);
      const bx = this.battle.mode === 'escort' ? TIDE_X - 120 : this.battle.boss.x;
      this.boss.ft(bx, GROUND_Y - 260, ok ? '動搖了' : '更兇了', ok ? 0xfff3c4 : 0xff6a6a, 34);
    });
    // 幾秒後滑出
    if (ford) {
      this.trialC = c;
      // 換輪時被清掉（destroy）也要把等著的提示字放出來
      c.once(Phaser.GameObjects.Events.DESTROY, () => {
        if (this.trialC === c) this.trialC = undefined;
        const p = this.pendingToast;
        this.pendingToast = undefined;
        if (p && !this.trialC && this.sys.isActive()) this.toast(...p);
      });
    }
    this.tweens.add({ targets: c, x: W, delay: TRIAL_ANIM_MS - 300, duration: 300, ease: 'Cubic.in', onComplete: () => c.destroy() });
  }

  // ---------- 結束 ----------
  finish(result: 'subdued' | 'lose' | 'dawn'): void {
    const F = CH().finale;
    const esc = this.battle.mode === 'escort';
    const m = this.add.container(0, 0).setDepth(950);
    m.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive());
    const x = 16;
    const pw = W - 32;
    if (result === 'subdued') {
      const last = this.ok[2];
      m.add(panel(this, x, 220, pw, 760));
      m.add(txt(this, W / 2, 260, F.winTitle, 36, C.gold, { serif: true }).setOrigin(0.5, 0));
      const wt = txt(this, x + 24, 320, F.judgeText ? `${F.winText}\n${F.judgeText}` : F.winText, 20, C.paper, { bold: false, lineSpacing: 6, wordWrap: { width: pw - 48, useAdvancedWrap: true } });
      m.add(wt);
      let yy = Math.max(380, wt.y + wt.height + 16);
      const fills: Record<string, number> = { recall: 0x2f6f5a, return: 0x4a3a6a, slay: 0x8a1b14 };
      for (const o of F.ends) {
        const why = o.needLast && !last ? '陣前審問最後一輪沒有說動牠' : o.needRound && !this.ok[o.needRound - 1] ? `陣前審問第 ${o.needRound} 輪沒有說動牠` : '';
        // 第四章的按鈕字比較長（「喚回：留在溪邊引路」）：按鈕放寬、字縮小
        const long = o.label.length > 5;
        const bw = long ? 230 : 170;
        const b = button(this, x + 20 + bw / 2, yy + 50, bw, 70, o.label, () => this.end(o.kind), { size: long ? 18 : o.label.length > 3 ? 20 : 24, fill: fills[o.kind] });
        b.setEnabled(!why);
        m.add(b);
        m.add(txt(this, x + 40 + bw, yy + 14, why ? `✕ ${why}` : o.desc, 17, why ? 0xff9a8a : C.paper, { bold: false, lineSpacing: 3, wordWrap: { width: pw - 60 - bw, useAdvancedWrap: true } }));
        yy += 130;
      }
      // 第四章：判決之前兵馬的那一組（蓋在黑幕上面）
      const judge = this.chatter.pick('b_judge', this.time.now, true);
      if (judge) this.time.delayedCall(400, () => this.say(judge, 960));
      return;
    }
    // 第四章（ford）一定贏，不會走到這裡（core/boss.ts 的 checkEnd）
    run.retries++;
    m.add(panel(this, x, 360, pw, 420));
    const lose = esc ? '王船被拖住了……' : this.battle.mode === 'ford' ? '水裡的隊伍被霧拉回去了……' : '神轎被衝破了……';
    m.add(txt(this, W / 2, 400, result === 'dawn' ? '雞啼・天亮了' : lose, 36, result === 'dawn' ? C.gold : 0xff8a8a, { serif: true }).setOrigin(0.5, 0));
    m.add(txt(this, x + 24, 470, result === 'dawn' ? F.dawnText : F.loseText, 20, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: pw - 48, useAdvancedWrap: true } }));
    m.add(button(this, W / 2, 700, 280, 72, '重整再戰', () => this.boss.leave('boss'), { size: 26, fill: 0x2f6f5a }));
  }

  private end(kind: 'recall' | 'return' | 'slay'): void {
    run.shijuEnd = kind;
    run.shijuJoined = kind === 'recall';
    // 斬魔王：第一、二章戾氣 +1；第三章（看斬的是誰）蛟是真惡，不加戾氣、威名 +1；第四章斬茫渡沒有懲罰（FinaleDef.slayFree）
    const F = CH().finale;
    if (kind === 'slay') slayBoss(run, CH(), F.slayFree);
    // 結局劇情 →（第三章：收營；第四章：回宮 → 開爐的黃曆 → 開爐）→ 信徒錄
    F.onEnd?.(run, this.battle, kind);
    const close = F.afterClose ?? { key: 'end' };
    const end = F.closeStory ? { key: 'story', data: { id: F.closeStory, next: close } } : close;
    const story = F.endStory?.[kind] ?? (kind === 'recall' ? F.recallStory : undefined);
    if (story) this.boss.leave('story', { id: story, next: end }, 800);
    else this.boss.leave(end.key, end.data, 800);
  }
}
