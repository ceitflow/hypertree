import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

const libAliases = {
  '@lib/ast': resolve('src/lib/ast'),
}

export default defineConfig({
  main: {
    resolve: { alias: libAliases }
  },
  preload: {
    resolve: { alias: libAliases }
  },
  renderer: {
    resolve: {
      alias: {
        ...libAliases
      }
    },
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    },
    plugins: [react()]
  }
})
