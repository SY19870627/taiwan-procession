/**
 * 第一、二章熱鬧化（docs/第一二章_熱鬧化計畫.md §5）：畫師交的圖叫什麼、放哪裡。純資料，不碰 Phaser（可以單元測試）。
 *
 * 有圖用圖、沒圖用暫代：
 *  - A 組立繪：public/portraits/<id>_<表情>.webp。AssetScene 照 portraits.ts 的方式載入；
 *    沒有檔案時 portraitKey 找不到圖，就退回原本借用的立繪（武判官借文判官、巡捕借中軍府）或程式畫的小人。
 *  - B 組演出小人：public/stage/st_<名稱>.webp。BootScene 先用同名畫好暫代（art/stage.ts），
 *    AssetScene 用暫時的名字載入、載到就蓋掉暫代（和第三章戰鬥圖同一套 replaceTexture）。
 */
import type { Expr } from './portraits';

/** A 組：新角色的立繪與表情（12 張，420×560 去背、朝右、底部對齊） */
export const STAGE_PORTRAITS: Record<string, Expr[]> = {
  wupan: ['normal', 'angry'],
  qiye: ['normal', 'smile'],
  baye: ['normal', 'angry'],
  baoma: ['normal', 'smile'],
  xunbu: ['normal', 'angry'],
  jiaoban: ['normal', 'smile'],
};

/** A 組的檔名（public/portraits/ 底下） */
export const STAGE_PORTRAIT_FILES: string[] = Object.entries(STAGE_PORTRAITS).flatMap(([id, ex]) => ex.map((e) => `${id}_${e}.webp`));

/**
 * B 組：演出用全身小人與神轎（19 張，去背、腳底對齊下緣，畫 2 倍大）。
 * [寬, 高] 是畫師交圖的尺寸，也是程式畫暫代的尺寸；演出腳本的 scale 以這個尺寸為準
 * （畫師的圖尺寸不同也會縮成同樣的顯示高度）。
 */
export const STAGE_ART = {
  st_wenpan: [240, 480],
  st_wupan: [240, 480],
  st_baoma: [240, 400],
  st_zhongjun: [240, 480],
  st_xunbu: [240, 480],
  st_shiju_kneel: [520, 400],
  st_shiju_look: [520, 440],
  st_heichao_figures: [640, 480],
  st_wangchuan: [1024, 600],
  st_wangchuan_fire: [1024, 600],
  st_jiao_qingling: [400, 400],
  // 修正第 3 輪補交（Q18、Q21）：七爺、八爺、轎班全身；王轎（第二章）、太子轎（第三章）。神轎沒有轎班，轎班另外站
  st_qiye: [240, 480],
  st_baye: [240, 480],
  st_jiaoban: [240, 480],
  st_wangjiao: [400, 400],
  st_taizijiao: [400, 400],
  // 修正第 4 輪補交：轎班扛著的王轎、太子轎（朝右、往右走；轎子在動的拍子用這兩張），石駒站姿（煞氣，臉朝左，Q17）
  st_wangjiao_carried: [560, 400],
  st_taizijiao_carried: [560, 400],
  st_shiju: [520, 440],
} as const satisfies Record<string, readonly [number, number]>;

export type StageArtKey = keyof typeof STAGE_ART;

/** B 組的貼圖名（檔名是 public/stage/<名>.webp） */
export const STAGE_FILES = Object.keys(STAGE_ART) as StageArtKey[];

/** B 組圖檔放的資料夾（相對網站根目錄） */
export const STAGE_DIR = 'stage';

/**
 * 只給演出用、沒有畫師圖的暫代（不在 B 組清單）：石駒站姿（喚回）。
 * 最後一戰仍用原本的 shiju 貼圖，戰鬥畫面不變。
 */
export const STAGE_EXTRA = {
  st_shiju_calm: [520, 440],
} as const satisfies Record<string, readonly [number, number]>;

/** 所有演出用貼圖的設計尺寸（B 組＋只給演出用的暫代） */
export const STAGE_SIZES: Record<string, readonly [number, number]> = { ...STAGE_ART, ...STAGE_EXTRA };
