// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章的三天行程（跟轎：DayPlan.follow，見 core/procession.ts）。
 *
 * 第一天（試玩版只做到這天；字照 _agent/ch4-text-day1.md 第 3 節）：
 *   pre（海線小路 → 通汐街上：阿睿、草鞋丁、賣蚵嗲的阿桑）→ 行轎岔路（甲・防風林老路、乙・省道外環；轎子走甲）
 *   → 甲路（阿滿姨、牽路仔）→ 臨時轉進賢仔車行（過場 zhuanjin4）→ 停駕點（賢仔車行：賢仔、舊灶、點心擔阿婆）
 *   → post（車行外：阿翰、秀枝）→ 駐駕賢仔車行 → 日落傳消息（三選一，換第二天的事件池）。
 * 第二、三天（第 A 輪）：引擎與行程都接好了，字是【待定】暫代；換字照 _agent/roundA-report.md（哪個欄位放哪段字）。
 * 轎子走哪條（follow.goes）、時辰、標籤、人鏈段數是規則，換字時不要動。
 */
import type { RunState } from '../../state';
import type { DayPlan, Encounter } from '../days';
import { MISSED4 } from './believers';

const ghost = (id: string, place: string, caseId: string): Encounter => ({ kind: 'ghost', id, place, caseId });
/** 牽路仔（第 5 節）：長得像路邊招手的人影，專找隊尾 */
const stray = (id: string, place: string, text: string, stall?: string): Encounter => ({
  kind: 'imp', id, place, tex: 'qianlu', text, ...(stall ? { stall } : {}),
});

