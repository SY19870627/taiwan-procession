import { describe, expect, it } from 'vitest';
import { CUTSCENES } from '../src/content/story';
import { STAGE_SCRIPTS } from '../src/content/protoStage';

// 【原型】引擎內演出：腳本只是換個演法，台詞要和原本的過場一字不差（補寫的只能標 draft）
describe('引擎內演出原型', () => {
  for (const [id, sc] of Object.entries(STAGE_SCRIPTS)) {
    it(`${id}：對應原本的過場、照抄台詞、演員都存在`, () => {
      const cs = CUTSCENES[sc.id];
      expect(cs, id).toBeDefined();
      const ids = new Set(sc.actors.map((a) => a.id));
      const used = new Set<number>();
      for (const b of sc.beats) {
        if (b.at) expect(ids.has(b.at), `${id} 泡泡 ${b.at}`).toBe(true);
        for (const m of b.moves ?? []) expect(ids.has(m.id), `${id} 走位 ${m.id}`).toBe(true);
        if (b.sfx) expect(ids.has(b.sfx.at), `${id} 狀聲字 ${b.sfx.at}`).toBe(true);
        if (b.src !== undefined) {
          expect(b.text).toBe(cs.lines[b.src].text);
          expect(b.who).toBe(cs.lines[b.src].who);
          used.add(b.src);
        } else expect(b.draft, `${id}「${b.text}」不是原台詞就要標 draft`).toBe(true);
      }
      // 原本的每一句都有演到
      expect(used.size).toBe(cs.lines.length);
    });
  }
});
