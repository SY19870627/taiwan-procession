/**
 * 第三章暫代美術（第 2 階段）：街景配置、正式圖的替換開關、溪水流向、白天隊伍、貼圖名稱都有畫。
 * 繪製本身要 Phaser（瀏覽器），這裡測的是 art/xinyingSpec.ts 的純資料與純函式，
 * 再用原始碼比對確認場景引用到的第三章貼圖名稱都有畫。
 */
import { describe, it, expect } from 'vitest';
import {
  BG_FILES, PLAIN_ART, PLAIN_SPEC, PLAIN_THEMES, SOLDIER_MAX, SOLDIER_MIN,
  bandLine3, bgImageKey, isPlainTheme, plainLayers, riverFlow, type PlainArtKey,
} from '../src/art/xinyingSpec';
import { FIELD_H, GROUND_Y } from '../src/theme';
import { CHAPTER3 } from '../src/content/ch3';
import { DAY_PLANS3 } from '../src/content/ch3/days';
import { CHAPTERS, startChapter } from '../src/content/chapter';
import { run } from '../src/state';

const isPow2 = (n: number) => n > 0 && (n & (n - 1)) === 0;

describe('第三章街景配置', () => {
  it('三個主題都有遠景、路面、沿路的房子，而且都畫了', () => {
    for (const t of PLAIN_THEMES) {
      const s = PLAIN_SPEC[t];
      expect(PLAIN_ART[s.far], `${t} far`).toBeTruthy();
      expect(PLAIN_ART[s.road], `${t} road`).toBeTruthy();
      expect(s.props.length, t).toBeGreaterThanOrEqual(5);
      for (const k of s.props) expect(PLAIN_ART[k], k).toBeTruthy();
    }
    // 只有渡口有溪面
    expect(PLAIN_SPEC.ferry.water).toBe('x3_water');
    expect(PLAIN_SPEC.village.water).toBeUndefined();
    expect(PLAIN_SPEC.duckfarm.water).toBeUndefined();
  });

  it('各主題的招牌元素都在：庄頭（柑仔店、檳榔攤、電線桿、五營旗竿）、鴨母寮（鴨寮、水塘、鴨群）、渡口（石階、竹筏、茶攤、蘆葦）', () => {
    const has = (t: keyof typeof PLAIN_SPEC, ks: PlainArtKey[]) => ks.every((k) => PLAIN_SPEC[t].props.includes(k));
    expect(has('village', ['x3_shop', 'x3_betel', 'x3_pole', 'x3_flagpole'])).toBe(true);
    expect(has('duckfarm', ['x3_shed', 'x3_pond', 'x3_ducks', 'x3_fence', 'x3_feed'])).toBe(true);
    expect(has('ferry', ['x3_steps', 'x3_raft', 'x3_teastall', 'x3_reeds'])).toBe(true);
  });

  it('會捲動的長條貼圖寬度是 2 的次方（無縫接續）；路面高度和其他街景一樣', () => {
    for (const t of PLAIN_THEMES) {
      const s = PLAIN_SPEC[t];
      for (const k of [s.far, s.road, s.water, s.near].filter(Boolean) as PlainArtKey[]) expect(isPow2(PLAIN_ART[k][0]), k).toBe(true);
      expect(PLAIN_ART[s.road][1]).toBe(FIELD_H - (GROUND_Y - 90));
    }
  });

  it('遠景下緣接到路面（中間不會露出天空）', () => {
    for (const t of PLAIN_THEMES) {
      const s = PLAIN_SPEC[t];
      // 路面從 GROUND_Y - 90 開始；遠景下緣 GROUND_Y - farLift；有溪面的話溪面要從遠景下緣接到護岸
      if (s.water) {
        const waterTop = GROUND_Y - 88 - PLAIN_ART[s.water][1];
        expect(waterTop, t).toBeLessThanOrEqual(GROUND_Y - s.farLift);
      } else expect(s.farLift, t).toBeLessThanOrEqual(90);
    }
  });

  it('夜版本：貼圖名稱加 N', () => {
    const d = plainLayers('village', false);
    const n = plainLayers('village', true);
    expect(d.far).toBe('x3_plainFar');
    expect(n.far).toBe('x3_plainFarN');
    expect(n.road).toBe('x3_roadN');
    expect(n.props.every((k) => k.endsWith('N'))).toBe(true);
    expect(plainLayers('ferry', true).water).toBe('x3_waterN');
  });

  it('正式背景圖的開關：有圖就用圖；近景用圖時不再擺程式畫的房子', () => {
    expect(BG_FILES).toEqual([]); // 目前還沒有正式圖（§7 Q10）
    const none = plainLayers('duckfarm', false, () => false);
    expect(none.farImage).toBe(false);
    expect(none.props.length).toBeGreaterThan(0);
    const farOnly = plainLayers('duckfarm', false, (k) => k === bgImageKey('duckfarm', 'far'));
    expect(farOnly.far).toBe('bg_duckfarm_far');
    expect(farOnly.farImage).toBe(true);
    expect(farOnly.props.length).toBeGreaterThan(0);
    const both = plainLayers('village', true, () => true);
    expect(both.far).toBe('bg_village_far');
    expect(both.near).toBe('bg_village_near');
    expect(both.nearImage).toBe(true);
    expect(both.props).toEqual([]);
  });

  it('溪水流向：平常往左（順流），倒流往右而且更急', () => {
    expect(riverFlow(false)).toBeGreaterThan(0);
    expect(riverFlow(true)).toBeLessThan(0);
    expect(Math.abs(riverFlow(true))).toBeGreaterThan(Math.abs(riverFlow(false)));
  });

  it('只有第三章的主題算「新瀛街景」', () => {
    for (const t of ['village', 'duckfarm', 'ferry']) expect(isPlainTheme(t)).toBe(true);
    for (const t of ['city', 'mixed', 'hill', 'harbor', 'shore']) expect(isPlainTheme(t)).toBe(false);
  });
});

