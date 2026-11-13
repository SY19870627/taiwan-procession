// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章最後一戰：渾水溪・茫渡（core/boss.ts 的 ford 模式；計畫 §6「最後一戰：渾水溪・茫渡」）。
 * 字照 _agent/ch4-text-day3.md 第 7 節（第 B2 輪）。
 *
 * 轎子先過去了（開場 st_jiao4_ford 過溪，之後只剩對岸一點粉紅），戰場上沒有轎、沒有香擔，只有還在水裡的隊伍。
 *  - 茫渡起霧、學人講話叫水裡的人。牠不打人，牠是要留人（拉住前排、叫人）；叫的人一定會回來（作者定案：爽Game，一定贏）。
 *  - 玩家照舊前後排換位、法術冷卻（兵馬自己的兩招：喊名、揮頭旗；媽祖不出手）。
 *  - 判對歸處、而且有帶著走或在原地放下的鬼會來幫忙（core/guihu.ts 的 rightVerdict）。第 C3 輪：只是畫面上的影子（ford.ghosts），
 *    不上場、不影響任何戰鬥數值；帶到別處的、不帶的也有溫和的結局（信徒錄不寫遺憾）。
 *  - 人鏈：幫過的信徒下水牽人，段數＝傳消息加的（follow.chain）＋幫過的信徒（believers.ts 的 chainSegments4）；台詞 7-3（chainLines4）。
 *    人鏈只影響畫面（chainVisual4），不影響任何戰鬥數值。
 *  - 陣前審問三輪（70／40／10%）：牠把人帶去哪（渡頭）→ 牠以前是誰（擺渡的）→ 沒有人記得（有人記得／押尾記一個先頂著）。
 *  - 結局：喚回（問完三輪）／送回（問完第二輪）／斬（一開始就能選；只有茫渡可以斬）。
 *  - 沒有遺憾結局：一定打贏（天亮也算過溪），斬茫渡不加戾氣（FinaleDef.slayFree）。
 */
import type { RunState } from '../../state';
import type { BossBattle, BossSetup, MemberStats, Row, Wave } from '../../core/boss';
import type { FinaleRound } from '../finale';
import type { BanterLine } from '../chapter';
import { rightVerdict } from '../../core/guihu';
import { CASES4, carried3 } from './cases';
import { chainSegments4, done3, stragglers4, xinniangWith } from './believers';
import { dawn4 } from './days';

