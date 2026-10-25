/**
 * 白天：祈福路線與事件。
 * 事件在路程的某個進度觸發，隊伍停下來讓玩家選擇；擲筊事件要請示神明。
 */
import type { StreetTheme } from '../art/backdrop';

export interface Outcome {
  incense?: number;
  followers?: number;
  morale?: number;
  /** 結果說明 */
  text: string;
  /** 額外效果 */
  effect?: 'ally' | 'bellyWound' | 'mainSideRight';
}

export interface Choice {
  label: string;
  outcome: Outcome;
}

export interface DayEvent {
  /** 路程進度 0–1 */
  at: number;
  title: string;
  text: string;
  /** 一般事件：兩個選項；擲筊事件：請示一件事，依結果決定 */
  choices?: Choice[];
  jiao?: { ask: string; holy: Outcome; laugh: Outcome; yin: Outcome };
}

export interface DayDef {
  title: string;
  route: string;
  theme: StreetTheme;
  /** 這一天從城市漸漸到鄉間（0 城市、1 全是田和樹） */
  ruralFrom: number;
  ruralTo: number;
  /** 走完一天要多久（秒） */
  length: number;
  /** 新聞跑馬燈（陽間看到的怪事） */
  news: string[];
  events: DayEvent[];
  /** 黃昏的妖怪視角過場 */
  dusk: string;
}

