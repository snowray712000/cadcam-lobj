// build library
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  publicDir: false, // 不需要 public 資料夾
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'CADCAMLobj',
      formats: ['es'],
      fileName: () => 'index.js',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  }
})