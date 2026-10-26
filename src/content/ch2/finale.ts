/**
 * 第二章最後一戰：送王・護送王船到大鵬澳的沙灘。
 * 黑潮在海裡打不到；觸手從沙裡伸出來拖住王船，小疫鬼和海煞從海那邊爬上岸。
 * 雲王爺的法術：五王火（火牆）、王令（把最近的妖怪押上王船）。
 */
import type { RunState } from '../../state';
import type { BossSetup, MemberStats, Row, SkillId, Wave } from '../../core/boss';
import type { FinaleRound } from '../finale';
import { shipped } from './believers';

export const MEMBER_STATS2: Record<string, MemberStats & { tex: string[]; desc: string }> = {
  zjb: { key: 'zjb', name: '中軍府轎班', role: 'melee', hp: 150, atk: 16, cd: 1.0, range: 190, aoe: 0, guard: 1, trait: 'chain', tex: ['jbu_white'], desc: '近戰：令牌把遠處的小妖拉過來' },
  dqs: { key: 'dqs', name: '大千歲轎班', role: 'melee', hp: 280, atk: 22, cd: 1.3, range: 170, aoe: 0, guard: 1, trait: 'block', tex: ['jbu_yellow'], desc: '肉盾：橫掃，25% 格擋' },
  sqs: { key: 'sqs', name: '三千歲轎班', role: 'melee', hp: 170, atk: 18, cd: 1.8, range: 170, aoe: 90, guard: 1, trait: 'quake', tex: ['jbu_black'], desc: '近戰：震轎，觸手最怕' },
  yanmi: { key: 'yanmi', name: '鹽米隊', role: 'ranged', hp: 90, atk: 13, cd: 1.4, range: 560, aoe: 50, guard: 1, trait: 'slow', tex: ['yanmi', 'yanmi2'], desc: '遠程：撒鹽米，小妖變慢' },
  qjb: { key: 'qjb', name: '七境頭轎班', role: 'melee', hp: 230, atk: 20, cd: 1.2, range: 170, aoe: 0, guard: 1, tex: ['jbu_green'], desc: '阿城的轎班：耐打的近戰' },
  liuyu: { key: 'liuyu', name: '小琉嶼護航船', role: 'ranged', hp: 220, atk: 18, cd: 1.6, range: 440, aoe: 50, guard: 1, trait: 'haste', tex: ['liuyu'], desc: '交陪援軍：全隊出手加快' },
  adi: { key: 'adi', name: '水手阿迪', role: 'melee', hp: 360, atk: 20, cd: 1.4, range: 170, aoe: 0, guard: 0.75, tex: ['g_adi'], desc: '收編：最耐打的前排' },
  mipo: { key: 'mipo', name: '煮飯婆米婆', role: 'support', hp: 120, atk: 16, cd: 2.0, range: 0, aoe: 0, guard: 1, trait: 'heal', tex: ['g_mipo'], desc: '收編：照顧血最少的陣頭' },
  yigui: { key: 'yigui', name: '瘟差', role: 'support', hp: 140, atk: 6, cd: 1.6, range: 480, aoe: 60, guard: 1, trait: 'frost', tex: ['g_yigui'], desc: '收編：疫氣反咬，妖怪出手變慢' },
};

/** 超渡哪個亡魂，最後一戰多哪個技能 */
export const RELEASE_SKILL2: Record<string, SkillId> = { haibo: 'dingfeng', adi: 'shunfeng', mipo: 'pingan' };

/** 收編的鬼（海伯不上場打，他在陣前審問時出現） */
export const GHOST_MEMBERS2 = ['adi', 'mipo', 'yigui'];

const WAVES2: Wave[] = [
  [3, 'yi', 3, 1.6], [14, 'sha', 3, 1.0], [28, 'yi', 4, 1.4], [42, 'sha', 4, 0.9],
  [58, 'yi', 4, 1.2], [74, 'sha', 4, 0.9], [90, 'yi', 5, 1.2], [108, 'sha', 4, 0.9],
  [126, 'yi', 5, 1.1], [144, 'sha', 4, 0.9], [162, 'yi', 5, 1.1], [180, 'sha', 4, 0.9],
];

