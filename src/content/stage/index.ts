/**
 * 引擎內演出腳本（docs/第一二章_熱鬧化計畫.md §2）：過場 id → 腳本。
 * 有腳本的過場由 StoryScene 播演出；沒有的照舊播文字版。
 *
 * 第 1 階段：第一章兩段從原型搬過來（recall、dusk3），改用演出用的暫代小人（art/stage.ts）。
 * 補寫的拍子標 draft（【待定】，見計畫 §9）。
 */
import type { StageScript } from './types';

export type { StageActor, StageBeat, StageFore, StageMove, StageScript } from './types';

export const STAGES: Record<string, StageScript> = {
  // 第一章・最後一戰喚回石駒之後：惠澤宮廟埕
  recall: {
    id: 'recall',
    place: '惠澤宮・廟埕',
    mood: 'temple',
    sky: [0x1a0e08, 0x5a3412],
    far: 'mtnFarN',
    temple: 'temple_huize',
    ground: 0x2a2632,
    fore: 'temple',
    actors: [
      { id: 'fog', tex: 'smoke', x: 560, y: -120, scale: 5, tint: 0x9b3cff, alpha: 0.35, center: true },
      { id: 'qiye', tex: 'qiye', x: 90, y: 70, scale: 0.95 },
      { id: 'baye', tex: 'baye', x: 360, y: 80, scale: 0.95 },
      { id: 'jiao', tex: 'st_jiao_qingling', x: 220, y: 60, scale: 0.45 },
      { id: 'decree', tex: 'decree', x: 220, y: -330, scale: 0.8, alpha: 0, center: true },
      { id: 'shiju', tex: 'st_shiju', x: 590, y: 90, scale: 0.48, flip: true, tint: 0xb89ad0 },
    ],
    beats: [
      // 【待定】旁白與隨從插話（原型補寫）
      { text: '石駒身上的煞氣淡了。牠站在廟埕上，喘著氣。', draft: true, cam: { x: 400, y: -60, zoom: 1.04, ms: 1600 } },
      { at: 'qiye', name: '七爺', who: 'qiye', text: '……牠不跑了。', draft: true, moves: [{ id: 'qiye', x: 120, hop: true, ms: 500 }] },
      { at: 'baye', name: '八爺', who: 'baye', text: '噓！王爺要開口了。', draft: true, moves: [{ id: 'baye', x: 340, hop: true, ms: 400 }] },
      {
        at: 'decree', who: 'kaijiang', text: '回來吧。', src: 0, fx: 'flash',
        cam: { x: 260, y: -160, zoom: 1.18, ms: 900 },
        moves: [{ id: 'decree', y: -300, alpha: 1, ms: 900 }],
      },
      {
        at: 'shiju', who: 'shijuCalm', text: '……主公。', src: 1,
        cam: { x: 470, y: -40, zoom: 1.12, ms: 1400 },
        moves: [
          { id: 'fog', alpha: 0, scale: 7, ms: 1400 },
          { id: 'shiju', x: 470, tint: null, tex: 'st_shiju_kneel', ms: 1400, hop: true },
        ],
      },
      {
        text: '鑼鼓響起來了。石駒歸隊。', draft: true, fx: 'firecracker',
        cam: { x: 360, y: -100, zoom: 1, ms: 1200 },
        sfx: { text: '鏘！咚咚！', at: 'jiao' },
      },
    ],
  },
  // 第一章・第三夜之後：芝嶺巖，石駒在山裡（妖怪視角）
  dusk3: {
    id: 'dusk3',
    place: '芝嶺巖・入夜',
    mood: 'demon',
    sky: [0x0a0614, 0x2e1446],
    far: 'mtnFarN',
    ground: 0x1a1424,
    fore: 'mountain',
    actors: [
      { id: 'fog', tex: 'smoke', x: 470, y: -120, scale: 5, tint: 0x9b3cff, alpha: 0, center: true },
      { id: 'shiju', tex: 'st_shiju', x: 820, y: 90, scale: 0.52, flip: true },
      { id: 'flag', tex: 'flag1', x: 60, y: -10, scale: 0.35, alpha: 0 },
      { id: 'lan0', tex: 'lantern', x: 100, y: -60, scale: 0.3, alpha: 0, center: true },
      { id: 'lan1', tex: 'lantern', x: 140, y: -50, scale: 0.3, alpha: 0, center: true },
      { id: 'lan2', tex: 'lantern', x: 180, y: -55, scale: 0.3, alpha: 0, center: true },
    ],
    beats: [
      {
        at: 'shiju', who: 'shiju', text: '我記得鑼聲，記得旗子在風裡響。', src: 0,
        cam: { x: 470, y: -80, zoom: 1.06, ms: 2000 },
        moves: [{ id: 'shiju', x: 500, ms: 2000, hop: true }, { id: 'fog', alpha: 0.35, ms: 2000 }],
      },
      {
        at: 'shiju', who: 'shiju', text: '肚子那個洞，冷風一直灌進來。', src: 1,
        cam: { x: 500, y: -40, zoom: 1.2, ms: 1400 },
      },
      {
        // 【待定】旁白（原型補寫）
        text: '山下，遶境的燈籠一盞一盞亮起來。', draft: true,
        cam: { x: 220, y: -60, zoom: 1.1, ms: 1200 },
        moves: [
          { id: 'flag', alpha: 0.8, ms: 600 }, { id: 'lan0', alpha: 1, ms: 400 },
          { id: 'lan1', alpha: 1, ms: 700 }, { id: 'lan2', alpha: 1, ms: 1000 },
        ],
        sfx: { text: '鏘——', at: 'flag', color: 0xffd76a },
      },
      {
        at: 'shiju', who: 'shiju', text: '你們這些拿旗子的人……\n也是來鑿我的嗎？', src: 2, fx: 'shake',
        cam: { x: 470, y: -100, zoom: 1.28, ms: 500 },
        moves: [{ id: 'shiju', x: 470, ms: 300 }, { id: 'fog', alpha: 0.6, scale: 6.5, ms: 500 }],
      },
    ],
  },
};
