/**
 * 對話演出（白天、夜審共用）：蓋在畫面上，一次一句。
 * 說話的人有立繪和名字；旁白沒有名字、用明體。點一下：字還在跑就全部顯示，跑完就下一句。
 *
 * splitStory 把一段故事拆成一句一句：「」裡的話算說話的人說的，其他是旁白；太長的句子在句號處斷開。
 * 「」開頭可以加表情標記，例如「{sad}我只是……」：說話的人有立繪圖時會換成那個表情（標記不會顯示）。
 */
import Phaser from 'phaser';
import { C, H, W, SERIF } from '../theme';
import { txt } from './widgets';
import { portraitKey } from '../art/portraits';
import { chunk, flashbackLines, type TalkLine } from './split';
import { punctLeads, wrapWidth } from '../core/layout';
import { clearLine, noteLine } from '../debug/probe';

export { splitStory, chunk, flashbackLines, type TalkLine } from './split';

const BOX_H = 250;
const DEPTH = 980;
/** 回憶容器的名字（tools/overflow-scan-ch4.mjs 用它判斷回憶還在不在） */
export const FLASHBACK_NAME = 'flashback';
/** 每個場景還在播的那段回憶：新的回憶開始前先把它立刻清掉 */
const liveFlashback = new WeakMap<Phaser.Scene, () => void>();

/** 播一段對話，播完呼叫 onDone */
export function talk(scene: Phaser.Scene, lines: TalkLine[], onDone: () => void): void {
  if (!lines.length) return onDone();
  const objs: Phaser.GameObjects.GameObject[] = [];
  const scrim = scene.add.rectangle(0, 0, W, H, 0x05040a, 0.6).setOrigin(0).setDepth(DEPTH).setInteractive();
  objs.push(scrim);
  const bx = 16;
  const by = H - BOX_H - 30;
  const bw = W - 32;
  const box = scene.add.graphics().setDepth(DEPTH + 2);
  box.fillStyle(0x000000, 0.4);
  box.fillRoundedRect(bx + 4, by + 6, bw, BOX_H, 18);
  box.fillStyle(0x17121f, 0.96);
  box.fillRoundedRect(bx, by, bw, BOX_H, 18);
  box.lineStyle(3, C.gold, 0.9);
  box.strokeRoundedRect(bx, by, bw, BOX_H, 18);
  objs.push(box);
  const nameTag = txt(scene, bx + 28, by - 24, '', 28, C.gold, { serif: true, backgroundColor: '#17121f', padding: { x: 14, y: 6 } }).setDepth(DEPTH + 3);
  const body = txt(scene, bx + 28, by + 38, '', 30, C.paper, { bold: false, lineSpacing: 12, wordWrap: { width: bw - 56, useAdvancedWrap: true } }).setDepth(DEPTH + 3);
  const hint = txt(scene, bx + bw - 26, by + BOX_H - 28, '▼ 點一下', 20, C.muted).setOrigin(1, 0.5).setDepth(DEPTH + 3).setAlpha(0);
  objs.push(nameTag, body, hint);
  scene.tweens.add({ targets: hint, y: by + BOX_H - 34, duration: 500, yoyo: true, repeat: -1 });
  let portrait: Phaser.GameObjects.Image | undefined;
  let i = -1;
  let full = '';
  let typing: Phaser.Time.TimerEvent | undefined;
  let done = false;

  let portraitWho: string | undefined;
  const showPortrait = (l: TalkLine) => {
    // 有立繪圖就用圖（依表情），沒有就用程式畫的小人
    const art = portraitKey(scene, l.name, l.expr ?? 'normal');
    const k = art ?? l.tex;
    if (!k) {
      portrait?.setAlpha(0.5);
      return;
    }
    if (art && portrait && portraitWho === l.name) {
      // 同一個人換表情：直接換圖，輕輕彈一下
      if (portrait.texture.key !== k) {
        portrait.setTexture(k);
        scene.tweens.add({ targets: portrait, scaleX: portrait.scaleX * 1.02, scaleY: portrait.scaleY * 1.02, duration: 90, yoyo: true });
      }
    } else if (!portrait || portrait.texture.key !== k) {
      portrait?.destroy();
      portraitWho = l.name;
      if (art) {
        // 立繪：大張、站在對話框後面
        portrait = scene.add.image(232, by + 40, k).setOrigin(0.5, 1).setDepth(DEPTH + 1);
        portrait.setScale(Math.min(560 / portrait.height, 440 / portrait.width));
      } else {
        portrait = scene.add.image(W * 0.3, by - 10, k).setOrigin(0.5, 1).setDepth(DEPTH + 1);
        const sc = Math.min(380 / portrait.height, 300 / portrait.width);
        portrait.setScale(sc);
        if (l.ghost) portrait.setTint(0x9ad0ff);
      }
      objs.push(portrait);
      const y1 = portrait.y;
      portrait.y += 20;
      scene.tweens.add({ targets: portrait, y: y1, duration: 180, ease: 'Quad.out' });
    }
    portrait.setAlpha(l.ghost ? (art ? 0.93 : 0.85) : 1);
  };

  const next = () => {
    i++;
    if (i >= lines.length) {
      if (done) return;
      done = true;
      typing?.remove();
      for (const o of objs) o.destroy();
      clearLine(scene.scene.key);
      onDone();
      return;
    }
    const l = lines[i];
    showPortrait(l);
    if (l.name) {
      nameTag.setVisible(true).setText(l.name);
      body.setFontFamily('"Noto Sans TC", sans-serif').setColor('#fbf3e2');
    } else {
      nameTag.setVisible(false);
      body.setFontFamily(SERIF).setColor('#d9cbe8');
    }
    full = l.text;
    noteLine(l.name, l.text, i, scene.scene.key);
    body.setText('');
    hint.setAlpha(0);
    let n = 0;
    typing?.remove();
    typing = scene.time.addEvent({
      delay: 28, repeat: full.length - 1,
      callback: () => {
        n++;
        body.setText(full.slice(0, n));
        if (n >= full.length) hint.setAlpha(1);
      },
    });
  };

  scrim.on('pointerup', () => {
    if (typing && typing.getRepeatCount() > 0) {
      typing.remove();
      typing = undefined;
      body.setText(full);
      hint.setAlpha(1);
      return;
    }
    next();
  });
  next();
}

