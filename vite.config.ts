import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/DesignPatterns/' : '/',
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: 'imgs/**/*', dest: 'imgs' },
      ],
    }),
  ],
  publicDir: 'public',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
}))