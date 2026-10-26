/**
 * 白天沿路遇到的「人」：五位信徒的狀態與信徒卡（依「收容與夜審 設計大綱 v0.2」）。
 *
 * 原則：每個選項都事先寫清楚花費、結果、不處理的後果與期限，玩家不用猜。
 * 有些選項會順便得到證據（gives），晚上夜審時用。
 * 遊戲中一律用虛構名稱（萬舺、青嶺宮、芝林、芝嶺巖、惠澤宮、開疆聖王、石駒）。
 */
import type { RunState } from '../state';
import { gainEvidence } from '../state';

// ---------- 五位信徒的狀態 ----------
export interface BelieverState {
  /** 阿秀嬸與孫子阿弟（阿弟的燒是古井邊的阿桂造成的） */
  axiu: 'sick' | 'eased' | 'worse' | 'cured' | 'regret';
  /** 看得見靈界的小芸 */
  xiaoyun: 'unmet' | 'met' | 'protected' | 'invited' | 'lost';
  /** 冰果室第二代阿哲 */
  azhe: 'unmet' | 'softened' | 'believer' | 'stayed' | 'closed';
  /** 菜農阿雄 */
  axiong: 'angry' | 'calmed' | 'trapped' | 'rescued' | 'hurt';
  /** 老石匠林伯 */
  linbo: 'unmet' | 'told';
}

export function newBelievers(): BelieverState {
  return { axiu: 'sick', xiaoyun: 'unmet', azhe: 'unmet', axiong: 'angry', linbo: 'unmet' };
}

export const MIRACLE_COST = 20;

// ---------- 信徒卡 ----------
export interface Option {
  label: string;
  /** 花幾個時辰 */
  hours: number;
  /** 花多少香火 */
  incense?: number;
  /** 要用掉一次神蹟（另外扣香火 20、最後一戰小妖 +1 波） */
  miracle?: boolean;
  /** 選了會得到的證據 */
  gives?: string[];
  /** 選之前就寫明的結果 */
  result: string;
  /** 真的選了：改變狀態，回傳結果敘述 */
  apply: (r: RunState) => string;
}

export interface Card {
  who: string;
  /** 狀況說明 */
  text: string;
  /** 期限（有寫就是急事） */
  deadline?: string;
  options: Option[];
  /** 不處理（直接走過）的後果 */
  ignore: string;
}

export interface Almanac {
  /** 農曆日期（直書） */
  lunar: string;
  yi: string;
  ji: string;
  chong?: string;
  /** 舊聞標題 */
  source: string;
  /** 舊聞內文（半文言） */
  text: string;
}

export const gain = (r: RunState, d: { incense?: number; followers?: number; morale?: number }) => {
  if (d.incense) r.incense = Math.max(0, r.incense + d.incense);
  if (d.followers) r.followers = Math.max(0, r.followers + d.followers);
  if (d.morale) r.morale = Math.max(0, Math.min(100, r.morale + d.morale));
};

const give = (...ids: string[]) => { for (const id of ids) gainEvidence(id); };

// ---------- 序章 ----------
export const PROLOGUE: Almanac = {
  lunar: '十月十九',
  yi: '祭祀　祈福',
  ji: '出火',
  source: '萬舺青嶺宮誌・卷三',
  text: '每歲十月二十、二十一，王爺夜巡，謂之暗訪。七爺八爺前導，捕陰陽二界作祟者；文武判官隨後，鞫之於廟。凡人但見燈火鑼鼓，不知其事。\n是歲十九夜，宮中香爐之香，無風自斷者三。',
};

export const PROLOGUE_JIAO = {
  ask: '明日是否照常暗訪？',
  holy: { text: '聖杯。王爺應允，眾人振奮。', morale: 10, incense: 0 },
  laugh: { text: '笑杯。阿土伯：「王爺在笑我們多問。照舊。」', morale: 0, incense: 5 },
  yin: { text: '陰杯。阿土伯：「不是不去，是要更小心。」多備了香火，大家心裡卻有點沉。', morale: -5, incense: 10 },
};

