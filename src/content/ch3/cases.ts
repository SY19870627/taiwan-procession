/**
 * 第三章「新瀛・太子出營」：九個鬼的案子與證據。
 *
 * 太子爺不慢慢查。夜審是「點將問罪」：鬼在堂前說狠話，玩家點將上前打臉（見 docs/新瀛太子爺_故事大綱 §6）。
 *  - 說謊 → 東營章將軍，帶「證詞」對質
 *  - 狡辯 → 西營柳將軍，甩出「物證」或「文獻」
 *  - 純嗆聲 → 南營霄將軍，當場嚇破膽（不用證據）
 *  - 冤魂的嗆聲其實是嘴硬（sore）：正解是「讓牠說」；點南營會把牠嚇得縮起來（怨氣 +1）
 *
 * 鬼分三種（大綱 §4.2）：冤魂（斬了算斬錯）、十惡不赦（直接斬，威名 +1）、真惡（查得到來歷，查完確定是惡）。
 * 外表會騙人：長得像壞人的冤魂（鴨母婆、渡伯）、看起來可憐的十惡（裝哭的水鬼）。
 *
 * 四個完整案子：鴨母婆、虎頭、紙紮童、渡伯。
 * 十惡小咖：抓交替的水鬼、火煞、偷香火的鼠妖。
 * 小咖冤魂（大綱只說「兩個」，名字與人設是自行決定的，見計畫 D1、Q1）：哨仔伯、阿旺【待定】。
 *
 * 點將問罪的規則在 core/dianjiang.ts、畫面在 ui/dianjiang.ts（第 4 階段）。
 * 每一案的 statements／press／truths 仍由 taunts 自動產生（每句狠話＝一句供詞、點對的證據＝出示的證據），
 * 讓共用的部分（營旗格的「查明幾層」、因果簿、信徒錄、真相回憶）照舊能用。
 * 遊戲中一律用虛構名稱。
 */
import type { Camp, Evidence, GhostCase, Nature, Taunt, Truth, VerdictDef } from '../cases';

