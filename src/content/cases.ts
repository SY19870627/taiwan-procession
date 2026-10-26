/**
 * 鬼的案子與證據（依「收容與夜審 設計大綱 v0.2」）。
 *
 * 白天：沿路收容鬼、蒐集證據。晚上：夜審時追問供詞、出示證據，揭開真相後下判決。
 * 遊戲中一律用虛構名稱；角色名字不可重複。
 */

// ---------- 證據 ----------
export type EvidenceKind = '證詞' | '物證' | '文獻';

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  /** 短名（證物袋、出示時顯示） */
  name: string;
  /** 內容 */
  text: string;
}

export const EVIDENCE: Record<string, Evidence> = {
  // 阿桂
  tablet: { id: 'tablet', kind: '文獻', name: '廟誌・無主牌位', text: '青嶺宮廟誌記著一塊無主牌位「陳門阿桂」。自從管理牌位的人過世，就沒人上香了。' },
  axiu: { id: 'axiu', kind: '證詞', name: '阿秀嬸的話', text: '「每晚子時哭，摸他額頭冰冰的，可是又在燒。」' },
  censer: { id: 'censer', kind: '物證', name: '古井邊的小香爐', text: '古井鐵蓋下藏著一個沒人認的小香爐，香早就斷了。' },
  cloth: { id: 'cloth', kind: '證詞', name: '布莊老闆娘的話', text: '「早年井邊有個賣粿的阿桂。她的囝仔發燒，那晚沒有醫生肯來……後來她也走了。」' },
  // 阿標
  jiaoti: { id: 'jiaoti', kind: '文獻', name: '抓交替', text: '黃曆舊聞：河岸舊多溺者。俗謂水鬼須得替身，乃去，謂之「抓交替」。' },
  yun_river: { id: 'yun_river', kind: '證詞', name: '小芸的話（河邊）', text: '「河邊有一個濕濕的叔叔，一直叫我下去幫他撿球。」' },
  ribbon: { id: 'ribbon', kind: '物證', name: '河堤的紅布條', text: '河堤欄杆上一條新綁的紅布條。上個月有人在這裡差點溺水，家屬綁的。' },
  elder: { id: 'elder', kind: '證詞', name: '長輩的話', text: '「阿標喔？那年喝醉酒跳下去游，誰勸都不聽，就沒再上來了。」' },
  // 阿添公
  azhe: { id: 'azhe', kind: '證詞', name: '阿哲的話', text: '「冰庫半夜自己斷電，客人說店裡很冷、坐不住。這樣怎麼做下去？」' },
  photo: { id: 'photo', kind: '物證', name: '開店老照片', text: '冰果室牆上的老照片：「民國五十年開幕」。照片裡站在店門口的，就是那個擦桌子的老人。' },
  yun_pot: { id: 'yun_pot', kind: '證詞', name: '小芸的話（冰果室）', text: '「冰果室裡有個阿公，每天晚上把一個大鍋子拿出來放在桌上。」' },
  sugar: { id: 'sugar', kind: '物證', name: '鍋底的黑糖', text: '冰果室廚房角落的大鍋，鍋底結著一層燒焦的黑糖。' },
  // 阿福
  linbo: { id: 'linbo', kind: '證詞', name: '林伯說的傳說', text: '「那匹馬是跟著聖王出征的。聖王走了，牠被留在山上；後來莊裡的人鑿了牠的肚子。」' },
  rein: { id: 'rein', kind: '物證', name: '斷掉的韁繩', text: '一截斷掉的舊韁繩，皮上刻著一個「福」字。' },
  axiong: { id: 'axiong', kind: '證詞', name: '阿雄的話', text: '「蹄印都是往北，一路往龍嶺寺那邊去。不像在找吃的，像在找路。」' },
  poem: { id: 'poem', kind: '文獻', name: '惠澤宮籤詩', text: '「山中石駒久無主，夜夜長嘶望北風；若得舊人呼一聲，不須鞭策自歸宮。」' },
};

// ---------- 案子 ----------
export type Verdict = 'release' | 'recruit' | 'escort' | 'slay' | 'free';

export const VERDICT_NAME: Record<Verdict, string> = {
  release: '化解超渡',
  recruit: '收編',
  escort: '押送地府',
  slay: '斬',
  free: '放走',
};

export interface Truth {
  /** 對哪一句供詞出示 */
  stmt: number;
  /** 哪些證據都可以戳破這一句 */
  evidence: string[];
  /** 揭開的真相（判官記錄的一句話） */
  summary: string;
  /** 鬼的回應 */
  reveal: string;
}

export interface VerdictDef {
  verdict: Verdict;
  /** 需要先查明哪幾層真相（索引） */
  needs?: number[];
  /** 其他條件（例如小芸平安） */
  extra?: { test: (r: import('../state').RunState) => boolean; why: string };
  /** 判決選項上寫明的結果 */
  result: string;
}

