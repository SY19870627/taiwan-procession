/**
 * 引擎內演出的腳本格式（docs/第一二章_熱鬧化計畫.md §4）：一段過場的走位、鏡頭、泡泡。
 * 播放器在 ui/stage.ts；StoryScene 遇到有腳本的過場就播演出，沒有就播原本的文字版。
 *
 * 台詞照抄原本的過場（src 標第幾句，測試會核對字一樣、每句都有演到）；draft 是補寫的【待定】台詞或旁白。
 * 座標：x 是畫面寬 720 裡的位置；y 是相對地面（腳底）往下多少，負數是在地面上方（飄在空中的東西）。
 * 手機直式畫面比較高時，播放器會把地平線往下移、演員放大（ui/stage.ts 的 stageLayout），腳本不用改。
 */
import type { SpeakerId } from '../story';

export interface StageActor {
  id: string;
  tex: string;
  x: number;
  y: number;
  /** 縮放；演出小人（st_*）以 art/stageSpec.ts 的設計尺寸為準 */
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

export type StageFx = 'shake' | 'flash' | 'firecracker';

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
  /** 補寫的【待定】台詞或旁白 */
  draft?: boolean;
  moves?: StageMove[];
  /** 鏡頭：看向 (x, y 相對地面) 並放大 zoom 倍 */
  cam?: { x: number; y: number; zoom: number; ms?: number };
  fx?: StageFx;
  /** 狀聲字（沒有音效系統，用字表現）：在某個演員旁邊跳出來；日後可接聲音 */
  sfx?: { text: string; at: string; color?: number };
}

/** 地面前景（畫面下方、演員前面）：廟埕石板＋香爐、山路草叢、海邊浪花 */
export type StageFore = 'temple' | 'mountain' | 'sea' | 'none';

export interface StageScript {
  /** 對應 CUTSCENES 裡原本的那一段 */
  id: string;
  place: string;
  mood: 'demon' | 'temple' | 'dawn';
  sky: [number, number];
  /** 遠景貼圖（tileSprite） */
  far?: string;
  /** 廟（神明視角） */
  temple?: string;
  /** 地面顏色 */
  ground: number;
  /** 前景；沒寫就照 mood 選（temple → 廟埕，其他 → 山路） */
  fore?: StageFore;
  actors: StageActor[];
  beats: StageBeat[];
}
