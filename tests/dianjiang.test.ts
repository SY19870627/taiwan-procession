/**
 * 第三章夜審「點將問罪」（core/dianjiang.ts）：氣焰、怒氣、怨氣、合擊、壓一晚、每晚 2 案、判決。
 * 同時確認第一、二章的夜審與天亮規則沒有被改到。
 */
import { describe, it, expect } from 'vitest';
import { CHAPTERS, evidenceOf, startChapter } from '../src/content/chapter';
import * as state from '../src/state';
import {
  ANGER_MAX, available, beginNight, canOpen, dawnHeld, expected, flareOf, forcedSlay, judge, knelt, matching,
  muted, openCase, pick, progress, startFlare, useTrial, verdictWhy, type Choice,
} from '../src/core/dianjiang';
import type { GhostCase } from '../src/content/cases';
import { slayPreview } from '../src/core/renown';

const ch3 = CHAPTERS.xinying;
const K = ch3.cases;
const r = () => state.run;

/** 把這一案押進營旗下、證據全給 */
function setup(id: string, opts: { evidence?: boolean; weiming?: number } = {}): GhostCase {
  startChapter('xinying');
  if (!r().held.some((h) => h.id === id)) r().held.push({ id, grudge: 0 });
  // 白天拿得到的證據全給（只有審過才掉出來的 dropsOnTrial 不給）
  if (opts.evidence !== false) for (const e of evidenceOf(id)) if (!K[id].dropsOnTrial?.includes(e)) state.gainEvidence(e);
  if (opts.weiming) r().weiming = opts.weiming;
  return K[id];
}

/** 一直照正解點，直到沒話可問；回傳點了幾下 */
function playRight(k: GhostCase, day = 1, mode: 'night' | 'roadside' = 'night') {
  const { session } = openCase(r(), k, mode, day);
  let n = 0;
  while (!session.over && n < 40) {
    pick(r(), k, session, expected(k.taunts![session.cur]));
    n++;
  }
  return { session, n };
}

describe('點將問罪：每個案子', () => {
  for (const id of Object.keys(K)) {
    it(`${K[id].name}：全部點對 → 跪地、真相全部查明、怒氣 0`, () => {
      const k = setup(id);
      const { session } = playRight(k);
      expect(knelt(r(), k)).toBe(true);
      expect(flareOf(r(), k)).toBe(0);
      expect([...r().cases[id].truths].sort()).toEqual(k.truths.map((_, i) => i));
      expect(session.anger).toBe(0);
      expect(session.over).toBe('done');
    });

    it(`${K[id].name}：全部點南營 → 怒氣滿 ${ANGER_MAX}，太子直接斬`, () => {
      const k = setup(id);
      const { session } = openCase(r(), k, 'night', 1);
      let out;
      let n = 0;
      do {
        out = pick(r(), k, session, 'south');
        n++;
      } while (!session.over && n < 40);
      if (k.nature === 'wronged') {
        // 冤魂被南營嚇三次：怨氣 3 縮起來，同時怒氣也滿了
        expect(r().held.find((h) => h.id === id)!.grudge).toBe(3);
      }
      expect(session.over).toBe('forced');
      expect(out.forced).toBe(true);
      expect(session.anger).toBe(ANGER_MAX);
      const j = forcedSlay(r(), k, ch3);
      expect(r().cases[id].verdict).toBe('slay');
      expect(j.wronged).toBe(k.nature === 'wronged');
    });
  }
});

