/**
 * 第四章的鬼案（問歸處，core/guihu.ts）。取材見 _agent/ch4-baishatun-plan.md §7「鬼案四個」。
 * 第一夜：草鞋丁（該去北津）、點心擔阿婆（就在這裡下）；第二夜：沒走成的新娘（白砂墩）、假香燈腳（不帶）。
 *
 * 【第 1 階段】只有骨架：台詞全部是【待定】的暫代字，下一輪由 _agent/ch4-text-day1.md 換掉
 *（daySight、harm、affects、payoff、statements、press、truths[].summary／reveal、wrong、verdicts[].result、EVIDENCE4[].text）。
 * 對鬼不斬：判決只有帶去北津／帶回白砂墩／就在這裡下／不帶。
 */
import type { Evidence, GhostCase, VerdictDef } from '../cases';

/** 問歸處的四種判決；right 是該去的地方（要查明 needs 才能選），其他的照常可以選 */
function dests(right: VerdictDef['verdict'], needs: number[], res: Partial<Record<VerdictDef['verdict'], string>>): VerdictDef[] {
  return (['tobeijin', 'tohome', 'here', 'leave'] as const).map((v) => ({
    verdict: v,
    ...(v === right ? { needs } : {}),
    result: res[v] ?? '【待定】',
  }));
}

export const EVIDENCE4: Record<string, Evidence> = {
  // 草鞋丁
  oldfeet: { id: 'oldfeet', kind: '證詞', name: '老香燈腳的話', text: '【待定】老香燈腳說起當年一起走的年輕人。', ghost: 'caoxie', where: '第一天甲路・老香燈腳' },
  sandal: { id: 'sandal', kind: '物證', name: '磨穿的草鞋', text: '【待定】一雙磨穿的舊草鞋，鞋帶上綁著退伍的紅線。', ghost: 'caoxie', where: '第一天甲路・路邊' },
  // 點心擔阿婆
  stove: { id: 'stove', kind: '物證', name: '車行地上的舊灶痕', text: '【待定】車行水泥地上有一圈燒黑的痕跡，像以前的灶。', ghost: 'apo', where: '第一天臨時轉進・賢仔車行' },
  xian_land: { id: 'xian_land', kind: '證詞', name: '賢仔說的地', text: '【待定】賢仔說這塊地是他阿爸跟人買的，以前上面有一間小厝。', ghost: 'apo', where: '第一天臨時轉進・賢仔' },
  // 沒走成的新娘（第二天，暫代）
  veil: { id: 'veil', kind: '物證', name: '褪色的頭紗', text: '【待定】', ghost: 'xinniang', where: '第二天（待定）' },
  // 假香燈腳（第二天，暫代）
  armband: { id: 'armband', kind: '物證', name: '撿來的臂章', text: '【待定】', ghost: 'jiajiao', where: '第二天（待定）' },
};

export const CASES4: Record<string, GhostCase> = {
  caoxie: {
    id: 'caoxie', name: '草鞋丁', dayName: '穿草鞋的年輕人', shortName: '草鞋丁', tex: 'folk1',
    daySight: '【待定】一個穿草鞋的年輕人擠在轎班旁邊，一直想伸手去扛。',
    harm: '【待定】他會一直跟著轎班擠，落在隊尾',
    affects: '【待定】',
    payoff: '【待定】弄清楚他該去哪裡',
    timid: 2, innocent: true,
    statements: ['【待定】「我是來抬轎的。」', '【待定】「我走過，我知道路。」'],
    press: ['【待定】', '【待定】'],
    truths: [
      { stmt: 0, evidence: ['oldfeet', 'sandal'], summary: '【待定】當年平安退伍，答謝的那一趟拖了一輩子沒走。', reveal: '【待定】' },
    ],
    wrong: '【待定】',
    verdicts: dests('tobeijin', [0], {
      tobeijin: '【待定】帶他走到北津還願。到北津之前佔頭旗下一格',
      tohome: '【待定】帶回白砂墩（佔格到回宮）',
      here: '【待定】就在這裡下',
      leave: '【待定】不帶',
    }),
  },
  apo: {
    id: 'apo', name: '點心擔阿婆', dayName: '挑擔子的阿婆', shortName: '阿婆', tex: 'folk3',
    daySight: '【待定】車行門口站著一個挑點心擔的阿婆，一直往轎子那邊看。',
    harm: '【待定】',
    affects: '【待定】賢仔',
    payoff: '【待定】弄清楚轎子為什麼轉進車行',
    timid: 2, innocent: true,
    statements: ['【待定】「我在等轎子，年年都等。」', '【待定】「我灶上的鹹粥還燒著。」'],
    press: ['【待定】', '【待定】'],
    truths: [
      { stmt: 0, evidence: ['stove', 'xian_land'], summary: '【待定】她家早就拆了，原址就是賢仔車行。', reveal: '【待定】' },
    ],
    wrong: '【待定】',
    verdicts: dests('here', [0], {
      tobeijin: '【待定】帶去北津（佔格到北津）',
      tohome: '【待定】帶回白砂墩（佔格到回宮）',
      here: '【待定】就在這裡下：轎子今晚停的就是她家',
      leave: '【待定】不帶',
    }),
  },
  xinniang: {
    id: 'xinniang', name: '沒走成的新娘', dayName: '穿紅衣的女人', shortName: '新娘', tex: 'folk5',
    daySight: '【待定】', harm: '【待定】', affects: '【待定】阿滿姨', payoff: '【待定】',
    timid: 2, innocent: true,
    statements: ['【待定】「我要去北津。」'],
    press: ['【待定】'],
    truths: [{ stmt: 0, evidence: ['veil'], summary: '【待定】', reveal: '【待定】' }],
    wrong: '【待定】',
    verdicts: dests('tohome', [0], {}),
  },
  jiajiao: {
    id: 'jiajiao', name: '假香燈腳', dayName: '戴臂章的男人', shortName: '臂章男', tex: 'folk4',
    daySight: '【待定】', harm: '【待定】', affects: '【待定】', payoff: '【待定】',
    timid: 1, innocent: false,
    statements: ['【待定】「我也有報名。」'],
    press: ['【待定】'],
    truths: [{ stmt: 0, evidence: ['armband'], summary: '【待定】', reveal: '【待定】' }],
    wrong: '【待定】',
    verdicts: dests('leave', [0], {}),
  },
};