export interface GhostCase {
  id: string;
  /** 真名（夜審查明前顯示 dayName） */
  name: string;
  /** 白天看到時的稱呼 */
  dayName: string;
  /** 外觀用的貼圖 */
  tex: string;
  /** 白天看到的樣子 */
  daySight: string;
  /** 不收容的話會怎樣 */
  harm: string;
  /** 膽小程度：戾氣 ≥ timid 會躲起來，≥ timid+1 會逃走 */
  timid: number;
  /** 有冤的鬼：斬了算斬錯 */
  innocent: boolean;
  /** 收容時一起得到的證據 */
  onCollect?: string[];
  /** 夜審供詞 */
  statements: string[];
  /** 追問每一句時多說的話 */
  press: string[];
  truths: Truth[];
  /** 出示錯的證據時的反應 */
  wrong: string;
  verdicts: VerdictDef[];
}

export const CASES: Record<string, GhostCase> = {
  gui: {
    id: 'gui', name: '阿桂', dayName: '古井邊的女人', tex: 'folk3',
    daySight: '菜市場角落有一口用鐵板蓋住的古井。井邊蹲著一個穿大襟衫的女人，一直望著阿秀嬸的攤子。',
    harm: '她今晚還會去阿秀嬸家；阿弟的燒不會退',
    timid: 1, innocent: true,
    statements: [
      '我沒有害那個囡仔。',
      '我只是去看看他睡得好不好。',
      '我在等我的囝仔回來。',
      '這世間已經沒人記得我了。',
    ],
    press: [
      '「我怎麼會害他……他睡著的樣子，跟我的囝仔一模一樣。」',
      '「看看而已。半夜囡仔踢被，總要有人看。」',
      '「他說要去井邊玩一下就回來。我就在這裡等。」',
      '「市場那麼多人，從來沒有人往井邊看一眼。」',
    ],
    truths: [
      { stmt: 1, evidence: ['axiu'], summary: '她每晚去摸阿弟的額頭；亡者的手是冷的，孩子因此發燒。她不是故意的。', reveal: '「……我只是摸摸他的額頭，像以前摸我的囝仔那樣。我不知道……我的手是冷的。」' },
      { stmt: 2, evidence: ['cloth'], summary: '她的孩子很早以前就發燒走了；那晚沒有醫生肯來。她一直不肯接受。', reveal: '「那晚我跑遍整條街，沒有一個醫生肯開門。他燒了一整夜……天亮就沒了。」' },
      { stmt: 3, evidence: ['tablet', 'censer'], summary: '她在廟裡有牌位，只是沒人上香了；她以為自己被忘了。', reveal: '「我還有牌位？……我以為，早就沒有人記得阿桂這個名字了。」' },
    ],
    wrong: '她低下頭，不再說話。',
    verdicts: [
      { verdict: 'release', needs: [1, 2], result: '重新為她的牌位上香，她放下等待離開。阿弟退燒；信徒增加。戾氣 -1' },
      { verdict: 'recruit', needs: [0], result: '她答應不再碰孩子，留下來當「護嬰娘」：最後一戰淨符回復更多' },
      { verdict: 'escort', result: '阿弟退燒，但她的冤情沒解' },
      { verdict: 'slay', result: '阿弟退燒。戾氣 +1' },
    ],
  },
  biao: {
    id: 'biao', name: '阿標', dayName: '河堤下的濕男人', tex: 'folk1',
    daySight: '河堤下的水裡站著一個男人，全身濕透，對著路過的孩子招手。凡人只看到一片水光。',
    harm: '他會繼續在河邊招孩子下水',
    timid: 3, innocent: false,
    statements: [
      '我是被人推下去的！我要找那個人討公道。',
      '我在那裡三十年，從來沒害過人。',
      '那個查某囡仔是自己要下來玩的。',
      '放我走，我就不會再回來。',
    ],
    press: [
      '「就是有人推我！那天晚上……那天晚上很多人。」',
      '「我只是站在那裡，又沒有動手。」',
      '「囡仔愛玩水，我有什麼辦法？」',
      '「我發誓。三十年了，你就放我走吧。」',
    ],
    truths: [
      { stmt: 0, evidence: ['elder'], summary: '沒有人推他，是他自己喝醉跳下去的。', reveal: '「……好啦。是我自己跳的。喝了酒，覺得自己游得過去。」' },
      { stmt: 1, evidence: ['ribbon'], summary: '上個月他拖過一個人，差一點就「抓到交替」。', reveal: '「那個人自己腳滑！……我只是拉了一下。只拉了一下。」' },
      { stmt: 2, evidence: ['yun_river', 'jiaoti'], summary: '是他引誘小芸下水。他想找人替他留在水裡，因為他怕一個人再待三十年。', reveal: '「水裡很冷，很暗。三十年，沒有一個人跟我說話。我只是……不想再一個人了。」' },
    ],
    wrong: '「哈，這跟我有什麼關係？」他笑了，水從他的袖口一直滴下來。',
    verdicts: [
      { verdict: 'recruit', needs: [0, 1, 2], result: '他願意贖罪，當「前鋒」：最後一戰衝最前面的近戰' },
      { verdict: 'escort', result: '河岸平安' },
      { verdict: 'slay', result: '河岸從此平安。戾氣 +1' },
      { verdict: 'free', result: '相信他的話放他走（真相未明的話，他可能會再去抓交替）' },
    ],
  },
  tian: {
    id: 'tian', name: '阿添公', dayName: '冰果室裡擦桌子的老人', tex: 'folk4',
    daySight: '冰果室最裡面那張桌子，一個穿汗衫的老人一直在擦桌子，擦完又擦。阿哲從他身邊走過，什麼都沒看到。',
    harm: '冰庫還會半夜斷電，客人越來越少',
    timid: 2, innocent: true,
    statements: [
      '這間店是我的，誰都不能賣。',
      '我沒有嚇客人，是那個囝仔做的冰不好吃，客人自己不來。',
      '那個囝仔從小就不聽話，我跟他沒話講。',
    ],
    press: [
      '「五十年了。這張桌子，我擦了五十年。」',
      '「糖水煮得那麼稀，誰要吃？」',
      '「他小時候最愛坐在冰庫旁邊等我切冰。後來就出國了，一句話也沒說。」',
    ],
    truths: [
      { stmt: 1, evidence: ['azhe'], summary: '冰庫是他弄斷電的。他想讓阿哲做不下去、乾脆別賣，留著店。', reveal: '「……是我拔的。店沒生意，他就不會有人來買。店就還是我的。」' },
      { stmt: 0, evidence: ['photo'], summary: '他怕的不是店被賣，是店不見了，就沒人記得他這輩子做過什麼。', reveal: '「店要是沒了，誰還記得這條街有過一間阿添冰果室？」' },
      { stmt: 2, evidence: ['yun_pot', 'sugar'], summary: '他每晚把熬黑糖水的大鍋拿出來，是想教阿哲煮那一鍋招牌糖水；阿哲看不見他。', reveal: '「那鍋糖水……我想教他。可是他看不見我。我拿鍋子出來，他就收回去。」' },
    ],
    wrong: '「哼。」他繼續擦桌子。',
    verdicts: [
      { verdict: 'release', needs: [2], extra: { test: (r) => r.b.xiaoyun === 'protected' || r.b.xiaoyun === 'invited', why: '需要小芸平安，才能替他傳話' }, result: '小芸替他傳話，阿哲照著煮出那鍋糖水，冰果室留下來。戾氣 -1' },
      { verdict: 'recruit', needs: [0], result: '他答應不再弄壞冰庫，跟著隊伍走：最後一戰小妖靠近神轎會被凍慢' },
      { verdict: 'escort', result: '冰庫不再斷電，但阿哲還是會把店賣掉' },
      { verdict: 'slay', result: '冰庫不再斷電，但阿哲會把店賣掉。戾氣 +1' },
    ],
  },
  fu: {
    id: 'fu', name: '阿福', dayName: '拿著斷韁繩的老人', tex: 'folk5',
    daySight: '蹄印旁邊站著一個老人，手裡拿著一截斷掉的韁繩，一直往山上看。',
    harm: '最後一戰少了一個認得石駒的人',
    timid: 1, innocent: true,
    onCollect: ['rein'],
    statements: [
      '石駒是惡獸，該斬。',
      '我只是剛好死在那座山上。',
      '我跟那匹馬沒有關係。',
    ],
    press: [
      '「牠吃莊稼、踩田，嚇得大家不敢上山。這樣還不該斬？」',
      '「老了，走不動了，就倒在山路上。就這樣。」',
      '「馬就是馬。我一個老頭子，跟馬能有什麼關係。」',
    ],
    truths: [
      { stmt: 2, evidence: ['rein'], summary: '他是當年替聖王牽馬的馬伕。', reveal: '「……這條韁繩，是我親手綁上去的。我是牠的馬伕。」' },
      { stmt: 1, evidence: ['linbo'], summary: '聖王離開那天，他把石駒綁在山上說「等我回來」，卻在路上病死了。石駒一直在等。', reveal: '「我跟牠說，等我回來。……我沒能回去。我死在下山的路上。」' },
      { stmt: 0, evidence: ['axiong', 'poem'], summary: '石駒往北走，是在找當年離開的路。牠不是作惡，是在找人；他說該斬，是因為愧疚。', reveal: '「牠在找我。……我不敢見牠。我讓牠等了幾百年。」' },
    ],
    wrong: '老人握緊了韁繩，轉頭看向山的方向。',
    verdicts: [
      { verdict: 'recruit', needs: [1], result: '他願意去見石駒：最後一戰的陣前審問，他可以上前喊石駒的名字' },
      { verdict: 'release', needs: [1], result: '他安心離開，但最後一戰少了「舊人」' },
      { verdict: 'escort', result: '最後一戰少了「舊人」' },
      { verdict: 'slay', result: '最後一戰少了「舊人」。戾氣 +1' },
    ],
  },
};
