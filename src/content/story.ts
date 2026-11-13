/**
 * 過場劇情。妖怪視角為主（小妖詼諧、石駒悲涼），第一、二章神明只以「旨意」出現，不畫神明的臉（第三章起可以畫臉，見 ch3/story.ts）。
 * 遊戲中一律使用虛構名稱（見設計文件 14.5 命名原則）。
 */

import { CUTSCENES3 } from './ch3/story';
import { CUTSCENES4 } from './ch4/story';

export type SpeakerId = 'narrator' | 'wang' | 'mei' | 'kui' | 'shiju' | 'shijuCalm' | 'god' | 'kaijiang' | 'judge' | 'baoma' | 'yun' | 'heichao' | 'heichaoCalm' | 'zhongjun'
  | 'taizi' | 'zhangjiang' | 'xiaojiang' | 'liujiang' | 'lianjiang' | 'jiao' | 'jiaoCalm' | 'zhizha' | 'xiabing' | 'bingbo' | 'hebo'
  | 'wupan' | 'qiye' | 'baye' | 'xunbu' | 'jiaoban'
  // 第四章（白砂墩）：媽祖全章不露臉、不講話，沒有說話者
  | 'qianshao' | 'yawei' | 'touqi' | 'arui' | 'aman' | 'xianzai' | 'xiuzhi' | 'ahan' | 'caoxie' | 'apo'
  | 'xiangdeng' | 'xiangdengbo' | 'jiaoban4' | 'cunbo' | 'qianlu' | 'chashui' | 'oajian' | 'mangdu'
  // 第四章第二天
  | 'xinniang' | 'jiajiao' | 'zhongren' | 'jingyuan' | 'zunama' | 'qiaoren' | 'yijing' | 'dianxin' | 'xuesheng' | 'diantou' | 'guqi'
  // 第四章第三天
  | 'xiuzhiamu' | 'yijing4' | 'fandan' | 'dengchuan' | 'tideng' | 'jinshui';

