/**
 * 第三章（新瀛・太子出營）的演出腳本（docs/第一二章_熱鬧化計畫.md 第 4 階段）：8 段過場全部改成演出，台詞一字不改。
 * kaiying3、zhizha3（蓋在白天／夜審畫面上播）、river3、jiao3、jiaoRecall、jiaoSlay3、jiaoReturn3、shouying3。
 *
 * 第三章神明可以畫臉（決策紀錄 2026-10-27）：太子、四將用正式戰鬥圖（public/battle/，沒載到用程式畫的 b3_*），
 * 泡泡旁邊放說話者的立繪小頭像（faces，表情照原台詞），不用第一、二章的「旨意」。
 * 背景用第三章正式背景（public/bg/：庄頭遠景、溪邊渡口的遠景與堤防），沒載到用程式畫的 x3_*；晚上把白天的圖壓暗。
 * 蛟、蝦兵在溪裡（behind：站在堤防後面），其他人站在堤防上。
 * 第三章原本每段就有 6～11 句、五將互嗆，所以不補寫台詞；只加狀聲字（【待定】，見計畫 §9）。
 */
import type { StageScript } from './types';

/** 同一個地點共用的設定 */
type Base = Omit<StageScript, 'id' | 'place' | 'actors' | 'beats'>;

/** 溪邊渡口・天將亮（喚回、斬、鎮回三種結局） */
const RIVER_DAWN: Base = {
  mood: 'dawn',
  sky: [0x2a2a4a, 0xd88a5a],
  far: 'bg_ferry_far',
  farAlt: 'x3_riverFar',
  farY: 20,
  near: 'bg_ferry_near',
  ground: 0x4a5a5c,
  fore: 'river',
  faces: true,
};

/** 溪邊渡口・夜（妖怪視角）：白天的圖壓暗 */
const RIVER_NIGHT: Base = {
  mood: 'demon',
  sky: [0x0a0614, 0x1a1a3a],
  far: 'bg_ferry_far',
  farAlt: 'x3_riverFarN',
  farTint: 0x4a5480,
  farY: 20,
  near: 'bg_ferry_near',
  nearTint: 0x5a5a88,
  ground: 0x141a2a,
  fore: 'river',
  faces: true,
};

/** 新瀛太子殿・廟埕（開營、收營） */
const TEMPLE: Base = {
  mood: 'temple',
  sky: [0x1a0e08, 0x5a3412],
  far: 'bg_village_far',
  farAlt: 'x3_plainFarN',
  farTint: 0x6a5040,
  temple: 'temple_taizi',
  ground: 0x2a2632,
  fore: 'temple',
  faces: true,
};

