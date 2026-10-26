import Phaser from 'phaser';
import { W } from '../theme';
import { sfx } from '../audio/sfx';

export type JiaoResult = 'holy' | 'laugh' | 'yin';
export const JIAO_NAME: Record<JiaoResult, string> = { holy: '聖杯', laugh: '笑杯', yin: '陰杯' };
/** 三種結果的樣子 */
export const JIAO_RULE: Record<JiaoResult, string> = { holy: '一平一凸', laugh: '兩片都平面朝上', yin: '兩片都凸面朝上' };

/** 擲筊：聖杯（一平一凸）50%、笑杯（兩平）25%、陰杯（兩凸）25% */
export function rollJiao(): JiaoResult {
  const r = Math.random();
  return r < 0.5 ? 'holy' : r < 0.75 ? 'laugh' : 'yin';
}

/** 擲筊動畫：兩片筊往上拋、轉幾圈、落地，落地後回呼結果 */
export function throwJiao(scene: Phaser.Scene, y: number, depth: number, cb: (r: JiaoResult) => void, cx = W / 2): Phaser.GameObjects.Image[] {
  const r = rollJiao();
  const faces = r === 'holy' ? ['jiao_flat', 'jiao_round'] : r === 'laugh' ? ['jiao_flat', 'jiao_flat'] : ['jiao_round', 'jiao_round'];
  let landed = 0;
  const imgs: Phaser.GameObjects.Image[] = [];
  [-70, 70].forEach((dx, i) => {
    const img = scene.add.image(cx + dx * 0.3, y + 40, 'jiao_flat').setScale(1.4).setDepth(depth);
    imgs.push(img);
    scene.tweens.add({ targets: img, y: y - 120, duration: 380, ease: 'Quad.out', yoyo: true });
    scene.tweens.add({
      targets: img, x: cx + dx, angle: 720 + i * 180, duration: 760, ease: 'Linear',
      onComplete: () => {
        // 兩片落地後擺正，平面朝上或凸面朝上一眼就看得出來
        img.setTexture(faces[i]).setAngle(0);
        const label = scene.add.text(img.x, img.y + 46, faces[i] === 'jiao_flat' ? '平面朝上' : '凸面朝上', {
          fontFamily: '"Noto Sans TC", sans-serif', fontSize: '18px', color: '#fbf3e2',
        }).setOrigin(0.5).setDepth(depth);
        imgs.push(label as unknown as Phaser.GameObjects.Image);
        scene.cameras.main.shake(80, 0.004);
        sfx.jiao();
        if (++landed === 2) scene.time.delayedCall(300, () => cb(r));
      },
    });
  });
  return imgs;
}
