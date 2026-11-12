/**
 * 第四章的過場劇情（暫代）。媽祖全章不露臉、不講話、沒有立繪（承峰定案 2026-11-13）：
 * 畫面上只有轎子和布幔，祂的意思只透過轎子的動作和旁人的反應出現；旁白不替媽祖講話。
 *
 * 【第 1 階段】全部是【待定】的一句旁白（型別與測試需要這些劇情 id 存在）。下一輪換成正式劇本；
 * 有正式演出腳本時再加 content/stage/ch4.ts（tests/boss12 的演出清單要一起改）。
 *
 * 播放時機：
 *  - qitou4：序章擲筊之後、第一天黃曆之前（放頭旗、兵馬點名）
 *  - mangdu4：第三夜之後（茫渡現身）【TODO】
 *  - mangduRecall4／mangduReturn4／mangduSlay4：最後一戰的三種結局【TODO】
 *  - huigong4：回宮、開爐【TODO】
 */
import type { Cutscene } from '../story';

const stub = (place: string, text: string): Cutscene => ({
  mood: 'temple', place, temple: 'temple_gongchen', lines: [{ who: 'narrator', text }],
});

export const CUTSCENES4: Record<string, Cutscene> = {
  qitou4: stub('白砂墩拱辰宮・放頭旗', '【待定】三聖筊。頭旗放出廟門，無形兵馬在頭旗下點名。\n去哪條路，沒有人知道。'),
  mangdu4: stub('渾水溪', '【待定】茫渡現身。'),
  mangduRecall4: stub('渾水溪', '【待定】喚回。'),
  mangduReturn4: stub('渾水溪', '【待定】送回。'),
  mangduSlay4: stub('渾水溪', '【待定】斬。'),
  huigong4: stub('白砂墩拱辰宮', '【待定】回宮。'),
};
