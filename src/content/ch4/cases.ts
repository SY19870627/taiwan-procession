// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章的鬼案（問歸處，core/guihu.ts）。取材見 _agent/ch4-baishatun-plan.md §7「鬼案四個」。
 * 第一夜：草鞋丁（該去北津）、點心擔阿婆（就在這裡下）；第二夜：沒走成的新娘（白砂墩）、假香燈腳（不帶）——第二夜的還沒寫。
 *
 * 第一夜的字照 _agent/ch4-text-day1.md 第 3-2、3-8、8 節。問歸處沿用審問供詞的版面（一句一列，可以「再問」、可以「對照」證據）：
 *  - statements：開場陳述兩句＋一句白天／互嗆裡他說過的話（湊成三列，一列對一層真相）；
 *  - pressQ／press：「再問」時問的那一句與回答（劇本的「可以問的問題」，要證據才問得出來的那幾題放在 truths 的 reveal）；
 *  - truths：三層真相，reveal 是對照對了之後他說的話（劇本的答與「真相揭開」）；
 *  - verdicts：result 是按鈕小字（四種歸處共用），after 是判決之後的話（劇本的「判決結果」）。
 * 對鬼不斬：判決只有帶去北津／帶回白砂墩／就在這裡下／不帶。
 */
import type { Evidence, GhostCase, VerdictDef } from '../cases';

const TBD = '（待寫）';

/** 按鈕小字（四種歸處共用；第 8 節） */
const SMALL: Record<'tobeijin' | 'tohome' | 'here' | 'leave', string> = {
  tobeijin: '佔旗下 1 格，到北津才放得下',
  tohome: '佔旗下 1 格，到回宮才放得下',
  here: '今晚就放下，不佔格',
  leave: '不佔格。他自己想辦法',
};

/** 問歸處的四種判決；right 是該去的地方（要查明 needs 才能選），其他的照常可以選 */
function dests(right: VerdictDef['verdict'], needs: number[], after: Partial<Record<VerdictDef['verdict'], string>>): VerdictDef[] {
  return (['tobeijin', 'tohome', 'here', 'leave'] as const).map((v) => ({
    verdict: v,
    ...(v === right ? { needs } : {}),
    result: SMALL[v],
    ...(after[v] ? { after: after[v] } : {}),
  }));
}

export const EVIDENCE4: Record<string, Evidence> = {
  // 草鞋丁
  sandal: { id: 'sandal', kind: '物證', name: '沒落過地的草鞋', text: '一雙稻草編的草鞋，鞋底一粒沙都沒有。繩子磨得發亮，是掛在脖子上磨的。', ghost: 'caoxie', where: '帶草鞋丁走的時候一起拿到（第一天・海線小路）' },
  aman_lukou: { id: 'aman_lukou', kind: '證詞', name: '阿滿姨的話（路口的討海人）', text: '「以前老路口有個討海的，年年站著看轎子過，說明年就跟。講了幾十年。後來路口就沒人站了。」', ghost: 'caoxie', where: '阿滿姨（第一天防風林老路，陪她走、聽她講）' },
  ahan_rule: { id: 'ahan_rule', kind: '證詞', name: '阿翰的話（阿公的規矩）', text: '「阿公說當兵前先來許願，平安回來再走一趟答謝。他們那一輩有人許了沒還，拖到走不動。」', ghost: 'caoxie', where: '阿翰（第一天車行旁的騎樓，聽他們聊）' },
  // 點心擔阿婆
  stove: { id: 'stove', kind: '物證', name: '車行後面的舊灶', text: '堆輪胎的角落留著一塊紅磚地，上面一口磚砌的舊灶。灶口朝著省道，灶台擦得很乾淨。', ghost: 'apo', where: '車行後面的線索，或賢仔帶去看（第一天・賢仔車行）' },
  xian_land: { id: 'xian_land', kind: '證詞', name: '賢仔的話（這塊地）', text: '「這塊地是我阿爸跟一個阿婆的後生買的。舊厝拆的時候，阿爸說後面那口灶不能打。」', ghost: 'apo', where: '賢仔（第一天・賢仔車行，幫他順好門口）' },
  xianzhou: { id: 'xianzhou', kind: '文獻', name: '海線舊聞・路邊的鹹粥', text: '省道還是牛車路的時候，路邊有一戶人家，年年煮一鍋鹹粥等進香的人。半夜才到的，也有得吃。', ghost: 'apo', where: '第一天的黃曆' },
  // 沒走成的新娘（第二天，骨架）
  veil: { id: 'veil', kind: '物證', name: '褪色的頭紗', text: TBD, ghost: 'xinniang', where: '第二天（待寫）' },
  // 假香燈腳（第二天，骨架）
  armband: { id: 'armband', kind: '物證', name: '撿來的臂章', text: TBD, ghost: 'jiajiao', where: '第二天（待寫）' },
};

