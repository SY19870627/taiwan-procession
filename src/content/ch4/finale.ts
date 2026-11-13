// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章最後一戰：渾水溪・茫渡（core/boss.ts 的 ford 模式；計畫 §6「最後一戰：渾水溪・茫渡」）。
 *
 * 轎子先過去了（開場 st_jiao4_ford 過溪，之後只剩對岸一點粉紅），戰場上沒有轎、沒有香擔，只有還在水裡的隊伍。
 *  - 茫渡起霧、學人講話，把人往下游的沙洲帶。牠不打人，牠是要留人（拉住前排、叫走水裡的人）。
 *  - 玩家照舊前後排換位、法術冷卻（兵馬自己的兩招：喊名、揮頭旗；媽祖不出手）。
 *  - 收編上場的鬼：判對歸處、而且有帶著走或在原地放下的鬼才會來（core/guihu.ts 的 rightVerdict；帶錯的、不帶的不會來）。
 *  - 人鏈：前兩天幫過的信徒下水牽人，段數＝傳消息加的（follow.chain）＋幫過的信徒（believers.ts 的 chainSegments4）。
 *  - 陣前審問三輪（70／40／10%）問出牠是誰：以前在這裡擺渡的。
 *  - 結局：喚回／送回／斬（斬只對茫渡）。被帶到下游的人天亮在沙洲上找到，人沒事，沒趕上回宮——開爐那頁黃曆「昨日」寫他們的名字。
 *
 * 數值是第 A 輪初版（tests/ford.test.ts 的模擬：一般打法贏得了、人鏈越長被帶走的越少）。字全部（待寫）。
 */
import type { RunState } from '../../state';
import type { BossBattle, BossSetup, MemberStats, Row, Wave } from '../../core/boss';
import type { FinaleRound } from '../finale';
import { rightVerdict } from '../../core/guihu';
import { CASES4 } from './cases';
import { chainSegments4, sandbarLines4, stragglers4 } from './believers';

/** 兵馬四隊（前哨、押尾、兩隊旗下兵馬）＋會來幫忙的鬼。立繪、戰鬥圖還沒有，先用程式畫的小人 */
export const MEMBER_STATS4: Record<string, MemberStats & { tex: string[]; desc: string }> = {
  qianshao: { key: 'qianshao', name: '前哨', role: 'melee', hp: 230, atk: 24, cd: 1.1, range: 170, aoe: 0, guard: 1, tex: ['folk1'], desc: '（待寫）前排：出手快' },
  yawei: { key: 'yawei', name: '押尾', role: 'melee', hp: 320, atk: 16, cd: 1.3, range: 170, aoe: 0, guard: 0.8, tex: ['folk2'], desc: '（待寫）前排：耐拉' },
  bingma: { key: 'bingma', name: '旗下兵馬・刀', role: 'melee', hp: 260, atk: 20, cd: 1.3, range: 170, aoe: 0, guard: 1, trait: 'block', tex: ['bajiang0'], desc: '（待寫）前排：橫掃，25% 格擋' },
  gongshou: { key: 'gongshou', name: '旗下兵馬・弓', role: 'ranged', hp: 120, atk: 16, cd: 1.5, range: 600, aoe: 40, guard: 1, tex: ['paoshou'], desc: '（待寫）後排：遠程' },
  // 會來幫忙的鬼（判對歸處的）
  caoxie: { key: 'caoxie', name: '草鞋丁', role: 'melee', hp: 340, atk: 18, cd: 1.4, range: 170, aoe: 0, guard: 0.8, tex: ['folk2'], desc: '（待寫）還了願的草鞋丁：扛得住' },
  apo: { key: 'apo', name: '點心擔阿婆', role: 'support', hp: 120, atk: 20, cd: 2.2, range: 0, aoe: 0, guard: 1, trait: 'heal', tex: ['folk3'], desc: '（待寫）鹹粥：照顧血最少的' },
  xinniang: { key: 'xinniang', name: '沒走成的新娘', role: 'ranged', hp: 110, atk: 10, cd: 1.6, range: 480, aoe: 40, guard: 1, trait: 'slow', tex: ['folk5'], desc: '（待寫）後排：讓牽路仔變慢' },
};

/** 鬼的上場順序（假香燈腳該判「不帶」，判對了也不會來） */
export const GHOST_MEMBERS4: string[] = ['caoxie', 'apo', 'xinniang'];

/** 會來幫忙的鬼：判對歸處（rightVerdict）、而且不是「不帶」 */
export function fordGhosts(r: RunState): string[] {
  return GHOST_MEMBERS4.filter((id) => {
    const want = rightVerdict(CASES4[id]);
    return !!want && want !== 'leave' && r.cases[id]?.verdict === want;
  });
}