export const EVIDENCE3: Record<string, Evidence> = {
  // 鴨母婆
  yashen_word: { id: 'yashen_word', kind: '證詞', name: '鴨嬸的話', text: '「我婆婆生前最疼鴨，每晚睡前都要去鴨寮數一遍。她走了以後，鴨子還是每晚排成一列，對著她以前站的地方叫。」', ghost: 'yamupo', where: '鴨嬸（第一天庄頭線・鴨母寮）' },
  duck_trail: { id: 'duck_trail', kind: '物證', name: '往溪邊的鴨腳印', text: '鴨寮後門的泥地上，一排鴨腳印一路往疾水溪去。旁邊跟著一雙小小的布鞋印，只有去、沒有回。', ghost: 'yamupo', where: '鴨寮後門的線索（第一天庄頭線）' },
  duck_feather: { id: 'duck_feather', kind: '物證', name: '溪邊的鴨毛', text: '堤防下的溪灘上，一圈白鴨毛整整齊齊，像有人把鴨子送到這裡就走了。水裡有東西拖過的痕跡。', ghost: 'yamupo', where: '堤防下的溪灘（第三天堤防線）' },
  hebo_fowl: { id: 'hebo_fowl', kind: '證詞', name: '何伯的話（溪裡吃家禽）', text: '「這條溪以前就會吃雞吃鴨。我阿爸那時候，每年要往溪裡丟一隻鴨，說是給溪底的拜碼頭。」', ghost: 'yamupo', where: '何伯（第三天舊渡口線・茶攤）' },
  bingbo_creek: { id: 'bingbo_creek', kind: '證詞', name: '炳伯的話（溪底的東西）', text: '「老一輩說疾水溪底住著一尾東西，餓了就上岸找雞鴨。鴨母寮那個老阿婆，以前每年都去溪邊拜。」', ghost: 'yamupo', where: '炳伯（第二天太子殿・祝壽）' },
  // 虎頭
  bingbo_hutou: { id: 'bingbo_hutou', kind: '證詞', name: '炳伯說的虎頭', text: '「市場那個虎頭喔？以前在市場收保護費，攤販不給就翻攤子。後來喝酒跟人打架死的，出殯那天沒幾個人去。」', ghost: 'hutou', where: '炳伯（第一天太子殿，陪他整理供桌）' },
  awang_word: { id: 'awang_word', kind: '證詞', name: '阿旺的話', text: '「每晚要交一袋香灰給他。交不出來……就是一頓打。巷子裡的孤魂都一樣。」', ghost: 'hutou', where: '收容阿旺時（第一天市場後巷）' },
  market_ash: { id: 'market_ash', kind: '物證', name: '後巷的香灰堆', text: '市場後巷的水溝蓋上堆著一堆香灰，分成一小袋一小袋，每一袋都綁著不同的紙條：「阿旺」「無名」「阿春」……', ghost: 'hutou', where: '市場後巷的線索（第一天會合後）' },
  river_ash: { id: 'river_ash', kind: '物證', name: '渡口石階上的香灰', text: '舊渡口往下的石階上，倒著一袋一袋的香灰，袋子跟市場後巷的一模一樣。潮水一來，香灰就被捲進溪底。', ghost: 'hutou', where: '舊渡口石階的線索（第三天舊渡口線）' },
  ash_ledger: { id: 'ash_ledger', kind: '文獻', name: '香灰帳本', text: '虎頭身上掉出來的破帳本。一頁一頁記著哪個孤魂交了幾袋香灰，最後一欄寫著：「溪底，月底交。」', ghost: 'hutou', where: '夜審虎頭（氣焰打到歸零）才會掉出來；直接斬就拿不到' },
  // 紙紮童
  kids_word: { id: 'kids_word', kind: '證詞', name: '小孩們的話', text: '「舊壇那個太子會說話喔！可是下雨天他會皺皺的，背後還有一條竹子。」', ghost: 'zhizha', where: '廟埕的小孩們（第二天廟埕線）' },
  swapped_censer: { id: 'swapped_censer', kind: '物證', name: '被換掉的香爐', text: '舊神壇上的香爐是紙糊的，一碰就凹。原本的銅香爐被丟在壇後的草叢裡，裡面的香灰早就冷了。', ghost: 'zhizha', where: '舊神壇的線索（第二天舊壇線）' },
  paper_book: { id: 'paper_book', kind: '文獻', name: '紙紮店的舊帳', text: '紙紮店的舊帳本：「某年某月，喪家訂紙紮童子一對。」旁邊用紅筆補了一行：「出殯那天下雨，只燒了一個。」', ghost: 'zhizha', where: '紙紮店的線索（第二天廟埕線）' },
  // 第 7 階段補：被換掉的香爐只在舊壇線、小孩們的話與舊帳只在廟埕線，同一天只能走一條，原本沒有任何路線組合查得完紙紮童（D89）
  censer_order: { id: 'censer_order', kind: '文獻', name: '紙香爐的訂單', text: '夾在紙紮店舊帳裡的一張訂單：「舊壇，紙香爐一個，照銅爐的樣子糊。」訂的人沒寫名字，只歪歪扭扭簽了兩個字：太子。', ghost: 'zhizha', where: '紙紮店櫃台的線索（第二天廟埕線）' },
  akai_creek: { id: 'akai_creek', kind: '證詞', name: '阿凱的話（半夜的小孩）', text: '「我上大夜，凌晨三點常看到小孩自己往溪邊走，前面好像有一個穿紅肚兜的小孩在帶路。我追過去，就不見了。」', ghost: 'zhizha', where: '阿凱（第二天太子殿・祝壽，陪他聊大夜班）' },
  zhizha_word: { id: 'zhizha_word', kind: '證詞', name: '紙紮童的話', text: '「是溪底那位叫我的……他說，帶小孩去溪灣玩，就讓我當真的太子。」', ghost: 'zhizha', where: '夜審紙紮童（氣焰打到歸零）才問得到；直接斬就問不到' },
  // 渡伯
  hebo_ferry: { id: 'hebo_ferry', kind: '證詞', name: '何伯的話（以前的渡船）', text: '「以前撐渡船的阿伯，每天載庄裡的人過溪。有一年大水，船在溪中間翻了。人都說他載的那幾個都沒事，只有他沒上來。」', ghost: 'dubo', where: '何伯（第三天舊渡口線・茶攤）' },
  bingbo_ferry: { id: 'bingbo_ferry', kind: '證詞', name: '炳伯的話（渡口廢掉那年）', text: '「渡口廢掉那年我還年輕。撐船的阿伯翻船以後，晚上還有人看到竹篙在溪上撐，大家就不敢去了。」', ghost: 'dubo', where: '炳伯（第二天太子殿・祝壽，多聽一段）' },
  ferry_closed: { id: 'ferry_closed', kind: '文獻', name: '新瀛舊聞・渡口廢掉那年', text: '黃曆上寫的：渡口廢掉那年，溪中間一連翻了三艘船。撈起來的人都說，水底有東西抓著船底不放，是撐船的人用竹篙把他們一個一個撥回岸邊。', ghost: 'dubo', where: '第三天的黃曆' },
  pole_carving: { id: 'pole_carving', kind: '物證', name: '竹篙上的刻字', text: '一支泡得發黑的舊竹篙，上面刻滿了「正」字。最上面一行小字：「划歪一次，放走一個。」', ghost: 'dubo', where: '舊渡口的竹篙（第三天舊渡口線）' },
  kid_shoes: { id: 'kid_shoes', kind: '物證', name: '溪灣的小拖鞋', text: '溪灣的岸上，一雙一雙小孩的拖鞋排得整整齊齊，鞋尖都朝著庄頭。像有人每次都把孩子撐回岸邊，再把鞋擺好。', ghost: 'dubo', where: '溪灣的線索（第三天堤防線；要先問到紙紮童的話才知道在哪）' },
  // 抓交替的水鬼
  angler_word: { id: 'angler_word', kind: '證詞', name: '釣客的話', text: '「溪邊那個哭的，每次都等有人走近才哭。我站遠遠的看，沒人的時候他就坐在水裡笑。」', ghost: 'shuigui', where: '鴨寮旁的釣客（第一天庄頭線）' },
  drown_news: { id: 'drown_news', kind: '文獻', name: '新瀛舊聞・溪邊的哭聲', text: '黃曆上寫的：近年疾水溪邊常有人聽到哭聲。好心過去看的人，有兩個沒再上來，都是在同一個溪灣。', ghost: 'shuigui', where: '第一天的黃曆' },
  // 火煞
  scorch: { id: 'scorch', kind: '物證', name: '稻草堆的焦痕', text: '庄尾燒掉的稻草堆，焦痕從正中間往外燒，地上還有一圈小小的腳印繞著火堆轉。不是菸蒂，也不是天氣熱。', ghost: 'huosha', where: '庄尾稻草堆的線索（第一天庄尾線）' },
  aling_fire: { id: 'aling_fire', kind: '證詞', name: '阿玲的話（火光裡的人）', text: '「那晚孩子又在哭，我抱著他在門口走。庄尾燒起來的時候，火光裡有一個人在拍手，笑得好開心。」', ghost: 'huosha', where: '阿玲（第一天庄尾線）' },
  // 偷香火的鼠妖
  bite_box: { id: 'bite_box', kind: '物證', name: '被咬破的香油錢箱', text: '太子殿的香油錢箱底部被咬出一個洞，洞口的齒痕是一排細細的老鼠牙，旁邊還黏著糖果紙。', ghost: 'shuyao', where: '太子殿香油錢箱的線索（第一天出發時）' },
  bingbo_offer: { id: 'bingbo_offer', kind: '證詞', name: '炳伯的話（供品）', text: '「供桌上的糖果、彈珠汽水每天都少。供品不見那幾晚，我看到一隻跟貓一樣大的老鼠叼著糖果，往後殿鑽。」', ghost: 'shuyao', where: '炳伯（第一天太子殿）' },
  // 哨仔伯【待定】
  school_word: { id: 'school_word', kind: '證詞', name: '國小工友的話', text: '「以前有個導護老伯，每天站在後門吹哨子，不准孩子往溪邊那條小路走。他走了好幾年了。」', ghost: 'shaozaibo', where: '國小的工友（第一天出發時・國小後門）' },
  whistle: { id: 'whistle', kind: '物證', name: '舊哨子', text: '一個生鏽的銅哨子，綁著褪色的布條，上面寫著「後門導護」。哨子一直對著往溪邊的那條小路。', ghost: 'shaozaibo', where: '收容哨仔伯時一起帶回' },
  // 阿旺【待定】
  ash_bag: { id: 'ash_bag', kind: '物證', name: '阿旺的香灰袋', text: '一個破布袋，裝了半袋香灰。袋口縫著一個歪歪的「虎」字，跟市場後巷那堆香灰的袋子是同一種。', ghost: 'awang', where: '收容阿旺時一起帶回' },
  market_auntie: { id: 'market_auntie', kind: '證詞', name: '市場阿桑的話', text: '「後巷那個瘦瘦的影子喔，每晚在廟口撿香灰，撿完就往巷尾那個大塊頭走過去。回來的時候，都是一跛一跛的。」', ghost: 'awang', where: '市場的阿桑（第一天會合後・市場後巷）' },
};

