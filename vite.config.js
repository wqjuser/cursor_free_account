import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',    // 监听所有IP
    port: 3089,         // 指定端口
    allowedHosts: [
      'accounts.zxai.fun',  // 添加允许的域名
      'localhost',
      '127.0.0.1'
    ]
  },
})
