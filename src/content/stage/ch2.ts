/**
 * 第二章（東津・迎王）的演出腳本（docs/第一二章_熱鬧化計畫.md 第 3 階段）：
 * tide3、sendoff（原有台詞）＋新的 qingwang2、qianchuan2、heichaoReturn2、heichaoSlay2、songwang2（台詞【待定】，在 content/story.ts）。
 *
 * 海邊用 seaFar／seaFarN 遠景＋近海＋浪花前景（fore: 'sea'）；王船用 st_wangchuan／st_wangchuan_fire。
 * 轎班用畫師的 st_jiaoban（修正第 3 輪，Q21）；第二個轎班用淡色調區分（送王時翻面和第一個面對面）。圖沒載到時用程式小人放大的暫代。
 * 請王的王轎用扛轎版 st_wangjiao_carried（修正第 4 輪：四個轎班扛著、朝右；轎子才不會自己跳）。
 * 扛轎版的轎班比 st_jiaoban 小，同一段不放 st_jiaoban，免得兩種轎班並排。
 * 補寫的拍子標 draft（【待定】，見計畫 §9）。
 */
import type { StageScript } from './types';

export const STAGES2: Record<string, StageScript> = {
  // 開場（請王）：東盛宮代天府。中軍府點名、巡捕清點王令、轎班起轎，最後旨意
  qingwang2: {
    id: 'qingwang2',
    place: '東盛宮代天府・請王',
    mood: 'temple',
    sky: [0x120a10, 0x4a2a14],
    far: 'skylineN',
    temple: 'temple_daitian',
    ground: 0x2a2632,
    fore: 'temple',
    actors: [
      { id: 'decree', tex: 'decree', x: 380, y: -360, scale: 0.8, alpha: 0, center: true },
      { id: 'flag', tex: 'wlflag', x: 600, y: 20, scale: 1.1 },
      // 修正第 4 輪：扛轎版（轎班約和中軍府一樣高）；巡捕站到轎子右邊、不擋王轎，最左邊的轎班留在畫面裡
      { id: 'jiao', tex: 'st_wangjiao_carried', x: 390, y: 15, scale: 0.78 },
      { id: 'zhongjun', tex: 'st_zhongjun', x: 110, y: 40, scale: 0.44 },
      { id: 'xunbu', tex: 'st_xunbu', x: 690, y: 60, scale: 0.44 },
    ],
    beats: [
      { who: 'narrator', text: '九月十四，東盛宮的匾換成了「代天府」。\n七境頭的轎班，天沒亮就到齊了。', src: 0, cam: { x: 360, y: -120, zoom: 1, ms: 1200 } },
      {
        at: 'zhongjun', who: 'zhongjun', text: '點名。王令旗、中軍府轎、雲府千歲轎……鹽米隊。', src: 1,
        cam: { x: 220, y: -80, zoom: 1.15, ms: 900 },
      },
      {
        at: 'xunbu', who: 'xunbu', text: '到！都到了！王令也清點好了，一張、兩張……一張不少！', src: 2,
        cam: { x: 540, y: -80, zoom: 1.15, ms: 800 },
        moves: [{ id: 'xunbu', x: 640, hop: true, ms: 500 }],
      },
      { at: 'zhongjun', who: 'zhongjun', text: '你手上那張，是香油錢的收據。', src: 3, cam: { x: 300, y: -80, zoom: 1.12, ms: 700 } },
      {
        at: 'xunbu', who: 'xunbu', text: '……我再數一次。', src: 4,
        moves: [{ id: 'xunbu', x: 670, ms: 400 }],
      },
      {
        // 修正第 4 輪：扛轎版有轎班，泡泡改回指著王轎（轎班扛著一起跳）
        at: 'jiao', who: 'jiaoban', text: '起轎——！千歲爺坐穩囉！', src: 5, fx: 'firecracker',
        cam: { x: 400, y: -100, zoom: 1.1, ms: 800 },
        moves: [{ id: 'jiao', y: 0, hop: true, ms: 600 }],
        sfx: { text: '嘿——！', at: 'jiao', color: 0xffd76a },
      },
      {
        at: 'decree', who: 'yun', text: '開路吧。這三年東津的案卷，千歲爺要一頁一頁看。', src: 6, fx: 'flash',
        cam: { x: 380, y: -170, zoom: 1.05, ms: 900 },
        moves: [{ id: 'decree', y: -330, alpha: 1, ms: 900 }],
      },
      {
        // 【待定】旁白
        text: '鞭炮一路炸到港邊。請王的隊伍出發了。', draft: true, fx: 'firecracker',
        cam: { x: 360, y: -100, zoom: 1, ms: 1000 },
        moves: [
          { id: 'decree', alpha: 0, ms: 600 },
          { id: 'flag', x: 900, hop: true, ms: 1800 },
          { id: 'jiao', x: 760, hop: true, ms: 2000 },
          { id: 'xunbu', x: 980, hop: true, ms: 1600 },
        ],
        sfx: { text: '劈哩啪啦！', at: 'jiao' },
      },
    ],
  },
  // 第二夜天亮前：王船廠。燈亮一夜，金紙米包堆上船；船底下的沙濕了一圈
  qianchuan2: {
    id: 'qianchuan2',
    place: '東盛宮王船廠・天亮前',
    mood: 'dawn',
    sky: [0x262848, 0xc07a52],
    far: 'seaFar',
    ground: 0x4a3e46,
    fore: 'sea',
    actors: [
      { id: 'ship', tex: 'st_wangchuan', x: 400, y: 20, scale: 0.55 },
      { id: 'lan0', tex: 'lantern', x: 230, y: -250, scale: 0.4, alpha: 0.4, center: true },
      { id: 'lan1', tex: 'lantern', x: 400, y: -300, scale: 0.4, alpha: 0.4, center: true },
      { id: 'lan2', tex: 'lantern', x: 570, y: -250, scale: 0.4, alpha: 0.4, center: true },
      { id: 'wet', tex: 'smoke', x: 290, y: 30, scale: 3, tint: 0x3a4a7a, alpha: 0, center: true },
      { id: 'paper', tex: 'jinzhi', x: 600, y: 70, scale: 1.2 },
      { id: 'zhongjun', tex: 'st_zhongjun', x: 660, y: 50, scale: 0.44 },
      { id: 'xunbu', tex: 'st_xunbu', x: 520, y: 75, scale: 0.44 },
      { id: 'jiaoban', tex: 'st_jiaoban', x: -60, y: 90, scale: 0.44 },
      { id: 'sack', tex: 'yanmi', x: -120, y: 85, scale: 1.6 },
    ],
    beats: [
      {
        who: 'narrator', text: '王船廠的燈亮了一整夜。\n天快亮的時候，船上已經堆滿了金紙和米包。', src: 0,
        cam: { x: 360, y: -120, zoom: 1, ms: 1200 },
        moves: [{ id: 'lan0', alpha: 1, ms: 500 }, { id: 'lan1', alpha: 1, ms: 800 }, { id: 'lan2', alpha: 1, ms: 1100 }],
      },
      {
        at: 'jiaoban', who: 'jiaoban', text: '嘿——咻！最後一包米！', src: 1,
        cam: { x: 220, y: -80, zoom: 1.15, ms: 900 },
        moves: [{ id: 'jiaoban', x: 160, hop: true, ms: 900 }, { id: 'sack', x: 90, hop: true, ms: 900 }],
        sfx: { text: '嘿——咻！', at: 'jiaoban', color: 0xffd76a },
      },
      {
        at: 'xunbu', who: 'xunbu', text: '慢點慢點！龍骨裂過三次，輕輕放！', src: 2,
        cam: { x: 440, y: -80, zoom: 1.12, ms: 700 },
        moves: [{ id: 'xunbu', x: 470, hop: true, ms: 400 }],
      },
      { at: 'zhongjun', who: 'zhongjun', text: '米包、金紙、替身，一樣一樣都記下了。', src: 3, cam: { x: 560, y: -80, zoom: 1.12, ms: 800 } },
      { at: 'jiaoban', who: 'jiaoban', text: '中軍府，龍骨今晚沒有再裂吧？', src: 4, cam: { x: 300, y: -80, zoom: 1.08, ms: 700 } },
      {
        at: 'zhongjun', who: 'zhongjun', text: '沒有。……可是船底下的沙，濕了一圈。', src: 5,
        cam: { x: 380, y: -20, zoom: 1.2, ms: 1200 },
        moves: [{ id: 'wet', alpha: 0.5, scale: 4.5, ms: 1600 }],
      },
      {
        at: 'xunbu', who: 'xunbu', text: '昨晚沒漲潮啊。……誰在船底下哭過？', src: 6, fx: 'shake',
        cam: { x: 380, y: -60, zoom: 1.25, ms: 500 },
        moves: [{ id: 'xunbu', x: 440, ms: 300 }, { id: 'wet', alpha: 0.65, tint: 0x6a3a9a, ms: 500 }],
      },
    ],
  },
  // 最後一戰之前：大鵬澳，王船推上沙灘，黑潮從海裡上來（妖怪視角）
  tide3: {
    id: 'tide3',
    place: '大鵬澳・送王夜',
    mood: 'demon',
    sky: [0x0a0614, 0x241a46],
    far: 'seaFarN',
    ground: 0x1c1a2a,
    fore: 'sea',
    actors: [
      { id: 'fog', tex: 'smoke', x: 540, y: -120, scale: 5, tint: 0x3a5aff, alpha: 0, center: true },
      { id: 'ship', tex: 'st_wangchuan', x: 120, y: 30, scale: 0.5, tint: 0xb0a0d0 },
      { id: 'torch0', tex: 'torch', x: 40, y: 70, scale: 1.2 },
      { id: 'torch1', tex: 'torch', x: 330, y: 75, scale: 1.2 },
      { id: 'paper', tex: 'jinzhi', x: 250, y: 85, scale: 1, tint: 0xc0b0d0 },
      { id: 'heichao', tex: 'heichao', x: 820, y: 10, scale: 0.9, alpha: 0 },
      { id: 'chu0', tex: 'chu', x: 420, y: 160, scale: 1, alpha: 0 },
      { id: 'chu1', tex: 'chu', x: 520, y: 170, scale: 0.85, alpha: 0, flip: true },
    ],
    beats: [
      {
        who: 'narrator', text: '王船從東盛宮出發，要推到大鵬澳的沙灘。\n金紙、米包、替身，一路堆上了船。', src: 0,
        cam: { x: 300, y: -100, zoom: 1, ms: 1200 },
        moves: [{ id: 'ship', x: 230, hop: true, ms: 2200 }],
      },
      {
        at: 'heichao', who: 'heichao', text: '船……又要出海了。', src: 1,
        cam: { x: 480, y: -120, zoom: 1.1, ms: 1600 },
        moves: [{ id: 'heichao', x: 580, alpha: 0.9, ms: 1800 }, { id: 'fog', alpha: 0.3, ms: 1800 }],
        sfx: { text: '嘩——', at: 'heichao', color: 0x9ad0f0 },
      },
      {
        at: 'heichao', who: 'heichao', text: '上一次出海，沒有一個人回來。', src: 2, fx: 'shake',
        cam: { x: 560, y: -140, zoom: 1.25, ms: 600 },
        moves: [{ id: 'heichao', x: 560, alpha: 1, ms: 400 }],
      },
      {
        at: 'heichao', who: 'heichao', text: '這一次，換你們留下來。', src: 3, fx: 'shake',
        cam: { x: 400, y: -100, zoom: 1.08, ms: 600 },
        moves: [
          { id: 'chu0', y: 60, alpha: 1, ms: 600 },
          { id: 'chu1', y: 70, alpha: 1, ms: 800 },
          { id: 'fog', alpha: 0.55, scale: 6.5, ms: 600 },
        ],
      },
    ],
  },
  // 最後一戰・一起送走：王船點火，五個人影上船
  sendoff: {
    id: 'sendoff',
    place: '大鵬澳・天將亮',
    mood: 'dawn',
    sky: [0x2a2a4a, 0xd88a5a],
    far: 'seaFar',
    ground: 0x4a3e46,
    fore: 'sea',
    actors: [
      { id: 'decree', tex: 'decree', x: 200, y: -340, scale: 0.8, alpha: 0, center: true },
      // 視覺修正：程式畫的黑潮放在王船後面；畫師的黑潮人影出來時整個淡掉（不和人影疊兩層）
      { id: 'heichao', tex: 'heichao_calm', x: 600, y: 10, scale: 0.8, alpha: 0.85 },
      { id: 'ship', tex: 'st_wangchuan', x: 300, y: 20, scale: 0.5 },
      { id: 'figs', tex: 'st_heichao_figures', x: 590, y: 20, scale: 0.42, alpha: 0 },
      { id: 'zhongjun', tex: 'st_zhongjun', x: 70, y: 60, scale: 0.44 },
      { id: 'xunbu', tex: 'st_xunbu', x: 170, y: 85, scale: 0.44 },
    ],
    beats: [
      // 【待定】旁白與隨從插話
      { text: '王船停在沙灘上。浪邊，黑潮安安靜靜地等著。', draft: true, cam: { x: 400, y: -100, zoom: 1.02, ms: 1400 } },
      {
        at: 'decree', who: 'yun', text: '上船吧。千歲爺帶你們回去。', src: 0, fx: 'flash',
        cam: { x: 260, y: -170, zoom: 1.08, ms: 900 },
        moves: [{ id: 'decree', y: -310, alpha: 1, ms: 900 }],
      },
      {
        at: 'figs', who: 'heichaoCalm', text: '……可以回家了嗎？', src: 1,
        cam: { x: 560, y: -100, zoom: 1.2, ms: 1400 },
        moves: [{ id: 'decree', alpha: 0, ms: 600 }, { id: 'heichao', alpha: 0, ms: 1400 }, { id: 'figs', alpha: 1, ms: 1400 }],
      },
      {
        at: 'xunbu', who: 'xunbu', text: '可以！位子都留好了，一人一個！', draft: true,
        cam: { x: 200, y: -60, zoom: 1.15, ms: 800 },
        moves: [{ id: 'xunbu', x: 200, hop: true, ms: 400 }],
      },
      { at: 'zhongjun', who: 'zhongjun', text: '五個名字，都寫進案卷了。', draft: true, cam: { x: 140, y: -80, zoom: 1.15, ms: 600 } },
      {
        who: 'narrator', text: '王船點了火。火光裡，海面上好像有五個人影，朝岸上揮了揮手。', src: 2, fx: 'firecracker',
        cam: { x: 420, y: -120, zoom: 1, ms: 1400 },
        moves: [
          { id: 'ship', tex: 'st_wangchuan_fire', ms: 600 },
          { id: 'heichao', alpha: 0, ms: 1200 },
          { id: 'figs', x: 610, y: -40, alpha: 0.6, scale: 0.26, ms: 2400 },
        ],
        sfx: { text: '轟——', at: 'ship', color: 0xffa04a },
      },
    ],
  },
  // 最後一戰・鎮回海裡：黑潮退回海裡，王船自己出海；沙灘上五排腳印
  heichaoReturn2: {
    id: 'heichaoReturn2',
    place: '大鵬澳・天將亮',
    mood: 'dawn',
    sky: [0x2a2a4a, 0xd88a5a],
    far: 'seaFar',
    ground: 0x4a3e46,
    fore: 'sea',
    actors: [
      { id: 'decree', tex: 'decree', x: 200, y: -340, scale: 0.8, alpha: 0, center: true },
      // 視覺修正：程式畫的黑潮放在王船後面（不蓋船尾）
      { id: 'heichao', tex: 'heichao', x: 600, y: 10, scale: 0.8, alpha: 0.85 },
      { id: 'ship', tex: 'st_wangchuan', x: 420, y: 10, scale: 0.46 },
      { id: 'mist', tex: 'smoke', x: 560, y: -40, scale: 7, tint: 0xcfe0f0, alpha: 0, center: true },
      // 視覺修正：轎班退到中軍府、巡捕後面一排，縮小一點
      { id: 'jiaoban', tex: 'st_jiaoban', x: 125, y: 30, scale: 0.36 },
      { id: 'zhongjun', tex: 'st_zhongjun', x: 70, y: 55, scale: 0.44 },
      { id: 'xunbu', tex: 'st_xunbu', x: 170, y: 80, scale: 0.44 },
    ],
    beats: [
      {
        who: 'narrator', text: '王令一壓，黑潮退回了海裡。\n王船點了火，自己出海了。', src: 0,
        cam: { x: 420, y: -100, zoom: 1, ms: 1600 },
        moves: [
          { id: 'heichao', x: 700, y: -10, alpha: 0, scale: 0.6, ms: 1800 },
          { id: 'ship', tex: 'st_wangchuan_fire', x: 500, y: -20, scale: 0.42, ms: 2400 },
        ],
        sfx: { text: '嘩——', at: 'heichao', color: 0x9ad0f0 },
      },
      {
        at: 'decree', who: 'yun', text: '回去吧。海還很大，岸上等你們的人，也還在。', src: 1, fx: 'flash',
        cam: { x: 260, y: -170, zoom: 1.08, ms: 900 },
        moves: [{ id: 'decree', y: -310, alpha: 1, ms: 900 }],
      },
      {
        at: 'xunbu', who: 'xunbu', text: '鎮住了……就這樣？船上不是留了五個位子？', src: 2,
        cam: { x: 200, y: -60, zoom: 1.15, ms: 800 },
        moves: [{ id: 'decree', alpha: 0, ms: 600 }, { id: 'xunbu', x: 200, hop: true, ms: 400 }],
      },
      { at: 'zhongjun', who: 'zhongjun', text: '案卷沒有補完的，不能上船。', src: 3, cam: { x: 140, y: -80, zoom: 1.15, ms: 600 } },
      { at: 'jiaoban', who: 'jiaoban', text: '……那他們還在下面嗎？', src: 4, cam: { x: 280, y: -60, zoom: 1.15, ms: 600 } },
      {
        who: 'narrator', text: '浪退下去的地方，沙灘上留著五排腳印，\n一直走進海裡。', src: 5,
        cam: { x: 560, y: -40, zoom: 1.22, ms: 1600 },
        moves: [{ id: 'mist', alpha: 0.12, ms: 1600 }],
      },
      { at: 'zhongjun', who: 'zhongjun', text: '記下。三年後，再來接。', src: 6, cam: { x: 200, y: -80, zoom: 1.1, ms: 1200 } },
    ],
  },
  // 最後一戰・斬：黑潮散成浪花；王船出海，五個位子空著
  heichaoSlay2: {
    id: 'heichaoSlay2',
    place: '大鵬澳・天將亮',
    mood: 'dawn',
    sky: [0x22222e, 0x7a5a50],
    far: 'seaFar',
    ground: 0x443a42,
    fore: 'sea',
    actors: [
      // 視覺修正：程式畫的黑潮放在王船後面（不蓋船尾）
      { id: 'heichao', tex: 'heichao', x: 600, y: 10, scale: 0.85 },
      { id: 'ship', tex: 'st_wangchuan', x: 400, y: 10, scale: 0.46 },
      { id: 'spray', tex: 'smoke', x: 600, y: -80, scale: 3, tint: 0xe8eef4, alpha: 0, center: true },
      // 視覺修正：轎班退到中軍府、巡捕後面一排，縮小一點
      { id: 'jiaoban', tex: 'st_jiaoban', x: 125, y: 30, scale: 0.36 },
      { id: 'zhongjun', tex: 'st_zhongjun', x: 70, y: 55, scale: 0.44 },
      { id: 'xunbu', tex: 'st_xunbu', x: 170, y: 80, scale: 0.44 },
    ],
    beats: [
      {
        who: 'narrator', text: '中軍府令下行刑。黑潮散成一片浪花，打在沙灘上。', src: 0, fx: 'shake',
        cam: { x: 480, y: -80, zoom: 1.08, ms: 600 },
        moves: [{ id: 'heichao', alpha: 0, scale: 1.1, ms: 700 }, { id: 'spray', alpha: 0.8, scale: 6, ms: 900 }],
        sfx: { text: '嘩啦——！', at: 'heichao', color: 0xe8eef4 },
      },
      {
        at: 'xunbu', who: 'xunbu', text: '……散、散了。', src: 1,
        cam: { x: 200, y: -60, zoom: 1.15, ms: 900 },
        moves: [{ id: 'spray', alpha: 0, scale: 8, ms: 1600 }],
      },
      { at: 'jiaoban', who: 'jiaoban', text: '王船……可以走了吧？', src: 2, cam: { x: 280, y: -60, zoom: 1.15, ms: 600 } },
      { at: 'zhongjun', who: 'zhongjun', text: '可以。案卷，也可以封了。', src: 3, cam: { x: 140, y: -80, zoom: 1.15, ms: 600 } },
      {
        who: 'narrator', text: '王船點了火，出海了。船上留的那五個位子，一直空著。', src: 4,
        cam: { x: 440, y: -100, zoom: 1, ms: 1600 },
        moves: [{ id: 'ship', tex: 'st_wangchuan_fire', x: 500, y: -20, scale: 0.42, ms: 2600 }],
      },
      { at: 'zhongjun', who: 'zhongjun', text: '……五個人的名字，我一個也沒問到。', src: 5, cam: { x: 120, y: -100, zoom: 1.22, ms: 1400 } },
    ],
  },
  // 送王（三種結局都播）：天亮，沙灘上只剩灰；轎班坐在堤防上吃早餐
  songwang2: {
    id: 'songwang2',
    place: '大鵬澳・天亮',
    mood: 'dawn',
    sky: [0x3a3a5a, 0xe8a070],
    far: 'seaFar',
    ground: 0x4a3e46,
    fore: 'sea',
    actors: [
      { id: 'decree', tex: 'decree', x: 380, y: -360, scale: 0.8, alpha: 0, center: true },
      { id: 'ash', tex: 'smoke', x: 470, y: 10, scale: 3.5, tint: 0x6a6460, alpha: 0.55, center: true },
      { id: 'jiaoban', tex: 'st_jiaoban', x: 120, y: 85, scale: 0.44 },
      { id: 'jiaoban2', tex: 'st_jiaoban', x: 215, y: 90, scale: 0.43, flip: true, tint: 0xd8c8b0 },
      { id: 'xunbu', tex: 'st_xunbu', x: 330, y: 75, scale: 0.44 },
      { id: 'zhongjun', tex: 'st_zhongjun', x: 590, y: 55, scale: 0.44 },
    ],
    beats: [
      {
        who: 'narrator', text: '天亮了。沙灘上只剩王船燒剩的灰，\n被浪一點一點帶走。', src: 0,
        cam: { x: 420, y: -100, zoom: 1, ms: 1400 },
        moves: [{ id: 'ash', alpha: 0.3, x: 520, scale: 4.5, ms: 3000 }],
      },
      { at: 'jiaoban', who: 'jiaoban', text: '肚子好餓……誰有帶飯糰？', src: 1, cam: { x: 180, y: -60, zoom: 1.15, ms: 900 } },
      {
        at: 'xunbu', who: 'xunbu', text: '我有！……等等，這是供桌上的。', src: 2,
        cam: { x: 280, y: -60, zoom: 1.15, ms: 600 },
        moves: [{ id: 'xunbu', x: 300, hop: true, ms: 400 }],
      },
      { at: 'zhongjun', who: 'zhongjun', text: '放回去。', src: 3, cam: { x: 520, y: -80, zoom: 1.1, ms: 700 } },
      {
        who: 'narrator', text: '轎班們坐在堤防上，一人一碗虱目魚粥，看著海。', src: 4,
        cam: { x: 300, y: -80, zoom: 1.08, ms: 1000 },
        moves: [{ id: 'xunbu', x: 340, ms: 600 }],
        sfx: { text: '呼——呼——', at: 'jiaoban2', color: 0xe8eef4 },
      },
      { at: 'jiaoban', who: 'jiaoban', text: '三年後再來扛！千歲爺，下次轎子輕一點好不好？', src: 5, cam: { x: 180, y: -60, zoom: 1.12, ms: 700 } },
      { at: 'zhongjun', who: 'zhongjun', text: '案卷都封好了。三天的帳，一筆不差。', src: 6, cam: { x: 560, y: -80, zoom: 1.12, ms: 800 } },
      {
        at: 'decree', who: 'yun', text: '辛苦了。送王，到此為止。', src: 7, fx: 'flash',
        cam: { x: 380, y: -170, zoom: 1.05, ms: 900 },
        moves: [{ id: 'decree', y: -330, alpha: 1, ms: 900 }],
      },
    ],
  },
};