describe('點將問罪：點將判定', () => {
  it('說謊點東營、要有對得上的證詞；沒有證據 → 點錯（拿不出證據）', () => {
    const k = setup('yamupo', { evidence: false });
    const { session } = openCase(r(), k, 'night', 1);
    expect(k.taunts![session.cur].type).toBe('lie');
    expect(matching(r(), k.taunts![session.cur], 'east')).toBeUndefined();
    const o = pick(r(), k, session, 'east');
    expect(o.kind).toBe('miss');
    expect(o.why).toBe('noEvidence');
    expect(session.anger).toBe(1);
  });

  it('點對：氣焰 -1、證據拍在臉上、揭開真相', () => {
    const k = setup('yamupo');
    const { session } = openCase(r(), k, 'night', 1);
    const f0 = flareOf(r(), k);
    const o = pick(r(), k, session, 'east');
    expect(o.kind).toBe('hit');
    expect(o.evidence).toBe('yashen_word');
    expect(o.truth).toBe(0);
    expect(flareOf(r(), k)).toBe(f0 - 1);
  });

  it('狡辯點東營 → 點錯（派錯人），怒氣 +1', () => {
    const k = setup('hutou');
    const { session } = openCase(r(), k, 'night', 1);
    session.cur = 3; // 「那堆香灰？別人放的」狡辯
    const o = pick(r(), k, session, 'east');
    expect(o.why).toBe('wrongCamp');
    expect(session.anger).toBe(1);
  });

  it('冤魂嘴硬：讓牠說 → 點對、多一句心事；點南營 → 怨氣 +1、怒氣 +1', () => {
    let k = setup('yamupo');
    let s = openCase(r(), k, 'night', 1).session;
    s.cur = 2;
    const o = pick(r(), k, s, 'listen');
    expect(o.kind).toBe('hit');
    expect(o.heart).toBe(k.heart![0]);
    k = setup('yamupo');
    s = openCase(r(), k, 'night', 1).session;
    s.cur = 2;
    const o2 = pick(r(), k, s, 'south');
    expect(o2.kind).toBe('miss');
    expect(o2.why).toBe('scaredWronged');
    expect(o2.grudge).toBe(1);
    expect(r().held.find((h) => h.id === 'yamupo')!.grudge).toBe(1);
    expect(s.anger).toBe(1);
  });

  it('對惡鬼「讓牠說」＝點錯（牠更囂張）', () => {
    const k = setup('hutou');
    const { session } = openCase(r(), k, 'night', 1);
    expect(k.taunts![session.cur].type).toBe('taunt');
    const o = pick(r(), k, session, 'listen');
    expect(o.why).toBe('listenEvil');
    expect(session.anger).toBe(1);
  });

  it('冤魂怨氣 3：縮起來不再開口', () => {
    const k = setup('dubo');
    r().held.find((h) => h.id === 'dubo')!.grudge = 3;
    const op = openCase(r(), k, 'night', 1);
    expect(muted(r(), k)).toBe(true);
    expect(op.session.over).toBe('mute');
    expect(pick(r(), k, op.session, 'east').kind).toBe('mute');
  });

  it('先跳過這句：不扣不加，換下一句', () => {
    const k = setup('hutou');
    const { session } = openCase(r(), k, 'night', 1);
    const c0 = session.cur;
    const f0 = flareOf(r(), k);
    const o = pick(r(), k, session, 'skip');
    expect(o.kind).toBe('skip');
    expect(session.cur).not.toBe(c0);
    expect(flareOf(r(), k)).toBe(f0);
    expect(session.anger).toBe(0);
  });

  it('跪下之後只剩連著真相的狠話；點錯也不再激怒太子', () => {
    const k = setup('hutou', { weiming: 4 });
    // 威名 4：惡鬼開場氣焰 -2（5 → 3）
    expect(startFlare(r(), k)).toBe(3);
    const { session } = openCase(r(), k, 'night', 1);
    for (let i = 0; i < 3; i++) pick(r(), k, session, expected(k.taunts![session.cur]));
    expect(knelt(r(), k)).toBe(true);
    const av = available(r(), k);
    expect(av.length).toBeGreaterThan(0);
    for (const i of av) expect(k.taunts![i].truth).toBeDefined();
    pick(r(), k, session, 'south');
    expect(session.anger).toBe(0);
    expect(session.over).toBeUndefined();
  });

  it('跪下時掉出只有審過才拿得到的證據（虎頭的香灰帳本）', () => {
    const k = setup('hutou');
    expect(r().evidence).not.toContain('ash_ledger');
    playRight(k);
    expect(r().evidence).toContain('ash_ledger');
  });
});

describe('開場氣焰', () => {
  it('威名 ≥2 惡鬼 -1、≥4 -2；冤魂不受威名影響；至少留 1 格', () => {
    let k = setup('hutou', { weiming: 2 });
    expect(startFlare(r(), k)).toBe(4);
    k = setup('yamupo', { weiming: 4 });
    expect(startFlare(r(), k)).toBe(k.flare);
    k = setup('shuigui', { weiming: 5 });
    expect(startFlare(r(), k)).toBe(1);
  });
});

