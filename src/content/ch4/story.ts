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
 *  - tianliang4_1：第一夜天亮（dawnStory[2]）；舊灶那一句只在阿婆判「就在這裡下」時播
 *  第 B1 輪（字照 _agent/ch4-text-day2.md）：
 *  - chufa4_2：第二天起駕之後（ChapterDef.departStory[2]）
 *  - guozun4：第二天乙路走完・過圳（RouteDef.endStory）
 *  - tingjia_beijin4：第二天停駕北津派出所、等信徒集結（rest.gather.story）
 *  - jinmiao4：第二天入廟三進三退、「進喔！」（stay.story；演出 stage/ch4.ts，轎只用 st_jiao4_carry／st_jiao4_pause）
 *  - jinhuo4：第二夜開審前・進火（ChapterDef.nightStory[2]）
 *  - fangxia_caoxie4：第二夜草鞋丁還願、放下（guihu.releaseStory）
 *  - tianliang4_1：第一夜天亮（dawnStory[2]）；tianliang4_2：第二夜天亮（dawnStory[3]，第三天黃曆之前）
 *  第 B2 輪（字照 _agent/ch4-text-day3.md）：
 *  - chufa4_3：第三天起駕之後（departStory[3]）；tingjia_dike4：第三天甲路走完、上堤防（RouteDef.endStory）
 *  - huitou4：稟報過秀枝，停駕點的事辦完、轎子起馬的時候（rest.leaveStory）
 *  - qiaotou4：第三天日落前・橋頭頓三下、下堤防（stay.story；演出，轎全程 st_jiao4_carry_closed）
 *  - mangdu4：第三天入夜（不問歸處，直接過溪；FinaleDef.story）
 *  - mangduRecall4／mangduReturn4／mangduSlay4：最後一戰的三種結局（斬只對茫渡；作者定案：沒有遺憾結局）
 *  - huigong4：回宮（四人小轎 → 換八人大轎 st_jiao8_carry，演出）
 *  - kailu4：開爐（第 12 天的黃曆之後；演出：鏡頭不拍神龕，只拍底下抬頭的臉）
 */
import type { Cutscene } from '../story';
import type { RunState } from '../../state';
import { carried3 } from './cases';

