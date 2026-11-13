// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章的信徒（_agent/ch4-baishatun-plan.md §7「信徒五位」）：阿滿姨、阿睿（跟轎台義工；第一章已有阿哲，代號改 arui）、
 * 賢仔、秀枝、阿翰。序章黃曆、擲筊、因果簿、信徒錄。
 *
 * 第一天的字照 _agent/ch4-text-day1.md 第 1、4、6 節（作者尚未定稿）。第二、三天的卡、信徒錄是（待寫）暫代（第 A 輪）。
 * 選項的花費（時辰、稟報、點心站）是規則，換字時不要動。
 */
import type { RunState } from '../../state';
import { gainEvidence } from '../../state';
import type { Almanac, Card, Epitaph, LedgerLine, Option } from '../believers';


export function newBelievers4(): Record<string, string> {
  return { aman: 'unmet', arui: 'unmet', xianzai: 'unmet', xiuzhi: 'unmet', ahan: 'unmet' };
}

// ---------- 序章（1-1、1-2） ----------
export const PROLOGUE4: Almanac = {
  lunar: '十二月十五', yi: '擲筊　擇日', ji: '問路',
  source: '白砂墩拱辰宮誌・卷一',
  text: '白砂墩在海邊，風吹來的白沙堆成一座一座丘。庄裡討海的人供媽祖，還沒蓋廟就年年走路去北津進香。\n哪一天出門，用擲筊問。走哪條路、在哪裡過夜，沒有人知道，到了路口看轎子。',
};

/** 擲筊三次擇日：擲到聖筊為止（笑杯、陰杯重擲），三個聖筊日子才定 */
export const PROLOGUE_JIAO4 = {
  ask: '今年往北津進香，三月初五深夜起駕，可否？',
  times: 3,
  holy: { text: '聖筊' },
  laugh: { text: '笑筊。爐主把日子從頭再念一遍，重擲。' },
  yin: { text: '陰筊。爐主跪好，整了整衣服，再問一次。' },
  allHoly: { text: '三聖筊。日子定了。' },
  done: '三月初二放頭旗，初五深夜起駕。往哪條路走，到時候看轎子。',
  lines: [
    '值年爐主跪在殿前，筊落地。一正一反，聖筊。殿裡沒有人出聲。',
    '阿滿姨：「第二個了。」',
    '聖筊。三個。殿外有人等不及，先放了一串鞭炮。',
  ],
};

const done = (r: RunState, id: string, s: string) => { r.b[id] = s; };

// ---------- 稟報（第 6 節） ----------
/** 稟報之後（三位共用） */
const REPORTED = '你在轎前把事情講完。轎子照常往前走。\n押尾：「報了。接下來用跟的。」';

/**
 * 稟報：把一個人的事報到轎前（用掉一次稟報）。稟報不等於辦成。
 * 轎子停不停由內容決定（不是亂數）：第一天三位都是「照常往前走」；後面兩天轎子的路會不會靠近他，之後的內容再依 follow.reports 決定。
 */
function reportOpt(key: string, who: string, result: string): Option {
  return {
    label: '稟報', hours: 0, result,
    report: { key, stops: () => false, stop: REPORTED, pass: REPORTED },
    apply: (s) => { done(s, who, 'reported'); return ''; },
  };
}

/** 第二、三天的稟報（暫代）：不改信徒的狀態（第一天的狀態留給因果簿、信徒錄），只記辦過 */
function stubReport(key: string, result: string): Option {
  return {
    label: '稟報', hours: 0, result,
    report: { key, stops: () => false, stop: REPORTED, pass: REPORTED },
    apply: (s) => { s.flags[`done_${key}`] = true; return ''; },
  };
}

/**
 * 第二天起的卡：辦過（或稟報過）一次就不再出現（flags.done_<卡>）。
 * believer：辦成記 flags.helped_<信徒>（最後一戰人鏈：幫過的信徒會下水牽人）；ledger：因果簿用哪一種寫法（LEDGER4_2）。
 */
function did(s: RunState, id: string, believer = '', ledger = ''): void {
  s.flags[`done_${id}`] = true;
  if (believer) s.flags[`helped_${believer}`] = true;
  if (ledger) s.flags[`ledger_${id}_${ledger}`] = true;
}

/**
 * 第二天的稟報（5-6）：不改信徒第一天的狀態，只記辦過。stops：轎子會不會因此有動作（秀枝：入廟第三退退到巷口）。
 * extra：稟報之後另外要記的（秀枝：沒辦結果照播、因果簿換寫法）。
 */
function report2(key: string, result: string, text: string, extra?: (s: RunState) => void, stops = false): Option {
  return {
    label: '稟報', hours: 0, result,
    report: { key, stops: () => stops, stop: text, pass: text },
    apply: (s) => { s.flags[`done_${key}`] = true; extra?.(s); return ''; },
  };
}

/** 第二天阿滿姨趕上入廟了沒（入廟三進三退那句換不換） */
export const amanAtTemple = (r: RunState): boolean => !!r.flags.ledger_aman2_ok;
/** 第二天稟報過秀枝（入廟第三退多四句） */
export const xiuzhiReported = (r: RunState): boolean => r.follow?.reports.xiuzhi2 !== undefined;

/**
 * 沒辦結果（略過那張卡之後，天亮「昨日」寫的事；見 days.ts 的 dawn4：卡片 id 尾巴的數字＝第幾天）。
 * 第三天的是暫代（還沒有作者的字）。
 */
