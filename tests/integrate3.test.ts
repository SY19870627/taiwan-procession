/**
 * 第三章第 6 階段：整合（過場劇情、互嗆三個場合、信徒錄、出巡圖開放、結局劇情的接法）。
 * 同時確認第一、二章沒有被接上第三章的東西。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CHAPTERS, startChapter } from '../src/content/chapter';
import { CUTSCENES, SPEAKERS, ART } from '../src/content/story';
import { CUTSCENES3 } from '../src/content/ch3/story';
import { BANTER3, BANTER_SCENES3, BANTER_WHO3 } from '../src/content/ch3/banter';
import { MAP_CHAPTERS } from '../src/content/map';
import { BanterPicker } from '../src/core/banterPick';
import { paginate } from '../src/core/pages';
import { takeKneelStory, type DjProgress } from '../src/core/dianjiang';
import * as state from '../src/state';

const ch3 = CHAPTERS.xinying;
const r = () => state.run;
/** 原始碼、立繪檔名、package.json（用 Vite 的 glob 讀，不必裝 node 型別） */
const SRC = import.meta.glob(['../src/scenes/*.ts', '../src/ui/*.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const PORTRAITS = Object.keys(import.meta.glob('../public/portraits/*.webp')).map((f) => f.split('/').pop()!);
const PKG = Object.values(import.meta.glob('../package.json', { query: '?raw', import: 'default', eager: true }))[0] as string;

/** 第三章會播到的所有劇情 */
function storiesOf3(): string[] {
  const F = ch3.finale;
  return [
    ch3.prologueStory!, ...Object.values(ch3.dawnStory ?? {}), F.story, F.recallStory,
    ...Object.values(F.endStory ?? {}), F.closeStory!,
    ...Object.values(ch3.cases).map((k) => k.kneelStory).filter((x): x is string => !!x),
  ];
}

describe('第三章過場劇情', () => {
  it('大綱要的過場都有：開營、紙紮童跪下、溪水倒流、蛟現身、三種結局、收營', () => {
    expect(ch3.prologueStory).toBe('kaiying3');
    expect(ch3.cases.zhizha.kneelStory).toBe('zhizha3');
    expect(ch3.dawnStory).toEqual({ 3: 'river3' });
    expect(ch3.finale.story).toBe('jiao3');
    expect(ch3.finale.endStory).toEqual({ recall: 'jiaoRecall', slay: 'jiaoSlay3', return: 'jiaoReturn3' });
    expect(ch3.finale.closeStory).toBe('shouying3');
    for (const id of storiesOf3()) expect(CUTSCENES[id], id).toBeDefined();
  });

  it('每一句的說話者都登記過；神明畫臉（不用「旨意」），有立繪的角色圖檔都在', () => {
    const files = new Set(PORTRAITS);
    expect(files.size).toBeGreaterThan(50);
    for (const [id, cs] of Object.entries(CUTSCENES3)) {
      expect(cs.lines.length, id).toBeGreaterThanOrEqual(5);
      for (const l of cs.lines) {
        if (l.who === 'narrator') continue;
        expect(SPEAKERS[l.who], `${id}：${l.who}`).toBeDefined();
        expect(['god', 'kaijiang', 'yun'].includes(l.who), `${id} 用了旨意`).toBe(false);
        const art = ART[l.who];
        expect(art, `${l.who} 沒有立繪對照`).toBeDefined();
        const expr = l.expr ?? art![1];
        // 表情沒有圖時會退回 normal（portraits.ts 的 FALLBACK），至少 normal 那張要在
        expect(files.has(`${art![0]}_${expr}.webp`) || files.has(`${art![0]}_normal.webp`) || files.has(`${art![0]}_angry.webp`), `${art![0]}_${expr}`).toBe(true);
      }
    }
  });

  it('收蛟為坐騎的劇情：太子嘴硬「我只是缺一隻坐騎」、溪水恢復順流（天將亮）', () => {
    const cs = CUTSCENES.jiaoRecall;
    expect(cs.mood).toBe('dawn');
    expect(cs.bg).toBe('river');
    expect(cs.lines.some((l) => l.who === 'taizi' && l.text.includes('坐騎'))).toBe(true);
  });

  it('紙紮童跪下：嗆「我才是太子」→ 太子「喔？」→ 跪下；妖怪視角', () => {
    const cs = CUTSCENES.zhizha3;
    expect(cs.mood).toBe('demon');
    const i = cs.lines.findIndex((l) => l.who === 'zhizha' && l.text.includes('我才是太子'));
    const j = cs.lines.findIndex((l) => l.who === 'taizi' && l.text === '喔？');
    const k = cs.lines.findIndex((l) => l.who === 'zhizha' && l.expr === 'scared');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(j).toBeGreaterThan(i);
    expect(k).toBeGreaterThan(j);
  });

  it('蛟現身時溪水倒流（妖怪視角、溪邊）；蛟翻舊帳「鬧海」', () => {
    expect(CUTSCENES.jiao3.mood).toBe('demon');
    expect(CUTSCENES.jiao3.bg).toBe('river');
    expect(CUTSCENES.jiao3.lines.some((l) => l.text.includes('鬧海'))).toBe(true);
    expect(CUTSCENES.river3.lines.some((l) => l.text.includes('往山那邊流'))).toBe(true);
  });

  it('紙紮童跪下的劇情只播一次，而且要真的跪了才播', () => {
    startChapter('xinying');
    const k = ch3.cases.zhizha;
    expect(takeKneelStory(r(), k)).toBeUndefined();
    r().cases.zhizha = { truths: [], dj: { knelt: true } as DjProgress };
    expect(takeKneelStory(r(), k)).toBe('zhizha3');
    expect(takeKneelStory(r(), k)).toBeUndefined();
    // 其他鬼沒有專屬劇情
    r().cases.hutou = { truths: [], dj: { knelt: true } as DjProgress };
    expect(takeKneelStory(r(), ch3.cases.hutou)).toBeUndefined();
  });

  it('第一、二章沒有接上第三章的劇情（序章、天亮前、結局、收營），最好結局照舊用 recallStory', () => {
    for (const id of ['wanjia', 'dongjin']) {
      const c = CHAPTERS[id];
      expect(c.prologueStory, id).toBeUndefined();
      expect(c.dawnStory, id).toBeUndefined();
      expect(c.finale.endStory, id).toBeUndefined();
      expect(c.finale.closeStory, id).toBeUndefined();
      expect(CUTSCENES[c.finale.recallStory], id).toBeDefined();
      expect(Object.values(c.cases).some((k) => k.kneelStory), id).toBe(false);
    }
  });
});

describe('互嗆台詞庫（白天、夜審、最後一戰）', () => {
  it('三個場合各至少 12 組', () => {
    for (const [scene, keys] of Object.entries(BANTER_SCENES3)) {
      const n = keys.reduce((s, k) => s + (BANTER3[k]?.length ?? 0), 0);
      expect(n, scene).toBeGreaterThanOrEqual(12);
      for (const k of keys) expect(BANTER3[k]?.length, `${scene}/${k}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('每一組都歸在某個場合；每句一行、不太長，說話的是太子或五將', () => {
    const all = new Set(Object.values(BANTER_SCENES3).flat());
    for (const [key, lib] of Object.entries(BANTER3)) {
      expect(all.has(key), `${key} 沒有歸到任何場合`).toBe(true);
      for (const set of lib) {
        expect(set.length, key).toBeGreaterThanOrEqual(1);
        expect(set.length, key).toBeLessThanOrEqual(3);
        for (const l of set) {
          expect(BANTER_WHO3.includes(l.who), `${key}：${l.who}`).toBe(true);
          expect(l.text.includes('\n'), l.text).toBe(false);
          expect([...`${l.who}：${l.text}`].length, l.text).toBeLessThanOrEqual(24);
        }
      }
    }
  });

  it('五將的個性：西營柳將軍一句最多兩個字以內的短句居多；北營廉將軍說完沒人接的組有好幾組', () => {
    const liu = Object.values(BANTER3).flat(2).filter((l) => l.who === '柳將軍');
    const short = liu.filter((l) => [...l.text.replace(/[。…？！]/g, '')].length <= 2);
    expect(short.length / liu.length).toBeGreaterThan(0.7);
    const lianLast = Object.values(BANTER3).flat().filter((set) => set[set.length - 1].who === '廉將軍');
    expect(lianLast.length).toBeGreaterThanOrEqual(5);
  });

  it('台詞庫裡的每個場合，畫面上都有接（DayScene、TrialScene、ui/dianjiang、BossScene）', () => {
    const src = ['scenes/DayScene.ts', 'scenes/TrialScene.ts', 'ui/dianjiang.ts', 'scenes/BossScene.ts']
      .map((f) => SRC[`../src/${f}`]).join('\n');
    expect(src.length).toBeGreaterThan(10000);
    const used = new Set<string>();
    // 呼叫互嗆的那一行裡所有引號字（判決頁：斬 → slay／wronged、其他 → judge；升堂或路邊 → open／roadside）
    for (const line of src.split('\n').filter((l) => /\b(?:banter|chat)\(/.test(l))) {
      for (const m of line.matchAll(/'(\w+)'/g)) used.add(m[1]);
    }
    if (src.includes('this.banter(`walk${this.plan.day}`)')) for (const d of [1, 2, 3]) used.add(`walk${d}`);
    for (const key of Object.keys(BANTER3)) expect(used.has(key), `${key} 沒有接到畫面上`).toBe(true);
    for (const key of used) if (/^(b_|walk)/.test(key)) expect(BANTER3[key], key).toBeDefined();
  });

  it('輪流播、最後一戰兩組之間至少隔一段時間（大事件不受限）', () => {
    const p = new BanterPicker(BANTER3, 7000);
    const a = p.pick('b_qiankun', 0);
    expect(a).toBe(BANTER3.b_qiankun[0]);
    expect(p.pick('b_qiankun', 3000)).toBeNull();
    expect(p.pick('b_formation', 3500, true)).toBe(BANTER3.b_formation[0]);
    expect(p.pick('b_qiankun', 11000)).toBe(BANTER3.b_qiankun[1]);
    expect(p.pick('nope', 99999)).toBeNull();
    // 第一、二章沒有台詞庫：永遠不播
    expect(new BanterPicker(CHAPTERS.wanjia.banter, 0).pick('b_start', 0, true)).toBeNull();
  });
});

describe('信徒錄', () => {
  beforeEach(() => startChapter('xinying'));

  it('5 位信徒、9 個鬼、蛟', () => {
    expect(ch3.epitaphs(r())).toHaveLength(5);
    expect(ch3.ghostEpitaphs(r())).toHaveLength(9);
    expect(Object.keys(ch3.cases)).toHaveLength(9);
  });

  it('每個鬼的每一種判決都有自己的結局（不會退回「還押著」那句）', () => {
    const ids = Object.keys(ch3.cases);
    const fallback = ch3.ghostEpitaphs(r());
    ids.forEach((id, i) => {
      for (const { verdict } of ch3.cases[id].verdicts) {
        startChapter('xinying');
        r().cases[id] = { truths: [], verdict };
        const e = ch3.ghostEpitaphs(r())[i];
        expect(e.text, `${id}/${verdict}`).not.toBe(fallback[i].text);
        expect(e.text.length, `${id}/${verdict}`).toBeGreaterThan(8);
      }
    });
  });

  it('蛟的三種結局各有一句；收蛟為坐騎是圓滿、押回水府留遺憾', () => {
    const end = (k: 'recall' | 'slay' | 'return') => { r().shijuEnd = k; return ch3.finalEpitaph(r()); };
    expect(end('recall').good).toBe(true);
    expect(end('recall').text).toContain('坐騎');
    expect(end('slay').good).toBe(true);
    expect(end('return').good).toBe(false);
  });

  it('分頁：放得下就一頁；放不下就換頁；標題不落單在頁尾', () => {
    expect(paginate([30, 80, 80], 400)).toEqual([[0, 1, 2]]);
    expect(paginate([100, 100, 100, 100], 250)).toEqual([[0, 1], [2, 3]]);
    // 第 2 列是標題（30），後面那列 100：頁上剩 50 放不下兩個，標題跟著換頁
    expect(paginate([100, 100, 30, 100], 250, [false, false, true, false])).toEqual([[0, 1], [2, 3]]);
    // 單列比一頁還高：自己一頁，不會無限迴圈
    expect(paginate([500, 10], 200)).toEqual([[0], [1]]);
    expect(paginate([], 100)).toEqual([[]]);
  });
});

describe('出巡圖開放新瀛', () => {
  it('新瀛開放、規模文字照計畫；第一、二章仍開放', () => {
    const x = MAP_CHAPTERS.find((c) => c.id === 'xinying')!;
    expect(x.open).toBe(true);
    expect(x.scale).toBe('三天＋收營・五位信徒・四個案子＋五個小咖・魔王蛟');
    expect(MAP_CHAPTERS.find((c) => c.id === 'wanjia')!.open).toBe(true);
    expect(MAP_CHAPTERS.find((c) => c.id === 'dongjin')!.open).toBe(true);
  });

  it('開放的章節都註冊在 CHAPTERS；沒註冊的不能開放', () => {
    for (const c of MAP_CHAPTERS) expect(!!CHAPTERS[c.id], c.id).toBe(c.open);
  });

  it('結局頁：副標、廟（太子殿）；版本 0.6.0', () => {
    expect(ch3.endSub).toContain('新瀛');
    expect(ch3.temple).toBe('temple_taizi');
    expect(JSON.parse(PKG).version).toBe('0.6.0');
  });
});
