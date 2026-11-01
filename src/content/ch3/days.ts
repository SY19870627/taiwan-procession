/**
 * 第三章「新瀛・太子出營」：三天的行程（安營 → 聖誕正日・祝壽 → 遶境），以及天亮時的變化。
 * 依計畫 §4.1：第一天每條路線都會遇到四隻鬼（鼠妖、哨仔伯、虎頭、阿旺），營旗下只剩兩格，當天就得決定。
 * 取材：太子爺聖誕（九月初九）、五營安營、奶嘴過火、電音三太子陣頭。遊戲中一律用虛構名稱。
 */
import type { RunState } from '../../state';
import type { DayPlan, Encounter } from '../days';
import type { Verdict } from '../cases';

const ghost = (id: string, place: string, caseId: string): Encounter => ({ kind: 'ghost', id, place, caseId });

const DAY1: DayPlan = {
  day: 1, title: '第一天・安營', area: '新瀛・太子殿 → 庄頭庄尾 → 市場', hours: 6, miracles: 1, theme: 'village',
  almanac: () => ({
    lunar: '九月初八', yi: '安營　插旗', ji: '近水',
    source: '新瀛舊聞',
    text: '安營：五營旗插在庄頭庄尾，兵將才守得住庄。聖誕前一天，太子親自出營巡一遍。\n近年疾水溪邊常有人聽到哭聲。好心過去看的人，有兩個沒再上來，都是在同一個溪灣。',
  }),
  docs: ['drown_news'],
  pre: [
    { kind: 'person', id: 'bingbo1', place: '太子殿', card: 'bingbo1', tex: 'n3_bingbo' },
    ghost('shuyao1', '太子殿・供桌下', 'shuyao'),
    { kind: 'clue', id: 'bite_box', place: '太子殿・香油錢箱', evidence: 'bite_box', hours: 1, text: '香油錢箱放在供桌旁，底部好像破了一個洞。' },
    { kind: 'talk', id: 'janitor', place: '國小後門', who: '國小的工友', evidence: 'school_word', hours: 1, tex: 'n3_janitor', text: '國小的工友在後門掃落葉，一直往溪邊那條小路看。' },
    ghost('shaozaibo1', '國小後門', 'shaozaibo'),
  ],
  routes: [
    {
      id: '甲', name: '庄頭線', color: 0x2f8f5a, theme: 'duckfarm',
      encounters: [
        { kind: 'person', id: 'yashen1', place: '鴨母寮', card: 'yashen1', tex: 'n3_yashen' },
        { kind: 'clue', id: 'duck_trail', place: '鴨寮後門', evidence: 'duck_trail', hours: 1, text: '鴨寮後門的泥地上，好像有一排腳印往溪邊去。' },
        { kind: 'talk', id: 'angler', place: '鴨寮旁的魚塭', who: '釣客', evidence: 'angler_word', hours: 1, tex: 'n3_angler', text: '一個戴斗笠的釣客坐在魚塭邊，說他以前都在溪邊釣，最近不敢去了。' },
        { kind: 'imp', id: 'duckfarm', place: '庄頭・插東營南營旗', tex: 'xia_imp', text: '東營、南營的旗竿剛插好，水溝裡就爬出幾隻蝦兵，揮著鉗子要拔旗。凡人只覺得水溝特別臭。' },
      ],
    },
    {
      id: '乙', name: '庄尾線', color: 0xb3261e,
      encounters: [
        { kind: 'clue', id: 'scorch', place: '庄尾的稻草堆', evidence: 'scorch', hours: 1, text: '庄尾一堆燒掉的稻草，還在冒細細的煙。' },
        { kind: 'person', id: 'aling1', place: '庄尾・阿玲家門口', card: 'aling1', tex: 'n3_aling' },
        { kind: 'imp', id: 'zhuangwei', place: '庄尾・插西營北營旗', tex: 'xia_imp', text: '西營、北營的旗竿下，幾隻蝦兵躲在稻草堆裡，等著拔旗。' },
      ],
    },
  ],
  post: [
    ghost('hutou1', '市場後巷', 'hutou'),
    { kind: 'clue', id: 'market_ash', place: '市場後巷・水溝蓋', evidence: 'market_ash', hours: 1, text: '後巷的水溝蓋上，堆著一小袋一小袋的香灰。' },
    { kind: 'talk', id: 'auntie', place: '市場', who: '市場的阿桑', evidence: 'market_auntie', hours: 1, tex: 'n3_auntie', text: '賣菜的阿桑在收攤，一直往後巷看，搖頭。' },
    ghost('awang1', '市場後巷・廟口', 'awang'),
  ],
};

