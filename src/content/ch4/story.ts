// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章的過場劇情。媽祖全章不露臉、不講話、沒有立繪（承峰定案 2026-11-13）：
 * 畫面上只有轎子和布幔，祂的意思只透過轎子的動作和旁人的反應出現；旁白不替媽祖講話。
 *
 * 字照 _agent/ch4-text-day1.md 第 1-3～1-5、2、3-7、9-1 節（「旁白：」寫成 narrator；（演出：……）寫在 content/stage/ch4.ts）。
 * 播放時機：
 *  - qitou4：序章擲筊之後（放頭旗與兵馬點名、犒軍、深夜起駕）
 *  - qijia4：qitou4 之後、第一天黃曆之前（拱辰宮起駕；有演出腳本 stage/ch4.ts）
 *  - zhuanjin4：第一天臨時轉進賢仔車行（DayScene 蓋在畫面上播；有演出腳本）
 *  - tianliang4_1：試玩版第一夜天亮（ChapterDef.sliceStory）；舊灶那一句只在阿婆判「就在這裡下」時播
 *  - mangdu4：第三夜之後（茫渡現身）【TODO】
 *  - mangduRecall4／mangduReturn4／mangduSlay4：最後一戰的三種結局【TODO】
 *  - huigong4：回宮、開爐【TODO】
 */
import type { Cutscene } from '../story';

const stub = (place: string): Cutscene => ({
  mood: 'temple', place, temple: 'temple_gongchen', lines: [{ who: 'narrator', text: '（待寫）' }],
});

