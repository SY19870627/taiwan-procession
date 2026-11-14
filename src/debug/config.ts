// 除錯回報的設定（只有 ?debug=1 且是測試區建置／本機開發時才會被載入）。
// 收件端和 dream-cafe 共用（src/debug/config.js 照抄），靠 game 欄位區分是哪個遊戲。
// REPORT_KEY 只是擋亂送的通關字；會出現在測試區的公開程式裡，這是已接受的。
export const REPORT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbww3bKL77hXEaYURdF58_6ECnTh9Lkzj9E2N35C4xIw2WjU0gHgBOAoqKMV3ehjrV45/exec';
export const REPORT_KEY = 'dc-vC36DCZFcCXt5z5OISfACX_z';

/** 收件端的 game 欄位 */
export const GAME = 'taiwan-procession';

/** 除錯面板自己的 localStorage 鍵（「清除存檔重來」一定不刪） */
export const STORAGE_KEYS = {
  queue: 'taiwan-procession.debug.queue',
  fast: 'taiwan-procession.debug.fast',
  owner: 'taiwan-procession.debug.owner',
};
export const KEEP_PREFIX = 'taiwan-procession.debug.';

/** 遊戲自己的存檔／設定鍵：raujing-*（例如 iPhone 提示看過了沒）與 taiwan-procession.*；除錯的 .debug.* 不算 */
export function isGameSaveKey(k: string): boolean {
  return (k.startsWith('raujing-') || k.startsWith('taiwan-procession.')) && !k.includes('.debug.');
}

/** html2canvas（public/vendor/，相對於頁面；vite base 是 './'） */
export const H2C_SRC = 'vendor/html2canvas.min.js';

/** 快轉倍率 */
export const FAST_RATE = 5;

/** 遊戲畫面快照最多等多久 */
export const SNAPSHOT_TIMEOUT_MS = 2000;
