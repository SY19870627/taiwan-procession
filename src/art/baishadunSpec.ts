/**
 * 第四章（白砂墩）的美術接點：畫師的圖叫什麼、放哪裡、多大。純資料，不碰 Phaser（可以單元測試）。
 * 清單同 docs/第四章_美術接點清單.md；規則照舊「有圖用圖、沒圖用程式畫的暫代，檔名就是接點」。
 *
 *  - 演出小人：public/stage/st_*.webp。BootScene 先用同名畫好暫代（art/baishadun.ts），AssetScene 載到就蓋掉。
 *  - 背景：public/bg/bg_<theme>_far.webp（2048×260）、_near.webp（2048×400 上方透明）。DayPlan.art 指定主題，
 *    Street 有圖就蓋掉程式畫的遠景／近景（art/backdrop.ts 的 useArtImages）。
 *  - 立繪：public/portraits/<id>_<表情>.webp（420×560）。照舊由 tools/portraits.py 產生 portraits.data.ts 的 SETS；
 *    稱呼 → 代號寫在 art/portraits.ts 的 ALIAS（阿睿 → arui；第一章的阿哲 azhe 不動）。
 *  - 戰鬥圖：public/battle/b4_*.webp（520×420）。最後一戰 ford（BossScene）用；暫代在 art/baishadun.ts。
 *
 * 媽祖不露臉：畫面上只有轎子（四人小轎、粉紅遮雨布）和布幔。轎子、頭旗、香擔在畫面上都不是可以點的東西。
 */

/** 演出小人與轎子（[寬, 高]：畫師交圖的尺寸，也是程式畫暫代的尺寸） */
export const CH4_STAGE_ART = {
  st_jiao4_carry: [560, 400],
  st_jiao4_carry_closed: [560, 400],
  st_jiao4: [400, 400],
  // 第 3 輪新 key（畫師已交稿、未審）：路口頓住（轎身前低後高）、轉進小路（轎身轉約三分之二側）、過溪（腳邊水花）
  st_jiao4_pause: [560, 400],
  st_jiao4_turn: [560, 400],
  st_jiao4_ford: [560, 400],
  st_jiao8_carry: [560, 400],
  st_touqi: [240, 480],
  st_xiangdan: [240, 480],
  st_xiangdeng_a: [240, 480],
  st_xiangdeng_b: [240, 480],
  st_xiangdeng_c: [240, 480],
  st_xiangdeng_d: [240, 480],
  st_xiangdeng_e: [240, 480],
  st_xiangdeng_f: [240, 480],
  st_dianxin: [400, 400],
  st_qianlu: [240, 480],
} as const satisfies Record<string, readonly [number, number]>;

export type Ch4StageKey = keyof typeof CH4_STAGE_ART;
export const CH4_STAGE_FILES = Object.keys(CH4_STAGE_ART) as Ch4StageKey[];

/** 白天路上遇到的牽路仔（小妖卡、隊伍畫面走近的那個；和第一章小妖一樣大小）。暫代，沒有畫師檔 */
export const QIANLU_VISITOR: readonly [number, number] = [80, 120];

/** 背景主題（DayPlan.art） */
export const CH4_BG_THEMES = ['coast', 'highway', 'garage', 'beijin', 'dike'] as const;
/**
 * 最後一戰整張夜景（1280×720，夜、霧、溪面、對岸一點粉紅）。AssetScene 載入（public/bg/bg_ford.webp）；
 * 沒有檔案時 BossScene.drawFord 用程式畫的暫代，載到了就蓋在上面。
 */
export const CH4_FORD_BG = 'bg_ford';
export const CH4_BG_FILES: string[] = CH4_BG_THEMES.flatMap((t) => [`bg_${t}_far`, `bg_${t}_near`]);

/**
 * 戰鬥圖（520×420，public/battle/b4_*.webp）。BootScene 先畫同名暫代（art/baishadun.ts），AssetScene 載到就蓋掉；
 * 最後一戰 ford 顯示時一律縮到指定高度（BossScene 的 fitFord），所以正式圖尺寸不同也對得齊。
 *  - b4_mangdu：茫渡本體（霧裡的人影）；b4_mangdu_boat：喘息時現出渡船的樣子
 *  - b4_qianlu：牽路仔（戰鬥裡的小妖，一隻一張）；b4_renlian：信徒人鏈（左邊、還在水裡的隊伍＝要顧的東西）
 */
export const CH4_BATTLE_ART = {
  b4_mangdu: [520, 420],
  b4_mangdu_boat: [520, 420],
  b4_qianlu: [520, 420],
  b4_renlian: [520, 420],
} as const satisfies Record<string, readonly [number, number]>;
export type Ch4BattleKey = keyof typeof CH4_BATTLE_ART;
export const CH4_BATTLE_FILES = Object.keys(CH4_BATTLE_ART) as Ch4BattleKey[];

/** 立繪（420×560 去背、朝右、底部對齊）：代號 → 表情。媽祖沒有立繪 */
export const CH4_PORTRAITS: Record<string, string[]> = {
  aman: ['normal', 'smile', 'sad', 'relieved'],
  arui: ['normal', 'surprised', 'cocky', 'sad'],
  xianzai: ['normal', 'surprised', 'sigh', 'smile'],
  xiuzhi: ['normal', 'sad', 'surprised', 'relieved'],
  ahan: ['normal', 'pout', 'scared', 'smile'],
  qianshao: ['normal', 'cocky', 'angry', 'surprised'],
  yawei: ['normal', 'calm', 'sigh', 'smile'],
  touqi: ['normal', 'calm'],
  caoxie: ['normal', 'sad', 'relieved'],
  apo: ['normal', 'surprised', 'smile'],
  xinniang: ['normal', 'sad', 'relieved'],
  jiajiao: ['normal', 'angry', 'scared'],
  mangdu: ['normal', 'fierce', 'sad', 'calm'],
};

/**
 * 轎子的接點全部是去背、朝右、腳底（轎槓／水花）貼下緣、水平置中：演出與隊伍都用底部置中（origin 0.5, 1）擺。
 * 去程頓住／轉彎只有布幔拉開這一版（回程布幔放下的轎不換這兩張；BandScene.poseJiao）。
 *
 * 轎子：去程布幔拉開、回程（第三天起）布幔放下
 */
export function jiaoKey(day: number): Ch4StageKey {
  return day >= 3 ? 'st_jiao4_carry_closed' : 'st_jiao4_carry';
}

/** 香燈腳一天比一天多（第一天隊伍還短；最多 10 個，畫面放不下更多） */
export function pilgrimCount(day: number): number {
  return Math.min(10, 3 + (day - 1) * 3);
}

/**
 * 白天隊伍（面向右邊，x 由大到小）：頭旗 → 香擔 → 四人小轎 → 香燈腳一長串（隊尾）。
 * 貼圖是 2 倍大的演出尺寸，縮到和其他章的陣頭差不多高。
 */
export function bandLine4(day: number): [string, number, number][] {
  const line: [string, number, number][] = [
    ['st_touqi', 900, 0.26], ['st_xiangdan', 800, 0.25], [jiaoKey(day), 620, 0.36],
  ];
  const n = pilgrimCount(day);
  const tails = 'abcdef';
  for (let i = 0; i < n; i++) line.push([`st_xiangdeng_${tails[i % 6]}`, 460 - i * Math.max(34, 60 - n * 3), 0.24]);
  return line;
}
