// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章的過場劇情。媽祖全章不露臉、不講話、沒有立繪（承峰定案 2026-11-13）：
 * 畫面上只有轎子和布幔，祂的意思只透過轎子的動作和旁人的反應出現；旁白不替媽祖講話。
 *
 * 字照 _agent/ch4-text-day1.md 第 1-3～1-5、2、3-7、9-1 節（「旁白：」寫成 narrator；（演出：……）寫在 content/stage/ch4.ts）。
 * 播放時機：
 *  - qitou4：序章擲筊之後（放頭旗與兵馬點名、犒軍、深夜起駕）
 *  - qijia4：qitou4 之後、第一天黃曆之前（拱辰宮起駕；有演出腳本 stage/ch4.ts）
 *  - zhuanjin4：第一天臨時轉進賢仔車行（DayScene 蓋在畫面上播；有演出腳本）
 *  - tianliang4_1：試玩版第一夜天亮（ChapterDef.sliceStory）；舊灶那一句只在阿婆判「就在這裡下」時播
 *  第 B1 輪（字照 _agent/ch4-text-day2.md）：
 *  - chufa4_2：第二天起駕之後（ChapterDef.departStory[2]）
 *  - guozun4：第二天乙路走完・過圳（RouteDef.endStory）
 *  - tingjia_beijin4：第二天停駕北津派出所、等信徒集結（rest.gather.story）
 *  - jinmiao4：第二天入廟三進三退、「進喔！」（stay.story；演出 stage/ch4.ts，轎只用 st_jiao4_carry／st_jiao4_pause）
 *  - jinhuo4：第二夜開審前・進火（ChapterDef.nightStory[2]）
 *  - fangxia_caoxie4：第二夜草鞋丁還願、放下（guihu.releaseStory）
 *  - tianliang4_1：第一夜天亮（dawnStory[2]）；tianliang4_2：第二夜天亮（試玩版：sliceStory，接試玩結束卡；整章模式：dawnStory[3]）
 *  第 A 輪（作者的字還沒到，暫代以「（待寫）」開頭；誰說、播放時機是接點，換字時不要動）：
 *  - qiaotou4：第三天橋頭頓三下、下堤防（detour.story；演出，轎全程 st_jiao4_carry_closed）
 *  - mangdu4：第三夜之後（茫渡現身）
 *  - mangduRecall4／mangduReturn4／mangduSlay4：最後一戰的三種結局（斬只對茫渡）
 *  - huigong4：回宮（八人大轎 st_jiao8_carry，演出）
 *  - kailu4：開爐（第 12 天的黃曆之後；演出：鏡頭不拍神龕，只拍底下抬頭的臉）
 */
import type { Cutscene } from '../story';
import type { RunState } from '../../state';

/** 第一夜判「帶去北津」或「帶回白砂墩」：草鞋丁有跟著（同 days.ts 的 caoxieWith；這裡自己寫一份，避免互相 import） */
const caoxieWith = (r: RunState): boolean => r.cases.caoxie?.verdict === 'tobeijin' || r.cases.caoxie?.verdict === 'tohome';
/** 草鞋丁判「帶回白砂墩」：第二夜站在廟埕外面沒有進去 */
const caoxieHome = (r: RunState): boolean => r.cases.caoxie?.verdict === 'tohome';
/** 第二天稟報過秀枝（入廟第三退多四句；同 believers.ts 的 xiuzhiReported） */
const xiuzhiReported = (r: RunState): boolean => r.follow?.reports.xiuzhi2 !== undefined;

