// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import { CONTENT_UPDATED } from './src/lib/site.ts'

// https://astro.build/config
export default defineConfig({
  site: 'https://kitcheck.cc',
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({
      // lastmod helps Bing and Google recrawl changed pages sooner; legal pages stay out
      filter: (page) => !/\/(privacy|cookies)\/$/.test(page),
      serialize: (item) => ({ ...item, lastmod: CONTENT_UPDATED }),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Pre-bundle at startup: when Vite discovers the icon package mid-session, its cache goes
      // stale (504 "Outdated Optimize Dep") and React islands like the chart stop hydrating in dev
      include: ['leaflet', '@central-icons-react/round-outlined-radius-3-stroke-2'],
    },
    build: {
      // MapLibre (~1 MB) is lazy-loaded only when a GPX route map is shown
      chunkSizeWarningLimit: 1100,
    },
  }
})
