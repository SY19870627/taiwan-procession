/**
 * 第二章「東津・迎王」（取材：屏東東港迎王平安祭典）。
 * 玩家扮演雲王爺：東盛宮的主神，迎王期間替代天巡狩的千歲爺開路。
 * 白天遶境收容、晚上在代天府調閱案卷、最後一夜護送王船出海。
 */
import type { ChapterDef } from '../chapter';
import { SKILLS } from '../../core/boss';
import { CASES2, EVIDENCE2 } from './cases';
import { CARDS2, PROLOGUE2, PROLOGUE_JIAO2, bossEffects2, epitaphs2, ghostEpitaphs2, ledger2, newBelievers2, tideEpitaph } from './believers';
import { DAY_PLANS2, dawn2, endOfDay3_2, verdictEffects2 } from './days';
import { FINALE_ROUNDS2, FINALE_WRONG2, GHOST_MEMBERS2, MEMBER_STATS2, RELEASE_SKILL2, finaleSetup2 } from './finale';

export const CHAPTER2: ChapterDef = {
  id: 'dongjin', place: '東津', title: '迎王', god: '雲王爺', look: 'harbor',
  prologue: PROLOGUE2,
  jiao: PROLOGUE_JIAO2,
  prologueLine: '黃總理：「龍骨裂了三次……請示千歲爺吧。」',
  days: DAY_PLANS2,
  // 白天：王令旗 → 中軍府轎 → 雲府千歲（主神）→ 大千歲轎 → 三千歲轎 → 鹽米隊；第三天王船上岸跟在後面
  band: (day) => day === 3
    ? [['wlflag', 860, 0.8], ['jb_white', 730, 0.6], ['jb_blue', 560, 0.66], ['wangchuan_land', 280, 0.62], ['yanmi', 70, 0.72]]
    : [['wlflag', 860, 0.8], ['jb_white', 730, 0.6], ['jb_blue', 560, 0.66], ['jb_yellow', 390, 0.6], ['jb_black', 230, 0.6], ['yanmi', 80, 0.72]],
  cases: CASES2,
  evidence: EVIDENCE2,
  cards: CARDS2,
  newBelievers: () => ({ ...newBelievers2() }),
  ledger: ledger2,
  bossEffects: bossEffects2,
  epitaphs: epitaphs2,
  ghostEpitaphs: ghostEpitaphs2,
  finalEpitaph: tideEpitaph,
  dawn: dawn2,
  endOfDay3: endOfDay3_2,
  verdictEffects: verdictEffects2,
  verdictName: { release: '超渡', recruit: '留府當差', ship: '上王船', slay: '行刑' },
  releaseSkill: (id) => {
    const k = RELEASE_SKILL2[id];
    return k ? SKILLS[k] : null;
  },
  held: {
    label: '王令下', sub: '今晚調卷', icon: 'wlflag',
    collect: (n) => `中軍府的令牌一亮，\n${n}低著頭，跟著隊伍回到了王令下。\n今晚在代天府調閱牠的案卷。`,
  },
  imp: {
    mode: 'decree', verb: '押煞上船', perDay: 2,
    result: '王令一下，小妖自己走上王船，送王那晚一起帶走；牠們不會跟到最後一戰',
    story: '黃色的王令旗一展。小妖們垂著頭，一隻跟著一隻，走進隊伍後面的王船裡。',
  },
  trial: {
    style: 'dossier',
    plaque: '代　天　巡　狩',
    officers: [{ tex: 'zhongjun', label: '中軍府' }, { tex: 'zhongjun', label: '巡捕', tint: 0x9ab0d0 }],
    lobbyTitle: (n) => `第 ${n} 夜・代天府調閱案卷`,
    open: (n) => `中軍府呈上${n}的案卷。\n中軍府：「千歲爺調閱。案卷上寫的，你認不認？」`,
    listTitle: '案卷記載',
    ask: '問牠', show: '補正',
    record: '中軍府提筆補正案卷',
    wrongTail: '駁回！案卷對不上，鬼起了疑心，怨氣 +1。',
    rule: '補正錯了會被駁回，怨氣 +1；怨氣到 3，牠就不肯再開口',
    again: '中軍府：「再翻翻案卷。」',
    recruitSay: '「願留在代天府當差，聽千歲爺差遣。」',
    slayLine: (n) => `千歲爺硃筆一勾，中軍府令下行刑。${n}化成一縷黑煙，散了。`,
    wrongedLine: '千歲爺放下了硃筆，很久沒有說話。',
    shipLine: (n) => `中軍府把${n}的案卷封好，押上了王船。`,
    finalLabel: '出陣・送王',
  },
  finale: {
    story: 'tide3', cutTitle: '黑潮現身', cutSub: '送王・護送王船出海',
    title: '送王・護送王船', place: '大鵬澳沙灘', bossName: '黑潮', bossFrom: '黑潮從海裡來 ▶',
    setup: finaleSetup2,
    rounds: FINALE_ROUNDS2,
    wrong: FINALE_WRONG2,
    members: MEMBER_STATS2,
    ghostMembers: GHOST_MEMBERS2,
    ends: [
      { kind: 'recall', label: '一起送走', desc: '黑潮跟著王船出海，船員終於回家', needLast: true },
      { kind: 'return', label: '鎮回海裡', desc: '王船送出去了，但海裡還有東西' },
      { kind: 'slay', label: '斬', desc: '黑潮散成浪花。戾氣 +1，記遺憾' },
    ],
    winTitle: '王船到了沙灘',
    winText: '金紙堆好了，疏文唸完了。黑潮停在浪邊，看著王船。要怎麼判？',
    recallStory: 'sendoff',
    loseText: '王船被拖回去一段，隊伍退回堤防重整。\n觸手拖船時先用王令押走；浪頭升起時，把血少的陣頭退到後排。\n下次王船會走得順一些。',
    dawnText: '天快亮了，王船還沒到沙灘。今晚再送一次：\n下次王船會走得順一些。',
  },
  temple: 'temple_daitian',
  endSub: '東津迎王・送王之後',
};
