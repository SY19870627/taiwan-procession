// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章的信徒（_agent/ch4-baishatun-plan.md §7「信徒五位」）：阿滿姨、阿睿（跟轎台義工；第一章已有阿哲，代號改 arui）、
 * 賢仔、秀枝、阿翰。序章黃曆、擲筊、因果簿、信徒錄。
 *
 * 第一天的字照 _agent/ch4-text-day1.md 第 1、4、6 節（作者尚未定稿）。第二天事件池、結局的信徒錄還沒寫（「（待寫）」）。
 * 選項的花費（時辰、稟報、點心站）是規則，換字時不要動。
 */
import type { RunState } from '../../state';
import { gainEvidence } from '../../state';
import type { Almanac, Card, Epitaph, LedgerLine, Option } from '../believers';

/** 還沒寫的字（第二天之後；試玩版走不到） */
const TBD = '（待寫）';

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

/** 沒辦結果（略過那張卡之後，天亮「昨日」寫的事；見 days.ts 的 dawn4） */
export const MISSED4: Record<string, string> = {
  aman1: '阿滿姨天黑才走到省道。她在一間雜貨店的騎樓坐了一夜。',
  arui1: '傍晚阿睿的手機剩百分之三。他蹲在車行牆邊，跟賢仔借延長線。',
  xianzai1: '賢仔搬椅子、接水管、指廁所，忙到半夜。扳手一直插在褲子後面的口袋。',
  xiuzhi1: '路燈下那台輪椅，天還沒亮就先出發了。她怕跟不上。',
  ahan1: '阿翰把襪子直接套回去，縮在騎樓的柱子邊。訊息還停在輸入框裡。',
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
  // ---------- 第二天傳消息的事件池（骨架；試玩版走不到，字還沒寫） ----------
  shoes2: () => ({ who: '鞋子磨腳的年輕人', text: TBD, options: [{ label: '幫忙', hours: 1, result: TBD, apply: () => TBD }], ignore: TBD }),
  heat2: () => ({ who: '中暑的年輕人', text: TBD, options: [{ label: '幫忙', hours: 1, result: TBD, apply: () => TBD }], ignore: TBD }),
  sick2a: () => ({ who: '帶病人來求的家屬', text: TBD, options: [{ label: '幫忙', hours: 2, result: TBD, apply: () => TBD }], ignore: TBD }),
  sick2b: () => ({ who: '帶病人來求的家屬', text: TBD, options: [{ label: '幫忙', hours: 2, result: TBD, apply: () => TBD }], ignore: TBD }),
  ahan2: (r) => r.b.ahan === 'unmet' ? { who: '阿翰', text: TBD, options: [{ label: '陪他走', hours: 1, result: TBD, apply: (s) => { done(s, 'ahan', 'met'); return TBD; } }], ignore: TBD } : null,
};

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

export function bossEffects4(r: RunState): string[] {
  return [`人鏈 ${r.follow?.chain ?? 0} 段（最後一戰「渾水溪」還沒做）`];
}

export function epitaphs4(_r: RunState): Epitaph[] {
  return ['阿滿姨', '阿睿', '賢仔', '秀枝', '阿翰'].map((who) => ({ who, text: TBD, good: true }));
}

export function ghostEpitaphs4(_r: RunState): Epitaph[] {
  return ['草鞋丁', '點心擔阿婆', '沒走成的新娘', '假香燈腳'].map((who) => ({ who, text: TBD, good: true }));
}

export function mangduEpitaph(r: RunState): Epitaph {
  return { who: '茫渡', text: TBD, good: r.shijuEnd !== 'slay' };
}
