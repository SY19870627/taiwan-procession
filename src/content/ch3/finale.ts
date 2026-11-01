/**
 * 第三章最後一戰：疾水溪・蛟（core/boss.ts 的 jiao 模式）。
 * 蛟的頭伸上岸咬前排；翻江（浪頭升起預告 2.5 秒）掃過前排；蝦兵一波波上岸；每 ~20 秒拖後排一人下水。
 * 太子的法術：乾坤圈、太子出轎。五營合陣：四將與出轎的太子各在前排站滿 5 秒插旗，五面插齊大傷蛟。
 * 陣前審問三輪（70%／40%／10%）照大綱 §9；第 3 輪之後太子全開。
 */
import type { RunState } from '../../state';
import type { BossSetup, JiaoCamp, MemberStats, Row, SkillId, Wave } from '../../core/boss';
import type { FinaleRound } from '../finale';

/** 五將與收編的鬼（第 5 階段初版數值；第 7 階段平衡定案） */
export const MEMBER_STATS3: Record<string, MemberStats & { tex: string[]; desc: string }> = {
  zhang: { key: 'zhang', name: '東營・章將軍', role: 'melee', hp: 320, atk: 18, cd: 1.3, range: 170, aoe: 0, guard: 0.85, trait: 'cover', tex: ['b3_zhang'], desc: '前排肉盾：格擋，替前排隊友擋蛟一口' },
  xiao: { key: 'xiao', name: '南營・霄將軍', role: 'melee', hp: 210, atk: 26, cd: 1.1, range: 170, aoe: 0, guard: 1, trait: 'combo', tex: ['b3_xiao'], desc: '前排爆發：和出轎的太子同在前排就合擊' },
  liu: { key: 'liu', name: '西營・柳將軍', role: 'ranged', hp: 130, atk: 20, cd: 1.5, range: 640, aoe: 0, guard: 1, trait: 'snipe', tex: ['b3_liu'], desc: '後排遠程：專打蛟；在後排會射斷拖人' },
  lian: { key: 'lian', name: '北營・廉將軍', role: 'support', hp: 220, atk: 10, cd: 1.6, range: 480, aoe: 60, guard: 0.9, trait: 'stun', tex: ['b3_lian'], desc: '控場：定住蝦兵；在前排時翻江傷害減半' },
  // 收編（編入五營）的鬼
  hutou: { key: 'hutou', name: '南營・扛轎虎頭', role: 'melee', hp: 360, atk: 18, cd: 1.4, range: 170, aoe: 0, guard: 0.75, tex: ['g3_hutou'], desc: '收編：扛轎，最耐打的前排' },
  yamupo: { key: 'yamupo', name: '北營・鴨母婆', role: 'support', hp: 120, atk: 8, cd: 1.6, range: 480, aoe: 0, guard: 1, trait: 'ducks', tex: ['g3_yamupo'], desc: '收編：鴨群在，蝦兵走得慢' },
  zhizha: { key: 'zhizha', name: '中營・掃地紙紮童', role: 'support', hp: 100, atk: 8, cd: 2.0, range: 400, aoe: 0, guard: 1, trait: 'paper', tex: ['g3_zhizha'], desc: '收編：紙人替身，吸收一次拖人' },
  // 太子出轎（法術「太子出轎」才上場，不在陣頭卡片裡）
  taizi: { key: 'taizi', name: '太子', role: 'melee', hp: 600, atk: 60, cd: 0.7, range: 200, aoe: 70, guard: 0.4, tex: ['b3_taizi'], desc: '出轎：親自上前排 8 秒' },
};

/** 誰插哪一營的旗（中營是太子本人） */
export const CAMPS3: Record<string, JiaoCamp> = { zhang: 'east', xiao: 'south', liu: 'west', lian: 'north', taizi: 'center' };