export const SPEAKERS: Record<Exclude<SpeakerId, 'narrator'>, { name: string; tex: string; side: 'left' | 'right'; scale: number }> = {
  wang: { name: '阿魍', tex: 'wang', side: 'left', scale: 2.4 },
  mei: { name: '阿魅', tex: 'mei', side: 'right', scale: 2.2 },
  kui: { name: '石屑傀', tex: 'kui', side: 'right', scale: 2.0 },
  shiju: { name: '石駒', tex: 'shiju', side: 'right', scale: 1.3 },
  shijuCalm: { name: '石駒', tex: 'shiju_calm', side: 'right', scale: 1.3 },
  god: { name: '青嶺王（旨意）', tex: 'decree', side: 'left', scale: 1.4 },
  kaijiang: { name: '開疆聖王（旨意）', tex: 'decree', side: 'left', scale: 1.4 },
  judge: { name: '文判官', tex: 'judge', side: 'left', scale: 1.7 },
  baoma: { name: '報馬仔', tex: 'baoma', side: 'left', scale: 1.8 },
  // 第一、二章熱鬧化：隨從開口（暫代貼圖：武判官、巡捕、轎班在 art/stage.ts；七爺八爺用陣頭小人）
  wupan: { name: '武判官', tex: 'wupan', side: 'left', scale: 1.7 },
  qiye: { name: '七爺', tex: 'qiye', side: 'left', scale: 1.3 },
  baye: { name: '八爺', tex: 'baye', side: 'right', scale: 1.8 },
  // 第二章（東津）
  yun: { name: '雲王爺（旨意）', tex: 'decree', side: 'left', scale: 1.4 },
  heichao: { name: '黑潮', tex: 'heichao', side: 'right', scale: 1.0 },
  heichaoCalm: { name: '黑潮', tex: 'heichao_calm', side: 'right', scale: 1.0 },
  zhongjun: { name: '中軍府', tex: 'zhongjun', side: 'left', scale: 1.7 },
  xunbu: { name: '巡捕', tex: 'xunbu', side: 'right', scale: 1.7 },
  jiaoban: { name: '轎班', tex: 'jiaoban', side: 'right', scale: 1.8 },
  // 第三章（新瀛）：神明可以畫臉（決策紀錄 2026-10-27），太子與五將用立繪
  // 神明在左、妖怪與凡人在右（同一邊換人時，前一位會退下）
  taizi: { name: '太子爺', tex: 'w3_flags', side: 'left', scale: 1.4 },
  zhangjiang: { name: '章將軍', tex: 'w3_zhang', side: 'left', scale: 1.7 },
  xiaojiang: { name: '霄將軍', tex: 'w3_xiao', side: 'left', scale: 1.7 },
  liujiang: { name: '柳將軍', tex: 'w3_liu', side: 'left', scale: 1.7 },
  lianjiang: { name: '廉將軍', tex: 'w3_lian', side: 'left', scale: 1.7 },
  jiao: { name: '蛟', tex: 'xia_imp', side: 'right', scale: 2.0 },
  jiaoCalm: { name: '蛟', tex: 'xia_imp', side: 'right', scale: 2.0 },
  zhizha: { name: '紙紮童', tex: 'g3_zhizha', side: 'right', scale: 1.8 },
  xiabing: { name: '蝦兵', tex: 'xia_imp', side: 'right', scale: 2.0 },
  bingbo: { name: '炳伯', tex: 'n3_bingbo', side: 'right', scale: 1.8 },
  hebo: { name: '何伯', tex: 'n3_hebo', side: 'right', scale: 1.8 },
  // 第四章（白砂墩）：立繪還沒到，先用程式畫的小人（folk*、st_*）。兵馬在左、凡人與鬼在右。媽祖不是說話者
  qianshao: { name: '前哨', tex: 'folk1', side: 'left', scale: 1.8 },
  yawei: { name: '押尾', tex: 'folk2', side: 'left', scale: 1.8 },
  touqi: { name: '頭旗手', tex: 'st_touqi', side: 'left', scale: 0.5 },
  arui: { name: '阿睿', tex: 'folk1', side: 'right', scale: 1.8 },
  aman: { name: '阿滿姨', tex: 'folk3', side: 'right', scale: 1.8 },
  xianzai: { name: '賢仔', tex: 'folk2', side: 'right', scale: 1.8 },
  xiuzhi: { name: '秀枝', tex: 'folk4', side: 'right', scale: 1.8 },
  ahan: { name: '阿翰', tex: 'folk1', side: 'right', scale: 1.8 },
  caoxie: { name: '草鞋丁', tex: 'folk2', side: 'right', scale: 1.8 },
  apo: { name: '點心擔阿婆', tex: 'folk3', side: 'right', scale: 1.8 },
  xiangdeng: { name: '香燈腳們', tex: 'st_xiangdeng_c', side: 'right', scale: 0.5 },
  xiangdengbo: { name: '香燈腳阿伯', tex: 'st_xiangdeng_a', side: 'right', scale: 0.5 },
  jiaoban4: { name: '轎班們', tex: 'st_xiangdeng_c', side: 'right', scale: 0.5 },
  cunbo: { name: '村裡的阿伯', tex: 'folk2', side: 'right', scale: 1.8 },
  qianlu: { name: '牽路仔', tex: 'st_qianlu', side: 'right', scale: 0.5 },
  chashui: { name: '茶水攤的阿伯', tex: 'folk2', side: 'right', scale: 1.8 },
  oajian: { name: '賣蚵嗲的阿桑', tex: 'folk3', side: 'right', scale: 1.8 },
  // 第四章魔王：立繪 mangdu 還沒到，先用戰鬥圖的暫代（b4_mangdu，520×420）
  mangdu: { name: '茫渡', tex: 'b4_mangdu', side: 'right', scale: 0.45 },
  // 第四章第二天（_agent/ch4-text-day2.md）：立繪都還沒有，先用小人
  xinniang: { name: '新娘', tex: 'folk5', side: 'right', scale: 1.8 },
  jiajiao: { name: '假香燈腳', tex: 'folk4', side: 'right', scale: 1.8 },
  zhongren: { name: '眾人', tex: 'st_xiangdeng_b', side: 'right', scale: 0.5 },
  jingyuan: { name: '派出所的警員', tex: 'folk1', side: 'right', scale: 1.8 },
  zunama: { name: '圳邊的阿嬤', tex: 'folk3', side: 'right', scale: 1.8 },
  qiaoren: { name: '橋上的人', tex: 'st_xiangdeng_d', side: 'right', scale: 0.5 },
  yijing: { name: '義警阿伯', tex: 'folk2', side: 'right', scale: 1.8 },
  dianxin: { name: '點心站的阿姨', tex: 'folk3', side: 'right', scale: 1.8 },
  xuesheng: { name: '擺攤的學生', tex: 'folk1', side: 'right', scale: 1.8 },
  diantou: { name: '點人頭的阿伯', tex: 'folk2', side: 'right', scale: 1.8 },
  guqi: { name: '顧旗的囡仔', tex: 'folk5', side: 'right', scale: 1.8 },
  // 第四章第三天（_agent/ch4-text-day3.md 總註的新說話者；秀枝的阿母沒有名字）＋遺憾結局的金水伯
  xiuzhiamu: { name: '秀枝的阿母', tex: 'folk3', side: 'right', scale: 1.8 },
  yijing4: { name: '橋頭的義警', tex: 'folk2', side: 'right', scale: 1.8 },
  fandan: { name: '飯擔的阿嫂', tex: 'folk3', side: 'right', scale: 1.8 },
  dengchuan: { name: '等船的人', tex: 'folk2', side: 'right', scale: 1.8 },
  tideng: { name: '提燈的', tex: 'folk4', side: 'right', scale: 1.8 },
  jinshui: { name: '金水伯', tex: 'folk2', side: 'right', scale: 1.8 },
};

