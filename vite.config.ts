import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5005,
    host: '0.0.0.0',
    strictPort: true,
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('/node_modules/three/')) return undefined
          return id.includes('three.core') ? 'three-core' : 'three-renderer'
        },
      },
    },
  },
})
