/**
 * 白天：隊伍沿街出巡，路上會遇到的事（人、鬼、小妖、線索、問話），每天一次岔路。
 * 停下來做事才花時辰；略過就走過去了，不能回頭。
 */
import type { RunState } from '../state';
import type { Almanac } from './believers';
import type { StreetTheme } from '../art/backdrop';

export type Encounter =
  /** 信徒（人的事），用 believers.ts 的信徒卡 */
  | { kind: 'person'; id: string; place: string; card: string; tex: string }
  /** 有冤情的鬼：收容回去晚上審 */
  | { kind: 'ghost'; id: string; place: string; caseId: string }
  /** 小妖：當場驅散，不用審 */
  | { kind: 'imp'; id: string; place: string; text: string; tex: string }
  /** 線索：得到物證 */
  | { kind: 'clue'; id: string; place: string; evidence: string; hours: number; text: string; needs?: string }
  /** 問話：得到證詞 */
  | { kind: 'talk'; id: string; place: string; who: string; evidence: string; hours: number; text: string; tex: string };

export interface RouteDef {
  id: string;
  name: string;
  color: number;
  encounters: Encounter[];
}

export interface DayPlan {
  day: number;
  title: string;
  area: string;
  hours: number;
  miracles: number;
  almanac: (r: RunState) => Almanac;
  /** 黃曆頁上的文獻，起駕時自動收進證物袋 */
  docs: string[];
  /** 出發後、岔路前 */
  pre: Encounter[];
  routes: RouteDef[];
  /** 兩條路會合之後 */
  post: Encounter[];
  /** 街景：城市、半城半鄉、山；第二章的漁港、海邊 */
  theme: StreetTheme;
}

// ---------- 可以重複用的事 ----------
const ghost = (id: string, place: string, caseId: string): Encounter => ({ kind: 'ghost', id, place, caseId });

const DAY1: DayPlan = {
  day: 1, title: '第一天', area: '萬舺', hours: 6, miracles: 1, theme: 'city',
  almanac: () => ({
    lunar: '十月廿日', yi: '祭祀　出行', ji: '動土',
    source: '萬舺舊聞',
    text: '萬舺舊為番社渡口，商船輻輳。老輩言，街市愈旺，陰陽二界之物愈雜。河岸舊多溺者，俗謂水鬼須得替身乃去，謂之抓交替。\n是日王爺起駕暗訪，鑼鼓自青嶺宮出。',
  }),
  docs: ['jiaoti'],
  pre: [
    { kind: 'talk', id: 'atu', place: '青嶺宮', who: '廟公阿土伯', evidence: 'tablet', hours: 1, tex: 'folk2', text: '阿土伯在整理廟誌。問問廟裡的舊事？' },
  ],
  routes: [
    {
      id: '甲', name: '市場線', color: 0xb3261e,
      encounters: [
        { kind: 'person', id: 'axiu', place: '菜市場', card: 'axiuMarket', tex: 'folk0' },
        { kind: 'clue', id: 'censer', place: '菜市場・古井', evidence: 'censer', hours: 1, text: '古井的鐵蓋下好像藏著什麼。' },
        ghost('gui1', '菜市場・古井', 'gui'),
        { kind: 'talk', id: 'cloth', place: '布莊', who: '布莊老闆娘', evidence: 'cloth', hours: 1, tex: 'folk3', text: '老闆娘擺好香案等隊伍。她在這條街住了一輩子。' },
        { kind: 'person', id: 'azhe1', place: '冰果室', card: 'azheDay1', tex: 'folk1' },
        { kind: 'clue', id: 'photo1', place: '冰果室', evidence: 'photo', hours: 1, text: '冰果室牆上掛著一張很舊的照片。' },
        ghost('tian1', '冰果室', 'tian'),
      ],
    },
    {
      id: '乙', name: '河岸線', color: 0x2b5aa8,
      encounters: [
        { kind: 'person', id: 'school', place: '國小門口', card: 'school', tex: 'folk5' },
        { kind: 'clue', id: 'ribbon1', place: '河堤', evidence: 'ribbon', hours: 1, text: '河堤欄杆上綁著一條紅布條，看起來很新。' },
        ghost('biao1', '河堤下', 'biao'),
        { kind: 'imp', id: 'nest', place: '河岸', tex: 'wang', text: '凡人只看到一片堆滿垃圾的河岸。靈界裡，這裡聚了一窩小魍。' },
        { kind: 'talk', id: 'elder', place: '老人會', who: '老人會的長輩', evidence: 'elder', hours: 1, tex: 'folk2', text: '長輩們搬了板凳坐在門口看醒獅。這條河的事，他們都記得。' },
      ],
    },
  ],
  post: [],
};

