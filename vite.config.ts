import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: true,
    port: 3001,
    strictPort: true,
    allowedHosts: true,
    watch: {
      ignored: ['**/.output/**'],
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    nitro(),
  ],
})