// ---------- 案子 ----------
interface Spec {
  id: string;
  nature: Nature;
  camp: Camp;
  name: string;
  dayName: string;
  shortName: string;
  tex: string;
  daySight: string;
  harm: string;
  affects: string;
  payoff: string;
  timid: number;
  memory?: GhostCase['memory'];
  onCollect?: string[];
  flare: number;
  taunts: Taunt[];
  /** 真相（stmt、evidence 由 taunts 產生） */
  truths: Omit<Truth, 'stmt' | 'evidence'>[];
  heart?: string[];
  /** 第一次跪地求饒時播的劇情（紙紮童） */
  kneelStory?: string;
  overnight: GhostCase['overnight'];
  lookLine: string;
  dropsOnTrial?: string[];
  wrong: string;
  verdicts: VerdictDef[];
}

/** 把點將問罪的資料轉成舊的審問格式也能用的 GhostCase */
function ch3(s: Spec): GhostCase {
  const truths: Truth[] = s.truths.map((t, i) => {
    const from = s.taunts.map((x, j) => ({ x, j })).filter(({ x }) => x.truth === i);
    return { ...t, stmt: from[0]?.j ?? -1, evidence: [...new Set(from.flatMap(({ x }) => x.evidence ?? []))] };
  });
  return {
    ...s,
    innocent: s.nature === 'wronged',
    statements: s.taunts.map((t) => t.line),
    press: s.taunts.map((t, i) => (t.sore ? s.heart?.[0] : undefined) ?? (t.truth === undefined ? t.miss : `（牠別過頭去，不肯多說第 ${i + 1} 句。）`)),
    truths,
  };
}

/** 北營看相的三種說法（大綱 §4.2） */
export const LOOK_LINE = {
  wicked: '「這個，不用問了。」',
  wronged: '「這個，水裡有話。」',
  villain: '「該斬。但牠身上有東西。」',
} as const;