export const STAGES3: Record<string, StageScript> = {
  // 開營：五將一個一個報到、互嗆；營旗下押著三個鬼；太子從神轎前現身
  kaiying3: {
    ...TEMPLE,
    id: 'kaiying3',
    place: '新瀛太子殿・開營',
    actors: [
      { id: 'flags', tex: 'w3_flags', x: 650, y: 10, scale: 1.1, alpha: 0.3 },
      // 神轎矮一點、往前站（修正第 2 輪：轎頂的寶珠原本插進「太子殿」匾）
      { id: 'jiao', tex: 'st_taizijiao', x: 360, y: 60, scale: 0.6 },
      { id: 'liu', tex: 'b3_liu', x: 860, y: 30, scale: 1.2 },
      { id: 'lian', tex: 'b3_lian', x: 940, y: 40, scale: 1.2 },
      { id: 'taizi', tex: 'b3_taizi', x: 360, y: 50, scale: 1.1, alpha: 0 },
      { id: 'zhang', tex: 'b3_zhang', x: -100, y: 50, scale: 1.2 },
      { id: 'xiao', tex: 'b3_xiao', x: -180, y: 70, scale: 1.2 },
      { id: 'g0', tex: 'g3_yamupo', x: 570, y: 95, scale: 1.5, alpha: 0, tint: 0x9a8ab0 },
      { id: 'g1', tex: 'g3_shuigui', x: 640, y: 100, scale: 1.45, alpha: 0, tint: 0x9a8ab0 },
      { id: 'g2', tex: 'g3_huosha', x: 705, y: 95, scale: 1.5, alpha: 0, tint: 0x9a8ab0 },
    ],
    beats: [
      {
        who: 'narrator', text: '九月初九前三天。新瀛太子殿前的五營旗竿，一夜之間全插滿了。', src: 0,
        cam: { x: 360, y: -120, zoom: 1, ms: 1200 },
        moves: [{ id: 'flags', alpha: 1, ms: 1200 }],
      },
      {
        at: 'zhang', who: 'zhangjiang', text: '東營到。太子，弟兄們都準備好了。', src: 1,
        cam: { x: 200, y: -80, zoom: 1.12, ms: 900 },
        moves: [{ id: 'zhang', x: 90, hop: true, ms: 900 }],
      },
      {
        at: 'xiao', who: 'xiaojiang', text: '南營到！太子，今年打幾隻？我賭十隻！', src: 2,
        moves: [{ id: 'xiao', x: 200, hop: true, ms: 700 }],
        sfx: { text: '到——！', at: 'xiao', color: 0xffd76a },
      },
      {
        at: 'liu', who: 'liujiang', text: '西營。', src: 3,
        cam: { x: 520, y: -80, zoom: 1.12, ms: 900 },
        moves: [{ id: 'liu', x: 520, ms: 900 }],
      },
      {
        at: 'lian', who: 'lianjiang', text: '北營。……溪水今年的聲音，不太對。', src: 4,
        moves: [{ id: 'lian', x: 610, ms: 900 }],
      },
      { who: 'narrator', text: '沒有人接話。', src: 5, cam: { x: 360, y: -100, zoom: 1, ms: 1200 } },
      {
        at: 'taizi', who: 'taizi', text: '囉嗦。人到了就好。', src: 6,
        cam: { x: 360, y: -110, zoom: 1.15, ms: 800 },
        moves: [{ id: 'taizi', alpha: 1, y: 60, ms: 600 }],
      },
      {
        at: 'xiao', who: 'xiaojiang', text: '對了，昨晚順手抓了三個，押在營旗下了！', src: 7,
        cam: { x: 280, y: -90, zoom: 1.1, ms: 700 },
        moves: [{ id: 'xiao', x: 230, hop: true, ms: 400 }],
      },
      {
        who: 'narrator', text: '營旗下押著三個鬼：一個抱著鴨毛的老婦人、一個渾身濕透的年輕人、一個一身焦味的瘦小子。', src: 8,
        cam: { x: 600, y: -60, zoom: 1.2, ms: 1000 },
        moves: [{ id: 'g0', alpha: 1, ms: 500 }, { id: 'g1', alpha: 1, ms: 800 }, { id: 'g2', alpha: 1, ms: 1100 }],
      },
      {
        at: 'zhang', who: 'zhangjiang', text: '五格滿了三格。太子，這三天會很擠。', src: 9,
        cam: { x: 220, y: -90, zoom: 1.1, ms: 900 },
      },
      {
        at: 'taizi', who: 'taizi', text: '擠就擠。走了。', src: 10, fx: 'flash',
        cam: { x: 360, y: -100, zoom: 1, ms: 900 },
        moves: [{ id: 'taizi', x: 380, hop: true, ms: 500 }, { id: 'flags', x: 680, hop: true, ms: 600 }],
        sfx: { text: '鏘！', at: 'taizi', color: 0xffd76a },
      },
    ],
  },

  // 紙紮童跪下（蓋在白天或夜審畫面上播，播完回原畫面）：舊壇前，乾坤圈落地
  zhizha3: {
    id: 'zhizha3',
    place: '太子殿・堂前',
    mood: 'demon',
    sky: [0x0a0614, 0x2e1446],
    far: 'bg_village_far',
    farAlt: 'x3_plainFarN',
    farTint: 0x3a3460,
    temple: 'temple_taizi',
    ground: 0x1a1424,
    fore: 'temple',
    faces: true,
    actors: [
      { id: 'dust', tex: 'smoke', x: 430, y: 40, scale: 2, tint: 0x8a8090, alpha: 0, center: true },
      { id: 'taizi', tex: 'b3_taizi', x: 190, y: 50, scale: 1.1, alpha: 0 },
      { id: 'xiao', tex: 'b3_xiao', x: -120, y: 70, scale: 1.2 },
      { id: 'zhizha', tex: 'g3_zhizha', x: 520, y: 70, scale: 1.8, tint: 0xd8c0e0 },
      { id: 'ring', tex: 'x3_ring', x: 430, y: -700, scale: 1.4, alpha: 0, center: true },
    ],
    beats: [
      {
        who: 'narrator', text: '紙紮童一直以為，太子爺只是一尊不會動的神像。', src: 0,
        cam: { x: 460, y: -80, zoom: 1.1, ms: 1400 },
      },
      {
        at: 'zhizha', who: 'zhizha', text: '我才是太子！小孩子的糖，都是送給我的！', src: 1,
        cam: { x: 500, y: -60, zoom: 1.2, ms: 700 },
        moves: [{ id: 'zhizha', x: 490, hop: true, ms: 600 }],
      },
      {
        at: 'taizi', who: 'taizi', text: '喔？', src: 2,
        cam: { x: 330, y: -100, zoom: 1.05, ms: 800 },
        moves: [{ id: 'taizi', alpha: 1, x: 220, ms: 700 }],
      },
      {
        who: 'narrator', text: '乾坤圈「鏘」的一聲落在牠面前。地磚裂了一條縫。', src: 3, fx: 'shake',
        cam: { x: 450, y: -40, zoom: 1.2, ms: 400 },
        moves: [{ id: 'ring', y: 50, alpha: 1, ms: 300 }, { id: 'dust', alpha: 0.6, scale: 3.5, ms: 700 }],
        sfx: { text: '鏘！', at: 'ring', color: 0xffd76a },
      },
      {
        at: 'zhizha', who: 'zhizha', text: '……太、太子爺。小的是紙做的，經不起、經不起……', src: 4,
        // 跪下：縮矮一截、往後退
        moves: [{ id: 'zhizha', x: 540, y: 80, scale: 1.45, ms: 500 }, { id: 'dust', alpha: 0, ms: 900 }],
      },
      {
        at: 'xiao', who: 'xiaojiang', text: '跪了！牠跪了啦！', src: 5,
        cam: { x: 300, y: -90, zoom: 1.05, ms: 800 },
        moves: [{ id: 'xiao', x: 80, hop: true, ms: 700 }],
      },
      {
        who: 'narrator', text: '隔天，來舊壇的小孩說：壇上那尊紙紮的「三太子」，自己跪下來了。', src: 6,
        cam: { x: 360, y: -100, zoom: 1, ms: 1400 },
      },
    ],
  },

  // 第二夜天亮前：疾水溪倒流（妖怪視角）。蝦兵慌張、蛟從水裡冒出來；岸上的何伯茶杯停在半空
  river3: {
    ...RIVER_NIGHT,
    id: 'river3',
    place: '疾水溪・天還沒亮',
    actors: [
      { id: 'jiao', tex: 'jiao', x: 520, y: 60, scale: 0.85, alpha: 0, tint: 0x8a7aa0, behind: true },
      { id: 'xia0', tex: 'xia', x: 400, y: 30, scale: 1.3, behind: true },
      { id: 'xia1', tex: 'xia', x: 300, y: 40, scale: 1.15, tint: 0xd8c0c0, behind: true },
      { id: 'hebo', tex: 'n3_hebo', x: 110, y: 30, scale: 1.8 },
    ],
    beats: [
      {
        who: 'narrator', text: '天還沒亮，疾水溪的水開始往山那邊流。', src: 0,
        cam: { x: 400, y: -100, zoom: 1, ms: 1400 },
        sfx: { text: '嘩——', at: 'xia0', color: 0x8ac0ff },
      },
      {
        at: 'xia0', who: 'xiabing', text: '老、老大醒了！溪水倒著流了！', src: 1,
        cam: { x: 380, y: -70, zoom: 1.15, ms: 800 },
        moves: [{ id: 'xia0', x: 420, hop: true, ms: 500 }],
      },
      {
        at: 'xia1', who: 'xiabing', text: '聽說岸上那個綁雙髻的，兩天就把我們打爆了一整窩……', src: 2,
        moves: [{ id: 'xia1', x: 320, hop: true, ms: 400 }],
      },
      {
        at: 'jiao', who: 'jiao', text: '怕什麼。他小時候，也是在水邊哭著回家的。', src: 3,
        cam: { x: 540, y: -140, zoom: 1.08, ms: 1200 },
        moves: [{ id: 'jiao', alpha: 0.95, y: 40, ms: 1400 }],
      },
      {
        who: 'narrator', text: '岸上，擺茶攤的何伯看著溪面，茶杯停在半空中。', src: 4,
        cam: { x: 200, y: -80, zoom: 1.15, ms: 1200 },
        moves: [{ id: 'jiao', alpha: 0.5, ms: 1200 }],
      },
      {
        at: 'hebo', who: 'hebo', text: '溪水……怎麼往山那邊流？', src: 5,
        cam: { x: 200, y: -70, zoom: 1.25, ms: 600 },
      },
    ],
  },

  // 收營夜：五營把太子轎抬到舊渡口，蛟現身，五面營旗同時豎起來（接著是最後一戰）
  jiao3: {
    ...RIVER_NIGHT,
    id: 'jiao3',
    place: '疾水溪・收營夜',
    actors: [
      { id: 'jiao', tex: 'jiao', x: 530, y: 60, scale: 0.85, alpha: 0, tint: 0x8a7aa0, behind: true },
      { id: 's0', tex: 'w3_soldier0', x: 40, y: -10, scale: 1.1, alpha: 0 },
      { id: 's1', tex: 'w3_soldier1', x: 130, y: -10, scale: 1.1, alpha: 0 },
      { id: 's2', tex: 'w3_soldier2', x: 220, y: -10, scale: 1.1, alpha: 0 },
      { id: 's3', tex: 'w3_soldier3', x: 310, y: -10, scale: 1.1, alpha: 0 },
      { id: 's4', tex: 'w3_soldier4', x: 400, y: -10, scale: 1.1, alpha: 0 },
      // 修正第 4 輪：太子轎換扛轎版（朝右、往右走），四將走到轎子右邊（前頭），不擋轎班
      { id: 'palanquin', tex: 'st_taizijiao_carried', x: -60, y: 10, scale: 0.56 },
      { id: 'taizi', tex: 'b3_taizi', x: 180, y: 50, scale: 1.1, alpha: 0 },
      { id: 'liu', tex: 'b3_liu', x: -100, y: 40, scale: 1.15 },
      { id: 'zhang', tex: 'b3_zhang', x: -40, y: 55, scale: 1.2 },
      { id: 'xiao', tex: 'b3_xiao', x: 120, y: 65, scale: 1.2 },
      { id: 'lian', tex: 'b3_lian', x: 200, y: 45, scale: 1.15 },
    ],
    beats: [
      {
        who: 'narrator', text: '收營夜。五營兵將把太子轎抬到疾水溪舊渡口。溪水倒流了一整天，這時整個鼓了起來。', src: 0,
        cam: { x: 360, y: -100, zoom: 1, ms: 1600 },
        moves: [
          { id: 'palanquin', x: 210, hop: true, ms: 1600 },
          { id: 'liu', x: 400, hop: true, ms: 1600 },
          { id: 'zhang', x: 470, hop: true, ms: 1600 },
          { id: 'xiao', x: 540, hop: true, ms: 1600 },
          { id: 'lian', x: 610, hop: true, ms: 1600 },
        ],
      },
      {
        at: 'lian', who: 'lianjiang', text: '水裡那個，在聽。', src: 1,
        cam: { x: 480, y: -90, zoom: 1.12, ms: 900 },
      },
      {
        at: 'jiao', who: 'jiao', text: '哪來的小鬼，在我的溪邊插旗子？', src: 2,
        cam: { x: 540, y: -150, zoom: 1.06, ms: 1200 },
        moves: [{ id: 'jiao', alpha: 1, y: 40, ms: 1200 }],
        sfx: { text: '嘩——！', at: 'jiao', color: 0x8ac0ff },
      },
      {
        at: 'xiao', who: 'xiaojiang', text: '你說誰小鬼！', src: 3,
        // 修正第 4 輪：鏡頭偏左一點，最左邊扛轎的轎班留在畫面裡
        cam: { x: 380, y: -90, zoom: 1.12, ms: 600 },
        moves: [{ id: 'xiao', x: 560, hop: true, ms: 300 }],
      },
      { at: 'jiao', who: 'jiao', text: '鴨子、渡船、小孩……這條溪的東西，都是我的。', src: 4, cam: { x: 540, y: -150, zoom: 1.06, ms: 800 } },
      {
        at: 'jiao', who: 'jiao', text: '……喔？你就是當年鬧海那個小鬼？', src: 5, fx: 'shake',
        cam: { x: 500, y: -160, zoom: 1, ms: 500 },
        moves: [{ id: 'jiao', tex: 'jiao_rise', x: 470, y: 50, ms: 600 }],
      },
      {
        at: 'zhang', who: 'zhangjiang', text: '太子，別理牠——', src: 6,
        cam: { x: 200, y: -90, zoom: 1.1, ms: 700 },
        moves: [{ id: 'zhang', x: 420, ms: 400 }],
      },
      {
        at: 'taizi', who: 'taizi', text: '站好，別說我偷襲。', src: 7,
        cam: { x: 280, y: -110, zoom: 1.15, ms: 700 },
        moves: [{ id: 'taizi', alpha: 1, x: 340, ms: 600 }],
      },
      {
        who: 'narrator', text: '五面營旗同時豎了起來。', src: 8, fx: 'flash',
        cam: { x: 360, y: -100, zoom: 1, ms: 900 },
        moves: [
          { id: 's0', alpha: 1, y: -20, hop: true, ms: 400 },
          { id: 's1', alpha: 1, y: -20, hop: true, ms: 400 },
          { id: 's2', alpha: 1, y: -20, hop: true, ms: 400 },
          { id: 's3', alpha: 1, y: -20, hop: true, ms: 400 },
          { id: 's4', alpha: 1, y: -20, hop: true, ms: 400 },
        ],
        sfx: { text: '唰！', at: 'taizi', color: 0xffd76a },
      },
    ],
  },

  // 結局・喚回：天將亮，溪水轉回往海流。蛟低頭，太子踩上牠的頭；一列白鴨游過去
  jiaoRecall: {
    ...RIVER_DAWN,
    id: 'jiaoRecall',
    place: '疾水溪・天將亮',
    actors: [
      { id: 'ducks', tex: 'x3_ducks', x: -160, y: -30, scale: 1, behind: true },
      { id: 'jiao', tex: 'jiao', x: 520, y: 60, scale: 0.85, tint: 0xb8a8c8, behind: true },
      { id: 'liu', tex: 'b3_liu', x: 40, y: 40, scale: 1.15 },
      { id: 'zhang', tex: 'b3_zhang', x: 130, y: 55, scale: 1.2 },
      { id: 'taizi', tex: 'b3_taizi', x: 300, y: 50, scale: 1.1 },
      { id: 'xiao', tex: 'b3_xiao', x: 210, y: 70, scale: 1.2 },
      { id: 'lian', tex: 'b3_lian', x: 400, y: 40, scale: 1.15 },
    ],
    beats: [
      {
        who: 'narrator', text: '天快亮了。溪水停了一下，慢慢轉回往海那邊流。', src: 0,
        cam: { x: 400, y: -100, zoom: 1, ms: 1400 },
        sfx: { text: '嘩……', at: 'jiao', color: 0x8ac0ff },
      },
      {
        at: 'jiao', who: 'jiaoCalm', text: '……我在這裡幾百年，第一次有人沒讓我沉下去。', src: 1,
        cam: { x: 540, y: -140, zoom: 1.08, ms: 1200 },
        moves: [{ id: 'jiao', tint: null, ms: 1200 }],
      },
      {
        at: 'jiao', who: 'jiaoCalm', text: '要殺要剮，隨你。', src: 2,
        moves: [{ id: 'jiao', y: 80, ms: 900 }],
      },
      {
        at: 'taizi', who: 'taizi', text: '誰說要殺你。……我只是缺一隻坐騎。', src: 3, fx: 'flash',
        cam: { x: 330, y: -110, zoom: 1.15, ms: 700 },
        moves: [{ id: 'taizi', x: 330, hop: true, ms: 500 }],
      },
      {
        at: 'xiao', who: 'xiaojiang', text: '坐騎！太子有坐騎了！', src: 4,
        cam: { x: 240, y: -90, zoom: 1.1, ms: 600 },
        moves: [{ id: 'xiao', x: 220, hop: true, ms: 400 }],
        sfx: { text: '耶——！', at: 'xiao', color: 0xffd76a },
      },
      { at: 'zhang', who: 'zhangjiang', text: '太子，您嘴角在笑。', src: 5, cam: { x: 220, y: -90, zoom: 1.12, ms: 600 } },
      { at: 'taizi', who: 'taizi', text: '沒有。', src: 6, cam: { x: 320, y: -110, zoom: 1.2, ms: 500 } },
      {
        at: 'liu', who: 'liujiang', text: '有。', src: 7,
        cam: { x: 160, y: -90, zoom: 1.15, ms: 500 },
      },
      {
        who: 'narrator', text: '蛟低下頭，讓太子踩上牠的頭。溪面上，一列白鴨慢慢游了過去。', src: 8,
        cam: { x: 400, y: -120, zoom: 1, ms: 1600 },
        moves: [
          { id: 'taizi', x: 520, y: -150, scale: 0.95, hop: true, ms: 1400 },
          { id: 'ducks', x: 420, ms: 3200 },
        ],
      },
    ],
  },

  // 結局・斬：火尖槍落下，蛟沉進水裡，溪水嘩的一聲轉回往海流
  jiaoSlay3: {
    ...RIVER_DAWN,
    id: 'jiaoSlay3',
    place: '疾水溪・天將亮',
    actors: [
      { id: 'jiao', tex: 'jiao', x: 520, y: 60, scale: 0.85, tint: 0xb89ad0, behind: true },
      { id: 'wave', tex: 'x3_wave', x: 560, y: 40, scale: 1.2, alpha: 0, behind: true },
      { id: 'zhang', tex: 'b3_zhang', x: 90, y: 55, scale: 1.2 },
      { id: 'xiao', tex: 'b3_xiao', x: 180, y: 70, scale: 1.2 },
      { id: 'taizi', tex: 'b3_taizi', x: 290, y: 50, scale: 1.1 },
    ],
    beats: [
      {
        at: 'jiao', who: 'jiao', text: '你……真的一點情面都不留……', src: 0,
        cam: { x: 540, y: -140, zoom: 1.08, ms: 1400 },
      },
      {
        at: 'taizi', who: 'taizi', text: '鴨子、渡船、小孩。你欠的，自己算。', src: 1,
        cam: { x: 340, y: -110, zoom: 1.15, ms: 700 },
        moves: [{ id: 'taizi', x: 360, hop: true, ms: 500 }],
      },
      {
        who: 'narrator', text: '火尖槍落下。疾水溪的水嘩的一聲，轉回往海那邊流。', src: 2, fx: 'flash',
        cam: { x: 460, y: -100, zoom: 1.05, ms: 500 },
        moves: [
          { id: 'taizi', x: 470, ms: 300 },
          { id: 'jiao', alpha: 0, y: 260, ms: 1200 },
          { id: 'wave', alpha: 0.9, ms: 400 },
        ],
        sfx: { text: '嘩啦——！', at: 'wave', color: 0x8ac0ff },
      },
      {
        at: 'xiao', who: 'xiaojiang', text: '帥啦！', src: 3,
        cam: { x: 260, y: -90, zoom: 1.1, ms: 700 },
        moves: [{ id: 'wave', alpha: 0, ms: 1200 }, { id: 'taizi', x: 360, ms: 700 }, { id: 'xiao', x: 200, hop: true, ms: 400 }],
      },
      { at: 'zhang', who: 'zhangjiang', text: '太子，收營吧。', src: 4, cam: { x: 200, y: -90, zoom: 1.12, ms: 700 } },
      {
        at: 'taizi', who: 'taizi', text: '……嗯。', src: 5,
        cam: { x: 380, y: -110, zoom: 1.2, ms: 1200 },
      },
    ],
  },

  // 結局・鎮回：蛟沉回溪底，水府收牠；溪底深處好像還有什麼在動
  jiaoReturn3: {
    ...RIVER_DAWN,
    id: 'jiaoReturn3',
    place: '疾水溪・天將亮',
    actors: [
      { id: 'deep', tex: 'smoke', x: 560, y: -10, scale: 3, tint: 0x1a2a3a, alpha: 0, center: true, behind: true },
      { id: 'jiao', tex: 'jiao', x: 520, y: 60, scale: 0.85, tint: 0xb89ad0, behind: true },
      { id: 'zhang', tex: 'b3_zhang', x: 70, y: 55, scale: 1.2 },
      { id: 'taizi', tex: 'b3_taizi', x: 280, y: 50, scale: 1.1 },
      { id: 'lian', tex: 'b3_lian', x: 400, y: 40, scale: 1.15 },
      { id: 'xiao', tex: 'b3_xiao', x: 170, y: 70, scale: 1.2 },
    ],
    beats: [
      {
        at: 'lian', who: 'lianjiang', text: '水府那邊，會收牠。', src: 0,
        cam: { x: 420, y: -90, zoom: 1.1, ms: 1200 },
      },
      {
        at: 'jiao', who: 'jiaoCalm', text: '……今天算你運氣好。', src: 1,
        cam: { x: 540, y: -140, zoom: 1.06, ms: 900 },
        moves: [{ id: 'jiao', tint: null, ms: 900 }],
      },
      {
        at: 'taizi', who: 'taizi', text: '下次再出來，我就不押了。', src: 2,
        cam: { x: 300, y: -110, zoom: 1.15, ms: 700 },
        moves: [{ id: 'taizi', x: 310, hop: true, ms: 400 }],
      },
      {
        who: 'narrator', text: '蛟沉回溪底。溪水平靜了，可是溪底深處，好像還有什麼在動。', src: 3,
        cam: { x: 520, y: -60, zoom: 1.1, ms: 1600 },
        moves: [{ id: 'jiao', alpha: 0, y: 300, ms: 2200 }, { id: 'deep', alpha: 0.6, ms: 2200 }],
        sfx: { text: '咕嘟……', at: 'deep', color: 0x8ac0ff },
      },
      {
        at: 'lian', who: 'lianjiang', text: '……下面，還有。', src: 4,
        cam: { x: 460, y: -70, zoom: 1.2, ms: 900 },
        moves: [{ id: 'deep', scale: 4.5, alpha: 0.75, ms: 1400 }],
      },
      { who: 'narrator', text: '沒有人接話。', src: 5, cam: { x: 360, y: -100, zoom: 1, ms: 1400 } },
    ],
  },

  // 收營：營旗收回太子殿，營兵比出營時多；炳伯供蜂蜜和奶嘴；廟埕外電音鼓點
  shouying3: {
    ...TEMPLE,
    id: 'shouying3',
    place: '新瀛太子殿・收營',
    actors: [
      { id: 'flags', tex: 'w3_flags', x: 700, y: 0, scale: 1.1 },
      { id: 'jiao', tex: 'st_taizijiao', x: 360, y: 10, scale: 0.7 },
      { id: 'taizi', tex: 'b3_taizi', x: 360, y: 50, scale: 1.1 },
      // 跟回來的營兵（比出營時多）：從右邊走進來，站在北營後面
      { id: 's0', tex: 'w3_soldier0', x: 820, y: 30, scale: 1.1 },
      { id: 's1', tex: 'w3_soldier1', x: 880, y: 35, scale: 1.1 },
      { id: 's2', tex: 'w3_soldier2', x: 940, y: 30, scale: 1.1 },
      { id: 's3', tex: 'w3_soldier3', x: 1000, y: 35, scale: 1.1 },
      { id: 's4', tex: 'w3_soldier4', x: 1060, y: 30, scale: 1.1 },
      { id: 's5', tex: 'w3_soldier0', x: 1120, y: 35, scale: 1.1 },
      { id: 'zhang', tex: 'b3_zhang', x: 60, y: 55, scale: 1.2 },
      { id: 'xiao', tex: 'b3_xiao', x: 150, y: 70, scale: 1.2 },
      { id: 'lian', tex: 'b3_lian', x: 500, y: 45, scale: 1.15 },
      { id: 'bingbo', tex: 'n3_bingbo', x: -80, y: 80, scale: 1.8 },
    ],
    beats: [
      {
        who: 'narrator', text: '收營。五營旗一面一面收回太子殿，跟回來的營兵，比出營時多了好幾個。', src: 0,
        cam: { x: 360, y: -120, zoom: 1, ms: 1200 },
        moves: [
          { id: 's0', x: 560, hop: true, ms: 1800 }, { id: 's1', x: 600, hop: true, ms: 1900 },
          { id: 's2', x: 640, hop: true, ms: 2000 }, { id: 's3', x: 680, hop: true, ms: 2100 },
          { id: 's4', x: 620, y: 70, hop: true, ms: 2200 }, { id: 's5', x: 670, y: 75, hop: true, ms: 2300 },
        ],
      },
      {
        at: 'bingbo', who: 'bingbo', text: '太子，辛苦了。這是今年的蜂蜜。……還有這個。', src: 1,
        cam: { x: 260, y: -80, zoom: 1.12, ms: 900 },
        moves: [{ id: 'bingbo', x: 240, hop: true, ms: 1000 }],
      },
      {
        who: 'narrator', text: '炳伯在供桌上擺了一碗蜂蜜，旁邊放了一個奶嘴。', src: 2,
        moves: [{ id: 'bingbo', x: 270, ms: 500 }],
      },
      {
        at: 'taizi', who: 'taizi', text: '誰要這個。……先放著。', src: 3,
        cam: { x: 360, y: -110, zoom: 1.18, ms: 700 },
      },
      {
        at: 'xiao', who: 'xiaojiang', text: '明年再出營！明年打二十隻！', src: 4,
        cam: { x: 200, y: -90, zoom: 1.12, ms: 600 },
        moves: [{ id: 'xiao', x: 170, hop: true, ms: 400 }],
      },
      { at: 'zhang', who: 'zhangjiang', text: '你先把今年的營兵點清楚。', src: 5, cam: { x: 160, y: -90, zoom: 1.1, ms: 800 } },
      { at: 'lian', who: 'lianjiang', text: '溪水，往海那邊流了。', src: 6, cam: { x: 540, y: -90, zoom: 1.12, ms: 800 } },
      {
        who: 'narrator', text: '沒有人接話。廟埕外，電音的鼓點還在響。', src: 7, fx: 'firecracker',
        cam: { x: 360, y: -100, zoom: 1, ms: 1000 },
        sfx: { text: '咚滋、咚滋！', at: 'flags', color: 0xff8ad8 },
      },
    ],
  },
};
