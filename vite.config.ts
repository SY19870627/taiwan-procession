import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** 版本號：package.json 的版本＋git 提交短碼＋建置時間（台北時間），顯示在標題畫面角落 */
function buildVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
  let hash = 'dev';
  try {
    hash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    /* 沒有 git 就用 dev */
  }
  const t = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
  return `v${pkg.version}・${hash}・${t.slice(5, 10).replace('-', '/')} ${t.slice(11, 16)}`;
}

export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2000 },
  define: { __VERSION__: JSON.stringify(buildVersion()) },
});
