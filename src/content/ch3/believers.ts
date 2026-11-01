/**
 * 第三章「新瀛・太子出營」：序章黃曆與擲筊、白天沿路遇到的人（五位信徒）、因果簿、最後一戰的狀況、信徒錄。
 * 原則同前兩章：每個選項都事先寫清楚花費、結果、不處理的後果與期限。
 * 太子爺嘴硬、愛現，對鴨子（恩人）和小孩特別上心（大綱 §3）。
 */
import type { RunState } from '../../state';
import { gainEvidence } from '../../state';
import type { Almanac, Card, Epitaph, LedgerLine } from '../believers';
import { CASES3 } from './cases';

// ---------- 信徒的狀態 ----------
export interface Believers3 {
  /** 太子殿的老廟公炳伯：廟裡舊事、太子「小時候」的趣事 */
  bingbo: 'unmet' | 'told' | 'close';
  /** 電音三太子陣頭的阿凱：上大夜，第二天祝壽要表演 */
  akai: 'tired' | 'danced' | 'flopped';
  /** 鴨母寮的鴨嬸：鴨子一直少 */
  yashen: 'worried' | 'told' | 'thanked';
  /** 新手媽媽阿玲：孩子夜夜哭，第二天想請奶嘴 */
  aling: 'unmet' | 'met' | 'pacifier' | 'missed';
  /** 渡口擺茶攤的何伯：知道溪底的舊事 */
  hebo: 'unmet' | 'told';
}

export function newBelievers3(): Believers3 {
  return { bingbo: 'unmet', akai: 'tired', yashen: 'worried', aling: 'unmet', hebo: 'unmet' };
}

const give = (...ids: string[]) => { for (const id of ids) gainEvidence(id); };
const has = (r: RunState, id: string) => r.evidence.includes(id);

// ---------- 序章 ----------
export const PROLOGUE3: Almanac = {
  lunar: '九月初七',
  yi: '安營　犒軍',
  ji: '食鴨',
  source: '新瀛太子殿誌・卷一',
  text: '新瀛在平原上，庄頭庄尾都插著五營旗。太子殿供的是中壇元帥，統領東西南北中五營兵將，守著整個庄。\n九月初九是太子爺聖誕。今年疾水溪的水不對勁，鴨母寮的鴨一直少。',
};

/** 擲筊三次：「太子今年出營否？」（說法見計畫 Q7【待定】） */
export const PROLOGUE_JIAO3 = {
  ask: '太子今年出營否？',
  times: 3,
  holy: { text: '太子：「走了。」【待定】' },
  laugh: { text: '太子在笑我們囉嗦。【待定】' },
  yin: { text: '章將軍：「太子說……再等等。」【待定】' },
  allHoly: { text: '連得三個聖杯！廟埕的電音鼓點自己響了起來。' },
  done: '不管結果如何，太子都要出營。炳伯：「五營兵將昨晚已經先抓了三個回來，押在營旗下。」',
};

