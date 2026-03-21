import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      undici: path.resolve('./src/undici-stub.js'),
    },
  },
  server: {
    proxy: {
      '/nvidia-api': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/nvidia-api/, ''),
        // Forward NVCF polling headers through
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('Access-Control-Expose-Headers', 'NVCF-ReqId, Location');
          });
        },
      },
    },
  },
})
