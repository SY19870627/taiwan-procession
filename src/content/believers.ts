/**
 * 白天：三天的黃曆、路線、停轎地點與信徒卡（依「信徒故事大綱 v0.1」）。
 *
 * 原則：每個選項都事先寫清楚花費、結果、不處理的後果與期限，玩家不用猜。
 * 遊戲中一律用虛構名稱（萬舺、青嶺宮、芝林、芝嶺巖、惠澤宮、開疆聖王、石駒）。
 */
import type { RunState } from '../state';

// ---------- 五位信徒的狀態 ----------
export interface BelieverState {
  /** 阿秀嬸與孫子阿弟 */
  axiu: 'sick' | 'worse' | 'cured' | 'regret';
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
/** 每次神蹟讓當晚多出的妖怪波數 */
export const MIRACLE_WAVES = 2;

// ---------- 信徒卡 ----------
export interface Option {
  label: string;
  /** 花幾個時辰 */
  hours: number;
  /** 花多少香火 */
  incense?: number;
  /** 要用掉一次神蹟（另外扣香火 20、今晚妖怪 +2 波） */
  miracle?: boolean;
  /** 需要的情報 */
  needs?: 'salt';
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

export interface Stop {
  id: string;
  place: string;
  /** 在地圖上的位置（0–1，相對於地圖區域） */
  x: number;
  y: number;
  /** 依目前狀態產生信徒卡；回傳 null 表示這裡今天沒有需要處理的事 */
  card: (r: RunState) => Card | null;
}

export interface Route {
  id: string;
  name: string;
  color: number;
  stops: Stop[];
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

export interface DayPlan {
  day: number;
  title: string;
  area: string;
  hours: number;
  miracles: number;
  almanac: (r: RunState) => Almanac;
  start: { x: number; y: number; label: string };
  routes: Route[];
  /** 地圖上畫什麼：河、山、田 */
  map: { river: boolean; hill: boolean; fields: boolean };
  /** 一天結束：處理過期的事，回傳明天黃曆「昨日」欄的文字 */
  endOfDay: (r: RunState) => string[];
}

const gain = (r: RunState, d: { incense?: number; followers?: number; morale?: number }) => {
  if (d.incense) r.incense = Math.max(0, r.incense + d.incense);
  if (d.followers) r.followers = Math.max(0, r.followers + d.followers);
  if (d.morale) r.morale = Math.max(0, Math.min(100, r.morale + d.morale));
};

// ---------- 序章 ----------
export const PROLOGUE: Almanac = {
  lunar: '十月十九',
  yi: '祭祀　祈福',
  ji: '出火',
  source: '萬舺青嶺宮誌・卷三',
  text: '每歲十月二十、二十一，王爺夜巡，謂之暗訪。七爺八爺前導，捕陰陽二界作祟者；文武判官隨後，鞫之於廟。凡人但見燈火鑼鼓，不知其戰。\n是歲十九夜，宮中香爐之香，無風自斷者三。',
};

export const PROLOGUE_JIAO = {
  ask: '明日是否照常暗訪？',
  holy: { text: '聖杯。王爺應允，眾人振奮。', morale: 10, incense: 0 },
  laugh: { text: '笑杯。阿土伯：「王爺在笑我們多問。照舊。」', morale: 0, incense: 5 },
  yin: { text: '陰杯。阿土伯：「不是不去，是要更小心。」多備了香火，大家心裡卻有點沉。', morale: -5, incense: 10 },
};

// ---------- 三天 ----------
const stopAxiuMarket: Stop = {
  id: 'market', place: '菜市場', x: 0.3, y: 0.32,
  card: (r) => r.b.axiu !== 'sick' ? null : {
    who: '阿秀嬸',
    text: '在市場賣菜的阿嬤。孫子阿弟這幾天夜夜啼哭、發燒不退，她一邊顧攤一邊掉眼淚。',
    deadline: '明日黃昏',
    options: [
      {
        label: '收驚', hours: 1, incense: 5,
        result: '阿弟當晚退燒。阿秀嬸在市場幫忙號召：信徒 +6',
        apply: (s) => { s.b.axiu = 'cured'; gain(s, { followers: 6 }); return '七爺的扇子在阿弟頭上輕輕一搧。當晚，阿弟睡得很沉，燒也退了。隔天一早，阿秀嬸逢人就說。'; },
      },
    ],
    ignore: '明天病情加重，只剩神蹟（或「鹽米」）救得了',
  },
};

const stopAzheDay1: Stop = {
  id: 'icefruit', place: '冰果室', x: 0.52, y: 0.5,
  card: (r) => r.b.azhe !== 'unmet' ? null : {
    who: '阿哲',
    text: '冰果室第二代，剛從國外回來接手老店。他站在店門口皺眉：「這麼多鞭炮，客人都被嚇跑了。可以繞路嗎？」',
    options: [
      {
        label: '請阿土伯跟他聊聊', hours: 1,
        result: '他態度軟化。第三天只要停轎說說話，就能留住老店',
        apply: (s) => { s.b.azhe = 'softened'; return '阿土伯跟他聊起他阿公開店那年的遶境。阿哲沒說什麼，只是把鐵門拉高了一點。'; },
      },
      {
        label: '顯現神蹟', hours: 2, miracle: true,
        result: '他親眼看到七爺八爺擋下撲向他的小魍，當場信了：信徒 +10',
        apply: (s) => { s.b.azhe = 'believer'; gain(s, { followers: 10 }); return '一陣冷風撲向阿哲，七爺的扇子一擋，風停了。那一瞬間，他看見了。阿哲愣在原地，手裡的抹布掉在地上。'; },
      },
    ],
    ignore: '他不會再想起這支隊伍。第三天，冰果室恐怕要收掉',
  },
};

const stopBuzhuang: Stop = {
  id: 'cloth', place: '布莊', x: 0.72, y: 0.3,
  card: () => ({
    who: '老闆娘',
    text: '老闆娘擺好香案，等隊伍經過要拜一拜。',
    options: [{ label: '停轎', hours: 1, result: '香火 +10', apply: (s) => { gain(s, { incense: 10 }); return '老闆娘拜得很虔誠，還往香擔裡塞了紅包。'; } }],
    ignore: '沒什麼影響',
  }),
};

const stopSchoolDay1: Stop = {
  id: 'school', place: '國小門口', x: 0.32, y: 0.72,
  card: (r) => r.b.xiaoyun !== 'unmet' ? null : {
    who: '小芸',
    text: '一個三年級的小女孩，一直盯著七爺看。同學在旁邊笑她：「說謊精，又說看到鬼了。」',
    options: [
      {
        label: '讓八爺給她一張平安符', hours: 1,
        result: '她記住了這支隊伍，之後要保護她會容易很多',
        apply: (s) => { s.b.xiaoyun = 'met'; return '八爺彎下腰，把平安符放進她手心。小芸抬頭，對著八爺的臉——真正的那張臉——笑了。'; },
      },
    ],
    ignore: '明天她會被小魍跟回家，處理起來要多花時間',
  },
};

const stopElders: Stop = {
  id: 'elders', place: '老人會', x: 0.55, y: 0.78,
  card: () => ({
    who: '長輩們',
    text: '長輩們搬了板凳坐在門口，說好久沒看到醒獅了。',
    options: [{ label: '醒獅表演', hours: 1, result: '士氣 +10', apply: (s) => { gain(s, { morale: 10 }); return '醒獅一甩頭，長輩們拍手叫好。隊伍的精神也跟著提起來。'; } }],
    ignore: '沒什麼影響',
  }),
};

const stopNest: Stop = {
  id: 'nest', place: '河岸・小魍巢', x: 0.12, y: 0.5,
  card: () => ({
    who: '一窩小魍',
    text: '凡人只看到一片堆滿垃圾的河岸。靈界裡，這裡聚了一窩小魍。',
    options: [{ label: '先清巢', hours: 2, result: '今晚妖怪 -2 波', apply: (s) => { s.tonight.cleared = true; return '八將衝進暗處，小魍四散逃竄。今晚會輕鬆一些。'; } }],
    ignore: '今晚照常',
  }),
};

const stopClinic: Stop = {
  id: 'clinic', place: '診所', x: 0.3, y: 0.35,
  card: (r) => r.b.axiu !== 'worse' ? null : {
    who: '阿秀嬸',
    text: '阿弟燒到昏睡，被送進了診所。醫生說查不出原因。阿秀嬸坐在走廊，一直唸著王爺的名字。',
    deadline: '今日黃昏',
    options: [
      {
        label: '顯現神蹟', hours: 2, miracle: true,
        result: '阿弟當場退燒，阿秀嬸逢人就說：信徒 +12',
        apply: (s) => { s.b.axiu = 'cured'; gain(s, { followers: 12 }); return '神轎停在診所門口。阿弟忽然睜開眼睛，說：「阿嬤，我肚子餓。」'; },
      },
      {
        label: '撒鹽米驅魍', hours: 1, incense: 5, needs: 'salt',
        result: '纏著阿弟的小魍被趕走：信徒 +6',
        apply: (s) => { s.b.axiu = 'cured'; gain(s, { followers: 6 }); return '判官說得沒錯，小魍最怕鹽米。一把撒下去，病房裡的冷氣好像都暖了。'; },
      },
    ],
    ignore: '遺憾：阿弟要住院一週',
  },
};

const stopXiaoyunHome: Stop = {
  id: 'home', place: '小芸家', x: 0.55, y: 0.6,
  card: (r) => {
    if (r.b.xiaoyun === 'met') {
      return {
        who: '小芸',
        text: '昨晚有小魍跟著小芸回家。她抱著那張平安符縮在床角，一夜沒睡。',
        deadline: '今日黃昏',
        options: [{ label: '安符', hours: 1, result: '小芸得到保護，之後會信任這支隊伍', apply: (s) => { s.b.xiaoyun = 'protected'; return '八爺在她房門口貼了符。小芸小聲說：「謝謝你們。牠們走了。」'; } }],
        ignore: '她從此不敢再說自己看到什麼',
      };
    }
    if (r.b.xiaoyun === 'unmet') {
      return {
        who: '小芸',
        text: '小芸的媽媽很擔心：女兒說家裡有黑黑的東西在看她，已經兩天不肯睡覺。',
        deadline: '今日黃昏',
        options: [
          { label: '收驚＋安符', hours: 2, result: '小芸得到保護', apply: (s) => { s.b.xiaoyun = 'protected'; return '收驚、安符，花了不少時間。小芸終於睡著了，手裡抓著七爺的一角衣袖——凡人看來，她只是抓著空氣。'; } },
          { label: '撒鹽米驅魍', hours: 1, incense: 5, needs: 'salt', result: '小芸得到保護', apply: (s) => { s.b.xiaoyun = 'protected'; return '鹽米一撒，躲在床底的小魍竄了出去。小芸探出頭：「牠走了。」'; } },
        ],
        ignore: '她從此不敢再說自己看到什麼',
      };
    }
    return null;
  },
};

const stopLongling: Stop = {
  id: 'longling', place: '龍嶺寺前', x: 0.78, y: 0.4,
  card: () => ({
    who: '寺方',
    text: '寺方在門口擺了香案，請青嶺王停轎會香。',
    options: [{ label: '停轎會香', hours: 1, result: '香火 +15', apply: (s) => { gain(s, { incense: 15 }); return '兩邊的鑼鼓一起響，信眾擠滿了寺前廣場。'; } }],
    ignore: '沒什麼影響',
  }),
};

const stopFarm: Stop = {
  id: 'farm', place: '芝林菜園', x: 0.38, y: 0.68,
  card: (r) => r.b.axiong !== 'angry' ? null : {
    who: '阿雄',
    text: '菜園一夜被啃得只剩梗，泥地上是比牛還大的蹄印。阿雄扛著捕獸夾：「我今晚就上山，抓那頭畜生！」',
    deadline: '今日黃昏',
    options: [
      {
        label: '祭解並勸阻', hours: 2, incense: 10,
        result: '他放棄上山；而且告訴你蹄印都從北邊來（今晚預知妖怪主力在右側）',
        apply: (s) => { s.b.axiong = 'calmed'; s.intel.mainSide = 1; return '阿雄放下捕獸夾，蹲下來指著蹄印：「你們看，全部都是從北邊下來的。」'; },
      },
    ],
    ignore: '他會上山設捕獸夾。石駒被夾傷暴怒：第三夜衝鋒更頻繁、更痛',
  },
};

const stopStone: Stop = {
  id: 'stone', place: '石材行', x: 0.68, y: 0.45,
  card: (r) => r.b.linbo !== 'unmet' ? null : {
    who: '林伯',
    text: '石材行的老石匠，一邊磨石一邊看著隊伍。「你們是要去找那匹馬吧？」',
    options: [
      {
        label: '聽他說石駒的事', hours: 2,
        result: '情報：石駒肚子上的舊傷（魔王戰弱點）',
        apply: (s) => { s.b.linbo = 'told'; s.intel.bellyWound = true; return '「那匹馬以前是跟著聖王出征的。肚子上那個洞，是早年被人鑿的。牠最痛的就是那裡。」'; },
      },
    ],
    ignore: '第三天還有一次機會在山腳遇到他',
  },
};

const stopFoothill: Stop = {
  id: 'foothill', place: '山腳', x: 0.3, y: 0.62,
  card: (r) => r.b.linbo !== 'unmet' ? null : {
    who: '林伯',
    text: '老石匠坐在山腳的石頭上，像是在等你們。',
    options: [
      {
        label: '聽他說石駒的事', hours: 2,
        result: '情報：石駒肚子上的舊傷（魔王戰弱點）',
        apply: (s) => { s.b.linbo = 'told'; s.intel.bellyWound = true; return '「那匹馬不是壞東西。牠只是餓，肚子那個洞又一直灌風，冷。」'; },
      },
    ],
    ignore: '魔王戰沒有弱點可打',
  },
};

const stopTrail: Stop = {
  id: 'trail', place: '山徑', x: 0.5, y: 0.35,
  card: (r) => r.b.axiong !== 'trapped' ? null : {
    who: '阿雄',
    text: '阿雄昨夜上山，腳被自己的捕獸夾夾住，困在山徑上。',
    deadline: '今日黃昏',
    options: [{ label: '救他下山', hours: 1, result: '阿雄平安下山（石駒仍然暴怒）', apply: (s) => { s.b.axiong = 'rescued'; gain(s, { followers: 3 }); return '八將合力扳開捕獸夾。阿雄紅著眼眶：「是我太衝動了。」'; } }],
    ignore: '遺憾：傷了腳，菜園荒廢一季',
  },
};

const stopSchoolDay3: Stop = {
  id: 'school3', place: '小芸的學校', x: 0.35, y: 0.4,
  card: (r) => r.b.xiaoyun !== 'protected' ? null : {
    who: '小芸',
    text: '小芸跑到校門口：「那匹石頭馬一直在哭。我可以去看牠嗎？」',
    options: [
      {
        label: '邀她黃昏到惠澤宮', hours: 1,
        result: '魔王戰：石駒煞氣一開始少 20%，第一次衝鋒會被她喊停',
        apply: (s) => { s.b.xiaoyun = 'invited'; return '小芸用力點頭。她是全萬舺唯一一個，看得見今晚那場戰爭的凡人。'; },
      },
    ],
    ignore: '她只能在家裡擔心',
  },
};

const stopAzheDay3: Stop = {
  id: 'icefruit3', place: '冰果室', x: 0.62, y: 0.62,
  card: (r) => {
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
        deadline: '今日黃昏',
        options: [{ label: '停轎說說話', hours: 1, result: '他決定留下老店：信徒 +6', apply: (s) => { s.b.azhe = 'stayed'; gain(s, { followers: 6 }); return '阿土伯拍拍他的肩：「你阿公當年也是這樣猶豫過。」阿哲笑了：「那就再做做看。」'; } }],
        ignore: '遺憾：冰果室收掉',
      };
    }
    if (z === 'unmet') {
      return {
        who: '阿哲', text: '冰果室的鐵門上貼了「頂讓」。阿哲在裡面打包。',
        deadline: '今日黃昏',
        options: [{ label: '顯現神蹟', hours: 2, miracle: true, result: '他決定留下老店：信徒 +10', apply: (s) => { s.b.azhe = 'stayed'; gain(s, { followers: 10 }); return '一陣金光掠過店門口。阿哲撕下了「頂讓」的紙。'; } }],
        ignore: '遺憾：冰果室收掉',
      };
    }
    return null;
  },
};

const stopHuize: Stop = {
  id: 'huize', place: '惠澤宮', x: 0.86, y: 0.22,
  card: (r) => r.allied ? null : {
    who: '廟方',
    text: '惠澤宮的廟方帶著令旗隊在山門口等候。「聽說石駒的事了。今晚，一起吧。」',
    options: [{ label: '會香，結為交陪', hours: 1, result: '惠澤宮令旗隊今晚助陣；香火 +10', apply: (s) => { s.allied = true; gain(s, { incense: 10 }); return '兩廟互換香旗。開疆聖王的令旗隊，今晚會站在你這邊。'; } }],
    ignore: '今晚沒有令旗隊助陣',
  },
};

export const DAY_PLANS: Record<number, DayPlan> = {
  1: {
    day: 1, title: '第一天', area: '萬舺', hours: 5, miracles: 1,
    almanac: () => ({
      lunar: '十月廿日', yi: '祭祀　出行', ji: '動土',
      source: '萬舺舊聞',
      text: '萬舺舊為番社渡口，商船輻輳。老輩言，街市愈旺，陰陽二界之物愈雜。\n是日王爺起駕暗訪，鑼鼓自青嶺宮出。',
    }),
    start: { x: 0.08, y: 0.2, label: '青嶺宮' },
    routes: [
      { id: '甲', name: '市場線', color: 0xb3261e, stops: [stopAxiuMarket, stopAzheDay1, stopBuzhuang] },
      { id: '乙', name: '學校線', color: 0x2b5aa8, stops: [stopNest, stopSchoolDay1, stopElders] },
    ],
    map: { river: true, hill: false, fields: false },
    endOfDay: (r) => {
      const out: string[] = [];
      if (r.b.axiu === 'sick') {
        r.b.axiu = 'worse';
        out.push('菜市場的阿秀嬸沒等到隊伍。阿弟燒到昏睡，今早被送進診所。');
      }
      if (r.b.xiaoyun === 'unmet') out.push('國小門口有個女孩一直往隊伍這邊看，沒有人停下來。');
      if (r.b.azhe === 'unmet') out.push('冰果室的老闆對著鞭炮皺眉，拉下了半邊鐵門。');
      return out;
    },
  },
  2: {
    day: 2, title: '第二天', area: '萬舺 → 芝林', hours: 5, miracles: 1,
    almanac: () => ({
      lunar: '十月廿一', yi: '解除　祈福', ji: '狩獵', chong: '日沖馬　煞北',
      source: '芝林舊聞',
      text: '芝嶺巖有石，狀如馬。相傳昔為開疆聖王坐騎，隨王征戰。後聖王他往，駒獨留山中，夜出食禾稼。莊人鑿其腹，駒乃不動，化為石。',
    }),
    start: { x: 0.08, y: 0.8, label: '萬舺' },
    routes: [
      { id: '甲', name: '大路線', color: 0xb3261e, stops: [stopClinic, stopXiaoyunHome, stopLongling] },
      { id: '乙', name: '河堤線', color: 0x2f8f5a, stops: [stopFarm, stopStone] },
    ],
    map: { river: true, hill: false, fields: true },
    endOfDay: (r) => {
      const out: string[] = [];
      if (r.b.axiu === 'worse') {
        r.b.axiu = 'regret';
        out.push('阿弟還躺在診所。醫生說要住院一週。');
      }
      if (r.b.xiaoyun === 'met' || r.b.xiaoyun === 'unmet') {
        r.b.xiaoyun = 'lost';
        out.push('小芸一整晚沒睡。早上她跟媽媽說：「我什麼都沒看到。」');
      }
      if (r.b.axiong === 'angry') {
        r.b.axiong = 'trapped';
        r.shijuEnraged = true;
        out.push('阿雄昨夜沒回家。半夜，山上傳來一聲馬嘶，像是痛極了。');
      }
      return out;
    },
  },
  3: {
    day: 3, title: '第三天', area: '芝林 → 芝嶺巖惠澤宮', hours: 4, miracles: 2,
    almanac: (r) => r.b.linbo === 'told'
      ? { lunar: '十月廿二', yi: '會友　祭祀', ji: '出火', source: '林伯口述', text: '「那匹馬不是壞東西。牠只是餓，肚子那個洞又一直灌風，冷。」\n是日正日，王爺遶境，與惠澤宮會香。' }
      : { lunar: '十月廿二', yi: '會友　祭祀', ji: '出火', source: '惠澤宮籤詩', text: '山中石駒久無主，夜夜長嘶望北風；若得舊人呼一聲，不須鞭策自歸宮。\n是日正日，王爺遶境，與惠澤宮會香。' },
    start: { x: 0.08, y: 0.85, label: '芝林' },
    routes: [
      { id: '甲', name: '山腳線', color: 0x7a5a2a, stops: [stopFoothill, stopTrail, stopHuize] },
      { id: '乙', name: '街區線', color: 0x2b5aa8, stops: [stopSchoolDay3, stopAzheDay3, stopHuize] },
    ],
    map: { river: false, hill: true, fields: true },
    endOfDay: (r) => {
      if (r.b.axiong === 'trapped') r.b.axiong = 'hurt';
      if (r.b.azhe === 'unmet' || r.b.azhe === 'softened') r.b.azhe = 'closed';
      if (r.b.azhe === 'believer') r.b.azhe = 'stayed';
      return [];
    },
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
    sick: { who: '阿秀嬸', state: '孫子發燒（期限：第二天黃昏）', tone: 'warn' },
    worse: { who: '阿秀嬸', state: '阿弟昏睡在診所（期限：今日黃昏，需神蹟或鹽米）', tone: 'bad' },
    cured: { who: '阿秀嬸', state: '阿弟退燒了', tone: 'good' },
    regret: { who: '阿秀嬸', state: '阿弟住院一週', tone: 'bad' },
  };
  const xiaoyun: Record<BelieverState['xiaoyun'], LedgerLine> = {
    unmet: { who: '小芸', state: '還沒見過（期限：第二天黃昏前要保護她）', tone: 'warn' },
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
    angry: { who: '阿雄', state: '要上山抓「那頭畜生」（期限：第二天黃昏）', tone: 'warn' },
    calmed: { who: '阿雄', state: '放下捕獸夾了', tone: 'good' },
    trapped: { who: '阿雄', state: '被自己的捕獸夾困在山上（第三天黃昏前要救）', tone: 'bad' },
    rescued: { who: '阿雄', state: '平安下山', tone: 'good' },
    hurt: { who: '阿雄', state: '傷了腳', tone: 'bad' },
  };
  const linbo: Record<BelieverState['linbo'], LedgerLine> = {
    unmet: { who: '林伯', state: '還沒聽他說石駒的事（第二、三天有機會）', tone: 'warn' },
    told: { who: '林伯', state: '說了石駒的舊傷', tone: 'good' },
  };
  return [axiu[b.axiu], xiaoyun[b.xiaoyun], azhe[b.azhe], axiong[b.axiong], linbo[b.linbo]];
}

/** 會影響今晚、第三夜的效果 */
export function nightEffects(r: RunState, night: number): string[] {
  const out: string[] = [];
  if (r.tonight.miracles) out.push(`神蹟外洩：妖怪 +${r.tonight.miracles * MIRACLE_WAVES} 波（從正面來）`);
  if (r.tonight.cleared) out.push('清了小魍巢：妖怪 -2 波');
  if (night === 2 && r.intel.mainSide) out.push('阿雄看過蹄印：妖怪主力從右側（北）來');
  if (night === 3) {
    out.push(r.shijuEnraged ? '石駒被捕獸夾所傷，暴怒：衝鋒更頻繁、更痛' : '石駒沒有受傷');
    if (r.b.xiaoyun === 'invited') out.push('小芸在場：石駒煞氣 -20%，第一次衝鋒會被喊停');
    if (r.allied) out.push('惠澤宮令旗隊助陣（交陪）');
  }
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
      : { who: '阿哲', good: false, text: '冰果室收了。鐵門上貼著「感謝四十年來的照顧」。' },
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
