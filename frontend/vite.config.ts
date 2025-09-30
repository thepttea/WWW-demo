import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // 添加代理配置以解决CORS问题
    proxy: {
      // 将 /api 请求代理到后端服务器
      '/api': {
        target: 'http://127.0.0.1:8000', // 明确使用IPv4地址
        changeOrigin: true, // 需要虚拟主机站点
        secure: false, // 如果是https则设为false
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
})