describe('合擊（第二天起）', () => {
  const run3 = (day: number) => {
    const k = setup('hutou');
    const { session } = openCase(r(), k, 'night', day);
    const drops: number[] = [];
    for (let i = 0; i < 3; i++) drops.push(pick(r(), k, session, expected(k.taunts![session.cur])).drop);
    return drops;
  };
  it('第一夜：每下都是 -1', () => expect(run3(1)).toEqual([1, 1, 1]));
  it('第二夜：連續點對兩次，第三下合擊 -2', () => expect(run3(2)).toEqual([1, 1, 2]));
  it('點錯會中斷連擊', () => {
    const k = setup('hutou');
    const { session } = openCase(r(), k, 'night', 2);
    pick(r(), k, session, expected(k.taunts![session.cur]));
    pick(r(), k, session, expected(k.taunts![session.cur]));
    const wrong: Choice = expected(k.taunts![session.cur]) === 'south' ? 'west' : 'south';
    pick(r(), k, session, wrong);
    expect(pick(r(), k, session, expected(k.taunts![session.cur])).combo).toBeUndefined();
  });
});

describe('壓一晚（第三章天亮）', () => {
  it('不加怨氣、不掙脫；冤魂怨氣 -1；隔天氣焰 -1 並破掉 overnight 那一句', () => {
    startChapter('xinying');
    r().held.push({ id: 'hutou', grudge: 2 });
    r().held.find((h) => h.id === 'yamupo')!.grudge = 2;
    const msgs = dawnHeld(r(), ch3);
    expect(msgs.length).toBe(1);
    expect(r().held.map((h) => h.id)).toEqual(['yamupo', 'shuigui', 'huosha', 'hutou']);
    expect(r().held.find((h) => h.id === 'hutou')!.grudge).toBe(2);
    expect(r().held.find((h) => h.id === 'yamupo')!.grudge).toBe(1);
    expect(r().held.every((h) => h.tamed)).toBe(true);
    const k = K.hutou;
    const op = openCase(r(), k, 'night', 2);
    expect(op.overnight).toContain('供品');
    expect(startFlare(r(), k)).toBe(k.flare! - 1);
    expect(progress(r(), 'hutou').broken).toContain(k.overnight!.breaks);
    // 虎頭的「替溪底收供品」那一層，壓一晚就招了
    expect(r().cases.hutou.truths).toContain(3);
    expect(op.truth).toBe(3);
    expect(available(r(), k)).not.toContain(k.overnight!.breaks);
    // 壓過的效果只用一次
    expect(r().held.find((h) => h.id === 'hutou')!.tamed).toBe(false);
  });

  it('冤魂被壓一晚：冷靜下來、說心事（不破句）', () => {
    startChapter('xinying');
    dawnHeld(r(), ch3);
    const op = openCase(r(), K.yamupo, 'night', 2);
    expect(op.overnight).toBe(K.yamupo.overnight!.say);
    expect(op.truth).toBeUndefined();
    expect(progress(r(), 'yamupo').broken).toEqual([]);
    expect(startFlare(r(), K.yamupo)).toBe(K.yamupo.flare! - 1);
  });

  it('第一、二章：天亮怨氣 +1、到 3 掙脫（規則不變）', () => {
    for (const id of ['wanjia', 'dongjin']) {
      startChapter(id);
      const ch = CHAPTERS[id];
      const [a, b] = Object.keys(ch.cases);
      r().held.push({ id: a, grudge: 2 }, { id: b, grudge: 0 });
      const msgs = dawnHeld(r(), ch);
      expect(r().held).toEqual([{ id: b, grudge: 1 }]);
      expect(r().cases[a].escaped).toBe(true);
      expect(msgs[0]).toContain('掙脫');
    }
  });
});

describe('每晚 2 案', () => {
  it('第三章每晚 2 案；開審就算一案；快判不算', () => {
    startChapter('xinying');
    beginNight(r(), ch3);
    expect(r().trialsLeft).toBe(2);
    useTrial(r());
    expect(canOpen(r())).toBe(true);
    // 快判（斬）不用名額
    judge(r(), K.shuigui, K.shuigui.verdicts.find((v) => v.verdict === 'slay')!, ch3);
    expect(r().trialsLeft).toBe(1);
    useTrial(r());
    expect(canOpen(r())).toBe(false);
  });

  it('第一、二章不限案數（夜審仍是 3 更，由 TrialScene 自己算），style 不受影響', () => {
    for (const id of ['wanjia', 'dongjin']) {
      startChapter(id);
      beginNight(r(), CHAPTERS[id]);
      expect(r().trialsLeft).toBeUndefined();
      useTrial(r());
      expect(canOpen(r())).toBe(true);
    }
    expect(CHAPTERS.wanjia.trial.style).toBe('interrogate');
    expect(CHAPTERS.dongjin.trial.style).toBe('dossier');
    expect(ch3.trial.style).toBe('dianjiang');
  });
});