export const MISSED4: Record<string, string> = {
  aman1: '阿滿姨天黑才走到省道。她在一間雜貨店的騎樓坐了一夜。',
  arui1: '傍晚阿睿的手機剩百分之三。他蹲在車行牆邊，跟賢仔借延長線。',
  xianzai1: '賢仔搬椅子、接水管、指廁所，忙到半夜。扳手一直插在褲子後面的口袋。',
  xiuzhi1: '路燈下那台輪椅，天還沒亮就先出發了。她怕跟不上。',
  ahan1: '阿翰把襪子直接套回去，縮在騎樓的柱子邊。訊息還停在輸入框裡。',
  // 第二天（ch4-text-day2.md 第 5、6 節「沒辦結果」）
  aman2: '阿滿姨到廟埕的時候，轎子已經進去了。她在最外面那一圈合掌，站到人散。',
  arui2: '阿嬤在派出所裡坐到晚上。阿睿收工才聽說，他說他下午就站在她旁邊。',
  xianzai2: '賢仔在車邊等到半夜。還有六個背包沒人領，他把車斗的帆布蓋上，睡在駕駛座。',
  xiuzhi2: '轎子動起來的時候，人潮把巷口整個塞住。秀枝彎著身體護在輪椅前面，一直到人散。她阿母的毯子掉了，是後來一個小孩撿回來的。',
  ahan2: '阿翰想了太久，後座被一個阿伯坐走了。他坐在路邊的護欄上，等到隊尾走過才站起來。',
  shoes2: '兩個女生在下一個路口坐上客運。新球鞋提在手上，一路提到車站。',
  heat2: '檳榔攤的老闆娘後來叫了車，把他送去診所吊點滴。他朋友到北津才發現少一個人。',
  sick2a: '轎子進廟的時候，她在人潮最後面，把那件襯衫舉過頭。舉到手痠，換手再舉。',
  sick2b: '阿公抱著她站在街角的機車上面看。只看到很多人的頭，還有很遠的一點粉紅色。小女孩說有看到。',
  flag2: '後來是一個路過的國小老師幫他穿的線。阿伯到北津的時候，旗上多了一塊補丁。',
  rice2: '阿姨把剩下的油飯分裝，載去北津的廟埕發。發到晚上八點。',
  xiuzhi3: '（待寫）沒陪秀枝的話，第三天她們怎麼了。',
};

