// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章的信徒（_agent/ch4-baishatun-plan.md §7「信徒五位」）：阿滿姨、阿睿（跟轎台義工；第一章已有阿哲，代號改 arui）、
 * 賢仔、秀枝、阿翰。序章黃曆、擲筊、因果簿、信徒錄。
 *
 * 第一天的字照 _agent/ch4-text-day1.md 第 1、4、6 節（作者尚未定稿）。第二、三天的卡、信徒錄是【待定】暫代（第 A 輪）。
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
 * 沒辦結果（略過那張卡之後，天亮「昨日」寫的事；見 days.ts 的 dawn4：卡片 id 尾巴的數字＝第幾天）。
 * 第二、三天的是【待定】暫代。
 */
export const MISSED4: Record<string, string> = {
  aman1: '阿滿姨天黑才走到省道。她在一間雜貨店的騎樓坐了一夜。',
  arui1: '傍晚阿睿的手機剩百分之三。他蹲在車行牆邊，跟賢仔借延長線。',
  xianzai1: '賢仔搬椅子、接水管、指廁所，忙到半夜。扳手一直插在褲子後面的口袋。',
  xiuzhi1: '路燈下那台輪椅，天還沒亮就先出發了。她怕跟不上。',
  ahan1: '阿翰把襪子直接套回去，縮在騎樓的柱子邊。訊息還停在輸入框裡。',
  ahan2: '【待定】沒陪阿翰的話，第二天晚上他怎麼了。',
  aman2: '【待定】沒聽阿滿姨講的話，第二天晚上她怎麼了。',
  xiuzhi2: '【待定】沒幫秀枝的話，第二天晚上她們怎麼了。',
  xiuzhi3: '【待定】沒陪秀枝的話，第三天她們怎麼了。',
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
        label: '問話', hours: 1, result: '得到岔路的線索',
        apply: (s) => {
          s.flags.clue_oajian = true;
          return [
            '賣蚵嗲的阿桑：「前面街尾分兩條。外環今年在挖水溝，車擠成一線。」',
            '賣蚵嗲的阿桑：「老路口那攤茶水，昨晚就擺出來了。阿滿每年都走那條。」',
            '賣蚵嗲的阿桑：「轎子往哪走我不敢講。我只知道有人在那邊等。」',
          ].join('\n');
        },
      },
    ],
    ignore: '少一條岔路的線索',
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
  // ---------- 第二天（第 A 輪：【待定】暫代；花費、稟報、給的證據是規則） ----------
  /** 阿翰（pre・省道）：第一天想回家的那個；第二天走不走得下去 */
  ahan2: stubCard('ahan2', '阿翰', 'ahan', [{ label: '【待定】陪他走一段', hours: 1 }], { report: '把阿翰的事報到轎前。' }),
  /** 阿滿姨（甲路）：女兒當年沒跟她走成——沒走成的新娘的證詞 */
  aman2: stubCard('aman2', '阿滿姨', 'aman', [{ label: '【待定】聽她講女兒的事', hours: 1, gives: ['aman_flag'] }], { report: '把阿滿姨的事報到轎前。' }),
  /** 秀枝（post・北津街上的隊尾） */
  xiuzhi2: stubCard('xiuzhi2', '秀枝', 'xiuzhi', [{ label: '【待定】幫她推一段', hours: 1 }], { report: '把秀枝和她阿母報到轎前。' }),
  // 第一天拍車行 → 看熱鬧的年輕人：兩件小事（1 時辰）
  shoes2: stubCard('shoes2', '鞋子磨腳的年輕人', '', [{ label: '【待定】幫他', hours: 1 }]),
  heat2: stubCard('heat2', '中暑的年輕人', '', [{ label: '【待定】幫他', hours: 1 }]),
  // 第一天拍秀枝 → 帶病人來求的家屬：兩件很難辦的事（2 時辰起，沒有點心站可以託）
  sick2a: stubCard('sick2a', '帶病人來求的家屬', '', [{ label: '【待定】幫忙', hours: 2 }]),
  sick2b: stubCard('sick2b', '帶病人來求的家屬', '', [{ label: '【待定】幫忙', hours: 2 }]),
  // ---------- 第三天（回程・渾水溪；第 A 輪【待定】） ----------
  /** 秀枝的那一段（pre・隊尾）：這天的主線 */
  xiuzhi3: stubCard('xiuzhi3', '秀枝', 'xiuzhi', [{ label: '【待定】陪她們走到堤防', hours: 1 }, { label: '【待定】陪她們走，聽她講阿母', hours: 2 }], { report: '把秀枝和她阿母報到轎前。', deadline: '今天' }),
  aman3: stubCard('aman3', '阿滿姨', 'aman', [{ label: '【待定】陪她走', hours: 1 }]),
  /** 堤防邊的老人：記得渾水溪以前有擺渡（最後一戰陣前審問第 1 輪；知道茫渡是擺渡的，喘息時打得更痛） */
  dukou3: stubCard('dukou3', '堤防邊的老人', '', [{ label: '【待定】問他溪的事', hours: 1, flag: 'ferry_heard' }]),
  ahan3: stubCard('ahan3', '阿翰', 'ahan', [{ label: '【待定】陪他', hours: 1 }]),
  arui3: stubCard('arui3', '阿睿', 'arui', [{ label: '【待定】幫他', hours: 1 }]),
  // 第二天拍入廟 → 人更多；拍秀枝 → 帶病人來求的家屬
  lost3: stubCard('lost3', '走散的孩子', '', [{ label: '【待定】幫他找家人', hours: 1 }]),
  sick3: stubCard('sick3', '帶病人來求的家屬', '', [{ label: '【待定】幫忙', hours: 2 }]),
};

