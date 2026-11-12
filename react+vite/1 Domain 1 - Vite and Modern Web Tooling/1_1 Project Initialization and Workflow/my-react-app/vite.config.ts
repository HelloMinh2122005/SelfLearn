import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,      // Đổi cổng từ 5173 thành 3000
    host: true,       // Lắng nghe trên toàn bộ địa chỉ IP mạng nội bộ (0.0.0.0)
    open: true,       // Tự động mở trình duyệt khi dev server khởi động
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Địa chỉ máy chủ Backend (Spring Boot / Node)
        changeOrigin: true,              // Cần thiết để đổi header 'Host' thành địa chỉ target
      },
    },
  },
})
