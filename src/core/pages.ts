/**
 * 分頁（純邏輯，可測試）：一列一列往下排，排不下就換一頁。
 * 用在信徒錄：第三章有 5 位信徒＋9 個鬼＋蛟，一頁放不下；第一、二章一頁放得下就維持一頁。
 * keepWithNext：標題列不要落單在頁尾（跟下一列一起換頁）。
 */
export function paginate(heights: number[], cap: number, keepWithNext: boolean[] = []): number[][] {
  const pages: number[][] = [[]];
  let used = 0;
  heights.forEach((h, i) => {
    const page = pages[pages.length - 1];
    // 標題要連同下一列一起放得下
    const need = keepWithNext[i] && i + 1 < heights.length ? h + heights[i + 1] : h;
    if (page.length && used + need > cap) {
      pages.push([i]);
      used = h;
      return;
    }
    page.push(i);
    used += h;
  });
  return pages;
}