// ---------- 信徒卡 ----------
export const CARDS3: Record<string, (r: RunState) => Card | null> = {
  bingbo1: (r) => r.flags.bingbo1 ? null : {
    who: '炳伯',
    text: '太子殿的老廟公，正在擦供桌。「供桌上的糖果、汽水每天都少，我看是那些孤魂偷的。」太子在轎裡哼了一聲。',
    options: [
      {
        label: '聽他說供品的事', hours: 1, gives: ['bingbo_offer'],
        result: '他說了供品不見那幾晚看到的東西',
        apply: (s) => { s.flags.bingbo1 = true; s.b.bingbo = 'told'; give('bingbo_offer'); return '炳伯壓低聲音：「{surprised}我看到一隻跟貓一樣大的老鼠，叼著糖果往後殿鑽。」'; },
      },
      {
        label: '陪他整理供桌、聽庄裡舊事', hours: 2, gives: ['bingbo_offer', 'bingbo_hutou'],
        result: '供品的事之外，也說了市場那個虎頭生前的事',
        apply: (s) => { s.flags.bingbo1 = true; s.b.bingbo = 'told'; give('bingbo_offer', 'bingbo_hutou'); return '「供品不見那幾晚，有一隻大老鼠……」炳伯把糖果排好，「{smile}市場那個虎頭喔，以前收保護費，攤子不給就翻。死了也沒幾個人去送。」'; },
      },
    ],
    ignore: '第二天祝壽還會遇到他',
  },
  bingbo2: (r) => r.flags.bingbo2 ? null : {
    who: '炳伯',
    text: '祝壽的香煙裡，炳伯笑著說太子小時候的事：「以前有個囝仔偷吃供桌上的糖，隔天他的彈珠全不見了。」太子：「……那不是我。」',
    options: [
      {
        label: '聽他說溪底的老傳說', hours: 1, gives: ['bingbo_creek'],
        result: '他說了疾水溪底的東西，和鴨母寮的老阿婆',
        apply: (s) => { s.flags.bingbo2 = true; s.b.bingbo = 'close'; give('bingbo_creek'); return '「{normal}老一輩說溪底住著一尾東西，餓了就上岸找雞鴨。鴨母寮的老阿婆，以前每年都去溪邊拜。」'; },
      },
      {
        label: '多聽一段渡口廢掉那年的事', hours: 2, gives: ['bingbo_creek', 'bingbo_ferry'],
        result: '溪底的傳說之外，也說了撐渡船的阿伯',
        apply: (s) => { s.flags.bingbo2 = true; s.b.bingbo = 'close'; give('bingbo_creek', 'bingbo_ferry'); return '「溪底有一尾東西……」炳伯嘆了口氣，「{sad}渡口廢掉那年，撐船的阿伯翻船以後，晚上還有人看到竹篙在溪上撐。」'; },
      },
      ...(has(r, 'bingbo_hutou') ? [] : [{
        label: '問他市場那個虎頭', hours: 1, gives: ['bingbo_hutou'],
        result: '他說了虎頭生前的事',
        apply: (s: RunState) => { s.flags.bingbo2 = true; s.b.bingbo = 'close'; give('bingbo_hutou'); return '「{surprised}虎頭喔？以前在市場收保護費，攤子不給就翻。後來喝酒跟人打架死的。」'; },
      }]),
    ],
    ignore: '之後就沒機會聽他說了',
  },
  yashen1: (r) => r.b.yashen !== 'worried' ? null : {
    who: '鴨嬸',
    text: '鴨母寮的主人。「每晚少一隻鴨，抓都抓不到。剩下的鴨每晚排成一列，對著我婆婆以前站的地方叫。」太子在轎裡坐直了：對鴨子，他特別客氣。',
    options: [
      {
        label: '停轎聽她說婆婆的事', hours: 1, gives: ['yashen_word'],
        result: '她說了婆婆生前怎麼疼鴨',
        apply: (s) => { s.b.yashen = 'told'; give('yashen_word'); return '鴨嬸擦了擦手：「{sad}我婆婆生前最疼鴨，每晚睡前都要去鴨寮數一遍。她走了以後，鴨子還是每晚對著那裡叫。」'; },
      },
      {
        label: '顯現神蹟：讓鴨群自己走回寮', hours: 1, miracle: true, gives: ['yashen_word'],
        result: '鴨群排成一列走回寮；她嚇了一跳，把婆婆的事都說了',
        apply: (s) => { s.b.yashen = 'told'; give('yashen_word'); return '整寮的鴨忽然排成一列，搖搖擺擺走回鴨寮，最後一隻還回頭對轎子叫了一聲。鴨嬸看呆了：「{surprised}……我婆婆在的時候，鴨子也是這樣排隊。」'; },
      },
    ],
    ignore: '鴨母婆的身世，只能靠夜裡審她時慢慢問',
  },
  aling1: (r) => r.b.aling !== 'unmet' ? null : {
    who: '阿玲',
    text: '抱著嬰兒的年輕媽媽，眼睛下面黑了一圈。「孩子夜夜哭，我抱著他在門口走。那晚庄尾燒起來，我嚇死了。」',
    options: [
      {
        label: '聽她說那晚看到什麼', hours: 1, gives: ['aling_fire'],
        result: '她說了火光裡看到的人；明天她會去太子殿請奶嘴',
        apply: (s) => { s.b.aling = 'met'; give('aling_fire'); return '「{sad}火光裡有一個人在拍手，笑得好開心……」阿玲拍著孩子，「明天太子聖誕，聽說可以請奶嘴回家。」'; },
      },
    ],
    ignore: '明天她還是會來太子殿請奶嘴（要多花時間）',
  },
  aling2: (r) => (r.b.aling !== 'unmet' && r.b.aling !== 'met') ? null : {
    who: '阿玲',
    text: '奶嘴過火的隊伍排得好長。阿玲抱著孩子排在最後面，孩子哭得滿臉通紅。「擲筊要擲到聖杯才能請……我已經擲了三次了。」太子：「誰要管這個。」轎子卻往那邊靠了過去。',
    deadline: '今天',
    options: r.b.aling === 'met'
      ? [{
        label: '陪她擲筊', hours: 1,
        result: '請到奶嘴（最後一戰：孩子的笑聲會傳過來）',
        apply: (s) => { s.b.aling = 'pacifier'; return '一擲，聖杯。奶嘴一塞進嘴裡，孩子就不哭了。阿玲笑著哭了。\n太子：「{pout}誰要這個。……先放著。」'; },
      }]
      : [{
        label: '聽她說、陪她擲筊', hours: 2, gives: ['aling_fire'],
        result: '請到奶嘴（最後一戰：孩子的笑聲會傳過來）；也說了庄尾火光裡的人',
        apply: (s) => { s.b.aling = 'pacifier'; give('aling_fire'); return '「那晚庄尾燒起來，火光裡有一個人在拍手……」阿玲說著，一擲，聖杯。孩子含著奶嘴睡著了。\n太子：「{pout}……先放著。」'; },
      }],
    ignore: '她沒請到奶嘴，孩子還是夜夜哭',
  },
  akai2: (r) => r.b.akai !== 'tired' ? null : {
    who: '阿凱',
    text: '電音三太子陣頭的青年，上完大夜班直接來，眼睛快睜不開。三太子神偶的頭盔帶子斷了，陣頭馬上要上場祝壽。「我想把陣頭跳到外縣市……今天要是出包就完了。」',
    deadline: '今天',
    options: [
      {
        label: '請章將軍幫他把頭盔綁好', hours: 1,
        result: '陣頭順利跳完祝壽（最後一戰：電音的鼓點會傳過來）',
        apply: (s) => { s.b.akai = 'danced'; return '頭盔帶子自己綁好了，綁得比原本還緊。阿凱跳得比哪一次都好，整個廟埕都在拍手。\n太子：「{cocky}……還可以啦。」'; },
      },
      {
        label: '綁好頭盔，再陪他聊大夜班', hours: 2, gives: ['akai_creek'],
        result: '陣頭順利跳完；他也說了凌晨看到的怪事',
        apply: (s) => { s.b.akai = 'danced'; give('akai_creek'); return '跳完祝壽，阿凱坐在台階上喝汽水：「{surprised}我上大夜，凌晨三點常看到小孩自己往溪邊走，前面好像有一個穿紅肚兜的小孩在帶路。」'; },
      },
    ],
    ignore: '頭盔會在表演時掉下來，他說不跳了',
  },
  hebo3: (r) => r.b.hebo !== 'unmet' ? null : {
    who: '何伯',
    text: '舊渡口的茶攤，何伯在倒茶。「少年仔，你們有看到嗎？今天溪水是往山那邊流的。我在這裡擺攤四十年，第一次看到。」',
    options: [
      {
        label: '坐下來喝杯茶', hours: 1, gives: ['hebo_ferry'],
        result: '他說了以前撐渡船的阿伯',
        apply: (s) => { s.b.hebo = 'told'; give('hebo_ferry'); return '「{sad}以前撐渡船的阿伯，每天載人過溪。那年大水，船在溪中間翻了。他載的人都沒事，只有他沒上來。」'; },
      },
      {
        label: '聽他講完溪底的舊事', hours: 2, gives: ['hebo_ferry', 'hebo_fowl'],
        result: '渡船的事之外，也說了溪裡吃家禽的舊事',
        apply: (s) => { s.b.hebo = 'told'; give('hebo_ferry', 'hebo_fowl'); return '「撐渡船的阿伯，船翻了只有他沒上來……」何伯看著倒流的溪水，「{surprised}這條溪以前就會吃雞吃鴨。我阿爸每年要往溪裡丟一隻鴨。」'; },
      },
    ],
    ignore: '渡口的舊事要靠別的地方查',
  },
  fire2: (r) => (r.cases.huosha?.verdict || r.flags.fire_out) ? null : {
    who: '庄尾的阿伯',
    text: '「昨晚庄尾的稻草堆又冒煙了，我一桶一桶提水澆。」營旗下押著的那個焦味小子押得住，押不住牠先前撒出去的火星。',
    deadline: '今晚',
    options: [
      {
        label: '派南營去踩熄火星', hours: 1,
        result: '火星全熄，今晚庄尾不會燒起來',
        apply: (s) => { s.flags.fire_out = true; return '霄將軍帶著南營兵將繞了庄尾一圈，一腳一個，火星全踩熄了。阿伯抓抓頭：「{surprised}奇怪，怎麼一下子就不冒煙了？」'; },
      },
    ],
    ignore: '今晚阿伯的稻草堆會燒起來（還沒判火煞的話）',
  },
};

