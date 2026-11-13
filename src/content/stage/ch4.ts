// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章（白砂墩・媽祖徒步進香）的演出腳本：qijia4（拱辰宮起駕）、zhuanjin4（臨時轉進賢仔車行）；
 * 第 B1 輪：jinmiao4（入廟三進三退，原 sanjin4；台詞照 _agent/ch4-text-day2.md 第 8 節）。
 * 第 A 輪（台詞還沒到，暫代）：qiaotou4（橋頭頓三下下堤防）、huigong4（回宮・八人大轎）、kailu4（開爐）。
 * 台詞照抄 content/ch4/story.ts（src 標第幾句）；走位照 _agent/ch4-text-day1.md 的（演出：……），沒有補寫的拍子。
 *
 * 媽祖全章不露臉：畫面上只有轎子（四人小轎 st_jiao4_carry，落地換 st_jiao4），沒有旨意、沒有神明說話。
 * 第 3 輪：轎在路口／車行門口頓住換 st_jiao4_pause、轉進小路／轉向車行門口換 st_jiao4_turn、走路換回 st_jiao4_carry、落地 st_jiao4。
 * 轎的圖都是朝右畫的，這兩段轎子往左走，所以 flip（倒退時仍面向左＝倒著退）。
 * 轎的設計尺寸 560×400（落地 400×400），scale 0.5 → 約 280×200（× 畫面倍率 k；第 3 輪從 0.42 調大：比頭旗手 480×0.4＝192 略高，和白天隊伍轎 0.36／頭旗 0.26 的比例相近）；正式圖同尺寸、底部置中，直接對齊。
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
        // 第 3 輪：換「路口頓住」的轎（st_jiao4_pause，前低後高）
        moves: [{ id: 'jiao', x: 230, y: 50, tex: 'st_jiao4_pause', ms: 900 }],
        sfx: { text: '頓！', at: 'jiao', color: 0xffd76a },
      },
      // 轎轉向左下方的小路（換「轉進小路」的轎 st_jiao4_turn）
      { who: 'narrator', text: '轎班沒有人開口，肩膀跟著轎槓轉。轎子往海邊的小路去了。', src: 10, moves: [{ id: 'jiao', x: 140, y: 95, tex: 'st_jiao4_turn', hop: true, ms: 1500 }] },
      // 前哨煞住，折回來（轎已經轉進小路，換回扛著走的轎）
      { at: 'qianshao', who: 'qianshao', text: '……海邊？那邊沒有路燈欸。', src: 11, moves: [{ id: 'qianshao', x: 200, ms: 500 }, { id: 'jiao', tex: 'st_jiao4_carry', ms: 400 }] },
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
      { id: 'jiao', tex: 'st_jiao4_carry', x: 640, y: 20, scale: 0.5, flip: true },
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
      { at: 'arui', who: 'arui', text: '聊天室整個炸掉。大家都在問，為什麼是修車的？', src: 7 },
      { at: 'qianshao', who: 'qianshao', text: '這間？這間是修車的欸。旁邊就有廟。', src: 8, moves: [{ id: 'qianshao', x: 160, hop: true, ms: 400 }] },
      { at: 'yawei', who: 'yawei', text: '跟。', src: 9 },
    ],
  },
  // ---------- 第 A 輪（台詞全部（待寫），照 ch4/story.ts 的 src；換字只改 story.ts 與這裡的 text，走位不用動） ----------
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
        who: 'narrator', text: '人到齊了。頭旗手把旗舉起來，整條街站起來。', src: 0, cam: { x: 420, y: -100, zoom: 1, ms: 1500 },
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
      { who: 'narrator', text: '第二次衝得更前面，轎頂的粉紅布都進了門簷的影子。又退。', src: 6, fx: 'shake', moves: [{ id: 'jiao', x: 450, tex: 'st_jiao4_carry', hop: true, ms: 800 }] },
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
      { who: 'narrator', text: '第三退，轎子退得比前兩次都遠，一直退到巷口。', src: 13, cam: { x: 600, y: -100, zoom: 1.12, ms: 700 } },
      { who: 'narrator', text: '轎子在輪椅前面三步的地方頓了一下，才往前衝。', src: 14, sfx: { text: '頓！', at: 'jiao', color: 0xffd76a } },
      { at: 'xiuzhi', who: 'xiuzhi', text: '阿母，妳有沒有看到？就在前面。阿母。', src: 15 },
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
  // 第三天・渾水溪橋頭（回程：轎全程布幔放下 st_jiao4_carry_closed，不換頓住／轉彎圖；頓三下用上下跳表現），之後下堤防
  qiaotou4: {
    id: 'qiaotou4',
    place: '渾水溪橋頭',
    mood: 'dawn',
    sky: [0x2a2a4a, 0xd88a5a],
    far: 'seaFar',
    ground: 0x4a4048,
    fore: 'none',
    actors: [
      { id: 'jiao', tex: 'st_jiao4_carry_closed', x: 540, y: 20, scale: 0.5, flip: true },
      { id: 'qianshao', tex: 'folk1', x: 120, y: 70, scale: 1.5 },
      { id: 'yawei', tex: 'folk2', x: 660, y: 80, scale: 1.5 },
      { id: 'xd0', tex: 'st_xiangdeng_e', x: 640, y: 120, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_a', x: 300, y: 125, scale: 0.3 },
    ],
    beats: [
      { who: 'narrator', text: '（待寫）渾水溪橋頭。橋上的車一台接一台，香燈腳排到看不到尾。', src: 0, cam: { x: 360, y: -100, zoom: 1, ms: 1200 } },
      { who: 'narrator', text: '（待寫）轎子在橋頭停住，頓了一下。', src: 1, moves: [{ id: 'jiao', x: 430, hop: true, ms: 900 }], sfx: { text: '頓！', at: 'jiao', color: 0xffd76a } },
      { who: 'narrator', text: '（待寫）又頓了一下。', src: 2, moves: [{ id: 'jiao', y: 30, hop: true, ms: 500 }], sfx: { text: '頓！', at: 'jiao', color: 0xffd76a } },
      { who: 'narrator', text: '（待寫）第三下。轎班的腳轉向堤防。', src: 3, cam: { x: 380, y: -90, zoom: 1.1, ms: 600 }, moves: [{ id: 'jiao', y: 20, hop: true, ms: 500 }], sfx: { text: '頓！', at: 'jiao', color: 0xffd76a } },
      { at: 'qianshao', who: 'qianshao', text: '（待寫）……不走橋？', src: 4, cam: { x: 300, y: -90, zoom: 1.05, ms: 600 }, moves: [{ id: 'qianshao', x: 170, hop: true, ms: 400 }] },
      // 下堤防：往左下走（y 變大＝往畫面下方）
      { who: 'narrator', text: '（待寫）轎子下了堤防，往溪邊去了。', src: 5, cam: { x: 360, y: -100, zoom: 1, ms: 800 }, moves: [{ id: 'jiao', x: 220, y: 110, hop: true, ms: 2200 }, { id: 'xd1', x: 160, y: 140, hop: true, ms: 2400 }] },
      { at: 'yawei', who: 'yawei', text: '（待寫）跟。', src: 6 },
    ],
  },
  // 回宮：通汐 → 白砂墩，換八人大轎（st_jiao8_carry，布幔放下）；頭旗、香擔先進廟
  huigong4: {
    id: 'huigong4',
    place: '白砂墩拱辰宮・回宮',
    mood: 'temple',
    sky: [0x2a2a4a, 0xd88a5a],
    far: 'seaFar',
    temple: 'temple_gongchen',
    ground: 0x2a2632,
    fore: 'temple',
    actors: [
      { id: 'jiao8', tex: 'st_jiao8_carry', x: 600, y: 30, scale: 0.5, flip: true },
      { id: 'touqi', tex: 'st_touqi', x: 470, y: 30, scale: 0.4 },
      { id: 'xiangdan', tex: 'st_xiangdan', x: 540, y: 40, scale: 0.4 },
      { id: 'yawei', tex: 'folk2', x: 670, y: 90, scale: 1.4 },
      { id: 'xd0', tex: 'st_xiangdeng_c', x: 110, y: 125, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_d', x: 250, y: 130, scale: 0.3 },
    ],
    beats: [
      { who: 'narrator', text: '（待寫）通汐到白砂墩，飯擔擺滿路邊。', src: 0, cam: { x: 360, y: -100, zoom: 1, ms: 1500 } },
      // 頭旗、香擔先進廟（往廟門走、淡出）
      {
        who: 'narrator', text: '（待寫）換了八人大轎。頭旗、香擔先進廟。', src: 1,
        moves: [{ id: 'touqi', x: 370, y: 0, alpha: 0, hop: true, ms: 1500 }, { id: 'xiangdan', x: 390, y: 10, alpha: 0, hop: true, ms: 1800 }],
      },
      { at: 'xd0', who: 'xiangdeng', text: '（待寫）回來了！', src: 2 },
      { who: 'narrator', text: '（待寫）大轎入廟。布幔還是放下的。', src: 3, moves: [{ id: 'jiao8', x: 380, y: 10, hop: true, ms: 2200 }] },
      { at: 'yawei', who: 'yawei', text: '（待寫）押尾的那句。', src: 4 },
    ],
  },
  // 開爐（第 12 天）：布幔打開。鏡頭不拍神龕（沒有廟、沒有轎），只拍底下抬頭的臉——一排信徒，鏡頭一個一個拉近
  kailu4: {
    id: 'kailu4',
    place: '白砂墩拱辰宮・開爐',
    mood: 'dawn',
    sky: [0x3a2a1a, 0xd8a86a],
    far: 'seaFar',
    ground: 0x3a2e28,
    fore: 'none',
    actors: [
      { id: 'aman', tex: 'folk3', x: 140, y: 60, scale: 1.5 },
      { id: 'xiuzhi', tex: 'folk4', x: 270, y: 70, scale: 1.5 },
      { id: 'ahan', tex: 'folk1', x: 400, y: 65, scale: 1.5 },
      { id: 'arui', tex: 'folk1', x: 530, y: 60, scale: 1.5, tint: 0xffe0b0 },
      { id: 'yawei', tex: 'folk2', x: 650, y: 90, scale: 1.4 },
      { id: 'xd0', tex: 'st_xiangdeng_f', x: 70, y: 120, scale: 0.3 },
      { id: 'xd1', tex: 'st_xiangdeng_b', x: 340, y: 125, scale: 0.3 },
    ],
    beats: [
      { who: 'narrator', text: '（待寫）回宮後第十二天，開爐。', src: 0, cam: { x: 360, y: -60, zoom: 1, ms: 1500 } },
      // 布幔打開：鏡頭往上抬到臉的高度（畫面裡沒有神龕）
      { who: 'narrator', text: '（待寫）布幔打開了。', src: 1, cam: { x: 360, y: -150, zoom: 1.1, ms: 1600 } },
      { at: 'aman', who: 'aman', text: '（待寫）湯圓多煮一碗，放那邊。', src: 2, cam: { x: 180, y: -140, zoom: 1.3, ms: 700 } },
      { at: 'xiuzhi', who: 'xiuzhi', text: '（待寫）秀枝的那句。', src: 3, cam: { x: 280, y: -140, zoom: 1.3, ms: 700 } },
      { at: 'ahan', who: 'ahan', text: '（待寫）阿翰的那句。', src: 4, cam: { x: 400, y: -140, zoom: 1.3, ms: 700 } },
      { at: 'arui', who: 'arui', text: '（待寫）阿睿的那句。', src: 5, cam: { x: 520, y: -140, zoom: 1.3, ms: 700 } },
      { at: 'yawei', who: 'yawei', text: '（待寫）押尾的那句。', src: 6, cam: { x: 360, y: -100, zoom: 1, ms: 900 } },
    ],
  },
};
