/**
 * 第三章「新瀛・太子出營」（取材：太子爺聖誕與五營信仰；地點參考臺南新營太子宮，遊戲中一律用虛構名稱）。
 * 玩家扮演太子爺：新瀛太子殿的中壇元帥，帶著五營兵將出營掃蕩。
 * 白天乾坤圈打爆小妖、營旗下五格收容；晚上點將問罪（每晚 2 案）；最後一夜疾水溪・斬蛟或收蛟。
 *
 * 進度見 docs/第三章_開發計畫.md。第 1 階段只有資料；規則與畫面在之後的階段接上：
 *  - 乾坤圈動畫、威名、看相、快判、風火輪追（第 3 階段：core/renown.ts、DayScene）
 *  - 點將問罪畫面、每晚 2 案、壓一晚、路邊點將（第 4 階段：core/dianjiang.ts、ui/dianjiang.ts、TrialScene）
 *  - 蛟的 jiao 模式（第 5 階段：core/boss.ts、ch3/finale.ts、BossScene）
 */
import type { ChapterDef } from '../chapter';
import { run } from '../../state';
import { bandLine3 } from '../../art/xinyingSpec';
import { SKILLS } from '../../core/boss';
import { CASES3, EVIDENCE3 } from './cases';
import { CARDS3, PROLOGUE3, PROLOGUE_JIAO3, bossEffects3, epitaphs3, ghostEpitaphs3, jiaoEpitaph, ledger3, newBelievers3 } from './believers';
import { DAY_PLANS3, UNLOCKS3, dawn3, endOfDay3_3, verdictEffects3 } from './days';
import { BANTER3 } from './banter';
import { FINALE_ROUNDS3, FINALE_WRONG3, GHOST_MEMBERS3, MEMBER_STATS3, RELEASE_SKILL3, finaleSetup3 } from './finale';

/** 營旗下五格：東青、南紅、西白、北黑、中黃 */
export const CAMP_SLOTS = [
  { label: '東營', color: 0x2f8f5a },
  { label: '南營', color: 0xc8372d },
  { label: '西營', color: 0xe8e4da },
  { label: '北營', color: 0x2a2a34 },
  { label: '中營', color: 0xe9b949 },
];