// ---------- 信徒卡 ----------
export const CARDS: Record<string, (r: RunState) => Card | null> = {
  axiuMarket: (r) => r.b.axiu !== 'sick' ? null : {
    who: '阿秀嬸',
    text: '在市場賣菜的阿嬤。孫子阿弟這幾天夜夜啼哭、發燒不退，她一邊顧攤一邊掉眼淚。',
    deadline: '明日',
    options: [
      {
        label: '收驚', hours: 1, incense: 5, gives: ['axiu'],
        result: '阿弟暫時好一點，明天不會加重。要根治，得找出夜裡纏著他的東西',
        apply: (s) => { s.b.axiu = 'eased'; give('axiu'); return '七爺的扇子在阿弟頭上輕輕一搧。阿秀嬸說：「每晚子時哭，摸他額頭冰冰的，可是又在燒。」'; },
      },
    ],
    ignore: '明天阿弟會燒到住院',
  },
  clinic: (r) => r.b.axiu !== 'worse' ? null : {
    who: '阿秀嬸',
    text: '阿弟燒到昏睡，被送進了診所。醫生說查不出原因。阿秀嬸坐在走廊，一直唸著王爺的名字。',
    deadline: '今晚',
    options: [
      {
        label: '顯現神蹟', hours: 2, miracle: true, gives: ['axiu'],
        result: '阿弟當場退燒，阿秀嬸逢人就說：信徒 +12',
        apply: (s) => { s.b.axiu = 'cured'; gain(s, { followers: 12 }); give('axiu'); return '神轎停在診所門口。阿弟忽然睜開眼睛，說：「阿嬤，我肚子餓。」'; },
      },
      {
        label: '問夜裡的情形', hours: 1, gives: ['axiu'],
        result: '得到證詞。要救阿弟，今晚得審古井邊的鬼',
        apply: (s) => { give('axiu'); void s; return '「每晚子時哭，摸他額頭冰冰的，可是又在燒。」阿秀嬸說著又紅了眼眶。'; },
      },
    ],
    ignore: '今晚沒審古井邊的鬼的話：阿弟要住院一週',
  },
  azheDay1: (r) => r.b.azhe !== 'unmet' ? null : {
    who: '阿哲',
    text: '冰果室第二代，剛從國外回來接手老店。他站在店門口皺眉：「這麼多鞭炮，客人都被嚇跑了。店已經快撐不下去了。」',
    options: [
      {
        label: '請阿土伯跟他聊聊', hours: 1, gives: ['azhe'],
        result: '他態度軟化；也說出店裡的怪事',
        apply: (s) => { s.b.azhe = 'softened'; give('azhe'); return '阿哲嘆氣：「冰庫半夜自己斷電，客人說店裡很冷、坐不住。這樣怎麼做下去？」'; },
      },
      {
        label: '顯現神蹟', hours: 2, miracle: true, gives: ['azhe'],
        result: '他親眼看到七爺八爺，當場信了：信徒 +10',
        apply: (s) => { s.b.azhe = 'believer'; gain(s, { followers: 10 }); give('azhe'); return '一陣冷風掠過，七爺的扇子一擋。那一瞬間，阿哲看見了。他愣了很久才說：「……冰庫半夜斷電，是不是也是……」'; },
      },
    ],
    ignore: '第三天，冰果室恐怕要收掉',
  },
  school: (r) => r.b.xiaoyun !== 'unmet' ? null : {
    who: '小芸',
    text: '一個三年級的小女孩，一直盯著七爺看。同學在旁邊笑她：「說謊精，又說看到鬼了。」',
    options: [
      {
        label: '讓八爺給她一張平安符', hours: 1, gives: ['yun_river'],
        result: '她記住了這支隊伍；也說了河邊看到的東西',
        apply: (s) => { s.b.xiaoyun = 'met'; give('yun_river'); return '八爺把平安符放進她手心。小芸小聲說：「河邊有一個濕濕的叔叔，一直叫我下去幫他撿球。」'; },
      },
    ],
    ignore: '明天要保護她會多花時間',
  },
  xiaoyunHome: (r) => {
    if (r.b.xiaoyun === 'met') {
      return {
        who: '小芸',
        text: '昨晚有東西跟著小芸回家。她抱著那張平安符縮在床角，一夜沒睡。',
        deadline: '今天',
        options: [{ label: '安符', hours: 1, gives: ['yun_pot'], result: '小芸得到保護；也說了冰果室的事', apply: (s) => { s.b.xiaoyun = 'protected'; give('yun_pot'); return '八爺在她房門口貼了符。小芸說：「冰果室裡有個阿公，每天晚上把一個大鍋子拿出來放在桌上。」'; } }],
        ignore: '她從此不敢再說自己看到什麼',
      };
    }
    if (r.b.xiaoyun === 'unmet') {
      return {
        who: '小芸',
        text: '小芸的媽媽很擔心：女兒說有黑黑的東西在看她，已經兩天不肯睡覺。',
        deadline: '今天',
        options: [{ label: '收驚＋安符', hours: 2, gives: ['yun_river', 'yun_pot'], result: '小芸得到保護；說了河邊和冰果室看到的東西', apply: (s) => { s.b.xiaoyun = 'protected'; give('yun_river', 'yun_pot'); return '小芸終於肯說話了：「河邊有一個濕濕的叔叔……還有冰果室裡，有個阿公每天晚上拿出一個大鍋子。」'; } }],
        ignore: '她從此不敢再說自己看到什麼',
      };
    }
    return null;
  },
  longling: () => ({
    who: '寺方',
    text: '寺方在門口擺了香案，請青嶺王停轎會香。',
    options: [{ label: '停轎會香', hours: 1, result: '香火 +15', apply: (s) => { gain(s, { incense: 15 }); return '兩邊的鑼鼓一起響，信眾擠滿了寺前廣場。'; } }],
    ignore: '沒什麼影響',
  }),
  farm: (r) => r.b.axiong !== 'angry' ? null : {
    who: '阿雄',
    text: '菜園一夜被啃得只剩梗，泥地上是比牛還大的蹄印。阿雄扛著捕獸夾：「我今晚就上山，抓那頭畜生！」',
    deadline: '今天',
    options: [
      {
        label: '祭解並勸阻', hours: 2, incense: 10, gives: ['axiong'],
        result: '他放棄上山；也說了蹄印的方向',
        apply: (s) => { s.b.axiong = 'calmed'; give('axiong'); return '阿雄放下捕獸夾，蹲下來指著蹄印：「全部都是往北，一路往龍嶺寺那邊去。不像在找吃的，像在找路。」'; },
      },
    ],
    ignore: '他會上山設捕獸夾。石駒被夾傷暴怒：最後一戰更難',
  },
  stone: (r) => r.b.linbo !== 'unmet' ? null : {
    who: '林伯',
    text: '石材行的老石匠，一邊磨石一邊看著隊伍。「你們是要去找那匹馬吧？」',
    options: [
      {
        label: '聽他說石駒的事', hours: 2, gives: ['linbo'],
        result: '得到石駒的傳說；也知道牠肚子上的舊傷（最後一戰的弱點）',
        apply: (s) => { s.b.linbo = 'told'; s.intel.bellyWound = true; give('linbo'); return '「那匹馬是跟著聖王出征的。聖王走了，牠被留在山上；後來莊裡的人鑿了牠的肚子。牠最痛的就是那裡。」'; },
      },
    ],
    ignore: '第三天還有一次機會在山腳遇到他',
  },
  foothill: (r) => r.b.linbo !== 'unmet' ? null : {
    who: '林伯',
    text: '老石匠坐在山腳的石頭上，像是在等你們。',
    options: [
      {
        label: '聽他說石駒的事', hours: 2, gives: ['linbo'],
        result: '得到石駒的傳說；也知道牠肚子上的舊傷（最後一戰的弱點）',
        apply: (s) => { s.b.linbo = 'told'; s.intel.bellyWound = true; give('linbo'); return '「那匹馬不是壞東西。聖王走了，牠被留在山上等。後來有人鑿了牠的肚子，冷風一直灌進去。」'; },
      },
    ],
    ignore: '最後一戰沒有弱點可打',
  },
  trail: (r) => r.b.axiong !== 'trapped' ? null : {
    who: '阿雄',
    text: '阿雄昨夜上山，腳被自己的捕獸夾夾住，困在山徑上。',
    deadline: '今天',
    options: [{ label: '救他下山', hours: 1, result: '阿雄平安下山（石駒仍然暴怒）', apply: (s) => { s.b.axiong = 'rescued'; gain(s, { followers: 3 }); return '八將合力扳開捕獸夾。阿雄紅著眼眶：「是我太衝動了。」'; } }],
    ignore: '遺憾：傷了腳，菜園荒廢一季',
  },
  school3: (r) => r.b.xiaoyun !== 'protected' ? null : {
    who: '小芸',
    text: '小芸跑到校門口：「那匹石頭馬一直在哭。我可以去看牠嗎？」',
    options: [
      {
        label: '邀她黃昏到惠澤宮', hours: 1,
        result: '最後一戰：石駒煞氣一開始少 20%，第一次衝鋒會被她喊停',
        apply: (s) => { s.b.xiaoyun = 'invited'; return '小芸用力點頭。她是全萬舺唯一一個，看得見今晚那場戰爭的凡人。'; },
      },
    ],
    ignore: '她只能在家裡擔心',
  },
  azheDay3: (r) => {
    const z = r.b.azhe;
    if (z === 'believer') {
      return {
        who: '阿哲', text: '冰果室門口擺了香案。阿哲舉著手機：「我想把遶境拍下來。」',
        options: [{ label: '停轎', hours: 1, result: '他把影片傳上網：信徒 +15', apply: (s) => { s.b.azhe = 'stayed'; gain(s, { followers: 15 }); return '影片一晚上被轉了好幾千次。很多人留言：「我小時候也在那間冰果室吃過剉冰。」'; } }],
        ignore: '他還是會留下老店，只是少了這段影片',
      };
    }
    if (z === 'softened') {
      return {
        who: '阿哲', text: '阿哲在店門口猶豫：「我還在想要不要把店收掉。」',
        deadline: '今天',
        options: [{ label: '停轎說說話', hours: 1, gives: ['azhe'], result: '他決定再做做看：信徒 +6', apply: (s) => { s.b.azhe = 'stayed'; gain(s, { followers: 6 }); give('azhe'); return '阿土伯拍拍他的肩：「你阿公當年也是這樣猶豫過。」阿哲笑了：「那就再做做看。」'; } }],
        ignore: '遺憾：冰果室收掉',
      };
    }
    if (z === 'unmet') {
      return {
        who: '阿哲', text: '冰果室的鐵門上貼了「頂讓」。阿哲在裡面打包。',
        deadline: '今天',
        options: [{ label: '顯現神蹟', hours: 2, miracle: true, gives: ['azhe'], result: '他決定留下老店：信徒 +10', apply: (s) => { s.b.azhe = 'stayed'; gain(s, { followers: 10 }); give('azhe'); return '一陣金光掠過店門口。阿哲撕下了「頂讓」的紙。'; } }],
        ignore: '遺憾：冰果室收掉',
      };
    }
    return null;
  },
  huize: (r) => r.allied ? null : {
    who: '惠澤宮廟方',
    text: '惠澤宮的廟方帶著令旗隊在山門口等候。「聽說石駒的事了。今晚，一起吧。」',
    options: [{ label: '會香，結為交陪', hours: 1, result: '惠澤宮令旗隊今晚助陣；香火 +10', apply: (s) => { s.allied = true; gain(s, { incense: 10 }); return '兩廟互換香旗。開疆聖王的令旗隊，今晚會站在你這邊。'; } }],
    ignore: '今晚沒有令旗隊助陣',
  },
};