export const DAYS: Record<number, DayDef> = {
  1: {
    title: '第一天',
    route: '萬舺青嶺宮 起駕・萬舺街區祈福',
    theme: 'city',
    ruralFrom: 0,
    ruralTo: 0,
    length: 42,
    news: [
      '【地方】龍嶺寺一帶，入夜後狗吠不停，居民睡不安穩',
      '【地方】萬舺多家店鋪清晨發現，門口的香爐倒了',
      '【民俗】青嶺王暗訪今年提前起駕，廟方：「神明指示」',
    ],
    events: [
      {
        at: 0.22,
        title: '騎樓下的阿嬤',
        text: '一位阿嬤端著一大壺青草茶，站在騎樓下等隊伍經過。\n「辛苦了，喝一杯再走！」',
        choices: [
          { label: '停下來喝', outcome: { morale: 15, text: '轎班喝了青草茶，精神都來了。（士氣 +15）' } },
          { label: '謝謝阿嬤，繼續走', outcome: { incense: 8, text: '阿嬤硬是往香擔裡塞了香油錢。（香火 +8）' } },
        ],
      },
      {
        at: 0.5,
        title: '岔路',
        text: '前面分成大街和一條窄巷。\n報馬仔問：要不要穿小巷？請示青嶺王。',
        jiao: {
          ask: '穿小巷？',
          holy: { incense: 15, followers: 3, text: '聖杯！穿進小巷，巷底有一座被遺忘的土地公小祠。重新上了香，附近住戶也跟著出來。（香火 +15、信徒 +3）' },
          laugh: { morale: 5, text: '笑杯，神明笑而不答。大家笑了一陣，還是走大街。（士氣 +5）' },
          yin: { followers: 5, text: '陰杯，不穿小巷。大街上人多，沿路又有信徒加入。（信徒 +5）' },
        },
      },
      {
        at: 0.76,
        title: '冰果室老闆',
        text: '冰果室老闆搬出一大綑鞭炮：「青嶺王經過，一定要放！」',
        choices: [
          { label: '讓他放', outcome: { followers: 4, incense: 5, text: '鞭炮炸得滿街紅紙，看熱鬧的人都跟了上來。（信徒 +4、香火 +5）' } },
          { label: '巷子窄，小心為上', outcome: { morale: 6, text: '老闆改成在門口點了三炷香。隊伍走得很穩。（士氣 +6）' } },
        ],
      },
    ],
    dusk: 'dusk1',
  },
  2: {
    title: '第二天',
    route: '萬舺 → 芝林',
    theme: 'mixed',
    ruralFrom: 0.1,
    ruralTo: 0.7,
    length: 46,
    news: [
      '【地方】芝林菜農：高麗菜一夜之間被啃得只剩梗',
      '【地方】芝林夜裡傳出馬蹄聲，但附近沒有人養馬',
      '【交通】芝嶺巖步道今起暫時封閉，原因未說明',
    ],
    events: [
      {
        at: 0.25,
        title: '轎班扭到腳',
        text: '扛轎的阿雄踩到坑洞，腳扭了一下。\n他咬著牙說：「我還可以。」',
        choices: [
          { label: '停下來推拿', outcome: { morale: 8, incense: -5, text: '路邊國術館的師傅幫忙推拿，阿雄很快就回到轎班。（士氣 +8、香火 -5）' } },
          { label: '請信徒接手', outcome: { followers: -2, morale: 4, text: '兩位年輕信徒自願接手扛轎。（信徒 -2、士氣 +4）' } },
        ],
      },
      {
        at: 0.5,
        title: '被啃光的菜園',
        text: '一位菜農攔住隊伍：「我的菜一夜被啃光，地上還有好大的蹄印！」',
        choices: [
          { label: '幫他祭解', outcome: { incense: -10, followers: 6, text: '為菜園祭解。菜農一家和鄰居都加入了隊伍。（香火 -10、信徒 +6）' } },
          { label: '仔細查看蹄印', outcome: { effect: 'mainSideRight', text: '蹄印全都是從北邊來的。今晚妖怪會從北邊，也就是右邊攻來。（得到情報）' } },
        ],
      },
      {
        at: 0.78,
        title: '溪邊',
        text: '隊伍來到溪邊，大家都走累了。\n要不要在這裡休息？請示青嶺王。',
        jiao: {
          ask: '在溪邊休息？',
          holy: { morale: 15, text: '聖杯！大家在溪邊洗把臉、吃點心。（士氣 +15）' },
          laugh: { morale: 5, text: '笑杯，神明似乎覺得大家太累了，邊走邊休息吧。（士氣 +5）' },
          yin: { incense: 12, text: '陰杯，繼續趕路。早一步到廟裡，多收了香油錢。（香火 +12）' },
        },
      },
    ],
    dusk: 'dusk2',
  },
  3: {
    title: '第三天',
    route: '芝林 → 芝嶺巖惠澤宮',
    theme: 'hill',
    ruralFrom: 0.7,
    ruralTo: 1,
    length: 40,
    news: [
      '【地方】芝嶺巖附近居民：夜裡山上有石頭滾落的聲音',
      '【民俗】惠澤宮廟方證實，將與青嶺王隊伍會香',
    ],
    events: [
      {
        at: 0.3,
        title: '山腳的老石匠',
        text: '一位老石匠坐在路邊抽菸，看著隊伍說：\n「你們是要去找那匹馬吧？」',
        choices: [
          { label: '請教老石匠', outcome: { effect: 'bellyWound', text: '「那匹馬以前是跟著聖王出征的。肚子上那個洞，是早年被人鑿的，牠最痛的就是那裡。」（得到情報：石駒的弱點）' } },
          { label: '趕路要緊', outcome: { incense: 6, text: '老石匠笑一笑，往香擔裡放了幾枚銅板。（香火 +6）' } },
        ],
      },
      {
        at: 0.62,
        title: '惠澤宮來迎',
        text: '惠澤宮的廟方帶著令旗隊，站在山門口迎接。\n「聽說石駒的事了。今晚，一起吧。」',
        choices: [
          { label: '以禮相迎，互換香旗', outcome: { effect: 'ally', incense: 10, text: '兩廟會香，結為交陪。開疆聖王的令旗隊今晚會一同守廟。（交陪、香火 +10）' } },
          { label: '我們自己來就好', outcome: { morale: 5, text: '廟方愣了一下，還是送上了點心。（士氣 +5）' } },
        ],
      },
      {
        at: 0.85,
        title: '提前布陣',
        text: '天色漸暗。要不要提前在廟埕布陣？請示青嶺王。',
        jiao: {
          ask: '提前布陣？',
          holy: { morale: 10, incense: 10, text: '聖杯！陣頭提前就位，信徒也多點了一輪香。（士氣 +10、香火 +10）' },
          laugh: { morale: 5, text: '笑杯，神明要大家先吃飽再說。（士氣 +5）' },
          yin: { followers: 4, text: '陰杯，照原定時間。附近居民趁空檔來上香，跟著留了下來。（信徒 +4）' },
        },
      },
    ],
    dusk: 'dusk3',
  },
};
