import { resolve } from 'path'
import { defineConfig } from 'vite'

// Detect if we're running playground or library build
const isPlayground = process.env.PLAYGROUND === 'true'

export default defineConfig({
  // Different root based on mode
  root: isPlayground ? 'playground' : undefined,

  // Only apply server config for playground
  server: isPlayground ? {
    port: 3000,
    open: '/index.html'
  } : undefined,

  // Only apply resolve alias for playground
  resolve: isPlayground ? {
    alias: {
      '@fuderu': resolve(__dirname, 'src')
    }
  } : undefined,

  // Public dir disabled for library builds
  publicDir: isPlayground ? 'public' : false,

  // Build configuration
  build: isPlayground ? {} : {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Fuderu',
      fileName: 'fuderu',
      formats: ['es', 'cjs', 'umd']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})