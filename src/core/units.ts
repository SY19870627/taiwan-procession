/** 陣頭（我方單位）與妖怪（敵方單位）的資料定義 */

export type UnitId = 'qiye' | 'bajiang' | 'xingshi' | 'paoshou' | 'shiju' | 'kaijiang';

export interface UnitDef {
  id: UnitId;
  name: string;
  /** 一句話說明（布陣畫面顯示） */
  desc: string;
  hp: number;
  atk: number;
  /** 攻擊距離（像素） */
  range: number;
  /** 攻擊間隔（秒） */
  cd: number;
  /** 範圍傷害半徑，0 表示單體 */
  aoe: number;
  /** 特殊能力 */
  trait?: 'capture' | 'quake' | 'charge';
  /** 升級花費（香火），每升一級 +1 倍 */
  upgradeCost: number;
}

export const UNITS: Record<UnitId, UnitDef> = {
  qiye: {
    id: 'qiye', name: '七爺八爺', desc: '暗訪捉妖的主力。打到虛弱就捉拿；每 4 擊甩出勾魂鎖，把遠處的妖怪拉過來定身。',
    hp: 120, atk: 14, range: 110, cd: 1.0, aoe: 0, trait: 'capture', upgradeCost: 30,
  },
  bajiang: {
    id: 'bajiang', name: '八將團', desc: '擋在最外圈的肉盾。橫掃身旁一群妖怪，有 25% 機會用法器格擋。',
    hp: 260, atk: 22, range: 55, cd: 1.3, aoe: 0, upgradeCost: 30,
  },
  xingshi: {
    id: 'xingshi', name: '醒獅團', desc: '鑼鼓震地，範圍震擊，把妖怪震退並暈眩。石頭類最怕這個。',
    hp: 150, atk: 16, range: 90, cd: 2.0, aoe: 90, trait: 'quake', upgradeCost: 30,
  },
  paoshou: {
    id: 'paoshou', name: '鞭炮組', desc: '遠程爆炸，嚇得妖怪減速；疾魅最怕鞭炮。信徒越多越強。',
    hp: 80, atk: 9, range: 320, cd: 1.4, aoe: 40, upgradeCost: 25,
  },
  shiju: {
    id: 'shiju', name: '石駒', desc: '被喚回的神駒。衝鋒穿過妖群。',
    hp: 400, atk: 30, range: 60, cd: 2.4, aoe: 70, trait: 'charge', upgradeCost: 60,
  },
  kaijiang: {
    id: 'kaijiang', name: '惠澤宮令旗隊', desc: '交陪援軍。令旗一揮，同一側的陣頭出手加快 15%。',
    hp: 220, atk: 20, range: 260, cd: 1.6, aoe: 50, upgradeCost: 0,
  },
};

export type EnemyId = 'wang' | 'mei' | 'kui' | 'boss' | 'yi' | 'sha' | 'chu' | 'tide';

export interface EnemyDef {
  id: EnemyId;
  name: string;
  hp: number;
  atk: number;
  speed: number;
  cd: number;
  range: number;
  /** 受到的傷害倍率（石頭類較硬） */
  armor: number;
  /** 被醒獅震擊時的額外倍率 */
  quakeWeak: number;
  /** 可以被七爺八爺捉拿 */
  capturable: boolean;
}

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  wang: { id: 'wang', name: '小魍', hp: 85, atk: 6, speed: 46, cd: 1.0, range: 26, armor: 1, quakeWeak: 1, capturable: true },
  mei: { id: 'mei', name: '疾魅', hp: 60, atk: 5, speed: 92, cd: 0.7, range: 22, armor: 1, quakeWeak: 1, capturable: true },
  kui: { id: 'kui', name: '石屑傀', hp: 210, atk: 12, speed: 30, cd: 1.6, range: 30, armor: 0.6, quakeWeak: 1.6, capturable: true },
  boss: { id: 'boss', name: '石駒', hp: 1500, atk: 26, speed: 34, cd: 1.6, range: 50, armor: 0.45, quakeWeak: 1.2, capturable: false },
  // 第二章（東津）
  yi: { id: 'yi', name: '小疫鬼', hp: 95, atk: 6, speed: 44, cd: 1.0, range: 26, armor: 1, quakeWeak: 1, capturable: true },
  sha: { id: 'sha', name: '海煞', hp: 60, atk: 5, speed: 96, cd: 0.7, range: 22, armor: 1, quakeWeak: 1, capturable: true },
  /** 黑潮的觸手：不會走，從沙裡伸出來拖住王船 */
  chu: { id: 'chu', name: '觸手', hp: 260, atk: 9, speed: 0, cd: 1.8, range: 260, armor: 0.8, quakeWeak: 1.4, capturable: false },
  /** 黑潮：在海裡，打不到；會捲浪 */
  tide: { id: 'tide', name: '黑潮', hp: 99999, atk: 26, speed: 0, cd: 2, range: 0, armor: 1, quakeWeak: 1, capturable: false },
};
