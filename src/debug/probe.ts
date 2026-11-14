/**
 * 「畫面上目前顯示的那句台詞」紀錄器（給 ?debug=1 的回報框自動帶入）。
 * 只寫一個模組變數：不碰 DOM、不碰 Phaser、不影響遊戲。正式版建置（沒有 VITE_DEBUG_TOOLS）時整段直接 return，什麼都不記。
 * 呼叫的地方：ui/dialogue.ts、ui/talk.ts（對話、回憶）、ui/banter.ts（互嗆字幕）、ui/stage.ts（演出）。
 */
export interface ShownLine {
  /** 台詞所在的 Phaser 場景 key */
  scene: string;
  /** 說話的人（旁白是空字串） */
  speaker: string;
  text: string;
  /** 第幾句（0 起算；演出是第幾拍） */
  index: number;
}

const ON = import.meta.env.DEV || import.meta.env.VITE_DEBUG_TOOLS === '1';
let shown: ShownLine | null = null;

/** 這一句出現在畫面上了 */
export function noteLine(speaker: string | undefined, text: string, index: number, scene = ''): void {
  if (!ON) return;
  shown = { scene, speaker: speaker ?? '', text, index };
}

/** 這個場景的對話播完了（不是這個場景的句子就不動） */
export function clearLine(scene = ''): void {
  if (!ON) return;
  if (shown && shown.scene === scene) shown = null;
}

/** 目前記下的那一句（沒有是 null） */
export function shownLine(): ShownLine | null {
  return shown;
}
