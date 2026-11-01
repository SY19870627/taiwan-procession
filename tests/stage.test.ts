/**
 * 引擎內演出（第一二章熱鬧化計畫第 1 階段）：
 *  - 每段腳本只是換個演法：對應的過場存在、原台詞一字不差且每句都有演到、補寫的標 draft；
 *  - 演員／泡泡／走位／狀聲字指到的 id 都存在；用到的貼圖都有程式畫的暫代；
 *  - art/stageSpec.ts 的檔名和計畫 §5 一致；新說話者都在 SPEAKERS；
 *  - 手機直式版面：地平線、演員大小、前景、字幕區、泡泡不出界。
 */
import { describe, expect, it } from 'vitest';
import { ART, CUTSCENES, SPEAKERS } from '../src/content/story';
import { STAGES } from '../src/content/stage';
import { STAGE_ART, STAGE_EXTRA, STAGE_FILES, STAGE_PORTRAIT_FILES, STAGE_PORTRAITS, STAGE_SIZES } from '../src/art/stageSpec';
import { FAR_MAX_H, NEAR_WALK, STAGE_MAX_K, actorScale, bubbleBox, farBandHeight, nearBand, pickFar, stageLayout, stageSize } from '../src/core/stageLayout';
import { BATTLE_ART, BG_FILES, PLAIN_ART } from '../src/art/xinyingSpec';
import { CASES3 } from '../src/content/ch3/cases';
import { isBorrowedPortrait, portraitKey } from '../src/art/portraits';
import { BASE_H, W } from '../src/theme';