const DAY1: DayPlan = {
  day: 1, title: '第一天・去程', area: '白砂墩 → 通汐 → 省道', hours: 6, miracles: 1, theme: 'shore', art: 'coast',
  almanac: () => ({
    lunar: '三月初六', yi: '起馬　跟轎', ji: '擋路', source: '海線舊聞',
    text: '省道還是牛車路的時候，路邊有一戶人家，年年煮一鍋鹹粥等進香的人。半夜才到的，也有得吃。\n今天出白砂墩，過通汐。隊伍還短，大家互相認得。',
  }),
  // 黃曆第一段就是點心擔阿婆的文獻「海線舊聞・路邊的鹹粥」
  docs: ['xianzhou'],
  // 3-2 pre 段（海線小路 → 通汐街上）
  pre: [
    { kind: 'person', id: 'arui1', place: '海線小路', card: 'arui1', tex: 'folk1', peek: '一個年輕人舉著自拍棒倒退走，背包拉鍊沒拉。' },
    ghost('caoxie1', '海線小路・轎班後面', 'caoxie'),
    { kind: 'person', id: 'oajian1', place: '通汐街上', card: 'oajian1', tex: 'folk3' },
  ],
  routes: [
    {
      id: '甲', name: '防風林老路', color: 0xd86a8a,
      preview: ['土地公廟前的石階上坐著一個人，在揉膝蓋。', '林子邊有個人影一直招手。旁邊有一攤茶水。'],
      note: '路窄，走得慢。茶水攤已經擺好了。',
      encounters: [
        { kind: 'person', id: 'aman1', place: '防風林老路・土地公廟前', card: 'aman1', tex: 'folk3' },
        stray('stray1a', '防風林邊・茶水攤旁',
          '隊尾一個戴斗笠的阿伯越走越偏，往林子裡去。林子邊有個人影在跟他招手，手比一般人長。\n牽路仔：「這邊比較近喔，這邊。」', '茶水攤'),
      ],
    },
    {
      id: '乙', name: '省道外環', color: 0x5a7aa8,
      preview: ['檳榔攤轉角，有個人影站在工地圍籬的缺口招手。', '外環邊一攤點心站剛擺好，桌上的包子還沒有人拿。'],
      note: '路寬，可是在挖水溝，車和人擠在同一線。',
      encounters: [
        stray('stray1b', '省道外環・檳榔攤轉角',
          '檳榔攤轉角，有個人影站在工地圍籬的缺口招手。\n牽路仔：「前面的人都走這條啦，你看，有腳印。」', '外環點心站'),
      ],
    },
  ],
  // 3-9 post 段（車行外・入夜前）
  post: [
    { kind: 'person', id: 'ahan1', place: '車行旁的騎樓', card: 'ahan1', tex: 'folk1', peek: '騎樓下，一個年輕人脫了鞋，盯著自己的腳底看。' },
    { kind: 'person', id: 'xiuzhi1', place: '車行對面的路燈下', card: 'xiuzhi1', tex: 'folk4', peek: '隊伍最後到的是一台輪椅。推輪椅的人沒有過馬路。' },
  ],
  follow: {
    goes: '甲',
    // 3-3 岔路預覽
    hint: '通汐街尾，路分兩條。左邊下去是防風林老路，右邊接省道外環。',
    // 3-5 押兵說明
    intro: '轎子往哪邊走，不是你決定的。你能決定的是前哨先去哪邊等。',
    // 3-4 三條線索（拿到任何一條都指向甲）
    clues: [
      { text: '阿滿姨在轎前說：今年膝蓋壞了，要走防風林老路去前面等。', got: () => true },
      { text: '跟轎台聊天室有人留言：老路口的茶水攤昨晚就擺了。', got: (r) => !!r.flags.clue_arui },
      { text: '外環在挖水溝；阿滿每年都走老路，有人在那邊等。', got: (r) => !!r.flags.clue_oajian },
    ],
    hints: '押尾：「昨晚誰在轎前站最久，領隊還記得嗎？」\n前哨：「我覺得省道寬，比較好走啊。……你們幹嘛都看我？」',
    bets: {
      甲: { label: '押甲：前哨先去防風林老路', small: '轎子走甲：那邊的牽路仔先清掉，省 1 時辰。轎子走乙：前哨要趕回來，少 1 時辰。' },
      乙: { label: '押乙：前哨先去省道外環', small: '轎子走乙：那邊的牽路仔先清掉，省 1 時辰。轎子走甲：前哨要趕回來，少 1 時辰。' },
      stay: { label: '留在轎邊', small: '不賺不賠。走到哪條路，那條路的牽路仔到時候再處理。' },
    },
    // 行轎演出（三個選項都播）
    turn: '轎子在路口停住。上下頓了三下。\n轎班的腳跟著往左踩。轎子下了防風林老路。\n香燈腳們：「左邊！走老路！」\n香燈腳阿伯：「阿滿在前面啦，我就說。」',
    results: {
      hit: '路邊的電線桿後面空空的。前哨蹲在土地公廟的屋頂上等。\n前哨：「這邊我掃過了，一隻都沒有。慢慢走。」\n前哨：「我是用猜的嗎？我是用聽的。昨晚我有在聽。」\n押尾：「你昨晚在看米粉。」\n押中了。防風林的牽路仔已經清掉，省 1 時辰。',
      miss: '前哨從外環一路跑回來，旗子都跑歪了。\n前哨：「……我是先去那邊看一下，又不是猜錯。」\n前哨：「外環那隻我也趕走了，沒有白跑。」\n押尾：「喘完再講。」\n押錯了。前哨趕回來，少 1 時辰。防風林的牽路仔還在。',
      stay: '前哨：「好啦，跟著走也是走。」\n押尾：「前面林子邊有一隻在招手。到了再處理。」\n不賺不賠。防風林的牽路仔還在。',
      // 作者定案 A：押中但時辰本來就是滿的（不加）——取代 hit 最後一行的系統句
      hitFull: '【待定】押中了。防風林的牽路仔已經清掉；時辰本來就是滿的，沒有多出來。',
    },
    // 3-7 臨時轉進：賢仔車行（走出防風林、接回省道之後；沒得押）
    detour: {
      name: '賢仔車行', place: '賢仔車行',
      text: '傍晚，隊伍接回省道。路邊一整排鐵皮屋，檳榔攤的燈剛亮。',
      story: 'zhuanjin4',
      encounters: [],
      why: '為什麼是這裡，轎班不知道，賢仔自己也不知道。',
    },
    // 3-8 停駕點（賢仔車行）
    rest: {
      name: '賢仔車行', place: '賢仔車行', art: 'garage', theme: 'mixed',
      text: '轎子衝進車行，在升降機旁邊落了地。',
      encounters: [
        { kind: 'person', id: 'xianzai1', place: '賢仔車行', card: 'xianzai1', tex: 'folk2' },
        {
          kind: 'clue', id: 'stove', place: '賢仔車行・後面堆輪胎的角落', evidence: 'stove', hours: 1,
          text: '整間車行都鋪了水泥，只有堆輪胎的角落留著一塊紅磚地。',
          story: '輪胎後面有一口磚砌的舊灶。灶口朝著省道，灶台擦得很乾淨。',
        },
        ghost('apo1', '賢仔車行・鐵門外', 'apo'),
      ],
    },
    stay: { name: '賢仔車行', text: '天黑了。車行的燈全開，門口的人還在增加。' },
  },
  // 第 7 節 日落「傳消息」
  broadcastIntro: '阿睿：「今天的片只夠剪一段。放哪一段，明天來的人就不一樣。」\n阿睿：「放哪一段好？」',
  broadcastNote: '阿睿看不見你。你可以讓他的鏡頭剛好對到一個地方。',
  broadcast: [
    {
      id: 'garage', label: '轎子在車行過夜', brings: '看熱鬧的年輕人', cost: '多 2 件小事（鞋子磨腳、中暑）；多 1 攤點心站可以託', tags: ['youth'], chain: 1,
      said: '阿睿：「修車廠駐駕，標題下這個。……哇，分享數在跳。」\n前哨：「明天人會變多喔？來啊，我跑得動。」',
    },
    {
      id: 'xiuzhi', label: '秀枝推輪椅跟在隊尾', brings: '帶病人來求的家屬', cost: '多 2 件很難辦的事；沒有多的幫手', tags: ['family'], chain: 1,
      said: '阿睿：「阿姨，剛剛那段可以放嗎？我不會拍到妳阿母的臉。」\n秀枝：「……可以。不要寫我們的名字就好。」',
    },
    {
      id: 'none', label: '什麼都不拍', brings: '沒有', cost: '明天清閒；第三天過溪的時候，少一批會下水牽人的手', tags: ['quiet'], chain: 0,
      said: '阿睿的手機剛好跳出電量不足。「算了，今天先這樣。大家晚安。」\n押尾：「明天人少，我記得完。」',
    },
  ],
};