export const CARDS4: Record<string, (r: RunState) => Card | null> = {
  /** 4-1 阿滿姨：第一天甲路（防風林老路・土地公廟前） */
  aman1: (r) => r.b.aman === 'unmet' ? {
    who: '阿滿姨',
    text: '阿滿姨坐在土地公廟的石階上揉膝蓋。網袋裡插著兩支進香旗，一支舊的，一支小的。「走了三十年，今年這支腳不聽話。你們先走，我慢慢跟。」\n她膝蓋腫了。照這個速度，天黑前走不到駐駕的地方。',
    deadline: '今天',
    options: [
      {
        label: '派押尾陪她走', hours: 1, result: '她今晚到得了駐駕的地方',
        apply: (s) => { done(s, 'aman', 'walked'); return '阿滿姨走得很慢，一步都沒停。她回頭看了兩次，後面沒有人。「奇怪，今天風都從背後推。」'; },
      },
      {
        label: '陪她走，聽她講老路的事', hours: 2, gives: ['aman_lukou'], result: '她今晚到得了；也說了以前站在路口的那個人',
        apply: (s) => {
          done(s, 'aman', 'told');
          gainEvidence('aman_lukou');
          return '「這支小的是我女兒的。說好出嫁前跟我走一趟，那年沒走成。」阿滿姨把小旗插好。「以前這個路口有個討海的，年年站著看轎子過，說明年就跟。講了幾十年。」';
        },
      },
      {
        label: '託茶水攤留她坐一下', hours: 0, stall: '茶水攤', result: '她休息夠了自己跟上，會晚一點到',
        apply: (s) => { done(s, 'aman', 'rested'); return '茶水攤的阿伯搬了一張椅子出來：「阿滿，坐。藥布我有。」她坐了一刻鐘，自己站起來走了。'; },
      },
      reportOpt('aman1', 'aman', '把阿滿姨的膝蓋報到轎前。媽祖會知道；轎子等不等她，不保證。'),
    ],
    ignore: '她今晚跟不到駐駕的地方，明天要從隊尾找她',
    missed: MISSED4.aman1,
  } : null,
  /** 4-2 阿睿：跟轎台的義工（pre・海線小路）。辦了才有岔路線索二 */
  arui1: (r) => r.b.arui === 'unmet' ? {
    who: '阿睿',
    text: '跟轎台的義工阿睿舉著自拍棒倒退走，眼睛只看螢幕。「線上四百了！粉紅快轎今年走海線，各位分享出去！」他背包拉鍊沒拉，行動電源掉在後面的沙地上。\n行動電源掉了他不知道。沒電的話，傍晚跟轎台就斷線。',
    options: [
      {
        label: '派押尾撿回去塞好', hours: 1, result: '他的電撐得到晚上；他會念一則聊天室留言（岔路的線索）',
        apply: (s) => {
          done(s, 'arui', 'helped');
          s.flags.clue_arui = true;
          return '行動電源回到背包側袋，拉鍊也拉上了。阿睿摸了一下：「咦，我放這邊嗎？」他低頭念留言：「有阿伯說，老路口的茶水攤昨晚就擺了。真的假的？」';
        },
      },
    ],
    ignore: '少一條岔路的線索；傍晚他要到處借插座',
    missed: MISSED4.arui1,
  } : null,
  /** 3-2 事件三：賣蚵嗲的阿桑（通汐街上）。花 1 時辰，得到岔路線索三 */
  oajian1: (r) => r.flags.clue_oajian ? null : {
    who: '賣蚵嗲的阿桑',
    text: '街邊的阿桑一邊翻蚵嗲，一邊伸長脖子看隊伍往哪邊走。',
    options: [
      {
        // ch4-text-fixes.md 第 1 節：兵馬凡人看不見，寫成「聽她跟客人講」
        label: '聽她跟客人講', hours: 1, result: '聽得到前面兩條路的狀況（岔路的線索）',
        apply: (s) => {
          s.flags.clue_oajian = true;
          return [
            '一個香燈腳停下來買蚵嗲。阿桑手沒停，嘴巴也沒停。',
            '賣蚵嗲的阿桑：「前面街尾分兩條。外環今年在挖水溝，車擠成一線。」',
            '賣蚵嗲的阿桑：「老路口那攤茶水，昨晚就擺出來了。阿滿每年都走那條。」',
            '賣蚵嗲的阿桑：「轎子往哪走我不敢講。我只知道有人在那邊等。」',
            '她多夾了一塊進袋子，沒有算錢。',
          ].join('\n');
        },
      },
    ],
    ignore: '聽不到她講前面那兩條路（少一條岔路的線索）',
  },
  /** 4-3 賢仔：臨時轉進的車行（停駕點） */
  xianzai1: (r) => r.b.xianzai === 'unmet' ? {
    who: '賢仔',
    text: '轎子停在車行正中間。老闆賢仔手上還拿著扳手，鐵門上那張「頂讓」被人擠歪了。門口的人越來越多，要廁所、要水、要插座。「我這間下個月要收了欸。怎麼會挑這裡？」\n門口擠成一團，賢仔一個人顧不來。',
    deadline: '今天',
    options: [
      {
        label: '派前哨把門口的人順成兩排', hours: 1, gives: ['xian_land'], result: '門口不擠了；賢仔有空講這塊地的來歷',
        apply: (s) => {
          done(s, 'xianzai', 'told');
          gainEvidence('xian_land');
          return '沒有人指揮，門口自己排成了兩排。賢仔總算坐下來喝水：「這塊地是我阿爸跟一個阿婆的後生買的。後面那口灶，他交代不能打。」';
        },
      },
      {
        label: '順好門口，再聽他講阿爸交代的事', hours: 2, gives: ['xian_land', 'stove'], result: '這塊地的來歷之外，他會帶人去看後面的舊灶',
        apply: (s) => {
          done(s, 'xianzai', 'showed');
          gainEvidence('xian_land');
          gainEvidence('stove');
          return [
            '沒有人指揮，門口自己排成了兩排。賢仔總算坐下來喝水：「這塊地是我阿爸跟一個阿婆的後生買的。後面那口灶，他交代不能打。」',
            '「我阿爸還說，進香那幾天鐵門不要全拉下來。我問為什麼，他說人家以前都在這裡吃粥。」賢仔搬開兩顆輪胎，後面是一口磚砌的舊灶。',
          ].join('\n');
        },
      },
    ],
    ignore: '他會忙到半夜，沒空講這塊地的事（今晚少一條證詞）',
    missed: MISSED4.xianzai1,
  } : null,
  /** 4-4 秀枝：隊伍最後到的輪椅（post・車行對面）。只短短出現 */
  xiuzhi1: (r) => r.b.xiuzhi === 'unmet' ? {
    who: '秀枝',
    text: '隊伍最後到的是一台輪椅。推的人叫秀枝，輪椅上的阿母蓋著毯子睡著了。車行門口都是人，她停在對面的路燈下，沒有過馬路。「阿母，轎子在那裡面。我們在這邊看就好。」\n明天人會變多。走在最後面的人，最容易被漏掉。',
    options: [
      {
        label: '讓押尾記下她', hours: 1, result: '明天不用花時辰，就找得到她',
        apply: (s) => { done(s, 'xiuzhi', 'noted'); return '押尾在輪椅旁邊站了一下。秀枝把阿母的毯子往上拉，覺得風小了一點。\n押尾：「秀枝。輪椅上是她阿母。記了。」'; },
      },
      reportOpt('xiuzhi1', 'xiuzhi', '把秀枝和她阿母報到轎前。媽祖會知道；轎子會不會往隊尾去，不保證。'),
    ],
    ignore: '明天人多，要先花 1 時辰才找得到她',
    missed: MISSED4.xiuzhi1,
  } : null,
  /** 4-5 阿翰：下個月入伍（post・車行旁的騎樓） */
  ahan1: (r) => r.b.ahan === 'unmet' ? {
    who: '阿翰',
    text: '騎樓下，戴著新帽子的年輕人脫了鞋，腳底兩個水泡。手機上一則訊息打好了，還沒送：「阿公，我想回去了。」\n水泡他不會處理。這樣放著，明天走不到中午。',
    deadline: '今晚',
    options: [
      {
        label: '起一陣風，讓隔壁的阿伯看到他的腳', hours: 1, result: '有人教他包腳，明天他走得動',
        apply: (s) => { done(s, 'ahan', 'wrapped'); return '阿翰的進香旗啪一聲打在隔壁的睡袋上。阿伯轉頭看了一眼：「少年仔，水泡不能這樣放。腳伸過來。」那則訊息他沒有送出去。'; },
      },
      {
        label: '讓阿伯幫他包腳，再聽他們聊', hours: 2, gives: ['ahan_rule'], result: '他明天走得動；也說了阿公交代的規矩',
        apply: (s) => {
          done(s, 'ahan', 'told');
          gainEvidence('ahan_rule');
          return [
            '阿翰的進香旗啪一聲打在隔壁的睡袋上。阿伯轉頭看了一眼：「少年仔，水泡不能這樣放。腳伸過來。」那則訊息他沒有送出去。',
            '「我下個月入伍。阿公說先來許願，平安回來再走一趟答謝。」阿翰看著包好的腳。「他說他們那一輩有人許了沒還，拖到走不動。叫我不要學。」',
          ].join('\n');
        },
      },
      reportOpt('ahan1', 'ahan', '把阿翰想回家的事報到轎前。媽祖會知道；他明天走不走得下去，不保證。'),
    ],
    ignore: '明天他的腳會更痛，中午前就想找車坐',
    missed: MISSED4.ahan1,
  } : null,
  // ---------- 第二天（字照 _agent/ch4-text-day2.md 第 5、6 節；花費、稟報、給的證據、點心站是規則） ----------
  /** 5-5 阿翰（pre・省道慢車道）：賢仔在這張卡裡先露面。選項三給岔路線索三 */
  ahan2: (r) => r.flags.done_ahan2 ? null : {
    who: '阿翰',
    text: `一台小貨車開在隊伍旁邊，開得比人走路還慢。車斗擋板貼著一張紙板：「累了請上車」。阿翰盯著那張紙板走了兩百公尺。車窗搖下來，是賢仔。「少年仔，腳在拖了喔。後座還有一個位。」${['wrapped', 'told'].includes(r.b.ahan) ? '' : '阿翰的襪子後跟滲了一塊紅的。'}\n他想上車。阿公交代的是「走一趟」，坐車算不算，他不敢問。`,
    options: [
      {
        label: '不攔他，讓他上車', hours: 0, result: '他今天到得了北津。這一段路他是坐車的；賢仔的車今天不能再載別人',
        apply: (s) => { did(s, 'ahan2', '', 'ride'); return '阿翰爬上後座，鞋一脫就睡著了。到北津街口他醒來，下車，回頭看了一眼來的那條路。'; },
      },
      {
        label: '派押尾走在他旁邊', hours: 1, result: '他自己走到北津；背包可以放車上',
        apply: (s) => { did(s, 'ahan2', 'ahan', 'walk'); return '阿翰的手都搭上車門了，又放下來。「老闆，背包可以幫我載嗎？人不用。」賢仔：「背包丟後面。你確定？還有十幾公里喔。」「……確定啦。應該。」'; },
      },
      {
        label: '陪他走，聽賢仔在車上跟他聊', hours: 2, result: '他自己走到北津；賢仔會講他阿爸說的北津（岔路的線索）',
        apply: (s) => {
          did(s, 'ahan2', 'ahan', 'walk');
          s.flags.clue_xian2 = true;
          return '背包上了車，人沒上。賢仔把車開在他旁邊，一路陪他講話。「我阿爸年輕的時候也走過。他說以前進北津沒有橋可以走。」阿翰：「那怎麼過去？」賢仔：「我哪知道，我是修車的。」';
        },
      },
      report2('ahan2', '把阿翰的事報到轎前。（媽祖會知道；轎子會不會為他停，不保證。）',
        '你在轎前把事情講完。轎子照常往前走，沒有慢下來。\n押尾：「報了。上不上車，還是他自己的腳在決定。」\n阿翰把手機拿出來又收回去，跟著貨車旁邊繼續走。走到哪裡，現在還不知道。'),
    ],
    ignore: '他會自己決定，可是那個位子不會等他',
    missed: MISSED4.ahan2,
  },
  /** 5-1 阿滿姨（乙路・水圳邊的石階）。選項二給證詞「阿滿姨的話（洗腳的地方）」 */
  aman2: (r) => r.flags.done_aman2 ? null : {
    who: '阿滿姨',
    text: `${['walked', 'told', 'rested'].includes(r.b.aman)
      ? '阿滿姨坐在水圳邊的石階上，鞋脫在旁邊，腳泡在水裡。那支小旗插在網袋口。隊伍一直從她後面過，她沒有回頭。「你們先走。我每年都在這裡坐一下。」'
      : '阿滿姨坐在水圳邊的石階上，鞋脫在旁邊。昨晚她在騎樓坐到天亮，今天是搭人家的便車趕上來的。「車坐到這裡就好。這一段我要自己走。」'}\n隊伍快過完了，她還坐著。再晚，入廟的時候她擠不進廟埕。`,
    deadline: '今天',
    options: [
      {
        label: '派押尾在旁邊等她', hours: 1, result: '她趕得上入廟',
        apply: (s) => { did(s, 'aman2', 'aman', 'ok'); return '阿滿姨又坐了一下，往舊街那頭看了兩次。然後她把腳擦乾，穿鞋，站起來。「好，沒有就沒有。走。」'; },
      },
      {
        label: '等她，聽她講為什麼坐這裡', hours: 2, gives: ['aman_zun'], result: '她趕得上入廟；也說了那年的事',
        apply: (s) => {
          did(s, 'aman2', 'aman', 'ok');
          gainEvidence('aman_zun');
          return '「那年她說喜餅還沒訂，叫我先走，她坐車來會合。我跟她約這裡。」阿滿姨把小旗扶正。「我在這個石階等到天黑。後來每年走到這裡，都會坐一下。」';
        },
      },
      report2('aman2', '把阿滿姨在圳邊等人的事報到轎前。媽祖會知道；她等的人來不來，不保證。',
        '你在轎前把事情講完。轎子照常往前走。\n押尾：「報了。她還坐在那裡。」'),
    ],
    ignore: '她會坐到隊伍走完，入廟的時候人在廟埕外面',
    missed: MISSED4.aman2,
  },
  /** 5-2 阿睿（停駕點・北津派出所前）。選項二給證詞「阿睿的回放（一直回頭的人）」 */
  arui2: (r) => r.flags.done_arui2 ? null : {
    who: '阿睿',
    text: '阿睿爬上變電箱旁的花台架手機。「線上三萬二！等一下三進三退，這個角度最好。」他腳邊站著一個阿嬤，捏著一張寫了電話的紙條，嘴巴一直在動，沒有人聽她講。\n阿嬤跟孫子走散了，紙條上的電話打不通。阿睿離她最近，可是他只看螢幕。',
    options: [
      {
        label: '起一陣風，把阿嬤的紙條吹到他鏡頭前', hours: 1, result: '他會用跟轎台幫阿嬤找人',
        apply: (s) => { did(s, 'arui2', 'arui', 'ok'); return '紙條貼在鏡頭上。阿睿拿下來，才看到旁邊有人。「阿嬤，妳找誰？……各位，幫忙一下，有沒有人認識這位阿嬤？」三分鐘後，一個國中生從街尾跑過來。'; },
      },
      {
        label: '讓他幫完阿嬤，再聽他念聊天室', hours: 2, gives: ['arui_replay'], result: '阿嬤找得到孫子；他會講回放裡一件怪事',
        apply: (s) => {
          did(s, 'arui2', 'arui', 'ok');
          gainEvidence('arui_replay');
          return '阿睿把阿嬤交給孫子，低頭滑留言。「有人問，那個揹紅背包的大哥怎麼一直回頭。」他把畫面倒回去看。「真的欸。他後面明明沒人。」';
        },
      },
    ],
    ignore: '阿嬤要等到入廟以後才找得到孫子',
    missed: MISSED4.arui2,
  },
  /** 5-3 賢仔（post・北津街上的管制線外）。選項二給證詞「賢仔的話（不肯上車的人）」 */
  xianzai2: (r) => r.flags.done_xianzai2 ? null : {
    who: '賢仔',
    text: '賢仔的小貨車停在管制線外面，進不去。車斗上二十幾個背包，都是路上幫人載的。他站在車邊喊：「背包的來領喔！藍色那個誰的？」街上太吵，沒有人聽到。賢仔：「店反正要收了，車放著也是放著。我就開出來了。」\n背包的主人不知道車停在哪。入廟以前領不到，今晚他們沒有睡袋。',
    deadline: '今天',
    options: [
      {
        label: '派前哨把他那張紙板吹到管制線的柵欄上', hours: 1, result: '背包的主人找得到車',
        apply: (s) => { did(s, 'xianzai2', 'xianzai', 'ok'); return '「累了請上車」的紙板卡在柵欄上，背面賢仔補了一行「背包在這」。來領的人排了一排。有人塞飲料給他，他一直說不用。'; },
      },
      {
        label: '讓人來領背包，再聽他講今天載了誰', hours: 2, gives: ['xian_truck'], result: '背包領得完；他會講一個不肯上車的人',
        apply: (s) => {
          did(s, 'xianzai2', 'xianzai', 'ok');
          gainEvidence('xian_truck');
          return '賢仔數著剩下的背包。「今天有個揹紅背包的，腳都磨破了，叫他上車他不要。」他把車斗的擋板扣好。「他說他不能坐車，他這趟是來還的。」';
        },
      },
    ],
    ignore: '有十幾個人今晚找不到背包；賢仔沒空講路上的事',
    missed: MISSED4.xianzai2,
  },
  /** 5-4 秀枝（post・廟埕外的巷口）。第一天沒讓押尾記下：每個選項多 1 時辰。稟報會讓入廟第三退多四句（stops） */
  xiuzhi2: (r) => {
    if (r.flags.done_xiuzhi2) return null;
    const lost = r.b.xiuzhi !== 'noted';
    return {
      who: '秀枝',
      text: `${lost ? '押尾在人堆裡找了很久，才在巷口找到那台輪椅。' : ''}廟埕前面的街全是人。秀枝的輪椅被擠到巷口，前輪卡在水溝蓋的縫裡。她試了兩次推不動，就把煞車拉起來。「阿母，這裡看得到廟的屋頂。這裡就好。」\n輪子卡住了，她不好意思叫人。等一下轎子動起來，巷口這裡會被人潮擠到。`,
      deadline: '入廟以前',
      options: [
        {
          label: '派押尾擋出一點空位，讓旁邊的人看到輪子', hours: lost ? 2 : 1, result: '有人幫她把輪椅抬出來，移到騎樓下',
          apply: (s) => { did(s, 'xiuzhi2', 'xiuzhi', 'ok'); return '人潮在輪椅旁邊空出一小塊。兩個年輕人低頭看到卡住的輪子。「阿姨，這個我們抬。一、二、三。」輪椅移到了騎樓的柱子後面。秀枝說了五次謝謝。'; },
        },
        // 5-6：稟報不等於辦成——輪子還是卡著，沒辦結果照播（missed），因果簿換成「轎子退到她前面三步」
        report2('xiuzhi2', '把秀枝和她阿母報到轎前。媽祖會知道；轎子會不會往巷口去，不保證。',
          '你在轎前把事情講完。轎子還停在派出所前，沒有動。\n押尾：「報了。接下來用跟的。」',
          (s) => { s.flags.ledger_xiuzhi2_reported = true; s.flags.missed_xiuzhi2 = true; }, true),
      ],
      ignore: '入廟的時候她們會被擠在巷口，什麼都看不到',
      missed: MISSED4.xiuzhi2,
    };
  },
  // 6-1 拍了車行過夜 → 看熱鬧的年輕人：兩件小事（可以託社團的冬瓜茶攤，一段路只能顧一件）
  shoes2: (r) => r.flags.done_shoes2 ? null : {
    who: '穿新鞋的女生',
    text: '「我以為走路穿新鞋比較好走。」她把鞋子提在手上，打算穿襪子走。朋友在滑手機查最近的車站。\n穿襪子走省道，走不到一公里。她們再五分鐘就要放棄去坐車了。',
    options: [
      {
        label: '派押尾把路過的阿姨引過來', hours: 1, result: '有人教她墊腳跟，她走得到北津',
        apply: (s) => { did(s, 'shoes2'); return '一個阿姨走過去又折回來。「妹妹，鞋帶放鬆，後面墊這個。」她從網袋裡掏出兩片衛生棉。兩個女生愣了一下，然後笑到站不起來。墊好以後，真的能走。'; },
      },
      {
        label: '託冬瓜茶攤', hours: 0, stall: '社團的冬瓜茶攤', result: '攤子上有人借她一雙拖鞋',
        apply: (s) => { did(s, 'shoes2'); return '擺攤的學生把自己的拖鞋脫下來。「我在這邊顧攤又不用走。妳穿去，到北津再還我。」他後來是穿襪子收攤的。'; },
      },
    ],
    ignore: '她們今天走不到北津',
    missed: MISSED4.shoes2,
  },
  heat2: (r) => r.flags.done_heat2 ? null : {
    who: '沒戴帽子的男生',
    text: '他早上沒吃，水也沒帶，一路拿手機拍。現在蹲著起不來，手還在抖。同行的朋友已經走到前面去了。「我沒事，蹲一下就好。」\n他中暑了。醫療車在前面五百公尺，他自己走不過去。',
    options: [
      {
        label: '派前哨跑去醫療車那邊，把護理師的帽子吹回來這個方向', hours: 1, result: '醫護會發現他',
        apply: (s) => { did(s, 'heat2'); return '護理師追帽子追到檳榔攤前，看到蹲著的人。「同學，手給我。……你這個不能再走了，上車吹冷氣。」他被扶上醫療車，還在問手機有沒有拿。'; },
      },
      {
        label: '託冬瓜茶攤', hours: 0, stall: '社團的冬瓜茶攤', result: '攤子上的人會扶他去陰影下，餵他喝水',
        apply: (s) => { did(s, 'heat2'); return '擺攤的學生跑過來兩個。「欸他嘴唇是白的。冰塊，冰塊拿來。」他們把他架到樹下，一個搧風，一個打電話叫醫療車。'; },
      },
    ],
    ignore: '他會蹲到隊伍走完，今天到不了北津',
    missed: MISSED4.heat2,
  },
  // 6-2 拍了秀枝推輪椅 → 帶病人來求的家屬：兩件很難辦的事（各 2 時辰，沒有可以託的攤；不寫病好不好）
  sick2a: (r) => r.flags.done_sick2a ? null : {
    who: '拿著襯衫的太太',
    text: '「我先生在醫院，人不能來。護理站說衣服可以帶。」她昨晚看到直播，今天一早從南部坐車上來。前面是幾千人的背，她擠了三次都被擠出來。\n她想捧著那件襯衫鑽一次轎腳。等一下會不會開放、排不排得到，都不一定。',
    deadline: '入廟以前',
    options: [
      {
        label: '派前哨一路順人，把她送到工作人員旁邊', hours: 2, result: '她問得到在哪裡排；排不排得到，看今天有沒有開放',
        apply: (s) => { did(s, 'sick2a', '', 'ok'); return '她前面的人一個一個剛好側身。她擠到穿背心的工作人員旁邊。「阿姨，要鑽轎腳的排這邊，衣服捧好，跪低。」轎子起來的時候，她捧著襯衫跪在那一排裡。轎子從上面過去了。\n她站起來，把襯衫重新摺好，摺了很久。'; },
      },
    ],
    ignore: '她擠不到前面，只能在最後面舉著襯衫',
    missed: MISSED4.sick2a,
  },
  sick2b: (r) => r.flags.done_sick2b ? null : {
    who: '牽孫女的阿公',
    text: '「醫生說她現在不能去人多的地方。她說想看粉紅色的轎子，看一眼就好。」阿公不敢往前，小女孩一直問轎子會不會從這邊過。阿公答不出來。\n轎子等一下走哪一邊，沒有人知道。要找一個人少、又可能看得到的位置。',
    deadline: '入廟以前',
    options: [
      {
        label: '派前哨把兩邊街口都跑一遍，再把藥局的門吹開', hours: 2, result: '她有地方坐著等；轎子會不會經過，不保證',
        apply: (s) => { did(s, 'sick2b', '', 'ok'); return '藥局的玻璃門自己開了。老闆探頭看到一老一小。「阿伯，帶囡仔進來坐，裡面有冷氣。隔著玻璃看比較安全。」\n轎子入廟前繞了半條街，粉紅色的轎頂從玻璃門外面過去。小女孩把手貼在玻璃上，貼到轎子看不見。'; },
      },
    ],
    ignore: '阿公會帶她站在最遠的街角，可能什麼都看不到',
    missed: MISSED4.sick2b,
  },
  // 6-3 什麼都不拍 → 沒有多的人：兩件可辦可不辦的小事（不辦沒有遺憾，只是少一點東西）
  flag2: (r) => r.flags.done_flag2 ? null : {
    who: '補旗的阿伯',
    text: '他的旗被路邊的鐵絲勾破一個洞。「今年人沒有比去年多，走起來剛好。」他老花眼鏡掉在路上了，針穿了十分鐘穿不過去。\n旗破了他不肯就這樣拿著走。線穿不過去，他會一直坐在這裡。',
    options: [
      {
        label: '派押尾把他的眼鏡從路上帶回來', hours: 1, result: '他補得好旗；他會講以前怎麼進北津（岔路的線索）',
        apply: (s) => {
          did(s, 'flag2');
          s.flags.clue_flag2 = true;
          return '眼鏡掛在板凳旁邊的樹枝上。阿伯戴上，三針就補好了。「以前我阿公帶我走，進北津沒有橋可以走，人都從下面過。現在的少年不知道了。」';
        },
      },
    ],
    ignore: '他會晚一點才跟上；少一條岔路的線索',
    missed: MISSED4.flag2,
  },
  rice2: (r) => r.flags.done_rice2 ? null : {
    who: '點心站的阿姨',
    text: '「網路上都說今年會爆，我多煮兩鍋油飯。啊人呢？」阿姨拿著飯匙站在鍋子後面。隊伍今天走得快，大部分的人低著頭就過去了。\n油飯放到下午就不能吃了。隊尾有人從早上到現在還沒吃東西。',
    options: [
      {
        // （註：辦成後今天多一攤「油飯攤」可以託一次——引擎還沒有「辦成後多一攤」的接點，見 roundB1-report）
        label: '派押尾去隊尾，把油飯的味道帶過去', hours: 1, result: '隊尾的人會過來吃；這一攤今天下午可以託',
        apply: (s) => { did(s, 'rice2'); return '隊尾幾個人抬頭聞了聞，拐過來。「阿姨，這個可以拿嗎？」「拿！一個人拿兩包，幫我拿給後面的。」三鍋在一個鐘頭內見底。'; },
      },
    ],
    ignore: '沒有壞處。阿姨會剩兩鍋油飯',
    missed: MISSED4.rice2,
  },
  // ---------- 第三天（回程・渾水溪；第 A 輪（待寫）） ----------
  /** 秀枝的那一段（pre・隊尾）：這天的主線 */
  xiuzhi3: stubCard('xiuzhi3', '秀枝', 'xiuzhi', [{ label: '（待寫）陪她們走到堤防', hours: 1 }, { label: '（待寫）陪她們走，聽她講阿母', hours: 2 }], { report: '把秀枝和她阿母報到轎前。', deadline: '今天' }),
  aman3: stubCard('aman3', '阿滿姨', 'aman', [{ label: '（待寫）陪她走', hours: 1 }]),
  /** 堤防邊的老人：記得渾水溪以前有擺渡（最後一戰陣前審問第 1 輪；知道茫渡是擺渡的，喘息時打得更痛） */
  dukou3: stubCard('dukou3', '堤防邊的老人', '', [{ label: '（待寫）問他溪的事', hours: 1, flag: 'ferry_heard' }]),
  ahan3: stubCard('ahan3', '阿翰', 'ahan', [{ label: '（待寫）陪他', hours: 1 }]),
  arui3: stubCard('arui3', '阿睿', 'arui', [{ label: '（待寫）幫他', hours: 1 }]),
  // 第二天拍入廟 → 人更多；拍秀枝 → 帶病人來求的家屬
  lost3: stubCard('lost3', '走散的孩子', '', [{ label: '（待寫）幫他找家人', hours: 1 }]),
  sick3: stubCard('sick3', '帶病人來求的家屬', '', [{ label: '（待寫）幫忙', hours: 2 }]),
};