export function finaleSetup2(r: RunState): BossSetup {
  const keys = ['zjb', 'dqs', 'sqs', 'yanmi'];
  if (r.b.acheng === 'proud') keys.push('qjb');
  if (r.allied) keys.push('liuyu');
  for (const g of GHOST_MEMBERS2) if (r.flags[`recruit_${g}`]) keys.push(g);
  let front = 0;
  const members = keys.map((k) => {
    const st = { ...MEMBER_STATS2[k] };
    const melee = st.role === 'melee' && k !== 'adi';
    const row: Row = melee && front < 3 ? 'front' : 'back';
    if (row === 'front') front++;
    return { stats: st, row };
  });
  // 上王船的鬼越多，王船越重；重來一次，黑潮的力氣也耗掉一些
  const weight = shipped(r).length;
  const big = 1 + 0.08 * (members.length - 4);
  return {
    mode: 'escort',
    members,
    palanquin: { hp: r.b.hong === 'fixed' ? 320 : 225, smite: 0, bless: 0 },
    boss: { hpMul: 1, atkMul: 0.9, chargeEvery: 12, skipCharges: 0 },
    bellyWound: false,
    extraWaves: Math.min(4, r.bossAdds + (r.flags.yigui_loose ? 2 : 0)),
    extraKinds: ['yi', 'sha'],
    skills: Object.keys(RELEASE_SKILL2).filter((g) => r.cases[g]?.verdict === 'release').map((g) => RELEASE_SKILL2[g]),
    spells: ['wuhuo', 'wangling'],
    waves: WAVES2,
    escort: {
      travel: 165 * (1 + 0.08 * weight) * Math.pow(0.92, r.retries),
      tentacleEvery: 10,
      tentacleHp: Math.round(260 * big * Math.pow(0.9, r.retries)),
      maxTentacles: 3,
    },
    duration: 250,
  };
}

// ---------- 陣前審問 ----------
export const FINALE_ROUNDS2: FinaleRound[] = [
  {
    line: '「岸上的人，早就忘了我們。」',
    evidence: ['ricebowl', 'caisao_rice'],
    people: [
      { id: 'mipo', label: '請米婆上前', test: (r) => !!r.flags.recruit_mipo, say: '米婆捧著一碗熱粥走到浪邊：「回來吃飯了。」' },
    ],
    ok: '港口那碗米，三年來每晚都有人放。黑潮裡的臉，安靜了幾張。',
    effect: '觸手和小妖變弱：受到的傷害 ×1.2',
  },
  {
    line: '「是船長說最後一網。是他害的。」',
    evidence: ['paper', 'typhoon', 'caisao_net'],
    ok: '那一網是船長說的。可是他被沖上岸以後，每天都抓著斷舵在港口等你們。',
    effect: '黑潮動搖：攻擊 ×0.85，下一次捲浪會半路散掉',
  },
  {
    line: '（黑潮裡，有人在喊家裡的名字。）',
    evidence: [],
    people: [
      { id: 'haibo', label: '請海伯上前', test: (r) => !!r.flags.recruit_haibo, say: '海伯抱著斷舵走到浪邊，一個一個喊船員的名字。五個名字，一個都沒有漏。' },
      { id: 'caisao', label: '蔡嫂呼喊', test: (r) => r.b.caisao === 'invited', say: '蔡嫂衝到浪邊，喊了她丈夫的名字：「可以回來了！」' },
    ],
    ok: '黑潮停了下來。浪裡的臉一張一張，朝王船看過來。',
    effect: '可以把黑潮一起送走',
  },
];

export const FINALE_WRONG2 = '黑潮翻起一個大浪，更兇了。（攻擊 ×1.1）';
