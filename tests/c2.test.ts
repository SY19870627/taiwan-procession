/**
 * 第四章第 C2 輪（爽Game）：
 *  1. 時辰：不會因為時辰不夠而錯過任何一件事（三天都是）；時辰照扣、扣到 0 為止；上限照舊。
 *  2. 第三天的三張稟報卡（阿滿姨、秀枝、阿翰）一樣：報完卡片還在，還能辦卡上其他的事。
 *  3. 回宮／開爐：人鏈越長，畫面上多出來的人影、燈越多（只是畫面）；戰鬥數值不讀人鏈。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { startChapter } from '../src/content/chapter';
import { CHAPTER4 } from '../src/content/ch4';
import { CARDS4, chainSegments4 } from '../src/content/ch4/believers';
import { finaleSetup4 } from '../src/content/ch4/finale';
import { STAGES } from '../src/content/stage';
import { chainCrowd4 } from '../src/content/stage/ch4';
import type { BossSetup } from '../src/core/boss';
import type { DayPlan, Encounter } from '../src/content/days';
import * as state from '../src/state';
import { optionWhy, report, resolveBet, resolveStray, spendHours, strayChoices } from '../src/core/procession';

const r = () => state.run;
const RAW = import.meta.glob(['../src/scenes/*.ts', '../src/core/boss.ts', '../src/content/stage/ch4.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const raw = (end: string) => RAW[Object.keys(RAW).find((p) => p.endsWith(end))!];

beforeEach(() => startChapter('baishadun'));

/** 一天裡所有可能出現的事（含傳消息標籤加進來的） */
function allEncounters(p: DayPlan): Encounter[] {
  return [
    ...p.pre, ...p.routes.flatMap((x) => x.encounters), ...p.post,
    ...(p.follow?.detour?.encounters ?? []), ...(p.follow?.rest.encounters ?? []),
    ...(p.tagged ?? []).flatMap((t) => t.encounters),
  ];
}

describe('1. 時辰不會讓人錯過事情', () => {
  for (const d of [1, 2, 3]) {
    const p = CHAPTER4.days[d];
    it(`${p.title}：時辰是 0 的時候，每張信徒卡的每個選項、每隻牽路仔都還能辦（不會寫「時辰不夠」）`, () => {
      let n = 0;
      for (const e of allEncounters(p)) {
        startChapter('baishadun');
        r().hours = 0;
        r().miracles = p.miracles;
        if (e.kind === 'person') {
          const c = CARDS4[e.card](r());
          expect(c, e.id).toBeTruthy();
          for (const o of c!.options) {
            expect(optionWhy(r(), o, 'pre'), `${e.id} ${o.label}`).toBe('');
            n++;
          }
        }
        if (e.kind === 'imp') {
          const shout = strayChoices(r(), e, 'pre', 1).find((x) => x.how === 'shout')!;
          expect(shout.why, e.id).toBe('');
          expect(resolveStray(r(), e, 'pre', 'shout', 1)).toBe(true);
          expect(r().hours).toBe(0);
        }
      }
      expect(n).toBeGreaterThan(0);
    });
  }

  it('時辰照扣、扣到 0 為止（不會變負）；押中的上限照舊（不超過當天的時辰）', () => {
    r().hours = 1;
    spendHours(r(), 2);
    expect(r().hours).toBe(0);
    r().hours = 3;
    spendHours(r(), 1);
    expect(r().hours).toBe(2);
    for (const p of [CHAPTER4.days[1], CHAPTER4.days[2], CHAPTER4.days[3]]) {
      startChapter('baishadun');
      r().hours = p.hours;
      resolveBet(r(), p, p.follow!.goes);
      expect(r().hours).toBe(p.hours);
    }
  });

  it('DayScene：第四章（跟轎）時辰不夠也能辦（hoursWhy 不擋、spend 扣到 0）；第一～三章照舊', () => {
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain("if (CH().follow) return '';");
    expect(day).toContain('spendHours(run, hours);');
    expect(day).toContain('if (hours > run.hours) return false;');
  });
});

