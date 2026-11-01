/**
 * 第三章「新瀛」街景與隊伍的配置：純資料與純函式（不碰 Phaser，可以單元測試）。
 * 真正的繪製在 art/xinying.ts；Street（art/backdrop.ts）照這裡的配置組出捲動街景。
 *
 * 程式畫的是【暫代美術】；正式背景圖（docs/第三章_開發計畫.md §10.4）放在 public/bg/、列在 BG_FILES，
 * Street 會優先用圖，圖沒載到就退回程式畫的。戰鬥圖同理（BATTLE_ART）。
 */

/** 五營的顏色：東青、南紅、西白、北黑、中黃 */
export const CAMP_COLORS = { east: 0x2f8f5a, south: 0xc8372d, west: 0xe8e4da, north: 0x2a2a34, center: 0xe9b949 } as const;
/** 五營的順序（營旗下五格、營兵小旗都照這個順序） */
export const CAMP_ORDER = ['east', 'south', 'west', 'north', 'center'] as const;

export type PlainTheme = 'village' | 'duckfarm' | 'ferry';
export const PLAIN_THEMES: readonly PlainTheme[] = ['village', 'duckfarm', 'ferry'];

export function isPlainTheme(t: string): t is PlainTheme {
  return (PLAIN_THEMES as readonly string[]).includes(t);
}

/** 程式畫的貼圖（白天的名字；夜版本在後面加 N）與尺寸 */
export const PLAIN_ART = {
  // 遠景（橫向無縫）
  x3_plainFar: [1024, 230],
  x3_pondFar: [1024, 230],
  x3_riverFar: [1024, 200],
  // 溪面（橫向無縫，水紋會依流向捲動）、近岸的水泥護岸（橫向無縫，蓋在溪面下緣）
  x3_water: [512, 90],
  x3_levee: [512, 24],
  // 路面（高度 = 場景高 720 − 路面起點 470，和其他街景的路一樣）
  x3_road: [256, 250],
  x3_dirt: [256, 250],
  x3_levroad: [256, 250],
  // 庄頭街景
  x3_house0: [230, 190],
  x3_house1: [210, 176],
  x3_house2: [250, 200],
  x3_house3: [200, 214],
  x3_shop: [230, 200],
  x3_betel: [150, 170],
  x3_pole: [60, 290],
  x3_flagpole: [70, 260],
  x3_tree: [170, 200],
  // 鴨母寮
  x3_shed: [280, 190],
  x3_pond: [260, 90],
  x3_fence: [200, 100],
  x3_feed: [110, 70],
  x3_ducks: [220, 60],
  // 溪邊渡口
  x3_reeds: [150, 120],
  x3_steps: [180, 110],
  x3_raft: [220, 70],
  x3_teastall: [240, 170],
} as const satisfies Record<string, readonly [number, number]>;

export type PlainArtKey = keyof typeof PLAIN_ART;

interface ThemeSpec {
  far: PlainArtKey;
  /** 遠景底部離地面線多高 */
  farLift: number;
  /** 溪面（渡口才有） */
  water?: PlainArtKey;
  /**
   * 遠景用正式圖時，程式畫的溪面改成半透明疊在圖裡的溪面上（只露出水紋往哪邊流）：
   * 下緣離地面線多高、多高、透明度。正式近景的堤防會蓋住原本溪面的位置。
   */
  imageWater?: { lift: number; h: number; alpha: number };
  /** 近景長條（渡口的堤防） */
  near?: PlainArtKey;
  road: PlainArtKey;
  /** 沿路依序出現的房子、樹、攤子（循環） */
  props: PlainArtKey[];
}

export const PLAIN_SPEC: Record<PlainTheme, ThemeSpec> = {
  // 庄頭街景：紅磚平房、柑仔店、檳榔攤、電線桿、五營旗竿
  village: {
    far: 'x3_plainFar', farLift: 88, road: 'x3_road',
    props: ['x3_house0', 'x3_pole', 'x3_shop', 'x3_house1', 'x3_flagpole', 'x3_betel', 'x3_house2', 'x3_pole', 'x3_tree', 'x3_house3'],
  },
  // 鴨母寮：竹棚鴨寮、水塘、竹圍籬、飼料袋、一群白鴨
  duckfarm: {
    far: 'x3_pondFar', farLift: 88, road: 'x3_dirt',
    props: ['x3_shed', 'x3_ducks', 'x3_fence', 'x3_pond', 'x3_feed', 'x3_tree', 'x3_shed', 'x3_fence', 'x3_ducks', 'x3_pond'],
  },
  // 溪邊渡口：對岸、溪面、堤防、石階、竹筏、茶攤、蘆葦
  ferry: {
    far: 'x3_riverFar', farLift: 170, water: 'x3_water', near: 'x3_levee', road: 'x3_levroad',
    imageWater: { lift: 213, h: 54, alpha: 0.4 },
    props: ['x3_reeds', 'x3_steps', 'x3_reeds', 'x3_raft', 'x3_teastall', 'x3_reeds', 'x3_flagpole'],
  },
};

/** 正式背景圖的貼圖名稱（檔案是 public/bg/<名稱>.webp） */
export const bgImageKey = (theme: PlainTheme, layer: 'far' | 'near'): string => `bg_${theme}_${layer}`;

/** 最後一戰（BossScene）的整張夜景（1280×720，剛好是戰場大小） */
export const BOSS_NIGHT_BG = 'bg_ferry_night';

