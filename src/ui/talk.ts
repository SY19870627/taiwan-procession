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
import { portraitKey, type Expr } from '../art/portraits';

export interface TalkLine {
  /** 說話的人（沒有就是旁白） */
  name?: string;
  /** 立繪貼圖 */
  tex?: string;
  /** 鬼：立繪畫成半透明藍色 */
  ghost?: boolean;
  /** 表情（有立繪圖的角色才有用） */
  expr?: Expr;
  text: string;
}

const EXPRS = ['normal', 'sad', 'angry', 'surprised', 'smile', 'relieved'];

const BOX_H = 250;
const DEPTH = 980;

/** 把一段故事拆成一句一句 */
export function splitStory(s: string, who?: { name: string; tex?: string; ghost?: boolean }): TalkLine[] {
  const out: TalkLine[] = [];
  const pushNarr = (t: string) => {
    for (const part of chunk(t)) out.push({ text: part });
  };
  const re = /「([^」]*)」/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const before = s.slice(last, m.index).replace(/[：:，,]\s*$/, '').trim();
    if (before) pushNarr(before);
    // 誰說的：引號前面那一句提到這個人（或前面沒有旁白），就算他說的；否則當成別人說的話
    const clause = before.split(/[。！？]/).pop() ?? '';
    const mine = !!who && (!before || clause.includes(who.name) || /^(他|她|牠)/.test(clause.trim()));
    // 表情標記 {sad}
    let said = m[1];
    let expr: Expr | undefined;
    const em = /^\{(\w+)\}/.exec(said);
    if (em) {
      said = said.slice(em[0].length);
      if (EXPRS.includes(em[1])) expr = em[1] as Expr;
    }
    for (const part of chunk(said)) out.push(mine ? { name: who!.name, tex: who!.tex, ghost: who!.ghost, expr, text: `「${part}」` } : { text: `「${part}」` });
    last = m.index + m[0].length;
  }
  const rest = s.slice(last).trim();
  if (rest) pushNarr(rest);
  return out.filter((l) => l.text.replace(/[「」\s。，]/g, ''));
}

/** 長句在句號、問號、驚嘆號處斷開，每段大約 40 字以內 */
function chunk(t: string): string[] {
  const parts = t.split(/(?<=[。！？])/).map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > 40 && cur) {
      out.push(cur);
      cur = p;
    } else cur += p;
  }
  if (cur) out.push(cur);
  return out;
}

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
  const objs: Phaser.GameObjects.GameObject[] = [];
  const D = 990;
  const bg = scene.add.rectangle(0, 0, W, H, 0x2a2014, 1).setOrigin(0).setDepth(D).setInteractive().setAlpha(0);
  objs.push(bg);
  const vig = scene.add.graphics().setDepth(D + 1).setAlpha(0);
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
  const label = txt(scene, W / 2, 70, '― 回 憶 ―', 30, 0xd8c8a0, { serif: true }).setOrigin(0.5).setDepth(D + 2).setAlpha(0);
  objs.push(label);
  const img = scene.add.image(W / 2, H * 0.52, o.tex).setOrigin(0.5, 1).setDepth(D + 2).setTint(0xc8b088).setAlpha(0);
  img.setScale(Math.min(420 / img.height, 320 / img.width));
  objs.push(img);
  // 下雨或浪
  if (o.fx) {
    for (let k = 0; k < 40; k++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(-H, H);
      const d = o.fx === 'rain'
        ? scene.add.rectangle(x, y, 2, 30, 0xd8c8a0, 0.35).setAngle(12)
        : scene.add.rectangle(x, H * 0.55 + (k % 10) * 18, 50, 3, 0xd8c8a0, 0.25);
      d.setDepth(D + 1);
      objs.push(d);
      if (o.fx === 'rain') scene.tweens.add({ targets: d, y: y + H, duration: 900 + k * 10, repeat: -1 });
      else scene.tweens.add({ targets: d, x: x - 60, duration: 1600 + k * 30, yoyo: true, repeat: -1 });
    }
  }
  const lines: { text: string; color: number; serif: boolean }[] = [
    ...chunk(o.reveal.replace(/^「|」$/g, '')).map((t) => ({ text: `${o.name}：「${t}」`, color: 0xfff3c4, serif: false })),
    ...chunk(o.summary).map((t) => ({ text: t, color: 0xd8c8a0, serif: true })),
  ];
  const shown: Phaser.GameObjects.Text[] = [];
  let i = 0;
  let timer: Phaser.Time.TimerEvent | undefined;
  let done = false;
  const y0 = H * 0.56;
  const finish = () => {
    if (done) return;
    done = true;
    timer?.remove();
    scene.tweens.add({ targets: objs.concat(shown), alpha: 0, duration: 400, onComplete: () => { for (const x of [...objs, ...shown]) x.destroy(); onDone(); } });
  };
  const step = () => {
    if (i >= lines.length) {
      timer = scene.time.delayedCall(1600, finish);
      return;
    }
    const l = lines[i];
    const prevY = shown.length ? shown[shown.length - 1].y + shown[shown.length - 1].height + 18 : y0;
    const t = txt(scene, W / 2, prevY, l.text, 28, l.color, { serif: l.serif, bold: !l.serif, align: 'center', lineSpacing: 8, wordWrap: { width: W - 80, useAdvancedWrap: true } }).setOrigin(0.5, 0).setDepth(D + 3).setAlpha(0);
    shown.push(t);
    scene.tweens.add({ targets: t, alpha: 1, duration: 500 });
    // 舊的字淡一點、往上推
    for (const s of shown.slice(0, -1)) s.setAlpha(0.55);
    if (t.y + t.height > H - 80) for (const s of shown) s.y -= t.height + 18;
    i++;
    timer = scene.time.delayedCall(3200, step);
  };
  bg.on('pointerup', () => {
    timer?.remove();
    if (i >= lines.length) finish();
    else step();
  });
  scene.tweens.add({ targets: [bg, vig, label], alpha: 1, duration: 400 });
  scene.tweens.add({ targets: img, alpha: 0.75, duration: 900 });
  scene.cameras.main.flash(250, 255, 240, 200);
  timer = scene.time.delayedCall(600, step);
}
