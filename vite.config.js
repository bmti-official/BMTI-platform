import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// public/sw.js의 캐시 이름(__BUILD_ID__)을 빌드 시각으로 치환한다.
// 캐시 이름이 배포마다 달라져야 서비스 워커의 activate 단계에서 옛 캐시가 지워지고,
// 사용자가 새 빌드를 확실히 받는다.
function stampServiceWorker() {
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    closeBundle() {
      const swPath = resolve(process.cwd(), 'dist/sw.js')
      if (!existsSync(swPath)) return
      const buildId = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
      const src = readFileSync(swPath, 'utf8')
      writeFileSync(swPath, src.replace(/__BUILD_ID__/g, buildId))
      console.log(`[sw] 캐시 버전 bmti-cache-${buildId}`)
    },
  }
}

export default defineConfig({
  // 기본은 GitHub Pages 프로젝트 경로(/BMTI-platform/). 커스텀 도메인 배포 시엔
  // BUILD_TARGET=domain 으로 빌드하면 루트(/)로 나가 bmti-official.co.kr 에서 동작한다.
  base: process.env.BUILD_TARGET === 'domain' ? '/' : '/BMTI-platform/',
  plugins: [
    react(),
    tailwindcss(),
    stampServiceWorker(),
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