/**
 * 第二天（到北津）：引擎齊了，字是【待定】暫代（作者的第二天文字到了照 _agent/roundA-report.md 的對照表換掉）。
 *   pre（省道：阿翰；拍車行 → 年輕人的兩件小事＋牽路仔）→ 行轎岔路（轎子走甲：沒走成的新娘在甲路）
 *   → 停駕北津派出所（等信徒集結：rest.gather，過場 tingjia_beijin4；假香燈腳混在人群裡）
 *   → post（北津街上：阿滿姨、秀枝；拍秀枝 → 兩件很難辦的事）→ 駐駕北津朝聖宮（入廟三進三退：stay.story＝sanjin4）
 *   → 日落傳消息（三選一，換第三天的事件池、加人鏈）→ 第二夜：進火（ChapterDef.nightStory[2]＝jinhuo4）→ 草鞋丁到北津放下（guihu.releaseStory）→ 問歸處。
 * 沒有臨時轉進（第二天的「轉進」就是入廟三進三退）。
 */
const DAY2: DayPlan = {
  day: 2, title: '第二天', area: '省道 → 北津', hours: 6, miracles: 1, theme: 'mixed', art: 'highway',
  almanac: () => ({ lunar: '【待定】三月初七', yi: '【待定】進香', ji: '【待定】', source: '【待定】北津舊聞', text: '【待定】第二天的黃曆舊聞。' }),
  docs: [],
  pre: [{ kind: 'person', id: 'ahan2', place: '省道', card: 'ahan2', tex: 'folk1', peek: '【待定】阿翰走近時看到的樣子。' }],
  routes: [
    {
      id: '甲', name: '【待定】甲路', color: 0xd86a8a,
      preview: ['【待定】甲路看得到的樣子。'], note: '【待定】甲路的小字。',
      encounters: [
        { kind: 'person', id: 'aman2', place: '【待定】甲路・路邊', card: 'aman2', tex: 'folk3' },
        ghost('xinniang2', '【待定】甲路・新娘出現的地方', 'xinniang'),
        { kind: 'clue', id: 'veil', place: '【待定】甲路・頭紗', evidence: 'veil', hours: 1, text: '【待定】看到頭紗的那句。', story: '【待定】拿到頭紗的那句。' },
      ],
    },
    {
      id: '乙', name: '【待定】乙路', color: 0x5a7aa8,
      preview: ['【待定】乙路看得到的樣子。'], note: '【待定】乙路的小字。',
      encounters: [
        stray('stray2b', '【待定】乙路・隊尾', '【待定】乙路牽路仔出現的那句。'),
      ],
    },
  ],
  // 會合後（北津街上）
  post: [
    { kind: 'person', id: 'xiuzhi2', place: '【待定】北津街上・隊尾', card: 'xiuzhi2', tex: 'folk4' },
  ],
  tagged: [
    // 轎子在車行過夜 → 看熱鬧的年輕人：多 2 件小事，多 1 攤點心站（牽路仔旁邊就有）
    { tag: 'youth', where: 'pre', encounters: [
      { kind: 'person', id: 'shoes2', place: '省道', card: 'shoes2', tex: 'folk1' },
      { kind: 'person', id: 'heat2', place: '省道', card: 'heat2', tex: 'folk5' },
      stray('stray2y', '省道・隊尾', '牽路仔：「腳痠了齁？這條有椅子，坐一下再走。」', '年輕人的點心站'),
    ] },
    // 秀枝推輪椅 → 帶病人來求的家屬：多 2 件很難辦的事，沒有多的幫手
    { tag: 'family', where: 'post', encounters: [
      { kind: 'person', id: 'sick2a', place: '北津街上', card: 'sick2a', tex: 'folk3' },
      { kind: 'person', id: 'sick2b', place: '北津街上', card: 'sick2b', tex: 'folk2' },
    ] },
    // 什麼都不拍 → 沒有多的人（quiet 不加事）
  ],
  follow: {
    goes: '甲',
    hint: '【待定】第二天岔路口看得到的樣子。',
    intro: '【待定】第二天押兵的說明。',
    clues: [
      { text: '【待定】第二天的線索一（必得）。', got: () => true },
      { text: '【待定】第二天的線索二（第一天稟報過阿滿姨才有）。', got: (r) => r.follow?.reports.aman1 !== undefined },
    ],
    hints: '【待定】押尾、前哨的提示。',
    // 第一行是「路口停住、頓」（隊伍的轎換 st_jiao4_pause），其餘換 st_jiao4_turn
    turn: '【待定】轎子在路口停住，頓了一下。\n【待定】轎子往甲路去了。',
    results: {
      hit: '【待定】押中時前哨、押尾的對話。\n【待定】押中了。甲路的牽路仔已經清掉，省 1 時辰。',
      miss: '【待定】押錯時前哨、押尾的對話。\n【待定】押錯了。前哨趕回來，少 1 時辰。',
      stay: '【待定】留在轎邊時的對話。\n【待定】不賺不賠。',
      hitFull: '【待定】押中了；時辰本來就是滿的，沒有多出來。',
    },
    // 到北津先停派出所，等信徒集結
    rest: {
      name: '北津派出所', place: '北津派出所', art: 'beijin', theme: 'mixed',
      text: '【待定】轎子在北津派出所前停下來。',
      gather: { title: '等信徒集結', text: '【待定】派出所前等人集結的樣子（人越聚越多）。', story: 'tingjia_beijin4' },
      encounters: [
        ghost('jiajiao2', '【待定】北津派出所・人群裡', 'jiajiao'),
        { kind: 'clue', id: 'armband', place: '【待定】北津派出所・臂章', evidence: 'armband', hours: 1, text: '【待定】看到臂章的那句。', story: '【待定】拿到臂章的那句。' },
      ],
    },
    // 入廟三進三退（演出 sanjin4），駐駕北津朝聖宮；第二夜進火
    stay: { name: '北津朝聖宮', text: '【待定】駐駕北津朝聖宮的樣子。', story: 'sanjin4' },
  },
  broadcastIntro: '【待定】阿睿：「今天放哪一段？」',
  broadcastNote: '【待定】傳消息的說明。',
  broadcast: [
    {
      id: 'jinmiao2', label: '【待定】入廟三進三退', brings: '【待定】明天多來的人', cost: '【待定】明天多 1 件事', tags: ['crowd'], chain: 1,
      said: '【待定】選完這一段的反應。',
    },
    {
      id: 'xiuzhi2', label: '【待定】秀枝和她阿母', brings: '【待定】明天多來的人', cost: '【待定】明天多 1 件很難辦的事', tags: ['family3'], chain: 1,
      said: '【待定】選完這一段的反應。',
    },
    {
      id: 'none2', label: '什麼都不拍', brings: '沒有', cost: '【待定】明天清閒；過溪時少一批牽人的手', tags: ['quiet'], chain: 0,
      said: '【待定】選完這一段的反應。',
    },
  ],
};

