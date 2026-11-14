// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
// 第四章漏掉收尾 v0.1【待定】（作者尚未定稿）。字照 docs/白砂墩_漏掉收尾對照_v0.1.md 第 2 節「漏掉」那一句，分配表（第 3 節）是「化解」的才放這裡。
/**
 * 第四章「漏掉收尾」：白天沒做的事（略過的信徒卡、沒處理的牽路仔、沒找的證據、押錯／留在轎邊、沒稟報、什麼都不拍、白天沒帶的鬼），
 * 隔天黃曆的「昨日」寫一句化解版（媽祖不露臉、不說話，只透過轎、風、香、燈、鞭炮、別人補上）。第三天的寫在開爐那頁（finale.ts 的 fordEnd4）。
 * 爽Game：只寫字，不扣分、不改任何數值。
 *
 * MISSED_END4 只放白天、分配表是「化解」的項目。其他的在檔案後半（第 B 步）：
 *   搞笑：1-01 阿睿的行動電源、2-03 點人頭的阿伯、3-14 賢仔和巴士（那天日落當場播：MISSED_FUN4）
 *   問歸處判到別處／真相沒對出來（N1-1～N1-3、N2-x；2-03、2-16「判到別處」那一半）：判決之後當場播（MISSED_NIGHT4）
 *   最後一戰：F-2 說不動茫渡當場播（FINALE_WRONG_FUN4）；F-1、F-3～F-6、E-1 寫在開爐那頁「昨日」（MISSED_FINALE4）
 *   jump scare（第 C 步，檔案最後）：N1-4 點心擔阿婆（第一夜問歸處，判完回列表那一下）、3-13 提燈的（mangdu4 起霧以後）
 */
import type { RunState } from '../../state';
import type { Encounter } from '../days';
import type { BanterLine } from '../chapter';
import { poolFor } from '../../core/procession';
import { rightVerdict } from '../../core/guihu';
import { CARDS4 } from './believers';
import { CASES4 } from './cases';
import { DAY_PLANS4 } from './days';

