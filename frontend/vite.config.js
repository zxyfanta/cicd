import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  // GitHub Pages 路径配置
  // 仓库名：cicd
  // 部署地址：https://zxyfanta.github.io/cicd/
  base: process.env.NODE_ENV === 'production'
    ? '/cicd/'
    : '/',
})
