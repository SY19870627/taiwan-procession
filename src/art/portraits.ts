/**
 * 角色立繪（AI 繪圖、手繪風）：有圖用圖，沒圖用程式畫的小人。
 *
 * 原圖在本機「圖片需求/立繪/」，經 tools/portraits.py 去背、統一成 420×560 的 webp，放在 public/portraits/，
 * 同時產生 portraits.data.ts（有哪些圖、小頭像裁切位置）。新增圖片時重跑那支程式就好。
 * 每張圖底部對齊、角色朝右（阿秀嬸原圖朝左，處理時已翻轉）。
 *
 * 表情：normal 平常、sad 難過、angry 生氣、surprised 驚訝、smile 開心、relieved 釋懷、calm 平靜（石駒、黑潮、蛟）。
 * 第三章另有：cocky 得意嘴砲、pout 嘴硬彆扭、fierce 全力出手、sigh 無奈、scared 嚇到求饒。
 * 劇本裡在「」的開頭加 {sad} 這樣的標記，就會換成那個表情（見 ui/talk.ts 的 splitStory）。
 */
import Phaser from 'phaser';
import { SETS, THUMB } from './portraits.data';

export type Expr = 'normal' | 'sad' | 'angry' | 'surprised' | 'smile' | 'relieved' | 'calm'
  | 'cocky' | 'pout' | 'fierce' | 'sigh' | 'scared';

/** 遊戲裡的稱呼（人名、鬼的真名、案子代號、過場說話的人）→ 立繪代號 */
const ALIAS: Record<string, string> = {
  // 第一章・人
  小芸: 'xiaoyun',
  阿秀嬸: 'axiu', 阿秀嬸與阿弟: 'axiu',
  阿弟: 'adi_baby',
  阿哲: 'azhe',
  阿雄: 'axiong',
  林伯: 'linbo',
  阿土伯: 'atu', 廟公阿土伯: 'atu',
  布莊老闆娘: 'buzhuang',
  老人會的長輩: 'elder',
  釣魚的老伯: 'fisher',
  // 第一章・鬼
  阿桂: 'agui', gui: 'agui', 護嬰娘阿桂: 'agui',
  阿標: 'abiao', biao: 'abiao', 前鋒阿標: 'abiao',
  阿添公: 'atian', tian: 'atian', 冰水伯阿添: 'atian',
  阿福: 'afu', fu: 'afu',
  // 第二章・人
  蔡嫂: 'caisao',
  洪師傅: 'hong',
  阿城: 'acheng',
  阿城的阿嬤: 'acheng_ama', 阿嬤: 'acheng_ama',
  阿娟: 'ajuan',
  黃總理: 'huang',
  診所的醫生: 'doctor',
  港務所的老伯: 'portman',
  // 第二章・鬼
  海伯: 'haibo', haibo: 'haibo',
  阿迪: 'adi', adi: 'adi', 水手阿迪: 'adi',
  米婆: 'mipo', mipo: 'mipo', 煮飯婆米婆: 'mipo',
  疫鬼: 'yigui', yigui: 'yigui', 瘟差: 'yigui',
  // 靈界（過場、夜審）
  石駒: 'shiju', 黑潮: 'heichao',
  阿魍: 'wang', 阿魅: 'mei', 石屑傀: 'kui',
  文判官: 'judge', 武判官: 'judge',
  中軍府: 'zhongjun', 巡捕: 'zhongjun',
  旨意: 'decree',
  // 第三章・神明（太子爺、五營）
  太子爺: 'taizi', 太子: 'taizi', 三太子: 'taizi', 中壇元帥: 'taizi',
  章將軍: 'zhangjiang', 東營: 'zhangjiang',
  霄將軍: 'xiaojiang', 南營: 'xiaojiang',
  柳將軍: 'liujiang', 西營: 'liujiang',
  廉將軍: 'lianjiang', 北營: 'lianjiang',
  // 第三章・人
  炳伯: 'bingbo', 廟公炳伯: 'bingbo',
  阿凱: 'akai',
  鴨嬸: 'yashen',
  阿玲: 'aling',
  何伯: 'hebo', 渡口的何伯: 'hebo',
  // 第三章・鬼與妖
  鴨母婆: 'yamupo', yamupo: 'yamupo',
  虎頭: 'hutou', hutou: 'hutou',
  渡伯: 'dubo', dubo: 'dubo',
  紙紮童: 'zhizha', zhizha: 'zhizha',
  水鬼: 'shuigui', 抓交替的水鬼: 'shuigui',
  火煞: 'huosha', 鼠妖: 'shuyao',
  蛟: 'jiao', 蝦兵: 'xiabing',
};

/** 表情沒有圖時，用哪一個代替 */
const FALLBACK: Record<Expr, Expr[]> = {
  normal: [],
  sad: [],
  angry: ['sad'],
  surprised: [],
  smile: ['relieved', 'calm'],
  relieved: ['smile', 'calm'],
  calm: ['relieved', 'smile'],
  cocky: ['smile'],
  pout: ['sad'],
  fierce: ['angry'],
  sigh: ['sad'],
  scared: ['surprised'],
};

const key = (id: string, e: Expr) => `pt_${id}_${e}`;

/** BootScene.preload 呼叫：把所有立繪排進載入佇列 */
export function loadPortraits(scene: Phaser.Scene): void {
  const base = import.meta.env.BASE_URL;
  for (const [id, exprs] of Object.entries(SETS)) {
    for (const e of exprs) scene.load.image(key(id, e), `${base}portraits/${id}_${e}.webp`);
  }
}

/** 這個人／鬼有沒有立繪 */
export function hasPortrait(who: string | undefined): boolean {
  return !!who && !!(ALIAS[who] ?? SETS[who]);
}

/** 取得立繪貼圖；沒有這個人的立繪就回傳 undefined（改用程式畫的小人） */
export function portraitKey(scene: Phaser.Scene, who: string | undefined, expr: Expr = 'normal'): string | undefined {
  const id = who ? (ALIAS[who] ?? (SETS[who] ? who : undefined)) : undefined;
  if (!id) return undefined;
  for (const e of [expr, ...FALLBACK[expr], 'normal' as Expr]) {
    const k = key(id, e);
    if (SETS[id]?.includes(e) && scene.textures.exists(k)) return k;
  }
  // 沒有平常表情的（石駒、黑潮）：用第一張有的
  for (const e of SETS[id] ?? []) if (scene.textures.exists(key(id, e))) return key(id, e);
  return undefined;
}

/**
 * 小頭像：從立繪上半身裁一塊正方形（臉和肩膀），縮到 size 大小。
 * 回傳的圖 origin 在左上角，畫在 (x, y)。
 */
export function portraitThumb(scene: Phaser.Scene, k: string, x: number, y: number, size: number): Phaser.GameObjects.Image {
  const img = scene.add.image(0, 0, k).setOrigin(0, 0);
  const id = k.replace(/^pt_/, '').replace(/_[a-z]+$/, '');
  const [fx, fy] = THUMB[id] ?? [0.2, 0];
  const w = img.width;
  const cw = w * 0.6;
  const cx = w * fx;
  const cy = img.height * fy;
  img.setCrop(cx, cy, cw, cw);
  const sc = size / cw;
  img.setScale(sc);
  img.setPosition(x - cx * sc, y - cy * sc);
  return img;
}