/** 漏掉・化解版（key：信徒卡／牽路仔／證據／鬼的 encounter id；bet<天>、report<天>；傳消息的選項 id） */
export const MISSED_END4: Record<string, string> = {
  // ---------- 第一天白天 ----------
  /** 1-02 草鞋丁白天沒帶（轎子的動作） */
  caoxie1: '草鞋丁一樣不敢靠近，只跟在轎子後面三步遠。轎子進車行之前，忽然往後退了三步，剛好停在他面前。他愣在那裡，腰彎得很低。今晚沒問到他的事，他自己說：「媽祖有回頭看我，這樣就夠了。」',
  /** 1-03 沒聽賣蚵嗲的阿桑講（別人補上） */
  oajian1: '你們沒停下來聽。走到街尾，買蚵嗲的那個香燈腳邊吃邊跟旁邊的人講，講的就是阿桑那幾句，講得比她還大聲。',
  /** 1-04 押兵押錯，或留在轎邊（轎子的動作） */
  bet1: '前哨從外環跑回來，旗子都跑歪了。轎子在老路口多頓了一下，剛好頓到他歸隊。押尾：「轎子有在等你。你喘完再講。」',
  /** 1-05 阿滿姨的膝蓋沒辦（燈） */
  aman1: '阿滿姨走到天黑，在一間雜貨店的騎樓坐下來。騎樓那盞壞了一年的燈，那天晚上自己亮了，老闆娘出來看燈，順手拿了一條毯子給她。',
  /** 1-06 防風林的牽路仔沒處理（鞭炮） */
  stray1a: '戴斗笠的阿伯往林子走了幾步，前面土地公廟剛好有人放了一串鞭炮。他回頭看熱鬧，看著看著就走回隊伍裡了，牽路仔的手還舉在半空中。',
  /** 1-07 賢仔門口沒幫忙順（沒弄明白，事情還是成了） */
  xianzai1: '賢仔一個人忙到半夜，還是不知道轎子為什麼挑他這間。收鐵門的時候，他只拉了一半，自己也講不出為什麼。',
  /** 1-08 車行後面的舊灶沒找（香） */
  stove: '沒有人去搬那堆輪胎。半夜轎前的香往車行後面飄，飄到輪胎那個角落才散，隔天賢仔一直說後面怎麼有粥的味道。',
  /** 1-09 點心擔阿婆白天沒請（燈） */
  apo1: '阿婆還在鐵門外面找門。天黑車行的燈全開，光從鐵門底下照出來，照到她腳邊。她順著光繞到後面，看到自己的灶，就不找門了，蹲下去顧火。',
  /** 1-10 阿翰的水泡沒辦（風） */
  ahan1: '阿翰自己貼了兩片 OK 繃就睡了。半夜一陣風吹過騎樓，整排進香旗的鈴響了一輪，他翻身壓到手機，那則訊息整則被刪掉，早上起來他找了很久。',
  /** 1-11 秀枝沒讓押尾記下（轎頂的布） */
  xiuzhi1: '押尾今天沒記到秀枝。轎子進車行的時候，粉紅色的遮雨布被風掀起一個角，朝的是馬路對面路燈下那個方向。押尾：「對面路燈下有人。明天我自己去記。」',
  /** 1-12 今天的稟報沒用（香） */
  report1: '今天一件事都沒稟報。轎前那三炷香燒得特別慢，燒到隊尾最後一台輪椅到了才燒完。前哨：「我們又沒稟報，媽祖是在等誰？」押尾：「不知道，等媽祖開示。」',
  /** 1-13 傳消息選「什麼都不拍」（燈） */
  none: '阿睿收了手機，坐在騎樓看轎子。車行的燈把粉紅色的轎頂照得很亮，他坐到旁邊的睡袋都鋪好了才起來，說今天這段留給在場的人就好。',

  // ---------- 第二天白天 ----------
  /** 2-01 阿翰要不要上車沒管（別人補上） */
  ahan2: '阿翰想太久，後座被一個阿伯坐走了。他愣了一下笑出來，背包揹好繼續走，走到圳邊的時候，前面有人回頭遞了一塊藥布給他。',
  /** 2-02 沒走成的新娘白天沒帶（轎頂的布） */
  xinniang2: '穿紅衣的女人還站在站牌下等車。轎子經過站牌的時候慢了一下，轎頂那塊粉紅色的布朝舊街那邊飄。她往那邊看了一下，說洗腳的地方說不定在那邊，就自己走過去了。',
  /** 2-04 穿新鞋的女生沒辦（別人補上；拍車行才有） */
  shoes2: '兩個女生提著鞋上了客運。司機聽說她們是來進香的，在北津街口多停了一站，她們下車剛好聽到第一聲「進喔」。',
  /** 2-05 沒戴帽子的男生沒辦（風；拍車行才有） */
  heat2: '轎子過檳榔攤的時候，遮陽傘被風吹歪，影子剛好蓋在那個沒戴帽子的男生身上。老闆娘出來扶傘才看到他，叫了車送他去診所，晚上他傳訊息給朋友，說診所冷氣很強。',
  /** 2-06 冬瓜茶攤旁的牽路仔沒處理（鞭炮；拍車行才有） */
  stray2y: '有個人被牽路仔叫進巷子，才走了幾步，巷口擺攤的學生喊他喝茶，一杯冬瓜茶已經塞到他手上。他站在那裡喝完，牽路仔在巷子裡等了一下，覺得沒意思就走了。',
  /** 2-07 補旗的阿伯沒辦（別人補上；什麼都不拍才有） */
  flag2: '補旗的阿伯穿針穿了半天穿不過去。一個路過的國小老師蹲下來幫他穿，他到北津的時候旗上多一塊補丁，看到人就拿給人家看。',
  /** 2-08 點心站的油飯沒辦（時機剛好；什麼都不拍才有） */
  rice2: '點心站的阿姨把油飯載去北津的廟埕。車才停好，入廟的鞭炮剛響完，餓了一天的人全部轉過來，她發到晚上八點，一包都沒剩。',
  /** 2-09 押兵押錯，或留在轎邊（圳邊的水桶） */
  bet2: '前哨從橋上擠回來，還在念派出所明明在那邊。舊街那戶人家門口的水桶還是滿的，他蹲下去洗了腳，說跑這一趟剛好，腳髒的人洗起來比較有感覺。',
  /** 2-10 阿滿姨在圳邊沒等她（轎子的動作） */
  aman2: '阿滿姨在圳邊坐到她滿意才走，到廟埕只站得到最外圈。第三退的時候轎子退得很遠，粉紅色的轎頂在她面前晃了一下，她說今年這個位子最好。',
  /** 2-11 舊街死巷的牽路仔沒處理（轎頂） */
  stray2b: '揹小孩的太太往死巷走了兩步，背上的小孩突然指著外面喊「粉紅色」。她轉頭去看轎子，就跟著人潮出去了。',
  /** 2-12 假香燈腳白天沒叫過來（香） */
  jiajiao2: '戴臂章的男人照樣跟在紅背包後面一步。進廟的時候殿裡的香很濃，他被嗆得停在門檻外，站在那裡聽完揹紅背包的人跪著講的話，聽完就沒有再跟進去。',
  /** 2-13 阿睿腳邊的阿嬤沒辦（轎子落地的位置） */
  arui2: '轎子在派出所前落地，捏著紙條的阿嬤跟著人往那邊靠，就走進派出所了。警察泡茶給她喝，她孫子半個鐘頭後來接。阿睿收工才聽說：「蛤，她就站我旁邊欸。」',
  /** 2-14 賢仔的一車背包沒辦（風） */
  xianzai2: '賢仔喊人來領背包，喊到喉嚨都啞了，沒人聽到。一陣風把車斗的帆布整片掀起來，二十幾個背包露在外面，路過的人一看就認出自己的，排隊來領。',
  /** 2-15 秀枝卡住的輪椅沒辦（鞭炮的煙） */
  xiuzhi2: '秀枝她阿母的輪椅還卡在巷口。鞭炮的煙從廟埕一路飄進巷子，阿母聞到味道醒了一下，說了一句「進去了」。秀枝說對，轎子進去了。',
  /** 2-16 顧旗的囡仔沒帶（進火的光；「判到別處」那一半是問歸處的，之後另外接） */
  guqi2: '顧旗的囡仔還舉著旗蹲在桌子下。半夜進火，殿裡亮起來的光從廟門照出來，照到點心站的桌腳，他探頭看到了，說火很小，可是他有看到。那支旗後來被一個國中生認走，他的手總算可以放下來。',
  /** 2-17 拿著襯衫的太太沒辦（香；拍秀枝才有） */
  sick2a: '拿著襯衫的太太擠不到前面，把襯衫舉過頭，旁邊不認識的阿姨幫她一起舉。轎子進門以後，殿裡的香一陣一陣往外飄，飄到最後一排，她把襯衫收回來聞了一下，再摺好。',
  /** 2-18 牽孫女的阿公沒辦（轎子繞路；拍秀枝才有） */
  sick2b: '阿公把孫女抱到街角一台機車的坐墊上站著。轎子入廟前多繞了半條街，粉紅色的轎頂從街角那一頭晃過去，小女孩說她有看到，一路講到回家。',
  /** 2-19 今天的稟報沒用（別人補上） */
  report2: '今天沒有事情報到轎前。半夜殿裡念文疏，擠不進來的人聽不到有沒有念到自己。押尾翻開他那一本簿子：「今天沒報上去的人，我這邊都有記。我在廟門口念給他們聽，也一樣。」',
  /** 2-20 傳消息選「什麼都不拍」（自己看開） */
  none2: '阿睿把手機收進口袋，用眼睛看完進火前的廟埕。隔天回程人沒有變多，路上清閒，前哨說這樣他跑起來比較順。',

  // ---------- 第三天白天（開爐那頁黃曆的「昨日」） ----------
  /** 3-01 阿翰還沒許的願沒辦（風） */
  ahan3: '阿翰一路走在幾千個人後面。過溪以前起了一陣風，他的帽子被吹掉，一路滾到前面，前面的人一個傳一個幫他傳回來，帽子裡多了一張平安符。他說要許的願，等回宮再講。',
  /** 3-02 阿睿留言裡找人的沒辦（轎頂） */
  arui3: '阿睿沒空看找人的留言。走散的人看到粉紅色的轎頂，都往轎子那邊走，走到服務台前面，一個一個遇到要找的人，天黑前登記簿上的名字全部劃掉了。',
  /** 3-03 跪成一排的一家人沒辦（別人補上；拍三進三退才有） */
  kneel3: '轎班遠遠就喊讓路，後面跟著跪的人先站起來，一個拉一個，把那一家人拉到路邊。阿嬤的拖鞋掉了一隻，孫子跑回去撿，她說站這裡看得比較清楚。',
  /** 3-04 提橘子的阿伯沒辦（轎子經過；拍三進三退才有） */
  orange3: '阿伯的橘子沒有人停下來拿。轎子經過的時候，一顆橘子從袋口滾到路中間，轎班一個一個跨過去，沒有人踩到。阿伯把那顆撿回來擦一擦，說這顆要留著，其他的載回去分鄰居。',
  /** 3-05 被擋住的醫療車沒辦（別人補上；拍賢仔的貨車才有） */
  block3: '醫療車過不來，護理師揹著箱子用跑的。路邊發水的人看她喘，一路幫她喊借過，喊到中暑的人那邊，那個人已經被扶到樹下，旁邊有人在幫他搧風。',
  /** 3-06 倒著走的阿伯沒陪（風；什麼都不拍才有） */
  count3: '阿伯一路倒著走到堤防，袋子裡只有三個寶特瓶。他說今年的人很乖，後面的路很乾淨，連風都是順的。',
  /** 3-07 押兵押錯，或留在轎邊（轎子停一下） */
  bet3: '前哨從引道擠回來，說他三天不講話，說到做到。轎子彎進渡頭路以後在榕樹下停了一下，他趁機聞了兩口滷肉，走不到一百公尺就又開口了。',
  /** 3-08 阿滿姨回程沒陪（燈） */
  aman3: '阿滿姨走到天黑，在渡頭路的飯擔歇腳。隔天早上她走橋過溪，橋上那一排燈沒有人關，一路亮到她走完，她說橋很好走，走到一半她有往下看一下溪水。',
  /** 3-09 等船的人沒帶（旗上的鈴） */
  dengchuan3: '等船的人還坐在樹下等船。隊伍上岸的時候，旗上的鈴響成一片，從溪那邊一路傳到樹下。他聽了一下，說有人過溪了，那他也不用再等，就把包袱揹起來，沿著堤防慢慢走。',
  /** 3-10 渡頭路尾的牽路仔沒處理（燈） */
  stray3a: '揹睡袋的年輕人往河床走了一段，橋上那一排燈剛好亮起來。他回頭一看，才發現自己走到下面來了，堤防上他同學拿手機的燈一直晃，他就爬回去了。',
  /** 3-11 秀枝和阿母沒往前推（布幔） */
  xiuzhi3: '秀枝和她阿母還在隊尾。轎子起馬的時候，放下來的布幔被風吹得鼓起來，朝隊尾那邊飄了三下才貼回去。阿母手上的旗跟著響了三聲，秀枝問她怎麼了，她說有，有來。',
  /** 3-12 繫船的石樁沒找（沒弄明白，事情還是成了） */
  mooring: '水門旁邊那根石樁還埋在草裡，沒有人看到。隊伍下堤防的時候，一個小孩被它絆了一下，回頭念了一句「誰在這裡種石頭」，後面的人就都繞著走。這根石樁以前是綁船的，今晚沒有人知道，也沒有人再被絆到。',
  /** 3-15 今天的稟報沒用（轎子多歇一下） */
  report3: '今天沒有事情報到轎前。轎子在水門邊歇得比平常久，一直歇到隊尾最後一個人坐下來才起馬。前哨：「媽祖是在等誰？」押尾：「不知道，等媽祖開示。」',
};