/** 牽路仔的波次（略過的牽路仔多幾波：最多 3） */
export const WAVES4: Wave[] = [
  [5, 'qianlu', 3, 1.4], [20, 'qianlu', 3, 1.2], [36, 'qianlu', 4, 1.1], [52, 'qianlu', 4, 1.0],
  [70, 'qianlu', 4, 1.0], [88, 'qianlu', 5, 0.9], [106, 'qianlu', 4, 1.0], [124, 'qianlu', 5, 0.9],
  [142, 'qianlu', 5, 0.9], [160, 'qianlu', 5, 0.9], [178, 'qianlu', 5, 0.9],
];

export function finaleSetup4(r: RunState): BossSetup {
  const keys = ['qianshao', 'yawei', 'bingma', 'gongshou', ...fordGhosts(r)];
  let front = 0;
  const members = keys.map((k) => {
    const st = { ...MEMBER_STATS4[k] };
    const row: Row = st.role === 'melee' && front < 3 ? 'front' : 'back';
    if (row === 'front') front++;
    return { stats: st, row };
  });
  return {
    mode: 'ford',
    members,
    // 「神轎」欄位＝還在水裡的隊伍（前排沒人時茫渡把他們往回拉）
    palanquin: { hp: 300, smite: 0, bless: 0 },
    // 隊伍越大霧越濃一點（每多一個 +4%）；重來一次，茫渡的霧也耗掉一些（每次 -15%）
    boss: { hpMul: (1 + 0.04 * (members.length - 4)) * Math.pow(0.85, r.retries), atkMul: 1, chargeEvery: 0, skipCharges: 0 },
    // 第三天聽過堤防邊的老人講渡口：知道牠是擺渡的，現出渡船時打得更痛
    bellyWound: !!r.flags.ferry_heard,
    extraWaves: Math.min(3, r.follow?.strayed ?? 0),
    extraKinds: ['qianlu', 'qianlu'],
    skills: [],
    spells: ['huming', 'huiqi'],
    waves: WAVES4,
    ford: { fogEvery: 14, lureEvery: 12, lureTime: 4, chain: chainSegments4(r), stragglers: stragglers4(r) },
    duration: 210,
  };
}

/**
 * 打贏、選完判決之後：被帶到下游沙洲的人記進進度，開爐那頁黃曆「昨日」寫他們的名字（FinaleDef.onEnd）。
 */
export function fordEnd4(r: RunState, b: BossBattle): void {
  const names = [...b.stranded];
  if (r.follow) r.follow.sandbar = names;
  r.yesterday = sandbarLines4(names);
}

// ---------- 陣前審問（70／40／10%）：問出牠是以前擺渡的。字全部（待寫）；誰上前、要什麼條件是規則 ----------
export const FINALE_ROUNDS4: FinaleRound[] = [
  {
    line: '（待寫）「橋上那麼多人，一個都不下來。」',
    evidence: [],
    people: [
      { id: 'dukou', label: '請堤防邊的老人上前', test: (r) => !!r.flags.ferry_heard, say: '（待寫）老人講以前渾水溪有擺渡的那段。' },
    ],
    ok: '（待寫）第 1 輪說動牠的那句。',
    effect: '茫渡動搖：受到的傷害 ×1.15',
  },
  {
    line: '（待寫）茫渡第 2 輪的話。',
    evidence: [],
    people: [
      { id: 'caoxie', label: '請草鞋丁上前', test: (r) => r.cases.caoxie?.verdict === 'tobeijin', say: '（待寫）還了願的草鞋丁說的話。' },
      { id: 'aman', label: '請阿滿姨上前', test: (r) => r.cases.xinniang?.verdict === 'tohome', say: '（待寫）阿滿姨（女兒跟她回家了）說的話。' },
    ],
    ok: '（待寫）第 2 輪說動牠的那句。',
    effect: '茫渡動搖：攻擊 ×0.85；下一次霧起不來',
  },
  {
    line: '（待寫）茫渡第 3 輪的話（他是以前在這裡擺渡的）。',
    evidence: [],
    people: [
      { id: 'yawei', label: '押尾叫出他的名字', test: (r) => !!r.flags.ferry_heard || (r.follow?.chain ?? 0) > 0, say: '（待寫）押尾記得每個落隊的人叫什麼——也記得他。' },
    ],
    ok: '（待寫）問出他是以前擺渡的。橋蓋好以後沒人坐船，也沒人記得溪底還有一個。',
    effect: '茫渡的霧薄了一層（受到的傷害 ×1.1）；可以喚回',
  },
];

export const FINALE_WRONG4 = '（待寫）霧更濃了。（攻擊 ×1.1）';