describe('2. 第三天的稟報卡：三張都一樣（報完卡片還在、還能辦別的）', () => {
  it('第三天有稟報的卡就是阿滿姨、秀枝、阿翰三張，稟報都是 keepOpen、0 時辰', () => {
    const REPORT3 = Object.keys(CARDS4).filter((id) => /3[a-z]?$/.test(id) && CARDS4[id](r())?.options.some((o) => o.report));
    expect([...REPORT3].sort()).toEqual(['ahan3', 'aman3', 'xiuzhi3']);
    for (const id of REPORT3) {
      const rep = CARDS4[id](r())!.options.find((o) => o.report)!;
      expect(rep.keepOpen, id).toBe(true);
      expect(rep.hours, id).toBe(0);
    }
  });

  for (const id of ['aman3', 'xiuzhi3', 'ahan3']) {
    it(`${id}：稟報以後卡片還在，稟報那個選項不見，其他選項都還能選；辦了其中一個卡片才收起來`, () => {
      r().hours = 0;
      r().miracles = 1;
      const before = CARDS4[id](r())!;
      const rep = before.options.find((o) => o.report)!;
      const others = before.options.filter((o) => !o.report).map((o) => o.label);
      expect(optionWhy(r(), rep, 'rest')).toBe('');
      report(r(), rep);
      rep.apply(r());
      const after = CARDS4[id](r());
      expect(after, id).toBeTruthy();
      expect(after!.options.some((o) => o.report)).toBe(false);
      expect(after!.options.map((o) => o.label)).toEqual(others);
      for (const o of after!.options) expect(optionWhy(r(), o, 'rest'), `${id} ${o.label}`).toBe('');
      after!.options[0].apply(r());
      expect(CARDS4[id](r())).toBeNull();
    });
  }

  it('DayScene：keepOpen 的選項播完回到同一張卡（三張走同一條路）', () => {
    const day = raw('/scenes/DayScene.ts');
    expect(day).toContain('if (o.keepOpen && e && CH().cards[e.card](run)) {');
    expect(day).toContain('talk(this, say(story, who), () => { this.busy = false; this.showPerson(e); });');
  });
});

describe('3. 回宮、開爐：人鏈越長，畫面上的人越多（只是畫面）', () => {
  it('chainCrowd4：0 段沒有多的人；段數越多，人影、燈越多；最多 10 段', () => {
    for (const at of ['huigong4', 'kailu4'] as const) {
      expect(chainCrowd4(0, at)).toEqual([]);
      let last = 0;
      for (let n = 1; n <= 10; n++) {
        const c = chainCrowd4(n, at);
        const figures = c.filter((a) => a.tex.startsWith('folk')).length;
        expect(figures, `${at} ${n}`).toBeGreaterThan(last);
        expect(c.filter((a) => a.tex === 'spark').length).toBeGreaterThan(0);
        last = figures;
      }
      expect(chainCrowd4(30, at)).toEqual(chainCrowd4(10, at));
      // 都在畫面裡、名字不和腳本的演員撞、腳本的走位不碰它們
      const sc = STAGES[at];
      const ids = new Set(sc.actors.map((a) => a.id));
      for (const a of chainCrowd4(10, at)) {
        expect(a.x).toBeGreaterThanOrEqual(0);
        expect(a.x).toBeLessThanOrEqual(720);
        expect(ids.has(a.id), a.id).toBe(false);
        for (const b of sc.beats) {
          expect(b.at).not.toBe(a.id);
          expect((b.moves ?? []).some((m) => m.id === a.id)).toBe(false);
        }
      }
    }
  });

  it('回宮、開爐的腳本照這一局的人鏈加群眾：幫過越多人，多出來的人越多；沒有字', () => {
    for (const at of ['huigong4', 'kailu4']) {
      const sc = STAGES[at];
      expect(sc.crowd, at).toBeDefined();
      startChapter('baishadun');
      const none = sc.crowd!(r());
      expect(chainSegments4(r())).toBe(0);
      expect(none).toHaveLength(0);
      r().follow!.chain = 2;
      r().b.aman = 'walked';
      const some = sc.crowd!(r());
      r().flags.helped_ahan = true;
      r().flags.helped_xiuzhi = true;
      const more = sc.crowd!(r());
      expect(some.length).toBeGreaterThan(none.length);
      expect(more.length).toBeGreaterThan(some.length);
    }
    // StoryScene 播之前把群眾放在最前面（站在所有人後面）
    expect(raw('/scenes/StoryScene.ts')).toContain('actors: [...(st.crowd?.(run) ?? []), ...st.actors]');
  });

  it('戰鬥數值不讀人鏈：人鏈 0 段和 10 段，最後一戰的設定除了 ford.chain／被叫的名單都一樣；core/boss.ts 只在畫面計數讀一次', () => {
    const lonely = finaleSetup4(r());
    startChapter('baishadun');
    r().follow!.chain = 10;
    const helped = finaleSetup4(r());
    const strip = (s: BossSetup) => JSON.stringify({ ...s, ford: { ...s.ford!, chain: 0, stragglers: [] } });
    expect(helped.ford!.chain).toBeGreaterThan(lonely.ford!.chain);
    expect(strip(helped)).toBe(strip(lonely));
    // 程式碼（不算註解）裡讀 .chain 的只有一處：畫面用的 chainLeft（人鏈牽回來的計數）
    const boss = raw('/core/boss.ts').split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
    expect(boss.match(/\.chain\b/g)).toEqual(['.chain']);
    expect(boss).toContain('this.chainLeft = Math.max(0, setup.ford!.chain);');
    // 群眾的程式不碰戰鬥
    expect(raw('/content/stage/ch4.ts')).not.toContain('core/boss');
  });
});
