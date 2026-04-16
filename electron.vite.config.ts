import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        shared: resolve('shared')
      }
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve('electron/main.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('electron/preload.ts')
        }
      }
    }
  },
  renderer: {
    root: 'src',
    resolve: {
      alias: {
        '@': resolve('src'),
        shared: resolve('shared')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/index.html')
        }
      }
    }
  }
})
