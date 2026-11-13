// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章「白砂墩・媽祖徒步進香」（取材：白沙屯媽祖徒步進香；白沙屯拱天宮 → 遊戲中的白砂墩拱辰宮、北港朝天宮 → 北津朝聖宮、
 * 濁水溪 → 渾水溪、通霄 → 通汐。遊戲中一律用虛構名稱，取材出處只寫在註解與 _agent／docs）。
 * 計畫：_agent/ch4-baishatun-plan.md（承峰定案 2026-11-13）。
 *
 * 玩家是頭旗下的無形兵馬領隊。路不是玩家選的：轎子在路口頓一下、轉進去，玩家只能決定前哨押哪（core/procession.ts）。
 * 媽祖全章不露臉：畫面上只有四人小轎、粉紅遮雨布和布幔；稱呼「媽祖」，這一尊叫白砂墩媽。有手機和直播（跟轎台）。
 * 對鬼不斬（只有魔王茫渡可以斬），這一章關掉威名（不設 slayRule）。
 *
 * 整章：序章 → 起駕 → 第一天 → 第一夜問歸處 → 天亮 → 第二天 → 第二夜（進火）→ 天亮 → 第三天（回程）→ 入夜直接過溪：
 * 最後一戰 ford（渾水溪・茫渡、人鏈；一定贏）→ 結局（喚回／送回／斬）→ 回宮 → 開爐的黃曆 → 開爐 → 信徒錄。
 * 第一天的字照 _agent/ch4-text-day1.md＋ch4-text-fixes.md、第二天照 ch4-text-day2.md、第三天以後照 ch4-text-day3.md（作者尚未定稿）。
 */
import type { ChapterDef } from '../chapter';
import { bandLine4 } from '../../art/baishadunSpec';
import { CASES4, EVIDENCE4 } from './cases';
import { CARDS4, PROLOGUE4, PROLOGUE_JIAO4, bossEffects4, epitaphs4, ghostEpitaphs4, ledger4, mangduEpitaph, newBelievers4 } from './believers';
import { DAY_PLANS4, UNLOCKS4, dawn4, endOfDay3_4, verdictEffects4 } from './days';
import { FINALE_ROUNDS4, FINALE_WRONG4, GHOST_MEMBERS4, MEMBER_STATS4, chainLines4, finaleSetup4, fordChatKey4, fordEnd4 } from './finale';
import { BANTER4 } from './banter';

/** 頭旗下 4 格（鬼是「跟在頭旗後面走」） */
export const SLOTS4 = 4;

