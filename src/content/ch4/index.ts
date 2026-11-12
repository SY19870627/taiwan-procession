/**
 * 第四章「白砂墩・媽祖徒步進香」（取材：白沙屯媽祖徒步進香；白沙屯拱天宮 → 遊戲中的白砂墩拱辰宮、北港朝天宮 → 北津朝聖宮、
 * 濁水溪 → 渾水溪、通霄 → 通汐。遊戲中一律用虛構名稱，取材出處只寫在註解與 _agent／docs）。
 * 計畫：_agent/ch4-baishatun-plan.md（承峰定案 2026-11-13）。
 *
 * 玩家是頭旗下的無形兵馬領隊。路不是玩家選的：轎子在路口頓一下、轉進去，玩家只能決定先鋒押哪（core/procession.ts）。
 * 媽祖全章不露臉：畫面上只有四人小轎、粉紅遮雨布和布幔；稱呼「媽祖」，這一尊叫白砂墩媽。有手機和直播（跟轎台）。
 * 對鬼不斬（只有魔王茫渡可以斬），這一章關掉威名（不設 slayRule）。
 *
 * 【第 1 階段】引擎＋暫代內容：白天跟轎（押先鋒、臨時轉進、停駕點、駐駕）、牽路仔、稟報、日落傳消息、問歸處、跨天佔格。
 * 試玩版只做到第一天（playableDays 1）：第一夜天亮後接試玩結束畫面。第二、三天與最後一戰 ford 是 TODO 骨架。
 */
import type { ChapterDef } from '../chapter';
import { bandLine4 } from '../../art/baishadunSpec';
import { CASES4, EVIDENCE4 } from './cases';
import { CARDS4, PROLOGUE4, PROLOGUE_JIAO4, bossEffects4, epitaphs4, ghostEpitaphs4, ledger4, mangduEpitaph, newBelievers4 } from './believers';
import { DAY_PLANS4, UNLOCKS4, dawn4, endOfDay3_4, verdictEffects4 } from './days';
import { FINALE_ROUNDS4, FINALE_WRONG4, GHOST_MEMBERS4, MEMBER_STATS4, finaleSetup4 } from './finale';

/** 頭旗下 4 格（鬼是「跟在頭旗後面走」） */
export const SLOTS4 = 4;

export const CHAPTER4: ChapterDef = {
  id: 'baishadun', place: '白砂墩', title: '媽祖徒步進香', god: '媽祖', look: 'harbor',
  prologue: PROLOGUE4,
  jiao: PROLOGUE_JIAO4,
  prologueLine: '【待定】「三天後出門。去哪條路，別問我，我也是用跟的。」',
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
    collect: (n) => `【待定】押尾走過去，跟${n}說了幾句。\n${n}跟到了頭旗後面。今晚問歸處。`,
  },
  imp: {
    mode: 'stray', verb: '派兵回頭喊', hours: 1,
    result: '【待定】把被帶偏的人喊回來',
    story: '【待定】押尾帶兵往回跑，在岔出去的小路上把人喊了回來。',
    entrustStory: '【待定】點心站的阿姨跑過去，把人拉回隊伍。',
    skip: '有人被帶偏、沒跟上（記遺憾）',
  },
  trial: {
    style: 'guihu',
    plaque: '問　歸　處',
    officers: [{ tex: 'folk0', label: '頭旗手' }, { tex: 'folk2', label: '押尾' }],
    lobbyTitle: (n) => `第 ${n} 夜・問歸處`,
    open: (n) => `【待定】${n}在頭旗下坐了下來。\n押尾：「你說你要去哪？」`,
    listTitle: '牠說的',
    ask: '再問', show: '對照',
    record: '押尾記下',
    wrongTail: '【待定】對不上。牠不太想說了，怨氣 +1。',
    rule: '對照錯了，怨氣 +1；怨氣到 3，牠就不肯再開口。這一章對鬼不斬',
    again: '【待定】押尾：「不急，路還長。」',
    recruitSay: '',
    slayLine: () => '',
    wrongedLine: '',
    shipLine: (n) => `${n}跟著走。`,
    finalLabel: '出陣・渾水溪',
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
      { kind: 'recall', label: '喚回', desc: '【待定】留在溪邊當引路的', needLast: true },
      { kind: 'return', label: '送回', desc: '【待定】送上對岸，了了' },
      { kind: 'slay', label: '斬', desc: '【待定】' },
    ],
    winTitle: '【待定】',
    winText: '【待定】',
    recallStory: 'mangduRecall4',
    endStory: { recall: 'mangduRecall4', return: 'mangduReturn4', slay: 'mangduSlay4' },
    closeStory: 'huigong4',
    loseText: '【待定】',
    dawnText: '【待定】',
  },
  temple: 'temple_gongchen',
  endSub: '白砂墩媽祖徒步進香・回宮之後',
  // ----- 第四章的規則 -----
  slots: SLOTS4,
  overnight: 'carry',
  unlocks: UNLOCKS4,
  prologueStory: 'qitou4',
  follow: { reportLabel: '稟報', reportVerb: '稟報' },
  guihu: { dests: { beijin: { name: '北津', night: 2 }, home: { name: '白砂墩', night: 4 } } },
  playableDays: 1,
  sliceEnd: {
    title: '第四章試玩到這裡',
    text: '【待定】第二天待續。\n轎子明天會往哪裡走，只有媽祖知道。',
  },
};
