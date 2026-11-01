/**
 * 第三章美術：街景配置、正式圖的替換開關、溪水流向、白天隊伍、貼圖名稱都有畫（第 2 階段）；
 * 正式背景、戰鬥圖、哨仔伯／阿旺立繪接上（第 8 階段）。
 * 繪製本身要 Phaser（瀏覽器），這裡測的是 art/xinyingSpec.ts 的純資料與純函式、public/ 裡的檔案，
 * 再用原始碼比對確認場景引用到的第三章貼圖名稱都有畫。
 */
import { describe, it, expect } from 'vitest';
import {
  BATTLE_ART, BATTLE_FILES, BG_FILES, BOSS_NIGHT_BG, PLAIN_ART, PLAIN_SPEC, PLAIN_THEMES, SOLDIER_MAX, SOLDIER_MIN,
  bandLine3, battleArtFit, bgImageKey, isPlainTheme, jiaoOrigin, plainLayers, riverFlow, type PlainArtKey,
} from '../src/art/xinyingSpec';
import { SETS, THUMB } from '../src/art/portraits.data';
import { FIELD_H, FIELD_W, GROUND_Y } from '../src/theme';
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

  it('渡口：遠景用正式圖時，程式畫的溪面改成半透明疊在圖裡的溪面上（倒流還看得到水紋）', () => {
    const drawn = plainLayers('ferry', false, () => false);
    expect(drawn.waterLift).toBe(88);
    expect(drawn.waterH).toBe(PLAIN_ART.x3_water[1]);
    expect(drawn.waterAlpha).toBe(1);
    const img = plainLayers('ferry', false, () => true);
    expect(img.water).toBe('x3_water');
    expect(img.waterLift).toBeGreaterThan(88);
    expect(img.waterAlpha).toBeGreaterThan(0);
    expect(img.waterAlpha).toBeLessThan(1);
    // 疊的那條溪面在遠景圖的範圍裡（遠景圖 260 高，下緣在 GROUND_Y - farLift）
    expect(img.waterLift).toBeGreaterThanOrEqual(img.farLift);
    expect(img.waterLift + img.waterH!).toBeLessThanOrEqual(img.farLift + 260);
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

/** public/ 裡的圖（data URL）：放進來的檔案都會列在這裡，沒有的就是 undefined */
const files = import.meta.glob('../public/{bg,battle,portraits}/*.webp', { query: '?inline', import: 'default', eager: true }) as Record<string, string>;
const pub = (p: string): string | undefined => files[`../public/${p}`];
const existsSync = (f: string | undefined) => !!f;

/** 讀 webp 的寬高（VP8X／VP8L／VP8 三種格式） */
function webpSize(file: string | undefined): [number, number] {
  expect(file).toBeTruthy();
  const bin = atob(file!.slice(file!.indexOf(',') + 1, file!.indexOf(',') + 1 + 64));
  const u8 = (i: number) => bin.charCodeAt(i);
  const le = (i: number, n: number) => { let v = 0; for (let k = n - 1; k >= 0; k--) v = v * 256 + u8(i + k); return v; };
  expect(bin.slice(0, 4)).toBe('RIFF');
  expect(bin.slice(8, 12)).toBe('WEBP');
  const kind = bin.slice(12, 16);
  if (kind === 'VP8X') return [1 + le(24, 3), 1 + le(27, 3)];
  if (kind === 'VP8L') {
    const bits = le(21, 4);
    return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
  }
  return [le(26, 2) & 0x3fff, le(28, 2) & 0x3fff];
}

describe('第三章正式美術（第 8 階段接上）', () => {
  it('六張街景背景＋最後一戰的夜景都列在 BG_FILES，檔案在、尺寸對（遠景 2048×260、近景 2048×400、夜景 1280×720）', () => {
    for (const t of PLAIN_THEMES) {
      expect(BG_FILES).toContain(bgImageKey(t, 'far'));
      expect(BG_FILES).toContain(bgImageKey(t, 'near'));
      expect(webpSize(pub(`bg/${bgImageKey(t, 'far')}.webp`))).toEqual([2048, 260]);
      expect(webpSize(pub(`bg/${bgImageKey(t, 'near')}.webp`))).toEqual([2048, 400]);
    }
    expect(BG_FILES).toContain(BOSS_NIGHT_BG);
    expect(webpSize(pub(`bg/${BOSS_NIGHT_BG}.webp`))).toEqual([FIELD_W, FIELD_H]);
    expect(new Set(BG_FILES).size).toBe(BG_FILES.length);
  });

  it('戰鬥圖：太子、四將、蛟兩種姿勢都有檔案、尺寸照美術師給的', () => {
    expect([...BATTLE_FILES].sort()).toEqual(['b3_lian', 'b3_liu', 'b3_taizi', 'b3_xiao', 'b3_zhang', 'jiao', 'jiao_rise']);
    const want: Record<string, [number, number]> = {
      jiao: [1024, 720], jiao_rise: [1024, 720], b3_taizi: [600, 800], b3_zhang: [480, 640], b3_xiao: [480, 640], b3_liu: [480, 640], b3_lian: [480, 640],
    };
    for (const k of BATTLE_FILES) {
      const f = pub(`battle/${k}.webp`);
      expect(existsSync(f), k).toBe(true);
      expect(webpSize(f), k).toEqual(want[k]);
    }
  });

  it('戰鬥圖縮放：正式圖縮到和暫代圖一樣高（太子、四將剛好同尺寸）；暫代圖本身、其他貼圖都是 1 倍', () => {
    expect(battleArtFit('b3_taizi', 800) * 800).toBeCloseTo(BATTLE_ART.b3_taizi[1]);
    expect(battleArtFit('b3_taizi', 800) * 600).toBeCloseTo(BATTLE_ART.b3_taizi[0]);
    expect(battleArtFit('b3_zhang', 640) * 640).toBeCloseTo(160);
    expect(battleArtFit('b3_zhang', 640) * 480).toBeCloseTo(120);
    expect(battleArtFit('jiao', 720) * 720).toBeCloseTo(420);
    for (const k of BATTLE_FILES) expect(battleArtFit(k, BATTLE_ART[k][1]), k).toBe(1);
    expect(battleArtFit('shiju', 300)).toBe(1);
    expect(battleArtFit('xia', 500)).toBe(1);
  });

  it('蛟的錨點：暫代圖照舊（頭在最左邊）；正式圖頭在圖中間偏左，浪頭升起那張更靠右', () => {
    expect(jiaoOrigin('jiao', 520)).toEqual([0.12, 0.92]);
    expect(jiaoOrigin('jiao_rise', 520)).toEqual([0.12, 0.92]);
    const [x, y] = jiaoOrigin('jiao', 1024);
    expect(x).toBeGreaterThan(0.3);
    expect(x).toBeLessThan(0.6);
    expect(y).toBeGreaterThan(0.8);
    expect(jiaoOrigin('jiao_rise', 1024)[0]).toBeGreaterThan(x);
  });

  it('場景都經過 fitBattleArt 顯示戰鬥圖；正式圖先用暫時的名字載，載完才蓋掉程式畫的（檔案不在就留著暫代圖）', () => {
    const scenes = import.meta.glob('../src/scenes/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const src = (f: string) => scenes[Object.keys(scenes).find((p) => p.endsWith(`/${f}`))!];
    expect(src('BossScene.ts')).toContain('fitBattleArt');
    expect(src('BossScene.ts')).toContain('BOSS_NIGHT_BG');
    expect(src('CutScene.ts')).toContain('fitBattleArt');
    expect(src('StoryScene.ts')).toContain('fitBattleArt');
    const asset = src('AssetScene.ts');
    expect(asset).toContain('BATTLE_FILES');
    expect(asset).toContain('renameTexture');
    expect(asset).toContain('filecomplete-image-');
  });

  it('立繪：哨仔伯、阿旺各有 normal／relieved／sad，檔案在、420×560；小頭像裁切位置照美術師給的', () => {
    expect(SETS.shaozaibo).toEqual(['normal', 'relieved', 'sad']);
    expect(SETS.awang).toEqual(['normal', 'relieved', 'sad']);
    expect(THUMB.awang).toEqual([0.105, 0.007]);
    expect(THUMB.shaozaibo).toEqual([0.14, 0.005]);
    for (const id of ['shaozaibo', 'awang']) {
      for (const e of SETS[id]) expect(webpSize(pub(`portraits/${id}_${e}.webp`)), `${id}_${e}`).toEqual([420, 560]);
    }
  });

  it('SETS 列的每一張立繪都有檔案，每個角色都有小頭像裁切位置', () => {
    for (const [id, es] of Object.entries(SETS)) for (const e of es) expect(existsSync(pub(`portraits/${id}_${e}.webp`)), `${id}_${e}`).toBe(true);
    expect(Object.keys(THUMB).sort()).toEqual(Object.keys(SETS).sort());
  });
});