/** 兵馬四隊（前哨、押尾、兩隊旗下兵馬）＋會來幫忙的鬼。立繪、戰鬥圖還沒有，先用程式畫的小人。desc 是系統說明（不是劇本） */
export const MEMBER_STATS4: Record<string, MemberStats & { tex: string[]; desc: string }> = {
  qianshao: { key: 'qianshao', name: '前哨', role: 'melee', hp: 230, atk: 24, cd: 1.1, range: 170, aoe: 0, guard: 1, tex: ['folk1'], desc: '前排：出手快' },
  yawei: { key: 'yawei', name: '押尾', role: 'melee', hp: 320, atk: 16, cd: 1.3, range: 170, aoe: 0, guard: 0.8, tex: ['folk2'], desc: '前排：耐拉' },
  bingma: { key: 'bingma', name: '旗下兵馬・刀', role: 'melee', hp: 260, atk: 20, cd: 1.3, range: 170, aoe: 0, guard: 1, trait: 'block', tex: ['bajiang0'], desc: '前排：橫掃，25% 格擋' },
  gongshou: { key: 'gongshou', name: '旗下兵馬・弓', role: 'ranged', hp: 120, atk: 16, cd: 1.5, range: 600, aoe: 40, guard: 1, tex: ['paoshou'], desc: '後排：遠程' },
  // 會來幫忙的鬼（判對歸處的）
  caoxie: { key: 'caoxie', name: '草鞋丁', role: 'melee', hp: 340, atk: 18, cd: 1.4, range: 170, aoe: 0, guard: 0.8, tex: ['folk2'], desc: '還了願的草鞋丁：扛得住' },
  apo: { key: 'apo', name: '點心擔阿婆', role: 'support', hp: 120, atk: 20, cd: 2.2, range: 0, aoe: 0, guard: 1, trait: 'heal', tex: ['folk3'], desc: '鹹粥：照顧血最少的' },
  xinniang: { key: 'xinniang', name: '沒走成的新娘', role: 'ranged', hp: 110, atk: 10, cd: 1.6, range: 480, aoe: 40, guard: 1, trait: 'slow', tex: ['folk5'], desc: '後排：讓牽路仔變慢' },
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

/**
 * v0.1【待定】最後一戰・鬼影子喊頭旗加油（字照 _agent/ch4-text-cheer.md）。
 * BossScene 在每個鬼影子旁邊冒一句小字：有自己那句的用自己的，其他影子輪流用 shared 兩句。只是畫面，不碰戰鬥數值。
 */
export const CHEER4: { shared: string[]; byId: Record<string, string> } = {
  shared: ['頭旗加油，我們在後面', '頭旗撐著，免驚啦'],
  byId: {
    caoxie: '加油，這趟我跟到底',
    apo: '頭旗拚一下，粥我顧著',
    xinniang: '頭旗加油，我陪阿母跟著',
    jiajiao: '加油啦，這次我看前面',
  },
};

/** 第 i 個鬼影子（id）要喊的那句：有自己的用自己的，沒有的輪流用共用兩句 */
export function cheerLine4(id: string, sharedIdx: number): string {
  return CHEER4.byId[id] ?? CHEER4.shared[sharedIdx % CHEER4.shared.length];
}

/** 牽路仔的波次（第 C3 輪：略過的牽路仔不再多加波數） */
export const WAVES4: Wave[] = [
  [5, 'qianlu', 3, 1.4], [20, 'qianlu', 3, 1.2], [36, 'qianlu', 4, 1.1], [52, 'qianlu', 4, 1.0],
  [70, 'qianlu', 4, 1.0], [88, 'qianlu', 5, 0.9], [106, 'qianlu', 4, 1.0], [124, 'qianlu', 5, 0.9],
  [142, 'qianlu', 5, 0.9], [160, 'qianlu', 5, 0.9], [178, 'qianlu', 5, 0.9],
];

/** 白天拿到「茫渡以前是擺渡的」的證據（不算黃曆上的文獻）：現出渡船時打得更痛 */
export const knowsFerry4 = (r: RunState): boolean => ['mooring', 'agong_call', 'amu_ferry'].some((id) => r.evidence.includes(id));

/**
 * 第 C3 輪（爽Game）：上場的只有兵馬四隊；判對歸處的鬼只是畫面上的幫手（ford.ghosts，BossScene 畫影子），
 * 戰鬥數值和鬼、略過的牽路仔都無關（extraWaves 0）。
 */
export function finaleSetup4(r: RunState): BossSetup {
  const keys = ['qianshao', 'yawei', 'bingma', 'gongshou'];
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
    // 隊伍越大霧越濃一點（每多一個 +4%）；重來一次，茫渡的霧也耗掉一些（每次 -15%：「茫渡喊了一夜，聲音會小一點」）
    boss: { hpMul: (1 + 0.04 * (members.length - 4)) * Math.pow(0.85, r.retries), atkMul: 1, chargeEvery: 0, skipCharges: 0 },
    // 白天找到繫船的石樁、聽過阿翰阿公或秀枝阿母講渡頭：知道牠是擺渡的，現出渡船時打得更痛
    bellyWound: knowsFerry4(r),
    extraWaves: 0,
    extraKinds: ['qianlu', 'qianlu'],
    skills: [],
    spells: ['huming', 'huiqi'],
    waves: WAVES4,
    ford: { fogEvery: 14, lureEvery: 12, lureTime: 4, chain: chainSegments4(r), stragglers: stragglers4(r), ghosts: fordGhosts(r) },
    duration: 210,
  };
}

/**
 * 判決之後（FinaleDef.onEnd）：開爐那頁黃曆的「昨日」（dawn4）。第 C3 輪：「昨日」只寫好消息或不寫——
 * 第三天沒辦成的事不再列出來。作者定案：沒有人被帶走（沒有沙洲的名字）。
 */
export function fordEnd4(r: RunState): void {
  r.yesterday = [...dawn4(r, 3)];
}

/**
 * 人鏈的畫面（作者定案：「越多人只是畫面特效越多而已」）：只決定畫面上多畫幾個人、幾盞燈，
 * 不進 BossSetup 的任何數值（BossScene 用）。
 */
export function chainVisual4(chain: number): { figures: number; lights: number } {
  const n = Math.max(0, Math.min(10, chain));
  return { figures: n, lights: n * 3 };
}

const L = (who: string, text: string): BanterLine => ({ who, text });
/** 旁白（戰鬥帶上的字幕不寫名字） */
const N = (text: string): BanterLine => ({ who: '', text });