/** 第一夜判「帶去北津」或「帶回白砂墩」：草鞋丁有跟著（同 days.ts 的 caoxieWith；這裡自己寫一份，避免互相 import） */
const caoxieWith = (r: RunState): boolean => r.cases.caoxie?.verdict === 'tobeijin' || r.cases.caoxie?.verdict === 'tohome';
/** 草鞋丁判「帶回白砂墩」：第二夜站在廟埕外面沒有進去 */
const caoxieHome = (r: RunState): boolean => r.cases.caoxie?.verdict === 'tohome';
/** 第二天稟報過秀枝（入廟第三退多四句；同 believers.ts 的 xiuzhiReported） */
const xiuzhiReported = (r: RunState): boolean => r.follow?.reports.xiuzhi2 !== undefined;
/** 第二夜判新娘「帶回白砂墩」：第三天跟著走、回宮時放下（同 believers.ts 的 xinniangWith） */
const brideWith = (r: RunState): boolean => r.cases.xinniang?.verdict === 'tohome';
/** 茫渡還在、而且有了去處（喚回、送回）：開爐那天供桌上多一碗 */
const mangduStays = (r: RunState): boolean => r.shijuEnd === 'recall' || r.shijuEnd === 'return';

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
      { who: 'narrator', text: '草鞋丁繼續跟著頭旗走，回程有他作伴。', when: caoxieHome },
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
  // 12 第二夜天亮 → 第三天黃曆之前（dawnStory[3]）
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
  // ---------- 第三天、最後一戰、回宮、開爐（字照 _agent/ch4-text-day3.md；第 B2 輪） ----------
  // 1-2 第三天出發過場（ChapterDef.departStory[3]）。最後那句：新娘有跟著才播（岔路線索三同條件）
  chufa4_3: {
    mood: 'dawn', place: '省道・回程', temple: 'temple_chaosheng',
    lines: [
      { who: 'narrator', text: '回程。省道三個車道都是人，對向的車停在路肩，駕駛下來合掌。' },
      { who: 'narrator', text: '香擔走最前面。封條貼著，挑擔的人每一步都踩得很實。' },
      { who: 'arui', text: '線上九萬。今天我不喊分享了，路已經塞到我看不到尾。' },
      { who: 'qianshao', text: '轎子的布放下來了。這樣走，後面的人看得到什麼？' },
      { who: 'yawei', text: '看得到轎頂。夠了。' },
      { who: 'yawei', text: '今天人多。路上遇到的，名字我都記。' },
      { who: 'xinniang', text: '阿母以前回來都會講，過溪前在一棵大樹下吃飯擔。她說那裡的菜頭湯沒有她煮的好。', when: brideWith },
    ],
  },
  // 2-8 停駕點：堤防上的水門邊（第三天甲路走完自動播；RouteDef.endStory）
  tingjia_dike4: {
    mood: 'dawn', place: '渾水溪堤防・水門邊', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '渡頭路走到底，一個斜坡上堤防。溪面很寬，水是黃的。' },
      { who: 'narrator', text: '轎子在水門邊落了地。香擔放在上風的地方，四個人圍著顧。' },
      { who: 'touqi', text: '下馬。歇一下，等後面的。' },
      { who: 'narrator', text: '隊伍沿著堤防一路坐下去。從水門往回看，看不到最後一個人。' },
      { who: 'qianshao', text: '橋在那邊，再走十分鐘就到。等一下就上橋了吧。' },
      { who: 'yawei', text: '隊尾還在渡頭路。秀枝她們在最後面。' },
    ],
  },
  // 3-6 轎子回頭（今天稟報過秀枝才播：停駕點的事辦完、轎子起馬的時候，接在 post 之前；DayPlan.follow.rest.leaveStory）
  // 不用 flash、不用 shake。媽祖不出現，畫面上只有轎子
  huitou4: {
    mood: 'dawn', place: '渾水溪堤防・隊尾', temple: 'temple_gongchen',
    lines: [
      { who: 'touqi', text: '起馬。' },
      { who: 'narrator', text: '轎子起來，沒有往橋頭走。轎子掉頭，沿著堤防往回走。' },
      { who: 'narrator', text: '坐著的人一段一段站起來，往兩邊讓。讓了快一公里。' },
      { who: 'qianshao', text: '領隊，轎子在走回頭路。我第一次看到。' },
      { who: 'narrator', text: '轎子走到隊尾，在那台輪椅前面停住。' },
      { who: 'xiuzhi', text: '不是，我們沒有要擋路。阿母，我們往旁邊，往旁邊。' },
      { who: 'narrator', text: '輪椅的煞車還拉著，她推不動。轎子沒有繞過去。' },
      { who: 'narrator', text: '轎槓往下低了三次。粉紅色的布，離阿母的膝蓋不到一個手掌。' },
      { who: 'xiuzhiamu', text: '有啦。我有來。今年也有來。' },
      { who: 'narrator', text: '轎子退了三步，轉回去，往橋頭走。秀枝蹲在輪椅旁邊，很久沒有站起來。' },
      { who: 'narrator', text: '大家都說，那天轎子是專程回頭的。' },
      { who: 'qianshao', text: '是因為我們報了嗎？' },
      { who: 'yawei', text: '不知道。報是我們的事。' },
    ],
  },
  // 6 橋頭過場（日落前；DayPlan.follow.stay.story；演出見 stage/ch4.ts，轎全程布幔放下 st_jiao4_carry_closed）
  // 轎子為什麼不上橋，這裡不解釋（兵馬在最後一戰的結局才自己猜）
  qiaotou4: {
    mood: 'dawn', place: '渾水溪大橋・橋頭', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '傍晚。隊伍沿著堤防走到底，前面就是橋頭。橋上封了一線車道，兩邊的欄杆趴滿了人。' },
      { who: 'yijing4', text: '來了來了！橋上的往兩邊靠，中間空出來！' },
      { who: 'arui', text: '各位，要上橋了。橋很長，我先說，等一下我會喘。' },
      { who: 'narrator', text: '香擔到了橋頭，停住。挑擔的人沒有踩上橋面。' },
      { who: 'narrator', text: '轎子跟上來，在橋頭頓了一下。', fx: 'shake' },
      { who: 'narrator', text: '又頓了一下。橋上沒有人講話了。' },
      { who: 'narrator', text: '第三下。轎班的肩膀跟著轎槓往右轉。' },
      { who: 'narrator', text: '轎子離開橋頭，下了堤防的斜坡。芒草比人高，粉紅色的轎頂在草上面一晃一晃，往溪邊去。' },
      { who: 'xiangdeng', text: '下去了！不走橋！轎子要過溪！' },
      { who: 'yijing4', text: '蛤？下面是水欸。……橋上的不要動！不要用跳的！走斜坡下去，一個一個來！' },
      { who: 'qianshao', text: '橋就在旁邊。燈都點好了，路也封好了。' },
      { who: 'yawei', text: '跟。隊尾下來要很久，我走最後面。' },
    ],
  },
  // 7-1 開戰過場（入夜；FinaleDef.story）。提燈的兩句：今天有帶著他才播（5-2，過溪的時候）
  mangdu4: {
    mood: 'demon', place: '渾水溪・入夜', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '天黑了。溪水到大腿，底下是沙，踩下去會陷。' },
      { who: 'narrator', text: '香擔走在最前面。挑擔的人把擔子扛上肩，旁邊四個人用身體擋水花。' },
      { who: 'narrator', text: '轎子跟在後面。轎班沒有人回頭，一步一步踩過去。' },
      { who: 'narrator', text: '香擔上了對岸。轎子上了對岸。' },
      { who: 'qianshao', text: '過去了！火沒事，轎子也沒事。剩下後面的……' },
      { who: 'narrator', text: '溪面起霧了。霧是從下游上來的，貼著水面走。' },
      { who: 'qianshao', text: '後面還有幾個？' },
      { who: 'yawei', text: '水裡四千三百多。堤防上還有人在下來。' },
      { who: 'narrator', text: '堤防上有很多人打開手機的燈，往溪裡照。提燈的站在他們中間，把他那一盞舉得最高。', when: (r) => carried3(r, 'tideng') },
      { who: 'tideng', text: '夠亮了。今天晚上不用我的。', when: (r) => carried3(r, 'tideng') },
      { who: 'narrator', text: '霧裡有人在喊。聲音很熟，像自己家裡的人。' },
      { who: 'mangdu', text: '要過溪的，這邊。船在這邊。' },
      { who: 'qianshao', text: '領隊，隊伍中間有人往下游走了。那邊沒有岸，那邊是沙洲。' },
      { who: 'yawei', text: '牠沒有碰人。牠在叫人。' },
      { who: 'mangdu', text: '橋上那麼多人，一個都不下來。今天總算有人走我這裡。' },
      { who: 'yawei', text: '領隊，轎子和火在對岸了，那邊不用我們。我們顧水裡的。' },
    ],
  },
  // 7-7 結局：喚回（天將亮；媽祖不出現）。等船的人那句：今天有帶著他才播（5-1，過溪以後）
  mangduRecall4: {
    mood: 'dawn', place: '渾水溪・天將亮', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '天快亮了。霧退到下游，溪面看得到對岸。' },
      { who: 'yawei', text: '撐船的。明年這一隊如果又下來，你在前面帶。哪裡沙會陷、哪裡水急，你比誰都清楚。' },
      { who: 'mangdu', text: '用走的，不坐船喔？' },
      { who: 'qianshao', text: '你船都沒了，還在想載人。走前面帶路啦，一樣是送人過溪。' },
      { who: 'mangdu', text: '……帶路我會。不收錢。' },
      { who: 'narrator', text: '牠把斗笠戴正，走到隊伍前面。牠踩過的地方水比較淺，隊尾跟著那條路上了岸。' },
      { who: 'yawei', text: '四千三百一十六。到齊。' },
      { who: 'dengchuan', text: '到對岸了。我用走的到的。他那一趟，不用回頭接我了。', when: (r) => carried3(r, 'dengchuan') },
      { who: 'narrator', text: '對岸，粉紅色的轎頂動了一下，往北走了。隊伍都上岸了，它才走的。' },
      { who: 'qianshao', text: '領隊，我在想一件事。橋上那幾萬人，沒有一個會下來看牠。走橋的話，今天晚上跟以前每一年一樣。' },
      { who: 'qianshao', text: '難怪不走橋。' },
      { who: 'yawei', text: '是不是這樣，我不知道。轎子沒有講。' },
      { who: 'qianshao', text: '我知道轎子沒有講。我自己猜的不行喔。' },
      { who: 'narrator', text: '茫渡留在渾水溪引路。明年涉水的人，有人帶。' },
    ],
  },
  // 7-8 結局：送回
  mangduReturn4: {
    mood: 'dawn', place: '渾水溪・天將亮', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '天快亮了。霧退到下游。牠腳下那條船浮上來了，船底長滿青苔。' },
      { who: 'mangdu', text: '最後那一趟，我載到溪中間就翻了。那一趟沒有靠岸。' },
      { who: 'yawei', text: '現在靠。對岸在那裡。' },
      { who: 'narrator', text: '牠撐了一篙。船是空的，走得很慢。水裡的香燈腳以為是一陣風，都把旗子按住。' },
      { who: 'qianshao', text: '到了啦。船頭都碰到岸了，可以下來了。' },
      { who: 'mangdu', text: '……到了。這一趟有夠久。' },
      { who: 'narrator', text: '牠把篙插在岸邊，上了岸，斗笠拿在手上。船沉回水裡，沒有聲音。' },
      { who: 'yawei', text: '隊尾上岸了。四千三百一十六，到齊。' },
      { who: 'dengchuan', text: '到對岸了。我用走的到的。他那一趟，不用回頭接我了。', when: (r) => carried3(r, 'dengchuan') },
      { who: 'narrator', text: '牠朝粉紅色轎頂的方向站了一下，就不見了。轎子這時候才動，往北走了。' },
      { who: 'qianshao', text: '所以轎子下來，是來讓牠把那一趟走完？' },
      { who: 'yawei', text: '不知道。我只知道，走橋的話，牠今天晚上還是等不到人。' },
      { who: 'qianshao', text: '難怪不走橋。……明年如果又走下面，就沒有牠了。' },
      { who: 'yawei', text: '明年走哪裡，明年才知道。' },
      { who: 'narrator', text: '茫渡上了對岸，了了。渾水溪沒有擺渡的了。' },
    ],
  },
  // 7-9 結局：斬（不用 firecracker；斬的那一下 flash，短。兵馬不慶祝）。押尾那句：第三輪押尾問過名字就換一句
  mangduSlay4: {
    mood: 'dawn', place: '渾水溪・天將亮', temple: 'temple_gongchen',
    lines: [
      { who: 'qianshao', text: '領隊說斬。……這一章頭一次。' },
      { who: 'mangdu', text: '斬我？我又沒有打人。我是叫他們坐船。' },
      { who: 'yawei', text: '你叫走的那些，今晚差一點過不了溪。' },
      { who: 'narrator', text: '前哨的刀落下去。霧一下子散了，溪面很亮。', fx: 'flash' },
      { who: 'narrator', text: '沙洲上坐著的人站起來，不知道自己怎麼會走到這裡。岸上的人喊，他們就往回走。' },
      { who: 'yawei', text: '四千三百一十六。到齊。' },
      { who: 'dengchuan', text: '到對岸了。我用走的到的。他那一趟，不用回頭接我了。', when: (r) => carried3(r, 'dengchuan') },
      { who: 'narrator', text: '對岸，粉紅色的轎頂停了很久才動，往北走了。' },
      { who: 'qianshao', text: '霧散了，人也都到了。為什麼我不太想講話。' },
      { who: 'yawei', text: '牠叫什麼名字，我沒有問到。', when: (r) => !r.flags.finale_yawei },
      { who: 'yawei', text: '「渡頭撐船的」。我記了。現在要劃掉。', when: (r) => !!r.flags.finale_yawei },
      { who: 'qianshao', text: '橋就在旁邊，燈都點好了。轎子不走橋，硬要下來走這裡。這裡只有牠。' },
      { who: 'qianshao', text: '難怪不走橋。……領隊，轎子下來，應該不是叫我們來做這個的吧？' },
      { who: 'yawei', text: '不知道。轎子沒有講。斬是我們斬的。' },
      { who: 'narrator', text: '茫渡斬了。渾水溪的霧散了。溪底沒有了。' },
    ],
  },
  // 8 回宮（結局之後；FinaleDef.closeStory；演出見 stage/ch4.ts：前半四人小轎、換轎以後八人大轎 st_jiao8_carry，布幔放下）
  // 後面幾段依狀態接上（新娘放下、其他版本）；媽祖不出現
  huigong4: {
    mood: 'temple', place: '通汐 → 白砂墩拱辰宮・回宮', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '三月初九，下午。隊伍回到通汐。防風林邊，八人大轎已經等在那裡了。' },
      { who: 'narrator', text: '換轎的時候，四周拉起布圍著。外面的人都把頭低下去。' },
      { who: 'qianshao', text: '換大的了。八個人扛。走了三天的那一頂呢？' },
      { who: 'yawei', text: '收起來。明年還是它。' },
      { who: 'narrator', text: '從通汐到白砂墩，路兩邊擺滿了飯擔。家家戶戶把桌子搬到門口，鍋蓋都掀著。' },
      { who: 'cunbo', text: '回來了回來了！吃飽才准進去！這鍋是你們的，那鍋是兵將的！' },
      { who: 'qianshao', text: '領隊，他說那鍋是我們的。那我可以先聞嗎？' },
      { who: 'narrator', text: '拱辰宮的廟埕空出一條路。頭旗手站定，旗桿握在胸前。' },
      { who: 'touqi', text: '頭旗、香擔，先進！' },
      { who: 'narrator', text: '頭旗衝進廟門。香擔跟在後面，封條還貼著，跨過門檻的時候，挑擔的人把腳抬得很高。', fx: 'firecracker' },
      { who: 'zhongren', text: '進喔！進喔！進喔！' },
      { who: 'narrator', text: '大轎三進三退，進了廟門。鞭炮從廟口炸到海堤，跟出門那一晚一樣。', fx: 'firecracker' },
      { who: 'yawei', text: '出門兩百一十七個。回來的我記到六萬多，後面還在進來。領隊，到了。' },
      // 阿滿姨第三天沒辦，隔天才過溪（新娘跟著的話，下面「新娘放下」照播，只是時間在傍晚：這句放在前面）
      { who: 'narrator', text: '阿滿姨是自己走橋回來的，到廟埕的時候鞭炮還有零星幾聲。她在廟門口合掌，把那支小旗插正。', when: (r) => !r.flags.done_aman3 },
      // 新娘放下（判「帶回白砂墩」）
      { who: 'narrator', text: '阿滿姨走進廟埕，在石階前站住。她把網袋從左肩卸下來，朝左邊講了一句。', when: brideWith },
      { who: 'aman', text: '到了。', when: brideWith },
      { who: 'narrator', text: '她每年走到這裡，都對著左邊講這一句。', when: brideWith },
      { who: 'xinniang', text: '到了。阿母，回來這一半我有走完。', when: brideWith },
      { who: 'narrator', text: '新娘蹲下去，把那雙布鞋脫了，併好，放在石階旁邊。鞋尖朝廟門。', when: brideWith },
      { who: 'aman', text: '奇怪，今年回來腳比較不痠。', when: brideWith },
      { who: 'narrator', text: '新娘放下了。旗下空出 1 格。', when: brideWith },
      // 其他版本（短）
      { who: 'narrator', text: '阿滿姨走進廟埕，在石階前站住，把那支小旗插正，講了一句「到了」。', when: (r) => r.cases.xinniang?.verdict === 'tobeijin' },
      { who: 'narrator', text: '草鞋丁跟到廟門口。他在門檻外面跪下去，磕了三個頭。他說北津那一趟，明年他認得路了。', when: caoxieHome },
      { who: 'apo', text: '這裡不是我家。……你們吃飽沒有？沒有的話我在這邊煮也可以。', when: (r) => r.cases.apo?.verdict === 'tohome' },
      { who: 'narrator', text: '假香燈腳站在廟埕邊，看那個揹紅背包的男人進廟。這次他沒有跟進去。', when: (r) => r.cases.jiajiao?.verdict === 'tohome' },
    ],
  },
  // 9 開爐（第 12 天；回宮之後的黃曆 → 這段 → 信徒錄）。鏡頭在神龕的位置往外看：整段不拍神龕、不拍神像，只拍底下一排一排抬頭的臉
  // （演出見 stage/ch4.ts）。三位信徒各一小句（作者定案：沒有人被帶走，都趕上了）。
  // 最後兩句只在茫渡喚回或送回時播；斬換成「剛好。沒有多。」
  kailu4: {
    mood: 'dawn', place: '白砂墩拱辰宮・開爐',
    lines: [
      { who: 'narrator', text: '三月二十，回宮第十二天。拱辰宮的殿裡站滿了人，都在等。' },
      { who: 'narrator', text: '時辰到。神龕的布幔往兩邊拉開。' },
      { who: 'narrator', text: '殿裡的人一起抬頭。沒有人講話。' },
      { who: 'narrator', text: '阿滿姨抬著頭，嘴巴動了動。' },
      { who: 'narrator', text: '阿翰把帽子拿在手上。' },
      { who: 'narrator', text: '賢仔站在門邊，褲子後面的口袋還插著那支扳手。' },
      { who: 'narrator', text: '秀枝把輪椅的椅背搖高。她阿母看了很久，手上的旗沒有放下來。' },
      { who: 'narrator', text: '阿睿站在最後面。他的手機在口袋裡，今天沒有拿出來。' },
      { who: 'narrator', text: '香擔的封條撕開。帶回來的火，一勺一勺添進殿裡的爐。' },
      { who: 'qianshao', text: '火從北津一路顧回來，沒有熄。' },
      { who: 'yawei', text: '挑擔的那幾個，這幾天沒有好好睡。' },
      { who: 'cunbo', text: '湯圓好了！紅的白的都有，自己舀，吃了才圓滿！' },
      { who: 'aman', text: '湯圓多煮一碗，放那邊。' },
      { who: 'qianshao', text: '領隊，供桌上那一排是我們的。我數過了，我們幾個，就幾碗。' },
      { who: 'yawei', text: '多一碗。', when: mangduStays },
      { who: 'qianshao', text: '多的那碗給誰？……喔。溪邊那個。', when: mangduStays },
      { who: 'yawei', text: '剛好。沒有多。', when: (r) => !mangduStays(r) },
    ],
  },
};