const raw = import.meta.glob(['../src/art/*.ts', '../src/scenes/*.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const src = (f: string) => raw[Object.keys(raw).find((p) => p.endsWith(`/${f}`))!];
const plan = Object.values(import.meta.glob('../docs/第一二章_熱鬧化計畫.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>)[0];
/** public/stage/ 裡已經放進來的畫師檔案 */
const stageFiles = Object.keys(import.meta.glob('../public/stage/*', { eager: false })).map((p) => p.split('/').pop()!);
/** 畫師交的圖（data URL）：public/stage/ 全部、public/portraits/ 裡 A 組的角色 */
const artistFiles = import.meta.glob(['../public/stage/*.webp', '../public/portraits/{wupan,qiye,baye,baoma,xunbu,jiaoban}_*.webp'], { query: '?inline', import: 'default', eager: true }) as Record<string, string>;

/** 程式畫的貼圖名：美術程式與 BootScene 裡出現的字串，加上 `flag${i}` 這種一整組的 */
function drawnTextures(): { names: Set<string>; families: string[] } {
  const names = new Set<string>();
  const families: string[] = [];
  for (const [p, s] of Object.entries(raw)) {
    if (!p.includes('/art/') && !p.endsWith('/BootScene.ts')) continue;
    for (const m of s.matchAll(/'([A-Za-z0-9_]+)'/g)) names.add(m[1]);
    // `flag${i}`、`jb_${k}` 這種一整組的
    for (const m of s.matchAll(/`([A-Za-z0-9_]+)\$\{\w+\}`/g)) families.push(m[1]);
  }
  return { names, families };
}

describe('演出腳本', () => {
  const { names, families } = drawnTextures();
  // 第三章街景的夜版本是 `${key}N`（xinyingScenery.ts 照 PLAIN_ART 一張一張畫）
  const drawn = (k: string) => names.has(k) || families.some((f) => new RegExp(`^${f}[a-z0-9]+$`).test(k)) || (k.endsWith('N') && k.slice(0, -1) in PLAIN_ART);

  it('第 1 階段至少有第一章的 recall、dusk3', () => {
    expect(STAGES.recall).toBeDefined();
    expect(STAGES.dusk3).toBeDefined();
  });

  for (const [id, sc] of Object.entries(STAGES)) {
    it(`${id}：對應的過場存在、照抄台詞、每句都演到、補寫的標 draft`, () => {
      expect(sc.id).toBe(id);
      const cs = CUTSCENES[id];
      expect(cs, id).toBeDefined();
      const used = new Set<number>();
      for (const b of sc.beats) {
        if (b.src !== undefined) {
          expect(b.text, `${id} 第 ${b.src} 句`).toBe(cs.lines[b.src].text);
          expect(b.who, `${id} 第 ${b.src} 句`).toBe(cs.lines[b.src].who);
          expect(b.draft, `${id} 原台詞不能標 draft`).toBeUndefined();
          used.add(b.src);
        } else expect(b.draft, `${id}「${b.text}」不是原台詞就要標 draft【待定】`).toBe(true);
      }
      expect([...used].sort((a, b) => a - b)).toEqual(cs.lines.map((_, i) => i));
      // 照原本的順序演
      const order = sc.beats.filter((b) => b.src !== undefined).map((b) => b.src!);
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });

    it(`${id}：演員、泡泡、走位、狀聲字的 id 都存在；說話的人都在 SPEAKERS`, () => {
      const ids = sc.actors.map((a) => a.id);
      expect(new Set(ids).size, `${id} 演員 id 重複`).toBe(ids.length);
      const has = new Set(ids);
      for (const b of sc.beats) {
        if (b.at) expect(has.has(b.at), `${id} 泡泡 ${b.at}`).toBe(true);
        for (const m of b.moves ?? []) expect(has.has(m.id), `${id} 走位 ${m.id}`).toBe(true);
        if (b.sfx) expect(has.has(b.sfx.at), `${id} 狀聲字 ${b.sfx.at}`).toBe(true);
        if (b.who && b.who !== 'narrator') expect(SPEAKERS[b.who], `${id} 說話的人 ${b.who}`).toBeDefined();
        // 泡泡要有名字可以掛（name 或 who）
        if (b.at) expect(b.name ?? (b.who && b.who !== 'narrator' ? SPEAKERS[b.who].name : ''), `${id}「${b.text}」`).toBeTruthy();
        expect(b.text.length).toBeGreaterThan(0);
      }
    });

    it(`${id}：用到的貼圖都有程式畫的暫代`, () => {
      const tex = [...sc.actors.map((a) => a.tex), ...sc.beats.flatMap((b) => (b.moves ?? []).flatMap((m) => (m.tex ? [m.tex] : [])))];
      // 遠景有暫代（farAlt）的：正式圖要在 BG_FILES（會被載入），暫代要有畫
      if (sc.far && sc.farAlt) {
        expect(BG_FILES, `${id} 遠景 ${sc.far}`).toContain(sc.far);
        tex.push(sc.farAlt);
      } else if (sc.far) tex.push(sc.far);
      // 近景（溪邊堤防）沒有暫代：沒載到就不畫，但檔名要在 BG_FILES
      if (sc.near) expect(BG_FILES, `${id} 近景 ${sc.near}`).toContain(sc.near);
      if (sc.temple) tex.push(sc.temple);
      for (const k of tex) expect(drawn(k), `${id} 貼圖 ${k}`).toBe(true);
    });
  }

  it('第 2 階段：第一章 7 段過場都有演出；新的 5 段每段 ≤ 8 句', () => {
    const ch1 = ['recall', 'dusk3', 'anfang1', 'shanlu1', 'shijuReturn1', 'shijuSlay1', 'huigong1'];
    for (const id of ch1) expect(STAGES[id], id).toBeDefined();
    for (const id of ch1.slice(2)) {
      expect(CUTSCENES[id].lines.length, id).toBeGreaterThan(0);
      expect(CUTSCENES[id].lines.length, id).toBeLessThanOrEqual(8);
    }
    // retreat 目前沒有場景會播（計畫 Q16）：不寫演出
    expect(STAGES.retreat).toBeUndefined();
  });

  it('第 3 階段：第二章 7 段過場都有演出；新的 5 段每段 ≤ 8 句、海邊場景用海的遠景與浪花前景', () => {
    const ch2 = ['tide3', 'sendoff', 'qingwang2', 'qianchuan2', 'heichaoReturn2', 'heichaoSlay2', 'songwang2'];
    for (const id of ch2) expect(STAGES[id], id).toBeDefined();
    for (const id of ch2.slice(2)) {
      expect(CUTSCENES[id].lines.length, id).toBeGreaterThan(0);
      expect(CUTSCENES[id].lines.length, id).toBeLessThanOrEqual(8);
    }
    for (const id of ch2) {
      const sc = STAGES[id];
      if (CUTSCENES[id].bg !== 'sea') continue;
      expect(sc.fore, id).toBe('sea');
      expect(['seaFar', 'seaFarN'], id).toContain(sc.far);
      // 晚上（妖怪視角）用夜裡的海
      expect(sc.far, id).toBe(sc.mood === 'demon' ? 'seaFarN' : 'seaFar');
    }
    // 王船：tide3、qianchuan2、sendoff 都有；sendoff 點火那拍換成燒的那張
    for (const id of ['tide3', 'qianchuan2', 'sendoff']) expect(STAGES[id].actors.some((a) => a.tex === 'st_wangchuan'), id).toBe(true);
    const fire = STAGES.sendoff.beats.find((b) => b.src === 2)!;
    expect(fire.moves?.find((m) => m.id === 'ship')?.tex).toBe('st_wangchuan_fire');
    // 黑潮的五個人影只在一起送走時出現
    expect(STAGES.sendoff.actors.some((a) => a.tex === 'st_heichao_figures')).toBe(true);
    // 第二章的說話者是中軍府、巡捕、轎班，不混進第一章的隨從
    for (const id of ch2) {
      for (const b of STAGES[id].beats) expect(['wupan', 'qiye', 'baye', 'baoma', 'judge', 'god', 'kaijiang'], `${id}「${b.text}」`).not.toContain(b.who);
    }
  });

  it('第 4 階段：第三章 8 段過場都有演出；太子、四將用戰鬥圖、泡泡放立繪小頭像，不用旨意', () => {
    const ch3 = ['kaiying3', 'zhizha3', 'river3', 'jiao3', 'jiaoRecall', 'jiaoSlay3', 'jiaoReturn3', 'shouying3'];
    const ch3Who = ['narrator', 'taizi', 'zhangjiang', 'xiaojiang', 'liujiang', 'lianjiang', 'jiao', 'jiaoCalm', 'zhizha', 'xiabing', 'bingbo', 'hebo'];
    for (const id of ch3) {
      const sc = STAGES[id];
      expect(sc, id).toBeDefined();
      expect(sc.faces, id).toBe(true);
      // 第三章神明畫臉（決策紀錄 2026-10-27）：沒有旨意
      expect(sc.actors.some((a) => a.tex === 'decree'), id).toBe(false);
      // 說話的人都是第三章的角色（不混進第一、二章的隨從）
      for (const b of sc.beats) expect(ch3Who, `${id}「${b.text}」`).toContain(b.who ?? 'narrator');
      // 太子說話時泡泡掛在太子的戰鬥圖上
      for (const b of sc.beats.filter((x) => x.who === 'taizi')) {
        expect(sc.actors.find((a) => a.id === b.at)?.tex, id).toBe('b3_taizi');
      }
      // 第三章原本台詞就夠多，不補寫（只有狀聲字）
      expect(sc.beats.some((b) => b.draft), id).toBe(false);
    }
    // 溪邊：正式遠景＋堤防，沒載到用程式畫的；晚上用夜版本並把正式圖壓暗
    for (const id of ch3) {
      if (CUTSCENES[id].bg !== 'river') continue;
      const sc = STAGES[id];
      expect(sc.far, id).toBe('bg_ferry_far');
      expect(sc.near, id).toBe('bg_ferry_near');
      expect(sc.fore, id).toBe('river');
      expect(sc.farAlt, id).toBe(sc.mood === 'demon' ? 'x3_riverFarN' : 'x3_riverFar');
      if (sc.mood === 'demon') expect(sc.farTint, id).toBeDefined();
      // 蛟、蝦兵在溪裡（堤防後面），岸上的人站在堤防前面
      for (const a of sc.actors) {
        if (a.tex === 'jiao' || a.tex === 'xia') expect(a.behind, `${id} ${a.id}`).toBe(true);
        if (a.tex.startsWith('b3_') || a.tex.startsWith('n3_')) expect(a.behind, `${id} ${a.id}`).toBeUndefined();
      }
    }
    // 蛟現身那段：浪頭升起換圖
    expect(STAGES.jiao3.beats.some((b) => b.moves?.some((m) => m.id === 'jiao' && m.tex === 'jiao_rise'))).toBe(true);
    // 紙紮童跪下仍然是蓋在畫面上播的那段
    expect(Object.values(CASES3).some((c) => c.kneelStory === 'zhizha3')).toBe(true);
  });

  it('翻面、轉角度的走位只用在有那個演員的拍子上；石駒回頭那拍有翻面', () => {
    const ret = STAGES.shijuReturn1;
    const look = ret.beats.find((b) => b.src === 4)!;
    // 畫師的「回頭」臉朝左：走回山裡時翻面（朝右），回頭那拍翻回來（朝左看隊伍）
    expect(ret.beats[0].moves?.find((m) => m.id === 'shiju')?.flip).toBe(true);
    expect(look.moves?.find((m) => m.id === 'shiju')?.flip).toBe(false);
    for (const sc of Object.values(STAGES)) {
      for (const b of sc.beats) for (const m of b.moves ?? []) {
        if (m.angle !== undefined) expect(Math.abs(m.angle), sc.id).toBeLessThanOrEqual(180);
      }
    }
  });

  it('所有過場裡的神明那一拍沒有隨從插話（旨意說話時泡泡掛在旨意上）', () => {
    for (const sc of Object.values(STAGES)) {
      for (const b of sc.beats) {
        if (b.who === 'kaijiang' || b.who === 'god' || b.who === 'yun') expect(b.at, sc.id).toBe('decree');
      }
    }
  });
});

describe('美術檔名（計畫 §5）', () => {
  it('讀得到計畫檔', () => expect(plan).toContain('B 組'));

  it('A 組 12 張立繪：檔名和計畫一致', () => {
    expect(STAGE_PORTRAIT_FILES.sort()).toEqual([
      'baoma_normal.webp', 'baoma_smile.webp', 'baye_angry.webp', 'baye_normal.webp', 'jiaoban_normal.webp', 'jiaoban_smile.webp',
      'qiye_normal.webp', 'qiye_smile.webp', 'wupan_angry.webp', 'wupan_normal.webp', 'xunbu_angry.webp', 'xunbu_normal.webp',
    ]);
    for (const f of STAGE_PORTRAIT_FILES) expect(plan, f).toContain(f);
  });

  it('B 組 11 張 st_ 小人：檔名、尺寸和計畫一致', () => {
    expect(STAGE_FILES).toHaveLength(11);
    for (const k of STAGE_FILES) {
      const [w, h] = STAGE_ART[k];
      // 計畫的表格：| … | `st_xxx.webp` | 240×480 | … |
      expect(plan, k).toMatch(new RegExp(`\`${k}\\.webp\` \\| ${w}×${h} \\|`));
    }
    const listed = [...plan.matchAll(/`(st_[a-z_]+)\.webp`/g)].map((m) => m[1]);
    expect([...new Set(listed)].sort()).toEqual([...STAGE_FILES].sort());
  });

  it('每張 B 組都有程式畫的暫代（art/stage.ts），AssetScene 會載入並蓋掉暫代', () => {
    const art = src('stage.ts');
    for (const k of STAGE_FILES) expect(art, k).toContain(`'${k}'`);
    for (const k of Object.keys(STAGE_EXTRA)) expect(art, k).toContain(`'${k}'`);
    const asset = src('AssetScene.ts');
    expect(asset).toContain('STAGE_FILES');
    expect(asset).toMatch(/STAGE_FILES[\s\S]*replaceTexture/);
    expect(src('BootScene.ts')).toContain('makeStageArt');
  });

  it('石駒的細緻暫代只給演出用：最後一戰不用 st_ 貼圖', () => {
    expect(src('BossScene.ts')).not.toMatch(/st_shiju/);
  });

  it('畫師已經交的圖：尺寸照 §5（立繪 420×560、st_ 照表）', () => {
    const size = (b64: string): [number, number] => {
      const b = Uint8Array.from(atob(b64.split(',')[1]), (c) => c.charCodeAt(0));
      const u24 = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
      const tag = String.fromCharCode(...b.slice(12, 16));
      if (tag === 'VP8X') return [1 + u24(24), 1 + u24(27)];
      if (tag === 'VP8L') {
        const v = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
        return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1];
      }
      return [(b[26] | (b[27] << 8)) & 0x3fff, (b[28] | (b[29] << 8)) & 0x3fff];
    };
    for (const [p, data] of Object.entries(artistFiles)) {
      const f = p.split('/').pop()!;
      const k = f.replace(/\.webp$/, '');
      if (p.includes('/stage/')) expect(size(data), f).toEqual([...STAGE_ART[k as keyof typeof STAGE_ART]]);
      else if (STAGE_PORTRAIT_FILES.includes(f)) expect(size(data), f).toEqual([420, 560]);
    }
  });

  it('public/ 裡已經有的畫師檔案，檔名都在清單上（不在清單的不會被載入）', () => {
    for (const f of stageFiles) expect(STAGE_FILES.map((k) => `${k}.webp`), f).toContain(f);
  });
});

describe('新說話者與立繪', () => {
  it('新說話者都在 SPEAKERS，暫代貼圖有畫', () => {
    const { names } = drawnTextures();
    for (const id of ['wupan', 'qiye', 'baye', 'xunbu', 'jiaoban', 'baoma', 'judge', 'zhongjun'] as const) {
      expect(SPEAKERS[id], id).toBeDefined();
      expect(names.has(SPEAKERS[id].tex), `${id} 貼圖 ${SPEAKERS[id].tex}`).toBe(true);
    }
    expect(SPEAKERS.wupan.name).toBe('武判官');
    expect(SPEAKERS.xunbu.name).toBe('巡捕');
    // 立繪交了就會用（ART 指到 A 組的角色）
    for (const id of Object.keys(STAGE_PORTRAITS)) expect(ART[id as keyof typeof ART]?.[0], id).toBe(id);
  });

  /** 假的場景：只有這些貼圖存在 */
  const fake = (keys: string[]) => ({ textures: { exists: (k: string) => keys.includes(k) } }) as unknown as Parameters<typeof portraitKey>[0];

  it('武判官、巡捕的立繪還沒到：照舊借文判官、中軍府（夜審換色區分）', () => {
    const s = fake(['pt_judge_normal', 'pt_judge_angry', 'pt_zhongjun_normal']);
    expect(portraitKey(s, '武判官')).toBe('pt_judge_normal');
    expect(portraitKey(s, '武判官', 'angry')).toBe('pt_judge_angry');
    expect(portraitKey(s, '巡捕')).toBe('pt_zhongjun_normal');
    expect(isBorrowedPortrait('武判官', 'pt_judge_normal')).toBe(true);
    expect(isBorrowedPortrait('文判官', 'pt_judge_normal')).toBe(false);
    expect(portraitKey(s, '七爺')).toBeUndefined();
  });

  it('畫師的立繪到了：自動換上，不再換色', () => {
    const s = fake(['pt_judge_normal', 'pt_wupan_normal', 'pt_wupan_angry', 'pt_xunbu_normal', 'pt_qiye_normal', 'pt_baoma_smile']);
    expect(portraitKey(s, '武判官')).toBe('pt_wupan_normal');
    expect(portraitKey(s, '武判官', 'angry')).toBe('pt_wupan_angry');
    expect(isBorrowedPortrait('武判官', 'pt_wupan_normal')).toBe(false);
    expect(portraitKey(s, '巡捕', 'angry')).toBe('pt_xunbu_normal');
    expect(portraitKey(s, 'qiye')).toBe('pt_qiye_normal');
    // 只有 smile 那張也找得到
    expect(portraitKey(s, 'baoma')).toBe('pt_baoma_smile');
  });
});

describe('演出版面（手機直式）', () => {
  it('1280 高：地平線和原型一樣，演員不放大', () => {
    const L = stageLayout(BASE_H);
    expect(L.G).toBe(Math.round(BASE_H * 0.66));
    expect(L.k).toBe(1);
  });

  it('畫面越高，地平線越往下、演員越大（有上限）；前景與字幕都在畫面內', () => {
    let prev = stageLayout(BASE_H);
    for (const h of [1360, 1460, 1560]) {
      const L = stageLayout(h);
      expect(L.G).toBeGreaterThan(prev.G);
      expect(L.k).toBeGreaterThanOrEqual(prev.k);
      expect(L.k).toBeLessThanOrEqual(STAGE_MAX_K);
      prev = L;
    }
    for (const h of [1280, 1400, 1560]) {
      const L = stageLayout(h);
      // 演員腳底（腳本 y 最多 90）在前景上緣之上，前景在畫面內
      expect(L.G + 90 * L.k).toBeLessThan(L.foreTop);
      expect(L.foreTop).toBeLessThan(h - 150);
      // 畫面下 40% 是字幕區，旁白在字幕區裡
      expect(L.capTop).toBe(Math.round(h * 0.6));
      expect(L.capY).toBeGreaterThan(L.capTop + 60);
      expect(L.capY).toBeLessThan(h - 80);
    }
  });

  it('泡泡不出界、不蓋左上地名與右上略過鈕', () => {
    for (const h of [1280, 1560]) {
      const L = stageLayout(h);
      for (const [px, py] of [[0, -200], [W, 0], [W / 2, 60], [360, 900], [700, h + 100], [20, h]]) {
        const b = bubbleBox(px, py, 400, 120, L, h);
        expect(b.x).toBeGreaterThanOrEqual(12);
        expect(b.x + 400).toBeLessThanOrEqual(W - 12);
        expect(b.y).toBeGreaterThanOrEqual(100);
        expect(b.y + 120).toBeLessThanOrEqual(h - 24);
        expect(b.tipX).toBeGreaterThanOrEqual(b.x);
        expect(b.tipX).toBeLessThanOrEqual(b.x + 400);
      }
    }
  });

  it('泡泡讓開廟的匾額（修正第 2 輪：開營的泡泡蓋住「太子殿」）', () => {
    const over = (b: { x: number; y: number }, bw: number, bh: number, a: { x: number; y: number; w: number; h: number }) =>
      b.x < a.x + a.w && a.x < b.x + bw && b.y < a.y + a.h && a.y < b.y + bh;
    for (const h of [1280, 1560]) {
      const L = stageLayout(h);
      const plaque = { x: 480, y: h * 0.45, w: 110, h: 30 };
      for (const [px, bw] of [[200, 500], [300, 400], [560, 260], [650, 300], [530, 480]]) {
        const py = plaque.y + 140;
        const b = bubbleBox(px, py, bw, 110, L, h, plaque);
        expect(over(b, bw, 110, plaque), `${h} ${px} ${bw}`).toBe(false);
        expect(b.x).toBeGreaterThanOrEqual(12);
        expect(b.x + bw).toBeLessThanOrEqual(W - 12);
        expect(b.y).toBeGreaterThanOrEqual(L.bubbleTop);
        expect(b.tipY).toBeGreaterThan(b.y + 110);
        // 尾巴也不插進匾
        if (b.tipX > plaque.x - 14 && b.tipX < plaque.x + plaque.w + 14 && b.y + 110 <= plaque.y) expect(b.tipY).toBeLessThanOrEqual(plaque.y);
      }
    }
  });

  it('遠景帶照貼圖高度（最多 260），比較矮的城市剪影、海不會上下重複貼一截', () => {
    expect(farBandHeight(260)).toBe(FAR_MAX_H);
    expect(farBandHeight(400)).toBe(FAR_MAX_H);
    expect(farBandHeight(220)).toBe(220);
    expect(farBandHeight(200)).toBe(200);
    expect(farBandHeight(0)).toBe(FAR_MAX_H);
  });

  it('演出小人用設計尺寸：畫師的圖比暫代大一倍，縮放就減半（顯示一樣高）', () => {
    const [, h] = STAGE_SIZES.st_wenpan;
    expect(actorScale('st_wenpan', 0.5, 1, h)).toBeCloseTo(0.5);
    expect(actorScale('st_wenpan', 0.5, 1, h * 2) * h * 2).toBeCloseTo(0.5 * h);
    expect(actorScale('st_wenpan', 0.5, 1.2, h)).toBeCloseTo(0.6);
    // 一般貼圖不換算
    expect(actorScale('qiye', 0.95, 1, 190)).toBeCloseTo(0.95);
  });

  it('第三章戰鬥圖也用設計尺寸（BATTLE_ART）：正式圖比暫代大，演出裡一樣高', () => {
    expect(stageSize('b3_taizi')).toEqual(BATTLE_ART.b3_taizi);
    expect(stageSize('st_wenpan')).toEqual(STAGE_SIZES.st_wenpan);
    expect(stageSize('qiye')).toBeUndefined();
    const [, h] = BATTLE_ART.b3_taizi;
    // 正式圖 800 高、暫代 200 高：顯示都是 1.1 × 200
    expect(actorScale('b3_taizi', 1.1, 1, 800) * 800).toBeCloseTo(1.1 * h);
    expect(actorScale('b3_taizi', 1.1, 1, h) * h).toBeCloseTo(1.1 * h);
    expect(actorScale('jiao', 0.85, 1.2, 720) * 720).toBeCloseTo(0.85 * 1.2 * BATTLE_ART.jiao[1]);
  });

  it('遠景：正式圖有載到就用（套色），沒載到用暫代（不套色），都沒有就不畫', () => {
    const sc = { far: 'bg_ferry_far', farAlt: 'x3_riverFarN', farTint: 0x445566 };
    expect(pickFar(sc, () => true)).toEqual({ key: 'bg_ferry_far', tint: 0x445566 });
    expect(pickFar(sc, (k) => k === 'x3_riverFarN')).toEqual({ key: 'x3_riverFarN' });
    expect(pickFar(sc, () => false)).toBeUndefined();
    expect(pickFar({ far: 'mtnFarN' }, () => true)).toEqual({ key: 'mtnFarN', tint: undefined });
  });

  it('近景（溪邊堤防）：路面對齊演員腳底附近，手機直式跟著放大', () => {
    for (const h of [BASE_H, 1560]) {
      const L = stageLayout(h);
      const nb = nearBand(L.G, L.k, 400);
      expect(nb.top + nb.h * NEAR_WALK).toBeCloseTo(L.G + 20 * L.k);
      expect(nb.s).toBeCloseTo(0.55 * L.k);
      // 堤防下緣在前景上緣附近，不會留一條縫
      expect(nb.top + nb.h).toBeGreaterThan(L.G);
      expect(nb.top + nb.h).toBeLessThanOrEqual(L.foreTop + 10);
    }
  });
});

describe('原型 ?proto=stage（計畫 §7）', () => {
  it('原型播放器已移除，網址保留成 ?scene=story 的別名', () => {
    expect(Object.keys(raw).some((p) => p.endsWith('/ProtoStageScene.ts'))).toBe(false);
    const boot = src('BootScene.ts');
    expect(boot).toMatch(/proto'\) === 'stage' \? 'story'/);
  });

  it('StoryScene：有腳本就播演出、&text=1 播文字版、出錯退回文字版', () => {
    const story = src('StoryScene.ts');
    expect(story).toContain('STAGES[id]');
    expect(story).toContain('!data.text');
    expect(story).toMatch(/catch \(e\)[\s\S]*playText/);
  });
});