/**
 * 第二、三天的暫代信徒卡：字都是（待寫），花費、給的證據、旗標是規則（換字時不要動）。
 * 辦過一次就不再出現（flags.done_<卡>）；辦成記 flags.helped_<信徒>（最後一戰人鏈：幫過的信徒會下水牽人）。
 * report：多一個「稟報」選項（第二、三天轎子停不停，之後的內容依 follow.reports 決定；暫代一律照常往前走）。
 */
function stubCard(
  id: string, who: string, believer: string,
  opts: { label: string; hours: number; gives?: string[]; flag?: string }[],
  extra: { report?: string; deadline?: string } = {},
): (r: RunState) => Card | null {
  return (r) => r.flags[`done_${id}`] ? null : {
    who,
    text: `（待寫）${who}（${id}）的卡片描述。`,
    ...(extra.deadline ? { deadline: extra.deadline } : {}),
    options: [
      ...opts.map((o): Option => ({
        label: o.label, hours: o.hours, result: '（待寫）辦成的結果預告', ...(o.gives ? { gives: o.gives } : {}),
        apply: (s) => {
          s.flags[`done_${id}`] = true;
          if (believer) s.flags[`helped_${believer}`] = true;
          if (o.flag) s.flags[o.flag] = true;
          for (const g of o.gives ?? []) gainEvidence(g);
          return `（待寫）${who}：辦成之後的那段話。`;
        },
      })),
      ...(extra.report ? [stubReport(id, `（待寫）${extra.report}媽祖會知道；轎子會不會為他停，不保證。`)] : []),
    ],
    ignore: '（待寫）略過的預告',
    missed: MISSED4[id],
  };
}