/** 過場說話的人 → 立繪圖（代號、預設表情）；神明一律用「旨意」那張圖 */
export const ART: Partial<Record<Exclude<SpeakerId, 'narrator'>, [string, import('../art/portraits').Expr]>> = {
  wang: ['wang', 'normal'], mei: ['mei', 'normal'], kui: ['kui', 'normal'],
  shiju: ['shiju', 'angry'], shijuCalm: ['shiju', 'calm'],
  god: ['decree', 'normal'], kaijiang: ['decree', 'normal'], yun: ['decree', 'normal'],
  judge: ['judge', 'normal'], zhongjun: ['zhongjun', 'normal'],
  // 新角色：畫師的立繪到了就用（art/stageSpec.ts），沒到就用程式畫的小人
  wupan: ['wupan', 'normal'], qiye: ['qiye', 'normal'], baye: ['baye', 'normal'], baoma: ['baoma', 'normal'],
  xunbu: ['xunbu', 'normal'], jiaoban: ['jiaoban', 'normal'],
  heichao: ['heichao', 'angry'], heichaoCalm: ['heichao', 'calm'],
  taizi: ['taizi', 'normal'], zhangjiang: ['zhangjiang', 'normal'],
  xiaojiang: ['xiaojiang', 'normal'], liujiang: ['liujiang', 'normal'], lianjiang: ['lianjiang', 'normal'],
  jiao: ['jiao', 'angry'], jiaoCalm: ['jiao', 'calm'],
  zhizha: ['zhizha', 'normal'], xiabing: ['xiabing', 'normal'], bingbo: ['bingbo', 'normal'], hebo: ['hebo', 'normal'],
  // 第四章：立繪檔名見 docs/第四章_美術接點清單.md §3（沒到就用 SPEAKERS 的小人）
  qianshao: ['qianshao', 'normal'], yawei: ['yawei', 'normal'], touqi: ['touqi', 'normal'],
  arui: ['arui', 'normal'], aman: ['aman', 'normal'], xianzai: ['xianzai', 'normal'], xiuzhi: ['xiuzhi', 'normal'],
  ahan: ['ahan', 'normal'], caoxie: ['caoxie', 'normal'], apo: ['apo', 'normal'], mangdu: ['mangdu', 'normal'],
};

/** 說話的人的名字 → 程式畫的小人（白天的對話用「名字：「…」」寫，見 ui/split.ts） */
export const SPEAKER_TEX: Record<string, string> = Object.fromEntries(Object.values(SPEAKERS).map((s) => [s.name, s.tex]));

export interface Line {
  who: SpeakerId;
  text: string;
  /** 表情（有立繪圖的才有用；沒寫就用 ART 的預設） */
  expr?: import('../art/portraits').Expr;
  /** 演出效果 */
  fx?: 'shake' | 'firecracker' | 'flash';
  /** 只在這個條件成立時播（文字版；第四章天亮：阿婆判「就在這裡下」才有的那一句） */
  when?: (r: import('../state').RunState) => boolean;
  /** 這一句出來之前先播一段畫面（文字版；第四章 jump scare，畫面在 ui/scare4.ts）。畫面播完或被跳過才出這一句 */
  pre?: 'scareTideng4';
}

export interface Cutscene {
  /** 畫面色調：妖怪視角是紫色，廟裡是金色 */
  mood: 'demon' | 'temple' | 'dawn';
  place: string;
  /** 遠景：海邊（第二章）、溪邊（第三章疾水溪）、嘉南平原（第三章） */
  bg?: 'sea' | 'river' | 'plain';
  /** 神明視角時的廟 */
  temple?: string;
  lines: Line[];
}

