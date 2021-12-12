import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import envCompatible from 'vite-plugin-env-compatible'
import { injectHtml } from 'vite-plugin-html'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import { VitePWA } from 'vite-plugin-pwa'
import EnvironmentPlugin from 'vite-plugin-environment'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  plugins: [
    vue(),
    vueJsx(),
    EnvironmentPlugin({
      GAME_NAME: 'portland',
      GAME_SOURCE: 'sanity',
      IMGUR_CLIENT_ID: '4fa12c6ce36984b',
      IMGUR_CLIENT_SECRET: null,
      SANITY_PROJECT_ID: 'x37ikhvs',
      SANITY_DATASET: 'production',
      SANITY_CDN_URL: 'https://cdn.sanity.io/images/',
      REDDIT_CLIENT_ID: null,
      REDDIT_CLIENT_SECRET: null,
      REDDIT_USERNAME: null,
      REDDIT_PASSWORD: null,
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'worker.ts',
      workbox: {
        sourcemap: true,
      },
      manifest: {
        name: 'BikeTag',
        short_name: 'BikeTag',
        description: 'The BikeTag Game',
        theme_color: '#000000',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
    viteCommonjs(),
    envCompatible(),
    injectHtml(),
  ],
  build: {
    rollupOptions: {},
  },
  // root: './public',
  server: {
    port: 8080,
  },
  preview: {
    port: 8080,
  },
})
