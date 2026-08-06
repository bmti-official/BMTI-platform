import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // 기본은 GitHub Pages 프로젝트 경로(/BMTI-platform/). 커스텀 도메인 배포 시엔
  // BUILD_TARGET=domain 으로 빌드하면 루트(/)로 나가 bmti-official.co.kr 에서 동작한다.
  base: process.env.BUILD_TARGET === 'domain' ? '/' : '/BMTI-platform/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
    },
  },
})
