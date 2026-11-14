/** 建置時由 vite.config.ts 注入的版本字串 */
declare const __VERSION__: string;
/** HEAD commit 的台北時間「YYYY-MM-DD HH:mm:ss」（沒有 git 是空字串；除錯面板的版本用） */
declare const __BUILD_TIME__: string;
/** HEAD commit 短碼（沒有 git 是 'local'） */
declare const __BUILD_SHA__: string;