const DAY2: DayPlan = {
  day: 2, title: '第二天', area: '萬舺 → 芝林', hours: 6, miracles: 1, theme: 'mixed',
  almanac: () => ({
    lunar: '十月廿一', yi: '解除　祈福', ji: '狩獵', chong: '日沖馬　煞北',
    source: '芝林舊聞',
    text: '芝嶺巖有石，狀如馬。相傳昔為開疆聖王坐騎，隨王征戰。後聖王他往，駒獨留山中，夜出食禾稼。莊人鑿其腹，駒乃不動，化為石。',
  }),
  docs: [],
  pre: [
    { kind: 'talk', id: 'atu2', place: '青嶺宮', who: '廟公阿土伯', evidence: 'tablet', hours: 1, tex: 'folk2', text: '出發前，阿土伯在整理廟誌。問問廟裡的舊事？' },
  ],
  routes: [
    {
      id: '甲', name: '大路線', color: 0xb3261e,
      encounters: [
        { kind: 'person', id: 'clinic', place: '診所', card: 'clinic', tex: 'folk0' },
        ghost('gui2', '診所門口', 'gui'),
        { kind: 'talk', id: 'cloth2', place: '布莊', who: '布莊老闆娘', evidence: 'cloth', hours: 1, tex: 'folk3', text: '布莊老闆娘在門口看熱鬧。她在這條街住了一輩子。' },
        { kind: 'person', id: 'yunhome', place: '小芸家', card: 'xiaoyunHome', tex: 'folk5' },
        ghost('tian2', '冰果室', 'tian'),
        { kind: 'clue', id: 'photo2', place: '冰果室', evidence: 'photo', hours: 1, text: '冰果室牆上掛著一張很舊的照片。' },
        { kind: 'clue', id: 'sugar2', place: '冰果室・廚房', evidence: 'sugar', hours: 1, needs: 'yun_pot', text: '小芸說的大鍋子，就收在廚房角落。' },
      ],
    },
    {
      id: '乙', name: '河堤線', color: 0x2f8f5a,
      encounters: [
        ghost('biao2', '河堤下', 'biao'),
        { kind: 'talk', id: 'angler', place: '河堤', who: '釣魚的老伯', evidence: 'elder', hours: 1, tex: 'folk2', text: '一個老伯在河堤上釣魚，釣了幾十年。這條河的事，他都記得。' },
        { kind: 'clue', id: 'ribbon2', place: '河堤', evidence: 'ribbon', hours: 1, text: '河堤欄杆上綁著一條紅布條，看起來很新。' },
        { kind: 'imp', id: 'dike', place: '河堤', tex: 'mei', text: '幾隻疾魅在河堤上亂竄，路人都說今天風特別怪。' },
        { kind: 'person', id: 'farm', place: '芝林菜園', card: 'farm', tex: 'folk1' },
        ghost('fu2', '菜園邊的蹄印', 'fu'),
        { kind: 'person', id: 'stone', place: '石材行', card: 'stone', tex: 'folk2' },
      ],
    },
  ],
  post: [],
};