/** 「昨日」最多寫幾句（直書的黃曆放不下太多；信徒卡優先） */
export const MISSED_CAP4 = 6;

type Rule = { key: string; day: number; card: boolean; missed: (r: RunState) => boolean };

const flag = (r: RunState, k: string) => !!r.flags[k];
/** 略過那張信徒卡（DayScene 略過有 missed 的卡時記 flags.missed_<卡>） */
const card = (key: string, day: number): Rule => ({ key, day, card: true, missed: (r) => flag(r, `missed_${key}`) });
/** 白天沒帶的鬼（帶了就會有 run.cases[案]） */
const ghost = (key: string, day: number, caseId: string): Rule => ({ key, day, card: false, missed: (r) => !r.cases[caseId] });
/** 牽路仔沒處理：沒被押中的前哨先清掉、也沒派兵喊／託點心站 */
const stray = (key: string, day: number, shows: (r: RunState) => boolean = () => true): Rule => ({
  key, day, card: false, missed: (r) => shows(r) && !flag(r, `cleared_${key}`) && !flag(r, `stray_${key}`),
});
const clue = (key: string, day: number): Rule => ({ key, day, card: false, missed: (r) => !r.evidence.includes(key) });
/** 押錯或留在轎邊（押中會記 flags.bet_hit_<天>） */
const bet = (day: number): Rule => ({ key: `bet${day}`, day, card: false, missed: (r) => !flag(r, `bet_hit_${day}`) });
/** 這一天的稟報一次都沒用（稟報的 key 是信徒卡 id） */
const report = (day: number, keys: string[]): Rule => ({
  key: `report${day}`, day, card: false, missed: (r) => !keys.some((k) => r.follow?.reports[k] !== undefined),
});
const filmed = (day: number, id: string): Rule => ({ key: id, day, card: false, missed: (r) => r.follow?.broadcast[day] === id });
/** 那一天的傳消息（前一天日落選的）是不是這一個 */
const shot = (day: number, id: string) => (r: RunState) => r.follow?.broadcast[day] === id;