export const CASES4: Record<string, GhostCase> = {
  caoxie: {
    id: 'caoxie', name: '草鞋丁', dayName: '打赤腳的老人', shortName: '草鞋丁', tex: 'folk2',
    daySight: '隊伍後面跟著一個打赤腳的老人影子。一雙草鞋掛在脖子上，沒穿。\n他一直往轎班那邊擠，擠到三步遠就停，不敢再靠近。\n「我是來抬轎的。轎班缺人就叫我，我肩膀還行。」',
    harm: '他照樣在後面跟；今晚問不到他',
    affects: '',
    payoff: '問清楚他要去哪',
    timid: 2, innocent: true,
    onCollect: ['sandal'],
    meet: {
      take: '帶在頭旗後面走', takeResult: '今晚可以問他',
      taken: '草鞋丁退到頭旗後面，把脖子上的草鞋扶正。「好，我先排這裡。」\n拿到物證「沒落過地的草鞋」。',
      skip: '先不帶', left: '他點點頭，退回隊尾，離轎子還是三步遠。',
    },
    statements: [
      '我是來抬轎的。年年都來。',
      '轎班要是缺人，叫我一聲就好。我在後面等。',
      '我走旗後面就好，你們不用管我。',
    ],
    pressQ: ['「你抬過幾年？」', '前哨：「你說抬轎。抬哪一邊？前槓後槓？」', '押尾：「你腳底很乾淨。」'],
    press: ['「……年年都有來。在後面跟，也算有到吧。」', '「……都可以。我不挑。」', '「我、我出門前有洗。」'],
    truths: [
      {
        stmt: 0, evidence: ['aman_lukou', 'ahan_rule'],
        summary: '他沒有抬過轎。他每年只站在路口看。',
        reveal: '「後來怎麼沒走？」\n「頭一年遇到船期。再來娶某、起厝、顧孫。」\n「每年站在路口看轎子過，都跟自己講明年。」',
      },
      {
        stmt: 1, evidence: ['sandal'],
        summary: '他入伍前在轎前許過願，後來平安退伍了。',
        reveal: '「草鞋怎麼掛在脖子上不穿？」\n「捨不得。想說要走那一趟的時候才穿。」\n「哪一趟？」\n「……當兵前，我在轎前講過一句話。」\n「講了就要還。這個規矩我知道。」',
      },
      {
        stmt: 2, evidence: ['ahan_rule', 'aman_lukou'],
        summary: '答謝的那一趟，他拖了一輩子沒走。說來抬轎，是不好意思講自己來還願。',
        reveal: '「我哪有臉講是來還願的。欠了一世人。」\n「想說來抬轎，出一點力，看能不能抵。」',
      },
    ],
    wrong: '「沒要緊。我自己在後面跟，習慣了。」',
    verdicts: dests('tobeijin', [1], {
      tobeijin: '草鞋丁：「……北津。我欠的是那一趟。」\n他把草鞋從脖子上拿下來，穿上了。\n押尾：「跟在頭旗後面。到了北津，你自己進去講。」\n草鞋丁跟著走，佔旗下 1 格，到北津才放得下。',
      tohome: '草鞋丁：「回庄裡也好。祂本來就住那裡。」\n他會跟到北津，站在廟埕外面沒有進去。那一趟，他還是沒走完。\n草鞋丁跟著走，佔旗下 1 格，到回宮才放得下。願沒有還到。',
      here: '草鞋丁：「這裡？……好，你們說這裡就這裡。」\n天亮隊伍出發，他站在省道邊看。跟以前每一年一樣。',
      leave: '草鞋丁：「沒要緊。我自己在後面跟，習慣了。」\n他還是離轎子三步遠。沒有人帶，他進不了廟門。',
    }),
  },
  apo: {
    id: 'apo', name: '點心擔阿婆', dayName: '挑擔子的阿婆', shortName: '阿婆', tex: 'folk3',
    daySight: '一個挑擔子的阿婆影子在鐵門外來回走，像在找門。\n「門口怎麼變這樣？我灶上的鹹粥還燒著。」\n「我在等轎子，年年都等。你們有看到嗎？」',
    harm: '她繼續在門外找門；今晚問不到她',
    affects: '',
    payoff: '問清楚她要去哪',
    timid: 2, innocent: true,
    meet: {
      take: '請她到頭旗後面坐', takeResult: '今晚可以問她',
      taken: '阿婆把擔子放下，坐在旗後面。「坐一下可以。粥滾了要叫我。」',
      skip: '先不請', left: '她又繞到鐵門另一邊，伸手去摸一扇已經沒有的門。',
    },
    statements: [
      '我在等轎子，年年都等。',
      '鹹粥燒好了，人怎麼還沒到？你們幫我看一下。',
      '門口怎麼變這樣？我灶上的鹹粥還燒著。',
    ],
    pressQ: ['「妳都在哪裡等？」', '「粥是煮給誰吃的？」', ''],
    press: ['「我家門口啊。省道邊，門口一棵苦楝。」', '「走路的人。半夜到的最餓，粥要燒整暝。」', '「你這個囝仔，吃飽沒？」'],
    truths: [
      {
        stmt: 0, evidence: ['xian_land', 'xianzhou'],
        summary: '她家早就拆了。原來的地方，就是現在的賢仔車行。',
        reveal: '「妳家是哪一間？」\n「就這……奇怪。我的門呢？」\n「苦楝也沒看到。是我行過頭了嗎？」',
      },
      {
        stmt: 1, evidence: ['stove', 'xianzhou'],
        summary: '她年年在門口煮鹹粥，等走路進香的人。厝拆了，她還在等。',
        reveal: '「後面這口灶，是妳的嗎？」\n「……是我的。灶口朝外，才聽得到人來。」\n「灶在這裡。那我的厝呢？」',
      },
      {
        stmt: 2, evidence: ['stove', 'xian_land'],
        summary: '今晚轎子就停在她的灶旁邊。她等的已經到了。',
        reveal: '「厝拆了喔。難怪我找無門。」\n「啊轎子呢？……在裡面？在我灶腳邊？」',
      },
    ],
    wrong: '「你們不坐喔？好啦，我再等一下。」',
    verdicts: dests('here', [0], {
      here: '阿婆把擔子放在舊灶邊，蹲下去看火。\n點心擔阿婆：「原來到了。害我在門口找半天。」\n前哨：「所以轎子今天彎進來……」\n押尾：「香燈腳都說，是來找老朋友。」\n阿婆留在這裡，不佔旗下的格子。車行後面那口灶，摸起來溫溫的。',
      leave: '點心擔阿婆：「你們不坐喔？好啦，我再等一下。」\n她本來就在自己家。只是沒有人跟她講，轎子已經到了。明年她還會在門口等。',
      tobeijin: '點心擔阿婆：「北津？我沒有要去那麼遠。我的粥還在火上。」\n她挑起擔子跟著走，一路回頭看。\n阿婆佔旗下 1 格。到了北津，她也放不下。',
      tohome: '點心擔阿婆：「白砂墩？那是人家出門的地方，我又不住那裡。」\n她挑著擔子跟在最後面，每到一個路口就問，是不是到家了。\n阿婆佔旗下 1 格，一直佔到回宮。',
    }),
  },
  xinniang: {
    id: 'xinniang', name: '沒走成的新娘', dayName: '穿紅衣的女人', shortName: '新娘', tex: 'folk5',
    daySight: TBD, harm: TBD, affects: '阿滿姨', payoff: TBD,
    timid: 2, innocent: true,
    statements: [TBD],
    press: [TBD],
    truths: [{ stmt: 0, evidence: ['veil'], summary: TBD, reveal: TBD }],
    wrong: TBD,
    verdicts: dests('tohome', [0], {}),
  },
  jiajiao: {
    id: 'jiajiao', name: '假香燈腳', dayName: '戴臂章的男人', shortName: '臂章男', tex: 'folk4',
    daySight: TBD, harm: TBD, affects: '', payoff: TBD,
    timid: 1, innocent: false,
    statements: [TBD],
    press: [TBD],
    truths: [{ stmt: 0, evidence: ['armband'], summary: TBD, reveal: TBD }],
    wrong: TBD,
    verdicts: dests('leave', [0], {}),
  },
};