describe('第三章行程用到的街景', () => {
  it('三天：第一、二天庄頭街景，第三天溪邊渡口；庄頭線岔路進鴨母寮', () => {
    expect(DAY_PLANS3[1].theme).toBe('village');
    expect(DAY_PLANS3[2].theme).toBe('village');
    expect(DAY_PLANS3[3].theme).toBe('ferry');
    expect(DAY_PLANS3[1].routes.find((r) => r.name === '庄頭線')?.theme).toBe('duckfarm');
    for (const p of [DAY_PLANS3[1], DAY_PLANS3[2], DAY_PLANS3[3]]) {
      expect(isPlainTheme(p.theme)).toBe(true);
      for (const r of p.routes) if (r.theme) expect(isPlainTheme(r.theme)).toBe(true);
    }
  });

  it('第三天溪水倒流；前兩章沒有這個設定', () => {
    expect(DAY_PLANS3[3].reverseRiver).toBe(true);
    expect(DAY_PLANS3[1].reverseRiver).toBeFalsy();
    for (const ch of Object.values(CHAPTERS)) {
      if (ch.id === 'xinying') continue;
      for (const p of Object.values(ch.days)) {
        expect(p.reverseRiver, `${ch.id} ${p.title}`).toBeFalsy();
        expect(isPlainTheme(p.theme)).toBe(false);
        for (const r of p.routes) expect(r.theme).toBeUndefined();
      }
    }
  });
});