/** 照文件的順序；同一天裡信徒卡排前面（MISSED_CAP4 截斷時優先留） */
const RULES4: Rule[] = [
  // 第一天
  // 賣蚵嗲的阿桑那張卡沒有 missed（略過不記 flags.missed_oajian1）：沒聽＝沒拿到岔路線索三
  { key: 'oajian1', day: 1, card: true, missed: (r) => !flag(r, 'clue_oajian') }, card('aman1', 1), card('xianzai1', 1), card('ahan1', 1), card('xiuzhi1', 1),
  ghost('caoxie1', 1, 'caoxie'), bet(1), stray('stray1a', 1), clue('stove', 1), ghost('apo1', 1, 'apo'),
  report(1, ['aman1', 'xiuzhi1', 'ahan1']), filmed(1, 'none'),
  // 第二天
  card('ahan2', 2), card('shoes2', 2), card('heat2', 2), card('flag2', 2), card('rice2', 2), card('aman2', 2),
  card('arui2', 2), card('xianzai2', 2), card('xiuzhi2', 2), card('sick2a', 2), card('sick2b', 2),
  ghost('xinniang2', 2, 'xinniang'), stray('stray2y', 2, shot(1, 'garage')), bet(2), stray('stray2b', 2),
  ghost('jiajiao2', 2, 'jiajiao'), ghost('guqi2', 2, 'guqi'), report(2, ['ahan2', 'aman2', 'xiuzhi2']), filmed(2, 'none2'),
  // 第三天（什麼都不拍：渡頭路的牽路仔不出現）
  card('ahan3', 3), card('arui3', 3), card('kneel3', 3), card('orange3', 3), card('block3', 3), card('count3', 3),
  card('aman3', 3), card('xiuzhi3', 3),
  bet(3), ghost('dengchuan3', 3, 'dengchuan'), stray('stray3a', 3, (r) => !shot(2, 'none2')(r)), clue('mooring', 3), report(3, ['aman3', 'xiuzhi3', 'ahan3']),
];