/**
 * 第二、三天的暫代信徒卡：字都是【待定】，花費、給的證據、旗標是規則（換字時不要動）。
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
    text: `【待定】${who}（${id}）的卡片描述。`,
    ...(extra.deadline ? { deadline: extra.deadline } : {}),
    options: [
      ...opts.map((o): Option => ({
        label: o.label, hours: o.hours, result: '【待定】辦成的結果預告', ...(o.gives ? { gives: o.gives } : {}),
        apply: (s) => {
          s.flags[`done_${id}`] = true;
          if (believer) s.flags[`helped_${believer}`] = true;
          if (o.flag) s.flags[o.flag] = true;
          for (const g of o.gives ?? []) gainEvidence(g);
          return `【待定】${who}：辦成之後的那段話。`;
        },
      })),
      ...(extra.report ? [stubReport(id, `【待定】${extra.report}媽祖會知道；轎子會不會為他停，不保證。`)] : []),
    ],
    ignore: '【待定】略過的預告',
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

export function ledger4(r: RunState): LedgerLine[] {
  const lines = LEDGER4.map(([who, id, good, yes, no]): LedgerLine => {
    const ok = good.includes(r.b[id]);
    return { who, state: ok ? yes : no, tone: ok ? 'good' : r.b[id] === 'unmet' ? 'none' : 'bad' };
  });
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
 * 名字是暫代（金水伯是第一天被牽路仔帶偏的那位阿伯），【待定】作者可換。
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
  return [`【待定】天亮，在渾水溪下游的沙洲上找到${names.join('、')}。人都沒事，沒趕上回宮。`];
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
  return Object.entries(BELIEVER_NAMES4).map(([id, who]) => ({ who, text: `【待定】${who}回宮之後。`, good: h.has(id) }));
}

export function ghostEpitaphs4(r: RunState): Epitaph[] {
  // 判對歸處的才算圓滿（判決對錯的規則在 core/guihu.ts 的 rightVerdict；這裡照案子的 needs 判斷）
  const right: Record<string, string> = { caoxie: 'tobeijin', apo: 'here', xinniang: 'tohome', jiajiao: 'leave' };
  const names: Record<string, string> = { caoxie: '草鞋丁', apo: '點心擔阿婆', xinniang: '沒走成的新娘', jiajiao: '假香燈腳' };
  return Object.entries(names).map(([id, who]) => ({ who, text: `【待定】${who}的結局。`, good: r.cases[id]?.verdict === right[id] }));
}

export function mangduEpitaph(r: RunState): Epitaph {
  const text = r.shijuEnd === 'recall' ? '【待定】茫渡・喚回：留在溪邊當引路的。' : r.shijuEnd === 'return' ? '【待定】茫渡・送回：送上對岸，了了。' : '【待定】茫渡・斬。';
  return { who: '茫渡', text, good: r.shijuEnd !== 'slay' };
}
