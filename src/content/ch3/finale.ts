/**
 * 第三章最後一戰：疾水溪・蛟。
 *
 * 【第 1 階段暫代】正式的 jiao 模式（翻江、蝦兵、拖人、太子出轎、五營合陣、太子全開）在第 5 階段做。
 * 在那之前先借用第一章的 subdue 模式（把魔王的煞氣打到歸零），讓整章可以從頭走到尾不當掉。
 * 陣前審問三輪的內容（70%／40%／10%）已經照大綱 §9 寫好，第 5 階段沿用。
 */
import type { RunState } from '../../state';
import type { BossSetup, MemberStats, Row, SkillId } from '../../core/boss';
import type { FinaleRound } from '../finale';

/** 五將與收編的鬼（數值是暫代，第 5 階段依 jiao 模式重訂；第 7 階段平衡定案） */
export const MEMBER_STATS3: Record<string, MemberStats & { tex: string[]; desc: string }> = {
  zhang: { key: 'zhang', name: '東營・章將軍', role: 'melee', hp: 300, atk: 20, cd: 1.3, range: 170, aoe: 0, guard: 0.9, trait: 'block', tex: ['w3_zhang'], desc: '前排肉盾：格擋，替前排隊友擋一下' },
  xiao: { key: 'xiao', name: '南營・霄將軍', role: 'melee', hp: 200, atk: 28, cd: 1.1, range: 170, aoe: 60, guard: 1, tex: ['w3_xiao'], desc: '前排爆發：和太子同在前排觸發合擊' },
  liu: { key: 'liu', name: '西營・柳將軍', role: 'ranged', hp: 110, atk: 22, cd: 1.6, range: 600, aoe: 0, guard: 1, tex: ['w3_liu'], desc: '後排遠程：專打頭目，可以射斷拖人' },
  lian: { key: 'lian', name: '北營・廉將軍', role: 'support', hp: 160, atk: 10, cd: 1.6, range: 480, aoe: 60, guard: 1, trait: 'frost', tex: ['w3_lian'], desc: '控場：定身；在前排時翻江減傷' },
  // 收編（編入五營）的鬼
  hutou: { key: 'hutou', name: '南營・扛轎虎頭', role: 'melee', hp: 360, atk: 18, cd: 1.4, range: 170, aoe: 0, guard: 0.75, tex: ['g3_hutou'], desc: '收編：扛轎，最耐打的前排' },
  yamupo: { key: 'yamupo', name: '北營・鴨母婆', role: 'support', hp: 120, atk: 8, cd: 1.6, range: 480, aoe: 70, guard: 1, trait: 'slow', tex: ['g3_yamupo'], desc: '收編：鴨群讓蝦兵變慢' },
  zhizha: { key: 'zhizha', name: '中營・掃地紙紮童', role: 'support', hp: 100, atk: 8, cd: 2.0, range: 0, aoe: 0, guard: 1, trait: 'heal', tex: ['g3_zhizha'], desc: '收編：紙人替身（暫代：照顧血最少的人）' },
};

/** 超渡哪個亡魂，最後一戰多哪個技能 */
export const RELEASE_SKILL3: Record<string, SkillId> = { yamupo: 'qunya', dubo: 'baidu' };

/** 收編後會上場的鬼（渡伯不上場打，他帶路、在陣前審問出現；其他小咖收編只加營兵人數） */
export const GHOST_MEMBERS3 = ['hutou', 'yamupo', 'zhizha'];

export function finaleSetup3(r: RunState): BossSetup {
  const keys = ['zhang', 'xiao', 'liu', 'lian'];
  for (const g of GHOST_MEMBERS3) if (r.flags[`recruit_${g}`]) keys.push(g);
  let front = 0;
  const members = keys.map((k) => {
    const st = { ...MEMBER_STATS3[k] };
    const row: Row = st.role === 'melee' && front < 3 ? 'front' : 'back';
    if (row === 'front') front++;
    return { stats: st, row };
  });
  // 【暫代】借用第一章的模式與法術；第 5 階段換成 jiao 模式、乾坤圈、太子出轎
  return {
    mode: 'subdue',
    members,
    palanquin: { hp: 320, smite: 90, bless: 0.25 },
    boss: { hpMul: 1.4 * Math.pow(0.85, r.retries), atkMul: 0.9, chargeEvery: 10, skipCharges: 0 },
    bellyWound: !!r.flags.recruit_dubo,
    extraWaves: Math.min(3, r.bossAdds),
    skills: Object.keys(RELEASE_SKILL3).filter((g) => r.cases[g]?.verdict === 'release').map((g) => RELEASE_SKILL3[g]),
    duration: 200,
  };
}

// ---------- 陣前審問（大綱 §9） ----------
export const FINALE_ROUNDS3: FinaleRound[] = [
  {
    line: '「沒人會來救你們。這條溪，從來沒有人敢來。」',
    evidence: ['ash_ledger', 'duck_feather', 'hebo_fowl'],
    people: [
      { id: 'yamupo', label: '請鴨母婆上前', test: (r) => r.cases.yamupo?.verdict === 'release' || !!r.flags.recruit_yamupo, say: '鴨群從堤防上衝下來，排成一列擋在隊伍前面。鴨母婆的聲音：「這寮鴨，我顧的！」' },
    ],
    ok: '一晚一隻鴨、一袋一袋香灰，都是你逼來的。有人一直在替這個庄擋著。',
    effect: '蛟動搖：受到的傷害 ×1.15',
  },
  {
    line: '「我在這裡幾百年了。這條溪，是我的。」',
    evidence: ['pole_carving', 'hebo_ferry', 'ferry_closed'],
    people: [
      { id: 'dubo', label: '請渡伯上前', test: (r) => !!r.flags.recruit_dubo, say: '渡伯撐著竹篙走到水邊：「幾百年？你抓著我，也才幾十年。你的舊帳，我一筆一筆都記著。」' },
    ],
    ok: '竹篙上的正字，一個一個都是被放走的人。蛟的尾巴，第一次往後縮了一下。',
    effect: '蛟動搖：攻擊 ×0.85；可以收蛟為坐騎',
  },
  {
    line: '「你就是當年鬧海那個小鬼？……連你爹都不要你。」',
    evidence: [],
    people: [
      // 大綱：太子沉默 2 秒 → 章將軍「太子，弟兄們都在。」→ 五將齊喊（第 5 階段做成鏡頭特寫與太子全開）
      { id: 'wuying', label: '五將齊喊', test: () => true, say: '太子沉默了。章將軍：「太子，弟兄們都在。」\n五營兵將齊聲：「在！」\n太子：「……我知道我是誰。」' },
    ],
    ok: '太子全開。',
    effect: '太子全開（第 5 階段實作：全部招式強化 10 秒）',
  },
];

export const FINALE_WRONG3 = '蛟翻了一個浪，笑得更大聲了。（攻擊 ×1.1）';