/**
 * 第三天（回程・渾水溪）：布幔全天不拉開（隊伍的轎是 st_jiao4_carry_closed，art/baishadunSpec.ts 的 jiaoKey）；
 * 時辰只有 4；事情最多 7 件（pre 2＋傳消息 1＋甲路 2＋停駕 1＋post 1）。秀枝的那一段在這天。
 *   pre（省道：秀枝、隊尾的牽路仔）→ 行轎岔路（轎子走甲）→ 臨時轉進：渾水溪橋頭（轎子頓三下、下堤防，演出 qiaotou4）
 *   → 停駕渾水溪堤防（阿翰）→ post（阿睿）→ 駐駕堤防 → 第三夜（問歸處）→ 茫渡現身 → 最後一戰 ford。
 */
const DAY3: DayPlan = {
  day: 3, title: '第三天', area: '北津 → 渾水溪堤防', hours: 4, miracles: 1, theme: 'shore', art: 'dike',
  almanac: () => ({ lunar: '【待定】三月初八', yi: '【待定】回程', ji: '【待定】', source: '【待定】渾水溪舊聞', text: '【待定】第三天的黃曆舊聞（渾水溪以前的渡口）。' }),
  docs: [],
  pre: [
    { kind: 'person', id: 'xiuzhi3', place: '【待定】省道・隊尾', card: 'xiuzhi3', tex: 'folk4', peek: '【待定】秀枝走近時看到的樣子。' },
    stray('stray3a', '【待定】省道・隊尾', '【待定】隊尾牽路仔出現的那句。'),
  ],
  routes: [
    {
      id: '甲', name: '【待定】甲路', color: 0xd86a8a,
      preview: ['【待定】甲路看得到的樣子。'], note: '【待定】甲路的小字。',
      encounters: [
        { kind: 'person', id: 'aman3', place: '【待定】甲路', card: 'aman3', tex: 'folk3' },
        { kind: 'person', id: 'dukou3', place: '【待定】甲路・堤防邊', card: 'dukou3', tex: 'folk2' },
      ],
    },
    {
      id: '乙', name: '【待定】乙路', color: 0x5a7aa8,
      preview: ['【待定】乙路看得到的樣子。'], note: '【待定】乙路的小字。',
      encounters: [
        stray('stray3b', '【待定】乙路・隊尾', '【待定】乙路牽路仔出現的那句。'),
      ],
    },
  ],
  post: [
    { kind: 'person', id: 'arui3', place: '【待定】堤防上', card: 'arui3', tex: 'folk1' },
  ],
  tagged: [
    // 第二天拍入廟 → 明天人更多：隊伍裡多一件小事
    { tag: 'crowd', where: 'pre', encounters: [{ kind: 'person', id: 'lost3', place: '【待定】省道', card: 'lost3', tex: 'folk5' }] },
    // 第二天拍秀枝 → 帶病人來求的家屬：多一件很難辦的事
    { tag: 'family3', where: 'post', encounters: [{ kind: 'person', id: 'sick3', place: '【待定】堤防上', card: 'sick3', tex: 'folk3' }] },
  ],
  follow: {
    goes: '甲',
    hint: '【待定】第三天岔路口看得到的樣子。',
    intro: '【待定】第三天押兵的說明（回程，布幔不拉開）。',
    hints: '【待定】押尾、前哨的提示。',
    turn: '【待定】轎子在路口停住，頓了一下。\n【待定】轎子往甲路去了。',
    results: {
      hit: '【待定】押中時的對話。\n【待定】押中了，省 1 時辰。',
      miss: '【待定】押錯時的對話。\n【待定】押錯了，少 1 時辰。',
      stay: '【待定】留在轎邊時的對話。\n【待定】不賺不賠。',
      hitFull: '【待定】押中了；時辰本來就是滿的，沒有多出來。',
    },
    // 轎子到橋頭頓了三下，下堤防（不走橋）
    detour: {
      name: '渾水溪橋頭', place: '渾水溪橋頭', text: '【待定】隊伍走到渾水溪橋頭，橋上滿滿是車和人。',
      story: 'qiaotou4', encounters: [], why: '【待定】轎子為什麼不走橋（之後由兵馬自己講，不由旁白替媽祖解釋）。',
    },
    rest: {
      name: '渾水溪堤防', place: '渾水溪堤防', text: '【待定】轎子停在堤防上。',
      encounters: [{ kind: 'person', id: 'ahan3', place: '【待定】渾水溪堤防', card: 'ahan3', tex: 'folk1' }],
    },
    stay: { name: '渾水溪堤防', text: '【待定】天黑了，溪上起霧。' },
  },
};