const DAY3: DayPlan = {
  day: 3, title: '第三天', area: '芝林 → 芝嶺巖惠澤宮', hours: 4, miracles: 2, theme: 'hill',
  almanac: () => ({
    lunar: '十月廿二', yi: '會友　祭祀', ji: '出火', source: '惠澤宮籤詩',
    text: '山中石駒久無主，夜夜長嘶望北風；若得舊人呼一聲，不須鞭策自歸宮。\n是日正日，王爺遶境，與惠澤宮會香。',
  }),
  docs: ['poem'],
  pre: [],
  routes: [
    {
      id: '甲', name: '山腳線', color: 0x7a5a2a,
      encounters: [
        { kind: 'person', id: 'foothill', place: '山腳', card: 'foothill', tex: 'folk2' },
        ghost('fu3', '山徑', 'fu'),
        { kind: 'person', id: 'trail', place: '山徑', card: 'trail', tex: 'folk1' },
        { kind: 'imp', id: 'rubble', place: '山徑', tex: 'kui', text: '石屑傀從碎石堆裡爬出來，擋在山徑上。' },
      ],
    },
    {
      id: '乙', name: '街區線', color: 0x2b5aa8,
      encounters: [
        { kind: 'person', id: 'school3', place: '小芸的學校', card: 'school3', tex: 'folk5' },
        { kind: 'person', id: 'azhe3', place: '冰果室', card: 'azheDay3', tex: 'folk1' },
        ghost('tian3', '冰果室', 'tian'),
        { kind: 'clue', id: 'sugar3', place: '冰果室・廚房', evidence: 'sugar', hours: 1, needs: 'yun_pot', text: '小芸說的大鍋子，就收在廚房角落。' },
      ],
    },
  ],
  post: [
    { kind: 'person', id: 'huize', place: '惠澤宮', card: 'huize', tex: 'kaijiang' },
  ],
};

export const DAY_PLANS: Record<number, DayPlan> = { 1: DAY1, 2: DAY2, 3: DAY3 };

// ---------- 天亮：處理期限、寫「昨日」 ----------
/**
 * 夜審結束後呼叫（n = 剛過完第幾夜）。改變信徒狀態，回傳明天黃曆「昨日」欄的文字。
 */
export function dawn(r: RunState, n: number): string[] {
  const out: string[] = [];
  const guiDone = !!r.cases.gui?.verdict;
  if (guiDone && (r.b.axiu === 'sick' || r.b.axiu === 'eased' || r.b.axiu === 'worse')) {
    r.b.axiu = 'cured';
    out.push('阿弟昨夜睡得很沉，燒退了。阿秀嬸一早就在市場逢人說。');
  }
  if (n === 1) {
    if (r.b.axiu === 'sick') {
      r.b.axiu = 'worse';
      out.push('菜市場的阿秀嬸沒等到隊伍。阿弟燒到昏睡，今早被送進診所。');
    } else if (r.b.axiu === 'eased') {
      out.push('阿弟昨晚又哭了一陣，摸起來還是冰冰的。');
    }
    if (r.b.xiaoyun === 'unmet') out.push('國小門口有個女孩一直往隊伍這邊看，沒有人停下來。');
    if (r.b.azhe === 'unmet') out.push('冰果室的老闆對著鞭炮皺眉，拉下了半邊鐵門。');
  }
  if (n === 2) {
    if (r.b.axiu === 'worse' || r.b.axiu === 'eased') {
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
  }
  // 阿添公超渡了：阿哲留下店
  if (r.cases.tian?.verdict === 'release' && r.b.azhe !== 'stayed') {
    r.b.azhe = 'stayed';
    out.push('阿哲照著小芸說的，熬了一鍋黑糖水。他說，味道跟小時候一模一樣。');
  }
  return out;
}

/** 第三天結束（入夜前） */
export function endOfDay3(r: RunState): void {
  if (r.b.axiong === 'trapped') r.b.axiong = 'hurt';
  if (r.b.azhe === 'unmet' || r.b.azhe === 'softened') r.b.azhe = 'closed';
  if (r.b.azhe === 'believer') r.b.azhe = 'stayed';
}

/** 第一章：判決對信徒的影響，回傳要多顯示的句子 */
export function verdictEffects(r: RunState, id: string, verdict: string): string[] {
  const out: string[] = [];
  if (id === 'gui' && r.b.axiu !== 'regret' && r.b.axiu !== 'cured') {
    r.b.axiu = 'cured';
    out.push('', '當晚，阿弟睡得很沉，燒也退了。');
  }
  if (id === 'tian' && verdict === 'release') {
    r.b.azhe = 'stayed';
    out.push('', '小芸替阿添公傳了話。阿哲照著煮出那鍋黑糖水，說味道跟小時候一模一樣。');
  }
  if (id === 'biao' && verdict === 'free' && r.flags.freed_biao && r.b.xiaoyun !== 'protected' && r.b.xiaoyun !== 'invited') {
    r.b.xiaoyun = 'lost';
    out.push('', '隔天，河邊又傳出有孩子差點落水。小芸再也不敢靠近那條河。');
  }
  return out;
}