// ---------- 陣前審問（7-5，70／40／10%）：誰上前、要什麼證據是規則；字照劇本 ----------
export const FINALE_ROUNDS4: FinaleRound[] = [
  // 第一輪：牠把人帶去哪裡
  {
    line: '「橋上那麼多人，一個都不下來。今天總算有人走我這裡。」',
    evidence: ['mooring', 'dutou_doc'],
    people: [
      {
        id: 'dengchuan', label: '請等船的人上前', test: (r) => carried3(r, 'dengchuan'),
        say: '「撐船的！你說再載一趟就回頭接我。我在樹下等到現在。」',
        lines: [
          L('等船的人', '撐船的！你說再載一趟就回頭接我。我在樹下等到現在。'),
          L('茫渡', '……你還在等？船沒有了，我沒辦法回頭。'),
          L('等船的人', '沒有船你叫人去渡頭做什麼？'),
          L('茫渡', '渡頭有人，船就會來。以前都是這樣。'),
        ],
      },
    ],
    okLines: [
      L('前哨', '你把人往下游帶。下游那個沙洲是什麼地方？'),
      L('茫渡', '渡頭。過溪要從渡頭上船。'),
      L('押尾', '堤防下面有一根繫船的石樁，打歪了。'),
      L('茫渡', '……那根是我打的。一直說要重打，沒有打。'),
    ],
    ok: '牠帶人去的沙洲是以前的渡頭。牠在叫人上船。',
    effect: '霧薄了一層：被叫走的人走得比較慢，來得及喊回來。',
  },
  // 第二輪：牠以前是誰
  {
    line: '「這條水路是我的。要過，坐我的船。走路的、走橋的，都不算過溪。」',
    evidence: ['agong_call', 'dutou_doc', 'amu_ferry'],
    okLines: [
      L('押尾', '有人說，以前這裡撐船的，不收拿旗的錢。'),
      L('茫渡', '不收。進香的走了幾百里路，到我這裡還要收錢，像話嗎。'),
      L('茫渡', '旗上有鈴。我在對岸聽到鈴，就把船靠過來。一趟一趟載，載到半夜。'),
      L('前哨', '後來呢？'),
      L('茫渡', '後來橋蓋好了。鈴聲都從上面過。'),
    ],
    ok: '牠是渾水溪擺渡的。橋通了以後，沒有人再下來坐船。',
    effect: '牠學人講話學得不像了：學來的聲音會慢半拍。可以選「送回」。',
  },
  // 第三輪：沒有人記得（秀枝的阿母：要有她的證詞，而且秀枝在橋上；押尾一定可以選）
  {
    line: '「沒有人記得了啦。溪底還有一個，誰知道？你們過了溪也不會記得。」',
    evidence: [],
    sharedLines: [
      L('茫渡', '橋通車那天，全庄的人都去橋頭看。我在渡頭等到天黑，一個都沒有。'),
      L('茫渡', '隔年做大水，船翻了。沒有人來找。沒有人要過溪，誰會來找撐船的。'),
    ],
    people: [
      {
        id: 'amu', label: '請秀枝的阿母上前', test: (r) => r.evidence.includes('amu_ferry') && done3(r, 'xiuzhi3'),
        say: '「撐船的！我坐過你的船！我阿母牽我的！你沒有跟我們收錢！」',
        lines: [
          N('橋上的鈴停了。一個很老的聲音往下喊，喊得很用力。'),
          L('秀枝的阿母', '撐船的！我坐過你的船！我阿母牽我的！你沒有跟我們收錢！'),
          L('茫渡', '……哪一個？綁兩條辮子，從上船哭到下船那個？'),
          L('秀枝的阿母', '我怕水啦！'),
          N('霧停在水面上，不動了。'),
        ],
        ok: '有人記得。坐過牠的船的人，今天晚上就在橋上。',
      },
      {
        id: 'yawei', label: '請押尾上前', test: () => true,
        say: '「你叫什麼名字？」',
        lines: [
          L('押尾', '你叫什麼名字？'),
          L('茫渡', '……撐船的。大家都叫撐船的。名字太久沒有人叫，我想不起來。'),
          L('押尾', '那我先記『渡頭撐船的』。今天晚上過溪的，我一個一個跟他們講。'),
          N('霧停在水面上，不動了。'),
        ],
        ok: '沒有人記得牠的名字，牠自己也忘了。押尾記了一個先頂著。',
      },
    ],
    ok: '沒有人記得牠的名字，牠自己也忘了。押尾記了一個先頂著。',
    effect: '霧不再往前：不會再有人被叫走。茫渡現出渡船的樣子。可以選「喚回」。',
  },
];

/**
 * 出示錯誤（三輪共用）。第 C3 輪：說不動也不加懲罰（core/boss.ts 的 answer：ford 不加攻擊）；
 * 舊字「茫渡：「聽不懂。要過溪的，這邊上船。」\n霧又厚了一層。」的「霧又厚了一層」說錯了；字：_agent/ch4-text-shuang-A.md 第 5 節
 */
export const FINALE_WRONG4 = '茫渡：「聽不懂。要過溪的，這邊上船。」\n牠沒聽進去。霧還是剛才那樣，隊伍照常往前走。';

