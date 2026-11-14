/**
 * 回報框自動帶入的「目前位置」（純邏輯，不碰 Phaser；adapter 把場景資訊傳進來）。
 */
import type { Position } from './core/index.js';
import { chapterName } from './jumps';
import type { ShownLine } from './probe';

/** 背景用、不算「目前在跑」的場景（立繪載入、白天的隊伍帶、最後一戰的 HUD） */
export const HELPER_SCENES = ['boot', 'assets', 'band', 'bosshud'];

export const SCENE_NAME: Record<string, string> = {
  title: '標題', chapters: '選章', almanac: '黃曆', day: '白天', trial: '夜審', story: '劇情', cut: '過場',
  boss: '最後一戰', end: '結局', sliceEnd: '試玩結束',
};

/** 場景啟動時帶的資料（只看用得到的欄位） */
export interface SceneData {
  day?: number; night?: number; prologue?: boolean; epilogue?: boolean; id?: string; kind?: string;
  /** 劇情、過場播完要去的地方（第 n 天出發過場 → { key: 'day', data: { day: n } }） */
  next?: { key?: string; data?: { day?: number; night?: number } };
}

/** 場景的中文名（劇情加上是哪一段、過場加上種類） */
export function sceneLabel(key: string, data: SceneData = {}): string {
  const name = SCENE_NAME[key] ?? key;
  if (key === 'story' && data.id) return `${name}・${data.id}`;
  if (key === 'cut' && data.kind) return `${name}・${data.kind}`;
  return name;
}

/**
 * 「第四章 白砂墩｜第2天」：章名＋第幾天（夜審是第幾夜；序章、收尾、最後一戰、結局另外寫）。
 * 標題、選章畫面還沒進章節，回空字串。
 */
export function dayLabel(chapter: string, key: string, data: SceneData, runDay: number): string {
  if (!key || key === 'title' || key === 'chapters') return '';
  const ch = chapterName(chapter);
  // 劇情、過場：還沒到下一個場景（run.day 還是前一天），看播完要去哪一天／哪一夜
  const nx = data.next?.data;
  const toNight = data.next?.key === 'trial';
  let d: string;
  if (key === 'almanac' && data.prologue) d = '序章';
  else if (key === 'almanac' && data.epilogue) d = '收尾';
  else if (key === 'boss') d = '最後一戰';
  else if (key === 'end') d = '結局';
  else if (key === 'trial') d = `第${data.night ?? runDay}夜`;
  else if (toNight) d = `第${nx?.night ?? runDay}夜`;
  else d = `第${data.day ?? nx?.day ?? runDay}天`;
  return ch ? `${ch}｜${d}` : d;
}

/** 組成核心要的 Position；台詞只在它的場景還在（running 或 paused）時才帶 */
export function positionOf(o: { chapter: string; scene: string; data: SceneData; runDay: number; line: ShownLine | null; liveScenes: string[] }): Position {
  const line = o.line && (!o.line.scene || o.liveScenes.includes(o.line.scene)) ? o.line : null;
  return {
    day: dayLabel(o.chapter, o.scene, o.data, o.runDay),
    scene: o.scene,
    line: line?.index ?? 0,
    speaker: line?.speaker ?? '',
    text: line?.text ?? '',
  };
}