/** 第 n 天漏掉、有化解版的事（不截斷；信徒卡在前） */
export function missedKeys4(r: RunState, n: number): string[] {
  const hit = RULES4.filter((x) => x.day === n && x.missed(r));
  return [...hit.filter((x) => x.card), ...hit.filter((x) => !x.card)].map((x) => x.key);
}

/** 第 n 天漏掉的化解版（「昨日」用；最多 MISSED_CAP4 句，信徒卡優先） */
export function missedLines4(r: RunState, n: number, cap = MISSED_CAP4): string[] {
  return missedKeys4(r, n).slice(0, cap).map((k) => MISSED_END4[k]);
}

/**
 * 開發用（截圖）：?scene=…&ch=baishadun&preset=missed&n=<天>。把第 1～upTo 天當成什麼都沒做：
 * 信徒卡全部略過、鬼都沒帶、押兵留在轎邊、沒稟報、日落什麼都不拍（之後的事件池照「什麼都不拍」）。
 * 只改 run（不碰數值規則）；「昨日」寫第 upTo 天的。
 */
export function applyMissedPreset4(r: RunState, upTo: number, today?: number): void {
  const f = r.follow;
  const none = ['none', 'none2'];
  for (let d = 1; d <= Math.min(3, upTo); d++) {
    skipDay4(r, d);
    if (f && d <= 2) {
      const opt = DAY_PLANS4[d].broadcast!.find((o) => o.id === none[d - 1])!;
      f.broadcast[d] = opt.id;
      f.tags = [...opt.tags];
      r.flags[`film_${opt.id}`] = true;
    }
    if (f) f.betResult = 'stay';
  }
  r.yesterday = upTo >= 1 ? missedLines4(r, Math.min(3, upTo)) : [];
  // &sunset=1：今天（第 today 天）也當成什麼都沒做（傳消息還沒選，留給日落那頁；「昨日」不動）
  if (today && today >= 1 && today <= 3) {
    skipDay4(r, today);
    if (f) f.betResult = 'stay';
  }
}

/** 第 d 天的信徒卡全部記成略過（照那天的事件池；傳消息、「昨日」不在這裡） */
function skipDay4(r: RunState, d: number): void {
  const plan = DAY_PLANS4[d];
  const pool = poolFor(plan, r.follow?.tags ?? []);
  const rt = plan.routes.find((x) => x.id === plan.follow?.goes);
  const all: Encounter[] = [...pool.pre, ...(rt?.encounters ?? []), ...(plan.follow?.rest.encounters ?? []), ...pool.post];
  for (const e of all) if (e.kind === 'person' && CARDS4[e.card]?.(r)?.missed) r.flags[`missed_${e.card}`] = true;
}

