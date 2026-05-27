import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing'
import path from 'path'

export default defineConfig({
  plugins: [WxtVitest()],
  resolve: {
    alias: {
      '@salmon/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@salmon/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
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