export const CHAPTER3: ChapterDef = {
  id: 'xinying', place: '新瀛', title: '太子出營', god: '太子爺', look: 'plain',
  prologue: PROLOGUE3,
  jiao: PROLOGUE_JIAO3,
  prologueLine: '炳伯：「九月初九快到了……請示太子，今年出不出營。」',
  days: DAY_PLANS3,
  // 白天：五營旗 → 東營章將軍 → 南營霄將軍 → 太子神轎（中營）→ 西營柳將軍 → 北營廉將軍 → 營兵
  // 營兵依收編（編入五營）的數量變多（art/xinyingSpec.ts 的 bandLine3）
  band: () => bandLine3(Object.values(run.cases).filter((c) => c.verdict === 'recruit').length),
  cases: CASES3,
  evidence: EVIDENCE3,
  cards: CARDS3,
  newBelievers: () => ({ ...newBelievers3() }),
  ledger: ledger3,
  bossEffects: bossEffects3,
  epitaphs: epitaphs3,
  ghostEpitaphs: ghostEpitaphs3,
  finalEpitaph: jiaoEpitaph,
  dawn: dawn3,
  endOfDay3: endOfDay3_3,
  verdictEffects: verdictEffects3,
  verdictName: { release: '超渡', recruit: '編入五營', escort: '押送', slay: '太子親斬' },
  releaseSkill: (id) => {
    const k = RELEASE_SKILL3[id];
    return k ? SKILLS[k] : null;
  },
  held: {
    label: '營旗下', sub: '今晚點將', icon: 'w3_flags',
    collect: (n) => `五營兵將一擁而上，\n${n}被押回了營旗下。\n今晚點將問罪。`,
  },
  imp: {
    mode: 'ring', verb: '乾坤圈', skipAdds: 1,
    result: '乾坤圈飛出去，小妖當場炸開。不花時辰、不加戾氣；牠們不會跟到最後一戰',
    story: '太子手一揚，乾坤圈呼地飛出去，繞了一圈回到手上。小妖們連叫都來不及叫，就炸成一團水花。\n太子：「就這樣？」',
  },
  trial: {
    style: 'dianjiang',
    perNight: 2,
    generals: [
      { camp: 'east', name: '東營・章將軍', portrait: '章將軍', color: 0x2f8f5a, does: '說謊 → 帶人證（證詞）對質', shout: ['「太子，交給我。」', '「人證在此。」'] },
      { camp: 'west', name: '西營・柳將軍', portrait: '柳將軍', color: 0xe8e4da, does: '狡辯 → 甩出物證、文獻', shout: ['「中。」'] },
      { camp: 'south', name: '南營・霄將軍', portrait: '霄將軍', color: 0xc8372d, does: '純嗆聲 → 當場嚇破膽', shout: ['「打就對了啦！」', '「你說什麼？再說一次！」'] },
    ],
    plaque: '中　壇　元　帥',
    officers: [{ tex: 'w3_zhang', label: '東營・章將軍' }, { tex: 'w3_xiao', label: '南營・霄將軍' }],
    lobbyTitle: (n) => `第 ${n} 夜・點將問罪`,
    open: (n) => `${n}被押上堂來，還在嘴硬。\n章將軍：「太子，人帶到了。」`,
    listTitle: '狠話',
    ask: '逼問', show: '點將',
    record: '章將軍記下',
    wrongTail: '點錯了。牠嗆了回來，太子的火氣上來了。',
    rule: '點錯了牠會嗆回來，太子怒氣 +1；怒氣滿 3，太子直接斬',
    again: '章將軍：「太子，別急，再問一輪。」',
    recruitSay: '「願入五營，聽太子差遣。」',
    slayLine: (n) => `太子：「不必多言。」\n火尖槍一落，${n}散成一縷黑煙。`,
    wrongedLine: '太子收起火尖槍，很久沒有說話。',
    shipLine: (n) => `${n}被押走了。`,
    finalLabel: '出陣・疾水溪',
  },
  finale: {
    // 戰鬥是 jiao 模式（第 5 階段）；過場劇情在 ch3/story.ts（第 6 階段）
    story: 'jiao3', cutTitle: '蛟現身', cutSub: '最後一戰・疾水溪',
    title: '最後一戰・疾水溪', place: '疾水溪舊渡口', bossName: '蛟', bossFrom: '蛟從溪裡來 ▶',
    setup: finaleSetup3,
    rounds: FINALE_ROUNDS3,
    wrong: FINALE_WRONG3,
    members: MEMBER_STATS3,
    ghostMembers: GHOST_MEMBERS3,
    ends: [
      { kind: 'recall', label: '收為坐騎', desc: '蛟低頭，成了太子的坐騎；疾水溪恢復平靜', needRound: 2 },
      { kind: 'slay', label: '太子親斬', desc: '真惡：不加戾氣，威名 +1' },
      { kind: 'return', label: '押回水府', desc: '平安，但溪底還有東西' },
    ],
    winTitle: '蛟沉到了水邊',
    winText: '溪水不再倒流了。蛟伏在淺灘上喘氣，金色的眼睛看著太子。要怎麼判？',
    recallStory: 'jiaoRecall',
    endStory: { recall: 'jiaoRecall', slay: 'jiaoSlay3', return: 'jiaoReturn3' },
    closeStory: 'shouying3',
    loseText: '隊伍退回堤防重整。\n把血少的將軍輪流退到後排；蛟翻江之前，讓北營廉將軍站到前排。\n下次蛟的力氣會少一些。',
    dawnText: '天快亮了，蛟退回溪底。今晚再戰一次：\n下次蛟的力氣會少一些。',
  },
  temple: 'temple_taizi',
  endSub: '新瀛太子出營・收營之後',
  // ----- 第三章的規則 -----
  slots: 5,
  startHeld: ['yamupo', 'shuigui', 'huosha'],
  slotLabels: CAMP_SLOTS,
  overnight: 'tame',
  slayRule: 'renown',
  chase: true,
  unlocks: UNLOCKS3,
  banter: BANTER3,
  prologueStory: 'kaiying3',
  dawnStory: { 3: 'river3' },
};