// ======================================================================
// 第 B 步：搞笑（當場播）、問歸處（判決之後當場播）、最後一戰／回宮／開爐。
// 字照文件第 2 節，分配表（第 3 節）選哪一種就放哪一種。jump scare（N1-4、3-13）不在這裡。
// ======================================================================

/** 白天的搞笑版（分配表：搞笑）：那一天日落（傳消息之前）當場播一次 */
export const MISSED_FUN4: Record<string, string> = {
  /** 1-01 阿睿的行動電源沒撿 */
  arui1: '傍晚轎子進車行，阿睿蹲在牆邊找插座，牆上那個沒人用的插座剛好就在他手邊。阿睿：「蛤，就這樣？我連跟觀眾哭窮的開場白都想好了欸。」',
  /** 2-03 點人頭的阿伯沒帶（判到別處的話，判決之後播同一句） */
  diantou2: '轎子從里程碑前面過去，阿伯簿子上的人數自己對上了。點人頭的阿伯：「對了？我數到手痠都亂掉，祢經過一下就對了，那我這本是寫心酸的喔。」他把簿子闔起來，闔得有點不甘願。',
  /** 3-14 賢仔前面拋錨的巴士沒辦 */
  xianzai3: '賢仔塞到不耐煩，提著工具箱下車，才走到一半，前面那台巴士自己發動了。賢仔：「欸，我都走到這裡了，好歹留一顆螺絲給我轉。」車上的人跟他揮手，他只好也揮回去。',
};

const FUN_RULES4: { key: string; day: number; missed: (r: RunState) => boolean }[] = [
  { key: 'arui1', day: 1, missed: (r) => flag(r, 'missed_arui1') },
  { key: 'diantou2', day: 2, missed: (r) => !r.cases.diantou },
  { key: 'xianzai3', day: 3, missed: (r) => flag(r, 'missed_xianzai3') },
];

/** 第 n 天日落當場播的搞笑版（沒漏掉就是空的） */
export function dayEndMissed4(r: RunState, n: number): string[] {
  return FUN_RULES4.filter((x) => x.day === n && x.missed(r)).map((x) => MISSED_FUN4[x.key]);
}

/**
 * 問歸處判決之後當場播（接在判決之後的話後面）。verdict：判到正解以外；truths：判的時候還有真相沒對出來。
 * 分配表：N1-1 化解、N1-2 搞笑、N1-3 化解、N2-1 化解、N2-2 化解、N2-3 化解、N2-4 搞笑。
 * N1-4（阿婆的真相）是 jump scare，另外做，不放這裡。
 * 點人頭的阿伯（2-03 搞笑）、顧旗的囡仔（2-16 化解）帶了但判到別處的那一半也接在這裡。
 */
export const MISSED_NIGHT4: Record<string, { verdict?: string; truths?: string }> = {
  caoxie: {
    /** N1-1 化解 */
    verdict: '不管判草鞋丁去哪，天亮轎子出車行，在省道上頓了一下，他脖子上那條繩子剛好鬆了，草鞋掉在他腳邊。他看了很久，把草鞋穿上，說今年總算有穿這雙草鞋跟轎子走一段。',
    /** N1-2 搞笑 */
    truths: '草鞋丁：「你們就問到這裡喔？我這雙草鞋掛幾十年，都沒有人好奇一下。」前哨：「阿伯，那你要講嗎？」草鞋丁：「……現在叫我講，我又歹勢了。」',
  },
  apo: {
    /** N1-3 化解 */
    verdict: '不管帶阿婆去哪，天亮賢仔莫名其妙煮了一大鍋粥，端出來的時候轎子在省道上頓了一下。阿婆聞到味道，回頭看了一眼，說煮粥的事有人接手了，那她就放心了。',
  },
  xinniang: {
    /** N2-1 化解 */
    verdict: '不管判她去哪，天亮隊伍掉頭，轎子起馬帶起一陣風，阿滿姨網袋裡那支小旗響了好幾聲。新娘認得那個聲音，朝阿滿姨的背影看了很久，說原來阿母還帶著那支旗。',
    /** N2-2 化解 */
    truths: '新娘的阿母是誰，今晚沒有問出來。問完要散的時候，新娘蹲在廟埕邊，旁邊睡著的阿姨網袋口插著一支小旗，她看了很久，伸手幫那個阿姨把外套拉好。押尾：「她好像自己認出阿母了。我就沒有再問。」',
  },
  jiajiao: {
    /** N2-3 化解 */
    verdict: '不管判他去哪，半夜一陣風把他那個戴反的臂章吹掉，剛好掉在派出所的失物桌上。他伸手要撿，看到背面寫的是別人的名字，手就收回去了。天亮有個太太來把臂章認走。',
    /** N2-4 搞笑（作者原話） */
    truths: '揹紅背包的男人自己走到殿前跪下去，把他欠的那些事從頭講了一遍，沒有人逼他。假香燈腳：「你難道一點都不想知道我發生甚麼事情嗎？就這樣給我神蹟打發我。」這句講完，他自己笑出來，說剛剛那一下氣都消了，現在要他從頭講，他也講不出那個味道。',
  },
  /** 2-03 判到別處（搞笑；沒帶的話是日落當場播） */
  diantou: { verdict: MISSED_FUN4.diantou2 },
  /** 2-16 判到別處（化解・進火的光；沒帶的話寫在隔天「昨日」） */
  guqi: { verdict: MISSED_END4.guqi2 },
};

