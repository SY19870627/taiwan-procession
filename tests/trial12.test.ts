/**
 * 第一、二章熱鬧化第 6 階段：夜審互嗆（t_*）。
 * 只加字幕，夜審規則、怨氣、證據對應都不動（計畫 §1、§8）；第三章點將問罪不加 t_* 台詞，行為不變。
 */
import { describe, it, expect } from 'vitest';
import { CHAPTERS } from '../src/content/chapter';
import { BANTER3 } from '../src/content/ch3/banter';
import { TRIAL, punctLeads, wrapWidth } from '../src/core/layout';
import { W } from '../src/theme';

const SRC = import.meta.glob(['../src/scenes/TrialScene.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const trialSrc = SRC['../src/scenes/TrialScene.ts'];

/** 每一章都有的夜審場合 */
const COMMON = ['t_open', 't_hit', 't_miss', 't_mute', 't_release', 't_recruit', 't_slay', 't_wronged'];
/** 判決的場合：這一章的案子有這種判決才有台詞 */
const BY_VERDICT = ['escort', 'ship', 'free'];

/** 從 TrialScene 原始碼找出某個方法的內容（到下一個方法為止） */
function method(name: string): string {
  const i = trialSrc.indexOf(`  private ${name}(`);
  expect(i, name).toBeGreaterThan(0);
  const j = trialSrc.indexOf('\n  private ', i + 1);
  return trialSrc.slice(i, j < 0 ? undefined : j);
}

describe('第一、二章夜審互嗆', () => {
  for (const id of ['wanjia', 'dongjin']) {
    const ch = CHAPTERS[id];
    const verdicts = new Set(Object.values(ch.cases).flatMap((k) => k.verdicts.map((v) => v.verdict)));

    it(`${id}：每個夜審掛勾都有 2～4 組台詞`, () => {
      const keys = [...COMMON, ...BY_VERDICT.filter((v) => verdicts.has(v as never)).map((v) => `t_${v}`)];
      for (const key of keys) {
        const lib = ch.banter?.[key];
        expect(lib?.length, `${id} ${key}`).toBeGreaterThanOrEqual(2);
        expect(lib!.length, `${id} ${key}`).toBeLessThanOrEqual(4);
      }
    });

    it(`${id}：沒有這種判決的章節，不寫那一組（寫了也播不到）`, () => {
      for (const key of Object.keys(ch.banter!).filter((k) => k.startsWith('t_'))) {
        const v = key.slice(2);
        if (COMMON.includes(key)) continue;
        expect(verdicts.has(v as never), `${id} ${key}`).toBe(true);
      }
    });

    it(`${id}：夜審說話的是堂上這兩位（${ch.trial.officers.map((o) => o.label).join('、')}）`, () => {
      const who = new Set(ch.trial.officers.map((o) => o.label));
      for (const [key, sets] of Object.entries(ch.banter!).filter(([k]) => k.startsWith('t_'))) {
        for (const set of sets) for (const l of set) expect(who.has(l.who), `${id} ${key}：${l.who}`).toBe(true);
      }
    });
  }

  it('第三章沒有 t_* 台詞（點將問罪原有的 chat 不動）', () => {
    expect(Object.keys(BANTER3).filter((k) => k.startsWith('t_'))).toEqual([]);
    expect(CHAPTERS.xinying.trial.style).toBe('dianjiang');
  });

  it('台詞庫的 t_* 場合都接到 TrialScene', () => {
    const used = new Set<string>();
    for (const m of trialSrc.matchAll(/'(t_\w+)'/g)) used.add(m[1]);
    // 判決用 `t_${v.verdict}` 組出來的
    if (trialSrc.includes('`t_${v.verdict}`')) for (const v of ['release', 'recruit', 'escort', 'ship', 'free', 'slay']) used.add(`t_${v}`);
    for (const id of ['wanjia', 'dongjin']) {
      for (const key of Object.keys(CHAPTERS[id].banter!).filter((k) => k.startsWith('t_'))) expect(used.has(key), `${id} ${key}`).toBe(true);
    }
  });

  it('掛勾的位置：開堂、出示對／錯、怨氣滿、判決', () => {
    expect(method('open')).toMatch(/quip\(this\.heldOf\(k\)\.grudge >= 3 \? 't_mute' : 't_open'\)/);
    const check = method('check');
    // 對了：回憶播完、回到堂上才播
    expect(check.slice(check.indexOf('flashback('), check.indexOf('return;'))).toContain("this.quip('t_hit')");
    expect(check).toMatch(/quip\(held\.grudge >= 3 \? 't_mute' : 't_miss'\)/);
    expect(method('judge')).toMatch(/k\.innocent \? 't_wronged' : `t_\$\{v\.verdict\}`/);
  });

  it('第三章的點將問罪不呼叫夜審互嗆', () => {
    for (const m of ['lobbyDj', 'openDj', 'quick']) expect(method(m), m).not.toContain('quip(');
  });
});

describe('夜審互嗆字幕的位置（視覺修正：下方面板上面的字幕條）', () => {
  const G = TRIAL.glow;

  it('光圈在畫面正中', () => {
    expect(G.x).toBe(W / 2);
  });

  it('字幕條從判官、鬼的臉下面開始排（立繪上半露出來），寬到整個畫面、字夠大', () => {
    // 判官立繪底 506、高 250；鬼的立繪（審問、判決）上半都不蓋
    expect(TRIAL.chatY).toBeGreaterThanOrEqual(506 - 250 * 0.5);
    expect(TRIAL.chatY).toBeGreaterThanOrEqual(TRIAL.ghost.bottom - TRIAL.ghost.h * 0.5);
    expect(TRIAL.chatY).toBeGreaterThanOrEqual(TRIAL.verdict.bottom - TRIAL.verdict.h * 0.5);
    expect(16 + TRIAL.chatW).toBeLessThanOrEqual(W - 16);
    expect(TRIAL.chatW).toBeGreaterThanOrEqual(390);
    expect(TRIAL.chatSize).toBeGreaterThanOrEqual(23);
  });

  it('最長的一組排下來不碰下方面板（審問與判決結果）', () => {
    // 照 ui/banter.ts：一句一行（太寬才縮小一號換行），每句佔 chatRowH
    const rowsOf = (s: string) => Math.ceil(([...s].length * TRIAL.chatSize) / (TRIAL.chatW - 20));
    for (const id of ['wanjia', 'dongjin']) {
      for (const [key, sets] of Object.entries(CHAPTERS[id].banter!).filter(([k]) => k.startsWith('t_'))) {
        for (const set of sets) {
          const h = set.reduce((sum, l) => sum + rowsOf(`${l.who}：${l.text}`) * TRIAL.chatRowH, 0);
          expect(TRIAL.chatY + h, `${id} ${key} ${set[0].text}`).toBeLessThanOrEqual(Math.min(TRIAL.panelY, TRIAL.verdict.panelY));
        }
      }
    }
  });

  it('TrialScene 用這組常數畫光圈、立繪、面板', () => {
    expect(trialSrc).toContain('this.add.circle(G.x, G.y, G.r');
    expect(trialSrc).toContain('scale: G.pulse');
    expect(trialSrc).toContain('TRIAL.ghost.bottom');
    expect(trialSrc).toContain('y: TRIAL.panelY');
    expect(trialSrc).toContain('y: TRIAL.verdict.panelY');
    expect(trialSrc).toContain('banter(this, lib[n % lib.length], TRIAL.chatY, 40, TRIAL.chatW, { size: TRIAL.chatSize');
  });
});

describe('互嗆字幕換行：標點不放行首', () => {
  it('punctLeads 認得行首的標點（第一行不算）', () => {
    expect(punctLeads(['文判官：不急', '，再問問。'])).toBe(true);
    expect(punctLeads(['轎班：起轎', '——！'])).toBe(true);
    expect(punctLeads(['文判官：不急，', '再問問。'])).toBe(false);
    expect(punctLeads(['……原來是這樣。'])).toBe(false);
  });

  it('wrapWidth 挑一個不會讓標點落在行首的寬度，不超過上限', () => {
    // 假的換行：每行 w / 10 個字
    const s = '文判官：不急，再問問。';
    const wrap = (w: number) => { const n = Math.floor(w / 10); const out: string[] = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n)); return out; };
    expect(punctLeads(wrap(60))).toBe(true);
    const w = wrapWidth(60, 200, 10, wrap);
    expect(w).toBeLessThanOrEqual(200);
    expect(punctLeads(wrap(w))).toBe(false);
    // 都不行就照原本的寬度
    expect(wrapWidth(60, 60, 10, () => ['a', '，b'])).toBe(60);
  });
});
