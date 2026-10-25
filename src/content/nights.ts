import type { NightMode, Spawn, Side } from '../core/battle';

export interface NightDef {
  mode: NightMode;
  title: string;
  /** 夜晚畫面上的地點 */
  place: string;
  /** 布陣畫面的說明 */
  brief: string;
  /** 兩側的名稱（巡行時是前方／後方，守廟時是左右） */
  sideNames: Record<Side, string>;
  duration: number;
  spawns: Spawn[];
}

const wave = (t: number, enemy: Spawn['enemy'], side: Side, count: number, gap = 1.2): Spawn => ({ t, enemy, side, count, gap });

export const NIGHTS: Record<number, NightDef> = {
  1: {
    mode: 'patrol',
    title: '第一夜・暗訪',
    place: '萬舺街巷',
    brief: '隊伍夜巡萬舺的大街小巷，捉拿作亂的小妖。妖怪大多從前方迎面而來，偶爾會從後方偷襲。',
    sideNames: { 1: '前方', [-1]: '後方' } as Record<Side, string>,
    duration: 70,
    spawns: [
      wave(2, 'wang', 1, 4, 2.2),
      wave(12, 'mei', 1, 3, 1.4),
      wave(20, 'wang', -1, 2, 2.0),
      wave(28, 'wang', 1, 5, 1.6),
      wave(38, 'mei', 1, 4, 1.0),
      wave(44, 'mei', -1, 3, 1.2),
      wave(52, 'wang', 1, 6, 1.3),
      wave(58, 'wang', -1, 3, 1.5),
    ],
  },
  2: {
    mode: 'defend',
    title: '第二夜・守夜',
    place: '芝林庄頭廟',
    brief: '駐駕在芝林的庄頭廟。石駒的煞氣引來大批小妖攻廟，還有堅硬的石屑傀。撐到雞啼天亮。',
    sideNames: { 1: '右側（北）', [-1]: '左側（南）' } as Record<Side, string>,
    duration: 80,
    spawns: [
      wave(2, 'wang', 1, 3, 2.0),
      wave(8, 'wang', -1, 2, 2.4),
      wave(16, 'kui', 1, 1, 1),
      wave(22, 'mei', -1, 3, 1.2),
      wave(30, 'wang', 1, 5, 1.5),
      wave(38, 'kui', 1, 1, 1),
      wave(44, 'mei', 1, 3, 1.0),
      wave(50, 'wang', -1, 3, 1.6),
      wave(56, 'kui', -1, 1, 1),
      wave(62, 'wang', 1, 5, 1.3),
      wave(68, 'mei', 1, 3, 1.0),
    ],
  },
  3: {
    mode: 'boss',
    title: '第三夜・喚回石駒',
    place: '芝嶺巖惠澤宮',
    brief: '與惠澤宮開疆聖王聯手。石駒會從北邊衝鋒而來，削去牠的煞氣，把牠喚回。天亮前沒喚回，牠就會退回山裡。',
    sideNames: { 1: '右側（北）', [-1]: '左側（南）' } as Record<Side, string>,
    duration: 150,
    spawns: [
      wave(1, 'boss', 1, 1),
      wave(4, 'wang', 1, 3, 2.0),
      wave(10, 'wang', -1, 3, 2.0),
      wave(24, 'kui', 1, 2, 4.0),
      wave(34, 'mei', -1, 4, 1.0),
      wave(50, 'wang', 1, 5, 1.4),
      wave(64, 'kui', -1, 2, 3.0),
      wave(80, 'mei', 1, 5, 0.9),
      wave(96, 'wang', -1, 6, 1.2),
      wave(112, 'kui', 1, 2, 3.0),
    ],
  },
};

/**
 * 今晚實際的妖怪波次：基本波次，加上白天的選擇
 * - 每次神蹟（天機外洩）：多 2 波，從正面（右側／前方）來
 * - 清了小魍巢：少掉最早的 2 波小魍
 */
export function nightSpawns(n: number, mods: { miracles: number; cleared: boolean }): Spawn[] {
  let list = [...NIGHTS[n].spawns];
  if (mods.cleared) {
    let removed = 0;
    list = list.filter((s) => {
      if (removed < 2 && s.enemy === 'wang') {
        removed++;
        return false;
      }
      return true;
    });
  }
  const d = NIGHTS[n].duration;
  for (let i = 0; i < mods.miracles; i++) {
    list.push(wave(Math.min(d - 20, 14 + i * 9), 'mei', 1, 3, 0.8));
    list.push(wave(Math.min(d - 12, 34 + i * 9), 'wang', 1, 4, 1.1));
  }
  return list;
}
