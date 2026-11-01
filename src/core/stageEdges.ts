/**
 * 修正第 5 輪：角色有沒有被畫面左右邊緣裁到（純函式，tests/stageEdges.test.ts 用它檢查 22 段過場的每一拍）。
 *
 * 照播放器的算法（stageLayout、actorScale、camOffset）推出每一拍走位、鏡頭停好之後，每個角色在畫面上的左右邊界：
 *  - 角色身體（畫師圖的不透明範圍 STAGE_BODY；程式暫代用整張寬）一部分在畫面裡、一部分在外面 → 算被裁到；
 *  - 腳本放在舞台外（x < 0 或 x > 720：刻意從畫面外走進來、走出去）或透明（alpha < 0.05）的不算；
 *  - 只看角色（人、神獸、轎子、船）；煙、燈籠、旨意、旗子這些道具不看。
 * 播放器的鏡頭也用這裡的 fitCam：腳本的鏡頭裁到人就自動平移、拉遠（ui/stage.ts）。
 */
import { W } from '../theme';
import { STAGE_BODY } from '../art/stageSpec';
import type { StageScript } from '../content/stage/types';
import { CAM_MIN_ZOOM, actorScale, camOffset, camRangeX, stageLayout, stageSize, type StageLayout } from './stageLayout';

/** 程式畫的角色貼圖尺寸（沒有設計尺寸的；art/harbor.ts、art/xinying.ts、art/xinyingBattle.ts） */
const DRAWN: Record<string, readonly [number, number]> = {
  heichao: [320, 320],
  heichao_calm: [320, 320],
  chu: [90, 250],
  yanmi: [80, 110],
  xia: [90, 116],
  g3_huosha: [76, 108],
  g3_shuigui: [80, 116],
  g3_yamupo: [80, 108],
  g3_zhizha: [70, 96],
  n3_bingbo: [76, 112],
  n3_hebo: [72, 108],
  w3_soldier0: [80, 116],
  w3_soldier1: [80, 116],
  w3_soldier2: [80, 116],
  w3_soldier3: [80, 116],
  w3_soldier4: [80, 116],
};

/** 不算角色的貼圖（瓦礫；王船是佈景，寬到畫面的八成，船頭船尾出畫面是故意的） */
const PROPS = new Set(['st_rubble', 'st_wangchuan', 'st_wangchuan_fire']);

/** 這張貼圖是不是要檢查的角色；回傳顯示用的寬高（設計尺寸或程式暫代尺寸） */
function charSize(tex: string): readonly [number, number] | undefined {
  if (PROPS.has(tex)) return undefined;
  return stageSize(tex) ?? DRAWN[tex];
}

export interface EdgeCut {
  /** 第幾拍（從 0 算，&beat=N） */
  beat: number;
  id: string;
  tex: string;
  /** 身體在畫面上的左右邊界（畫面寬 720） */
  left: number;
  right: number;
  /** 超出畫面多少（左右取大的） */
  over: number;
}

/** 一個角色這一拍停好之後的身體範圍（舞台座標；鏡頭還沒套上） */
export interface ActorSpan {
  id: string;
  tex: string;
  x: number;
  left: number;
  right: number;
}

/** 每一拍走位停好之後，每個看得到的角色的身體範圍（舞台座標）與腳本寫的鏡頭（y 已乘 k） */
export function stageSpans(sc: StageScript, h: number): { cam: { x: number; y: number; zoom: number }; spans: ActorSpan[] }[] {
  const L = stageLayout(h);
  const st = new Map(sc.actors.map((a) => [a.id, { tex: a.tex, x: a.x, scale: a.scale, alpha: a.alpha ?? 1, flip: !!a.flip }]));
  let cam = { x: W / 2, y: 0, zoom: 1 };
  return sc.beats.map((beat) => {
    if (beat.cam) cam = { x: beat.cam.x, y: beat.cam.y * L.k, zoom: beat.cam.zoom };
    for (const m of beat.moves ?? []) {
      const a = st.get(m.id);
      if (!a) continue;
      if (m.x !== undefined) a.x = m.x;
      if (m.alpha !== undefined) a.alpha = m.alpha;
      if (m.scale !== undefined) a.scale = m.scale;
      if (m.tex) a.tex = m.tex;
      if (m.flip !== undefined) a.flip = m.flip;
    }
    const spans: ActorSpan[] = [];
    for (const [id, a] of st) {
      const size = charSize(a.tex);
      if (!size || a.alpha < 0.05) continue;
      // 設計尺寸的圖：actorScale 以設計高度為準，顯示寬 = 設計寬 × scale × k
      const dw = size[0] * actorScale(a.tex, a.scale, L.k, size[1]);
      const [l0, r0] = STAGE_BODY[a.tex] ?? [0, 1];
      const [bl, br] = a.flip ? [1 - r0, 1 - l0] : [l0, r0];
      spans.push({ id, tex: a.tex, x: a.x, left: a.x - dw / 2 + dw * bl, right: a.x - dw / 2 + dw * br });
    }
    return { cam: { ...cam }, spans };
  });
}