/** 問歸處判了 id、判的是 verdict：要接在判決之後的漏掉收尾（判對而且真相都對出來就是空的） */
export function nightMissed4(r: RunState, id: string, verdict: string): string[] {
  const k = CASES4[id];
  const m = MISSED_NIGHT4[id];
  if (!k || !m) return [];
  const out: string[] = [];
  if (m.verdict && verdict !== rightVerdict(k)) out.push(m.verdict);
  if (m.truths && new Set(r.cases[id]?.truths ?? []).size < k.truths.length) out.push(m.truths);
  return out;
}

/** 陣前審問說不動茫渡（F-2 搞笑）：第一次說不動時當場播（戰鬥帶上的對話；茫渡第一句已經在審問的結果裡） */
export const FINALE_WRONG_FUN4: BanterLine[] = [
  { who: '', text: '對岸這時候響了一串鞭炮，茫渡愣了一下。' },
  { who: '茫渡', text: '你們拿不出東西，放個炮就要我讓路喔？' },
  { who: '', text: '牠又聽了一陣，說炮聲牠很久沒聽了，這次算你們的。' },
];

/** 最後一戰、回宮、開爐的化解版：寫在開爐那頁黃曆的「昨日」（第三天白天的後面） */
export const MISSED_FINALE4: Record<string, string> = {
  /** F-1 茫渡的證據白天都沒拿到（對岸的火光） */
  ferry: '茫渡以前的事，你們手上只有黃曆那一段。對岸香擔的火光亮了一下，牠看著那邊，自己開口：「以前我聽到鈴就把船靠過去。」',
  /** F-3 人鏈一段都沒有（燈） */
  chain: '沒有人下水牽人。堤防上的人把手機的燈全部打開，橋上的燈也跟著亮，一路亮到對岸那一點粉紅色。水裡的人說，看得到燈就不會怕。',
  /** F-4 有人往霧裡走，沒喊名（風和旗） */
  huming: '被叫走的那個人，沒有人喊他的名字。他往下游走了幾步，手上的進香旗被風吹得一直響，他低頭看，旗尾指的是對岸，就自己轉回來了。',
  /** F-5 審問沒問完就下判決（別人補上） */
  rounds: '茫渡是誰，你們沒有問到底。天亮的時候，橋上有個很老的聲音往下喊了一句「撐船的」，茫渡回頭看了很久。押尾：「有人認得牠。牠的名字我晚一點去問那個人。」',
  /** F-6 沒斬茫渡（轎子等人）：喚回 */
  noSlay: '前哨的刀沒有出鞘。霧自己退到下游，茫渡把斗笠戴正，走到隊伍前面帶路。對岸粉紅色的轎頂等到隊尾都上岸才動。',
  /** F-6 送回：文件備註「第二句換成『牠撐了最後一篙，船頭碰到了岸』」 */
  noSlayReturn: '前哨的刀沒有出鞘。茫渡撐了最後一篙，船頭碰到了岸。對岸粉紅色的轎頂等到隊尾都上岸才動。',
  /** E-1 一路上幾乎都沒做（鞭炮和布幔） */
  almostNone: '你們這一路大多是跟著轎子走。回宮的鞭炮照樣從廟口炸到海堤，開爐那天布幔拉開，殿裡抬頭的人一個都沒少。押尾：「我們沒幫到的人，名字我都有記下來。媽祖那邊應該也有記一本。」',
};

/** E-1「幾乎都沒做」：做了的事（rewards4）＋幫過的信徒（helped4）合起來不超過這個數 */
export const ALMOST_NONE4 = 1;

/** 最後一戰的結果（BossScene 的 BossBattle 讀出來的；測試可以直接給） */
export type FinaleResult4 = {
  kind: 'recall' | 'return' | 'slay';
  /** 陣前審問三輪各自有沒有說動（1～3） */
  asked: Record<number, boolean>;
  /** 被叫走、沒人喊名也沒人鏈牽，自己走回來的人 */
  walkedBack: string[];
};