/**
 * 回憶：揭開一層真相時，畫面變成泛黃的舊照片，鬼的身影在中間，
 * 一句一句浮出來（鬼說的話 → 記下的真相）。大約 8～12 秒，點一下跳下一句。
 */
export function flashback(scene: Phaser.Scene, o: { tex: string; name: string; reveal: string; summary: string; fx?: 'rain' | 'sea' }, onDone: () => void): void {
  // 同一個場景上一段回憶還在（正常玩不會：回憶的底整片擋住點擊；保險起見）：先立刻清掉，不會疊兩層「― 回 憶 ―」
  liveFlashback.get(scene)?.();
  const objs: Phaser.GameObjects.GameObject[] = [];
  const D = 990;
  // 整段回憶（底、暗角、雨／浪、標題、身影、每一句字）都放在同一個容器裡：一起淡入、一起淡出、一起清掉，不會留下字或底
  const root = scene.add.container(0, 0).setDepth(D).setAlpha(0);
  root.name = FLASHBACK_NAME;
  const bg = scene.add.rectangle(0, 0, W, H, 0x2a2014, 1).setOrigin(0).setInteractive();
  objs.push(bg);
  const vig = scene.add.graphics();
  // 四邊慢慢變暗（舊照片的暗角）
  for (let k = 0; k < 16; k++) {
    const a = 0.05;
    const d = k * 9;
    vig.fillStyle(0x000000, a);
    vig.fillRect(0, 0, W, 150 - d);
    vig.fillRect(0, H - 150 + d, W, 150 - d);
    vig.fillRect(0, 0, 110 - d * 0.6, H);
    vig.fillRect(W - 110 + d * 0.6, 0, 110 - d * 0.6, H);
  }
  objs.push(vig);
  // 下雨或浪（跟暗角同一層：在標題、身影下面）
  if (o.fx) {
    for (let k = 0; k < 40; k++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(-H, H);
      const d = o.fx === 'rain'
        ? scene.add.rectangle(x, y, 2, 30, 0xd8c8a0, 0.35).setAngle(12)
        : scene.add.rectangle(x, H * 0.55 + (k % 10) * 18, 50, 3, 0xd8c8a0, 0.25);
      objs.push(d);
      if (o.fx === 'rain') scene.tweens.add({ targets: d, y: y + H, duration: 900 + k * 10, repeat: -1 });
      else scene.tweens.add({ targets: d, x: x - 60, duration: 1600 + k * 30, yoyo: true, repeat: -1 });
    }
  }
  const label = txt(scene, W / 2, 70, '― 回 憶 ―', 30, 0xd8c8a0, { serif: true }).setOrigin(0.5);
  objs.push(label);
  const img = scene.add.image(W / 2, H * 0.52, o.tex).setOrigin(0.5, 1).setTint(0xc8b088).setAlpha(0);
  img.setScale(Math.min(420 / img.height, 320 / img.width));
  objs.push(img);
  // 容器裡照加進去的順序畫：底 → 暗角 → 雨／浪 → 標題、身影 → 字（跟原本 depth D、D+1、D+2、D+3 的上下一樣）
  root.add(objs);
  const lines: { text: string; color: number; serif: boolean }[] = [
    ...flashbackLines(o.reveal, o.name).map((t) => ({ text: t, color: 0xfff3c4, serif: false })),
    ...chunk(o.summary).map((t) => ({ text: t, color: 0xd8c8a0, serif: true })),
  ];
  // 第四章的一問一答（reveal 有換行）：句子比較多，用下面的排法（標點不放行首、往上推不疊、放不下收掉最舊的）。別章照舊
  const dialog = o.reveal.includes('\n');
  const shown: Phaser.GameObjects.Text[] = [];
  let i = 0;
  let timer: Phaser.Time.TimerEvent | undefined;
  let done = false;
  const y0 = H * 0.56;
  const GAP = 18;
  /** 往上推最高推到這裡（「― 回 憶 ―」下面） */
  const CEIL = label.y + label.height / 2 + 20;
  const FLOOR = H - 80;
  /** 從 y0 一句接一句往下排；超過下緣就整疊往上推（不超過 CEIL），還放不下就收掉最舊的 */
  const relayout = () => {
    const total = () => shown.reduce((s, x) => s + x.height, 0) + GAP * Math.max(0, shown.length - 1);
    while (shown.length > 1 && total() > FLOOR - CEIL) {
      const old = shown.shift()!;
      scene.tweens.killTweensOf(old);
      old.destroy();
    }
    let y = Math.max(CEIL, Math.min(y0, FLOOR - total()));
    for (const s of shown) {
      s.y = y;
      y += s.height + GAP;
    }
  };
  /** 整段收掉：計時器、動畫、容器（連同裡面每一句字）一次清乾淨 */
  const clear = () => {
    done = true;
    timer?.remove();
    timer = undefined;
    // 容器自己的淡出動畫不在這裡停（clear 可能就是在它的 onComplete 裡叫的）
    scene.tweens.killTweensOf([...objs, ...shown]);
    root.destroy();
    clearLine(scene.scene.key);
    if (liveFlashback.get(scene) === kill) liveFlashback.delete(scene);
  };
  /** 被下一段回憶頂掉（正常玩不會發生）：立刻清掉，不接 onDone */
  const kill = () => {
    if (!root.active) return;
    scene.tweens.killTweensOf(root);
    clear();
  };
  liveFlashback.set(scene, kill);
  const finish = () => {
    if (done) return;
    done = true;
    timer?.remove();
    scene.tweens.killTweensOf(shown);
    const out = (delay: number, duration: number) => scene.tweens.add({ targets: root, alpha: 0, delay, duration, onComplete: () => { clear(); onDone(); } });
    if (dialog) {
      // 第四章：字先收（150ms），底才淡出（300ms）：底不會先不見、字還浮在夜審面板上
      if (shown.length) scene.tweens.add({ targets: shown, alpha: 0, duration: 150 });
      out(150, 300);
    } else out(0, 400);
  };
  const step = () => {
    if (i >= lines.length) {
      timer = scene.time.delayedCall(1600, finish);
      return;
    }
    const l = lines[i];
    noteLine('', l.text, i, scene.scene.key);
    const prevY = shown.length ? shown[shown.length - 1].y + shown[shown.length - 1].height + 18 : y0;
    const t = txt(scene, W / 2, prevY, l.text, 28, l.color, { serif: l.serif, bold: !l.serif, align: 'center', lineSpacing: 8, wordWrap: { width: W - 80, useAdvancedWrap: true } }).setOrigin(0.5, 0).setAlpha(0);
    // 字也放進回憶的容器（畫在底、身影上面）：跟著整段一起淡出、一起清掉
    root.add(t);
    if (dialog && punctLeads(t.getWrappedText())) {
      // 換行後「」」「。」這類標點落在行首：窄一兩個字再換一次
      t.setWordWrapWidth(wrapWidth(W - 80, W - 80, 28, (w) => {
        t.setWordWrapWidth(w, true);
        return t.getWrappedText();
      }), true);
    }
    shown.push(t);
    scene.tweens.add({ targets: t, alpha: 1, duration: 500 });
    // 舊的字淡一點、往上推（第四章：上一句還在淡入就先停掉，不然點很快時舊的字又亮回 1）
    for (const s of shown.slice(0, -1)) {
      if (dialog) scene.tweens.killTweensOf(s);
      s.setAlpha(0.55);
    }
    if (dialog) relayout();
    else if (t.y + t.height > H - 80) for (const s of shown) s.y -= t.height + 18;
    i++;
    timer = scene.time.delayedCall(3200, step);
  };
  bg.on('pointerup', () => {
    if (done) return;
    timer?.remove();
    if (i >= lines.length) finish();
    else step();
  });
  // 整個容器淡入（底、暗角、標題原本就是一起 400ms 淡入）；身影另外慢慢浮出
  scene.tweens.add({ targets: root, alpha: 1, duration: 400 });
  scene.tweens.add({ targets: img, alpha: 0.75, duration: 900 });
  scene.cameras.main.flash(250, 255, 240, 200);
  timer = scene.time.delayedCall(600, step);
}