export const CUTSCENES: Record<string, Cutscene> = {
  dusk3: {
    mood: 'demon',
    place: '芝嶺巖・入夜',
    lines: [
      { who: 'shiju', text: '我記得鑼聲，記得旗子在風裡響。' },
      { who: 'shiju', text: '肚子那個洞，冷風一直灌進來。' },
      { who: 'shiju', text: '你們這些拿旗子的人……\n也是來鑿我的嗎？', fx: 'shake' },
    ],
  },
  recall: {
    mood: 'temple',
    place: '惠澤宮・廟埕',
    lines: [
      { who: 'kaijiang', text: '回來吧。', fx: 'flash' },
      { who: 'shijuCalm', text: '……主公。' },
    ],
  },
  // ---------- 第一章熱鬧化（docs/第一二章_熱鬧化計畫.md 第 2 階段）：以下 5 段台詞全部【待定】 ----------
  // 開場：序章擲筊之後、第一天黃曆之前
  anfang1: {
    mood: 'temple',
    place: '萬舺青嶺宮・入夜',
    temple: 'temple_qingling',
    lines: [
      { who: 'narrator', text: '十月十九，入夜。青嶺宮的廟門開了，\n燈籠一盞一盞點起來。' },
      { who: 'baoma', text: '鏘——！青嶺王暗訪，閒人迴避——！' },
      { who: 'qiye', text: '扇子帶了，鎖鏈也帶了。八弟，走吧。' },
      { who: 'baye', text: '我走前面。七哥你腿長，別踩到我。' },
      { who: 'judge', text: '燈點好了。今晚帶回來的，我一個一個問。' },
      { who: 'wupan', text: '刀也磨好了。問不出來的，交給我。' },
      { who: 'judge', text: '不急。先問。' },
      { who: 'god', text: '今晚暗訪，閒人迴避。', fx: 'flash' },
    ],
  },
  // 第二夜天亮前（第三天黃曆之前）
  shanlu1: {
    mood: 'dawn',
    place: '芝林山路・天亮前',
    lines: [
      { who: 'narrator', text: '第二夜快過去了。山路上有人一路跑下來，\n鑼都忘了敲。' },
      { who: 'baoma', text: '蹄、蹄印！山上有蹄印！' },
      { who: 'baye', text: '喘口氣再說。什麼蹄印？' },
      { who: 'baoma', text: '這——麼大！石頭踩出來的，一路往北！', fx: 'shake' },
      { who: 'qiye', text: '是石駒。往北……就是芝嶺巖。' },
      { who: 'wupan', text: '正好。今天就上山。' },
      { who: 'judge', text: '牠為什麼往北走，總有個原因。路上再問問。' },
    ],
  },
  // 最後一戰・送回山中
  shijuReturn1: {
    mood: 'dawn',
    place: '芝嶺巖・天將亮',
    lines: [
      { who: 'narrator', text: '天將亮。石駒站起來，一步一步走回山裡。' },
      { who: 'god', text: '回去吧。山還在，你等的人也還記得你。', fx: 'flash' },
      { who: 'baye', text: '就這樣讓牠走？' },
      { who: 'qiye', text: '噓。你看。' },
      { who: 'narrator', text: '走到山腰，石駒停下來，回頭看了一眼。' },
      { who: 'shijuCalm', text: '……鑼聲，我記得。' },
      { who: 'narrator', text: '然後牠轉過身，走進了晨霧裡。' },
    ],
  },
  // 最後一戰・斬
  shijuSlay1: {
    mood: 'dawn',
    place: '芝嶺巖・天將亮',
    lines: [
      { who: 'narrator', text: '武判官的刀落下。石駒化成一地碎石。', fx: 'shake' },
      { who: 'wupan', text: '……斬了。' },
      { who: 'narrator', text: '文判官放下了筆，很久沒有說話。' },
      { who: 'baye', text: '判官，您寫啊。' },
      { who: 'judge', text: '牠肚子那個洞……到最後，都沒有人問牠痛不痛。' },
      { who: 'wupan', text: '……我去把碎石撿起來，放回山上。' },
    ],
  },
  // 回宮：三種結局都播，之後是信徒錄
  huigong1: {
    mood: 'dawn',
    place: '萬舺青嶺宮・天亮',
    temple: 'temple_qingling',
    lines: [
      { who: 'narrator', text: '天亮了。暗訪的隊伍回到青嶺宮。' },
      { who: 'qiye', text: '扇子收起來囉。' },
      { who: 'baye', text: '鎖鏈也收了。……七哥，我腳好痠。' },
      { who: 'qiye', text: '你走最前面，走最多。' },
      { who: 'baoma', text: '我、我跑了三天……我先躺一下……' },
      { who: 'narrator', text: '報馬仔一躺下，就在廟埕上睡著了，鑼還抱在懷裡。' },
      { who: 'judge', text: '三天的口供，都記好了。' },
      { who: 'god', text: '辛苦了。暗訪，到此為止。', fx: 'flash' },
    ],
  },
  // ---------- 第二章：東津・迎王 ----------
  tide3: {
    mood: 'demon',
    place: '大鵬澳・送王夜',
    bg: 'sea',
    lines: [
      { who: 'narrator', text: '王船從東盛宮出發，要推到大鵬澳的沙灘。\n金紙、米包、替身，一路堆上了船。' },
      { who: 'heichao', text: '船……又要出海了。' },
      { who: 'heichao', text: '上一次出海，沒有一個人回來。', fx: 'shake' },
      { who: 'heichao', text: '這一次，換你們留下來。', fx: 'shake' },
    ],
  },
  sendoff: {
    mood: 'dawn',
    place: '大鵬澳・天將亮',
    bg: 'sea',
    lines: [
      { who: 'yun', text: '上船吧。千歲爺帶你們回去。', fx: 'flash' },
      { who: 'heichaoCalm', text: '……可以回家了嗎？' },
      { who: 'narrator', text: '王船點了火。火光裡，海面上好像有五個人影，朝岸上揮了揮手。', fx: 'firecracker' },
    ],
  },
  // ---------- 第二章熱鬧化（docs/第一二章_熱鬧化計畫.md 第 3 階段）：以下 5 段台詞全部【待定】 ----------
  // 開場（請王）：序章擲筊之後、第一天黃曆之前
  qingwang2: {
    mood: 'temple',
    place: '東盛宮代天府・請王',
    temple: 'temple_daitian',
    lines: [
      { who: 'narrator', text: '九月十四，東盛宮的匾換成了「代天府」。\n七境頭的轎班，天沒亮就到齊了。' },
      { who: 'zhongjun', text: '點名。王令旗、中軍府轎、雲府千歲轎……鹽米隊。' },
      { who: 'xunbu', text: '到！都到了！王令也清點好了，一張、兩張……一張不少！' },
      { who: 'zhongjun', text: '你手上那張，是香油錢的收據。' },
      { who: 'xunbu', text: '……我再數一次。' },
      { who: 'jiaoban', text: '起轎——！千歲爺坐穩囉！' },
      { who: 'yun', text: '開路吧。這三年東津的案卷，千歲爺要一頁一頁看。', fx: 'flash' },
    ],
  },
  // 第二夜天亮前（第三天黃曆之前）：王船廠
  qianchuan2: {
    mood: 'dawn',
    place: '東盛宮王船廠・天亮前',
    bg: 'sea',
    lines: [
      { who: 'narrator', text: '王船廠的燈亮了一整夜。\n天快亮的時候，船上已經堆滿了金紙和米包。' },
      { who: 'jiaoban', text: '嘿——咻！最後一包米！' },
      { who: 'xunbu', text: '慢點慢點！龍骨裂過三次，輕輕放！' },
      { who: 'zhongjun', text: '米包、金紙、替身，一樣一樣都記下了。' },
      { who: 'jiaoban', text: '中軍府，龍骨今晚沒有再裂吧？' },
      { who: 'zhongjun', text: '沒有。……可是船底下的沙，濕了一圈。' },
      { who: 'xunbu', text: '昨晚沒漲潮啊。……誰在船底下哭過？', fx: 'shake' },
    ],
  },
  // 最後一戰・鎮回海裡
  heichaoReturn2: {
    mood: 'dawn',
    place: '大鵬澳・天將亮',
    bg: 'sea',
    lines: [
      { who: 'narrator', text: '王令一壓，黑潮退回了海裡。\n王船點了火，自己出海了。' },
      { who: 'yun', text: '回去吧。海還很大，岸上等你們的人，也還在。', fx: 'flash' },
      { who: 'xunbu', text: '鎮住了……就這樣？船上不是留了五個位子？' },
      { who: 'zhongjun', text: '案卷沒有補完的，不能上船。' },
      { who: 'jiaoban', text: '……那他們還在下面嗎？' },
      { who: 'narrator', text: '浪退下去的地方，沙灘上留著五排腳印，\n一直走進海裡。' },
      { who: 'zhongjun', text: '記下。三年後，再來接。' },
    ],
  },
  // 最後一戰・斬
  heichaoSlay2: {
    mood: 'dawn',
    place: '大鵬澳・天將亮',
    bg: 'sea',
    lines: [
      { who: 'narrator', text: '中軍府令下行刑。黑潮散成一片浪花，打在沙灘上。', fx: 'shake' },
      { who: 'xunbu', text: '……散、散了。' },
      { who: 'jiaoban', text: '王船……可以走了吧？' },
      { who: 'zhongjun', text: '可以。案卷，也可以封了。' },
      { who: 'narrator', text: '王船點了火，出海了。船上留的那五個位子，一直空著。' },
      { who: 'zhongjun', text: '……五個人的名字，我一個也沒問到。' },
    ],
  },
  // 送王（三種結局都播），之後是信徒錄
  songwang2: {
    mood: 'dawn',
    place: '大鵬澳・天亮',
    bg: 'sea',
    lines: [
      { who: 'narrator', text: '天亮了。沙灘上只剩王船燒剩的灰，\n被浪一點一點帶走。' },
      { who: 'jiaoban', text: '肚子好餓……誰有帶飯糰？' },
      { who: 'xunbu', text: '我有！……等等，這是供桌上的。' },
      { who: 'zhongjun', text: '放回去。' },
      { who: 'narrator', text: '轎班們坐在堤防上，一人一碗虱目魚粥，看著海。' },
      { who: 'jiaoban', text: '三年後再來扛！千歲爺，下次轎子輕一點好不好？' },
      { who: 'zhongjun', text: '案卷都封好了。三天的帳，一筆不差。' },
      { who: 'yun', text: '辛苦了。送王，到此為止。', fx: 'flash' },
    ],
  },
  // ---------- 第三章：新瀛・太子出營（ch3/story.ts） ----------
  ...CUTSCENES3,
  // ---------- 第四章：白砂墩・媽祖徒步進香（ch4/story.ts，暫代） ----------
  ...CUTSCENES4,
  retreat: {
    mood: 'demon',
    place: '芝嶺巖・天亮',
    lines: [
      { who: 'narrator', text: '雞啼了。石駒退回山上，沒能喚回牠。\n整頓隊伍，今晚再試一次。' },
    ],
  },
};