/**
 * 第 C3 輪（爽Game）：做了的事在回宮／開爐多一個人影（stage/ch4.ts 的 rewardCrowd4）——只加不減，沒做的不扣。
 * 算的是：押中的天數、喊回來（或託點心站顧）的牽路仔、判對歸處的鬼、辦成的小事（不是五位信徒的卡；信徒走人鏈 chainSegments4）。
 */
const SIDE_CARDS4 = ['shoes2', 'heat2', 'sick2a', 'sick2b', 'flag2', 'rice2', 'kneel3', 'orange3', 'block3', 'count3'];
const SMALL_GHOSTS4: [id: string, right: string][] = [['diantou', 'here'], ['guqi', 'tobeijin']];

export function rewards4(r: RunState): number {
  const f = r.flags;
  const bets = [1, 2, 3].filter((d) => f[`bet_hit_${d}`]).length;
  const strays = Object.keys(f).filter((k) => k.startsWith('stray_') && f[k]).length;
  const ghosts = fordGhosts(r).length
    + SMALL_GHOSTS4.filter(([id, v]) => r.cases[id]?.verdict === v).length
    + (['dengchuan', 'tideng'] as const).filter((id) => carried3(r, id)).length
    + (r.cases.jiajiao?.verdict === 'leave' ? 1 : 0);
  const side = SIDE_CARDS4.filter((c) => f[`done_${c}`]).length + (f.clue_oajian ? 1 : 0);
  return bets + strays + ghosts + side;
}

/**
 * 7-3 人鏈出現時的台詞：照順序，條件不成立就跳過那一句；一段都沒有就只播最後兩句。
 * 一組一組播（BossScene：開打後先播第一組，之後每次人鏈拉住一個人播下一組）。
 */
export function chainLines4(r: RunState): BanterLine[][] {
  if (chainSegments4(r) <= 0) {
    return [[N('堤防上的人打開手機的燈往溪裡照。霧太厚，光到一半就散了。沒有人下水。'), L('押尾', '沒有人牽。我們自己來。')]];
  }
  const aman = done3(r, 'aman3');
  const out: BanterLine[][] = [[N('堤防上有人把鞋脫了，走回水裡。一個牽一個，從岸邊往溪中間排過去。')]];
  if (aman) {
    const g = [L('阿滿姨', '我腳不行，我站岸邊這一頭。後面的抓我的手，抓緊，阿姨站得住。')];
    if (xinniangWith(r)) g.push(N('阿滿姨左手抓著岸邊的芒草，右手牽人。她左邊還有一個，牽著下一個人的衣角，那個人沒有發現。'));
    out.push(g);
  }
  if (done3(r, 'xianzai3')) out.push([L('賢仔', '拖車繩三十米！一頭我綁保險桿，另一頭你們拉下去！車燈我開遠燈，看到燈的往燈走！')]);
  if (done3(r, 'arui3')) out.push([L('阿睿', '各位，畫面是白的，我知道。我現在念名字，在水裡聽到自己名字的，喊『有』！黃金水！有沒有？林美雲！')]);
  if (['wrapped', 'told'].includes(r.b.ahan) || r.flags.ledger_ahan2_walk) out.push([L('阿翰', '水才到腰而已。阿伯，旗子舉高，另一隻手給我。')]);
  if (done3(r, 'xiuzhi3')) out.push([L('秀枝', '這邊！橋墩在這邊！聽我的聲音，橋在你們左邊！左邊！'), N('橋上有鈴在響。輪椅上的阿母兩隻手抓著旗桿，一直搖。')]);
  if (r.follow?.broadcast[2] === 'jinmiao2') out.push([L('接轎的年輕人', '昨天看直播來的！我們這邊六個，排哪裡？')]);
  if (chainSegments4(r) >= 3) out.push([L('前哨', '領隊，岸上的人自己下來了。沒有人叫他們。')]);
  return out;
}

/**
 * 戰鬥互嗆換場合（只講一次的那幾組；BossHud.chat 用）：
 *  - 霧起（b_fog）：賢仔第三天辦成 → 第一次換「賢仔的車燈」（b_xianzai）；
 *  - 學人講話（b_lure）：秀枝第三天辦成 → 第一次換「橋上的鈴」（b_xiuzhi）；人鏈出現以後 → 第一次換茫渡「你們手牽那麼緊」（b_lureChain）。
 */
export function fordChatKey4(r: RunState, key: string, said: Set<string>, b: BossBattle): string {
  if (key === 'b_fog' && done3(r, 'xianzai3') && !said.has('b_xianzai')) return 'b_xianzai';
  if (key === 'b_lure') {
    if (done3(r, 'xiuzhi3') && !said.has('b_xiuzhi')) return 'b_xiuzhi';
    if (b.chainLeft < (b.setup.ford?.chain ?? 0) && !said.has('b_lureChain')) return 'b_lureChain';
  }
  return key;
}
