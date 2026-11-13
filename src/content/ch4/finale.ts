// 台詞：第四章試玩段落文字 v0.1（全部【待定】，作者尚未定稿）
/**
 * 第四章最後一戰：渾水溪・茫渡（計畫 §6 的 `ford`：顧人過溪、人鏈）。
 *
 * 【TODO 第 5 階段】這一輪不做最後一戰。ChapterDef 的型別需要 finale，所以先借第一章的陣頭與波次當暫代
 *（試玩版過完第一夜就接試玩結束畫面，不會走到這裡；網址 ?scene=boss&ch=baishadun 會看到借來的戰鬥）。
 * 之後要加：core/boss.ts 的 BattleMode 'ford'、人鏈（follow.chain）、茫渡起霧帶人往下游。字還沒寫（「（待寫）」）。
 */
import type { RunState } from '../../state';
import type { BossSetup } from '../../core/boss';
import type { FinaleRound } from '../finale';
import { finaleSetup, MEMBER_STATS } from '../finale';

const TBD = '（待寫）';

export function finaleSetup4(r: RunState): BossSetup {
  return finaleSetup(r);
}

export const MEMBER_STATS4 = MEMBER_STATS;
/** 收編上場的鬼：這一章對鬼不收編（帶著走），之後由 ford 模式決定誰會來 */
export const GHOST_MEMBERS4: string[] = [];

export const FINALE_ROUNDS4: FinaleRound[] = [
  { line: '「橋上那麼多人，一個都不下來。」', evidence: [], ok: TBD, effect: TBD },
  { line: TBD, evidence: [], ok: TBD, effect: TBD },
  { line: TBD, evidence: [], ok: TBD, effect: TBD },
];

export const FINALE_WRONG4 = TBD;
