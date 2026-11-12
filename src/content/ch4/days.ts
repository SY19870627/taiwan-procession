/**
 * 第四章的三天行程（跟轎：DayPlan.follow，見 core/procession.ts）。
 *
 * 第一天（試玩版只做到這天）：海線小路 → 行轎岔路（甲・阿滿姨的老路、乙・省道邊）→ 臨時轉進賢仔車行 → 停駕點（海線點心站）
 * → 會合後隊尾的秀枝 → 駐駕賢仔車行 → 日落傳消息（三選一，換第二天的事件池）。
 * 第二、三天：【TODO】只有骨架（型別與測試需要），岔路、事件池是暫代，下一輪再寫。
 *
 * 【第 1 階段】台詞都是【待定】暫代，下一輪由 _agent/ch4-text-day1.md 換掉：
 *  almanac().text、follow.hint／turn／detour.text／detour.why／rest.text／stay.text、各事件的 text、broadcast[].label／brings／cost。
 * 轎子走哪條（follow.goes）、時辰、標籤、人鏈段數是規則，換字時不要動。
 */
import type { RunState } from '../../state';
import type { DayPlan, Encounter } from '../days';

const ghost = (id: string, place: string, caseId: string): Encounter => ({ kind: 'ghost', id, place, caseId });
const stray = (id: string, place: string, stall?: string): Encounter => ({
  kind: 'imp', id, place, tex: 'qianlu', text: '【待定】路邊有個人影在招手：「這邊比較近喔，這邊。」隊尾有人跟過去了。', ...(stall ? { stall } : {}),
});

const DAY1: DayPlan = {
  day: 1, title: '第一天', area: '白砂墩 → 海線', hours: 6, miracles: 1, theme: 'shore', art: 'coast',
  almanac: () => ({ lunar: '【待定】', yi: '進香　出行', ji: '【待定】', source: '【待定】', text: '【待定】第一天的黃曆。' }),
  docs: [],
  pre: [
    stray('stray1p', '海線・隊尾'),
  ],
  routes: [
    {
      id: '甲', name: '阿滿姨的老路', color: 0xd86a8a,
      encounters: [
        { kind: 'person', id: 'aman1', place: '海線小路', card: 'aman1', tex: 'folk3' },
        { kind: 'talk', id: 'oldfeet', place: '海線小路', who: '老香燈腳', evidence: 'oldfeet', hours: 1, tex: 'folk2', text: '【待定】一個走了幾十年的老香燈腳。' },
        stray('stray1a', '小路・隊尾', '海線點心站'),
        { kind: 'clue', id: 'sandal', place: '小路邊', evidence: 'sandal', hours: 1, text: '【待定】路邊有一雙磨穿的舊草鞋。' },
        ghost('caoxie1', '轎班旁邊', 'caoxie'),
      ],
    },
    {
      id: '乙', name: '省道邊', color: 0x5a7aa8,
      encounters: [
        stray('stray1b', '省道・隊尾'),
        ghost('caoxie1b', '省道邊', 'caoxie'),
        { kind: 'talk', id: 'oldfeet_b', place: '檳榔攤', who: '老香燈腳', evidence: 'oldfeet', hours: 1, tex: 'folk2', text: '【待定】' },
      ],
    },
  ],
  // 會合之後：隊尾推輪椅的秀枝（日落傳消息的選項之一）
  post: [
    { kind: 'person', id: 'xiuzhi1', place: '隊尾', card: 'xiuzhi1', tex: 'folk4' },
  ],
  follow: {
    goes: '甲',
    hint: '【待定】線索：昨晚阿滿姨在轎前說，她今年想再走一次老路。',
    turn: '【待定】轎子在路口頓了一下，往阿滿姨的老路彎進去。',
    detour: {
      name: '賢仔車行', place: '賢仔車行',
      text: '【待定】轎子忽然拐進一間車行。沒有人知道為什麼。',
      encounters: [
        { kind: 'person', id: 'xianzai1', place: '賢仔車行', card: 'xianzai1', tex: 'folk2' },
        { kind: 'clue', id: 'stove', place: '車行地上', evidence: 'stove', hours: 1, text: '【待定】水泥地上有一圈燒黑的痕跡。' },
        ghost('apo1', '車行門口', 'apo'),
      ],
      why: '【待定】事後才知道：這塊地以前住著一個挑點心擔的阿婆。',
    },
    rest: {
      name: '海線點心站', place: '海線點心站',
      text: '【待定】轎子停駕休息。點心站的阿姨們端出了湯。',
      encounters: [
        { kind: 'person', id: 'arui1', place: '海線點心站', card: 'arui1', tex: 'folk1' },
        stray('stray1c', '點心站後面・隊尾', '海線點心站'),
      ],
    },
    stay: { name: '賢仔車行', text: '【待定】轎子今晚駐駕賢仔車行。門口一夜之間來了好多人。' },
  },
  broadcast: [
    { id: 'garage', label: '轎子在車行過夜', brings: '看熱鬧的年輕人', cost: '多 2 件小事（鞋子、中暑），多 1 攤點心站', tags: ['youth'], chain: 1 },
    { id: 'xiuzhi', label: '秀枝推輪椅跟在隊尾', brings: '帶病人來求的家屬', cost: '多 2 件很難辦的事，沒有多的幫手', tags: ['family'], chain: 1 },
    { id: 'none', label: '什麼都不拍', brings: '沒有多的人', cost: '明天清閒，但第三天過溪時少一批會牽人的手', tags: ['quiet'], chain: 0 },
  ],
};