/** 因果簿（第 4 節「因果簿」兩種寫法：辦成／沒辦） */
const LEDGER4: [string, string, string[], string, string][] = [
  ['阿滿姨', 'aman', ['walked', 'told', 'rested'], '阿滿姨：膝蓋腫了還是走到了車行，網袋裡多帶一支小旗', '阿滿姨：昨晚沒跟上，一個人在騎樓坐到天亮'],
  ['阿睿', 'arui', ['helped'], '阿睿：跟轎台沒斷線。他整天只看線上人數', '阿睿：行動電源掉在海線小路，他到現在還在找'],
  ['賢仔', 'xianzai', ['told', 'showed'], '賢仔：車行快收了，今晚門口排了兩排人。他講了這塊地的來歷', '賢仔：忙了一整晚，還是不知道轎子為什麼挑他這間'],
  ['秀枝', 'xiuzhi', ['noted'], '秀枝：推阿母的輪椅走在隊尾。押尾記得她', '隊尾有一台輪椅，還沒有人知道推的人叫什麼'],
  ['阿翰', 'ahan', ['wrapped', 'told'], '阿翰：下個月入伍。腳包好了，訊息沒送出去', '阿翰：兩腳水泡。「我想回去了」還沒送，也還沒刪'],
];

/**
 * 第二天的因果簿（ch4-text-day2.md 第 5、6 節）：卡 id → [名字, 寫法 → 字（辦成的幾種）, 沒辦]。
 * 辦過的照 flags.ledger_<卡>（did 記的）；略過的（flags.missed_<卡>）寫沒辦；沒遇到的不列。秀枝稟報過但沒移輪椅：'reported'。
 */
