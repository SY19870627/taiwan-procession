import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { CUTSCENES, SPEAKERS, type Cutscene, type Line } from '../content/story';
import { SCARE_FLAG4, shouldScareTideng4 } from '../content/ch4/missed';
import { portraitKey } from '../art/portraits';
import { scareTideng4 } from '../ui/scare4';
import { STAGES } from '../content/stage';
import { fitBattleArt } from '../art/xinyingBattle';
import { Dialogue } from '../ui/dialogue';
import { StagePlayer } from '../ui/stage';
import { button, go, txt } from '../ui/widgets';
import { run } from '../state';

export interface StoryData {
  id: string;
  next?: { key: string; data?: object };
  /** 蓋在目前的畫面上播（第三章：紙紮童跪下）：播完回到原本暫停的場景 */
  overlay?: { caller: string; done: () => void };
  /** 強制播文字版（測試、對照用：網址 &text=1） */
  text?: boolean;
  /** 演出直接跳到第幾拍（從 0 算；截圖、驗收用：網址 &beat=N） */
  beat?: number;
  /** 開發用（截圖）：文字版直接從第一個有 Line.pre（jump scare）的那一句開始播（網址 &scare=1） */
  scare?: boolean;
}

/**
 * 把劇情蓋在目前的畫面上播，播完回到原本的場景（原場景先暫停，狀態不變）。
 * 找不到這段劇情就直接繼續。
 */
export function playStory(scene: Phaser.Scene, id: string, done: () => void): void {
  if (!CUTSCENES[id]) return done();
  scene.scene.launch('story', { id, overlay: { caller: scene.scene.key, done } } satisfies StoryData);
  scene.scene.pause();
}

/** 過場：妖怪視角是紫色調，廟裡是金色調 */
export class StoryScene extends Phaser.Scene {
  constructor() {
    super('story');
  }

  create(data: StoryData): void {
    const id = CUTSCENES[data.id] ? data.id : 'opening';
    const cs = CUTSCENES[id];
    const next = data.next ?? { key: 'title' };
    const overlay = data.overlay;
    if (overlay) this.scene.bringToTop();
    this.cameras.main.fadeIn(400, 10, 8, 18);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (!overlay) return go(this, next.key, next.data);
      this.cameras.main.fadeOut(300, 10, 8, 18);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.resume(overlay.caller);
        this.scene.stop();
        overlay.done();
      });
    };
    // 有演出腳本就播演出（沒有 &text=1 時）；播放器出錯就退回文字版
    // 有條件的句子（Line.when）不成立時，演出裡對應的那一拍也跳過（第四章入廟：秀枝稟報過才有的四句）
    const st = STAGES[id];
    // 依這一局多出來的群眾（第四章回宮／開爐：人鏈越長人越多）放在最前面＝站在所有人後面
    const sc = st && { ...st, actors: [...(st.crowd?.(run) ?? []), ...st.actors], beats: st.beats.filter((b) => { const l = b.src === undefined ? undefined : cs.lines[b.src]; return !l?.when || l.when(run); }) };
    if (sc && !data.text && !data.scare) {
      try {
        const player = new StagePlayer(this, sc, { onDone: finish, startBeat: data.beat });
        button(this, W - 90, 40, 120, 50, '略過 ▶▶', () => player.skip(), { size: 18, fill: 0x2a2236 }).setDepth(700);
        return;
      } catch (e) {
        console.warn('演出播放失敗，改播文字版', id, e);
        this.tweens.killAll();
        this.time.removeAllEvents();
        this.children.removeAll(true);
      }
    }
    this.playText(cs, finish, !!data.scare);
  }

  /** 第四章 jump scare（Line.pre）：一局一次，播過或條件不成立就直接出那一句 */
  private pre(id: NonNullable<Line['pre']>, done: () => void): void {
    if (id === 'scareTideng4') {
      if (!shouldScareTideng4(run)) return done();
      run.flags[SCARE_FLAG4.tideng] = true;
      const art = portraitKey(this, 'tideng', 'surprised') ?? portraitKey(this, 'tideng');
      return scareTideng4(this, art ?? SPEAKERS.tideng.tex, done);
    }
    done();
  }

  /** 文字版：背景＋立繪＋下方對話框 */
  private playText(cs: Cutscene, finish: () => void, scare = false): void {
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
    } else if (cs.bg === 'river') {
      // 第三章：疾水溪（對岸、溪面）。蛟在的時候溪水倒流（水紋往右），收服後恢復順流
      const n = cs.mood === 'dawn' ? '' : 'N';
      this.add.tileSprite(0, H * 0.5, W, 200, `x3_riverFar${n}`).setOrigin(0, 1).setAlpha(0.9);
      const river = this.add.tileSprite(0, H * 0.5, W, H * 0.5, `x3_water${n}`).setOrigin(0, 0).setAlpha(0.9);
      if (cs.mood === 'demon') fitBattleArt(this.add.image(W * 0.72, H * 0.62, 'jiao').setOrigin(0.5, 1).setAlpha(0.55).setTint(0x8a7aa0), 0.9, false);
      const flow = cs.mood === 'demon' ? -0.06 : 0.03;
      const tick = (_t: number, dms: number) => { river.tilePositionX += dms * flow; };
      this.events.on('update', tick);
      this.events.once('shutdown', () => this.events.off('update', tick));
    } else if (cs.bg === 'plain') {
      // 第三章：嘉南平原的夜（甘蔗田、糖廠煙囪）
      this.add.tileSprite(0, H * 0.62, W, 230, cs.mood === 'dawn' ? 'x3_plainFar' : 'x3_plainFarN').setOrigin(0, 1).setAlpha(0.85);
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
    // 有條件的句子（第四章天亮：阿婆判「就在這裡下」才有那一句）只在條件成立時播
    let lines = cs.lines.filter((l) => !l.when || l.when(run));
    // &scare=1（開發用）：直接從 jump scare 那一句開始
    const from = scare ? lines.findIndex((l) => l.pre) : -1;
    if (from > 0) lines = lines.slice(from);
    const dlg = new Dialogue(this, lines, finish, fx, (id, done) => this.pre(id, done));
    button(this, W - 90, 40, 120, 50, '略過 ▶▶', () => dlg.skip(), { size: 18, fill: 0x2a2236 }).setDepth(700);
  }
}
