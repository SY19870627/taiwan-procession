/**
 * aiPhrase.ts 掃描用的來源：各章 content 模組（eager 匯入，走匯出值）＋ content、scenes、ui 的原始碼（?raw）。
 * 獨立成一個檔：vite 會把 eager glob 的匯入放到檔案最前面，aiPhrase.ts 要先照遊戲的順序匯入 content/chapter（章節之間有循環匯入），
 * 再匯入這個檔，才不會因為照字母順序先載到某個章節檔而撞到還沒初始化的值。
 */
export const MODS = import.meta.glob('../content/**/*.ts', { eager: true }) as Record<string, Record<string, unknown>>;

export const RAW = import.meta.glob(['../content/**/*.ts', '../scenes/*.ts', '../ui/*.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
