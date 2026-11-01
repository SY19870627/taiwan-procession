/**
 * 引擎內演出腳本（docs/第一二章_熱鬧化計畫.md §2）：過場 id → 腳本。
 * 有腳本的過場由 StoryScene 播演出；沒有的照舊播文字版。
 *
 * 第 1 階段：第一章兩段從原型搬過來（recall、dusk3），改用演出用的暫代小人（art/stage.ts）。
 * 第 2 階段：第一章新增 5 段（anfang1、shanlu1、shijuReturn1、shijuSlay1、huigong1），recall、dusk3 依新版面再調。
 * 第 3 階段：第二章 7 段在 ./ch2.ts（tide3、sendoff、qingwang2、qianchuan2、heichaoReturn2、heichaoSlay2、songwang2）。
 * 第 4 階段：第三章 8 段在 ./ch3.ts（kaiying3、zhizha3、river3、jiao3、jiaoRecall、jiaoSlay3、jiaoReturn3、shouying3）。
 * 補寫的拍子標 draft（【待定】，見計畫 §9）。
 *
 * 石駒站姿：畫師只畫了跪、回頭（計畫 Q17），站著的石駒先用「回頭」那張（煞氣時加紫色調）；跪、回頭兩張都臉朝左；
 * 七爺八爺（Q18）：修正第 3 輪換成畫師的 st_qiye、st_baye（和判官同樣 0.44 高）；八爺的圖只有七爺的 0.67 高，
 * scale 放大到 0.49，並排時約 0.75 高（矮一點但不會太小）。圖沒載到時用陣頭小人放大的暫代。
 */
import type { StageScript } from './types';
import { STAGES2 } from './ch2';
import { STAGES3 } from './ch3';

export type { StageActor, StageBeat, StageFore, StageMove, StageScript } from './types';