// ---------- 因果簿 ----------
export interface LedgerLine {
  who: string;
  state: string;
  tone: 'good' | 'warn' | 'bad' | 'none';
}

export function ledger(r: RunState): LedgerLine[] {
  const b = r.b;
  const axiu: Record<BelieverState['axiu'], LedgerLine> = {
    sick: { who: '阿秀嬸', state: '孫子發燒（明天會住院；根源在夜裡纏著他的東西）', tone: 'warn' },
    eased: { who: '阿秀嬸', state: '阿弟暫時好一點（第二夜前要審古井邊的鬼）', tone: 'warn' },
    worse: { who: '阿秀嬸', state: '阿弟昏睡在診所（今晚要審古井邊的鬼，或顯現神蹟）', tone: 'bad' },
    cured: { who: '阿秀嬸', state: '阿弟退燒了', tone: 'good' },
    regret: { who: '阿秀嬸', state: '阿弟住院一週', tone: 'bad' },
  };
  const xiaoyun: Record<BelieverState['xiaoyun'], LedgerLine> = {
    unmet: { who: '小芸', state: '還沒見過（第二天結束前要保護她）', tone: 'warn' },
    met: { who: '小芸', state: '收下了平安符（第二天要去她家安符）', tone: 'warn' },
    protected: { who: '小芸', state: '受到保護（第三天可以邀她來）', tone: 'good' },
    invited: { who: '小芸', state: '黃昏會到惠澤宮', tone: 'good' },
    lost: { who: '小芸', state: '從此不敢說自己看到什麼', tone: 'bad' },
  };
  const azhe: Record<BelieverState['azhe'], LedgerLine> = {
    unmet: { who: '阿哲', state: '不信（第三天只剩神蹟留得住老店）', tone: 'warn' },
    softened: { who: '阿哲', state: '態度軟化（第三天停轎就能留住老店）', tone: 'warn' },
    believer: { who: '阿哲', state: '親眼看見了，信了', tone: 'good' },
    stayed: { who: '阿哲', state: '決定留下冰果室', tone: 'good' },
    closed: { who: '阿哲', state: '冰果室收掉了', tone: 'bad' },
  };
  const axiong: Record<BelieverState['axiong'], LedgerLine> = {
    angry: { who: '阿雄', state: '要上山抓「那頭畜生」（第二天結束前）', tone: 'warn' },
    calmed: { who: '阿雄', state: '放下捕獸夾了', tone: 'good' },
    trapped: { who: '阿雄', state: '被自己的捕獸夾困在山上（第三天要救）', tone: 'bad' },
    rescued: { who: '阿雄', state: '平安下山', tone: 'good' },
    hurt: { who: '阿雄', state: '傷了腳', tone: 'bad' },
  };
  const linbo: Record<BelieverState['linbo'], LedgerLine> = {
    unmet: { who: '林伯', state: '還沒聽他說石駒的事（第二、三天有機會）', tone: 'warn' },
    told: { who: '林伯', state: '說了石駒的傳說與舊傷', tone: 'good' },
  };
  return [axiu[b.axiu], xiaoyun[b.xiaoyun], azhe[b.azhe], axiong[b.axiong], linbo[b.linbo]];
}

