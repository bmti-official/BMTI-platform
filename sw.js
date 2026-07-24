// BMTI 말랑 다이어리 서비스 워커 — 앱 셸/정적 자산을 휴대폰에 캐시해서
// 재방문이 빠르고 오프라인에서도 열리게 한다. (일기 데이터 자체는 localStorage에
// 저장되며 SW와 무관하게 유지된다.)
// 배포마다 새 자산을 받도록 버전을 올린다.
const CACHE = 'bmti-cache-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 다른 출처(Supabase API·카카오·폰트 CDN 등)는 절대 가로채지 않는다.
  if (url.origin !== self.location.origin) return;

  // 페이지 이동: 네트워크 우선 → 실패 시 캐시(오프라인)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const c = res.clone(); caches.open(CACHE).then((ca) => ca.put(req, c)); return res; })
        .catch(() => caches.match(req).then((m) => m || caches.match(new URL('index.html', self.registration.scope).href)))
    );
    return;
  }

  // 정적 자산: 캐시 우선 → 없으면 네트워크(성공 시 캐시에 저장)
  e.respondWith(
    caches.match(req).then((m) => m || fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') { const c = res.clone(); caches.open(CACHE).then((ca) => ca.put(req, c)); }
      return res;
    }))
  );
});
