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
 * 試玩版只做到第一天（playableDays 1）：序章 → 起駕 → 第一天 → 第一夜問歸處 → 天亮 → 試玩結束畫面。
 * 第一天的字照 _agent/ch4-text-day1.md（作者尚未定稿）。第二、三天與最後一戰 ford 是 TODO 骨架。
 */
import type { ChapterDef } from '../chapter';
import { bandLine4 } from '../../art/baishadunSpec';
import { CASES4, EVIDENCE4 } from './cases';
import { CARDS4, PROLOGUE4, PROLOGUE_JIAO4, bossEffects4, epitaphs4, ghostEpitaphs4, ledger4, mangduEpitaph, newBelievers4 } from './believers';
import { DAY_PLANS4, UNLOCKS4, dawn4, endOfDay3_4, verdictEffects4 } from './days';
import { FINALE_ROUNDS4, FINALE_WRONG4, GHOST_MEMBERS4, MEMBER_STATS4, finaleSetup4 } from './finale';
import { BANTER4 } from './banter';

const TBD = '（待寫）';

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
    // 10-2 第 1 組押尾那一句
    open: () => '押尾：「問他要去哪就好。」',
    listTitle: '他說的',
    ask: '再問', show: '對照',
    record: '押尾記下',
    wrongTail: '對不上。他不太想說了，怨氣 +1。',
    rule: '對照錯了，怨氣 +1；怨氣到 3，他就不肯再開口。這一章對鬼不斬',
    // 10-2 第 9 組押尾那一句
    again: '押尾：「等。讓他自己講。」',
    recruitSay: '',
    slayLine: () => '',
    wrongedLine: '',
    shipLine: (n) => `${n}跟著走。`,
    finalLabel: '出陣・渾水溪',
    // 第 8 節開場
    intro: () => '半夜。車行的鐵門拉下一半，轎子在裡面。香燈腳睡滿了騎樓。\n前哨：「領隊，旗後面那兩位，今晚要問。」\n押尾：「問他們要去哪。問清楚了才知道怎麼帶。」',
    note: '問歸處：每個鬼嘴上說一個地方，其實該去另一個地方。問出來，再決定帶去哪。對鬼不斬。',
  },
  finale: {
    // 【TODO 第 5 階段】ford：顧人過溪、人鏈。這一輪借第一章的戰鬥當暫代（finale.ts）
    story: 'mangdu4', cutTitle: '茫渡現身', cutSub: '最後一戰・渾水溪',
    title: '最後一戰・渾水溪', place: '渾水溪', bossName: '茫渡', bossFrom: '茫渡從霧裡來 ▶',
    setup: finaleSetup4,
    rounds: FINALE_ROUNDS4,
    wrong: FINALE_WRONG4,
    members: MEMBER_STATS4,
    ghostMembers: GHOST_MEMBERS4,
    ends: [
      { kind: 'recall', label: '喚回', desc: TBD, needLast: true },
      { kind: 'return', label: '送回', desc: TBD },
      { kind: 'slay', label: '斬', desc: TBD },
    ],
    winTitle: TBD,
    winText: TBD,
    recallStory: 'mangduRecall4',
    endStory: { recall: 'mangduRecall4', return: 'mangduReturn4', slay: 'mangduSlay4' },
    closeStory: 'huigong4',
    loseText: TBD,
    dawnText: TBD,
  },
  temple: 'temple_gongchen',
  endSub: '白砂墩媽祖徒步進香・回宮之後',
  // ----- 第四章的規則 -----
  slots: SLOTS4,
  overnight: 'carry',
  unlocks: UNLOCKS4,
  banter: BANTER4,
  prologueStory: 'qitou4',
  openingStory: 'qijia4',
  sliceStory: 'tianliang4_1',
  follow: { reportLabel: '稟報', reportVerb: '稟報' },
  guihu: { dests: { beijin: { name: '北津', night: 2 }, home: { name: '白砂墩', night: 4 } } },
  playableDays: 1,
  sliceEnd: {
    title: '第四章試玩到這裡',
    text: '試玩到這裡。第二天，往北津，待續。',
  },
};
