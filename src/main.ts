import Phaser from 'phaser';
import { W, H } from './theme';
import { setupMobile, watchOrientation } from './mobile';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { StoryScene } from './scenes/StoryScene';
import { DayScene } from './scenes/DayScene';
import { PrepScene } from './scenes/PrepScene';
import { NightScene } from './scenes/NightScene';
import { JudgeScene } from './scenes/JudgeScene';
import { EndScene } from './scenes/EndScene';

async function start() {
  setupMobile();
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
    scene: [BootScene, TitleScene, StoryScene, DayScene, PrepScene, NightScene, JudgeScene, EndScene],
  });
  watchOrientation(game);
  (window as unknown as Record<string, unknown>).__game = game;
}

start();
