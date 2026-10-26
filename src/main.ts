import Phaser from 'phaser';
import { W, H } from './theme';
import * as state from './state';
import { CASES } from './content/cases';
import { setupMobile, watchOrientation } from './mobile';
import { unlockAudio } from './audio/sfx';
import { CutScene } from './scenes/CutScene';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { ChapterScene } from './scenes/ChapterScene';
import { StoryScene } from './scenes/StoryScene';
import { AlmanacScene } from './scenes/AlmanacScene';
import { DayScene } from './scenes/DayScene';
import { BandScene } from './scenes/BandScene';
import { TrialScene } from './scenes/TrialScene';
import { BossHud, BossScene } from './scenes/BossScene';
import { EndScene } from './scenes/EndScene';

async function start() {
  setupMobile();
  unlockAudio();
  // 等中文字型載入，避免文字先用備用字型畫出來（最多等 2.5 秒）
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('700 16px "Noto Sans TC"', '遶境青嶺王'),
        document.fonts.load('900 16px "Noto Serif TC"', '遶境青嶺王'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* 字型載不到就用系統字型 */
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#120f1c',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true },
    fps: { smoothStep: false },
    scene: [BootScene, TitleScene, ChapterScene, CutScene, StoryScene, AlmanacScene, DayScene, BandScene, TrialScene, BossScene, BossHud, EndScene],
  });
  watchOrientation(game);
  (window as unknown as Record<string, unknown>).__game = game;
  // 除錯用：在 console 看目前進度
  (window as unknown as Record<string, unknown>).__run = () => state.run;
  (window as unknown as Record<string, unknown>).__cases = CASES;
}

start();
