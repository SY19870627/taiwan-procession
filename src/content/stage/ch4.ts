// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章（白砂墩・媽祖徒步進香）的演出腳本：qijia4（拱辰宮起駕）、zhuanjin4（臨時轉進賢仔車行）。
 * 台詞照抄 content/ch4/story.ts（src 標第幾句）；走位照 _agent/ch4-text-day1.md 的（演出：……），沒有補寫的拍子。
 *
 * 媽祖全章不露臉：畫面上只有轎子（四人小轎 st_jiao4_carry，落地換 st_jiao4），沒有旨意、沒有神明說話。
 * 前哨、押尾、阿睿、阿滿姨、賢仔的立繪還沒到，先用程式畫的小人（folk*）放大；頭旗手、香燈腳用 art/baishadun.ts 的暫代。
 * 轎、頭旗、香擔只是畫面（過場本來就不能點）。
 */
import type { StageScript } from './types';

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
      { id: 'jiao', tex: 'st_jiao4_carry', x: 360, y: 0, scale: 0.42 },
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
      { who: 'narrator', text: '白砂墩拱辰宮，將近子時。廟埕的燈全開，海風很大。', src: 0, cam: { x: 360, y: -110, zoom: 1, ms: 2200 } },
      // 阿睿從右邊倒退走進來，自拍棒舉高
      { at: 'arui', who: 'arui', text: '跟轎台開播！現在線上三百一十二人，大家晚安！', src: 1, moves: [{ id: 'arui', x: 600, ms: 1400 }] },
      { at: 'qianshao', who: 'qianshao', text: '領隊，那個拿棍子的在跟誰講話？', src: 2, cam: { x: 300, y: -90, zoom: 1.08, ms: 700 } },
      { at: 'yawei', who: 'yawei', text: '手機。他叫阿睿。', src: 3 },
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
        who: 'narrator', text: '轎子到了廟前第一個路口，停住。前後擺了兩下，頓了一頓。', src: 9,
        cam: { x: 260, y: -80, zoom: 1.12, ms: 800 },
        moves: [{ id: 'jiao', x: 230, y: 50, ms: 900 }],
        sfx: { text: '頓！', at: 'jiao', color: 0xffd76a },
      },
      // 轎轉向左下方的小路
      { who: 'narrator', text: '轎班沒有人開口，肩膀跟著轎槓轉。轎子往海邊的小路去了。', src: 10, moves: [{ id: 'jiao', x: 140, y: 95, hop: true, ms: 1500 }] },
      // 前哨煞住，折回來
      { at: 'qianshao', who: 'qianshao', text: '……海邊？那邊沒有路燈欸。', src: 11, moves: [{ id: 'qianshao', x: 200, ms: 500 }] },
      { at: 'xd0', who: 'xiangdengbo', text: '今年走海線啦！跟好跟好！', src: 12, cam: { x: 360, y: -80, zoom: 1, ms: 700 } },
      // 阿滿姨在隊伍中段，一手扶膝蓋
      { at: 'aman', who: 'aman', text: '我就知道會彎這裡。', src: 13, cam: { x: 520, y: -80, zoom: 1.1, ms: 700 } },
      { at: 'yawei', who: 'yawei', text: '領隊，後面我顧。一個一個我都記。', src: 14 },
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
      { id: 'jiao', tex: 'st_jiao4_carry', x: 640, y: 20, scale: 0.42 },
      { id: 'qianshao', tex: 'folk1', x: 110, y: 70, scale: 1.5 },
      { id: 'yawei', tex: 'folk2', x: 660, y: 80, scale: 1.5 },
      { id: 'arui', tex: 'folk1', x: 560, y: 95, scale: 1.4, tint: 0xffe0b0 },
      { id: 'xianzai', tex: 'folk2', x: -140, y: 50, scale: 1.5, tint: 0xd8e0ff },
      { id: 'xd0', tex: 'st_xiangdeng_e', x: 470, y: 120, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_f', x: 300, y: 125, scale: 0.3 },
    ],
    beats: [
      { at: 'qianshao', who: 'qianshao', text: '前面兩公里有一間廟，我看今晚就駐那裡。', src: 0, cam: { x: 360, y: -100, zoom: 1, ms: 800 } },
      // 轎往左走過車行，停，倒退回車行門口
      { who: 'narrator', text: '轎子走過一間車行，停住。往後退了三步。', src: 1, moves: [{ id: 'jiao', x: 230, hop: true, ms: 1600 }] },
      // 轎前進、後退三輪，香燈腳迅速讓出一大圈
      {
        who: 'narrator', text: '轎子在車行門口進了三次、退了三次。鐵門只拉到一半。', src: 2,
        cam: { x: 330, y: -90, zoom: 1.1, ms: 700 },
        moves: [{ id: 'jiao', x: 330, hop: true, ms: 700 }],
        sfx: { text: '進！退！', at: 'jiao', color: 0xffd76a },
      },
      { at: 'jiao', who: 'jiaoban4', text: '讓路！讓路！', src: 3, moves: [{ id: 'xd0', x: 560, ms: 500 }, { id: 'xd1', x: 160, ms: 500 }] },
      // 賢仔拿著扳手衝出來，把鐵門整個推上去
      { at: 'xianzai', who: 'xianzai', text: '欸欸欸，裡面還有車沒修好啦——好啦好啦，進來進來。', src: 4, moves: [{ id: 'xianzai', x: 200, hop: true, ms: 700 }] },
      // 轎衝進門內，換落地的轎
      {
        who: 'narrator', text: '轎子衝進車行，在升降機旁邊落了地。', src: 5,
        moves: [{ id: 'jiao', x: 360, y: 30, tex: 'st_jiao4', ms: 800 }],
        sfx: { text: '咚。', at: 'jiao' },
      },
      { at: 'xd0', who: 'xiangdeng', text: '駐駕了！今晚駐這裡！', src: 6, cam: { x: 360, y: -90, zoom: 1, ms: 600 } },
      { at: 'arui', who: 'arui', text: '聊天室整個炸掉。大家都在問，為什麼是修車的？', src: 7 },
      { at: 'qianshao', who: 'qianshao', text: '這間？這間是修車的欸。旁邊就有廟。', src: 8, moves: [{ id: 'qianshao', x: 160, hop: true, ms: 400 }] },
      { at: 'yawei', who: 'yawei', text: '跟。', src: 9 },
    ],
  },
};