export const STAGES: Record<string, StageScript> = {
  // 第一章・最後一戰喚回石駒之後：惠澤宮廟埕
  recall: {
    id: 'recall',
    place: '惠澤宮・廟埕',
    mood: 'temple',
    sky: [0x1a0e08, 0x5a3412],
    far: 'mtnFarN',
    temple: 'temple_huize',
    ground: 0x2a2632,
    fore: 'temple',
    actors: [
      { id: 'fog', tex: 'smoke', x: 560, y: -120, scale: 5, tint: 0x9b3cff, alpha: 0.35, center: true },
      { id: 'jiao', tex: 'st_jiao_qingling', x: 230, y: 40, scale: 0.45 },
      { id: 'qiye', tex: 'st_qiye', x: 80, y: 70, scale: 0.44 },
      { id: 'baye', tex: 'st_baye', x: 360, y: 95, scale: 0.49 },
      { id: 'decree', tex: 'decree', x: 230, y: -330, scale: 0.8, alpha: 0, center: true },
      { id: 'shiju', tex: 'st_shiju_look', x: 610, y: 80, scale: 0.42, tint: 0xb89ad0 },
    ],
    beats: [
      // 【待定】旁白與隨從插話（原型補寫）
      { text: '石駒身上的煞氣淡了。牠站在廟埕上，喘著氣。', draft: true, cam: { x: 400, y: -60, zoom: 1.04, ms: 1600 } },
      { at: 'qiye', name: '七爺', who: 'qiye', text: '……牠不跑了。', draft: true, moves: [{ id: 'qiye', x: 110, hop: true, ms: 500 }] },
      { at: 'baye', name: '八爺', who: 'baye', text: '噓！王爺要開口了。', draft: true, moves: [{ id: 'baye', x: 345, hop: true, ms: 400 }] },
      {
        at: 'decree', who: 'kaijiang', text: '回來吧。', src: 0, fx: 'flash',
        cam: { x: 270, y: -160, zoom: 1.18, ms: 900 },
        moves: [{ id: 'decree', y: -300, alpha: 1, ms: 900 }],
      },
      {
        at: 'shiju', who: 'shijuCalm', text: '……主公。', src: 1,
        cam: { x: 500, y: -40, zoom: 1.12, ms: 1400 },
        moves: [
          { id: 'fog', alpha: 0, scale: 7, ms: 1400 },
          // 跪下那張也是臉朝左（朝著旨意）
          { id: 'shiju', x: 540, tint: null, tex: 'st_shiju_kneel', ms: 1400, hop: true },
        ],
      },
      {
        text: '鑼鼓響起來了。石駒歸隊。', draft: true, fx: 'firecracker',
        cam: { x: 360, y: -100, zoom: 1, ms: 1200 },
        sfx: { text: '鏘！咚咚！', at: 'jiao' },
      },
    ],
  },
  // 第一章・第三夜之後：芝嶺巖，石駒在山裡（妖怪視角）
  dusk3: {
    id: 'dusk3',
    place: '芝嶺巖・入夜',
    mood: 'demon',
    sky: [0x0a0614, 0x2e1446],
    far: 'mtnFarN',
    ground: 0x1a1424,
    fore: 'mountain',
    actors: [
      { id: 'fog', tex: 'smoke', x: 470, y: -120, scale: 5, tint: 0x9b3cff, alpha: 0, center: true },
      { id: 'shiju', tex: 'st_shiju_look', x: 860, y: 80, scale: 0.5, tint: 0xb89ad0 },
      { id: 'flag', tex: 'flag1', x: 60, y: -10, scale: 0.35, alpha: 0 },
      { id: 'lan0', tex: 'lantern', x: 100, y: -60, scale: 0.3, alpha: 0, center: true },
      { id: 'lan1', tex: 'lantern', x: 140, y: -50, scale: 0.3, alpha: 0, center: true },
      { id: 'lan2', tex: 'lantern', x: 180, y: -55, scale: 0.3, alpha: 0, center: true },
    ],
    beats: [
      {
        at: 'shiju', who: 'shiju', text: '我記得鑼聲，記得旗子在風裡響。', src: 0,
        cam: { x: 470, y: -80, zoom: 1.06, ms: 2000 },
        moves: [{ id: 'shiju', x: 500, ms: 2000, hop: true }, { id: 'fog', alpha: 0.35, ms: 2000 }],
      },
      {
        at: 'shiju', who: 'shiju', text: '肚子那個洞，冷風一直灌進來。', src: 1,
        cam: { x: 500, y: -40, zoom: 1.2, ms: 1400 },
      },
      {
        // 【待定】旁白（原型補寫）
        text: '山下，遶境的燈籠一盞一盞亮起來。', draft: true,
        cam: { x: 220, y: -60, zoom: 1.1, ms: 1200 },
        moves: [
          { id: 'flag', alpha: 0.8, ms: 600 }, { id: 'lan0', alpha: 1, ms: 400 },
          { id: 'lan1', alpha: 1, ms: 700 }, { id: 'lan2', alpha: 1, ms: 1000 },
        ],
        sfx: { text: '鏘——', at: 'flag', color: 0xffd76a },
      },
      {
        at: 'shiju', who: 'shiju', text: '你們這些拿旗子的人……\n也是來鑿我的嗎？', src: 2, fx: 'shake',
        cam: { x: 470, y: -100, zoom: 1.28, ms: 500 },
        moves: [{ id: 'shiju', x: 470, ms: 300 }, { id: 'fog', alpha: 0.6, scale: 6.5, ms: 500 }],
      },
    ],
  },

  // ---------- 第 2 階段：第一章新過場（台詞全部【待定】，在 content/story.ts） ----------
  // 開場：青嶺宮廟埕，入夜。報馬仔敲鑼跑進來、七爺八爺出廟、判官點燈磨刀，最後旨意：「今晚暗訪，閒人迴避。」
  anfang1: {
    id: 'anfang1',
    place: '萬舺青嶺宮・入夜',
    mood: 'temple',
    sky: [0x120a10, 0x4a2a14],
    far: 'skylineN',
    temple: 'temple_qingling',
    ground: 0x2a2632,
    fore: 'temple',
    actors: [
      { id: 'decree', tex: 'decree', x: 360, y: -360, scale: 0.8, alpha: 0, center: true },
      { id: 'jiao', tex: 'st_jiao_qingling', x: 360, y: 10, scale: 0.48 },
      { id: 'wenpan', tex: 'st_wenpan', x: 200, y: 30, scale: 0.44 },
      { id: 'wupan', tex: 'st_wupan', x: 525, y: 30, scale: 0.44 },
      { id: 'qiye', tex: 'st_qiye', x: 610, y: 70, scale: 0.44 },
      { id: 'baye', tex: 'st_baye', x: 680, y: 95, scale: 0.49 },
      { id: 'baoma', tex: 'st_baoma', x: -120, y: 90, scale: 0.48 },
    ],
    beats: [
      { who: 'narrator', text: '十月十九，入夜。青嶺宮的廟門開了，\n燈籠一盞一盞點起來。', src: 0, cam: { x: 360, y: -120, zoom: 1, ms: 1200 } },
      {
        at: 'baoma', who: 'baoma', text: '鏘——！青嶺王暗訪，閒人迴避——！', src: 1,
        cam: { x: 200, y: -60, zoom: 1.15, ms: 900 },
        moves: [{ id: 'baoma', x: 100, hop: true, ms: 900 }],
        sfx: { text: '鏘——！', at: 'baoma', color: 0xffd76a },
      },
      { at: 'qiye', who: 'qiye', text: '扇子帶了，鎖鏈也帶了。八弟，走吧。', src: 2, cam: { x: 600, y: -80, zoom: 1.15, ms: 900 } },
      {
        at: 'baye', who: 'baye', text: '我走前面。七哥你腿長，別踩到我。', src: 3,
        moves: [{ id: 'baye', x: 560, hop: true, ms: 500 }],
      },
      { at: 'wenpan', who: 'judge', text: '燈點好了。今晚帶回來的，我一個一個問。', src: 4, cam: { x: 220, y: -80, zoom: 1.15, ms: 900 } },
      {
        at: 'wupan', who: 'wupan', text: '刀也磨好了。問不出來的，交給我。', src: 5,
        cam: { x: 500, y: -80, zoom: 1.15, ms: 900 },
        sfx: { text: '唰——', at: 'wupan', color: 0xe9ecf4 },
      },
      { at: 'wenpan', who: 'judge', text: '不急。先問。', src: 6, cam: { x: 300, y: -80, zoom: 1.1, ms: 700 } },
      {
        at: 'decree', who: 'god', text: '今晚暗訪，閒人迴避。', src: 7, fx: 'flash',
        cam: { x: 360, y: -170, zoom: 1.05, ms: 900 },
        moves: [{ id: 'decree', y: -330, alpha: 1, ms: 900 }],
      },
      {
        // 【待定】旁白
        text: '鑼聲一響，暗訪的隊伍出了廟門。', draft: true, fx: 'firecracker',
        cam: { x: 360, y: -100, zoom: 1, ms: 1000 },
        moves: [{ id: 'decree', alpha: 0, ms: 600 }, { id: 'baoma', x: 830, hop: true, ms: 1600 }],
        sfx: { text: '鏘！咚咚！', at: 'jiao' },
      },
    ],
  },
  // 第二夜天亮前：芝林山路。報馬仔從山上跑下來，回報蹄印往北
  shanlu1: {
    id: 'shanlu1',
    place: '芝林山路・天亮前',
    mood: 'dawn',
    sky: [0x262848, 0xc07a52],
    far: 'mtnFar',
    ground: 0x2a2632,
    fore: 'mountain',
    actors: [
      { id: 'flag', tex: 'flag1', x: 320, y: 0, scale: 0.9 },
      { id: 'wupan', tex: 'st_wupan', x: 390, y: 30, scale: 0.44 },
      { id: 'qiye', tex: 'st_qiye', x: 480, y: 65, scale: 0.44 },
      { id: 'wenpan', tex: 'st_wenpan', x: 630, y: 35, scale: 0.44 },
      { id: 'baye', tex: 'st_baye', x: 560, y: 95, scale: 0.49 },
      { id: 'baoma', tex: 'st_baoma', x: -120, y: 80, scale: 0.48 },
    ],
    beats: [
      {
        who: 'narrator', text: '第二夜快過去了。山路上有人一路跑下來，\n鑼都忘了敲。', src: 0,
        cam: { x: 360, y: -100, zoom: 1, ms: 1200 },
        moves: [{ id: 'baoma', x: 110, hop: true, ms: 1400 }],
      },
      {
        at: 'baoma', who: 'baoma', text: '蹄、蹄印！山上有蹄印！', src: 1,
        cam: { x: 280, y: -60, zoom: 1.15, ms: 700 },
        moves: [{ id: 'baoma', x: 240, hop: true, ms: 500 }],
        sfx: { text: '哈……哈……', at: 'baoma', color: 0xe9ecf4 },
      },
      { at: 'baye', who: 'baye', text: '喘口氣再說。什麼蹄印？', src: 2, cam: { x: 460, y: -40, zoom: 1.15, ms: 800 } },
      {
        at: 'baoma', who: 'baoma', text: '這——麼大！石頭踩出來的，一路往北！', src: 3, fx: 'shake',
        cam: { x: 300, y: -60, zoom: 1.18, ms: 600 },
        moves: [{ id: 'baoma', x: 250, hop: true, ms: 300 }],
      },
      { at: 'qiye', who: 'qiye', text: '是石駒。往北……就是芝嶺巖。', src: 4, cam: { x: 460, y: -80, zoom: 1.12, ms: 800 } },
      { at: 'wupan', who: 'wupan', text: '正好。今天就上山。', src: 5, cam: { x: 380, y: -80, zoom: 1.12, ms: 600 } },
      { at: 'wenpan', who: 'judge', text: '牠為什麼往北走，總有個原因。路上再問問。', src: 6, cam: { x: 560, y: -80, zoom: 1.1, ms: 800 } },
    ],
  },
  // 最後一戰・送回山中：石駒站起來走回山裡，在山腰回頭看一眼
  //（畫師的「回頭」臉朝左：往右走時翻面，回頭那拍翻回來朝向左邊的隊伍）
  shijuReturn1: {
    id: 'shijuReturn1',
    place: '芝嶺巖・天將亮',
    mood: 'dawn',
    sky: [0x2a2a4a, 0xd88a5a],
    far: 'mtnFar',
    ground: 0x2c2834,
    fore: 'mountain',
    actors: [
      { id: 'mist', tex: 'smoke', x: 640, y: -90, scale: 6, tint: 0xf0e6dc, alpha: 0, center: true },
      { id: 'decree', tex: 'decree', x: 190, y: -340, scale: 0.8, alpha: 0, center: true },
      { id: 'jiao', tex: 'st_jiao_qingling', x: 190, y: 30, scale: 0.42 },
      { id: 'qiye', tex: 'st_qiye', x: 90, y: 70, scale: 0.44 },
      { id: 'baye', tex: 'st_baye', x: 300, y: 95, scale: 0.49 },
      { id: 'shiju', tex: 'st_shiju_kneel', x: 470, y: 70, scale: 0.42 },
    ],
    beats: [
      {
        who: 'narrator', text: '天將亮。石駒站起來，一步一步走回山裡。', src: 0,
        cam: { x: 420, y: -80, zoom: 1.04, ms: 1600 },
        moves: [{ id: 'shiju', tex: 'st_shiju_look', flip: true, x: 560, y: 30, scale: 0.4, hop: true, ms: 1600 }],
      },
      {
        at: 'decree', who: 'god', text: '回去吧。山還在，你等的人也還記得你。', src: 1, fx: 'flash',
        cam: { x: 240, y: -170, zoom: 1.1, ms: 900 },
        moves: [{ id: 'decree', y: -310, alpha: 1, ms: 900 }],
      },
      {
        at: 'baye', who: 'baye', text: '就這樣讓牠走？', src: 2,
        cam: { x: 260, y: -40, zoom: 1.18, ms: 800 },
        moves: [{ id: 'decree', alpha: 0, ms: 600 }, { id: 'baye', x: 330, hop: true, ms: 400 }],
      },
      // 視覺修正：鏡頭拉回來，七爺要大家看的石駒也在畫面裡（原本在右緣外）
      { at: 'qiye', who: 'qiye', text: '噓。你看。', src: 3, cam: { x: 360, y: -60, zoom: 1.04, ms: 800 } },
      {
        who: 'narrator', text: '走到山腰，石駒停下來，回頭看了一眼。', src: 4,
        cam: { x: 580, y: -110, zoom: 1.22, ms: 1600 },
        moves: [{ id: 'shiju', x: 610, y: -20, scale: 0.32, flip: false, hop: true, ms: 1600 }, { id: 'mist', alpha: 0.18, ms: 1600 }],
      },
      { at: 'shiju', who: 'shijuCalm', text: '……鑼聲，我記得。', src: 5 },
      {
        who: 'narrator', text: '然後牠轉過身，走進了晨霧裡。', src: 6,
        cam: { x: 420, y: -100, zoom: 1, ms: 1800 },
        moves: [
          { id: 'shiju', x: 720, y: -40, scale: 0.28, alpha: 0, flip: true, hop: true, ms: 2000 },
          { id: 'mist', alpha: 0.35, scale: 8, ms: 2000 },
        ],
      },
    ],
  },
  // 最後一戰・斬：石駒化成一地碎石，文判官放下筆
  shijuSlay1: {
    id: 'shijuSlay1',
    place: '芝嶺巖・天將亮',
    mood: 'dawn',
    sky: [0x22222e, 0x7a5a50],
    far: 'mtnFar',
    ground: 0x2a2630,
    fore: 'mountain',
    actors: [
      { id: 'qiye', tex: 'st_qiye', x: 75, y: 65, scale: 0.44 },
      { id: 'wenpan', tex: 'st_wenpan', x: 200, y: 35, scale: 0.44 },
      { id: 'baye', tex: 'st_baye', x: 140, y: 95, scale: 0.49 },
      { id: 'wupan', tex: 'st_wupan', x: 300, y: 55, scale: 0.44 },
      { id: 'rubble', tex: 'st_rubble', x: 500, y: 75, scale: 1.2, alpha: 0 },
      { id: 'shiju', tex: 'st_shiju_kneel', x: 500, y: 70, scale: 0.42 },
      { id: 'dust', tex: 'smoke', x: 500, y: -70, scale: 4, tint: 0xb0a8a0, alpha: 0, center: true },
    ],
    beats: [
      {
        who: 'narrator', text: '武判官的刀落下。石駒化成一地碎石。', src: 0, fx: 'shake',
        cam: { x: 420, y: -60, zoom: 1.08, ms: 600 },
        moves: [
          { id: 'wupan', x: 360, hop: true, ms: 300 },
          { id: 'shiju', alpha: 0, ms: 900 },
          { id: 'rubble', alpha: 1, ms: 700 },
          { id: 'dust', alpha: 0.7, scale: 6, ms: 900 },
        ],
        sfx: { text: '唰！', at: 'wupan', color: 0xe9ecf4 },
      },
      {
        at: 'wupan', who: 'wupan', text: '……斬了。', src: 1,
        cam: { x: 360, y: -60, zoom: 1.15, ms: 900 },
        moves: [{ id: 'dust', alpha: 0, scale: 8, ms: 1600 }],
      },
      { who: 'narrator', text: '文判官放下了筆，很久沒有說話。', src: 2, cam: { x: 170, y: -100, zoom: 1.22, ms: 1400 } },
      { at: 'baye', who: 'baye', text: '判官，您寫啊。', src: 3, cam: { x: 150, y: -60, zoom: 1.2, ms: 600 } },
      { at: 'wenpan', who: 'judge', text: '牠肚子那個洞……到最後，都沒有人問牠痛不痛。', src: 4 },
      {
        at: 'wupan', who: 'wupan', text: '……我去把碎石撿起來，放回山上。', src: 5,
        cam: { x: 420, y: -60, zoom: 1.1, ms: 1200 },
        moves: [{ id: 'wupan', x: 420, hop: true, ms: 1200 }],
      },
    ],
  },
  // 回宮（三種結局都播）：七爺八爺收扇收鎖，報馬仔累倒在廟埕
  huigong1: {
    id: 'huigong1',
    place: '萬舺青嶺宮・天亮',
    mood: 'dawn',
    sky: [0x2a2a4a, 0xd88a5a],
    far: 'skyline',
    temple: 'temple_qingling',
    ground: 0x2c2834,
    fore: 'temple',
    actors: [
      { id: 'decree', tex: 'decree', x: 360, y: -370, scale: 0.8, alpha: 0, center: true },
      { id: 'jiao', tex: 'st_jiao_qingling', x: 120, y: 10, scale: 0.48 },
      { id: 'wenpan', tex: 'st_wenpan', x: 150, y: 30, scale: 0.44 },
      { id: 'qiye', tex: 'st_qiye', x: -80, y: 65, scale: 0.44 },
      { id: 'baye', tex: 'st_baye', x: -160, y: 95, scale: 0.49 },
      { id: 'baoma', tex: 'st_baoma', x: 270, y: 90, scale: 0.48 },
    ],
    beats: [
      {
        who: 'narrator', text: '天亮了。暗訪的隊伍回到青嶺宮。', src: 0,
        cam: { x: 360, y: -120, zoom: 1, ms: 1200 },
        moves: [
          { id: 'jiao', x: 360, hop: true, ms: 1600 },
          { id: 'wenpan', x: 170, hop: true, ms: 1600 },
          { id: 'qiye', x: 520, hop: true, ms: 1800 },
          { id: 'baye', x: 600, hop: true, ms: 1800 },
        ],
        sfx: { text: '咚、咚……', at: 'jiao', color: 0xffd76a },
      },
      { at: 'qiye', who: 'qiye', text: '扇子收起來囉。', src: 1, cam: { x: 540, y: -80, zoom: 1.15, ms: 900 } },
      { at: 'baye', who: 'baye', text: '鎖鏈也收了。……七哥，我腳好痠。', src: 2 },
      { at: 'qiye', who: 'qiye', text: '你走最前面，走最多。', src: 3 },
      { at: 'baoma', who: 'baoma', text: '我、我跑了三天……我先躺一下……', src: 4, cam: { x: 260, y: -60, zoom: 1.18, ms: 900 } },
      {
        who: 'narrator', text: '報馬仔一躺下，就在廟埕上睡著了，鑼還抱在懷裡。', src: 5,
        moves: [{ id: 'baoma', angle: -84, x: 300, y: 100, ms: 600 }],
        sfx: { text: 'Zzz……', at: 'baoma', color: 0xc9d6ff },
      },
      { at: 'wenpan', who: 'judge', text: '三天的口供，都記好了。', src: 6, cam: { x: 220, y: -80, zoom: 1.12, ms: 800 } },
      {
        at: 'decree', who: 'god', text: '辛苦了。暗訪，到此為止。', src: 7, fx: 'flash',
        cam: { x: 360, y: -170, zoom: 1.05, ms: 900 },
        moves: [{ id: 'decree', y: -340, alpha: 1, ms: 900 }],
      },
    ],
  },
  // ---------- 第 3 階段：第二章（./ch2.ts） ----------
  ...STAGES2,
  ...STAGES3,
};
