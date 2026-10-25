import Phaser from 'phaser';
import { W, H, gameHeight, setGameHeight } from './theme';

export const IS_TOUCH = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
const IS_IOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
const STANDALONE = typeof matchMedia !== 'undefined'
  && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true);

/** 這支瀏覽器能不能用網頁全螢幕（iPhone 的 Safari 不行） */
export function canFullscreen(): boolean {
  return !!document.documentElement.requestFullscreen && !STANDALONE;
}

export function isFullscreen(): boolean {
  return !!document.fullscreenElement;
}

export async function enterFullscreen(): Promise<void> {
  if (!canFullscreen() || isFullscreen()) return;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.('portrait');
  } catch {
    /* 使用者拒絕或瀏覽器不支援 */
  }
}

export function toggleFullscreen(): void {
  if (isFullscreen()) void document.exitFullscreen?.();
  else void enterFullscreen();
}

export function setupMobile(): void {
  if (!IS_TOUCH) return;
  // 第一次點畫面：進全螢幕、鎖直向
  if (canFullscreen()) window.addEventListener('pointerup', () => void enterFullscreen(), { once: true });
  // iPhone 沒有網頁全螢幕：提示加到主畫面（只提示一次）
  const tip = document.getElementById('ios-tip');
  let seen = false;
  try { seen = localStorage.getItem('raujing-ios-tip') === '1'; } catch { /* 無痕模式 */ }
  if (IS_IOS && !STANDALONE && tip && !seen) {
    tip.style.display = 'block';
    const close = () => {
      tip.style.display = 'none';
      try { localStorage.setItem('raujing-ios-tip', '1'); } catch { /* 無痕模式 */ }
    };
    tip.addEventListener('click', close);
    setTimeout(close, 8000);
  }
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** 網址列伸縮、轉回直向後：刷新畫面大小；高度差太多就換高度並重建目前的場景 */
export function watchOrientation(game: Phaser.Game): void {
  let timers: number[] = [];
  const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
  const refresh = () => game.scale.refresh();
  const rebuild = () => {
    if (window.innerHeight < window.innerWidth) return;
    const want = gameHeight();
    if (Math.abs(want - H) < 24) return;
    setGameHeight(want);
    game.scale.setGameSize(W, want);
    // 只重建「可以安全重建」的場景（戰鬥中不重建，打完再說）
    for (const s of game.scene.getScenes(true)) {
      const safe = (s as unknown as { rebuildable?: boolean }).rebuildable;
      if (safe) s.scene.restart((s as unknown as { restartData?: object }).restartData);
    }
    refresh();
  };
  const onTurn = () => {
    for (const t of timers) clearTimeout(t);
    timers = [];
    for (const ms of [50, 250, 600, 1200]) later(refresh, ms);
    later(rebuild, 400);
  };
  window.addEventListener('orientationchange', onTurn);
  window.addEventListener('resize', onTurn);
  window.visualViewport?.addEventListener('resize', onTurn);
}
