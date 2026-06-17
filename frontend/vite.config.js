import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[vite proxy error] 后端代理失败，请确认后端服务已启动 (http://127.0.0.1:3000)，错误详情：', err.message);
            if (res && res.writeHead && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({
                error: '后端服务未启动或代理失败',
                message: `请先启动后端服务：cd backend && npm start (访问 http://127.0.0.1:3000)。当前代理目标：${options.target}`,
                detail: err.message
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('X-Forwarded-Proto', 'http');
          });
        },
        timeout: 30000,
        proxyTimeout: 30000
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