describe('第三章白天隊伍', () => {
  it('順序：五營旗 → 章 → 霄 → 太子神轎 → 柳 → 廉 → 營兵（面向右，x 由大到小）', () => {
    const line = bandLine3(0);
    expect(line.slice(0, 6).map((b) => b[0])).toEqual(['w3_flags', 'w3_zhang', 'w3_xiao', 'w3_palanquin', 'w3_liu', 'w3_lian']);
    for (let i = 1; i < line.length; i++) expect(line[i][1]).toBeLessThan(line[i - 1][1]);
  });

  it('營兵依收編數量變多：最少 2、最多 6；小旗依五營輪流', () => {
    const soldiers = (n: number) => bandLine3(n).filter((b) => b[0].startsWith('w3_soldier'));
    expect(soldiers(0).length).toBe(SOLDIER_MIN);
    expect(soldiers(1).length).toBe(SOLDIER_MIN + 1);
    expect(soldiers(3).length).toBe(SOLDIER_MIN + 3);
    expect(soldiers(20).length).toBe(SOLDIER_MAX);
    expect(soldiers(-3).length).toBe(SOLDIER_MIN);
    expect(soldiers(20).map((b) => b[0])).toEqual(['w3_soldier0', 'w3_soldier1', 'w3_soldier2', 'w3_soldier3', 'w3_soldier4', 'w3_soldier0']);
  });

  it('CHAPTER3.band 依目前這一局編入五營的鬼數畫營兵', () => {
    startChapter('xinying');
    const before = CHAPTER3.band(1).filter((b) => b[0].startsWith('w3_soldier')).length;
    run.cases.hutou = { verdict: 'recruit', truths: [] };
    run.cases.dubo = { verdict: 'recruit', truths: [] };
    run.cases.shuigui = { verdict: 'slay', truths: [] };
    const after = CHAPTER3.band(1).filter((b) => b[0].startsWith('w3_soldier')).length;
    expect(after).toBe(before + 2);
    startChapter('wanjia');
  });
});

describe('第三章貼圖都有畫', () => {
  const art = import.meta.glob('../src/art/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  const scenes = import.meta.glob('../src/scenes/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  const artSrc = Object.values(art).join('\n');
  const drawn = (k: string) => {
    if (artSrc.includes(`'${k}'`)) return true;
    // 背景貼圖由 PLAIN_ART 逐一畫白天與夜版本（夜版本名字後面加 N）
    const base = k.endsWith('N') ? k.slice(0, -1) : k;
    return base in PLAIN_ART;
  };

  it('場景裡直接引用的第三章貼圖（x3_／b3_／w3_／jiao）都畫了', () => {
    const src = Object.values(scenes).join('\n');
    const keys = new Set([...src.matchAll(/'((?:x3|b3|w3)_[A-Za-z0-9]+|jiao(?:_rise)?)'/g)].map((m) => m[1]));
    // `x3_riverFar${n}` 這種組字串的寫法也要算到
    for (const m of src.matchAll(/`(x3_[A-Za-z0-9]+)\$\{n\}`/g)) { keys.add(m[1]); keys.add(`${m[1]}N`); }
    expect(keys.size).toBeGreaterThan(8);
    for (const k of keys) expect(drawn(k), k).toBe(true);
  });

  it('戰鬥圖：太子、四將、蛟（兩種姿勢）、蝦兵、乾坤圈、風火輪、火痕、水牆、單隻白鴨', () => {
    for (const k of ['b3_taizi', 'b3_zhang', 'b3_xiao', 'b3_liu', 'b3_lian', 'jiao', 'jiao_rise', 'xia', 'x3_ring', 'x3_wheel', 'x3_firetrail', 'x3_wave', 'x3_duck', 'w3_palanquin']) {
      expect(artSrc.includes(`'${k}'`), k).toBe(true);
    }
  });

  it('暫代美術都有標記', () => {
    for (const f of ['xinying.ts', 'xinyingScenery.ts', 'xinyingBattle.ts', 'xinyingSpec.ts']) {
      const key = Object.keys(art).find((p) => p.endsWith(`/${f}`));
      expect(key, f).toBeTruthy();
      expect(art[key!], f).toContain('暫代');
    }
  });
});