/**
 * 已經放進 public/bg/ 的正式背景圖（不含副檔名）。AssetScene 會載入；
 * 某張沒載到（檔案不在）就退回程式畫的暫代美術。
 */
export const BG_FILES: string[] = [
  'bg_village_far', 'bg_village_near',
  'bg_duckfarm_far', 'bg_duckfarm_near',
  'bg_ferry_far', 'bg_ferry_near',
  BOSS_NIGHT_BG,
];

/**
 * 正式戰鬥圖（public/battle/<名稱>.webp）與它們要佔的位置（= 程式畫的暫代圖尺寸，寬×高）。
 * 正式圖用同樣的貼圖名稱載入、蓋掉程式畫的；顯示時縮放到和暫代圖一樣高（battleArtFit），
 * 所以場景裡原本的 setScale 不用改。
 */
export const BATTLE_ART = {
  jiao: [520, 420],
  jiao_rise: [520, 420],
  b3_taizi: [150, 200],
  b3_zhang: [120, 160],
  b3_xiao: [120, 160],
  b3_liu: [120, 160],
  b3_lian: [120, 160],
} as const satisfies Record<string, readonly [number, number]>;

export type BattleArtKey = keyof typeof BATTLE_ART;
export const BATTLE_FILES = Object.keys(BATTLE_ART) as BattleArtKey[];

export function isBattleArt(k: string): k is BattleArtKey {
  return k in BATTLE_ART;
}

/**
 * 貼圖實際是 texH 高時，要再乘多少倍才會和暫代圖一樣高（寬度照比例，不變形）。
 * 程式畫的暫代圖本身就是那個尺寸，所以回傳 1；不是戰鬥圖也回傳 1。
 */
export function battleArtFit(key: string, texH: number): number {
  if (!isBattleArt(key) || texH <= 0) return 1;
  return BATTLE_ART[key][1] / texH;
}

/**
 * 蛟的錨點（相對圖寬、高）：錨點 = 蛟的頭往岸上咬的位置、腳下是水面。
 * 程式畫的蛟頭在圖的最左邊；正式圖左邊留白、頭在大約四成的地方，水面在圖的下緣附近。
 * 浪頭升起（退回溪裡、不咬人）的那張錨點放右一點，整道浪才不會超出戰場右邊。
 */
export function jiaoOrigin(key: string, texW: number): [number, number] {
  const official = isBattleArt(key) && texW !== BATTLE_ART[key][0];
  if (!official) return [0.12, 0.92];
  return key === 'jiao_rise' ? [0.65, 0.9] : [0.42, 0.9];
}

export interface PlainLayers {
  far: string;
  farImage: boolean;
  farLift: number;
  water?: string;
  /** 溪面下緣離地面線多高、多高、透明度（程式畫的遠景：88、貼圖高、1） */
  waterLift: number;
  waterH?: number;
  waterAlpha: number;
  near?: string;
  /** 近景用了正式圖：圖裡已經有房子，不再另外擺程式畫的房子 */
  nearImage: boolean;
  road: string;
  props: string[];
}

/** 這個主題要用哪些貼圖；has(key) 回答某張正式圖有沒有載入 */
export function plainLayers(theme: PlainTheme, night: boolean, has: (key: string) => boolean = () => false): PlainLayers {
  const s = PLAIN_SPEC[theme];
  const n = night ? 'N' : '';
  const farImg = has(bgImageKey(theme, 'far'));
  const nearImg = has(bgImageKey(theme, 'near'));
  return {
    far: farImg ? bgImageKey(theme, 'far') : s.far + n,
    farImage: farImg,
    farLift: s.farLift,
    water: s.water && s.water + n,
    waterLift: farImg && s.imageWater ? s.imageWater.lift : 88,
    waterH: farImg && s.imageWater ? s.imageWater.h : s.water && PLAIN_ART[s.water][1],
    waterAlpha: farImg && s.imageWater ? s.imageWater.alpha : 1,
    near: nearImg ? bgImageKey(theme, 'near') : s.near && s.near + n,
    nearImage: nearImg,
    road: s.road + n,
    props: nearImg ? [] : s.props.map((k) => k + n),
  };
}

/** 溪水每秒往左捲多少（倍率）：平常順流往左；第三天「溪水倒流」往右，而且流得更急 */
export function riverFlow(reversed: boolean): number {
  return reversed ? -1.6 : 1;
}

// ---------- 白天隊伍 ----------

/** 營兵最少 2 個，每收編一個鬼多 1 個，最多 6 個（畫面放不下更多） */
export const SOLDIER_MIN = 2;
export const SOLDIER_MAX = 6;

/**
 * 白天隊伍（面向右邊）：五營旗 → 東營章 → 南營霄 → 太子神轎（中營）→ 西營柳 → 北營廉 → 營兵。
 * 營兵依收編的數量變多；每個營兵扛的小旗依東南西北中輪流上色（w3_soldier0～4）。
 */
export function bandLine3(recruits: number): [string, number, number][] {
  const line: [string, number, number][] = [
    ['w3_flags', 880, 0.8], ['w3_zhang', 770, 0.72], ['w3_xiao', 700, 0.72], ['w3_palanquin', 545, 0.8],
    ['w3_liu', 390, 0.72], ['w3_lian', 320, 0.72],
  ];
  const n = Math.max(SOLDIER_MIN, Math.min(SOLDIER_MAX, SOLDIER_MIN + recruits));
  for (let i = 0; i < n; i++) line.push([`w3_soldier${i % 5}`, 235 - i * 46, 0.7]);
  return line;
}