describe('路邊點將（審一輪）', () => {
  it('一輪就是每句剩下的狠話各說一次；說完就結束，進度留著', () => {
    const k = setup('hutou', { evidence: false });
    const { session } = openCase(r(), k, 'roadside', 1);
    const n0 = session.roundLeft!;
    expect(n0).toBe(k.taunts!.length);
    let n = 0;
    while (!session.over) {
      pick(r(), k, session, 'skip');
      n++;
    }
    expect(n).toBe(n0);
    expect(session.over).toBe('round');
    // 路邊點對的進度晚上接得上
    const k2 = setup('shuyao');
    const s2 = openCase(r(), k2, 'roadside', 1).session;
    pick(r(), k2, s2, expected(k2.taunts![s2.cur]));
    const f = flareOf(r(), k2);
    openCase(r(), k2, 'night', 1);
    expect(flareOf(r(), k2)).toBe(f);
  });
});

describe('判決', () => {
  it('超渡、編入五營要先跪地求饒；押送、斬隨時可以', () => {
    const k = setup('dubo');
    const rec = k.verdicts.find((v) => v.verdict === 'recruit')!;
    expect(verdictWhy(r(), k, rec)).toContain('跪地');
    expect(verdictWhy(r(), k, k.verdicts.find((v) => v.verdict === 'escort')!)).toBe('');
    expect(verdictWhy(r(), k, k.verdicts.find((v) => v.verdict === 'slay')!)).toBe('');
    playRight(k);
    expect(verdictWhy(r(), k, rec)).toBe('');
  });

  it('編入五營：寫明哪一營、記旗標；超渡：戾氣 -1、寫出技能', () => {
    let k = setup('dubo');
    playRight(k);
    let j = judge(r(), k, k.verdicts.find((v) => v.verdict === 'recruit')!, ch3);
    expect(j.lines.join('')).toContain('編入北營');
    expect(r().flags.recruit_dubo).toBe(true);
    expect(r().held.some((h) => h.id === 'dubo')).toBe(false);
    k = setup('yamupo');
    r().liqi = 2;
    playRight(k);
    j = judge(r(), k, k.verdicts.find((v) => v.verdict === 'release')!, ch3);
    expect(r().liqi).toBe(1);
    expect(r().cases.yamupo.verdict).toBe('release');
    expect(j.lines.join('')).toContain('群鴨陣');
    // 虎頭編入南營、紙紮童編入中營
    k = setup('hutou');
    playRight(k);
    expect(judge(r(), k, k.verdicts.find((v) => v.verdict === 'recruit')!, ch3).lines.join('')).toContain('編入南營');
    k = setup('zhizha');
    playRight(k);
    expect(judge(r(), k, k.verdicts.find((v) => v.verdict === 'recruit')!, ch3).lines.join('')).toContain('編入中營');
  });

  it('太子親斬依身分：審過的真惡威名 +1；冤魂戾氣 +1 並要播真相', () => {
    let k = setup('hutou');
    playRight(k);
    judge(r(), k, k.verdicts.find((v) => v.verdict === 'slay')!, ch3);
    expect(r().weiming).toBe(1);
    k = setup('awang');
    const j = judge(r(), k, k.verdicts.find((v) => v.verdict === 'slay')!, ch3);
    expect(j.wronged).toBe(true);
    expect(r().liqi).toBe(1);
  });
});

describe('判決頁斬的說明（外表會騙人）', () => {
  it('沒看相、真相也沒查完：三種後果都寫；真相全查明：只寫確定的那一種', () => {
    const k = setup('yamupo');
    expect(slayPreview(r(), k, ch3)).toContain('先請北營看相');
    playRight(k);
    expect(slayPreview(r(), k, ch3, true)).toContain('有冤');
    expect(slayPreview(r(), k, ch3, true)).not.toContain('先請北營看相');
  });
});