const LEDGER4_2: Record<string, [string, Record<string, string>, string]> = {
  aman2: ['阿滿姨', { ok: '阿滿姨：在圳邊坐了一下，趕上入廟。小旗還插在網袋口' }, '阿滿姨：入廟的時候她在廟埕最外面，沒看到轎子進門'],
  arui2: ['阿睿', { ok: '阿睿：用跟轎台幫一個阿嬤找到孫子。那三分鐘他沒有報線上人數' }, '阿睿：三進三退拍得很清楚。有個阿嬤在他腳邊站了一下午'],
  xianzai2: ['賢仔', { ok: '賢仔：開貨車跟到北津，幫人載了二十幾個背包，都領回去了' }, '賢仔：車上還有六個背包沒人領。他不敢把車開走'],
  xiuzhi2: ['秀枝', { ok: '秀枝：輪椅移到騎樓下。入廟的時候她們看得到轎頂', reported: '秀枝：她在巷口護著輪椅。轎子退到她前面三步' }, '秀枝：入廟的時候她在巷口護著輪椅，沒有抬頭'],
  ahan2: ['阿翰', { ride: '阿翰：坐賢仔的車到北津。他跟阿公說「有到」，沒說怎麼到的', walk: '阿翰：背包上車，人用走的，走到了北津' }, '阿翰：沒坐到車，落在隊尾。到北津的時候天快黑了'],
  sick2a: ['拿著襯衫的太太', { ok: '拿著襯衫的太太：捧著先生的衣服鑽了轎腳。她搭末班車回醫院' }, '拿著襯衫的太太：沒擠到前面。她把襯衫舉過頭，舉到轎子進門'],
  sick2b: ['牽孫女的阿公', { ok: '牽孫女的阿公：孫女隔著藥局的玻璃看到轎子。她把手貼在玻璃上' }, '牽孫女的阿公：站在最遠的街角。孫女說有看到，他不確定'],
};

