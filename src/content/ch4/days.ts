// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章的三天行程（跟轎：DayPlan.follow，見 core/procession.ts）。
 *
 * 第一天（試玩版只做到這天；字照 _agent/ch4-text-day1.md 第 3 節）：
 *   pre（海線小路 → 通汐街上：阿睿、草鞋丁、賣蚵嗲的阿桑）→ 行轎岔路（甲・防風林老路、乙・省道外環；轎子走甲）
 *   → 甲路（阿滿姨、牽路仔）→ 臨時轉進賢仔車行（過場 zhuanjin4）→ 停駕點（賢仔車行：賢仔、舊灶、點心擔阿婆）
 *   → post（車行外：阿翰、秀枝）→ 駐駕賢仔車行 → 日落傳消息（三選一，換第二天的事件池）。
 * 第二天（第 B1 輪）：字照 _agent/ch4-text-day2.md。第三天（第 A 輪）：引擎與行程都接好了，字是（待寫）暫代；換字照 _agent/roundA-report.md。
 * 轎子走哪條（follow.goes）、時辰、標籤、人鏈段數是規則，換字時不要動。
 */
import type { RunState } from '../../state';
import type { DayPlan, Encounter } from '../days';
import { MISSED4 } from './believers';

const ghost = (id: string, place: string, caseId: string): Encounter => ({ kind: 'ghost', id, place, caseId });
/** 牽路仔（第 5 節）：長得像路邊招手的人影，專找隊尾 */
const stray = (id: string, place: string, text: string, stall?: string, entrustStory?: string, story?: string): Encounter => ({
  kind: 'imp', id, place, tex: 'qianlu', text, ...(stall ? { stall } : {}), ...(entrustStory ? { entrustStory } : {}), ...(story ? { story } : {}),
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
          '檳榔攤轉角，有個人影站在工地圍籬的缺口招手。\n牽路仔：「前面的人都走這條啦，你看，有腳印。」', '外環點心站',
          // ch4-text-fixes.md 第 4 節：託外環點心站顧的結果
          '外環點心站的阿姨抓了一顆包子，追到圍籬邊，把往缺口走的那個人叫住。\n點心站的阿姨：「欸，那邊在挖水溝啦！包子拿去，路在這邊。」\n那個人接過包子，走回隊伍裡。圍籬缺口的人影不招手了。\n外環點心站這段路要顧著他，不能再幫別的事。'),
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
      hitFull: '押中了。防風林的牽路仔已經清掉。時辰本來就是滿的，沒有多出來。',
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
 * 第二天（到北津）：字照 _agent/ch4-text-day2.md（第 B1 輪）。
 *   起駕 → 出發過場 chufa4_2（ChapterDef.departStory[2]）→ pre（省道：阿翰、沒走成的新娘、點人頭的阿伯；
 *   拍車行 → 年輕人的兩件小事＋冬瓜茶攤；什麼都不拍 → 補旗的阿伯、煮太多的點心站）
 *   → 行轎岔路（甲・北津大橋、乙・堤防下的舊街；轎子走乙）→ 乙路（阿滿姨、牽路仔）→ 過圳（乙路走完自動播 guozun4）
 *   → 停駕北津派出所（等信徒集結：rest.gather，過場 tingjia_beijin4；假香燈腳、阿睿）
 *   → post（北津街上：賢仔、秀枝、顧旗的囡仔；拍秀枝 → 兩件很難辦的事）→ 入廟三進三退（stay.story＝jinmiao4）→ 駐駕北津朝聖宮
 *   → 日落傳消息（三選一：人鏈 +1／+0／−1）→ 第二夜：進火（nightStory[2]＝jinhuo4）→ 草鞋丁還願、放下（guihu.releaseStory）→ 問歸處。
 * 沒有臨時轉進（作者：停駕點就是北津派出所）。
 */
/** 第一夜判「帶去北津」或「帶回白砂墩」：草鞋丁有跟著（ch4-text-day2.md 總註） */
export const caoxieWith = (r: RunState): boolean => r.cases.caoxie?.verdict === 'tobeijin' || r.cases.caoxie?.verdict === 'tohome';

const DAY2: DayPlan = {
  day: 2, title: '第二天・到北津', area: '省道 → 北津街上 → 北津朝聖宮', hours: 6, miracles: 1, theme: 'mixed', art: 'highway',
  // 1 黃曆（第一段是新娘案的文獻「北津舊聞・圳邊洗腳」）
  almanac: () => ({
    lunar: '三月初七', yi: '進香　進火', ji: '喧嘩', source: '北津舊聞',
    text: '橋還沒蓋的時候，走路來的人進北津街以前，先在街外的水圳洗腳，換一雙乾淨的鞋。圳邊的人家門口放一桶水，燈點到天亮。\n今天到北津。人比昨天多很多，事情辦不完，先辦要緊的。夜裡進火，不吵。',
  }),
  docs: ['xijiao'],
  // 3-1 pre（省道）：阿翰、沒走成的新娘（作者把新娘移到 pre，兩案不受岔路影響）；7-1 小咖鬼一
  pre: [
    { kind: 'person', id: 'ahan2', place: '省道・慢車道', card: 'ahan2', tex: 'folk1', peek: '一台小貨車開得很慢，車斗擋板貼著紙板。有個年輕人盯著那張紙板走。' },
    ghost('xinniang2', '省道・客運站牌', 'xinniang'),
    ghost('diantou2', '省道・路邊的里程碑上', 'diantou'),
  ],
  routes: [
    // 3-2 甲：北津大橋（轎子沒走，只有預覽；3-7）
    {
      id: '甲', name: '北津大橋', color: 0xd86a8a,
      preview: ['橋頭人擠人。欄杆邊有個人影，朝橋下的便道招手。', '橋頭一攤點心站，義警已經把線拉好了。'],
      note: '過橋就是派出所。橋上站滿了等轎子的人，等了兩個鐘頭。',
      encounters: [
        stray('stray2a', '北津大橋・橋頭', '橋頭人擠人。欄杆邊有個人影，朝橋下的便道招手。', '橋頭點心站'),
      ],
    },
    // 3-2 乙：堤防下的舊街（轎子走這條；3-6）
    {
      id: '乙', name: '堤防下的舊街', color: 0x5a7aa8,
      preview: ['水圳邊的石階上坐著一個人，鞋脫在旁邊。', '舊街的巷口有個人影在招手。那條巷子是死的。'],
      note: '路窄，要繞。沒有人潮，只有一戶人家門口放了一桶水。',
      encounters: [
        { kind: 'person', id: 'aman2', place: '舊街・水圳邊的石階', card: 'aman2', tex: 'folk3' },
        stray('stray2b', '舊街・死巷口',
          '幾千人擠一條舊街。隊尾有個揹小孩的太太被擠到巷口，巷子裡有人影跟她招手。\n牽路仔：「跟你一起來的那個，剛剛往這邊走了。我有看到。」', '門口放水桶的人家',
          // 7-3 託門口放水桶的人家
          '圳邊的阿嬤：「欸，那條是死巷啦！揹囡仔的，來這邊洗手，這邊有椅子。」\n太太走過來坐下。巷口的人影往後退，退進牆裡。\n放水桶的這一戶這段路要顧著她，不能再幫別的事。',
          // 7-3 派兵回頭喊的結果
          '押尾擠回隊尾，站在那個太太的耳邊。\n押尾：「美雲。小孩的帽子掉了，在妳後面。」\n太太回頭撿帽子。再抬頭的時候，巷子裡沒有人，盡頭是一面牆。\n牽路仔：「人這麼多，你還一個一個記喔。」'),
      ],
      // 3-6 過圳（乙路走完自動播）
      endStory: 'guozun4',
    },
  ],
  // post（北津街上）：賢仔、秀枝；7-2 小咖鬼二
  post: [
    { kind: 'person', id: 'xianzai2', place: '北津街上的管制線外', card: 'xianzai2', tex: 'folk2' },
    { kind: 'person', id: 'xiuzhi2', place: '廟埕外的巷口', card: 'xiuzhi2', tex: 'folk4' },
    ghost('guqi2', '北津街上・點心站的桌子下', 'guqi'),
  ],
  // 6 依第一天傳消息切換的事件池
  tagged: [
    // 6-1 拍了車行過夜 → 看熱鬧的年輕人：2 件小事＋社團的冬瓜茶攤（兩件都可以託，一段路只能顧一件）
    { tag: 'youth', where: 'pre', encounters: [
      { kind: 'person', id: 'shoes2', place: '省道・路肩', card: 'shoes2', tex: 'folk1', peek: '兩個女生坐在路肩，其中一個把新球鞋脫了，後腳跟一片紅。' },
      { kind: 'person', id: 'heat2', place: '省道・檳榔攤前', card: 'heat2', tex: 'folk5', peek: '一個男生蹲在檳榔攤的遮陽傘下，臉很紅，一直說他沒事。' },
      stray('stray2y', '省道・冬瓜茶攤旁',
        '幾個大學生在路邊擺了一桌冬瓜茶，紙箱上寫「免費！我們也是第一次」。\n擺攤的學生：「昨天看直播看到半夜，早上就載兩桶過來了。這樣擺對嗎？」\n牽路仔：「前面塞住了啦。這條巷子切過去，比他們都快。」', '社團的冬瓜茶攤'),
    ] },
    // 6-2 拍了秀枝推輪椅 → 帶病人來求的家屬：2 件很難辦的事（各 2 時辰，沒有可以託的攤）
    { tag: 'family', where: 'post', encounters: [
      { kind: 'person', id: 'sick2a', place: '北津街上・人潮後面', card: 'sick2a', tex: 'folk3', peek: '人潮後面有個太太，兩手捧著一件摺好的男用襯衫，一直踮腳。' },
      { kind: 'person', id: 'sick2b', place: '北津街上・藥局騎樓', card: 'sick2b', tex: 'folk2', peek: '騎樓下一個阿公牽著戴口罩、戴毛帽的小女孩，離人群很遠。' },
    ] },
    // 6-3 什麼都不拍 → 沒有多的人：兩件可辦可不辦的小事
    { tag: 'quiet', where: 'pre', encounters: [
      { kind: 'person', id: 'flag2', place: '省道・土地公廟的榕樹下', card: 'flag2', tex: 'folk2', peek: '榕樹下一個阿伯坐在板凳上，膝蓋上攤著一支進香旗，在穿針。' },
      { kind: 'person', id: 'rice2', place: '省道・鐵皮屋前', card: 'rice2', tex: 'folk3', peek: '一攤點心站擺了三大鍋，桌子前面沒幾個人。' },
    ] },
  ],
  follow: {
    // 總註：轎子走乙（堤防下的舊街），從後街繞出來還是停在北津派出所前
    goes: '乙',
    // 3-3 路況說明
    hint: '過了堤防就是北津。直走上北津大橋，右邊斜坡下去是舊街。',
    intro: '往年到北津，都先停派出所。派出所在橋那一頭。轎子今年怎麼走，還是要看轎子。',
    // 3-4 線索（都不直接講路名；押兵畫面只列已拿到的）
    clues: [
      { text: '草鞋丁說：進北津以前要先洗腳，腳洗好才算到。', got: caoxieWith },
      { text: '穿紅衣的女人說：她阿母會坐在石階上等。', got: (r) => r.evidence.includes('veil') },
      { text: '老一輩說：以前進北津沒有橋可以走。', got: (r) => !!r.flags.clue_xian2 || !!r.flags.clue_flag2 },
    ],
    hints: '押尾：「草鞋丁今天一直看自己的腳。」\n前哨：「派出所在橋那頭，每年都先停派出所。這題我會。」',
    // 3-5 押兵三選一
    bets: {
      甲: { label: '押甲：前哨先上北津大橋', small: '轎子走甲：橋頭的牽路仔先清掉，省 1 時辰。轎子走乙：前哨要從橋上擠回來，少 1 時辰。' },
      乙: { label: '押乙：前哨先下舊街', small: '轎子走乙：舊街的牽路仔先清掉，省 1 時辰。轎子走甲：前哨要趕回來，少 1 時辰。' },
      stay: { label: '留在轎邊', small: '不賺不賠。走到哪條路，那條路的牽路仔到時候再處理。' },
    },
    // 行轎演出（三個選項都播）；第一行是「路口停住」（隊伍的轎換 st_jiao4_pause），其餘換 st_jiao4_turn
    turn: '轎子在橋頭前停住。橋上幾千人一下子都不講話了。\n轎子前後擺了三下，頓了一頓。轎班的腳往右踩。\n轎子下了堤防邊的斜坡，進了舊街。\n香燈腳們：「不走橋！下面！走下面！」\n橋上的人：「蛤？我們在這裡等兩個鐘頭了欸！」\n義警阿伯：「免緊張，慢慢下來。舊街出去也是派出所。」',
    results: {
      hit: '舊街的巷口空空的。前哨站在圳邊的水桶旁邊，褲管捲到膝蓋。\n前哨：「這條我掃過了。順便洗了腳。」\n前哨：「這次我真的有在聽。」\n押尾：「你剛才說這題你會。你講的是橋。」\n押中了。舊街的牽路仔已經清掉，省 1 時辰。',
      miss: '前哨從橋上擠回來。橋上都是人，他是踩著欄杆外面走的。\n前哨：「派出所明明在那邊！……好啦，等一下還是會到派出所啦。」\n前哨：「橋頭那隻我趕掉了，沒有白跑。」\n押尾：「橋上的人現在都往這邊擠。隊尾我先過去。」\n押錯了。前哨趕回來，少 1 時辰。舊街的牽路仔還在。',
      stay: '前哨：「下面那條這麼窄，幾千人怎麼過？」\n押尾：「一個一個過。巷口有一隻在招手，到了再處理。」\n不賺不賠。舊街的牽路仔還在。',
      // 押中但時辰已滿：作者另寫了一整段（整段換掉）
      hitFull: '舊街的巷口空空的。前哨站在圳邊的水桶旁邊，褲管捲到膝蓋。\n前哨：「這條我掃過了。省下來的時辰可以先存著嗎？」\n押尾：「不能。」\n押中了。舊街的牽路仔已經清掉。今天的時辰還沒動過，沒有可以省的。',
    },
    // 4 停駕點：北津派出所前（沒有臨時轉進）
    rest: {
      name: '北津派出所', place: '北津派出所前', art: 'beijin', theme: 'mixed',
      text: '轎子在北津派出所前落了地。等後面的人到齊。',
      // 集結畫面的字借 4-1 的旁白（過場裡也有這一句）
      gather: { title: '等信徒集結', text: '橋上的人、舊街的人，一批一批到。整條街坐滿了，還有人在來。', story: 'tingjia_beijin4' },
      encounters: [
        ghost('jiajiao2', '北津派出所前・人群裡', 'jiajiao'),
        { kind: 'person', id: 'arui2', place: '北津派出所前・變電箱旁', card: 'arui2', tex: 'folk1', peek: '阿睿在找高的地方架手機。他腳邊站著一個阿嬤，手上捏著一張紙條。' },
      ],
    },
    // 8 入廟三進三退（演出 jinmiao4），駐駕北津朝聖宮；9 第一句是駐駕的字
    stay: { name: '北津朝聖宮', text: '天黑了。廟埕的人沒有散，都在等半夜進火。', story: 'jinmiao4' },
  },
  // 9 日落「傳消息」（第二天版）
  broadcastIntro: '阿睿：「進火我不拍，那個不能拍。今天白天的片還是只夠剪一段。」\n阿睿：「明天回程，要讓大家看到哪一段？」',
  broadcastNote: '阿睿看不見你。你可以讓他的鏡頭剛好對到一個地方。',
  broadcast: [
    {
      id: 'jinmiao2', label: '廟埕前三進三退', brings: '專程趕來接轎的人', cost: '回程路上多 2 件事；過溪的時候，多 1 段下水牽人的手（人鏈 +1）', tags: ['crowd'], chain: 1,
      said: '阿睿：「就放這段。……分享破萬了，明天省道會塞爆。」\n押尾：「人多，下水的手也多。我今晚先背名字。」',
    },
    {
      id: 'truck2', label: '賢仔的貨車和一車背包', brings: '開車來送水、擺點心的人', cost: '回程路上多 1 攤點心站可以託；他們顧車顧攤，不下水（人鏈不變）', tags: ['helper'], chain: 0,
      said: '阿睿：「老闆，你那張紙板借我拍。標題我想好了，『累了請上車』。」\n賢仔：「拍車就好，不要拍我。我今天沒刮鬍子。」',
    },
    {
      id: 'none2', label: '什麼都不拍', brings: '沒有', cost: '回程路上少 1 件事；過溪的時候，少 1 段下水牽人的手（人鏈 −1）', tags: ['quiet'], chain: -1,
      said: '阿睿把手機收進口袋。「今天先這樣。我想用眼睛看一下。」\n前哨：「他今天怪怪的。他居然沒有報人數。」',
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
  almanac: () => ({ lunar: '（待寫）三月初八', yi: '（待寫）回程', ji: '（待寫）', source: '（待寫）渾水溪舊聞', text: '（待寫）第三天的黃曆舊聞（渾水溪以前的渡口）。' }),
  docs: [],
  pre: [
    { kind: 'person', id: 'xiuzhi3', place: '（待寫）省道・隊尾', card: 'xiuzhi3', tex: 'folk4', peek: '（待寫）秀枝走近時看到的樣子。' },
    stray('stray3a', '（待寫）省道・隊尾', '（待寫）隊尾牽路仔出現的那句。'),
  ],
  routes: [
    {
      id: '甲', name: '（待寫）甲路', color: 0xd86a8a,
      preview: ['（待寫）甲路看得到的樣子。'], note: '（待寫）甲路的小字。',
      encounters: [
        { kind: 'person', id: 'aman3', place: '（待寫）甲路', card: 'aman3', tex: 'folk3' },
        { kind: 'person', id: 'dukou3', place: '（待寫）甲路・堤防邊', card: 'dukou3', tex: 'folk2' },
      ],
    },
    {
      id: '乙', name: '（待寫）乙路', color: 0x5a7aa8,
      preview: ['（待寫）乙路看得到的樣子。'], note: '（待寫）乙路的小字。',
      encounters: [
        stray('stray3b', '（待寫）乙路・隊尾', '（待寫）乙路牽路仔出現的那句。'),
      ],
    },
  ],
  post: [
    { kind: 'person', id: 'arui3', place: '（待寫）堤防上', card: 'arui3', tex: 'folk1' },
  ],
  tagged: [
    // 第二天拍入廟 → 明天人更多：隊伍裡多一件小事
    { tag: 'crowd', where: 'pre', encounters: [{ kind: 'person', id: 'lost3', place: '（待寫）省道', card: 'lost3', tex: 'folk5' }] },
    // 第二天拍賢仔的貨車 → 開車來送水、擺點心的人：多 1 攤點心站可以託（第三天的字還沒到，先放一件暫代）
    { tag: 'helper', where: 'post', encounters: [{ kind: 'person', id: 'sick3', place: '（待寫）堤防上', card: 'sick3', tex: 'folk3' }] },
  ],
  follow: {
    goes: '甲',
    hint: '（待寫）第三天岔路口看得到的樣子。',
    intro: '（待寫）第三天押兵的說明（回程，布幔不拉開）。',
    hints: '（待寫）押尾、前哨的提示。',
    turn: '（待寫）轎子在路口停住，頓了一下。\n（待寫）轎子往甲路去了。',
    results: {
      hit: '（待寫）押中時的對話。\n（待寫）押中了，省 1 時辰。',
      miss: '（待寫）押錯時的對話。\n（待寫）押錯了，少 1 時辰。',
      stay: '（待寫）留在轎邊時的對話。\n（待寫）不賺不賠。',
      hitFull: '（待寫）押中了；時辰本來就是滿的，沒有多出來。',
    },
    // 轎子到橋頭頓了三下，下堤防（不走橋）
    detour: {
      name: '渾水溪橋頭', place: '渾水溪橋頭', text: '（待寫）隊伍走到渾水溪橋頭，橋上滿滿是車和人。',
      story: 'qiaotou4', encounters: [], why: '（待寫）轎子為什麼不走橋（之後由兵馬自己講，不由旁白替媽祖解釋）。',
    },
    rest: {
      name: '渾水溪堤防', place: '渾水溪堤防', text: '（待寫）轎子停在堤防上。',
      encounters: [{ kind: 'person', id: 'ahan3', place: '（待寫）渾水溪堤防', card: 'ahan3', tex: 'folk1' }],
    },
    stay: { name: '渾水溪堤防', text: '（待寫）天黑了，溪上起霧。' },
  },
};

export const DAY_PLANS4: Record<number, DayPlan> = { 1: DAY1, 2: DAY2, 3: DAY3 };

/** 今日說明卡（黃曆之後）：只說明規則，不改數值（字取自第 3-5 節押兵說明、第 6 節稟報說明） */
export const UNLOCKS4: Record<number, { title: string; text: string }> = {
  // ch4-text-fixes.md 第 3 節
  1: {
    title: '跟轎',
    text: '轎子往哪條路走，不是你選的。到了岔路，你只決定前哨先去哪一邊等。\n路上遇到的人，可以把他的事稟報到轎前。今天能報 1 次。\n稟報之後，媽祖會知道；轎子會不會為他停，不保證。',
  },
  // ch4-text-day2.md 第 1 節「今日說明卡」
  2: { title: '人多了', text: '今天的事比時辰多，辦不完是正常的。沒辦的事會留到明天，或者留成遺憾。\n旗下的格子有限。草鞋丁到了北津才放得下。' },
  3: { title: '（待寫）第三天・回程', text: '（待寫）第三天的說明卡（布幔不拉開、時辰只有 4）。' },
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
