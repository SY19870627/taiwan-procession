/**
 * 互嗆要播哪一組（純邏輯，可測試）：同一場合的幾組依序輪流；
 * 最後一戰事件很密，兩組之間至少隔 gap 毫秒（force 的大事件不受限，例如開打、五營合陣）。
 */
import type { BanterLine } from '../content/chapter';

export class BanterPicker {
  private n: Record<string, number> = {};
  private last = -Infinity;

  constructor(private lib: Record<string, BanterLine[][]> | undefined, private gap = 0) {}

  /** 回傳要播的那一組；沒有台詞、或離上一組太近就回傳 null */
  pick(key: string, now: number, force = false): BanterLine[] | null {
    const groups = this.lib?.[key];
    if (!groups?.length) return null;
    if (!force && now - this.last < this.gap) return null;
    this.last = now;
    const i = (this.n[key] = (this.n[key] ?? -1) + 1);
    return groups[i % groups.length];
  }
}