const DAY2: DayPlan = {
  day: 2, title: '第二天・聖誕正日', area: '太子殿祝壽 → 廟埕／舊壇 → 庄尾', hours: 6, miracles: 1, theme: 'village',
  almanac: () => ({
    lunar: '九月初九', yi: '祝壽　過火', ji: '食鴨',
    source: '太子殿誌・鴨子護太子',
    text: '九月初九，太子聖誕，也是重陽。傳說太子遭難的時候，一群鴨子護住了他的身子，所以祝壽忌用鴨肉，鴨子是太子的恩人。\n今天信徒送來糖果、彈珠汽水、玩具，還有一籃一籃的奶嘴：奶嘴過了火，愛哭的孩子可以擲筊請一個回家。',
  }),
  docs: [],
  pre: [
    { kind: 'person', id: 'akai2', place: '太子殿前・祝壽', card: 'akai2', tex: 'n3_akai' },
    { kind: 'person', id: 'aling2', place: '太子殿前・奶嘴過火', card: 'aling2', tex: 'n3_aling' },
    { kind: 'person', id: 'bingbo2', place: '太子殿', card: 'bingbo2', tex: 'n3_bingbo' },
  ],
  routes: [
    {
      id: '甲', name: '廟埕線', color: 0xe9b949,
      encounters: [
        ghost('shuyao2', '廟埕・祝壽供桌', 'shuyao'),
        { kind: 'talk', id: 'kids', place: '廟埕', who: '廟埕的小孩們', evidence: 'kids_word', hours: 1, tex: 'n3_kids', text: '一群小孩舉著糖果跑來跑去，說舊壇那邊的「太子」會說話。' },
        { kind: 'clue', id: 'paper_book', place: '紙紮店', evidence: 'paper_book', hours: 1, text: '廟埕旁的紙紮店，老闆在翻一本很舊的帳本。' },
        { kind: 'imp', id: 'stage', place: '廟埕・電音三太子陣頭後台', tex: 'xia_imp', text: '陣頭後台的電線堆裡，蝦兵咬著電線，想讓音響斷電。' },
      ],
    },
    {
      id: '乙', name: '舊壇線', color: 0x7a4a9a,
      encounters: [
        ghost('zhizha2', '廢棄的小神壇', 'zhizha'),
        { kind: 'clue', id: 'swapped_censer', place: '舊神壇・壇後草叢', evidence: 'swapped_censer', hours: 1, text: '神壇上的香爐看起來怪怪的，壇後的草叢裡好像有東西在反光。' },
        ghost('awang2', '舊壇旁的土地公廟', 'awang'),
        { kind: 'imp', id: 'oldaltar', place: '舊壇的竹林', tex: 'xia_imp', text: '竹林裡的水溝，蝦兵一隻一隻爬上來，往溪的方向排隊。' },
      ],
    },
  ],
  post: [
    { kind: 'person', id: 'fire2', place: '庄尾', card: 'fire2', tex: 'n3_farmer' },
    ghost('hutou2', '市場後巷', 'hutou'),
  ],
};

const DAY3: DayPlan = {
  day: 3, title: '第三天・遶境', area: '新瀛 → 疾水溪舊渡口', hours: 4, miracles: 2, theme: 'ferry',
  almanac: () => ({
    lunar: '九月初十', yi: '遶境　收營', ji: '渡水', source: '新瀛舊聞',
    text: '渡口廢掉那年，溪中間一連翻了三艘船。撈起來的人都說，水底有東西抓著船底不放，是撐船的人用竹篙把他們一個一個撥回岸邊。\n今天遶境一路走到疾水溪。溪水，往山那邊流。',
  }),
  docs: ['ferry_closed'],
  pre: [
    { kind: 'imp', id: 'road3', place: '往疾水溪的路上', tex: 'xia_imp', text: '溪水倒流，路邊的水溝也跟著往回流。一整排蝦兵從水溝裡爬出來，擋在路中間。' },
  ],
  routes: [
    {
      id: '甲', name: '堤防線', color: 0x2b5aa8,
      encounters: [
        { kind: 'clue', id: 'duck_feather', place: '堤防下的溪灘', evidence: 'duck_feather', hours: 1, text: '堤防下的溪灘上，好像有一圈白白的東西。' },
        ghost('zhizha3', '堤防・往溪灣的小路', 'zhizha'),
        ghost('shaozaibo3', '堤防・往溪灣的小路口', 'shaozaibo'),
        { kind: 'clue', id: 'kid_shoes', place: '溪灣', evidence: 'kid_shoes', hours: 1, needs: 'zhizha_word', text: '紙紮童說的溪灣，就在堤防下面。岸邊好像排著一些小東西。' },
      ],
    },
    {
      id: '乙', name: '舊渡口線', color: 0x5a4a3a,
      encounters: [
        { kind: 'person', id: 'hebo3', place: '舊渡口・何伯的茶攤', card: 'hebo3', tex: 'n3_hebo' },
        { kind: 'clue', id: 'pole_carving', place: '舊渡口・繫竹筏的木樁', evidence: 'pole_carving', hours: 1, text: '木樁旁靠著一支泡得發黑的舊竹篙。' },
        { kind: 'clue', id: 'river_ash', place: '舊渡口・往下的石階', evidence: 'river_ash', hours: 1, text: '往溪裡的石階上，倒著一袋一袋灰灰的東西。' },
      ],
    },
  ],
  post: [
    ghost('dubo3', '疾水溪舊渡口', 'dubo'),
  ],
};

