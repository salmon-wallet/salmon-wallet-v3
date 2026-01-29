import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing'

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
