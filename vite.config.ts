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
        // dest is '.' (not 'imgs') because vite-plugin-static-copy preserves
        // the src path under dest. With dest 'imgs', files landed at
        // dist/imgs/imgs/... (double prefix) — useMarkdown rewrites to
        // <BASE_URL>imgs/..., causing 404 in production.
        { src: 'imgs/**/*', dest: '.' },
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
    rollupOptions: {
      output: {
        // Pull GSAP + ScrollTrigger into their own chunk so first paint doesn't have
        // to download the animation engine. Both modules are explicitly imported in
        // main.ts, so Rollup can resolve the boundary via these paths.
        manualChunks(id) {
          if (id.includes('node_modules/gsap/') || id.endsWith('/gsap') || id.endsWith('/ScrollTrigger')) {
            return 'gsap'
          }
          return undefined
        },
      },
    },
  },
}))