/** 最後一戰、回宮、開爐漏掉的（照文件順序） */
export function finaleMissed4(res: FinaleResult4, done: { knowsFerry: boolean; chain: number; rewards: number; helped: number }): string[] {
  const out: string[] = [];
  if (!done.knowsFerry) out.push(MISSED_FINALE4.ferry);
  if (done.chain <= 0) out.push(MISSED_FINALE4.chain);
  if (res.walkedBack.length) out.push(MISSED_FINALE4.huming);
  // 斬了的話牠已經不在，押尾那句在 mangduSlay4 裡講過
  if (res.kind !== 'slay' && ![1, 2, 3].every((n) => res.asked[n])) out.push(MISSED_FINALE4.rounds);
  if (res.kind === 'recall') out.push(MISSED_FINALE4.noSlay);
  if (res.kind === 'return') out.push(MISSED_FINALE4.noSlayReturn);
  if (done.rewards + done.helped <= ALMOST_NONE4) out.push(MISSED_FINALE4.almostNone);
  return out;
}

// ======================================================================
// 第 C 步：jump scare（全章 2 次；文件第 3 節「jump scare 兩次的做法」）。
// 畫面在 ui/scare4.ts；這裡只放觸發條件、時間、字。每次的畫面 < 2 秒、點一下或按任何鍵馬上跳過、
// 一局最多各一次（flags）、不擋流程、不改任何數值。
// ======================================================================

/** 播過就記在 run.flags（一局最多一次） */
export const SCARE_FLAG4 = { apo: 'scared_apo4', tideng: 'scared_tideng4' } as const;

/** 每次 jump scare 的畫面最長多久（毫秒；不含之後的台詞） */
export const SCARE_MAX_MS4 = 2000;

/**
 * N1-4 阿婆（毫秒，依序）：畫面先暗半拍 → 大白臉（停半秒）→ 退回正常大小、換成笑 → 背景亮回來、舊灶冒白煙。
 * 文件寫「配一聲短的鑼」：遊戲目前沒有音效系統，先不放（之後有了接在 face 開始那一下）。
 */
export const SCARE_APO4 = { dark: 150, face: 500, shrink: 350, clear: 400 } as const;

/** 3-13 提燈的（毫秒，依序）：霧蓋上來 → 全暗 → 停一拍 → 「啪」燈亮、臉貼著鏡頭 → 他往後縮 → 燈晃 → 光暈散成堤防上一排手機燈 */
export const SCARE_TIDENG4 = { fog: 250, black: 150, beat: 300, snap: 60, flinch: 200, sway: 300, fade: 400 } as const;

/** 一段 jump scare 的畫面總長 */
export const scareMs4 = (t: Readonly<Record<string, number>>): number => Object.values(t).reduce((a, b) => a + b, 0);

/** N1-4 jump scare 版（嚇完播；臉那一句是畫面，不寫成字） */
export const APO_SCARE_LINE4 = '點心擔阿婆：「粥滾了，都沒人叫我。」她自己笑到拍大腿，順手摸到後面的灶台，說原來她的灶在這裡，難怪她找無門。';

/** 3-13 漏掉版（mangdu4 起霧以後；燈亮那一句是畫面，不寫成字） */
export const TIDENG_SCARE4 = {
  say: '哇，亮了。歹勢，沒油幾十年突然會亮，我比你們還驚。',
  after: '他笑到手上的燈一直晃，說今天晚上水門這邊他來幫忙照。',
} as const;

/**
 * N1-4：第一夜問歸處，判完阿婆（哪一種判決都算）、她還有真相沒對出來，回到列表的那一下。
 * 白天沒請她（沒有 run.cases.apo）不會觸發；一局一次。
 */
export function shouldScareApo4(r: RunState, id: string, st: { truths: number[] } | undefined, night: number): boolean {
  if (id !== 'apo' || night !== 1 || !st || r.flags[SCARE_FLAG4.apo]) return false;
  return new Set(st.truths).size < CASES4.apo.truths.length;
}

/** 3-13 的漏掉版要不要播（mangdu4 那兩句的 when）：第三天沒帶提燈的（同 cases.ts 的 carried3） */
export const tidengMissed4 = (r: RunState): boolean => !r.held.some((h) => h.id === 'tideng');

/** 3-13：最後一戰開場起霧以後，沒帶提燈的才嚇；一局一次 */
export function shouldScareTideng4(r: RunState): boolean {
  return tidengMissed4(r) && !r.flags[SCARE_FLAG4.tideng];
}