export const CUTSCENES4: Record<string, Cutscene> = {
  // 1-3 放頭旗與兵馬點名、1-4 犒軍、1-5 深夜起駕
  qitou4: {
    mood: 'temple', place: '白砂墩拱辰宮・放頭旗', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '三月初二，夜。頭旗綁上廟前的龍柱，旗尾朝南。' },
      { who: 'touqi', text: '頭旗放了。有形的、無形的，三天後跟這支旗走。' },
      { who: 'narrator', text: '凡人看不見，旗下已經站滿了。你是這一隊兵馬的領隊。' },
      { who: 'qianshao', text: '前哨到！探路的。領隊，哪條路先看，你講一聲我就衝。' },
      { who: 'yawei', text: '押尾。走最後面，撿落隊的。' },
      { who: 'qianshao', text: '他話很少，但是誰落隊、叫什麼名字，他都記得。' },
      { who: 'yawei', text: '三天後出門。去哪條路，別問我，我也是用跟的。' },
      { who: 'qianshao', text: '旗下有四格。路上遇到沒地方去的，就帶在旗後面走。' },
      { who: 'yawei', text: '每個都有該去的地方。帶到了，格子才空得出來。' },
      { who: 'narrator', text: '放頭旗後三天，庄裡吃素。每天傍晚，供桌從殿前一路擺到廟埕外。' },
      { who: 'cunbo', text: '兵將要走遠路，多吃一點。飯我添尖尖的。' },
      { who: 'qianshao', text: '有炒米粉！領隊，我可以先聞嗎？' },
      { who: 'aman', text: '這鍋菜頭湯趁燒。我煮了三十年，兵將應該吃得慣。' },
      { who: 'narrator', text: '阿滿姨放下鍋子，走到轎前，合掌站著。' },
      { who: 'aman', text: '媽祖，我今年膝蓋壞了。省道車多，我不敢走。' },
      { who: 'aman', text: '我走防風林那條老路，慢慢走，去前面等。' },
      { who: 'yawei', text: '她在轎前站了很久。' },
      { who: 'qianshao', text: '蛤？我在看米粉。她說什麼？' },
      { who: 'narrator', text: '三月初五，深夜。四人小轎停在殿前，轎頂蓋著粉紅色的遮雨布。' },
      { who: 'narrator', text: '廟埕站滿了人，每個人手上一支進香旗。今晚往哪邊走，沒有人知道。' },
      { who: 'touqi', text: '時辰還沒到。等。' },
      { who: 'qianshao', text: '領隊，我腳在抖。是興奮，別誤會。' },
    ],
  },
  // 2 開場過場：拱辰宮・起駕（演出見 stage/ch4.ts）
  qijia4: {
    mood: 'temple', place: '白砂墩拱辰宮・起駕', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '白砂墩拱辰宮，將近子時。廟埕的燈全開，海風很大。' },
      { who: 'arui', text: '跟轎台開播！現在線上三百一十二人，大家晚安！' },
      { who: 'qianshao', text: '領隊，那個拿棍子的在跟誰講話？' },
      { who: 'yawei', text: '手機。他叫阿睿。' },
      { who: 'touqi', text: '時辰到。起！', fx: 'flash' },
      { who: 'narrator', text: '頭旗先衝出廟門。鞭炮從廟口一路炸到海堤。', fx: 'firecracker' },
      { who: 'xiangdeng', text: '起駕了！起駕了！' },
      { who: 'narrator', text: '四人小轎跟著出來。粉紅色的轎頂在人群上面一晃一晃。' },
      { who: 'qianshao', text: '我走前面！往省道對不對？' },
      { who: 'narrator', text: '轎子到了廟前第一個路口，停住。前後擺了兩下，頓了一頓。' },
      { who: 'narrator', text: '轎班沒有人開口，肩膀跟著轎槓轉。轎子往海邊的小路去了。' },
      { who: 'qianshao', text: '……海邊？那邊沒有路燈欸。' },
      { who: 'xiangdengbo', text: '今年走海線啦！跟好跟好！' },
      { who: 'aman', text: '我就知道會彎這裡。', expr: 'smile' },
      { who: 'yawei', text: '領隊，後面我顧。一個一個我都記。' },
      { who: 'narrator', text: '隊伍離開白砂墩。這時候還很短，從頭旗到隊尾，喊一聲就聽得到。' },
    ],
  },
  // 3-7 臨時轉進：賢仔車行（第一句「傍晚，隊伍接回省道……」在 DayScene 的轉進畫面；最後一句「為什麼是這裡……」是 detour.why）
  zhuanjin4: {
    mood: 'dawn', place: '省道・賢仔車行', temple: 'temple_gongchen',
    lines: [
      { who: 'qianshao', text: '前面兩公里有一間廟，我看今晚就駐那裡。' },
      { who: 'narrator', text: '轎子走過一間車行，停住。往後退了三步。' },
      { who: 'narrator', text: '轎子在車行門口進了三次、退了三次。鐵門只拉到一半。' },
      { who: 'jiaoban4', text: '讓路！讓路！' },
      { who: 'xianzai', text: '欸欸欸，裡面還有車沒修好啦——好啦好啦，進來進來。', expr: 'surprised' },
      { who: 'narrator', text: '轎子衝進車行，在升降機旁邊落了地。' },
      { who: 'xiangdeng', text: '駐駕了！今晚駐這裡！' },
      { who: 'arui', text: '聊天室整個炸掉。大家都在問，為什麼是修車的？' },
      { who: 'qianshao', text: '這間？這間是修車的欸。旁邊就有廟。' },
      { who: 'yawei', text: '跟。' },
    ],
  },
  // 9-1 天亮過場（賢仔車行・天將亮）
  tianliang4_1: {
    mood: 'dawn', place: '賢仔車行・天將亮', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '天還沒全亮。騎樓的睡袋一個一個捲起來。' },
      { who: 'xianzai', text: '粥好了！要走的先來吃一碗，燒喔。', expr: 'smile' },
      { who: 'xianzai', text: '奇怪，我昨晚怎麼會想到要煮粥。' },
      { who: 'narrator', text: '車行後面那口舊灶，灶台是溫的。', when: (r) => r.cases.apo?.verdict === 'here' },
      { who: 'arui', text: '各位早安。跟轎台線上……兩千一。兩千一？' },
      { who: 'touqi', text: '起馬。' },
      { who: 'narrator', text: '轎子出了車行，在省道上頓了一下，往南。' },
      { who: 'qianshao', text: '今天走哪？' },
      { who: 'yawei', text: '跟。' },
    ],
  },
  // ---------- 第二天、第二夜（字照 _agent/ch4-text-day2.md；（演出：……）寫在 stage/ch4.ts 或只是文字版的節奏） ----------
  // 2 出發過場（第二天黃曆「起駕」之後；ChapterDef.departStory[2]）。草鞋丁那兩句只在草鞋丁有跟著時播（岔路線索一同條件）
  chufa4_2: {
    mood: 'dawn', place: '賢仔車行外・省道', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '省道往南。太陽出來以後，隊伍後面一直有人接上來。' },
      { who: 'arui', text: '線上八千。各位，現場人數我已經不會算了。' },
      { who: 'qianshao', text: '昨天我一眼看得完。今天我跑到隊尾要一炷香。' },
      { who: 'yawei', text: '早上多了一千四百多個。我還在記。' },
      { who: 'caoxie', text: '進北津以前要先洗腳。腳洗好，才算到。', when: caoxieWith },
      { who: 'qianshao', text: '阿伯，你從剛才就一直看你的腳。', when: caoxieWith },
    ],
  },
  // 3-6 過圳（乙路走完自動播；RouteDef.endStory）。最後一句草鞋丁有跟著才播
  guozun4: {
    mood: 'dawn', place: '堤防下的舊街・水圳邊', temple: 'temple_chaosheng',
    lines: [
      { who: 'narrator', text: '轎子經過圳邊那戶人家，慢了一下。門口那桶水是滿的。' },
      { who: 'narrator', text: '轎子過去以後，後面的人一個一個蹲下來洗腳。沒有人教。' },
      { who: 'zunama', text: '我婆婆交代的，這桶水每年都要放。今年總算有人用。' },
      { who: 'narrator', text: '草鞋丁蹲在最後一個。他洗了很久。', when: caoxieWith },
    ],
  },
  // 4-1 停駕北津派出所，等信徒集結（DayPlan.follow.rest.gather.story；文字版）
  tingjia_beijin4: {
    mood: 'dawn', place: '北津派出所・停駕', temple: 'temple_chaosheng',
    lines: [
      { who: 'narrator', text: '舊街走到底，出來就是北津派出所的側門。' },
      { who: 'narrator', text: '派出所門口的機車早就移開了。所長站在台階上，帽子拿在手上。' },
      { who: 'narrator', text: '轎子在派出所前落了地。' },
      { who: 'touqi', text: '下馬。等人到齊。' },
      { who: 'narrator', text: '橋上的人、舊街的人，一批一批到。整條街坐滿了，還有人在來。' },
      { who: 'jingyuan', text: '水在這邊，廁所在裡面右轉。旗子不要帶進去，我們幫你顧。' },
      { who: 'qianshao', text: '所以每年都停這裡，是在等人？' },
      { who: 'yawei', text: '等後面的。沒到齊不進廟。' },
    ],
  },
  // 8 入廟三進三退（駐駕前；DayPlan.follow.stay.story；演出見 stage/ch4.ts，轎只用 st_jiao4_carry／st_jiao4_pause）
  // 阿滿姨那句：第二天趕上入廟才播，沒趕上換成外圈那句；秀枝四句：今天稟報過秀枝才播（接在第三退之後）
  jinmiao4: {
    mood: 'temple', place: '北津朝聖宮・入廟', temple: 'temple_chaosheng',
    lines: [
      { who: 'narrator', text: '人到齊了。頭旗手把旗舉起來，整條街站起來。' },
      { who: 'touqi', text: '起馬。進廟。' },
      { who: 'narrator', text: '轎子從派出所前起來，往朝聖宮去。廟埕中間的人往兩邊退，空出一條路。' },
      { who: 'arui', text: '各位，要進了。我手在抖，畫面晃不要罵我。' },
      { who: 'narrator', text: '轎子衝到廟門前，停住，往後退。' },
      { who: 'zhongren', text: '進喔！' },
      { who: 'narrator', text: '第二次衝得更前面，轎頂的粉紅布都進了門簷的影子。又退。', fx: 'shake' },
      { who: 'zhongren', text: '進喔！進喔！' },
      { who: 'narrator', text: '阿滿姨擠在第三排，一手抓著網袋裡那支小旗，喊得比誰都大聲。', when: (r) => !!r.flags.ledger_aman2_ok },
      { who: 'narrator', text: '廟埕最外面那一圈，有人踮著腳一起喊。', when: (r) => !r.flags.ledger_aman2_ok },
      { who: 'qianshao', text: '領隊，我也想喊。我喊了他們聽不到，可以喊嗎？' },
      { who: 'yawei', text: '喊。' },
      { who: 'narrator', text: '第三次，轎子退得很遠，停了一下。整個廟埕的人吸了一口氣。' },
      { who: 'narrator', text: '第三退，轎子退得比前兩次都遠，一直退到巷口。', when: xiuzhiReported },
      { who: 'narrator', text: '轎子在輪椅前面三步的地方頓了一下，才往前衝。', when: xiuzhiReported },
      { who: 'xiuzhi', text: '阿母，妳有沒有看到？就在前面。阿母。', when: xiuzhiReported },
      { who: 'narrator', text: '大家都說，今年第三退退得特別遠。', when: xiuzhiReported },
      { who: 'zhongren', text: '進喔！' },
      { who: 'narrator', text: '轎子直直衝進廟門。鞭炮和鼓一起響，裡面外面都在拍手。', fx: 'firecracker' },
      { who: 'narrator', text: '有人在哭，有人抱在一起跳。阿睿忘了看螢幕。' },
      { who: 'yawei', text: '到了。' },
    ],
  },
  // 10-1 第二夜・進火（開審前；ChapterDef.nightStory[2]；全程安靜，不放鞭炮、不用 shake）
  // 最後三句是 10-2「判帶回白砂墩」的短版（草鞋丁沒有進去；判帶去北津的放下過場是 fangxia_caoxie4）
  jinhuo4: {
    mood: 'temple', place: '北津朝聖宮・進火', temple: 'temple_chaosheng',
    lines: [
      { who: 'narrator', text: '子時。朝聖宮的鼓停了，廟埕幾萬人，沒有人講話。' },
      { who: 'yawei', text: '今晚我們守外面。裡面的事，不是我們的。' },
      { who: 'narrator', text: '殿裡有人開始念名字。一個接一個，念得很平，中間沒有停。' },
      { who: 'qianshao', text: '（小聲）在念什麼？' },
      { who: 'yawei', text: '文疏。報名的人，名字都寫在上面。' },
      { who: 'narrator', text: '廟埕上有人聽到自己的名字，把頭低下去。' },
      { who: 'narrator', text: '名字念了很久。然後殿裡亮了一下。' },
      { who: 'narrator', text: '那一點火從殿裡的爐，移到一口小小的缸裡。' },
      { who: 'narrator', text: '火缸放進香擔。擔門關上，貼了封條。' },
      { who: 'qianshao', text: '就這樣？' },
      { who: 'yawei', text: '就這樣。從現在開始，那個火要一路顧回白砂墩。' },
      { who: 'narrator', text: '廟埕的人慢慢跪下去。後面的看到前面的跪，也跟著跪。' },
      { who: 'narrator', text: '草鞋丁站在廟埕外面，看著廟門。他沒有進去。', when: caoxieHome },
      { who: 'caoxie', text: '你們說帶我回庄裡。那我在外面等就好。', when: caoxieHome },
      { who: 'narrator', text: '草鞋丁還跟著走，旗下那 1 格沒有空出來。', when: caoxieHome },
    ],
  },
  // 10-2 第二夜・草鞋丁還願、放下（GuihuRules.releaseStory.caoxie；只有判「帶去北津」才會到這裡；進火之後、問歸處之前）
  fangxia_caoxie4: {
    mood: 'temple', place: '北津朝聖宮・廟埕', temple: 'temple_chaosheng',
    lines: [
      { who: 'narrator', text: '進火結束，殿前空出來了。草鞋丁站在門檻外面，沒有動。' },
      { who: 'caoxie', text: '我這樣進去可以嗎？腳有洗。下午在圳邊洗的。' },
      { who: 'yawei', text: '可以。你自己進去講。' },
      { who: 'narrator', text: '他跨過門檻，走到殿前跪下。他講了什麼，外面聽不到。' },
      { who: 'qianshao', text: '他講好久。' },
      { who: 'yawei', text: '欠幾十年的，要講比較久。' },
      { who: 'narrator', text: '他磕了三個頭，退著走出來。跨門檻的時候腳抬得很高。' },
      { who: 'caoxie', text: '講完了。歹勢，讓你們等。' },
      { who: 'qianshao', text: '阿伯，那你接下來要去哪？' },
      { who: 'caoxie', text: '回去啊。明年不用再站路口了。' },
      { who: 'narrator', text: '他往廟埕外面走。地上一排草鞋印，走到台階就沒有了。' },
      { who: 'narrator', text: '草鞋丁放下了。旗下空出 1 格。' },
    ],
  },
  // 12 第二夜天亮 → 第三天黃曆之前（試玩版：試玩結束卡之前，ChapterDef.sliceStory；整章模式：dawnStory[3]）
  // 阿滿姨那句：新娘判「帶回白砂墩」才播
  tianliang4_2: {
    mood: 'dawn', place: '北津朝聖宮・天將亮', temple: 'temple_chaosheng',
    lines: [
      { who: 'narrator', text: '天還沒亮。廟埕的人把睡袋捲好，站成兩排。' },
      { who: 'narrator', text: '香擔先出廟門。封條貼著，挑擔的人走得很穩。' },
      { who: 'narrator', text: '轎子跟在後面。粉紅布下面的布幔放下來了，從這裡到白砂墩都不會拉開。' },
      { who: 'qianshao', text: '回程換那個擔子走前面喔？' },
      { who: 'yawei', text: '火在裡面。火走前面。' },
      { who: 'arui', text: '各位早安，回程了。今天我少講一點話，大家自己看。' },
      { who: 'aman', text: '奇怪，今天網袋怎麼比較輕。', when: (r) => r.cases.xinniang?.verdict === 'tohome' },
      { who: 'touqi', text: '起馬。回白砂墩。' },
      { who: 'narrator', text: '隊伍掉頭往北。比來的時候長了好幾倍，隊尾還在北津街上，隊頭已經上了堤防。' },
      { who: 'qianshao', text: '回去走哪？走橋嗎？' },
      { who: 'yawei', text: '跟。' },
    ],
  },
  // 第三天・橋頭頓三下、下堤防（臨時轉進；DayPlan.follow.detour.story；演出見 stage/ch4.ts，轎全程布幔放下）
  qiaotou4: {
    mood: 'dawn', place: '渾水溪橋頭', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '（待寫）渾水溪橋頭。橋上的車一台接一台，香燈腳排到看不到尾。' },
      { who: 'narrator', text: '（待寫）轎子在橋頭停住，頓了一下。' },
      { who: 'narrator', text: '（待寫）又頓了一下。' },
      { who: 'narrator', text: '（待寫）第三下。轎班的腳轉向堤防。' },
      { who: 'qianshao', text: '（待寫）……不走橋？' },
      { who: 'narrator', text: '（待寫）轎子下了堤防，往溪邊去了。' },
      { who: 'yawei', text: '（待寫）跟。' },
    ],
  },
  // 第三夜之後・茫渡現身（最後一戰前）
  mangdu4: {
    mood: 'demon', place: '渾水溪・夜', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '（待寫）轎子先過去了。霧裡只剩對岸一點粉紅色。' },
      { who: 'mangdu', text: '（待寫）橋上那麼多人，一個都不下來。今天總算有人走我這裡。' },
      { who: 'yawei', text: '（待寫）押尾：水裡還有人。一個一個帶過去。' },
    ],
  },
  // 最後一戰的三種結局（斬只對茫渡）
  mangduRecall4: {
    mood: 'dawn', place: '渾水溪・天將亮', temple: 'temple_gongchen',
    lines: [
      { who: 'mangdu', text: '（待寫）茫渡・喚回：他答應留在溪邊當引路的。' },
      { who: 'qianshao', text: '（待寫）難怪不走橋。' },
      { who: 'narrator', text: '（待寫）喚回的收尾。' },
    ],
  },
  mangduReturn4: {
    mood: 'dawn', place: '渾水溪・天將亮', temple: 'temple_gongchen',
    lines: [
      { who: 'mangdu', text: '（待寫）茫渡・送回：送上對岸，了了。' },
      { who: 'narrator', text: '（待寫）送回的收尾。' },
    ],
  },
  mangduSlay4: {
    mood: 'dawn', place: '渾水溪・天將亮', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '（待寫）茫渡・斬。' },
      { who: 'yawei', text: '（待寫）押尾的那句。' },
    ],
  },
  // 回宮（結局之後；FinaleDef.closeStory；演出見 stage/ch4.ts：八人大轎 st_jiao8_carry）
  huigong4: {
    mood: 'temple', place: '白砂墩拱辰宮・回宮', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '（待寫）通汐到白砂墩，飯擔擺滿路邊。' },
      { who: 'narrator', text: '（待寫）換了八人大轎。頭旗、香擔先進廟。' },
      { who: 'xiangdeng', text: '（待寫）回來了！' },
      { who: 'narrator', text: '（待寫）大轎入廟。布幔還是放下的。' },
      { who: 'yawei', text: '（待寫）押尾的那句。' },
    ],
  },
  // 開爐（第 12 天；回宮之後的黃曆 → 這段 → 信徒錄）：布幔打開，鏡頭不拍神龕，只拍底下抬頭的臉（演出見 stage/ch4.ts）
  kailu4: {
    mood: 'dawn', place: '白砂墩拱辰宮・開爐',
    lines: [
      { who: 'narrator', text: '（待寫）回宮後第十二天，開爐。' },
      { who: 'narrator', text: '（待寫）布幔打開了。' },
      { who: 'aman', text: '（待寫）湯圓多煮一碗，放那邊。' },
      { who: 'xiuzhi', text: '（待寫）秀枝的那句。' },
      { who: 'ahan', text: '（待寫）阿翰的那句。' },
      { who: 'arui', text: '（待寫）阿睿的那句。' },
      { who: 'yawei', text: '（待寫）押尾的那句。' },
    ],
  },
};
