import { defineConfig } from 'vite'

export default defineConfig({
  test: {          // vitest 設定直接放在這裡
    environment: 'jsdom',   // 或 'node', 'browser' 可選擇在真實瀏覽器（Playwright/WebdriverIO）中跑測試，而非只用 jsdom
    globals: true,          // 可省略 import { test, expect }
  }
})


