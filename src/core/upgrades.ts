/**
 * 逐項升級：神轎與每個陣頭各有幾項屬性，每項分開升級（Lv1–5）。
 * 這裡算出「實際數值」，戰鬥和整備畫面都用同一套算法，畫面上顯示的就是戰鬥裡用的。
 */
import { UNITS, type UnitId } from './units';

export type MemberKey = 'palanquin' | UnitId;
export type StatKey = 'hp' | 'atk' | 'speed' | 'special' | 'smite' | 'bless';
export type Upgrades = Partial<Record<MemberKey, Partial<Record<StatKey, number>>>>;

export const MAX_LV = 5;

export interface StatDef {
  key: StatKey;
  name: string;
  desc: string;
  /** 升到下一級的香火：cost × 目前等級 */
  cost: number;
  /** 顯示用：這個等級的數值 */
  show: (lv: number, k: MemberKey) => string;
}

export interface MemberDef {
  key: MemberKey;
  name: string;
  /** 在隊伍中的角色 */
  role: string;
  /** 介紹（取材與在靈界的作用） */
  lore: string;
  /** 立繪貼圖（多張會並排） */
  tex: string[];
  stats: StatDef[];
  /** 特性標籤（攻擊方式等） */
  tags: string[];
  /** 不能升級的原因（交陪來的單位） */
  locked?: string;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

// ---------- 數值公式 ----------
export const hpMul = (lv: number) => 1 + 0.2 * (lv - 1);
export const atkMul = (lv: number) => 1 + 0.2 * (lv - 1);
export const cdMul = (lv: number) => 1 - 0.08 * (lv - 1);
export const captureAt = (lv: number) => 0.3 + 0.05 * (lv - 1);
export const guardMul = (lv: number) => 1 - 0.08 * (lv - 1);
export const quakeAoe = (lv: number) => UNITS.xingshi.aoe + 15 * (lv - 1);
export const fireRange = (lv: number) => UNITS.paoshou.range + 40 * (lv - 1);
export const PALANQUIN_HP = 300;
export const SMITE_DMG = 70;
export const BLESS_HEAL = 0.25;
export const palHp = (lv: number) => Math.round(PALANQUIN_HP * (1 + 0.2 * (lv - 1)));
export const smiteDmg = (lv: number) => Math.round(SMITE_DMG * (1 + 0.2 * (lv - 1)));
export const blessHeal = (lv: number) => BLESS_HEAL * (1 + 0.2 * (lv - 1));

const HP: StatDef = { key: 'hp', name: '體力', desc: '能挨多少打', cost: 15, show: (lv, k) => `${Math.round(UNITS[k as UnitId].hp * hpMul(lv))}` };
const ATK: StatDef = { key: 'atk', name: '武力', desc: '每一擊的傷害', cost: 15, show: (lv, k) => `${Math.round(UNITS[k as UnitId].atk * atkMul(lv))}` };
const SPEED: StatDef = { key: 'speed', name: '身手', desc: '出手的快慢（秒）', cost: 15, show: (lv, k) => `${(UNITS[k as UnitId].cd * cdMul(lv)).toFixed(2)} 秒` };

export const MEMBERS: MemberDef[] = [
  {
    key: 'palanquin',
    tags: ['陣眼', '法術來源', '倒下即失敗'],
    name: '神轎',
    role: '隊伍核心・青嶺王坐鎮',
    lore: '四名轎班扛著青嶺王的神轎。凡人看到的是金碧輝煌的轎子，靈界裡它是全隊的陣眼：神轎一倒，隊伍就潰散。天令、淨符兩道法術都從這裡發出。',
    tex: ['palanquin'],
    stats: [
      { key: 'hp', name: '轎身', desc: '神轎的耐久，歸零就輸', cost: 20, show: (lv) => `${palHp(lv)}` },
      { key: 'smite', name: '天令', desc: '範圍雷擊的傷害', cost: 20, show: (lv) => `${smiteDmg(lv)}` },
      { key: 'bless', name: '淨符', desc: '神轎回復的比例（陣頭回復再多一成）', cost: 20, show: (lv) => pct(blessHeal(lv)) },
    ],
  },
  {
    key: 'qiye',
    tags: ['近戰', '單體', '會捉拿小妖'],
    name: '七爺八爺',
    role: '暗訪捉妖・前鋒',
    lore: '高瘦白袍、吐長舌的七爺，矮胖黑臉、拿手銬的八爺。暗訪時走在最前面，把妖怪打到虛弱就直接上銬，天亮後交給判官審問。',
    tex: ['qiye', 'baye'],
    stats: [HP, ATK, SPEED, { key: 'special', name: '捉拿', desc: '妖怪剩多少血以下就能上銬', cost: 18, show: (lv) => pct(captureAt(lv)) }],
  },
  {
    key: 'bajiang',
    tags: ['近戰', '單體', '擋路肉盾'],
    name: '八將團',
    role: '近身肉盾・擋在最外圈',
    lore: '畫著臉譜、手持法器的八將，在靈界是一堵牆。妖怪要碰到神轎，得先過他們這一關。',
    tex: ['bajiang0', 'bajiang1'],
    stats: [HP, ATK, SPEED, { key: 'special', name: '架勢', desc: '受到的傷害', cost: 18, show: (lv) => pct(guardMul(lv)) }],
  },
  {
    key: 'xingshi',
    tags: ['中距離', '範圍震擊', '剋石頭類'],
    name: '醒獅團',
    role: '鑼鼓震擊・範圍攻擊',
    lore: '獅頭一甩、鑼鼓一響，凡人只覺得熱鬧，靈界裡卻是一圈震波。石頭做的妖怪最怕這個。',
    tex: ['lion'],
    stats: [HP, ATK, SPEED, { key: 'special', name: '震幅', desc: '震擊的範圍（像素）', cost: 18, show: (lv) => `${quakeAoe(lv)}` }],
  },
  {
    key: 'paoshou',
    tags: ['遠程', '範圍爆炸', '信徒越多越強'],
    name: '鞭炮組',
    role: '驅邪火力・遠程',
    lore: '信徒點的鞭炮，在靈界就是驅邪的火力。站在神轎旁邊往外射，跟著隊伍的信徒越多，炸得越兇。',
    tex: ['paoshou', 'folk2'],
    stats: [HP, ATK, SPEED, { key: 'special', name: '射程', desc: '鞭炮射多遠（像素）', cost: 18, show: (lv) => `${fireRange(lv)}` }],
  },
  {
    key: 'kaijiang',
    tags: ['遠程', '範圍', '交陪援軍'],
    name: '惠澤宮令旗隊',
    role: '交陪援軍・遠程',
    lore: '與惠澤宮會香結為交陪後，開疆聖王派來助陣的令旗隊。揮動三角令旗，從遠處打擊妖怪。',
    tex: ['kaijiang'],
    stats: [HP, ATK, SPEED],
    locked: '交陪廟派來的援軍，由惠澤宮負責，無法升級。',
  },
];

export function memberDef(k: MemberKey): MemberDef {
  return MEMBERS.find((m) => m.key === k)!;
}

export function lvOf(ups: Upgrades, k: MemberKey, s: StatKey): number {
  return ups[k]?.[s] ?? 1;
}

export function costOf(ups: Upgrades, k: MemberKey, s: StatKey): number {
  const d = memberDef(k).stats.find((x) => x.key === s)!;
  return d.cost * lvOf(ups, k, s);
}

/** 戰鬥用：算出一個陣頭的實際數值 */
export interface UnitStats {
  hp: number;
  atk: number;
  cd: number;
  range: number;
  aoe: number;
  /** 七爺八爺：捉拿門檻 */
  capture: number;
  /** 受到傷害的倍率 */
  guard: number;
}

export function unitStats(id: UnitId, ups: Upgrades, followers: number): UnitStats {
  const def = UNITS[id];
  const lv = (s: StatKey) => lvOf(ups, id, s);
  const fireBonus = id === 'paoshou' ? 1 + followers / 30 : 1;
  return {
    hp: Math.round(def.hp * hpMul(lv('hp'))),
    atk: def.atk * atkMul(lv('atk')) * fireBonus,
    cd: def.cd * cdMul(lv('speed')),
    range: id === 'paoshou' ? fireRange(lv('special')) : def.range,
    aoe: id === 'xingshi' ? quakeAoe(lv('special')) : def.aoe,
    capture: id === 'qiye' ? captureAt(lv('special')) : 0,
    guard: id === 'bajiang' ? guardMul(lv('special')) : 1,
  };
}

export interface PalanquinStats {
  hp: number;
  smite: number;
  bless: number;
}

export function palanquinStats(ups: Upgrades): PalanquinStats {
  return {
    hp: palHp(lvOf(ups, 'palanquin', 'hp')),
    smite: smiteDmg(lvOf(ups, 'palanquin', 'smite')),
    bless: blessHeal(lvOf(ups, 'palanquin', 'bless')),
  };
}

/** 一個成員的「總等級」（各項等級相加後換算），布陣畫面顯示用 */
export function memberRank(ups: Upgrades, k: MemberKey): number {
  const stats = memberDef(k).stats;
  const sum = stats.reduce((a, s) => a + lvOf(ups, k, s.key), 0);
  return Math.round((sum / stats.length) * 10) / 10;
}
