/**
 * 除錯面板的版本：「HEAD commit 的台北時間（短碼）」，例如「2026-11-14 20:05:31（abc1234）」。
 * __BUILD_TIME__／__BUILD_SHA__ 由 vite.config.ts 用 git 算好 define 進來；建置時另輸出 dist/version.json {sha, time}，
 * 面板用它查「最新版」（GitHub Pages 上同一個網址，換新版後 version.json 先變）。
 */
import { formatVersion, versionParts } from './core/index.js';

export const BUILD_TIME = __BUILD_TIME__;
export const BUILD_SHA = __BUILD_SHA__;

/** 面板與回報的版本字串 */
export const versionText = (): string => formatVersion(BUILD_TIME, BUILD_SHA);
export const versionSplit = () => versionParts(BUILD_TIME, BUILD_SHA);

export interface VersionJson { sha: string; time: string }

/** version.json 的內容整理成 { id, label }；格式不對回 null */
export function latestOf(json: unknown): { id: string; label: string } | null {
  const o = json as Partial<VersionJson> | null;
  const sha = typeof o?.sha === 'string' ? o.sha.trim() : '';
  if (!/^[0-9a-f]{4,40}$/i.test(sha)) return null;
  return { id: sha, label: formatVersion(typeof o?.time === 'string' ? o.time : '', sha) };
}

/** 正在跑的版本和最新版不一樣（查不到最新版不算） */
export function isStale(latestSha: string | undefined, running = BUILD_SHA): boolean {
  return !!latestSha && !!running && latestSha !== running;
}

/** 重新載入最新版的網址：同一頁，其他參數（debug=1 等）照留，加 v=最新短碼（查不到就不動）與 _r=時間 */
export function reloadUrl(href: string, latestSha: string | undefined, now = Date.now()): string {
  const u = new URL(href);
  if (latestSha) u.searchParams.set('v', latestSha);
  u.searchParams.set('_r', String(now));
  return u.toString();
}