/** 刻意在舞台外的角色（腳本把他放在 x < 0 或 x > W：等著走進來、已經走出去）不檢查 */
const offstage = (s: ActorSpan) => s.x < 0 || s.x > W;

/** 巨大的妖怪（蛟、黑潮）：身體比半個畫面還寬，尾巴、潮水出畫面是構圖，身體露出 75% 以上就不算裁到 */
const GIANT = new Set(['jiao', 'jiao_rise', 'heichao', 'heichao_calm']);
const GIANT_OUT = 0.25;

/** 這個角色在畫面上超出左右邊緣多少（整個在畫面外、或整個在畫面內都是 0） */
function cutBy(s: ActorSpan, t: { x: number; z: number }): number {
  const l = t.x + s.left * t.z;
  const r = t.x + s.right * t.z;
  if (r <= 0 || l >= W) return 0;
  const over = Math.max(0, -l, r - W);
  return GIANT.has(s.tex) ? Math.max(0, over - (r - l) * GIANT_OUT) : over;
}

/** 容許的誤差（像素） */
const TOL = 4;

/**
 * 鏡頭自動讓開邊緣：照腳本的鏡頭，有角色被左右邊緣裁到（一部分在畫面裡、一部分在外面）時，
 * 先在腳本的倍數左右平移（讓被裁的人整個進來或整個出去，說話的人一定要整個在畫面裡）；
 * 平移不夠就一點一點拉遠（最遠到 CAM_MIN_ZOOM，看得到舞台左右多畫的部分）。
 * 沒有角色被裁到就完全照腳本，所以本來就好的拍子（多半是電腦版）不會變。
 */
export function fitCam(cam: { x: number; y: number; zoom: number }, spans: ActorSpan[], L: StageLayout, h: number, at?: string): { x: number; y: number; z: number } {
  const S = spans.filter((s) => !offstage(s));
  const who = S.find((s) => s.id === at);
  const ok = (t: { x: number; z: number }) => S.every((s) => cutBy(s, t) <= TOL) && (!who || (t.x + who.left * t.z >= -TOL && t.x + who.right * t.z <= W + TOL));
  const t0 = camOffset(cam, L, h);
  if (ok(t0)) return t0;
  for (let z = cam.zoom; z >= CAM_MIN_ZOOM - 1e-9; z -= 0.01) {
    const zz = Math.round(z * 1000) / 1000;
    const want = camOffset({ ...cam, zoom: zz }, L, h);
    const [xl, xh] = camRangeX(zz);
    let best: number | undefined;
    for (let x = Math.ceil(xl); x <= xh; x++) if (ok({ x, z: zz }) && (best === undefined || Math.abs(x - want.x) < Math.abs(best - want.x))) best = x;
    if (best !== undefined) return { x: best, y: want.y, z: zz };
  }
  return t0;
}

/** 每一拍鏡頭停好之後（含自動讓開邊緣）的鏡頭 */
export function fittedCams(sc: StageScript, h: number): { x: number; y: number; z: number }[] {
  const L = stageLayout(h);
  return stageSpans(sc, h).map(({ cam, spans }, n) => fitCam(cam, spans, L, h, sc.beats[n].at));
}

/** 被左右邊緣裁到的角色（一部分在畫面裡、一部分在外面；容許 tol 像素） */
export function edgeCuts(sc: StageScript, h: number, tol = TOL): EdgeCut[] {
  const L = stageLayout(h);
  const cuts: EdgeCut[] = [];
  stageSpans(sc, h).forEach(({ cam, spans }, beat) => {
    const t = fitCam(cam, spans, L, h, sc.beats[beat].at);
    for (const s of spans) {
      const over = offstage(s) ? 0 : cutBy(s, t);
      if (over > tol) cuts.push({ beat, id: s.id, tex: s.tex, left: Math.round(t.x + s.left * t.z), right: Math.round(t.x + s.right * t.z), over: Math.round(over) });
    }
  });
  return cuts;
}
