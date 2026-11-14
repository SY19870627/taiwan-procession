// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章（白砂墩・媽祖徒步進香）的演出腳本：qijia4（拱辰宮起駕）、zhuanjin4（臨時轉進賢仔車行）；
 * 第 B1 輪：jinmiao4（入廟三進三退，原 sanjin4；台詞照 _agent/ch4-text-day2.md 第 8 節）。
 * 第 B2 輪（台詞照 _agent/ch4-text-day3.md 第 6、8、9 節）：qiaotou4（橋頭頓三下下堤防）、huigong4（回宮・換八人大轎）、kailu4（開爐）。
 * 台詞照抄 content/ch4/story.ts（src 標第幾句）；走位照 _agent/ch4-text-day1.md 的（演出：……），沒有補寫的拍子。
 *
 * 媽祖全章不露臉：畫面上只有轎子（四人小轎 st_jiao4_carry，落地換 st_jiao4），沒有旨意、沒有神明說話。
 * 第 3 輪：轎在路口／車行門口頓住換 st_jiao4_pause、轉進小路／轉向車行門口換 st_jiao4_turn、走路換回 st_jiao4_carry、落地 st_jiao4。
 * 轎的圖都是朝右畫的，這兩段轎子往左走，所以 flip（倒退時仍面向左＝倒著退）。
 * 轎的設計尺寸 560×400（落地 400×400），scale 0.5 → 約 280×200（× 畫面倍率 k；第 3 輪從 0.42 調大：比頭旗手 480×0.4＝192 略高，和白天隊伍轎 0.36／頭旗 0.26 的比例相近）；正式圖同尺寸、底部置中，直接對齊。
 * 前哨、押尾、阿睿、阿滿姨、賢仔的立繪還沒到，先用程式畫的小人（folk*）放大；頭旗手、香燈腳用 art/baishadun.ts 的暫代。
 * 轎、頭旗、香擔只是畫面（過場本來就不能點）。
 */
import type { StageActor, StageScript } from './types';
import { chainSegments4 } from '../ch4/believers';
import { chainVisual4, rewards4 } from '../ch4/finale';
import type { RunState } from '../../state';

/**
 * 回宮／開爐的群眾：人鏈越長（幫過越多人），畫面後排多站幾個人、多幾點燈（回宮是手機的燈，開爐是燭火）。
 * 只是畫面：沒有字、腳本的走位不碰它們，數量照 chainVisual4（和最後一戰同一套，最多 10 段）；不讀、不改任何戰鬥數值。
 * 人影用程式畫的小人（folk*，播放器的裁邊檢查不看它們），燈用 spark。位置用固定公式排，不用亂數。
 */
export function chainCrowd4(chain: number, at: 'huigong4' | 'kailu4'): StageActor[] {
  const { figures, lights } = chainVisual4(chain);
  const out: StageActor[] = [];
  for (let i = 0; i < figures; i++) {
    out.push({
      id: `crowd${i}`, tex: `folk${(i % 5) + 1}`, x: 50 + ((i * 263) % 620), y: 4 + (i % 3) * 7,
      scale: 1.05 + (i % 2) * 0.1, tint: at === 'kailu4' ? 0xd8c8b8 : 0xb8b0c8, alpha: 0.8,
    });
  }
  for (let j = 0; j < lights; j++) {
    out.push({
      id: `light${j}`, tex: 'spark', x: 40 + ((j * 151) % 640), y: -36 - (j % 4) * 14,
      scale: at === 'kailu4' ? 0.7 : 0.55, tint: at === 'kailu4' ? 0xffc860 : 0xe8f4ff, alpha: 0.85, center: true,
    });
  }
  return out;
}

/** 回宮／開爐多出來的人影最多幾個 */
export const REWARD_CROWD_MAX4 = 12;

/**
 * 第 C3 輪（爽Game）：做了的事（押中、喊回來的牽路仔、判對歸處的鬼、辦成的小事：finale.ts 的 rewards4）
 * 在回宮／開爐多站一個人影，站在人鏈的群眾前面一排。只加不減：什麼都沒做就沒有多的人，故事照走。
 * 跟 chainCrowd4 一樣只是畫面：沒有字、腳本的走位不碰它們、位置用固定公式。
 */
export function rewardCrowd4(n: number, at: 'huigong4' | 'kailu4'): StageActor[] {
  const out: StageActor[] = [];
  for (let i = 0; i < Math.max(0, Math.min(REWARD_CROWD_MAX4, n)); i++) {
    out.push({
      id: `fan${i}`, tex: `folk${((i + 2) % 5) + 1}`, x: 30 + ((i * 197) % 660), y: 26 + (i % 2) * 8,
      scale: 1.0 + (i % 3) * 0.06, tint: at === 'kailu4' ? 0xe8d8c0 : 0xc8c0d8, alpha: 0.85,
    });
  }
  return out;
}

/** 回宮／開爐的群眾：人鏈（chainCrowd4）＋做了的事（rewardCrowd4） */
const crowd4 = (at: 'huigong4' | 'kailu4') => (r: RunState): StageActor[] => [...chainCrowd4(chainSegments4(r), at), ...rewardCrowd4(rewards4(r), at)];

