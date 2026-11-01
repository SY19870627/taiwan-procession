/**
 * 【原型】引擎內演出（第一、二章熱鬧化計畫 §4 方式 2）：用現有的背景、陣頭小人、立繪在場景上走位，
 * 頭上冒對話泡泡，鏡頭推近、震動、閃白。只在網址加 ?proto=stage 時播（BootScene），正式流程完全不用。
 *
 * 台詞照抄原本的過場（src 標第幾句，測試會核對字一樣）；draft 是原型補寫的隨從插話【待定】。
 * 座標：x 是畫面寬 720 裡的位置；y 是相對地面（腳底）往下多少，負數是在地面上方（飄在空中的東西）。
 */
import type { SpeakerId } from './story';

export interface StageActor {
  id: string;
  tex: string;
  x: number;
  y: number;
  scale: number;
  flip?: boolean;
  tint?: number;
  alpha?: number;
  /** 圖的錨點：預設腳底（0.5, 1）；飄著的東西（旨意、煙）用中心 */
  center?: boolean;
}

export interface StageMove {
  id: string;
  x?: number;
  y?: number;
  alpha?: number;
  scale?: number;
  /** 改色調；null 是拿掉色調 */
  tint?: number | null;
  /** 換圖（石駒煞氣散了換成平靜的那張） */
  tex?: string;
  ms?: number;
  /** 走路時一跳一跳 */
  hop?: boolean;
}

export interface StageBeat {
  /** 泡泡掛在哪個演員頭上；沒寫就是畫面下方的旁白字幕 */
  at?: string;
  /** 泡泡上的名字（沒寫就用 who 的名字） */
  name?: string;
  /** 說話的人（用來取名字、核對原台詞） */
  who?: SpeakerId;
  text: string;
  /** 取自原本過場的第幾句（從 0 算） */
  src?: number;
  /** 原型補寫的【待定】台詞 */
  draft?: boolean;
  moves?: StageMove[];
  /** 鏡頭：看向 (x, y 相對地面) 並放大 zoom 倍 */
  cam?: { x: number; y: number; zoom: number; ms?: number };
  fx?: 'shake' | 'flash' | 'firecracker';
  /** 狀聲字（沒有音效系統，用字表現）：在某個演員旁邊跳出來 */
  sfx?: { text: string; at: string; color?: number };
}

export interface StageScript {
  /** 對應 CUTSCENES 裡原本的那一段 */
  id: string;
  place: string;
  mood: 'demon' | 'temple';
  sky: [number, number];
  /** 遠景貼圖（tileSprite） */
  far?: string;
  /** 廟（神明視角） */
  temple?: string;
  /** 地面顏色 */
  ground: number;
  actors: StageActor[];
  beats: StageBeat[];
}

export const STAGE_SCRIPTS: Record<string, StageScript> = {
  // 第一章・最後一戰喚回石駒之後：惠澤宮廟埕
  recall: {
    id: 'recall',
    place: '惠澤宮・廟埕',
    mood: 'temple',
    sky: [0x1a0e08, 0x5a3412],
    far: 'mtnFarN',
    temple: 'temple_huize',
    ground: 0x2a2632,
    actors: [
      { id: 'fog', tex: 'smoke', x: 560, y: -120, scale: 5, tint: 0x9b3cff, alpha: 0.35, center: true },
      { id: 'qiye', tex: 'qiye', x: 90, y: 70, scale: 0.95 },
      { id: 'baye', tex: 'baye', x: 360, y: 80, scale: 0.95 },
      { id: 'jiao', tex: 'palanquin', x: 220, y: 60, scale: 0.9 },
      { id: 'decree', tex: 'decree', x: 220, y: -330, scale: 0.8, alpha: 0, center: true },
      { id: 'shiju', tex: 'shiju', x: 590, y: 90, scale: 1.05, flip: true, tint: 0x9a7ab0 },
    ],
    beats: [
      { text: '石駒身上的煞氣淡了。牠站在廟埕上，喘著氣。', draft: true, cam: { x: 400, y: -60, zoom: 1.04, ms: 1600 } },
      { at: 'qiye', name: '七爺', text: '……牠不跑了。', draft: true, moves: [{ id: 'qiye', x: 120, hop: true, ms: 500 }] },
      { at: 'baye', name: '八爺', text: '噓！王爺要開口了。', draft: true, moves: [{ id: 'baye', x: 340, hop: true, ms: 400 }] },
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
          { id: 'shiju', x: 470, tint: null, tex: 'shiju_calm', ms: 1400, hop: true },
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
    actors: [
      { id: 'fog', tex: 'smoke', x: 470, y: -120, scale: 5, tint: 0x9b3cff, alpha: 0, center: true },
      { id: 'shiju', tex: 'shiju', x: 820, y: 90, scale: 1.15, flip: true },
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
