/**
 * 第二章「東津・迎王」：三天的行程（請王・過火 → 遶境 → 遷船遶境），以及天亮時的變化。
 * 取材：東港迎王的程序（請王、過火、遶境、遷船遶境、送王）。遊戲中一律用虛構名稱。
 */
import type { RunState } from '../../state';
import type { DayPlan, Encounter } from '../days';
import type { Verdict } from '../cases';

const ghost = (id: string, place: string, caseId: string): Encounter => ({ kind: 'ghost', id, place, caseId });

const DAY1: DayPlan = {
  day: 1, title: '第一天・請王', area: '東津・東盛宮 → 港口', hours: 6, miracles: 1, theme: 'harbor',
  almanac: () => ({
    lunar: '九月十五', yi: '請王　過火', ji: '出海',
    source: '東津舊聞',
    text: '今天請王：轎班到海邊把千歲爺迎回來，回廟時光腳走過火堆。\n老人說今年海上不平靜。港口的繫船柱旁，每晚都有人在看海。',
  }),
  docs: [],
  pre: [
    { kind: 'talk', id: 'huang1', place: '東盛宮', who: '黃總理', evidence: 'tianyou', hours: 1, tex: 'n_huang', text: '黃總理在整理王船的添載簿。問問廟裡的舊事？' },
  ],
  routes: [
    {
      id: '甲', name: '港口線', color: 0x2b5aa8,
      encounters: [
        { kind: 'person', id: 'caisao1', place: '魚市場', card: 'caisaoMarket', tex: 'n_caisao' },
        { kind: 'clue', id: 'ricebowl', place: '港口・繫船柱', evidence: 'ricebowl', hours: 1, text: '最邊邊的繫船柱下，好像放著一個碗。' },
        ghost('haibo1', '港口・繫船柱旁', 'haibo'),
        { kind: 'talk', id: 'gangwu', place: '港務所', who: '港務所的老伯', evidence: 'paper', hours: 1, tex: 'n_gangwu', text: '港務所的老伯在門口抽菸。這個港口三十年來的大小事，他都記得。' },
        { kind: 'imp', id: 'pier', place: '港邊', tex: 'sha', text: '凡人只覺得今天港邊的魚腥味特別重。靈界裡，水面下浮著一團一團的海煞。' },
      ],
    },
    {
      id: '乙', name: '王船廠線', color: 0xb3261e,
      encounters: [
        { kind: 'person', id: 'hong1', place: '王船廠', card: 'hongYard', tex: 'n_hong' },
        ghost('mipo1', '王船廠・米包堆', 'mipo'),
        { kind: 'person', id: 'acheng1', place: '東盛宮廟埕・過火', card: 'achengFire', tex: 'n_acheng' },
        { kind: 'imp', id: 'yard', place: '王船廠後巷', tex: 'yi', text: '王船廠後面的暗巷，幾隻小疫鬼縮在角落，等人經過。' },
      ],
    },
  ],
  post: [],
};

const DAY2: DayPlan = {
  day: 2, title: '第二天・遶境', area: '七境頭 → 船員宿舍', hours: 6, miracles: 1, theme: 'harbor',
  almanac: () => ({
    lunar: '九月十六', yi: '遶境　祈福', ji: '動土', chong: '日沖虎　煞南',
    source: '東津舊聞',
    text: '三年前的颱風夜，港口有一艘船沒回來，只有船長活著上岸，隔年就病死了。\n今天千歲爺遶境。巷尾有幾戶沒擺香案，門窗都關著。',
  }),
  docs: ['typhoon'],
  pre: [
    { kind: 'talk', id: 'huang2', place: '東盛宮', who: '黃總理', evidence: 'tianyou', hours: 1, tex: 'n_huang', text: '出發前，黃總理在整理王船的添載簿。問問廟裡的舊事？' },
  ],
  routes: [
    {
      id: '甲', name: '街巷線', color: 0x2f8f5a,
      encounters: [
        { kind: 'person', id: 'ama', place: '七境頭・阿城家', card: 'achengHome', tex: 'n_acheng' },
        ghost('yigui2', '七境頭・巷口', 'yigui'),
        { kind: 'talk', id: 'doctor', place: '巷口的診所', who: '診所的醫生', evidence: 'doctor', hours: 1, tex: 'n_doctor', text: '巷口的診所從早上就排滿了人。醫生忙到連飯都沒吃。' },
        { kind: 'clue', id: 'manifest', place: '港務所', evidence: 'manifest', hours: 1, text: '港務所的進出港登記簿攤在桌上。' },
        ghost('mipo2', '港口・繫船柱下', 'mipo'),
      ],
    },
    {
      id: '乙', name: '宿舍線', color: 0x7a4a9a,
      encounters: [
        { kind: 'person', id: 'ajuan2', place: '雜貨店', card: 'ajuanShop', tex: 'n_ajuan' },
        ghost('adi2', '船員宿舍外', 'adi'),
        { kind: 'clue', id: 'dutylog', place: '船員宿舍・值班室', evidence: 'dutylog', hours: 1, text: '值班室的牆上掛著一本舊值班表。' },
        { kind: 'clue', id: 'remit', place: '漁會', evidence: 'remit', hours: 1, text: '漁會的櫃台後面，堆著一疊舊匯款單。' },
        { kind: 'imp', id: 'dorm', place: '宿舍後巷', tex: 'sha', text: '宿舍後巷的排水溝裡，幾團海煞在水光裡打轉。' },
      ],
    },
  ],
  post: [],
};

