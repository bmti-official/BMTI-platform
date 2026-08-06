# 커스텀 도메인 전환 가이드 — bmti-official.co.kr

> ⚠️ **DNS가 붙기 전에는 `npm run deploy:domain` 을 실행하지 마세요.** 도메인이 아직 안 붙은 상태에서 전환하면 사이트가 잠시 접속 불가가 됩니다.
> 지금 현재 사이트(`bmti-official.github.io/BMTI-platform/`)는 기존대로 정상 동작합니다. (코드만 준비해두고 배포는 안 한 상태)

---

## 1) 지금 할 것 — 도메인 등록업체(가비아 등)에서 DNS 레코드 추가

**apex 도메인(`bmti-official.co.kr`)** → GitHub Pages IP로 **A 레코드 4개**:

| 타입 | 호스트/이름 | 값 |
|------|------|------|
| A | @ (또는 비움) | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

**(선택) IPv6 — AAAA 레코드 4개:**
`2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`

**(선택) www도 쓰려면 — CNAME:**

| 타입 | 호스트 | 값 |
|------|------|------|
| CNAME | www | bmti-official.github.io. |

## 2) DNS가 붙었는지 확인
터미널에서:
```
dig bmti-official.co.kr +short
```
→ 위 A 레코드 IP(185.199.108~111.153)가 나오면 연결된 거예요. (보통 몇 분~수 시간)

## 3) GitHub 저장소 설정
저장소 → **Settings → Pages → Custom domain** 에 `bmti-official.co.kr` 입력 → Save
→ DNS check 통과 후 **Enforce HTTPS** 체크(인증서 발급까지 몇 분).

## 4) 커스텀 도메인으로 배포 (전환)
DNS 확인이 끝나면:
```
npm run deploy:domain
```
- 루트(`/`) 기준으로 빌드 + `dist/CNAME`(bmti-official.co.kr) 생성 + gh-pages 배포까지 한 번에.
- 이후 `https://bmti-official.co.kr/` 로 접속되고, 기존 github.io 주소는 자동으로 이 도메인으로 리다이렉트됩니다.

## 5) 전환 후 연동 업데이트 (중요)
- **카카오 로그인**: 카카오 Developers → 내 애플리케이션 → **플랫폼 → Web 사이트 도메인**에 `https://bmti-official.co.kr` 추가, **카카오 로그인 → Redirect URI**도 새 도메인으로 추가.
- **애드센스**: 사이트에 `bmti-official.co.kr` 추가 → `ads.txt`가 이제 **도메인 루트**(`https://bmti-official.co.kr/ads.txt`)에서 읽혀 인식됩니다.
- **구글 서치콘솔**: `bmti-official.co.kr` 속성 추가 → `sitemap.xml` 제출.

---

## 참고 — 준비해둔 것 (이미 코드에 반영, 배포만 남음)
- `vite.config.js`: `BUILD_TARGET=domain` 이면 base가 `/`로 바뀜(평소엔 `/BMTI-platform/` 유지 → 기존 사이트 안전).
- `package.json`: `deploy:domain` 스크립트(루트 빌드 + CNAME + 배포).
- 사이트 내 절대 URL(canonical·og·sitemap·robots·매거진·결과 공유링크)을 `bmti-official.co.kr` 로 변경.