export const CASES3: Record<string, GhostCase> = {
  // ===== 四個完整案子 =====
  yamupo: ch3({
    id: 'yamupo', nature: 'wronged', camp: 'north', memory: 'rain',
    name: '鴨母婆', dayName: '偷鴨的老婦人', shortName: '偷鴨老婦', tex: 'g3_yamupo',
    daySight: '五營昨晚在鴨母寮抓到的。一個駝背的老婦人，半夜趕著一隻鴨往溪邊走，被抓的時候還死命護著那隻鴨。鴨寮裡的鴨子對著營旗一直叫。',
    harm: '鴨母寮每晚還是會少一隻鴨；鴨嬸快撐不下去了',
    affects: '鴨嬸與鴨母寮',
    payoff: '查清楚可以超渡（最後一戰「群鴨陣」）或編入北營（熟悉溪路）',
    timid: 1,
    flare: 4,
    taunts: [
      { line: '「我是路過的啦！這間鴨寮跟我一點關係都沒有。」', type: 'lie', evidence: ['yashen_word'], truth: 0, hit: '章將軍：「鴨嬸說，她婆婆每晚都要去鴨寮數一遍鴨。」\n老婦人的手抖了一下：「……阿惜還記得喔。」', miss: '「看什麼看？老人家走路不行喔？」' },
      { line: '「鴨是自己跑掉的，關我什麼事！」', type: 'excuse', evidence: ['duck_trail', 'duck_feather'], truth: 1, hit: '柳將軍：「中。」\n腳印、鴨毛甩在地上。老婦人不說話了，半晌才開口：「……是我趕的。一晚一隻。」', miss: '「證據咧？拿不出來就放我回去顧鴨！」' },
      { line: '「你們這些神明有什麼了不起？鴨子一隻一隻少，誰來看過一眼？」', type: 'taunt', sore: true, hit: '太子沒有開口。老婦人說著說著，聲音就啞了。', miss: '「兇什麼兇……」老婦人縮成一團，抱著膝蓋不說話了。' },
      { line: '「溪裡什麼都沒有！你們別去，聽到沒？別去！」', type: 'lie', evidence: ['hebo_fowl', 'bingbo_creek'], truth: 2, hit: '章將軍：「渡口的何伯說，這條溪以前每年都要丟一隻鴨下去。」\n老婦人抬起頭，眼眶紅了：「牠會吃鴨……鴨不夠吃，牠就要上岸了。」', miss: '「我說沒有就沒有！」' },
      { line: '「要斬就斬啦，我一個老太婆，怕什麼。」', type: 'taunt', sore: true, hit: '「……我只是想讓阿惜好好養她的鴨。」老婦人低下頭。', miss: '老婦人閉上眼睛，一句話都不說了。' },
    ],
    truths: [
      { summary: '她是鴨嬸過世的婆婆「鴨母婆」。生前最疼鴨，死後也一直守著鴨母寮。', reveal: '「我叫阿香啦……大家都叫我鴨母婆。這寮鴨，是我一隻一隻養起來的。」' },
      { summary: '鴨不是她偷的。她每晚把一隻鴨趕到溪邊，自己送過去。', reveal: '「一晚一隻，送到溪灘上就好。我不敢走太近。」' },
      { summary: '溪底有東西在吃鴨。她用一晚一隻鴨，換整寮鴨、換庄裡的平安。', reveal: '「牠吃飽了，就不會上岸。我一個死人，能做的就這樣了。」' },
    ],
    heart: ['「阿惜一個人顧這寮鴨，很辛苦。我死了也放不下。」', '「我怕的不是鴨少……我怕牠哪天不吃鴨了，要吃人。」'],
    overnight: { say: '鴨母婆被壓了一晚，冷靜下來了：「……我是怕，怕牠哪天不吃鴨，要吃人。」' },
    lookLine: '「這個，水裡有話。」',
    wrong: '老婦人把頭撇開，嘴裡念著鴨子的名字。',
    verdicts: [
      { verdict: 'release', needs: [1, 2], result: '太子罕見地正經：「……鴨子的事，我來處理。」她安心離開。戾氣 -1；最後一戰多一個技能「群鴨陣」' },
      { verdict: 'recruit', needs: [0], result: '編入北營：她熟悉溪路，最後一戰帶著鴨群讓蝦兵變慢' },
      { verdict: 'escort', result: '押送地府。鴨母寮的鴨不會再少，但沒人知道她為什麼這麼做' },
      { verdict: 'slay', result: '她是冤魂：斬了算斬錯' },
    ],
  }),

  hutou: ch3({
    id: 'hutou', nature: 'villain', camp: 'south',
    name: '虎頭', dayName: '收香灰的大塊頭', shortName: '大塊頭', tex: 'g3_hutou',
    daySight: '市場後巷，一排孤魂野鬼低著頭排隊，一個一個把香灰交給一個刺青的大塊頭。交不出來的，被他一巴掌打到牆上。',
    harm: '後巷的孤魂每晚都要交香灰，交不出來就挨打',
    affects: '市場後巷的孤魂（阿旺）',
    payoff: '審過再斬：威名 +1，還能拿到香灰帳本（最後一戰揭穿蛟收供品）；也可以編入南營扛轎',
    timid: 3,
    flare: 5,
    taunts: [
      { line: '「這條街我的，神明也要排隊。」', type: 'taunt', hit: '霄將軍一腳踏碎地磚：「排你個頭啦！」\n大塊頭往後退了一步，刺青都在抖。', miss: '「怎樣？不爽喔？」' },
      { line: '「我生前是做善事的啦，市場誰不尊敬我？」', type: 'lie', evidence: ['bingbo_hutou'], truth: 0, hit: '章將軍：「太子殿的廟公說，你在市場收保護費，攤子不給就翻。出殯那天沒幾個人去。」\n「……那、那是他們不懂。」', miss: '「你去市場問啊！問看看誰敢說我壞話！」' },
      { line: '「沒人逼他們，是他們自己要交的。」', type: 'lie', evidence: ['awang_word', 'market_auntie'], truth: 1, hit: '章將軍：「後巷的孤魂說，交不出來就是一頓打。」\n大塊頭握緊拳頭，又鬆開。', miss: '「自願的啦！自願的！」' },
      { line: '「那堆香灰？別人放的，我只是幫忙顧。」', type: 'excuse', evidence: ['market_ash'], truth: 2, hit: '柳將軍：「中。」\n一袋一袋香灰甩在他腳邊，每袋都綁著孤魂的名字。', miss: '「拿不出東西就閉嘴。」' },
      { line: '「香灰是我自己要燒的，誰管得著？」', type: 'excuse', evidence: ['river_ash'], truth: 3, hit: '柳將軍：「中。」\n渡口石階上的香灰袋落在他面前。大塊頭臉色發白：「……你們去過渡口了？」', miss: '「我自己的東西，愛怎樣就怎樣。」' },
      { line: '「小朋友回家喝奶啦，大人在講話。」', type: 'taunt', hit: '太子：「……再說一次。」\n霄將軍還沒出手，大塊頭自己跪下去了。', miss: '「哈！被我說中了吧？」' },
    ],
    truths: [
      { summary: '他生前是市場的地方惡霸，收保護費、翻攤子。', reveal: '「市場的人都怕我……怕我才好啊，怕我才會給。」' },
      { summary: '死了以後他照樣欺負弱小：後巷的孤魂每晚都要交香灰，交不出就挨打。', reveal: '「陰間跟陽間一樣啦，拳頭大的說了算。」' },
      { summary: '後巷那堆香灰不是他的，是孤魂一袋一袋交上來的。', reveal: '「一袋一個名字，誰沒交我都記得。」' },
      { summary: '他收的香灰，最後都倒進疾水溪：他在替溪底的東西收供品。', reveal: '「……溪底那位說，收滿了，就讓我當這一帶的老大。」' },
    ],
    overnight: { say: '虎頭被太子壓了一晚，一開口就招了：「供品……供品是替溪底收的啦！」', breaks: 4 },
    lookLine: '「該斬。但牠身上有東西。」',
    dropsOnTrial: ['ash_ledger'],
    wrong: '「哈！神明也不過如此。」',
    verdicts: [
      { verdict: 'slay', result: '太子親斬。他是真惡（審過再斬：線索也拿到了）' },
      { verdict: 'recruit', needs: [1, 3], result: '編入南營當苦力：最後一戰扛轎，最耐打的前排' },
      { verdict: 'escort', result: '押送地府，照他生前死後做的事受審' },
    ],
  }),

  zhizha: ch3({
    id: 'zhizha', nature: 'villain', camp: 'center',
    name: '紙紮童', dayName: '舊壇的「三太子」', shortName: '舊壇太子', tex: 'g3_zhizha', kneelStory: 'zhizha3',
    daySight: '廢棄的小神壇前堆滿了糖果和玩具。壇上坐著一個穿紅肚兜的小孩，自稱三太子，小孩們排隊拜他。風一吹，他身上沙沙作響。',
    harm: '小孩們繼續把供品送到舊壇；晚上還會被哄去溪邊玩',
    affects: '庄裡的小孩；阿玲',
    payoff: '審過再斬：威名 +1，還能問出「紙紮童的話」（第三天找得到溪灣的線索）；也可以編入中營掃地',
    timid: 3,
    flare: 4,
    taunts: [
      { line: '「喔？你也是太子？我才是太子！小孩都這樣叫我！」', type: 'lie', evidence: ['kids_word'], truth: 0, hit: '章將軍：「小孩們說，你下雨天會皺，背後還有一條竹子。」\n「才、才沒有！」紙紮童趕緊把背貼到牆上。', miss: '「你看，你連證據都沒有。我才是真的！」' },
      { line: '「香爐本來就是這個樣子的啦！」', type: 'excuse', evidence: ['swapped_censer', 'censer_order'], truth: 1, hit: '柳將軍：「中。」\n香爐是照銅爐的樣子糊的紙，一按就凹。紙香爐被壓扁了。', miss: '「拿不出來喔？哈哈。」' },
      { line: '「我是神壇供的，有開光的！」', type: 'excuse', evidence: ['paper_book'], truth: 2, hit: '柳將軍：「中。」\n紙紮店的帳本攤開：「出殯那天下雨，只燒了一個。」\n紙紮童的臉一下子白了，比紙還白。', miss: '「有開光就是有開光！」' },
      { line: '「我只是陪小孩玩，哪有去什麼溪邊！」', type: 'lie', evidence: ['akai_creek'], truth: 3, hit: '章將軍：「上大夜的阿凱說，凌晨三點看到穿紅肚兜的小孩帶人往溪邊走。」\n太子的臉沉了下來。', miss: '「小孩自己要跟的啊。」' },
      { line: '「你們算什麼東西？給我跪下！」', type: 'taunt', hit: '太子：「喔？」\n乾坤圈落地，噹的一聲。紙紮童當場跪了下去，膝蓋都折出了摺痕。', miss: '「哼，不敢動手吧！」' },
    ],
    truths: [
      { summary: '牠不是太子，是喪禮剩下沒燒完的紙紮童子成了精。', reveal: '「……我、我只是想要有人拜我嘛。」' },
      { summary: '牠把神壇的銅香爐換成紙的，冒充太子騙小孩的供品。', reveal: '「糖果、汽水、玩具……都是我的。」' },
      { summary: '牠是一對紙紮童子裡沒燒到的那一個，出殯那天下雨，被丟在紙紮店後面。', reveal: '「另一個燒掉了。我一個人淋雨，淋了好久。」' },
      { summary: '牠半夜哄小孩去溪灣玩，是溪底的東西派牠去的。', reveal: '「溪底那位說……帶小孩去，就讓我當真的太子。」' },
    ],
    overnight: { say: '紙紮童被壓了一晚，身上的紙都皺了：「是溪底那位叫我帶小孩去的……」', breaks: 3 },
    lookLine: '「該斬。但牠身上有東西。」',
    dropsOnTrial: ['zhizha_word'],
    wrong: '「哈哈！你們連我是誰都不知道！」',
    verdicts: [
      { verdict: 'slay', result: '太子親斬。牠是真惡（審過再斬：線索也拿到了）' },
      { verdict: 'escort', result: '燒回去：送去牠本來該去的地方' },
      { verdict: 'recruit', needs: [0], result: '太子：「……你扮得不像，去中營掃地。」編入中營：最後一戰紙人替身吸收一次拖人' },
    ],
  }),

  dubo: ch3({
    id: 'dubo', nature: 'wronged', camp: 'north', memory: 'rain',
    name: '渡伯', dayName: '撐竹篙的老人', shortName: '撐篙老人', tex: 'g3_dubo',
    daySight: '疾水溪舊渡口，一個撐竹篙的老人站在破竹筏上，一直招手要人過溪。坐上他竹筏的人，都會在溪中間迷路。溪水今天是往山那邊流的。',
    harm: '最後一戰少了一個知道蛟弱點的人',
    affects: '最後一戰的蛟；何伯',
    payoff: '查清楚可以編入北營（最後一戰帶路、說出蛟的弱點）或超渡（技能「擺渡篙」）',
    timid: 2,
    flare: 4,
    taunts: [
      { line: '「我不是撐船的，我是來這裡釣魚的。」', type: 'lie', evidence: ['hebo_ferry', 'bingbo_ferry'], truth: 0, hit: '章將軍：「渡口的何伯說，以前撐渡船的阿伯，船在溪中間翻了，只有他沒上來。」\n老人握著竹篙的手停了下來。', miss: '「釣魚啦，釣魚。你們不釣就走開。」' },
      { line: '「在溪中間迷路，是霧太大，不關我的事。」', type: 'excuse', evidence: ['ferry_closed'], truth: 1, hit: '柳將軍：「中。」\n舊聞攤開：水底有東西抓著船底不放。老人看著溪面，半天才說：「……牠抓著我。」', miss: '「霧大就是霧大。」' },
      { line: '「你們這些神明，幾十年來，誰來過這個渡口？」', type: 'taunt', sore: true, hit: '太子沒有回嘴。老人看著溪水，說了很久的話。', miss: '老人把竹篙抱在懷裡，往後退了一步，不說話了。' },
      { line: '「那些人？自己游回去的啦，跟我無關。」', type: 'excuse', evidence: ['pole_carving', 'kid_shoes'], truth: 2, hit: '柳將軍：「中。」\n竹篙上的「正」字一筆一筆，數都數不完。老人笑了一下：「……被你們看到了。」', miss: '「我說無關就無關。」' },
      { line: '「要拉人下水的是我啦！來啊，把我斬了啊！」', type: 'taunt', sore: true, hit: '「斬了我，溪底那位就沒人騙了。」老人的聲音很輕。', miss: '老人閉上眼睛：「……斬吧。」' },
    ],
    truths: [
      { summary: '他是當年疾水溪的擺渡人「渡伯」。那年大水，船在溪中間翻了。', reveal: '「我撐了四十年的船。最後一趟，沒撐到對岸。」' },
      { summary: '溪底的蛟抓著他的魂，逼他替牠把人引下水。', reveal: '「牠說，帶一個人下來，就放我走。我在這裡撐了好多年。」' },
      { summary: '他每次都故意划慢、划歪，偷偷把人撥回岸邊。他知道蛟的弱點和舊帳。', reveal: '「划歪一次，放走一個。牠翻完江要喘很久，那時候最好打。」' },
    ],
    heart: ['「以前這個渡口很熱鬧，大家都叫我一聲渡伯。」', '「我不敢走。我走了，就沒人幫那些孩子划歪了。」'],
    overnight: { say: '渡伯被壓了一晚，冷靜下來了：「我不敢走。我走了，就沒人幫那些孩子划歪了。」' },
    lookLine: '「這個，水裡有話。」',
    wrong: '老人撐了一下竹篙，竹筏往溪中間漂遠了一點。',
    verdicts: [
      { verdict: 'recruit', needs: [0, 1], result: '編入北營：最後一戰他帶路，說出蛟的弱點（蛟翻江後喘息時傷害大增）' },
      { verdict: 'release', needs: [1, 2], result: '他放下竹篙，安心過溪。戾氣 -1；最後一戰多一個技能「擺渡篙」' },
      { verdict: 'escort', result: '押送地府。最後一戰少了一個知道蛟弱點的人' },
      { verdict: 'slay', result: '他是冤魂：斬了算斬錯' },
    ],
  }),

  // ===== 十惡小咖 =====
  shuigui: ch3({
    id: 'shuigui', nature: 'wicked', camp: 'west',
    name: '水鬼', dayName: '溪邊哭泣的年輕人', shortName: '哭泣青年', tex: 'g3_shuigui',
    daySight: '五營昨晚在疾水溪邊抓到的。一個渾身濕透的年輕人，一直哭，說自己是被人推下水的，好可憐。',
    harm: '溪邊還會有人被騙過去拉下水',
    affects: '庄裡到溪邊的人',
    payoff: '十惡不赦：不審直接斬，威名 +1',
    timid: 2,
    flare: 3,
    taunts: [
      { line: '「嗚嗚……我是被人推下去的，我好可憐……」', type: 'lie', evidence: ['angler_word'], truth: 0, hit: '章將軍：「溪邊的釣客說，你都等有人走近才哭，沒人的時候在水裡笑。」\n年輕人的眼淚一下子就乾了。', miss: '「嗚嗚嗚——你們神明欺負人——」（嘴角在笑）' },
      { line: '「那兩個人是自己滑倒的，不關我的事。」', type: 'excuse', evidence: ['drown_news'], truth: 1, hit: '柳將軍：「中。」\n舊聞攤開：同一個溪灣，兩個人。水鬼不哭了。', miss: '「證據呢？溪邊本來就滑啊。」' },
      { line: '「要抓我？先下水來啊！」', type: 'taunt', hit: '霄將軍一拳砸進地面，水花濺了牠一臉：「現在呢？」\n水鬼縮成一團。', miss: '「哈哈，不敢下水吧！」' },
      { line: '「我只是想找個伴嘛，一個人在水裡好冷。」', type: 'taunt', hit: '太子：「冷？等一下就不冷了。」\n水鬼跪在一灘水裡發抖。', miss: '「你們不懂啦。」' },
    ],
    truths: [
      { summary: '牠是抓交替的水鬼：在溪邊裝哭，騙好心人走近，再把人拉下水。', reveal: '「哭一下就有人來，很好用啊。」' },
      { summary: '同一個溪灣已經有兩個人被牠拉下去了。', reveal: '「再一個……再一個我就可以上岸了。」' },
    ],
    overnight: { say: '水鬼被壓了一晚，不哭了：「……好啦，我是裝的。」', breaks: 0 },
    lookLine: '「這個，不用問了。」',
    wrong: '「嗚嗚……」牠哭得更大聲了，眼睛偷偷往旁邊瞄。',
    verdicts: [
      { verdict: 'slay', result: '太子親斬。十惡不赦，不必多言' },
      { verdict: 'escort', result: '押送地府' },
      { verdict: 'recruit', needs: [0, 1], result: '編入西營當營兵（只加營兵人數）' },
    ],
  }),

  huosha: ch3({
    id: 'huosha', nature: 'wicked', camp: 'south',
    name: '火煞', dayName: '一身焦味的瘦小子', shortName: '焦味小子', tex: 'g3_huosha',
    daySight: '五營昨晚在庄尾抓到的。一個瘦小的影子，身上一股焦味，被押著還在嘻嘻笑，說「我什麼都沒做」。',
    harm: '庄尾的稻草堆還會一個一個燒起來',
    affects: '庄尾的人家',
    payoff: '十惡不赦：不審直接斬，威名 +1',
    timid: 2,
    flare: 3,
    taunts: [
      { line: '「稻草自己燒起來的啦，天氣那麼熱。」', type: 'excuse', evidence: ['scorch'], truth: 0, hit: '柳將軍：「中。」\n焦痕從正中間往外燒，地上一圈小腳印。火煞的笑容僵住了。', miss: '「你看嘛，拿不出東西。」' },
      { line: '「我那晚根本不在庄尾！」', type: 'lie', evidence: ['aling_fire'], truth: 1, hit: '章將軍：「抱著孩子的阿玲說，火光裡有一個人在拍手。」\n「……那、那個不是我。」', miss: '「誰看到？你叫他出來啊。」' },
      { line: '「燒得好看吧？哈哈哈！」', type: 'taunt', hit: '霄將軍：「好看？我給你看更好看的！」\n南營的火比牠大十倍。火煞抱著頭蹲下去。', miss: '「哈哈哈，你們也覺得好看！」' },
      { line: '「你玩火？我玩得比你久。」', type: 'taunt', hit: '太子腳下的風火輪轉了一圈。火煞的火苗，一下子全熄了。', miss: '「小鬼頭，回去玩你的輪子啦。」' },
    ],
    truths: [
      { summary: '庄尾的稻草堆不是意外起火，是牠點的。', reveal: '「點一下就著了，很簡單啊。」' },
      { summary: '牠點火取樂：看人慌慌張張救火，在旁邊拍手。', reveal: '「大家跑來跑去，很好笑啊。」' },
    ],
    overnight: { say: '火煞被壓了一晚，身上的焦味都淡了：「……是我點的啦。」', breaks: 0 },
    lookLine: '「這個，不用問了。」',
    wrong: '「嘻嘻。」牠手指上冒出一點火星。',
    verdicts: [
      { verdict: 'slay', result: '太子親斬。十惡不赦，不必多言' },
      { verdict: 'escort', result: '押送地府' },
      { verdict: 'recruit', needs: [0, 1], result: '編入南營當營兵（只加營兵人數）' },
    ],
  }),

  shuyao: ch3({
    id: 'shuyao', nature: 'wicked', camp: 'east',
    name: '鼠妖', dayName: '供桌下的胖老鼠', shortName: '胖老鼠', tex: 'g3_shuyao',
    daySight: '太子殿的供桌下，一隻跟貓一樣大的老鼠叼著糖果，看到隊伍來了，指著廟口一個撿香灰的瘦影子大喊：「是他偷的！」',
    harm: '太子殿的供品與香油錢繼續少，還會一直賴給孤魂',
    affects: '炳伯與太子殿；被嫁禍的孤魂',
    payoff: '十惡不赦：不審直接斬，威名 +1',
    timid: 2,
    flare: 3,
    taunts: [
      { line: '「錢箱是那些孤魂咬的啦，關我什麼事？」', type: 'excuse', evidence: ['bite_box'], truth: 0, hit: '柳將軍：「中。」\n錢箱底的齒痕，一排細細的老鼠牙。鼠妖趕緊把嘴閉起來。', miss: '「吱吱，拿不出證據喔。」' },
      { line: '「我親眼看到那個撿香灰的偷的！」', type: 'lie', evidence: ['bingbo_offer'], truth: 1, hit: '章將軍：「廟公說，供品不見那幾晚，看到的是一隻跟貓一樣大的老鼠。」\n鼠妖的鬍子一根一根垂下來。', miss: '「吱！我說的都是真的！」' },
      { line: '「廟裡的東西，誰拿到就是誰的！」', type: 'taunt', hit: '霄將軍：「那你的命，我拿到就是我的。」\n鼠妖吱的一聲，翻肚子了。', miss: '「吱吱吱，你們管不著！」' },
    ],
    truths: [
      { summary: '偷太子殿供品和香油錢的是牠。', reveal: '「糖果最好吃了……彈珠汽水也是。」' },
      { summary: '牠把偷東西的事賴給廟口撿香灰的孤魂。', reveal: '「孤魂又不會說話，賴給他們最方便。」' },
    ],
    overnight: { say: '鼠妖被壓了一晚，把偷藏的糖果紙全吐出來了：「錢箱是我咬的啦……」', breaks: 0 },
    lookLine: '「這個，不用問了。」',
    wrong: '「吱吱吱！」牠在供桌下竄來竄去。',
    verdicts: [
      { verdict: 'slay', result: '太子親斬。十惡不赦，不必多言' },
      { verdict: 'escort', result: '押送地府' },
      { verdict: 'recruit', needs: [0, 1], result: '編入東營當營兵（只加營兵人數）' },
    ],
  }),

  // ===== 小咖冤魂【待定】（計畫 D1、Q1） =====
  shaozaibo: ch3({
    id: 'shaozaibo', nature: 'wronged', camp: 'east',
    name: '哨仔伯【待定】', dayName: '半夜吹哨的老人', shortName: '吹哨老人', tex: 'g3_shaozaibo',
    daySight: '國小後門，一個戴著舊帽子的老人，半夜對著小孩用力吹哨子，把孩子嚇得哇哇哭。家長說，最近有孩子晚上不敢睡。',
    harm: '國小後門沒人守，往溪邊的小路就沒人攔',
    affects: '庄裡的小孩',
    payoff: '查清楚可以超渡；他守著往溪邊的路，跟紙紮童的事有關',
    timid: 1,
    flare: 3,
    onCollect: ['whistle'],
    taunts: [
      { line: '「我只是路過的老人，吹哨子不行喔？」', type: 'lie', evidence: ['school_word'], truth: 0, hit: '章將軍：「國小的工友說，以前有個導護老伯，每天站在後門吹哨子。」\n老人摸了摸頭上的舊帽子。', miss: '「我愛吹就吹。」' },
      { line: '「哨子是我撿來吹好玩的啦。」', type: 'excuse', evidence: ['whistle'], truth: 1, hit: '柳將軍：「中。」\n布條上寫著「後門導護」。哨子一直對著往溪邊的那條小路。', miss: '「撿來的就是撿來的。」' },
      { line: '「嚇哭就嚇哭，總比……哼，你們不懂啦！」', type: 'taunt', sore: true, hit: '太子沒有說話，讓他說完。老人的哨子在手裡轉了好幾圈。', miss: '老人縮了一下，把哨子藏到背後，不說話了。' },
    ],
    truths: [
      { summary: '他是國小以前的導護老伯，走了好幾年，還每天站在後門。', reveal: '「站了三十年，習慣了。」' },
      { summary: '他半夜吹哨把孩子嚇哭，是不讓他們往溪邊那條小路走：有東西在哄孩子去溪灣。', reveal: '「最近有個紅衣服的小鬼一直帶他們往溪邊去。我只能吹哨子，把他們嚇回家。」' },
    ],
    heart: ['「嚇哭總比淹死好。孩子哭一哭就好了，淹下去就回不來了。」'],
    overnight: { say: '哨仔伯被壓了一晚，冷靜下來了：「嚇哭總比淹死好……我只會這樣。」' },
    lookLine: '「這個，水裡有話。」',
    wrong: '老人吹了一聲哨子，把頭轉開。',
    verdicts: [
      { verdict: 'release', needs: [0, 1], result: '太子：「後門我派人顧。」他摘下帽子，安心離開。戾氣 -1' },
      { verdict: 'recruit', needs: [0], result: '編入東營當營兵，繼續守著國小後門（加營兵人數）' },
      { verdict: 'escort', result: '押送地府。國小後門沒人守了' },
      { verdict: 'slay', result: '他是冤魂：斬了算斬錯' },
    ],
  }),

  awang: ch3({
    id: 'awang', nature: 'wronged', camp: 'west',
    name: '阿旺【待定】', dayName: '撿香灰的瘦影子', shortName: '瘦影子', tex: 'g3_awang',
    daySight: '市場後巷，一個瘦巴巴的影子蹲在廟口，偷偷把香爐裡的香灰抓進布袋。看到隊伍，抱著布袋就想跑，一跛一跛的。',
    harm: '他還是每晚要交香灰；交不出就挨打',
    affects: '市場後巷的孤魂',
    payoff: '收容他會一起帶回「阿旺的話」與「香灰袋」（虎頭案的人證、物證）；查清楚可以超渡',
    timid: 1,
    flare: 3,
    onCollect: ['ash_bag', 'awang_word'],
    taunts: [
      { line: '「香灰是我自己要的啦，我、我拿來……拿來吃。」', type: 'excuse', evidence: ['ash_bag'], truth: 0, hit: '柳將軍：「中。」\n布袋口縫著一個歪歪的「虎」字。瘦影子把頭埋得更低了。', miss: '「不給拿就算了嘛……」' },
      { line: '「我沒有被打，是我自己跌倒的。」', type: 'lie', evidence: ['market_auntie'], truth: 1, hit: '章將軍：「市場的阿桑說，你每晚從巷尾回來，都是一跛一跛的。」\n瘦影子的眼淚掉了下來。', miss: '「真的是跌倒啦。」' },
      { line: '「抓我做什麼？去抓那個大的啊！……算了，抓了也沒用。」', type: 'taunt', sore: true, hit: '太子：「說。」\n瘦影子愣了一下，然後一口氣把後巷的事全說了。', miss: '瘦影子抱著布袋縮到牆角，一直發抖。' },
    ],
    truths: [
      { summary: '他撿香灰不是偷，是要交給後巷的大塊頭虎頭。', reveal: '「一晚一袋……少一點都不行。」' },
      { summary: '他交不出香灰就被虎頭打。後巷的孤魂都一樣。', reveal: '「大家都怕他。神明又不會管我們這種的。」' },
    ],
    heart: ['「我死了也沒人拜，只能撿別人剩的香灰。撿來的還要交出去。」'],
    overnight: { say: '阿旺被壓了一晚，第一次睡得那麼安穩：「營裡……沒有人打我。」' },
    lookLine: '「這個，水裡有話。」',
    wrong: '瘦影子抱著布袋，往牆角縮。',
    verdicts: [
      { verdict: 'release', needs: [0, 1], result: '太子：「以後太子殿的香，分你一份。」他安心離開。戾氣 -1' },
      { verdict: 'recruit', needs: [0], result: '編入西營當營兵（加營兵人數）：營裡沒有人會打他' },
      { verdict: 'escort', result: '押送地府' },
      { verdict: 'slay', result: '他是冤魂：斬了算斬錯' },
    ],
  }),
};