const DAY3: DayPlan = {
  day: 3, title: '第三天・遷船', area: '東盛宮 → 大鵬澳沙灘', hours: 4, miracles: 2, theme: 'shore',
  almanac: () => ({
    lunar: '九月十七', yi: '遷船　送王', ji: '開市', source: '送王疏文',
    text: '送王的疏文寫著：在海上出事、回不了家的人，跟著王船出海，各自回家。\n今天王船上街遶境，晚上推到大鵬澳的沙灘燒掉。',
  }),
  docs: [],
  pre: [],
  routes: [
    {
      id: '甲', name: '堤防線', color: 0x2b5aa8,
      encounters: [
        ghost('haibo3', '堤防・消波塊', 'haibo'),
        { kind: 'person', id: 'caisao3', place: '堤防', card: 'caisaoDay3', tex: 'n_caisao' },
        { kind: 'clue', id: 'douli', place: '海昌號・纜繩', evidence: 'douli', hours: 1, text: '堤防邊停著一艘外地漁船，船身漆著「海昌號」。' },
        { kind: 'imp', id: 'dike', place: '堤防', tex: 'sha', text: '消波塊的縫裡，海煞一隻一隻探出頭來。' },
      ],
    },
    {
      id: '乙', name: '市街線', color: 0xb3261e,
      encounters: [
        { kind: 'person', id: 'acheng3', place: '遷船的隊伍', card: 'achengDay3', tex: 'n_acheng' },
        { kind: 'person', id: 'hong3', place: '王船旁', card: 'hongDay3', tex: 'n_hong' },
        ghost('adi3', '船員宿舍外', 'adi'),
        { kind: 'person', id: 'ajuan3', place: '雜貨店', card: 'ajuan3', tex: 'n_ajuan' },
        ghost('yigui3', '七境頭・巷尾', 'yigui'),
      ],
    },
  ],
  post: [
    { kind: 'person', id: 'huang3', place: '大鵬澳沙灘', card: 'huang3', tex: 'n_huang' },
  ],
};

export const DAY_PLANS2: Record<number, DayPlan> = { 1: DAY1, 2: DAY2, 3: DAY3 };

/** 夜審結束後呼叫（n = 剛過完第幾夜）。改變信徒狀態，回傳明天黃曆「昨日」欄的文字。 */
export function dawn2(r: RunState, n: number): string[] {
  const out: string[] = [];
  const yiguiDone = !!r.cases.yigui?.verdict;
  if (yiguiDone && (r.b.ama === 'sick' || r.b.ama === 'eased')) {
    r.b.ama = 'cured';
    out.push('巷子裡的人退燒了。阿城的阿嬤一早就坐在門口剝蝦。');
  }
  if (r.cases.mipo?.verdict && !r.flags.mipo_told) {
    r.flags.mipo_told = true;
    out.push('王船廠的米包不再少了。洪師傅說，昨晚好像有人跟他說了聲謝謝。');
  }
  if (n === 1) {
    if (r.b.hong === 'cracked') {
      r.b.hong = 'broken';
      out.push('王船廠半夜傳出一聲裂響，龍骨又裂了一道。洪師傅一夜沒睡。');
    }
    if (r.b.acheng === 'hurt') {
      r.b.acheng = 'quit';
      out.push('阿城把轎衫摺好，放在東盛宮門口。他說腳傷了，不扛了。');
    }
    if (r.b.caisao === 'grieving') out.push('魚市場收攤的時候，蔡嫂又多擺了一副碗筷。');
  }
  if (n === 2) {
    if (r.b.ama === 'sick') {
      r.b.ama = 'regret';
      out.push('阿城的阿嬤燒到昏睡，今早被送進了醫院。');
    }
    if (r.b.ajuan === 'unmet') out.push('船員宿舍的燈閃了一整夜。舍監說，明天就把那個年輕人的東西丟掉。');
  }
  return out;
}

/** 第三天結束（入夜前） */
export function endOfDay3_2(r: RunState): void {
  // 阿嬤還沒退燒：今晚審了巷子裡的影子就會退
  void r;
}

/** 判決對信徒的影響，回傳要多顯示的句子 */
export function verdictEffects2(r: RunState, id: string, verdict: Verdict): string[] {
  const out: string[] = [];
  if (id === 'yigui') {
    if (r.b.ama === 'sick' || r.b.ama === 'eased') {
      r.b.ama = 'cured';
      out.push('', '當晚，巷子裡的人陸續退燒了。阿城的阿嬤也是。');
    }
    if (verdict === 'ship' && !(r.cases.yigui?.truths ?? []).includes(2)) {
      r.flags.yigui_loose = true;
      out.push('', '中軍府皺了皺眉：「案卷上寫牠自願上船……牠真的會乖乖待著嗎？」', '（第 3 筆沒補正：送王那晚牠會跳船，小妖多 2 波）');
    }
  }
  if (id === 'adi' && verdict === 'release') {
    out.push('', '阿娟照著阿迪說的，把信寫完，貼上郵票寄了出去。宿舍的燈再也沒有閃過。');
  }
  if (id === 'mipo' && verdict === 'release') {
    out.push('', '黃總理在添載簿上補寫了一行：「港口阿米，白米一斗。」');
  }
  return out;
}
