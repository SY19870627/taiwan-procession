/**
 * 出巡圖上的章節（ChapterScene 用）：地點、簡介、規模、開放與否。
 * 開放的章節必須在 content/chapter.ts 的 CHAPTERS 註冊（tests/chapters.test.ts 檢查）。
 */
export interface MapChapter {
  id: string;
  /** 地名 */
  place: string;
  /** 章名 */
  title: string;
  lon: number;
  lat: number;
  open: boolean;
  /** 簡介 */
  desc: string;
  /** 規模 */
  scale: string;
}

export const MAP_CHAPTERS: MapChapter[] = [
  {
    id: 'wanjia', place: '萬舺', title: '青嶺王暗訪', lon: 121.5, lat: 25.04, open: true,
    desc: '正日遶境前，青嶺王夜巡暗訪，捉拿陰陽兩界作祟者。芝嶺巖的石駒醒了，一路往北，像在找什麼。',
    scale: '三天晝夜・五位信徒・四個有冤情的鬼・魔王石駒',
  },
  {
    id: 'baishadun', place: '白砂墩', title: '媽祖徒步進香', lon: 120.68, lat: 24.49, open: false,
    desc: '往哪裡走，只有媽祖知道。轎子一動，跟上來的人一天比一天多，多到整條省道都是人。',
    scale: '尚未開放',
  },
  {
    id: 'lanze', place: '蘭澤潭', title: '潭底的聲音', lon: 120.47, lat: 23.46, open: false,
    desc: '潭邊的人說，夜裡聽得到有人在水底唱歌。',
    scale: '尚未開放',
  },
  {
    id: 'xinying', place: '新瀛', title: '太子出營', lon: 120.32, lat: 23.31, open: true,
    desc: '太子爺聖誕，五營兵將全員出營。營旗下五格，開營就押滿三格；乾坤圈開路、點將問罪。疾水溪的水，這幾天開始倒著流。',
    scale: '三天＋收營・五位信徒・四個案子＋五個小咖・魔王蛟',
  },
  {
    id: 'dongjin', place: '東津', title: '迎王', lon: 120.45, lat: 22.46, open: true,
    desc: '三年一科的迎王，代天巡狩的千歲爺駐駕代天府。雲王爺開路、千歲爺調閱案卷。王船出海那晚，送走的是瘟疫，還是別的什麼？',
    scale: '三天＋送王・五位信徒・四個有冤情的鬼・魔王黑潮',
  },
  {
    id: 'lishan', place: '鯉山', title: '鯉山之夜', lon: 121.14, lat: 22.76, open: false,
    desc: '山形像一條鯉魚。老人說，牠每隔幾十年就會翻一次身。',
    scale: '尚未開放',
  },
];