export const CHAPTER4: ChapterDef = {
  id: 'baishadun', place: '白砂墩', title: '媽祖徒步進香', god: '媽祖', look: 'harbor',
  prologue: PROLOGUE4,
  jiao: PROLOGUE_JIAO4,
  // 1-3 押尾
  prologueLine: '押尾：「三天後出門。去哪條路，別問我，我也是用跟的。」',
  askLabel: '請示媽祖',
  days: DAY_PLANS4,
  // 頭旗 → 香擔 → 四人小轎（粉紅遮雨布）→ 香燈腳（一天比一天多）。都不是可以點的東西（BandScene 的隊伍沒有 setInteractive）
  band: (day) => bandLine4(day),
  cases: CASES4,
  evidence: EVIDENCE4,
  cards: CARDS4,
  newBelievers: () => ({ ...newBelievers4() }),
  ledger: ledger4,
  bossEffects: bossEffects4,
  epitaphs: epitaphs4,
  ghostEpitaphs: ghostEpitaphs4,
  finalEpitaph: mangduEpitaph,
  dawn: dawn4,
  endOfDay3: endOfDay3_4,
  verdictEffects: verdictEffects4,
  verdictName: { tobeijin: '帶去北津', tohome: '帶回白砂墩', here: '就在這裡下', leave: '不帶' },
  releaseSkill: () => null,
  held: {
    label: '頭旗下', sub: '跟著走', icon: 'st_touqi',
    // 第一天的兩個鬼都有自己的帶走結果（GhostCase.meet.taken）；這句只給還沒寫的鬼用
    collect: (n) => `${n}跟到了頭旗後面。今晚問歸處。`,
  },
  imp: {
    mode: 'stray', verb: '派押尾回頭喊他', hours: 1,
    result: '把被帶偏的人喊回來',
    // 5-3 派兵回頭喊的結果
    story: '押尾走回隊尾，站在那個阿伯的耳邊。\n押尾：「金水伯。隊伍在這邊。」\n阿伯愣了一下，摸摸耳朵，轉身走回大路。\n牽路仔：「嘖。有人記得他名字喔。」\n招手的人影縮回電線桿後面，不見了。',
    // 5-4 託點心站顧的結果
    entrustStory: '茶水攤的阿伯倒茶倒到一半，抬頭看到林子邊有人。\n茶水攤的阿伯：「欸！那邊沒有路啦！來，先喝一杯再走。」\n戴斗笠的阿伯走回來，接過茶。林子邊的人影不招手了。\n茶水攤這段路要顧著他，不能再幫別的事。',
    skip: '有人被帶偏、沒跟上（記遺憾）',
  },
  trial: {
    style: 'guihu',
    plaque: '問　歸　處',
    officers: [{ tex: 'folk1', label: '前哨' }, { tex: 'folk2', label: '押尾' }],
    lobbyTitle: (n) => `第 ${n} 夜・問歸處`,
    // ch4-text-fixes.md 2-3
    open: () => '前哨：「不用跪，坐著講。你本來是要去哪裡？」',
    listTitle: '他說的',
    ask: '再問', show: '對照',
    record: '押尾記下',
    wrongTail: '對不上。他不太想說了，怨氣 +1。',
    rule: '對照錯了，怨氣 +1；怨氣到 3，他就不肯再開口。這一章對鬼不斬',
    // ch4-text-fixes.md 2-3
    again: '押尾：「這句再問一次。他剛才講到一半停了。」',
    recruitSay: '',
    slayLine: () => '',
    wrongedLine: '',
    shipLine: (n) => `${n}跟著走。`,
    finalLabel: '出陣・渾水溪',
    // 開場：第一夜照 ch4-text-day1.md 第 8 節；第二夜照 ch4-text-day2.md 11-1
    intro: (n) => n === 2
      ? '後半夜。廟門關了一半，香擔在裡面，有人輪班守。廟埕睡滿了人。\n前哨：「領隊，旗後面今晚要問的，帶到外面騎樓問。這裡不能吵。」\n押尾：「小聲問。問清楚他們要去哪。」'
      : '半夜。車行的鐵門拉下一半，轎子在裡面。香燈腳睡滿了騎樓。\n前哨：「領隊，旗後面那兩位，今晚要問。」\n押尾：「問他們要去哪。問清楚了才知道怎麼帶。」',
    note: '問歸處：每個鬼嘴上說一個地方，其實該去另一個地方。問出來，再決定帶去哪。對鬼不斬。',
    // 11-2 第二夜的說明
    nightNote: { 2: '今晚人已經在北津。「帶去北津」就是今晚跟著頭旗進廟門，當晚放下。' },
  },
  finale: {
    // ford（core/boss.ts）＝顧人過溪、人鏈、茫渡起霧叫人往下游（finale.ts）。字照 ch4-text-day3.md 第 7 節
    // 第三天沒有問歸處：日落之後直接播 mangdu4 → 戰鬥（DayPlan.follow.stay.finale）
    story: 'mangdu4', cutTitle: '茫渡現身', cutSub: '最後一戰・渾水溪',
    // 7-1 戰鬥說明卡（開打前蓋在操作面板上，按了才開始）
    briefing: {
      title: '顧人過溪',
      text: '【待定】茫渡不打人，牠學人講話叫人（沒有人會被帶走）。\n前哨守隊伍前段，押尾守隊尾，可以換位。前兩天你幫過的人會下水牽人，幫過幾位就有幾段人鏈。\n香擔和轎子已經在對岸。牠碰不到。',
    },
    title: '最後一戰・渾水溪', place: '渾水溪', bossName: '茫渡', bossFrom: '茫渡在霧裡 ▶',
    setup: finaleSetup4,
    rounds: FINALE_ROUNDS4,
    wrong: FINALE_WRONG4,
    members: MEMBER_STATS4,
    ghostMembers: GHOST_MEMBERS4,
    // 7-6：喚回要問完三輪、送回要問完第二輪、斬一開始就能選（斬只對茫渡；威名關掉，斬沒有加成）。desc 是按鈕小字
    ends: [
      { kind: 'recall', label: '喚回：留在溪邊引路', desc: '牠留在渾水溪。以後有人涉水，牠在前面帶。牠還是在溪底，沒有離開。（要問完三輪）', needLast: true },
      { kind: 'return', label: '送回：送牠上對岸', desc: '最後一趟靠岸，牠就了了。以後渾水溪沒有擺渡的，明年過溪沒有人帶。', needRound: 2 },
      { kind: 'slay', label: '斬', desc: '霧馬上散。今晚被叫走的人都找得回來。牠就沒有了，牠是誰也不用再問。這一章只有牠可以斬。' },
    ],
    winTitle: '過溪了',
    winText: '隊尾上了對岸。水裡的人，一個都沒有少。',
    judgeText: '霧停了。水裡的人還在過溪。茫渡站在水面上，等你們講話。',
    recallStory: 'mangduRecall4',
    endStory: { recall: 'mangduRecall4', return: 'mangduReturn4', slay: 'mangduSlay4' },
    // 結局 → 回宮（換八人大轎）→ 開爐的黃曆（第 12 天，「昨日」寫第三天沒辦成的事）→ 開爐 → 信徒錄
    closeStory: 'huigong4',
    afterClose: { key: 'almanac', data: { epilogue: true } },
    onEnd: (r) => fordEnd4(r),
    // 作者定案（爽Game）：這一戰一定贏（core/boss.ts），沒有遺憾、沒有人被帶走；斬茫渡不加戾氣
    slayFree: true,
    // 一定贏，下面兩句不會出現（FinaleDef 必填）
    loseText: '',
    dawnText: '',
    chainLines: chainLines4,
    chatKey: fordChatKey4,
  },
  // 開爐（第 12 天）：收尾的黃曆，按鈕播開爐過場（kailu4），之後信徒錄。
  // 劇本沒有這一頁的宜忌與舊聞：只寫日子（三月二十，回宮後第十二天）與「開爐」，其他欄空著
  epilogue: {
    title: '開爐', area: '白砂墩拱辰宮・回宮後第十二天', button: '開　爐', story: 'kailu4',
    almanac: () => ({ lunar: '三月二十', yi: '開爐', ji: '', source: '', text: '' }),
  },
  // 第二夜開審前：進火
  nightStory: { 2: 'jinhuo4' },
  // 黃曆「起駕」之後：出發過場（第二天 ch4-text-day2.md 第 2 節、第三天 ch4-text-day3.md 1-2）
  departStory: { 2: 'chufa4_2', 3: 'chufa4_3' },
  // 天亮過場：第一夜 → 第二天黃曆之前播 tianliang4_1；第二夜 → 第三天黃曆之前播 tianliang4_2
  dawnStory: { 2: 'tianliang4_1', 3: 'tianliang4_2' },
  // 第三天：新娘有跟著，堤防上那一組互嗆換成她那一組（banter.ts 的 rest@3#xinniang）
  banterTag: (r) => (r.cases.xinniang?.verdict === 'tohome' ? 'xinniang' : undefined),
  temple: 'temple_gongchen',
  endSub: '白砂墩媽祖徒步進香・回宮之後',
  // ----- 第四章的規則 -----
  slots: SLOTS4,
  overnight: 'carry',
  unlocks: UNLOCKS4,
  banter: BANTER4,
  prologueStory: 'qitou4',
  openingStory: 'qijia4',
  follow: { reportLabel: '稟報', reportVerb: '稟報' },
  // 草鞋丁（帶去北津）第二夜到北津放下時播 fangxia_caoxie4
  guihu: { dests: { beijin: { name: '北津', night: 2 }, home: { name: '白砂墩', night: 4 } }, releaseStory: { caoxie: 'fangxia_caoxie4' } },
  // 第 B2 輪：第三天、最後一戰、回宮、開爐、信徒錄的字到齊，拿掉試玩版的天數限制（playableDays／sliceEnd／sliceStory）：
  // 和第一～三章一樣，從序章一路走到開爐、信徒錄。
};
