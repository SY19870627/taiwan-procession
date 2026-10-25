import Phaser from 'phaser';
import { W } from '../theme';

export type JiaoResult = 'holy' | 'laugh' | 'yin';
export const JIAO_NAME: Record<JiaoResult, string> = { holy: '聖杯', laugh: '笑杯', yin: '陰杯' };

/** 擲筊：聖杯 50%、笑杯 25%、陰杯 25% */
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
        img.setTexture(faces[i]).setAngle(i ? 180 : 0);
        if (faces[i] === 'jiao_round') img.setFlipY(true);
        scene.cameras.main.shake(80, 0.004);
        if (++landed === 2) scene.time.delayedCall(300, () => cb(r));
      },
    });
  });
  return imgs;
}
