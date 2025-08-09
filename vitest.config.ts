// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'], // 只跑單元測試
    exclude: [
      'tests/**',               // 排除 Playwright 測試
      'test-results/**',
      'playwright-report/**'
    ],
    // environment: 'jsdom', // 若有需要 DOM 再打開
  },
});
