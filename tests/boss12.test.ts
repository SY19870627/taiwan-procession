/**
 * 第一、二章熱鬧化第 7 階段：最後一戰互嗆（b_*）＋三章整條路線的整合檢查。
 * 只加字幕：core/boss.ts 與戰鬥數值一行不動（boss.test、escort.test、jiao.test 照過，計畫 §1、§8）；
 * BossScene 改成「這一章有這個場合的台詞就播」，第三章的 key 都已存在，行為不變。
 */
import { describe, it, expect } from 'vitest';
import { CHAPTERS } from '../src/content/chapter';
import { CUTSCENES } from '../src/content/story';
import { STAGES } from '../src/content/stage';
import { BANTER1 } from '../src/content/banter1';
import { BANTER2 } from '../src/content/ch2/banter';
import { BANTER3 } from '../src/content/ch3/banter';
import { BanterPicker } from '../src/core/banterPick';

const SRC = import.meta.glob(['../src/scenes/BossScene.ts', '../src/ui/banter.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const bossSrc = SRC['../src/scenes/BossScene.ts'];
const banterSrc = SRC['../src/ui/banter.ts'];

/** 計畫 §2 第 7 階段列的場合（另加 b_trialMiss：陣前審問沒說動，見 §6 自行決定） */
const KEYS: Record<string, string[]> = {
  wanjia: ['b_start', 'b_paw', 'b_charge', 'b_breath', 'b_trial', 'b_trialMiss', 'b_chain', 'b_quake', 'b_down'],
  dongjin: ['b_start', 'b_grab', 'b_trial', 'b_trialMiss', 'b_down', 'b_shipLow'],
};
/** BossScene 裡所有 chat('b_…') 用到的 key（含三元運算的兩邊） */
function chatKeys(): Set<string> {
  const used = new Set<string>();
  for (const line of bossSrc.split('\n').filter((l) => /\bchat\(/.test(l))) for (const m of line.matchAll(/'(b_\w+)'/g)) used.add(m[1]);
  return used;
}

describe('最後一戰互嗆（第一、二章）', () => {
  for (const id of ['wanjia', 'dongjin']) {
    it(`${id}：計畫列的場合都有 2～4 組`, () => {
      const lib = CHAPTERS[id].banter!;
      for (const key of KEYS[id]) {
        expect(lib[key]?.length, `${id} ${key}`).toBeGreaterThanOrEqual(2);
        expect(lib[key].length, `${id} ${key}`).toBeLessThanOrEqual(4);
      }
      // 沒列的 b_* 不寫（寫了也播不到，或屬於另一種戰鬥）
      expect(Object.keys(lib).filter((k) => k.startsWith('b_')).sort()).toEqual([...KEYS[id]].sort());
    });
  }

  it('§3 的最後一戰試寫原句收在第一組', () => {
    expect(BANTER1.b_paw[0].map((l) => `${l.who}：${l.text}`)).toEqual(['八爺：牠在刨地，要衝了！', '七爺：前排的，退一步。']);
    expect(BANTER2.b_grab[0].map((l) => `${l.who}：${l.text}`)).toEqual(['轎班：船被拖走了！', '巡捕：拉回來拉回來！', '中軍府：王令，押上！']);
  });

  it('台詞庫的 b_* 場合都接到 BossScene（不會寫了沒播）', () => {
    const used = chatKeys();
    for (const lib of [BANTER1, BANTER2, BANTER3]) for (const key of Object.keys(lib).filter((k) => k.startsWith('b_'))) expect(used.has(key), key).toBe(true);
  });

  it('不再限第三章：沒有 if (this.jiao) … chat(，開打也不限', () => {
    expect(bossSrc).not.toMatch(/if \(this\.jiao\) this\.hud\.chat\(/);
    expect(bossSrc).not.toMatch(/if \(jiao\) this\.time\.delayedCall\(1500, \(\) => this\.chat\('b_start'/);
    expect(bossSrc).toMatch(/this\.time\.delayedCall\(1500, \(\) => this\.chat\('b_start', true\)\)/);
    // 第三章的刨地仍播 b_wave
    expect(bossSrc).toContain("this.hud.chat(this.jiao ? 'b_wave' : 'b_paw')");
  });

  it('陣前審問的互嗆等審問動畫滑出後才播（不疊在審問字幕上）', () => {
    const trial = bossSrc.slice(bossSrc.indexOf('  trial(round: number): void {'), bossSrc.indexOf('  private playTrial('));
    // 第三章 10% 那輪先 return，不插嘴
    expect(trial.indexOf("'b_trial'")).toBeGreaterThan(trial.indexOf('return;'));
    expect(trial).toContain("this.time.delayedCall(TRIAL_ANIM_MS, () => this.chat(ok ? 'b_trial' : 'b_trialMiss', true))");
    expect(bossSrc).toContain('delay: TRIAL_ANIM_MS - 300, duration: 300');
  });

  it('兩組之間至少隔 7 秒；沒有台詞的場合不佔間隔', () => {
    expect(bossSrc).toContain('new BanterPicker(CH().banter, 7000)');
    const p = new BanterPicker(BANTER1, 7000);
    expect(p.pick('b_paw', 0)).toBe(BANTER1.b_paw[0]);
    expect(p.pick('b_charge', 3000)).toBeNull();
    expect(p.pick('b_wave', 7000)).toBeNull(); // 第一章沒有 b_wave
    expect(p.pick('b_charge', 7000)).toBe(BANTER1.b_charge[0]);
    expect(p.pick('b_trial', 7100, true)).toBe(BANTER1.b_trial[0]); // 大事件不受間隔限制
    expect(p.pick('b_paw', 20000)).toBe(BANTER1.b_paw[1]); // 同一場合輪流
  });

  it('第三章行為不變：新掛勾的 key 第三章都沒有（播不到），原有的 key 都還在', () => {
    for (const k of ['b_paw', 'b_charge', 'b_chain', 'b_quake', 'b_trial', 'b_trialMiss', 'b_grab', 'b_shipLow']) expect(BANTER3[k], k).toBeUndefined();
    for (const k of ['b_start', 'b_down', 'b_wave', 'b_breath', 'b_snipe', 'b_sunk', 'b_flag', 'b_formation', 'b_qiankun', 'b_chujiao', 'b_back', 'b_combo', 'b_ducks']) expect(BANTER3[k]?.length, k).toBeGreaterThan(0);
  });

  it('互嗆不擋操作：字幕不收點擊', () => {
    expect(banterSrc).not.toContain('setInteractive');
  });
});

describe('三章整條路線（從標題到結尾，三種結局各一次）', () => {
  /** 依 BossScene.end()、DayScene／NightScene 的接法排出一次通關會播的過場 */
  function route(id: string, kind: 'recall' | 'return' | 'slay'): string[] {
    const c = CHAPTERS[id];
    const F = c.finale;
    return [c.prologueStory!, ...Object.values(c.dawnStory ?? {}), F.story, F.endStory?.[kind] ?? (kind === 'recall' ? F.recallStory : ''), F.closeStory!].filter(Boolean);
  }

  for (const id of ['wanjia', 'dongjin', 'xinying']) {
    for (const kind of ['recall', 'return', 'slay'] as const) {
      it(`${id}・${kind}：每段過場都有演出（不是文字版）`, () => {
        const ids = route(id, kind);
        expect(ids.length, id).toBe(5);
        for (const s of ids) {
          expect(CUTSCENES[s], `${id} ${s}`).toBeDefined();
          expect(STAGES[s], `${id} ${s}`).toBeDefined();
        }
      });
    }
  }

  it('有演出的過場三章共 22 段（第三章另有蓋在畫面上的紙紮童）', () => {
    const all = new Set<string>();
    for (const id of ['wanjia', 'dongjin', 'xinying']) for (const kind of ['recall', 'return', 'slay'] as const) for (const s of route(id, kind)) all.add(s);
    for (const k of Object.values(CHAPTERS.xinying.cases)) if (k.kneelStory) all.add(k.kneelStory);
    expect(all.size).toBe(22);
    expect(Object.keys(STAGES).sort()).toEqual([...all].sort());
  });
});