export const DAY_PLANS3: Record<number, DayPlan> = { 1: DAY1, 2: DAY2, 3: DAY3 };

/** 每天早上黃曆後的成長解鎖（大綱 §3：第一天各將一招、第二天合擊、第三天五營合陣） */
export const UNLOCKS3: Record<number, { title: string; text: string }> = {
  1: { title: '五營出營・各將一招', text: '東營章將軍「替身擋」、南營霄將軍「火爆拳」、西營柳將軍「一箭」、北營廉將軍「看相」。\n太子：「站好，別說我偷襲。」' },
  2: { title: '解鎖・合擊', text: '夜審連續點對兩次，第三次由太子與那位將軍合擊，氣焰多 -1。\n霄將軍：「打就對了啦！」' },
  3: { title: '解鎖・五營合陣', text: '最後一戰：四將輪流在前排站滿 5 秒插下營旗，太子出轎插下中營旗。五面插齊，五營合陣。\n章將軍：「太子，別衝……算了，跟上！」' },
};

/** 夜審結束後呼叫（n = 剛過完第幾夜）。改變信徒狀態，回傳明天黃曆「昨日」欄的文字。 */
export function dawn3(r: RunState, n: number): string[] {
  const out: string[] = [];
  const done = (id: string) => !!r.cases[id]?.verdict;
  const yv = r.cases.yamupo?.verdict;
  if ((yv === 'release' || yv === 'recruit') && r.b.yashen !== 'thanked') {
    r.b.yashen = 'thanked';
    out.push('鴨母寮的鴨，一隻都沒少。鴨嬸說，昨晚好像聽到婆婆在數鴨。');
  } else if (!yv) out.push('鴨母寮昨晚又少了一隻鴨。');
  if (!done('shuyao')) out.push('太子殿的供桌又少了一包糖果。炳伯又在罵那些孤魂。');
  if (!done('hutou')) out.push('市場後巷，又有孤魂交不出香灰挨打了。');
  if (n === 1) {
    if (!done('shaozaibo')) out.push('國小後門半夜又響起哨聲，好幾個孩子哭著醒來。');
  }
  if (n === 2) {
    if (!done('huosha') && !r.flags.fire_out) {
      r.flags.fire_regret = true;
      out.push('庄尾昨晚燒起來了，阿伯的稻草堆燒得一乾二淨。');
    }
    if (r.b.akai === 'tired') {
      r.b.akai = 'flopped';
      out.push('阿凱的頭盔在祝壽時掉了下來。他把三太子神偶收進了倉庫。');
    }
    if (r.b.aling === 'unmet' || r.b.aling === 'met') {
      r.b.aling = 'missed';
      out.push('阿玲的孩子又哭了一整夜。');
    }
    if (!done('zhizha')) out.push('昨晚又有小孩往溪邊走，被大人追了回來。');
  }
  return out;
}

/** 第三天結束（入夜前） */
export function endOfDay3_3(r: RunState): void {
  void r;
}

/** 判決對信徒的影響，回傳要多顯示的句子 */
export function verdictEffects3(r: RunState, id: string, verdict: Verdict): string[] {
  const out: string[] = [];
  if (id === 'yamupo' && (verdict === 'release' || verdict === 'recruit')) {
    out.push('', '太子：「……鴨子的事，我來處理。」');
  }
  if (id === 'hutou') out.push('', '市場後巷的孤魂們抬起頭來：今晚不用交香灰了。');
  if (id === 'zhizha') out.push('', '舊壇前的糖果和玩具，太子吩咐分給庄裡的小孩。');
  if (id === 'shuyao') out.push('', '炳伯明天會發現，供桌上的糖果不再少了。');
  if (id === 'shaozaibo' && verdict === 'release') out.push('', '太子：「國小後門，東營派人顧。」');
  if (id === 'awang' && verdict === 'release') out.push('', '太子：「太子殿的香，分他一份。」');
  if (id === 'huosha') r.flags.fire_out = true;
  return out;
}
