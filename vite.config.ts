/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

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

/**
 * 除錯面板的版本：HEAD commit 的時間（台北時間 YYYY-MM-DD HH:mm:ss）與短碼。
 * 沒有 git：time 空字串、sha 'local'（面板只顯示 local）。
 */
function commitInfo(): { sha: string; time: string } {
  try {
    const sha = execSync('git rev-parse --short=7 HEAD').toString().trim();
    const sec = Number(execSync('git log -1 --format=%ct HEAD').toString().trim());
    const time = new Date(sec * 1000 + 8 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    return { sha, time };
  } catch {
    return { sha: 'local', time: '' };
  }
}
const COMMIT = commitInfo();

/** 建置時另外輸出 dist/version.json {sha, time}（除錯面板查「最新版」用）；開發伺服器也回同樣的內容 */
function versionJson(): Plugin {
  const body = () => JSON.stringify(COMMIT);
  return {
    name: 'version-json',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !/\/version\.json(\?|$)/.test(req.url)) return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(body());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: body() });
    },
  };
}

/**
 * 正式版建置（沒設 VITE_DEBUG_TOOLS=1）：public/vendor/（除錯截圖用的 html2canvas）不放進 dist，dist 裡完全沒有除錯程式。
 * 測試區建置（deploy-test.yml 設 VITE_DEBUG_TOOLS=1）與本機開發照常有。
 */
function debugVendorOnly(debug: boolean): Plugin {
  let outDir = 'dist';
  return {
    name: 'debug-vendor-only',
    apply: 'build',
    configResolved(c) { outDir = resolve(c.root, c.build.outDir); },
    closeBundle() { if (!debug) rmSync(resolve(outDir, 'vendor'), { recursive: true, force: true }); },
  };
}

export default defineConfig(({ mode }) => ({
  base: './',
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [versionJson(), debugVendorOnly(loadEnv(mode, process.cwd(), 'VITE_').VITE_DEBUG_TOOLS === '1')],
  define: {
    __VERSION__: JSON.stringify(buildVersion()),
    __BUILD_TIME__: JSON.stringify(COMMIT.time),
    __BUILD_SHA__: JSON.stringify(COMMIT.sha),
  },
  // npm test 只跑 tests/；tools/aiPhrase.report.test.ts 只給 npm run check:ai（vitest.ai.config.ts）
  test: { include: ['tests/**/*.test.ts'] },
}));
