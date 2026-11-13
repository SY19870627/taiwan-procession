/**
 * npm run check:ai：只跑 tools/aiPhrase.report.test.ts（避免 AI 味命中報告）。
 * 不併入 vite.config.ts（那裡的 test.include 只收 tests/，npm test 不會跑到報告）。
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __VERSION__: JSON.stringify('check-ai') },
  test: {
    include: ['tools/aiPhrase.report.test.ts'],
  },
});