// ---------- 因果簿 ----------
export function ledger3(r: RunState): LedgerLine[] {
  const b = r.b as unknown as Believers3;
  const bingbo: Record<Believers3['bingbo'], LedgerLine> = {
    unmet: { who: '炳伯', state: '還沒聽他說廟裡的事（第一天出發、第二天祝壽）', tone: 'warn' },
    told: { who: '炳伯', state: '說了太子殿的供品與庄裡舊事', tone: 'good' },
    close: { who: '炳伯', state: '把溪底和渡口的老傳說都說了', tone: 'good' },
  };
  const akai: Record<Believers3['akai'], LedgerLine> = {
    tired: { who: '阿凱', state: '上完大夜要跳祝壽，頭盔帶子斷了（第二天）', tone: 'warn' },
    danced: { who: '阿凱', state: '電音三太子跳完祝壽，整個廟埕都在拍手', tone: 'good' },
    flopped: { who: '阿凱', state: '頭盔在表演時掉了，他說不跳了', tone: 'bad' },
  };
  const yashen: Record<Believers3['yashen'], LedgerLine> = {
    worried: { who: '鴨嬸', state: '鴨母寮每晚少一隻鴨（第一天庄頭線）', tone: 'warn' },
    told: { who: '鴨嬸', state: '說了婆婆生前的事；鴨子還在少（要處理營旗下的老婦人）', tone: 'warn' },
    thanked: { who: '鴨嬸', state: '鴨子不再少了', tone: 'good' },
  };
  const aling: Record<Believers3['aling'], LedgerLine> = {
    unmet: { who: '阿玲', state: '孩子夜夜哭（第一天庄尾線；第二天會去請奶嘴）', tone: 'warn' },
    met: { who: '阿玲', state: '第二天要去太子殿請奶嘴', tone: 'warn' },
    pacifier: { who: '阿玲', state: '請到奶嘴，孩子不哭了', tone: 'good' },
    missed: { who: '阿玲', state: '沒請到奶嘴，孩子還是夜夜哭', tone: 'bad' },
  };
  const hebo: Record<Believers3['hebo'], LedgerLine> = {
    unmet: { who: '何伯', state: '還沒聽他說渡口的舊事（第三天舊渡口線）', tone: 'warn' },
    told: { who: '何伯', state: '說了渡口與溪底的舊事', tone: 'good' },
  };
  // 斬錯的冤魂：因果簿記下遺憾（白天快判、夜審都算）
  const regrets: LedgerLine[] = Object.values(CASES3)
    .filter((k) => r.flags[`wronged_${k.id}`])
    .map((k) => ({ who: '遺憾', state: `斬了有冤的${k.name}：${k.truths[0]?.summary ?? ''}`, tone: 'bad' }));
  return [bingbo[b.bingbo], akai[b.akai], yashen[b.yashen], aling[b.aling], hebo[b.hebo], ...regrets];
}