export const CUTSCENES4: Record<string, Cutscene> = {
  // 1-3 放頭旗與兵馬點名、1-4 犒軍、1-5 深夜起駕
  qitou4: {
    mood: 'temple', place: '白砂墩拱辰宮・放頭旗', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '三月初二，夜。頭旗綁上廟前的龍柱，旗尾朝南。' },
      { who: 'touqi', text: '頭旗放了。有形的、無形的，三天後跟這支旗走。' },
      { who: 'narrator', text: '凡人看不見，旗下已經站滿了。你是這一隊兵馬的領隊。' },
      { who: 'qianshao', text: '前哨到！探路的。領隊，哪條路先看，你講一聲我就衝。' },
      { who: 'yawei', text: '押尾。走最後面，撿落隊的。' },
      { who: 'qianshao', text: '他話很少，但是誰落隊、叫什麼名字，他都記得。' },
      { who: 'yawei', text: '三天後出門。去哪條路，別問我，我也是用跟的。' },
      { who: 'qianshao', text: '旗下有四格。路上遇到沒地方去的，就帶在旗後面走。' },
      { who: 'yawei', text: '每個都有該去的地方。帶到了，格子才空得出來。' },
      { who: 'narrator', text: '放頭旗後三天，庄裡吃素。每天傍晚，供桌從殿前一路擺到廟埕外。' },
      { who: 'cunbo', text: '兵將要走遠路，多吃一點。飯我添尖尖的。' },
      { who: 'qianshao', text: '有炒米粉！領隊，我可以先聞嗎？' },
      { who: 'aman', text: '這鍋菜頭湯趁燒。我煮了三十年，兵將應該吃得慣。' },
      { who: 'narrator', text: '阿滿姨放下鍋子，走到轎前，合掌站著。' },
      { who: 'aman', text: '媽祖，我今年膝蓋壞了。省道車多，我不敢走。' },
      { who: 'aman', text: '我走防風林那條老路，慢慢走，去前面等。' },
      { who: 'yawei', text: '她在轎前站了很久。' },
      { who: 'qianshao', text: '蛤？我在看米粉。她說什麼？' },
      { who: 'narrator', text: '三月初五，深夜。四人小轎停在殿前，轎頂蓋著粉紅色的遮雨布。' },
      { who: 'narrator', text: '廟埕站滿了人，每個人手上一支進香旗。今晚往哪邊走，沒有人知道。' },
      { who: 'touqi', text: '時辰還沒到。等。' },
      { who: 'qianshao', text: '領隊，我腳在抖。是興奮，別誤會。' },
    ],
  },
  // 2 開場過場：拱辰宮・起駕（演出見 stage/ch4.ts）
  qijia4: {
    mood: 'temple', place: '白砂墩拱辰宮・起駕', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '白砂墩拱辰宮，將近子時。廟埕的燈全開，海風很大。' },
      { who: 'arui', text: '跟轎台開播！現在線上三百一十二人，大家晚安！' },
      { who: 'qianshao', text: '領隊，那個拿棍子的在跟誰講話？' },
      { who: 'yawei', text: '手機。他叫阿睿。' },
      { who: 'touqi', text: '時辰到。起！', fx: 'flash' },
      { who: 'narrator', text: '頭旗先衝出廟門。鞭炮從廟口一路炸到海堤。', fx: 'firecracker' },
      { who: 'xiangdeng', text: '起駕了！起駕了！' },
      { who: 'narrator', text: '四人小轎跟著出來。粉紅色的轎頂在人群上面一晃一晃。' },
      { who: 'qianshao', text: '我走前面！往省道對不對？' },
      { who: 'narrator', text: '轎子到了廟前第一個路口，停住。前後擺了兩下，頓了一頓。' },
      { who: 'narrator', text: '轎班沒有人開口，肩膀跟著轎槓轉。轎子往海邊的小路去了。' },
      { who: 'qianshao', text: '……海邊？那邊沒有路燈欸。' },
      { who: 'xiangdengbo', text: '今年走海線啦！跟好跟好！' },
      { who: 'aman', text: '我就知道會彎這裡。', expr: 'smile' },
      { who: 'yawei', text: '領隊，後面我顧。一個一個我都記。' },
      { who: 'narrator', text: '隊伍離開白砂墩。這時候還很短，從頭旗到隊尾，喊一聲就聽得到。' },
    ],
  },
  // 3-7 臨時轉進：賢仔車行（第一句「傍晚，隊伍接回省道……」在 DayScene 的轉進畫面；最後一句「為什麼是這裡……」是 detour.why）
  zhuanjin4: {
    mood: 'dawn', place: '省道・賢仔車行', temple: 'temple_gongchen',
    lines: [
      { who: 'qianshao', text: '前面兩公里有一間廟，我看今晚就駐那裡。' },
      { who: 'narrator', text: '轎子走過一間車行，停住。往後退了三步。' },
      { who: 'narrator', text: '轎子在車行門口進了三次、退了三次。鐵門只拉到一半。' },
      { who: 'jiaoban4', text: '讓路！讓路！' },
      { who: 'xianzai', text: '欸欸欸，裡面還有車沒修好啦——好啦好啦，進來進來。', expr: 'surprised' },
      { who: 'narrator', text: '轎子衝進車行，在升降機旁邊落了地。' },
      { who: 'xiangdeng', text: '駐駕了！今晚駐這裡！' },
      { who: 'arui', text: '聊天室整個炸掉。大家都在問，為什麼是修車的？' },
      { who: 'qianshao', text: '這間？這間是修車的欸。旁邊就有廟。' },
      { who: 'yawei', text: '跟。' },
    ],
  },
  // 9-1 天亮過場（賢仔車行・天將亮）
  tianliang4_1: {
    mood: 'dawn', place: '賢仔車行・天將亮', temple: 'temple_gongchen',
    lines: [
      { who: 'narrator', text: '天還沒全亮。騎樓的睡袋一個一個捲起來。' },
      { who: 'xianzai', text: '粥好了！要走的先來吃一碗，燒喔。', expr: 'smile' },
      { who: 'xianzai', text: '奇怪，我昨晚怎麼會想到要煮粥。' },
      { who: 'narrator', text: '車行後面那口舊灶，灶台是溫的。', when: (r) => r.cases.apo?.verdict === 'here' },
      { who: 'arui', text: '各位早安。跟轎台線上……兩千一。兩千一？' },
      { who: 'touqi', text: '起馬。' },
      { who: 'narrator', text: '轎子出了車行，在省道上頓了一下，往南。' },
      { who: 'qianshao', text: '今天走哪？' },
      { who: 'yawei', text: '跟。' },
    ],
  },
  mangdu4: stub('渾水溪'),
  mangduRecall4: stub('渾水溪'),
  mangduReturn4: stub('渾水溪'),
  mangduSlay4: stub('渾水溪'),
  huigong4: stub('白砂墩拱辰宮'),
};