/** 蝦兵的波次（略過的小妖、神蹟外洩會多幾波） */
export const WAVES3: Wave[] = [
  [4, 'xia', 3, 1.5], [16, 'xia', 4, 1.0], [30, 'xia', 4, 1.2], [44, 'xia', 5, 0.9],
  [60, 'xia', 4, 1.0], [76, 'xia', 5, 0.9], [92, 'xia', 5, 1.0], [110, 'xia', 5, 0.9],
  [128, 'xia', 5, 1.0], [146, 'xia', 6, 0.8], [164, 'xia', 5, 1.0], [182, 'xia', 6, 0.8],
];

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
  // 隊伍越大，蛟要磨得越久（每多一個成員力氣 +8%）；重來一次，蛟的力氣也耗掉一些（每次 -15%）
  const big = 1 + 0.08 * (members.length - 4);
  // 阿玲的孩子、阿凱的陣頭：凡人的聲音傳過來，太子全開更久（D10）
  const voices = r.b.aling === 'pacifier' || r.b.akai === 'danced';
  return {
    mode: 'jiao',
    members,
    palanquin: { hp: 320, smite: 0, bless: 0 },
    boss: { hpMul: big * Math.pow(0.85, r.retries), atkMul: 1, chargeEvery: 0, skipCharges: 0 },
    // 渡伯編入北營：帶路，知道蛟翻江之後喘息時的弱點
    bellyWound: !!r.flags.recruit_dubo,
    extraWaves: Math.min(4, r.bossAdds),
    extraKinds: ['xia', 'xia'],
    skills: Object.keys(RELEASE_SKILL3).filter((g) => r.cases[g]?.verdict === 'release').map((g) => RELEASE_SKILL3[g]),
    spells: ['qiankun', 'chujiao'],
    waves: WAVES3,
    jiao: {
      surgeEvery: 12,
      dragEvery: 20,
      formationDmg: 0.15,
      taizi: { ...MEMBER_STATS3.taizi },
      chujiaoTime: 8,
      fullTime: voices ? 14 : 10,
      camps: CAMPS3,
    },
    duration: 210,
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
      // 大綱：太子沉默 2 秒 → 章將軍「太子，弟兄們都在。」→ 五將齊喊 →（凡人的聲音）→ 太子全開
      // 戰鬥畫面用 FULLPOWER_CUES3 播成鏡頭特寫；這裡的 say 是給信徒錄、測試用的摘要
      { id: 'wuying', label: '五將齊喊', test: () => true, say: '太子沉默了。章將軍：「太子，弟兄們都在。」\n五營兵將齊聲：「在！」\n太子：「……我知道我是誰。」' },
    ],
    ok: '太子全開。',
    effect: '太子全開：全員攻擊 ×1.5、法術冷卻 ×0.4、太子出轎可以再用',
  },
];

export const FINALE_WRONG3 = '蛟翻了一個浪，笑得更大聲了。（攻擊 ×1.1）';

/**
 * 陣前審問第 3 輪（10%）的鏡頭特寫：戰鬥不停，字幕依戰鬥時間連播（秒數＝第 3 輪之後過了幾秒）。
 * voice：只有凡人的聲音傳過來時才播（阿玲請到奶嘴、阿凱陣頭跳完）。
 * 【待定】兩句凡人的聲音（孩子的笑聲、電音鼓點）是照大綱自行補的字幕，語氣待作者確認（計畫 §7 Q26）。
 * 最後一句播完（core/boss.ts 的 CUE_TIME）太子全開。
 */
export const FULLPOWER_CUES3: { at: number; who: string; text: string; voice?: 'aling' | 'akai' }[] = [
  { at: 0, who: '', text: '（太子沒有說話。）' },
  { at: 2, who: '章將軍', text: '「太子，弟兄們都在。」' },
  { at: 3.2, who: '五營兵將', text: '「在！」' },
  { at: 4.2, who: '', text: '（庄裡傳來孩子咯咯的笑聲。）', voice: 'aling' },
  { at: 4.2, who: '', text: '（廟埕那邊，電音鼓點響了起來。）', voice: 'akai' },
  { at: 5, who: '太子', text: '「……我知道我是誰。」' },
];