/** 最後一戰的狀況（白天累積的結果） */
export function bossEffects3(r: RunState): string[] {
  const out: string[] = [];
  if (r.bossAdds) out.push(`蝦兵多 ${r.bossAdds} 波（神蹟外洩、略過的小妖）`);
  if (r.weiming) out.push(`威名 ${r.weiming}：太子的名號傳到溪底了`);
  if (r.flags.recruit_dubo) out.push('渡伯編入北營：他帶路，說出蛟的弱點');
  if (r.flags.recruit_hutou) out.push('虎頭編入南營：扛轎的前排');
  if (r.flags.recruit_yamupo) out.push('鴨母婆編入北營：鴨群讓蝦兵變慢');
  if (r.flags.recruit_zhizha) out.push('紙紮童編入中營：紙人替身吸收一次拖人');
  if (r.evidence.includes('ash_ledger')) out.push('手上有虎頭的香灰帳本：能揭穿蛟收供品');
  const voices = [r.b.aling === 'pacifier' ? '阿玲的孩子' : '', r.b.akai === 'danced' ? '阿凱的陣頭' : ''].filter(Boolean);
  if (voices.length) out.push(`${voices.join('、')}：最後關頭，凡人的聲音會傳過來`);
  return out;
}

// ---------- 信徒錄（結局） ----------
export function epitaphs3(r: RunState): Epitaph[] {
  const b = r.b as unknown as Believers3;
  return [
    b.bingbo === 'close'
      ? { who: '炳伯', good: true, text: '收營那天，他在廟誌上寫了一頁新的「太子小時候」。寫完自己笑了很久。' }
      : b.bingbo === 'told'
        ? { who: '炳伯', good: true, text: '供桌上的糖果不再少了。他說，一定是太子顯靈。' }
        : { who: '炳伯', good: false, text: '他還是每天擦供桌，罵那些偷糖果的孤魂。' },
    b.akai === 'danced'
      ? { who: '阿凱', good: true, text: '祝壽的影片被傳到網路上。隔年，有外縣市的廟來請他們的陣頭。' }
      : { who: '阿凱', good: false, text: '他把三太子神偶收進倉庫，繼續上大夜。' },
    b.yashen === 'thanked'
      ? { who: '鴨嬸', good: true, text: '鴨子一隻都沒有再少。她在鴨寮門口擺了一張婆婆的照片。' }
      : b.yashen === 'told'
        ? { who: '鴨嬸', good: false, text: '她知道婆婆的事了，可是鴨子還是一隻一隻少。' }
        : { who: '鴨嬸', good: false, text: '鴨子一直少，她說明年不養了。' },
    b.aling === 'pacifier'
      ? { who: '阿玲', good: true, text: '孩子含著奶嘴，一覺睡到天亮。隔年聖誕，她抱著孩子來還願。' }
      : { who: '阿玲', good: false, text: '孩子還是夜夜哭。她抱著孩子在門口走，一直走到天亮。' },
    b.hebo === 'told'
      ? { who: '何伯', good: true, text: '他在茶攤旁邊立了一支舊竹篙。他說，撐船的阿伯終於可以休息了。' }
      : { who: '何伯', good: false, text: '他還在舊渡口擺茶攤，每天看著溪水，等一個不會回來的人。' },
  ];
}