export const DAY_PLANS4: Record<number, DayPlan> = { 1: DAY1, 2: DAY2, 3: DAY3 };

/** 今日說明卡（黃曆之後）：只說明規則，不改數值（字取自第 3-5 節押兵說明、第 6 節稟報說明） */
export const UNLOCKS4: Record<number, { title: string; text: string }> = {
  1: {
    title: '跟轎・頭旗下',
    text: '轎子往哪邊走，不是你決定的。你能決定的是前哨先去哪邊等。\n把一個人的事報到轎前。今天可以報 1 次。媽祖會知道；轎子會不會為他停，不保證。',
  },
  2: { title: '【待定】第二天・到北津', text: '【待定】第二天的說明卡（人變多、派出所前等集結、入廟三進三退）。' },
  3: { title: '【待定】第三天・回程', text: '【待定】第三天的說明卡（布幔不拉開、時辰只有 4）。' },
};

/** 信徒卡 id 是第幾天的（id 尾巴的數字：aman1、ahan2、sick2a） */
function cardDay(card: string): number {
  const m = /(\d)[a-z]?$/.exec(card);
  return m ? Number(m[1]) : 0;
}

/** 天亮：寫「昨日」——略過的信徒卡的「沒辦結果」、被牽路仔帶偏的人（第 n 天的） */
export function dawn4(r: RunState, n: number): string[] {
  const out: string[] = [];
  for (const [card, text] of Object.entries(MISSED4)) if (cardDay(card) === n && r.flags[`missed_${card}`]) out.push(text);
  const f = r.follow;
  const strayed = f?.strayedDay?.[n] ?? (n === 1 ? f?.strayed ?? 0 : 0);
  if (strayed) out.push(`昨天有 ${strayed} 位被牽路仔帶偏，沒跟上隊伍。`);
  return out;
}

/** 第三天結束（入夜前）：沒有要改的狀態（被牽路仔帶偏、人鏈都在 follow 裡，最後一戰直接讀） */
export function endOfDay3_4(_r: RunState): void {
  /* 第三天沒有入夜前才結算的事 */
}

export function verdictEffects4(_r: RunState, _id: string, _verdict: string): string[] {
  return [];
}