export const STAGES4: Record<string, StageScript> = {
  // 2 開場：拱辰宮・起駕（廟門在中間，轎停在門內；頭旗手站門檻前；前哨左前、押尾最右；香燈腳排滿下方）
  qijia4: {
    id: 'qijia4',
    place: '白砂墩拱辰宮・起駕',
    mood: 'temple',
    sky: [0x0a0c22, 0x3a2a40],
    far: 'seaFarN',
    temple: 'temple_gongchen',
    ground: 0x2a2632,
    fore: 'temple',
    actors: [
      { id: 'jiao', tex: 'st_jiao4_carry', x: 360, y: 0, scale: 0.5, flip: true },
      { id: 'touqi', tex: 'st_touqi', x: 470, y: 30, scale: 0.4 },
      { id: 'qianshao', tex: 'folk1', x: 150, y: 70, scale: 1.5 },
      { id: 'yawei', tex: 'folk2', x: 650, y: 70, scale: 1.5 },
      { id: 'aman', tex: 'folk3', x: 560, y: 95, scale: 1.4 },
      { id: 'arui', tex: 'folk1', x: 820, y: 60, scale: 1.5, tint: 0xffe0b0 },
      { id: 'xd0', tex: 'st_xiangdeng_a', x: 90, y: 125, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_c', x: 270, y: 130, scale: 0.3 },
      { id: 'xd2', tex: 'st_xiangdeng_d', x: 440, y: 130, scale: 0.3 },
      { id: 'xd3', tex: 'st_xiangdeng_b', x: 620, y: 125, scale: 0.3 },
    ],
    beats: [
      // 鏡頭從廟門慢慢拉開，香旗被風吹向同一邊
      { who: 'narrator', text: '快到子時了。拱辰宮廟埕的燈全部打開，海風很大。', src: 0, cam: { x: 360, y: -110, zoom: 1, ms: 2200 } },
      // 阿睿從右邊倒退走進來，自拍棒舉高
      { at: 'arui', who: 'arui', text: '跟轎台開播！現在線上三百一十二人，大家晚安！', src: 1, moves: [{ id: 'arui', x: 600, ms: 1400 }] },
      { at: 'qianshao', who: 'qianshao', text: '領隊，那個拿棍子的在跟誰講話？', src: 2, cam: { x: 300, y: -90, zoom: 1.08, ms: 700 } },
      { at: 'yawei', who: 'yawei', text: '他在跟手機講話。他叫阿睿。', src: 3 },
      // 頭旗舉起
      { at: 'touqi', who: 'touqi', text: '時辰到。起！', src: 4, fx: 'flash', cam: { x: 420, y: -120, zoom: 1.1, ms: 600 }, moves: [{ id: 'touqi', y: 10, hop: true, ms: 400 }] },
      // 頭旗手往左衝出畫面
      {
        who: 'narrator', text: '頭旗先衝出廟門。鞭炮從廟口一路炸到海堤。', src: 5, fx: 'firecracker',
        cam: { x: 360, y: -100, zoom: 1, ms: 800 },
        moves: [{ id: 'touqi', x: -220, hop: true, ms: 1400 }],
        sfx: { text: '劈哩啪啦！', at: 'jiao' },
      },
      { at: 'xd1', who: 'xiangdeng', text: '起駕了！起駕了！', src: 6 },
      // 轎從門內出來，上下輕晃，往左走；香燈腳往兩邊讓
      {
        who: 'narrator', text: '四人小轎跟著出來。粉紅色的轎頂在人群上面一晃一晃。', src: 7,
        moves: [
          { id: 'jiao', x: 300, y: 40, hop: true, ms: 1600 },
          { id: 'xd1', x: 180, ms: 800 },
          { id: 'xd2', x: 530, ms: 800 },
        ],
      },
      // 前哨往左衝
      { at: 'qianshao', who: 'qianshao', text: '我走前面！往省道對不對？', src: 8, moves: [{ id: 'qianshao', x: 60, hop: true, ms: 500 }] },
      // 轎停在路口，前後擺兩次，往下頓一次。全場的人都停
      {
        who: 'narrator', text: '轎子到了廟前第一個路口就停住，前後擺了兩下，頓了一下。', src: 9,
        cam: { x: 260, y: -80, zoom: 1.12, ms: 800 },
        // 第 3 輪：換「路口頓住」的轎（st_jiao4_pause，前低後高）
        moves: [{ id: 'jiao', x: 230, y: 50, tex: 'st_jiao4_pause', ms: 900 }],
        sfx: { text: '頓！', at: 'jiao', color: 0xffd76a },
      },
      // 轎轉向左下方的小路（換「轉進小路」的轎 st_jiao4_turn）
      { who: 'narrator', text: '轎班不需開口，轎子一股力量引著眾人轉向。往海邊的小路去了', src: 10, moves: [{ id: 'jiao', x: 140, y: 95, tex: 'st_jiao4_turn', hop: true, ms: 1500 }] },
      // 前哨煞住，折回來（轎已經轉進小路，換回扛著走的轎）
      { at: 'qianshao', who: 'qianshao', text: '……海邊？那邊沒有路燈欸。', src: 11, moves: [{ id: 'qianshao', x: 200, ms: 500 }, { id: 'jiao', tex: 'st_jiao4_carry', ms: 400 }] },
      { at: 'xd0', who: 'xiangdengbo', text: '今年走海線啦！跟好跟好！', src: 12, cam: { x: 360, y: -80, zoom: 1, ms: 700 } },
      // 阿滿姨在隊伍中段，一手扶膝蓋
      { at: 'aman', who: 'aman', text: '我就知道會彎這裡。', src: 13, cam: { x: 520, y: -80, zoom: 1.1, ms: 700 } },
      { at: 'yawei', who: 'yawei', text: '領隊，後面我來顧。每一個人的名字我都會記。', src: 14 },
      // 鏡頭拉遠，一小串燈沿著海邊走
      {
        who: 'narrator', text: '隊伍離開白砂墩。這時候還很短，從頭旗到隊尾，喊一聲就聽得到。', src: 15,
        cam: { x: 360, y: -100, zoom: 1, ms: 1600 },
        moves: [
          { id: 'jiao', x: -240, hop: true, ms: 3000 },
          { id: 'qianshao', x: -160, hop: true, ms: 2600 },
          { id: 'xd0', x: -120, hop: true, ms: 3200 },
          { id: 'xd1', x: -60, hop: true, ms: 3400 },
          { id: 'aman', x: 300, ms: 3000 },
        ],
      },
    ],
  },
  // 3-7 臨時轉進：賢仔車行（傍晚，省道邊一整排鐵皮屋；轎走過車行、倒退、進退三次、衝進去落地）
  zhuanjin4: {
    id: 'zhuanjin4',
    place: '省道・賢仔車行',
    mood: 'dawn',
    sky: [0x2a2a4a, 0xd88a5a],
    far: 'seaFar',
    ground: 0x4a4048,
    fore: 'none',
    actors: [
      { id: 'jiao', tex: 'st_jiao4_carry', x: 640, y: 20, scale: 0.5, flip: true },
      { id: 'qianshao', tex: 'folk1', x: 110, y: 70, scale: 1.5 },
      { id: 'yawei', tex: 'folk2', x: 660, y: 80, scale: 1.5 },
      { id: 'arui', tex: 'folk1', x: 560, y: 95, scale: 1.4, tint: 0xffe0b0 },
      { id: 'xianzai', tex: 'folk2', x: -140, y: 50, scale: 1.5, tint: 0xd8e0ff },
      { id: 'xd0', tex: 'st_xiangdeng_e', x: 470, y: 120, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_f', x: 300, y: 125, scale: 0.3 },
    ],
    beats: [
      { at: 'qianshao', who: 'qianshao', text: '前面兩公里有一間廟，我看轎子今晚就駐那裡。', src: 0, cam: { x: 360, y: -100, zoom: 1, ms: 800 } },
      // 轎往左走過車行，停，倒退回車行門口
      { who: 'narrator', text: '轎子走過一間車行，停住。往後退了三步。', src: 1, moves: [{ id: 'jiao', x: 230, hop: true, ms: 1600 }] },
      // 轎前進、後退三輪，香燈腳迅速讓出一大圈
      {
        who: 'narrator', text: '轎子在車行門口進了三次、退了三次。鐵門只拉到一半。', src: 2,
        cam: { x: 330, y: -90, zoom: 1.1, ms: 700 },
        // 第 3 輪：在車行門口頓住的轎（st_jiao4_pause）
        moves: [{ id: 'jiao', x: 330, tex: 'st_jiao4_pause', hop: true, ms: 700 }],
        sfx: { text: '進！退！', at: 'jiao', color: 0xffd76a },
      },
      { at: 'jiao', who: 'jiaoban4', text: '讓路！讓路！', src: 3, moves: [{ id: 'xd0', x: 560, ms: 500 }, { id: 'xd1', x: 160, ms: 500 }] },
      // 賢仔拿著扳手衝出來，把鐵門整個推上去；轎身轉向門口（st_jiao4_turn），下一拍衝進去落地
      {
        at: 'xianzai', who: 'xianzai', text: '欸欸欸，裡面還有車沒修好啦——好啦好啦，進來進來。', src: 4,
        moves: [{ id: 'xianzai', x: 200, hop: true, ms: 700 }, { id: 'jiao', tex: 'st_jiao4_turn', ms: 600 }],
      },
      // 轎衝進門內，換落地的轎
      {
        who: 'narrator', text: '轎子衝進車行，在升降機旁邊落了地。', src: 5,
        moves: [{ id: 'jiao', x: 360, y: 30, tex: 'st_jiao4', ms: 800 }],
        sfx: { text: '咚。', at: 'jiao' },
      },
      { at: 'xd0', who: 'xiangdeng', text: '駐駕了！今晚駐這裡！', src: 6, cam: { x: 360, y: -90, zoom: 1, ms: 600 } },
      { at: 'arui', who: 'arui', text: '聊天室整個炸掉了。大家都在問，轎子為什麼停修車的？', src: 7 },
      { at: 'qianshao', who: 'qianshao', text: '這間?怎麼會停在修車行。隔壁不就有一座廟嗎？', src: 8, moves: [{ id: 'qianshao', x: 160, hop: true, ms: 400 }] },
      { at: 'yawei', who: 'yawei', text: '跟上。', src: 9 },
    ],
  },
  // ---------- 第二天（台詞照 ch4/story.ts 的 src；換字只改 story.ts 與這裡的 text，走位不用動） ----------
  // 第二天・入廟三進三退（ch4-text-day2.md 第 8 節；北津朝聖宮廟埕，傍晚）。
  // 廟門在畫面中間偏左（播放器把廟放在 W/2+60），轎從右邊往左衝向廟門、退回右邊，三次；第三退退到巷口（畫面右邊），最後衝進廟門淡出。
  // 轎只用 st_jiao4_carry（衝）／st_jiao4_pause（退、頓），往左走所以 flip。媽祖沒有立繪，畫面只有轎。
  // 有條件的句子（阿滿姨那句／外圈那句、秀枝稟報過的四句）不成立時，StoryScene 會跳過那一拍：那幾拍不放轎的走位。
  jinmiao4: {
    id: 'jinmiao4',
    place: '北津朝聖宮・入廟',
    mood: 'temple',
    sky: [0x2a1a2a, 0xc8784a],
    far: 'seaFar',
    temple: 'temple_chaosheng',
    ground: 0x2a2632,
    fore: 'temple',
    actors: [
      { id: 'jiao', tex: 'st_jiao4_carry', x: 620, y: 30, scale: 0.5, flip: true },
      { id: 'touqi', tex: 'st_touqi', x: 500, y: 20, scale: 0.4 },
      { id: 'xiangdan', tex: 'st_xiangdan', x: 690, y: 40, scale: 0.4 },
      { id: 'qianshao', tex: 'folk1', x: 40, y: 70, scale: 1.5 },
      { id: 'yawei', tex: 'folk2', x: 700, y: 90, scale: 1.5 },
      { id: 'arui', tex: 'folk1', x: 130, y: 95, scale: 1.4, tint: 0xffe0b0 },
      { id: 'aman', tex: 'folk3', x: 240, y: 110, scale: 1.3 },
      { id: 'xiuzhi', tex: 'folk4', x: 660, y: 135, scale: 1.3 },
      { id: 'xd0', tex: 'st_xiangdeng_a', x: 540, y: 120, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_c', x: 600, y: 125, scale: 0.3 },
      { id: 'xd2', tex: 'st_xiangdeng_d', x: 330, y: 130, scale: 0.3 },
      { id: 'xd3', tex: 'st_xiangdeng_b', x: 430, y: 135, scale: 0.3 },
    ],
    beats: [
      // 頭旗舉起，香燈腳小人全部起身
      {
        who: 'narrator', text: '人到齊了。頭旗手把旗舉起來，整條街坐著的人都站起來。', src: 0, cam: { x: 420, y: -100, zoom: 1, ms: 1500 },
        moves: [{ id: 'touqi', y: 10, hop: true, ms: 500 }, { id: 'xd0', y: 112, hop: true, ms: 400 }, { id: 'xd2', y: 122, hop: true, ms: 400 }, { id: 'xd3', y: 127, hop: true, ms: 400 }],
      },
      { at: 'touqi', who: 'touqi', text: '起馬。進廟。', src: 1 },
      // 轎換扛轎圖，往左走；人群向上下兩邊分開（頭旗、香擔讓到下面）
      {
        who: 'narrator', text: '轎子從派出所前起來，往朝聖宮去。廟埕中間的人往兩邊退，空出一條路。', src: 2,
        moves: [
          { id: 'jiao', x: 590, hop: true, ms: 1200 },
          { id: 'touqi', x: 330, y: 85, hop: true, ms: 1000 }, { id: 'xiangdan', x: 380, y: 100, hop: true, ms: 1200 },
          { id: 'xd0', y: 150, ms: 800 }, { id: 'xd3', y: 155, ms: 800 },
        ],
      },
      { at: 'arui', who: 'arui', text: '各位，要進了。我手在抖，畫面晃不要罵我。', src: 3 },
      // 第一進：衝到廟門前，急停
      { who: 'narrator', text: '轎子衝到廟門前，停住，往後退。', src: 4, cam: { x: 440, y: -100, zoom: 1.08, ms: 600 }, moves: [{ id: 'jiao', x: 470, tex: 'st_jiao4_carry', hop: true, ms: 800 }] },
      // 第一退：倒退回畫面中間（頓住的轎）
      { at: 'xd0', who: 'zhongren', text: '進喔！', src: 5, moves: [{ id: 'jiao', x: 580, tex: 'st_jiao4_pause', ms: 900 }], sfx: { text: '進喔！', at: 'jiao', color: 0xffd76a } },
      // 第二進：衝得更前面（轎頂進了門簷的影子）
      { who: 'narrator', text: '第二次轎子衝得更前面，轎頂的粉紅布都到門簷底下了，結果又退回來。', src: 6, fx: 'shake', moves: [{ id: 'jiao', x: 450, tex: 'st_jiao4_carry', hop: true, ms: 800 }] },
      // 第二退
      { at: 'xd3', who: 'zhongren', text: '進喔！進喔！', src: 7, moves: [{ id: 'jiao', x: 590, tex: 'st_jiao4_pause', ms: 900 }], sfx: { text: '進喔！進喔！', at: 'jiao', color: 0xffd76a } },
      // 阿滿姨在第三排（有條件：趕上入廟才播；沒趕上換下一拍外圈那句）
      { who: 'narrator', text: '阿滿姨擠在第三排，一手抓著網袋裡那支小旗，喊得比誰都大聲。', src: 8, cam: { x: 280, y: -100, zoom: 1.12, ms: 600 } },
      { who: 'narrator', text: '廟埕最外面那一圈，有人踮著腳一起喊。', src: 9, cam: { x: 360, y: -100, zoom: 1, ms: 600 } },
      { at: 'qianshao', who: 'qianshao', text: '領隊，我也想喊。我喊了他們聽不到，可以喊嗎？', src: 10, cam: { x: 360, y: -100, zoom: 1, ms: 600 } },
      // 第三進
      { at: 'yawei', who: 'yawei', text: '喊。', src: 11, moves: [{ id: 'jiao', x: 470, tex: 'st_jiao4_carry', hop: true, ms: 800 }] },
      // 第三退：退到畫面右邊，停一拍
      { who: 'narrator', text: '第三次，轎子退得很遠，停了一下。整個廟埕的人吸了一口氣。', src: 12, cam: { x: 520, y: -100, zoom: 1.05, ms: 900 }, moves: [{ id: 'jiao', x: 650, tex: 'st_jiao4_pause', ms: 1400 }] },
      // 秀枝稟報過才有的四句（有條件；不放轎的走位）
      { who: 'narrator', text: '轎子又往後退，一直退到巷口。', src: 13, cam: { x: 600, y: -100, zoom: 1.12, ms: 700 } },
      { who: 'narrator', text: '轎子在秀枝她阿母的輪椅前面三步的地方頓了一下，才往前衝。', src: 14, sfx: { text: '頓！', at: 'jiao', color: 0xffd76a } },
      { at: 'xiuzhi', who: 'xiuzhi', text: '阿母，妳有沒有看到？轎子就在我們前面。阿母。', src: 15 },
      { who: 'narrator', text: '大家都說，今年第三退退得特別遠。', src: 16, cam: { x: 420, y: -100, zoom: 1, ms: 700 } },
      { at: 'xd0', who: 'zhongren', text: '進喔！', src: 17, cam: { x: 420, y: -100, zoom: 1, ms: 500 }, sfx: { text: '進喔！', at: 'jiao', color: 0xffd76a } },
      // 轎衝進廟門消失；頭旗、香擔跟在後面進去
      {
        who: 'narrator', text: '轎子直直衝進廟門。鞭炮和鼓一起響，裡面外面都在拍手。', src: 18, fx: 'firecracker',
        moves: [
          { id: 'jiao', x: 420, y: 10, tex: 'st_jiao4_carry', alpha: 0, hop: true, ms: 1400 },
          { id: 'touqi', x: 410, y: 10, alpha: 0, hop: true, ms: 1700 }, { id: 'xiangdan', x: 430, y: 15, alpha: 0, hop: true, ms: 2000 },
        ],
        sfx: { text: '劈哩啪啦！', at: 'xd2' },
      },
      { who: 'narrator', text: '有人在哭，有人抱在一起跳。阿睿忘了看螢幕。', src: 19, cam: { x: 200, y: -100, zoom: 1.08, ms: 700 } },
      { at: 'yawei', who: 'yawei', text: '到了。', src: 20, cam: { x: 420, y: -100, zoom: 1, ms: 700 } },
    ],
  },
  // ---------- 第 B2 輪（台詞照 _agent/ch4-text-day3.md，走位照（演出：……）） ----------
  // 6 第三天・渾水溪大橋橋頭（傍晚）：香擔、頭旗、轎從左往右走；香擔停在橋頭前一步、轎在橋頭頓三下（上下跳＋「頓！」），
  // 第三下轎身轉向右下，下堤防的斜坡走進芒草（只露轎頂）；香擔、頭旗跟著轉下去走到轎前面；香燈腳一串一串轉下斜坡。
  // 回程：轎全程布幔放下 st_jiao4_carry_closed（不換頓住／轉彎圖：那兩張是布幔拉開的）。往右走，圖本來就朝右，不 flip。
  qiaotou4: {
    id: 'qiaotou4',
    place: '渾水溪大橋・橋頭',
    mood: 'dawn',
    sky: [0x2a2a4a, 0xd88a5a],
    far: 'seaFar',
    ground: 0x4a4048,
    fore: 'none',
    actors: [
      { id: 'jiao', tex: 'st_jiao4_carry_closed', x: 120, y: 20, scale: 0.5 },
      { id: 'xiangdan', tex: 'st_xiangdan', x: 300, y: 30, scale: 0.4 },
      { id: 'touqi', tex: 'st_touqi', x: 250, y: 25, scale: 0.4 },
      { id: 'qianshao', tex: 'folk1', x: 60, y: 80, scale: 1.4 },
      { id: 'yawei', tex: 'folk2', x: 30, y: 95, scale: 1.4 },
      { id: 'arui', tex: 'folk1', x: 400, y: 100, scale: 1.3, tint: 0xffe0b0 },
      { id: 'yijing', tex: 'folk2', x: 640, y: 40, scale: 1.4, tint: 0xd8f0ff },
      { id: 'xd0', tex: 'st_xiangdeng_e', x: 170, y: 120, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_a', x: 90, y: 130, scale: 0.3 },
      { id: 'xd2', tex: 'st_xiangdeng_c', x: 10, y: 125, scale: 0.3 },
    ],
    beats: [
      // 香擔、頭旗、轎從左往右走
      {
        who: 'narrator', text: '傍晚。隊伍沿著堤防走到底，前面就是橋頭。橋上封了一線車道，兩邊的欄杆趴滿了人。', src: 0, cam: { x: 360, y: -100, zoom: 1, ms: 1200 },
        moves: [{ id: 'xiangdan', x: 460, hop: true, ms: 2000 }, { id: 'touqi', x: 410, hop: true, ms: 2000 }, { id: 'jiao', x: 300, hop: true, ms: 2200 }],
      },
      { at: 'yijing', who: 'yijing4', text: '來了來了！橋上的往兩邊靠，中間空出來！', src: 1 },
      { at: 'arui', who: 'arui', text: '各位，要上橋了。橋很長，我先說，等一下我會喘。', src: 2 },
      // 香擔停在橋頭前一步；頭旗手回頭看轎子
      { who: 'narrator', text: '香擔到了橋頭，停住。挑擔的人沒有踩上橋面。', src: 3, moves: [{ id: 'xiangdan', x: 520, ms: 800 }, { id: 'touqi', x: 470, flip: true, ms: 800 }] },
      // 頓三下（很輕的 shake；橋上的人聲小下去）
      { who: 'narrator', text: '轎子跟上來，在橋頭頓了一下。', src: 4, fx: 'shake', cam: { x: 400, y: -90, zoom: 1.1, ms: 600 }, moves: [{ id: 'jiao', x: 400, y: 30, hop: true, ms: 900 }], sfx: { text: '頓！', at: 'jiao', color: 0xffd76a } },
      { who: 'narrator', text: '又頓了一下。橋上沒有人講話了。', src: 5, moves: [{ id: 'jiao', y: 20, hop: true, ms: 500 }], sfx: { text: '頓！', at: 'jiao', color: 0xffd76a } },
      { who: 'narrator', text: '轎子頓了第三下。轎班的肩膀跟著轎槓往右轉。', src: 6, moves: [{ id: 'jiao', y: 30, hop: true, ms: 700 }], sfx: { text: '頓！', at: 'jiao', color: 0xffd76a } },
      // 轎往右下走進芒草（y 變大＝往畫面下方）；香擔、頭旗跟著轉下去，走到轎的前面
      {
        who: 'narrator', text: '轎子離開橋頭，下了堤防的斜坡。芒草比人高，粉紅色的轎頂在草上面一晃一晃，往溪邊去。', src: 7, cam: { x: 420, y: -80, zoom: 1, ms: 900 },
        moves: [
          { id: 'jiao', x: 560, y: 140, hop: true, ms: 2600 },
          { id: 'xiangdan', x: 660, y: 150, hop: true, ms: 2400 }, { id: 'touqi', x: 620, y: 145, flip: false, hop: true, ms: 2400 },
        ],
      },
      { at: 'xd0', who: 'xiangdeng', text: '下去了！不走橋！轎子要過溪！', src: 8 },
      { at: 'yijing', who: 'yijing4', text: '蛤？下面是水欸。……橋上的不要動！不要用跳的！走斜坡下去，一個一個來！', src: 9 },
      { at: 'qianshao', who: 'qianshao', text: '橋明明就在旁邊欸。燈都點好了，路也封好了，轎子怎麼不走橋？', src: 10, moves: [{ id: 'qianshao', x: 200, hop: true, ms: 500 }] },
      // 香燈腳小人一串一串從橋頭轉下斜坡；押尾走最後面。鏡頭拉遠
      {
        at: 'yawei', who: 'yawei', text: '跟上。隊尾下來要很久，我走最後面。', src: 11, cam: { x: 360, y: -100, zoom: 1, ms: 1600 },
        moves: [
          { id: 'xd0', x: 420, y: 150, hop: true, ms: 2200 }, { id: 'xd1', x: 340, y: 150, hop: true, ms: 2600 }, { id: 'xd2', x: 260, y: 150, hop: true, ms: 3000 },
          { id: 'yawei', x: 120, hop: true, ms: 1600 },
        ],
      },
    ],
  },
  // 8 回宮：前半在通汐的防風林邊換轎（四人小轎從右邊進來、布圍起來，布放下以後是八人大轎 st_jiao8_carry，布幔還是放下的），
  // 後半在拱辰宮廟埕（廟門在畫面左邊；頭旗、香擔先往左衝進廟門，大轎最後）。後面有條件的那幾拍（新娘放下、其他版本）不放轎的走位
  huigong4: {
    id: 'huigong4',
    place: '通汐 → 白砂墩拱辰宮・回宮',
    mood: 'temple',
    sky: [0x2a2a4a, 0xd88a5a],
    far: 'seaFar',
    temple: 'temple_gongchen',
    ground: 0x2a2632,
    fore: 'temple',
    actors: [
      { id: 'jiao4', tex: 'st_jiao4_carry_closed', x: 780, y: 30, scale: 0.5, flip: true },
      { id: 'jiao8', tex: 'st_jiao8_carry', x: 560, y: 30, scale: 0.5, flip: true, alpha: 0 },
      { id: 'touqi', tex: 'st_touqi', x: 470, y: 30, scale: 0.4 },
      { id: 'xiangdan', tex: 'st_xiangdan', x: 520, y: 40, scale: 0.4 },
      { id: 'qianshao', tex: 'folk1', x: 120, y: 75, scale: 1.4 },
      { id: 'yawei', tex: 'folk2', x: 670, y: 90, scale: 1.4 },
      { id: 'cunbo', tex: 'folk2', x: 220, y: 100, scale: 1.4, tint: 0xffe8c8 },
      { id: 'aman', tex: 'folk3', x: 300, y: 110, scale: 1.3 },
      { id: 'xinniang', tex: 'folk5', x: 250, y: 110, scale: 1.3, tint: 0x9ad0ff, alpha: 0.75 },
      { id: 'apo', tex: 'folk3', x: 600, y: 120, scale: 1.3, tint: 0x9ad0ff, alpha: 0.75 },
      { id: 'xd0', tex: 'st_xiangdeng_c', x: 110, y: 125, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_d', x: 400, y: 130, scale: 0.3 },
    ],
    // 人鏈越長，路邊、廟埕後排的人越多、手機的燈越多（只是畫面）
    // 第 C3 輪：做了的事再多站幾個人（rewardCrowd4）
    crowd: crowd4('huigong4'),
    beats: [
      // 四人小轎從右邊進來，停在大轎旁邊
      { who: 'narrator', text: '三月初九下午，隊伍回到通汐。八人大轎已經在防風林邊等了。', src: 0, cam: { x: 420, y: -100, zoom: 1, ms: 1500 }, moves: [{ id: 'jiao4', x: 640, hop: true, ms: 2000 }, { id: 'jiao8', alpha: 1, ms: 800 }] },
      // 布圍起來：小轎淡出，只看得到大轎
      { who: 'narrator', text: '換轎的時候，四周拉起布圍著。外面的人都把頭低下去。', src: 1, moves: [{ id: 'jiao4', alpha: 0, ms: 1400 }, { id: 'jiao8', x: 600, ms: 1400 }] },
      { at: 'qianshao', who: 'qianshao', text: '換大頂的了，要八個人扛。那走了三天的那一頂轎子呢？', src: 2 },
      { at: 'yawei', who: 'yawei', text: '那一頂先收起來，明年進香還是抬它。', src: 3 },
      // 鏡頭往左搖，路邊一桌接一桌
      { who: 'narrator', text: '從通汐到白砂墩，路兩邊擺滿了飯擔。家家戶戶把桌子搬到門口，鍋蓋都掀著。', src: 4, cam: { x: 260, y: -90, zoom: 1.05, ms: 1400 }, moves: [{ id: 'xd0', x: 160, hop: true, ms: 900 }] },
      { at: 'cunbo', who: 'cunbo', text: '回來了回來了！吃飽才准進去！這鍋是你們的，那鍋是兵將的！', src: 5 },
      { at: 'qianshao', who: 'qianshao', text: '領隊，他說那鍋是我們的。那我可以先聞嗎？', src: 6, moves: [{ id: 'qianshao', x: 190, hop: true, ms: 400 }] },
      { who: 'narrator', text: '拱辰宮的廟埕空出一條路。頭旗手站定，旗桿握在胸前。', src: 7, cam: { x: 420, y: -100, zoom: 1, ms: 900 } },
      { at: 'touqi', who: 'touqi', text: '頭旗、香擔，先進！', src: 8, moves: [{ id: 'touqi', y: 20, hop: true, ms: 400 }] },
      // 頭旗、香擔先後往左衝進廟門（淡出）
      {
        who: 'narrator', text: '頭旗衝進廟門。香擔跟在後面，封條還貼著，跨過門檻的時候，挑擔的人把腳抬得很高。', src: 9, fx: 'firecracker',
        moves: [{ id: 'touqi', x: 410, y: 0, alpha: 0, hop: true, ms: 1400 }, { id: 'xiangdan', x: 420, y: 10, alpha: 0, hop: true, ms: 1900 }],
        sfx: { text: '劈哩啪啦！', at: 'xd1' },
      },
      { at: 'xd0', who: 'zhongren', text: '進喔！進喔！進喔！', src: 10, sfx: { text: '進喔！', at: 'jiao8', color: 0xffd76a } },
      // 大轎衝進廟門
      { who: 'narrator', text: '大轎三進三退，進了廟門。鞭炮從廟口炸到海堤，跟出門那一晚一樣。', src: 11, fx: 'firecracker', moves: [{ id: 'jiao8', x: 420, y: 10, alpha: 0, hop: true, ms: 2400 }], sfx: { text: '劈哩啪啦！', at: 'xd1' } },
      { at: 'yawei', who: 'yawei', text: '出門的時候是兩百一十七個人。回來的我記到六萬多，後面還在進來。領隊，我們到了。', src: 12 },
      // 有條件的幾拍（阿滿姨第三天沒辦）
      { who: 'narrator', text: '阿滿姨是自己走橋回來的，到廟埕的時候鞭炮還有零星幾聲。她在廟門口合掌，把那支小旗插正。', src: 13, cam: { x: 300, y: -100, zoom: 1.1, ms: 700 } },
      // 新娘放下（判帶回白砂墩）：新娘小人淡出，石階邊留一雙鞋（鞋沒有圖，只淡出）
      { who: 'narrator', text: '阿滿姨走進廟埕，在石階前站住。她把網袋從左肩卸下來，朝左邊講了一句。', src: 14, cam: { x: 280, y: -100, zoom: 1.15, ms: 700 } },
      { at: 'aman', who: 'aman', text: '到了。', src: 15 },
      { who: 'narrator', text: '她每年走到這裡，都對著左邊講這一句。', src: 16 },
      { at: 'xinniang', who: 'xinniang', text: '到了。阿母，回來這一半我有陪妳走完。', src: 17 },
      { who: 'narrator', text: '新娘蹲下去，把那雙布鞋脫了，併好，放在石階旁邊。鞋尖朝廟門。', src: 18, moves: [{ id: 'xinniang', alpha: 0, ms: 1600 }] },
      { at: 'aman', who: 'aman', text: '奇怪，今年走回來，腳怎麼沒有像往年那麼痠。', src: 19 },
      { who: 'narrator', text: '新娘放下了。旗下空出 1 格。', src: 20 },
      // 其他版本（短）
      { who: 'narrator', text: '阿滿姨走進廟埕，在石階前站住，把那支小旗插正，講了一句「到了」。', src: 21, cam: { x: 280, y: -100, zoom: 1.15, ms: 700 } },
      { who: 'narrator', text: '草鞋丁跟到廟門口。他在門檻外面跪下去，磕了三個頭。他說去北津的路他認得了，明年他自己走一趟。', src: 22, cam: { x: 400, y: -100, zoom: 1, ms: 700 } },
      { at: 'apo', who: 'apo', text: '這裡不是我家。……你們吃飽沒有？沒有的話我在這邊煮也可以。', src: 23 },
      { who: 'narrator', text: '假香燈腳站在廟埕邊，看那個揹紅背包的男人進廟。這次他沒有跟進去。', src: 24 },
    ],
  },
  // 9 開爐（第 12 天）：鏡頭在神龕的位置往外看——整段不拍神龕、不拍神像、沒有轎，畫面上是殿裡一排一排抬頭的臉。
  // 布幔只用「鏡頭往上抬、光照到臉上」表現（不用 flash）。阿滿姨前排左、阿翰中間、賢仔在門邊、秀枝和輪椅在右邊柱子旁、阿睿在最後面；
  // 前哨、押尾在殿門外。三位信徒各一小句、最後兩句是有條件的拍子（沒趕上回宮的、斬與遺憾的版本會跳過）
  kailu4: {
    id: 'kailu4',
    place: '白砂墩拱辰宮・開爐',
    mood: 'dawn',
    sky: [0x3a2a1a, 0xd8a86a],
    far: 'seaFar',
    ground: 0x3a2e28,
    fore: 'none',
    actors: [
      { id: 'aman', tex: 'folk3', x: 120, y: 70, scale: 1.5 },
      { id: 'ahan', tex: 'folk1', x: 300, y: 60, scale: 1.5 },
      { id: 'xianzai', tex: 'folk2', x: 640, y: 50, scale: 1.4, tint: 0xd8e0ff },
      { id: 'xiuzhi', tex: 'folk4', x: 500, y: 65, scale: 1.5 },
      { id: 'amu', tex: 'folk3', x: 550, y: 75, scale: 1.2, tint: 0xe8d8c8 },
      { id: 'arui', tex: 'folk1', x: 380, y: 20, scale: 1.2, tint: 0xffe0b0 },
      { id: 'cunbo', tex: 'folk2', x: 200, y: 110, scale: 1.3, tint: 0xffe8c8 },
      { id: 'qianshao', tex: 'folk1', x: 690, y: 110, scale: 1.3 },
      { id: 'yawei', tex: 'folk2', x: 40, y: 115, scale: 1.3 },
      { id: 'xd0', tex: 'st_xiangdeng_f', x: 230, y: 30, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_b', x: 440, y: 35, scale: 0.3 },
    ],
    // 人鏈越長，殿裡後排抬頭的人越多、燭火越多（只是畫面）
    // 第 C3 輪：做了的事再多站幾個人（rewardCrowd4）
    crowd: crowd4('kailu4'),
    beats: [
      { who: 'narrator', text: '三月二十，回宮第十二天。拱辰宮的殿裡站滿了人，都在等開爐。', src: 0, cam: { x: 360, y: -60, zoom: 1, ms: 1500 } },
      // 上緣的布往兩邊拉開，一道光由上往下照在人臉上：鏡頭往上抬到臉的高度（畫面裡沒有神龕）
      { who: 'narrator', text: '時辰到。神龕的布幔往兩邊拉開。', src: 1, cam: { x: 360, y: -150, zoom: 1.1, ms: 1600 } },
      { who: 'narrator', text: '殿裡的人一起抬頭。沒有人講話。', src: 2 },
      { who: 'narrator', text: '阿滿姨抬著頭，嘴巴動了動。', src: 3, cam: { x: 140, y: -140, zoom: 1.3, ms: 700 } },
      { who: 'narrator', text: '阿翰把帽子拿在手上。', src: 4, cam: { x: 300, y: -140, zoom: 1.3, ms: 700 } },
      { who: 'narrator', text: '賢仔站在門邊，褲子後面的口袋還插著那支扳手。', src: 5, cam: { x: 620, y: -140, zoom: 1.3, ms: 700 } },
      { who: 'narrator', text: '秀枝把輪椅的椅背搖高。她阿母抬頭看了很久，手上的旗沒有放下來。', src: 6, cam: { x: 520, y: -140, zoom: 1.3, ms: 700 } },
      { who: 'narrator', text: '阿睿站在最後面。他的手機在口袋裡，今天沒有拿出來。', src: 7, cam: { x: 380, y: -150, zoom: 1.2, ms: 700 } },
      // 畫面下方一點火光，從右移到左（火光沒有圖：只拉遠鏡頭）
      { who: 'narrator', text: '香擔的封條撕開了。從北津帶回來的火，一勺一勺添進殿裡的香爐。', src: 8, cam: { x: 360, y: -100, zoom: 1, ms: 1200 } },
      { at: 'qianshao', who: 'qianshao', text: '火一路顧回來，真的都沒有熄欸。', src: 9 },
      { at: 'yawei', who: 'yawei', text: '挑擔的那幾個，這幾天沒有好好睡。', src: 10 },
      { at: 'cunbo', who: 'cunbo', text: '湯圓好了！紅的白的都有，自己舀，吃了才圓滿！', src: 11 },
      // 阿滿姨把一碗湯圓放在廟埕的石階上
      { at: 'aman', who: 'aman', text: '我多煮了一碗湯圓，放在石階那邊喔。', src: 12, moves: [{ id: 'aman', x: 160, y: 100, hop: true, ms: 800 }] },
      { at: 'qianshao', who: 'qianshao', text: '領隊，供桌上那一排湯圓是我們的。我數過了，我們有幾個就擺幾碗。', src: 13 },
      { at: 'yawei', who: 'yawei', text: '供桌上多了一碗。', src: 14 },
      { at: 'qianshao', who: 'qianshao', text: '多的那碗是要給誰的？……喔，溪邊那個撐船的。', src: 15 },
      { at: 'yawei', who: 'yawei', text: '供桌上的湯圓剛好，沒有多。', src: 16 },
    ],
  },
};
