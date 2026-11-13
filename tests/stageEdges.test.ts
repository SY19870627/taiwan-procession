/**
 * 修正第 5 輪：過場裡的角色不被畫面左右邊緣裁到（core/stageEdges.ts）。
 *  - 22 段過場的每一拍，電腦版（1280 高）與 iPhone 直式（390×844 → 720×1558）都檢查；
 *  - 刻意放在舞台外（等著走進來、已經走出去）的不算；王船是佈景不算；蛟、黑潮的尾巴可以出畫面一點；
 *  - 鏡頭自動讓開邊緣（fitCam）：沒裁到人就完全照腳本，裁到才平移、拉遠，最遠 CAM_MIN_ZOOM。
 */
import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/content/stage';
import { edgeCuts, fitCam, fittedCams, stageSpans } from '../src/core/stageEdges';
import { CAM_MIN_ZOOM, STAGE_BLEED, camOffset, stageLayout } from '../src/core/stageLayout';
import { W } from '../src/theme';

/** 電腦版、iPhone 直式（390×844 縮成寬 720） */
const HEIGHTS = [1280, Math.round((720 * 844) / 390)];

describe('過場角色不被畫面邊緣裁到（修正第 5 輪）', () => {
  // 前三章 22 段＋第四章試玩段落 2 段（qijia4、zhuanjin4）＋第四章第 A 輪 4 段（sanjin4、qiaotou4、huigong4、kailu4）
  it('28 段過場都有檢查', () => expect(Object.keys(STAGES)).toHaveLength(28));

  for (const [id, sc] of Object.entries(STAGES)) {
    it(`${id}：每一拍、電腦版與手機版都沒有角色被左右邊緣裁到`, () => {
      for (const h of HEIGHTS) expect(edgeCuts(sc, h).map((c) => `${h} 第${c.beat}拍 ${c.id}（${c.left}～${c.right}）`)).toEqual([]);
    });
  }

  it('鏡頭沒裁到人就照腳本；拉遠不超過 CAM_MIN_ZOOM，也不露出舞台左右多畫的部分', () => {
    for (const h of HEIGHTS) {
      const L = stageLayout(h);
      for (const sc of Object.values(STAGES)) {
        const cams = fittedCams(sc, h);
        stageSpans(sc, h).forEach(({ cam }, n) => {
          const t = cams[n];
          expect(t.z).toBeGreaterThanOrEqual(CAM_MIN_ZOOM - 1e-9);
          expect(t.z).toBeLessThanOrEqual(cam.zoom + 1e-9);
          expect(t.x).toBeLessThanOrEqual(STAGE_BLEED * t.z + 1e-6);
          expect(t.x + (W + STAGE_BLEED) * t.z).toBeGreaterThanOrEqual(W - 1e-6);
          if (t.z >= 1) expect([t.x <= 1e-6, t.x + W * t.z >= W - 1e-6]).toEqual([true, true]);
          // 電腦版的全景（1 倍）照腳本：站位已經調到放得下
          if (h === 1280 && cam.zoom === 1) expect(t).toEqual(camOffset(cam, L, h));
        });
      }
    }
  });

  it('被裁到的人：鏡頭平移讓他整個進來；說話的人一定整個在畫面裡', () => {
    const L = stageLayout(1280);
    const spans = [
      { id: 'a', tex: 'st_qiye', x: 100, left: 60, right: 140 },
      { id: 'b', tex: 'st_qiye', x: 690, left: 650, right: 730 },
    ];
    // 1 倍時右邊的人超出 10：平移不了（1 倍沒有空間）就拉遠一點
    const t = fitCam({ x: 360, y: 0, zoom: 1 }, spans, L, 1280, 'a');
    expect(t.z).toBeLessThan(1);
    for (const s of spans) {
      expect(t.x + s.left * t.z).toBeGreaterThanOrEqual(-4);
      expect(t.x + s.right * t.z).toBeLessThanOrEqual(W + 4);
    }
    // 拉近看左邊的人：右邊的人整個在畫面外，照腳本
    const c = { x: 150, y: 0, zoom: 1.4 };
    expect(fitCam(c, spans, L, 1280, 'a')).toEqual(camOffset(c, L, 1280));
  });
});