/** 最後一戰的狀況（白天累積的結果） */
export function bossEffects(r: RunState): string[] {
  const out: string[] = [];
  if (r.bossAdds) out.push(`小妖多 ${r.bossAdds} 波（神蹟外洩、沒驅散的小妖）`);
  out.push(r.shijuEnraged ? '石駒被捕獸夾所傷，暴怒：衝鋒更頻繁、更痛、煞氣更重' : '石駒沒有受傷');
  if (r.b.xiaoyun === 'invited') out.push('小芸在場：石駒煞氣 -20%，第一次衝鋒會被喊停');
  if (r.allied) out.push('惠澤宮令旗隊助陣（交陪）');
  if (r.intel.bellyWound) out.push('知道石駒肚子的舊傷：喘息時傷害大增');
  return out;
}

// ---------- 信徒錄（結局） ----------
export interface Epitaph {
  who: string;
  good: boolean;
  text: string;
}

export function epitaphs(r: RunState): Epitaph[] {
  const b = r.b;
  return [
    b.axiu === 'cured'
      ? { who: '阿秀嬸與阿弟', good: true, text: '阿弟退燒那天，阿秀嬸在攤子上多送了每個客人一把青蔥。' }
      : { who: '阿秀嬸與阿弟', good: false, text: '阿弟住院一週。出院後，阿秀嬸再也不讓他晚上出門。' },
    b.xiaoyun === 'invited' || b.xiaoyun === 'protected'
      ? { who: '小芸', good: true, text: '後來她在作文裡寫：我看過一匹石頭馬回家。老師給了甲上。' }
      : { who: '小芸', good: false, text: '她從此說，自己什麼都沒看到。' },
    b.azhe === 'stayed'
      ? { who: '阿哲', good: true, text: '冰果室的招牌重新漆過。他說，再做十年看看。' }
      : { who: '阿哲', good: false, text: '冰果室收了。鐵門上貼著「感謝五十年來的照顧」。' },
    b.axiong === 'calmed'
      ? { who: '阿雄', good: true, text: '隔年春天，菜園收成比往年都好。' }
      : b.axiong === 'rescued'
        ? { who: '阿雄', good: true, text: '腳上的傷養了一個月。菜園總算保住了。' }
        : { who: '阿雄', good: false, text: '傷了腳，菜園荒廢了一季。' },
    b.linbo === 'told'
      ? { who: '林伯', good: true, text: '他刻了一匹小石馬，送到惠澤宮供著。' }
      : { who: '林伯', good: false, text: '沒有人再來聽他說那匹馬的故事。' },
  ];
}
