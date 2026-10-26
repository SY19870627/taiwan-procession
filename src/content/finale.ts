/**
 * 最後一戰的內容：誰上場（陣頭＋收編的鬼）、石駒的狀態、陣前審問三輪。
 * 白天和夜審累積的東西都在這裡兌現。
 */
import type { RunState } from '../state';
import type { BossSetup, MemberStats, Row, SkillId } from '../core/boss';

/** 陣頭與收編的鬼的數值（沒有升級，成長全部來自故事） */
export const MEMBER_STATS: Record<string, MemberStats & { tex: string[]; desc: string }> = {
  bajiang: { key: 'bajiang', name: '八將團', role: 'melee', hp: 280, atk: 22, cd: 1.3, range: 170, aoe: 0, guard: 1, trait: 'block', tex: ['bajiang0', 'bajiang1'], desc: '肉盾：橫掃，25% 格擋' },
  qiye: { key: 'qiye', name: '七爺八爺', role: 'melee', hp: 140, atk: 16, cd: 1.0, range: 190, aoe: 0, guard: 1, trait: 'chain', tex: ['qiye', 'baye'], desc: '近戰：勾魂鎖拉來小妖' },
  xingshi: { key: 'xingshi', name: '醒獅團', role: 'melee', hp: 160, atk: 18, cd: 1.8, range: 170, aoe: 90, guard: 1, trait: 'quake', tex: ['lion'], desc: '近戰：範圍震擊，石屑傀最怕' },
  paoshou: { key: 'paoshou', name: '鞭炮組', role: 'ranged', hp: 90, atk: 9, cd: 1.4, range: 560, aoe: 50, guard: 1, trait: 'slow', tex: ['paoshou', 'folk2'], desc: '遠程：後排也能炸，嚇得小妖變慢' },
  kaijiang: { key: 'kaijiang', name: '惠澤宮令旗隊', role: 'ranged', hp: 220, atk: 18, cd: 1.6, range: 440, aoe: 50, guard: 1, trait: 'haste', tex: ['kaijiang'], desc: '交陪援軍：全隊出手加快' },
  biao: { key: 'biao', name: '前鋒阿標', role: 'melee', hp: 360, atk: 20, cd: 1.4, range: 170, aoe: 0, guard: 0.75, tex: ['folk1'], desc: '收編：最耐打的前排' },
  gui: { key: 'gui', name: '護嬰娘阿桂', role: 'support', hp: 120, atk: 16, cd: 2.0, range: 0, aoe: 0, guard: 1, trait: 'heal', tex: ['folk3'], desc: '收編：照顧血最少的陣頭' },
  tian: { key: 'tian', name: '冰水伯阿添', role: 'support', hp: 140, atk: 6, cd: 1.6, range: 480, aoe: 60, guard: 1, trait: 'frost', tex: ['folk4'], desc: '收編：凍慢小妖，妖怪出手變慢' },
};

/** 超渡哪個亡魂，最後一戰多哪個技能 */
export const RELEASE_SKILL: Record<string, SkillId> = { gui: 'huichun', tian: 'hanshuang', fu: 'zhensha' };

/** 收編的鬼（阿福不上場打，他在陣前審問時出現） */
export const GHOST_MEMBERS = ['biao', 'gui', 'tian'];

export function finaleSetup(r: RunState): BossSetup {
  const keys = ['bajiang', 'qiye', 'xingshi', 'paoshou'];
  if (r.allied) keys.push('kaijiang');
  for (const g of GHOST_MEMBERS) if (r.flags[`recruit_${g}`]) keys.push(g);
  // 預設：近戰前三個上前排，其他在後排
  let front = 0;
  const members = keys.map((k) => {
    const st = { ...MEMBER_STATS[k] };
    if (k === 'paoshou') st.atk = Math.round(st.atk * (1 + r.followers / 30));
    const melee = st.role === 'melee' && k !== 'biao';
    const row: Row = melee && front < 3 ? 'front' : 'back';
    if (row === 'front') front++;
    return { stats: st, row };
  });
  const invited = r.b.xiaoyun === 'invited';
  return {
    members,
    palanquin: { hp: 300, smite: 80, bless: r.flags.recruit_gui ? 0.38 : 0.25 },
    boss: {
      // 重來一次，石駒的煞氣也耗掉一些（每次 -15%）
      // 隊伍越大，戰線拉得越長，要磨得更久（每多一個成員煞氣 +10%）
      hpMul: (1 + 0.1 * (members.length - 4)) * 1.5 * (invited ? 0.85 : 1) * (r.shijuEnraged ? 1.15 : 1) * Math.pow(0.85, r.retries),
      atkMul: 0.9 * (r.shijuEnraged ? 1.3 : 1),
      chargeEvery: r.shijuEnraged ? 7 : 10,
      skipCharges: invited ? 1 : 0,
    },
    bellyWound: !!r.intel.bellyWound,
    extraWaves: Math.min(3, r.bossAdds),
    // 超渡的亡魂讓王爺神威增長：每超渡一個，多一個技能
    skills: (Object.keys(RELEASE_SKILL)).filter((g) => r.cases[g]?.verdict === 'release').map((g) => RELEASE_SKILL[g]),
    morale: r.morale,
    duration: 180,
  };
}

// ---------- 陣前審問 ----------
export interface FinaleRound {
  /** 石駒說的話 */
  line: string;
  /** 對得上的證據 */
  evidence: string[];
  /** 特別的人（有到場才能用） */
  people?: { id: string; label: string; test: (r: RunState) => boolean; say: string }[];
  /** 答對 */
  ok: string;
  /** 答對的效果（顯示用） */
  effect: string;
}

export const FINALE_ROUNDS: FinaleRound[] = [
  {
    line: '「你們跟那些拿鑿子、拿夾子的人一樣。」',
    evidence: ['axiong'],
    ok: '阿雄放下了捕獸夾，蹄印的事他都說了。石駒的眼神閃了一下。',
    effect: '石駒動搖：受到的傷害 ×1.15',
  },
  {
    line: '「他說會回來。他沒有回來。」',
    evidence: ['linbo', 'rein'],
    ok: '那段往事被說了出來。石駒停下來，低頭看著地上。',
    effect: '石駒動搖：攻擊 ×0.85，跳過下一次衝鋒',
  },
  {
    line: '（石駒沉默，一直往北看。）',
    evidence: ['poem'],
    people: [
      { id: 'fu', label: '請阿福上前', test: (r) => !!r.flags.recruit_fu, say: '阿福拿著斷掉的韁繩走上前：「……是我。我回來了。」' },
      { id: 'yun', label: '小芸呼喊', test: (r) => r.b.xiaoyun === 'invited', say: '小芸從廟埕邊跑出來：「石頭馬，回家了！」' },
    ],
    ok: '石駒的煞氣散了大半。牠看著你們，像是終於認出了誰。',
    effect: '可以喚回石駒',
  },
];

export const FINALE_WRONG = '石駒噴了一口氣，煞氣更重了。（攻擊 ×1.1）';