/** 判官審判：依捉到的小妖數量給情報；情報會解鎖信徒卡上的新選項 */
export interface Verdict {
  lines: Line[];
  intel: { quakeTip?: boolean; bellyWound?: boolean; longBreath?: boolean; salt?: boolean };
  /** 結算畫面上寫明解鎖了什麼 */
  unlocks: string[];
}

export function judge(afterNight: number, captured: number): Verdict {
  const lines: Line[] = [];
  const intel: Verdict['intel'] = {};
  const unlocks: string[] = [];
  if (captured === 0) {
    lines.push({ who: 'judge', text: '昨夜一隻也沒捉到。沒有口供，只能靠你們自己了。' });
    return { lines, intel, unlocks };
  }
  if (afterNight === 1) {
    lines.push({ who: 'judge', text: `昨夜捉拿小妖 ${captured} 名。說，你們怕什麼？` });
    if (captured >= 2) {
      lines.push({ who: 'wang', text: '鹽、鹽米！一撒下去就燙得受不了……' });
      intel.salt = true;
      unlocks.push('「撒鹽米驅魍」（阿秀嬸、小芸的卡上，便宜很多）');
    }
    if (captured >= 3) {
      lines.push({ who: 'mei', text: '石屑傀最怕鑼鼓震，一震就散。' });
      intel.quakeTip = true;
      unlocks.push('醒獅震擊對石屑傀傷害 ×1.5');
    }
    return { lines, intel, unlocks };
  }
  lines.push({ who: 'judge', text: `捉拿小妖 ${captured} 名。說，石駒有什麼弱點？` });
  lines.push({ who: 'kui', text: '牠衝完一次就會停下來喘，喘很久。' });
  intel.longBreath = true;
  unlocks.push('石駒衝鋒後的喘息時間變長');
  if (captured >= 3) {
    lines.push({ who: 'mei', text: '牠肚子上有個舊洞，打那裡最痛。' });
    intel.bellyWound = true;
    unlocks.push('石駒肚子的舊傷（喘息時傷害大增）');
  }
  return { lines, intel, unlocks };
}