/** 【TODO 第二天】骨架：事件池依第一天日落的傳消息切換（youth／family／quiet） */
const DAY2: DayPlan = {
  day: 2, title: '第二天', area: '省道 → 北津', hours: 6, miracles: 1, theme: 'mixed', art: 'highway',
  almanac: () => ({ lunar: '【待定】', yi: '【待定】', ji: '【待定】', source: '【待定】', text: '【待定】' }),
  docs: [],
  pre: [{ kind: 'person', id: 'ahan2', place: '省道', card: 'ahan2', tex: 'folk1' }],
  routes: [
    { id: '甲', name: '【待定】', color: 0xd86a8a, encounters: [ghost('xinniang2', '【待定】', 'xinniang'), { kind: 'clue', id: 'veil', place: '【待定】', evidence: 'veil', hours: 1, text: '【待定】' }] },
    { id: '乙', name: '【待定】', color: 0x5a7aa8, encounters: [ghost('jiajiao2', '【待定】', 'jiajiao'), { kind: 'clue', id: 'armband', place: '【待定】', evidence: 'armband', hours: 1, text: '【待定】' }] },
  ],
  post: [],
  tagged: [
    // 轎子在車行過夜 → 看熱鬧的年輕人：多 2 件小事，多 1 攤點心站（牽路仔旁邊就有）
    { tag: 'youth', where: 'pre', encounters: [
      { kind: 'person', id: 'shoes2', place: '省道', card: 'shoes2', tex: 'folk1' },
      { kind: 'person', id: 'heat2', place: '省道', card: 'heat2', tex: 'folk5' },
      stray('stray2y', '省道・隊尾', '年輕人的點心站'),
    ] },
    // 秀枝推輪椅 → 帶病人來求的家屬：多 2 件很難辦的事，沒有多的幫手
    { tag: 'family', where: 'post', encounters: [
      { kind: 'person', id: 'sick2a', place: '北津街上', card: 'sick2a', tex: 'folk3' },
      { kind: 'person', id: 'sick2b', place: '北津街上', card: 'sick2b', tex: 'folk2' },
    ] },
    // 什麼都不拍 → 沒有多的人（quiet 不加事）
  ],
  follow: {
    goes: '乙',
    hint: '【待定】', turn: '【待定】',
    rest: { name: '北津派出所', place: '北津派出所', text: '【待定】', encounters: [] },
    stay: { name: '北津朝聖宮', text: '【待定】' },
  },
  broadcast: [
    { id: 'garage2', label: '【待定】', brings: '【待定】', cost: '【待定】', tags: ['youth'], chain: 1 },
    { id: 'none2', label: '什麼都不拍', brings: '沒有多的人', cost: '【待定】', tags: ['quiet'], chain: 0 },
  ],
};

/** 【TODO 第三天】骨架（回程、渾水溪） */
const DAY3: DayPlan = {
  day: 3, title: '第三天', area: '省道 → 渾水溪', hours: 4, miracles: 1, theme: 'shore', art: 'dike',
  almanac: () => ({ lunar: '【待定】', yi: '【待定】', ji: '【待定】', source: '【待定】', text: '【待定】' }),
  docs: [],
  pre: [],
  routes: [
    { id: '甲', name: '【待定】', color: 0xd86a8a, encounters: [] },
    { id: '乙', name: '【待定】', color: 0x5a7aa8, encounters: [] },
  ],
  post: [],
  follow: {
    goes: '甲',
    hint: '【待定】', turn: '【待定】',
    rest: { name: '渾水溪堤防', place: '渾水溪堤防', text: '【待定】', encounters: [] },
    stay: { name: '渾水溪堤防', text: '【待定】' },
  },
};

export const DAY_PLANS4: Record<number, DayPlan> = { 1: DAY1, 2: DAY2, 3: DAY3 };

/** 今日說明卡（黃曆之後）：只說明規則，不改數值 */
export const UNLOCKS4: Record<number, { title: string; text: string }> = {
  1: {
    title: '跟轎・頭旗下',
    text: '【待定】路不是我們選的。到岔路口，轎子往哪走只有媽祖知道。\n你能做的是先把先鋒兵馬押在哪條路等：押中省 1 時辰、押錯少 1 時辰、留在轎邊不賺不賠。\n轎、頭旗、香擔，兵馬不碰，妖怪也碰不到；牽路仔只會對隊尾落隊的人下手。',
  },
};

/** 天亮：寫「昨日」（暫代） */
export function dawn4(r: RunState, n: number): string[] {
  const out: string[] = [];
  const f = r.follow;
  if (n === 1 && f?.strayed) out.push(`【待定】昨天有 ${f.strayed} 位香燈腳被帶偏，沒跟上隊伍。`);
  return out;
}

export function endOfDay3_4(_r: RunState): void {
  /* 【TODO】第三天結束 */
}

export function verdictEffects4(_r: RunState, _id: string, _verdict: string): string[] {
  return [];
}
