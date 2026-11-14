/**
 * 序章擲筊（AlmanacScene.prologueJiao，各章共用）：點三下，每一下都指定聖杯，三個聖杯就過關；
 * 不再擲出笑杯、陰杯，也不用重擲。笑杯、陰杯的字留在資料裡不動。
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('phaser', () => ({ default: {} }));

import { jiaoFaces, throwJiao, rollJiao, type JiaoResult } from '../src/ui/jiao';
import { CHAPTERS } from '../src/content/chapter';
import { PROLOGUE_JIAO4 } from '../src/content/ch4/believers';

const RAW = import.meta.glob(['../src/scenes/AlmanacScene.ts', '../src/ui/jiao.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const raw = (end: string) => RAW[Object.keys(RAW).find((p) => p.endsWith(end))!];

/** 假場景：tween 立刻跑完、delayedCall 立刻呼叫，記下兩片筊落地的面 */
function fakeScene() {
  const textures: string[][] = [];
  const mkImg = () => {
    const tex: string[] = [];
    textures.push(tex);
    const img = { x: 0, y: 0, setScale: () => img, setDepth: () => img, setAngle: () => img, setOrigin: () => img, setTexture: (t: string) => { tex.push(t); return img; } };
    return img;
  };
  const labels: string[] = [];
  const scene = {
    add: {
      image: () => mkImg(),
      text: (_x: number, _y: number, s: string) => { labels.push(s); const t = { setOrigin: () => t, setDepth: () => t }; return t; },
    },
    tweens: { add: (o: { onComplete?: () => void }) => o.onComplete?.() },
    cameras: { main: { shake: () => undefined } },
    time: { delayedCall: (_ms: number, f: () => void) => f() },
  };
  return { scene, landed: () => textures.map((t) => t[t.length - 1]), labels };
}

describe('throwJiao 可以指定結果', () => {
  it('jiaoFaces：聖杯一平一凸、笑杯兩平、陰杯兩凸', () => {
    expect(jiaoFaces('holy')).toEqual(['jiao_flat', 'jiao_round']);
    expect(jiaoFaces('laugh')).toEqual(['jiao_flat', 'jiao_flat']);
    expect(jiaoFaces('yin')).toEqual(['jiao_round', 'jiao_round']);
  });

  for (const want of ['holy', 'laugh', 'yin'] as JiaoResult[]) {
    it(`指定 ${want}：動畫照播，落地的面與回呼都是指定值（不看 Math.random）`, () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(want === 'holy' ? 0.9 : 0.1);
      const f = fakeScene();
      const cb = vi.fn();
      throwJiao(f.scene as never, 400, 903, cb, 360, want);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(want);
      expect(f.landed()).toEqual(jiaoFaces(want));
      expect(f.labels).toEqual(jiaoFaces(want).map((x) => (x === 'jiao_flat' ? '平面朝上' : '凸面朝上')));
      spy.mockRestore();
    });
  }

  it('沒指定：照 rollJiao() 的機率（50% 聖杯、25% 笑杯、25% 陰杯）', () => {
    const cases: [number, JiaoResult][] = [[0.1, 'holy'], [0.6, 'laugh'], [0.9, 'yin']];
    for (const [v, want] of cases) {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(v);
      expect(rollJiao()).toBe(want);
      const f = fakeScene();
      const cb = vi.fn();
      throwJiao(f.scene as never, 400, 903, cb);
      expect(cb).toHaveBeenCalledWith(want);
      expect(f.landed()).toEqual(jiaoFaces(want));
      spy.mockRestore();
    }
  });

  it('throwJiao 走 jiaoFaces，有指定就不 roll', () => {
    const s = raw('jiao.ts');
    expect(s).toContain('const r = forced ?? rollJiao();');
    expect(s).toContain('const faces = jiaoFaces(r);');
  });
});

describe('AlmanacScene.prologueJiao：三下都是聖杯', () => {
  const fn = () => {
    const s = raw('AlmanacScene.ts').replace(/\r\n/g, '\n');
    const a = s.indexOf('private prologueJiao(');
    const b = s.indexOf('\n  }\n', a);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    return s.slice(a, b);
  };

  it('每次 throwJiao 都指定 holy', () => {
    const s = fn();
    const calls = s.match(/throwJiao\(/g) ?? [];
    expect(calls.length).toBe(1);
    expect(s).toContain("}, W / 2, 'holy');");
  });

  it('沒有「非聖杯不算次數、重擲」的分支；規則說明不再列笑杯、陰杯', () => {
    const s = fn();
    expect(s).not.toContain("r !== 'holy'");
    expect(s).not.toContain('不算次數');
    expect(s).not.toContain('j[r]');
    expect(s).not.toContain('j.laugh');
    expect(s).not.toContain('j.yin');
    expect(s).toContain('`要連得 ${j.times} 個聖筊（一平一凸），日子才定。`');
    expect(s).toContain("'照傳統擲三次：'");
    expect(s).toContain('j.allHoly.text');
    expect(s).toContain('j.done');
  });
});

describe('笑杯、陰杯的字留在資料裡', () => {
  it('第四章那兩句一字不改', () => {
    expect(PROLOGUE_JIAO4.laugh.text).toBe('笑筊。爐主把日子從頭再念一遍，重擲。');
    expect(PROLOGUE_JIAO4.yin.text).toBe('陰筊。爐主跪好，整了整衣服，再問一次。');
  });

  it('各章 laugh、yin 都還在', () => {
    const want: Record<string, [string, string]> = {
      '明日是否照常暗訪？': ['王爺在笑我們多問。', '王爺要大家更小心。'],
      '今科迎王是否照常？': ['千歲爺在笑我們多問。', '千歲爺要大家更小心。'],
      '太子今年出營否？': ['太子在笑我們囉嗦。【待定】', '章將軍：「太子說……再等等。」【待定】'],
      '今年往北津進香，三月初五深夜起駕，可否？': ['笑筊。爐主把日子從頭再念一遍，重擲。', '陰筊。爐主跪好，整了整衣服，再問一次。'],
    };
    const chs = Object.values(CHAPTERS);
    expect(chs.length).toBeGreaterThan(0);
    for (const ch of chs) {
      const w = want[ch.jiao.ask];
      expect(w, ch.jiao.ask).toBeDefined();
      expect([ch.jiao.laugh.text, ch.jiao.yin.text]).toEqual(w);
    }
  });
});