/** 九個鬼的結局（依判決） */
export function ghostEpitaphs3(r: RunState): Epitaph[] {
  const v = (id: string) => r.cases[id]?.verdict;
  const none = (who: string, text: string): Epitaph => ({ who, good: false, text });
  const map: [string, Record<string, Epitaph>, Epitaph][] = [
    ['yamupo', {
      release: { who: '鴨母婆', good: true, text: '她安心走了。鴨寮的鴨子，每晚還是會對著她以前站的地方叫一聲。' },
      recruit: { who: '鴨母婆', good: true, text: '她編進北營。聽說北營的兵將，身後都跟著一列白鴨。' },
      escort: { who: '鴨母婆', good: false, text: '她被押走了。沒有人知道，她每晚送去的那隻鴨，換了多少平安。' },
      slay: { who: '鴨母婆', good: false, text: '她散了。鴨子們在鴨寮裡叫了一整夜。' },
    }, none('偷鴨的老婦人', '她還在押著，嘴裡一直念著鴨子的名字。')],
    ['hutou', {
      slay: { who: '虎頭', good: true, text: '他被太子親斬。後巷的孤魂，再也不用排隊交香灰了。' },
      recruit: { who: '虎頭', good: true, text: '他在南營扛轎。每次轎子一重，他就被霄將軍罵。' },
      escort: { who: '虎頭', good: true, text: '他被押去地府，照他做的事一件一件受審。' },
    }, none('收香灰的大塊頭', '市場後巷，孤魂們還在排隊交香灰。')],
    ['zhizha', {
      slay: { who: '紙紮童', good: true, text: '太子一句「喔？」，牠就跪了。舊壇的糖果，後來都分給了庄裡的小孩。' },
      escort: { who: '紙紮童', good: true, text: '牠被燒回去了。這一次，沒有下雨。' },
      recruit: { who: '紙紮童', good: true, text: '牠在中營掃地。太子說牠扮得不像，牠每天都在偷偷練。' },
    }, none('舊壇的「三太子」', '舊壇前，還是有小孩在送糖果。')],
    ['dubo', {
      recruit: { who: '渡伯', good: true, text: '他編進北營，替太子帶路。疾水溪上，偶爾還看得到一支竹篙在撐。' },
      release: { who: '渡伯', good: true, text: '他放下竹篙，過溪了。這一次，他撐到了對岸。' },
      escort: { who: '渡伯', good: false, text: '他被押走了。竹篙上的正字，沒有人數完。' },
      slay: { who: '渡伯', good: false, text: '他散了。那支竹篙漂到溪中間，沉了下去。' },
    }, none('撐竹篙的老人', '他還在舊渡口招手。溪中間，還是有人迷路。')],
    ['shuigui', {
      slay: { who: '水鬼', good: true, text: '太子：「不必多言。」溪邊的哭聲，從此沒了。' },
      escort: { who: '水鬼', good: true, text: '牠被押去地府。溪邊的哭聲停了。' },
      recruit: { who: '水鬼', good: true, text: '牠在西營當營兵。柳將軍每天只對牠說一個字：「站。」' },
    }, none('溪邊哭泣的年輕人', '溪邊還有哭聲。')],
    ['huosha', {
      slay: { who: '火煞', good: true, text: '太子：「不必多言。」庄尾的稻草堆，再也沒燒過。' },
      escort: { who: '火煞', good: true, text: '牠被押去地府。庄尾的焦味散了。' },
      recruit: { who: '火煞', good: true, text: '牠在南營當營兵，專門替霄將軍點鞭炮。' },
    }, none('一身焦味的瘦小子', '庄尾，還是偶爾聞得到焦味。')],
    ['shuyao', {
      slay: { who: '鼠妖', good: true, text: '太子：「不必多言。」供桌上的糖果不再少了。' },
      escort: { who: '鼠妖', good: true, text: '牠被押去地府。炳伯不再罵孤魂了。' },
      recruit: { who: '鼠妖', good: true, text: '牠在東營當營兵。章將軍每天點名，都要先數一遍供品。' },
    }, none('供桌下的胖老鼠', '太子殿的供品，還是每天少一點。')],
    ['shaozaibo', {
      release: { who: '哨仔伯【待定】', good: true, text: '他摘下帽子走了。國小後門，太子派了東營的兵將站崗。' },
      recruit: { who: '哨仔伯【待定】', good: true, text: '他在東營當營兵，還是每天站在國小後門。現在孩子們會跟他揮手。' },
      escort: { who: '哨仔伯【待定】', good: false, text: '他被押走了。國小後門，沒有人吹哨子了。' },
      slay: { who: '哨仔伯【待定】', good: false, text: '他散了。那個舊哨子，掉在往溪邊的小路上。' },
    }, none('半夜吹哨的老人', '國小後門，半夜還是有哨聲。')],
    ['awang', {
      release: { who: '阿旺【待定】', good: true, text: '太子殿的香，從此分他一份。他吃飽了，安心走了。' },
      recruit: { who: '阿旺【待定】', good: true, text: '他在西營當營兵。營裡沒有人打他。' },
      escort: { who: '阿旺【待定】', good: false, text: '他被押走了。後巷的孤魂，少了一個。' },
      slay: { who: '阿旺【待定】', good: false, text: '他散了。那個破布袋，留在廟口。' },
    }, none('撿香灰的瘦影子', '他還在廟口撿香灰。')],
  ];
  return map.map(([id, ends, fallback]) => ends[v(id) ?? ''] ?? fallback);
}

export function jiaoEpitaph(r: RunState): Epitaph {
  // 收蛟為坐騎之後的收尾一句（計畫 Q8【待定】）
  if (r.shijuEnd === 'recall') return { who: '蛟', good: true, text: '蛟低下頭，成了太子的坐騎。太子嘴硬：「我只是缺一隻坐騎。」疾水溪從此平靜，鴨子不再少。【待定】' };
  if (r.shijuEnd === 'slay') return { who: '蛟', good: true, text: '太子親斬。疾水溪的水，第一次往海那邊流得那麼順。' };
  return { who: '蛟', good: false, text: '牠被押回水府。溪水平靜了，可是溪底還有東西。' };
}