export function ledger4(r: RunState): LedgerLine[] {
  const lines = LEDGER4.map(([who, id, good, yes, no]): LedgerLine => {
    const ok = good.includes(r.b[id]);
    return { who, state: ok ? yes : no, tone: ok ? 'good' : r.b[id] === 'unmet' ? 'none' : 'bad' };
  });
  for (const [card, [who, yes, no]] of Object.entries(LEDGER4_2)) {
    const how = Object.keys(yes).find((k) => r.flags[`ledger_${card}_${k}`]);
    if (how) lines.push({ who, state: yes[how], tone: how === 'reported' ? 'bad' : 'good' });
    else if (r.flags[`missed_${card}`]) lines.push({ who, state: no, tone: 'bad' });
  }
  const f = r.follow;
  if (f?.strayed) lines.push({ who: '沒跟上', state: `被牽路仔帶偏的有 ${f.strayed} 位`, tone: 'bad' });
  return lines;
}

// ---------- 最後一戰（渾水溪）用到的：人鏈、還在水裡的人 ----------
/** 五位信徒：代號 → 名字 */
export const BELIEVER_NAMES4: Record<string, string> = { aman: '阿滿姨', arui: '阿睿', xianzai: '賢仔', xiuzhi: '秀枝', ahan: '阿翰' };

/**
 * 前兩天（含第三天）幫過的信徒：第一天辦成（因果簿的「辦成」狀態），或第二、三天的卡辦過（flags.helped_<代號>）。
 * 計畫 §6：「前兩天被你幫過的信徒會下水牽人，幫過幾位就有幾段」。
 */
export function helped4(r: RunState): string[] {
  return LEDGER4.filter(([, id, good]) => good.includes(r.b[id]) || !!r.flags[`helped_${id}`]).map(([, id]) => id);
}

/** 人鏈幾段＝傳消息加的（follow.chain）＋幫過的信徒 */
export function chainSegments4(r: RunState): number {
  return (r.follow?.chain ?? 0) + helped4(r).length;
}

/**
 * 還在水裡、會被茫渡叫走的人（依序）。幫過的信徒在人鏈上牽人，不在這裡。
 * 名字是暫代（金水伯是第一天被牽路仔帶偏的那位阿伯），（待寫）作者可換。
 */
const STRAGGLERS4: [name: string, believer?: string][] = [
  ['金水伯'], ['秀枝的阿母', 'xiuzhi'], ['阿滿姨', 'aman'], ['阿翰', 'ahan'], ['阿睿', 'arui'],
  ['賣蚵嗲的阿桑'], ['揹小孩的香燈腳'], ['推車的香燈腳'],
];

export function stragglers4(r: RunState): string[] {
  const h = new Set(helped4(r));
  return STRAGGLERS4.filter(([, b]) => !b || !h.has(b)).map(([n]) => n);
}

/** 被帶到下游沙洲的人：開爐那頁黃曆「昨日」欄寫的（人沒事，沒趕上回宮） */
export function sandbarLines4(names: string[]): string[] {
  if (!names.length) return [];
  return [`（待寫）天亮，在渾水溪下游的沙洲上找到${names.join('、')}。人都沒事，沒趕上回宮。`];
}

export function bossEffects4(r: RunState): string[] {
  const f = r.follow;
  const h = helped4(r).length;
  return [
    `人鏈 ${chainSegments4(r)} 段（傳消息 ${f?.chain ?? 0}＋幫過的信徒 ${h}）：每段在霧裡拉住一個被叫走的人`,
    `還在水裡、會被叫走的人：${stragglers4(r).length} 位`,
  ];
}

export function epitaphs4(r: RunState): Epitaph[] {
  const h = new Set(helped4(r));
  return Object.entries(BELIEVER_NAMES4).map(([id, who]) => ({ who, text: `（待寫）${who}回宮之後。`, good: h.has(id) }));
}

export function ghostEpitaphs4(r: RunState): Epitaph[] {
  // 判對歸處的才算圓滿（判決對錯的規則在 core/guihu.ts 的 rightVerdict；這裡照案子的 needs 判斷）
  const right: Record<string, string> = { caoxie: 'tobeijin', apo: 'here', xinniang: 'tohome', jiajiao: 'leave' };
  const names: Record<string, string> = { caoxie: '草鞋丁', apo: '點心擔阿婆', xinniang: '沒走成的新娘', jiajiao: '假香燈腳' };
  return Object.entries(names).map(([id, who]) => ({ who, text: `（待寫）${who}的結局。`, good: r.cases[id]?.verdict === right[id] }));
}

export function mangduEpitaph(r: RunState): Epitaph {
  const text = r.shijuEnd === 'recall' ? '（待寫）茫渡・喚回：留在溪邊當引路的。' : r.shijuEnd === 'return' ? '（待寫）茫渡・送回：送上對岸，了了。' : '（待寫）茫渡・斬。';
  return { who: '茫渡', text, good: r.shijuEnd !== 'slay' };
}
