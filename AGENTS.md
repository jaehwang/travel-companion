# Travel Companion — Agent Instructions

## 프로젝트 개요

여행하면서 기억하고 싶은 순간을 기록하는 앱. 사진·위치·메모를 활용해 여행의 추억을 시각화하고 공유하는 모바일/웹 애플리케이션.

**핵심 기능**
- 사진 업로드 및 EXIF GPS 추출
- 지도 위 마커 표시 및 여행 경로 시각화
- 시간순/위치별 여행 스토리 생성
- 여행 기록 공유 (링크, SNS)
- 여행 타임라인 및 갤러리 뷰

---

## 명령어

```bash
# 루트 (웹 기본)
npm run dev          # Next.js dev server (Turbopack)
npm run build        # Next.js production build
npm test             # TypeScript check + Jest (web) + Jest (mobile)
npm run lint         # ESLint (web)

# 웹만 (apps/web)
npm run test --workspace=apps/web          # tsc --noEmit && jest
npm run test:watch --workspace=apps/web    # jest --watch
npm run test:e2e --workspace=apps/web      # Playwright

# Jest 단일 실행
npx jest path/to/__tests__/route.test.ts --workspace=apps/web
npx jest -t "test name" --workspace=apps/web

# 모바일만 (apps/mobile)
npm test --prefix apps/mobile              # Jest 단위 테스트
npm run e2e:build --prefix apps/mobile     # Detox 빌드 (네이티브 코드 변경 시에만)
npm run e2e:test --prefix apps/mobile      # Detox E2E (웹 dev 서버 필수)
```

> **중요**: `npm run build` 실행 전 dev 서버를 반드시 종료한다 (`.next` 충돌 발생).
> 커밋 전 순서: `npm run build` → `npm test` (모두 통과 후 커밋).

---

## 아키텍처

**모노레포** (npm workspaces):
```
apps/web/        → Next.js 15 PWA (App Router)
apps/mobile/     → Expo iOS (React Native)
packages/shared/ → 공통 TypeScript 타입
```

### 웹 앱 (`apps/web`)

- `app/api/` — REST API Route Handlers (Next.js App Router)
- `app/[locale]/` — 다국어 페이지 (en/ko). `next-intl` 기반, `/checkin` → `/en/checkin` 자동 리다이렉트
- `components/` — React 컴포넌트 (Tailwind CSS)
- `hooks/` — 커스텀 훅
- `lib/` — 유틸리티, Supabase 클라이언트
- `i18n/` — next-intl routing.ts, request.ts
- `messages/` — 웹 i18n 메시지 (en.json, ko.json)

경로 alias: `@/` → `apps/web/`

**기술 스택**: Next.js 15 / TypeScript / Tailwind CSS / Google Maps API / exifr / browser-image-compression / next-intl / Vercel 배포

### 모바일 앱 (`apps/mobile`)

Expo React Native (iOS). CRUD는 Supabase JS SDK 직접 호출, Places / Calendar / AI 등 서버 비밀 키가 필요한 기능만 Next.js REST API 경유.

- `src/lib/api/` — 도메인별 API 모듈 (`trips.ts`, `checkins.ts`, `nearby.ts`, `storage.ts`, `places.ts`, `calendar.ts`, `settings.ts`, `rest-client.ts`, `supabase-client.ts`)
- `src/lib/api.ts` — 하위 호환 re-export (점진적 제거 예정)
- `src/lib/supabase.ts` — Supabase 클라이언트 (iOS Keychain 세션 저장)
- `src/store/` — Zustand 전역 상태 (trips, checkins)
- `src/hooks/` — 데이터 훅
- `src/screens/` — 화면 컴포넌트
- `src/i18n/` — i18next 초기화, en.json/ko.json 메시지

모바일 환경변수 파일:
- `.env.development` — 시뮬레이터 (`EXPO_PUBLIC_API_URL=http://localhost:3000`)
- `.env.production` — 실기기 (`EXPO_PUBLIC_API_URL=https://...vercel.app`)

모바일 실행:
- 시뮬레이터: `npx expo run:ios`
- 실기기: `npx expo run:ios --device --configuration Release`
- E2E 빌드: `cd apps/mobile && npm run e2e:build` (네이티브 코드 변경 시에만)
- E2E 테스트 전 웹 dev 서버 필수, 시뮬레이터에 로그인 세션 필요

### 인증

`getAuthenticatedClient(request)` (`lib/supabase/server.ts`) — 단일 함수로 두 가지 방식 처리:
- **쿠키**: 웹 브라우저 세션 (자동)
- **Bearer 토큰**: 모바일 앱 (`Authorization: Bearer <access_token>`)

모든 인증 필요 API 라우트는 이 함수를 사용한다.

### 공유 패키지

`packages/shared/src/types.ts` — `Trip`, `Checkin`, `TripFormData`, `CheckinInsert` 등.
웹·모바일 모두 `@travel-companion/shared`로 import.

`packages/shared/src/utils/` — 공통 순수 함수:
- `trip.ts` — `buildTripMetaMap()` (cover_photo_url, first_checkin_date 계산)
- `date.ts` — `formatTripDate()`, `formatDateDisplay()`, `parseLocalDate()`, `toISODateString()`
- `geo.ts` — `haversineDistance()`

`packages/shared/messages/` — 웹·모바일 공통 i18n 메시지 (카테고리 레이블 등).

---

## 개발 가이드라인

### Git
- 한국어/영어 커밋 메시지 혼용 가능
- Feature branch 사용, 주요 기능 완성 시 커밋
- main 브랜치 push → Vercel 자동 배포
- **커밋 전 반드시**: `npm run build` → `npm test` (모두 통과 후 커밋)
- **dev 서버 실행 중 `npm run build` 금지** (`.next` 충돌 발생)
- AI 에이전트가 작성한 커밋에는 아래 co-author 라인을 추가한다:
  ```
  Co-authored-by: opencode[claude-sonnet-4.6] <opencode@noreply>
  ```

### 코드 스타일
- TypeScript strict mode
- ESLint + Prettier
- 함수형 컴포넌트 + Hooks
- 컴포넌트 기반 아키텍처

---

## 주요 컨벤션

### API Route 패턴

```typescript
// 모든 인증 필요 라우트
export async function GET(request: Request) {
  const { user, supabase } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
// 에러 응답은 항상 { error: 'message' } 형태
```

### API Route 테스트

- 테스트는 route 파일 옆 `__tests__/route.test.ts`에 위치
- 파일 최상단에 `/** @jest-environment node */` pragma 필수
- `@/lib/supabase/server` mock 후 `getAuthenticatedClient` 주입 패턴
- `docs/api/` 문서에 명시된 응답 필드가 실제 응답에 포함되는지 assertion으로 검증

### 문서 업데이트 규칙

| 변경 대상 | 함께 업데이트할 문서 |
|-----------|---------------------|
| `apps/web/app/api/**` Route Handler 추가/수정 | `docs/api/<endpoint>.md` + 해당 `__tests__/route.test.ts` |
| 웹 컴포넌트/화면/훅 추가·변경 | `docs/ui/web.md` |
| 모바일 컴포넌트/화면/훅 추가·변경 | `docs/ui/mobile.md` |

---

## 환경변수

**Web** (`apps/web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_PHOTO_CDN_URL=     # Cloudflare Worker URL (이미지 CDN)
GEMINI_API_KEY=                # 서버 전용 (AI 기능)
GEMINI_MODEL=                  # 선택사항, 기본값 gemini-2.5-flash-lite
GOOGLE_CLIENT_ID=              # Google Calendar 연동
GOOGLE_CLIENT_SECRET=          # Google Calendar 연동
```

**Mobile** (`apps/mobile/.env.development` / `.env.production`):
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://localhost:3000   # development
EXPO_PUBLIC_API_URL=https://...            # production
EXPO_PUBLIC_PHOTO_CDN_URL=                 # Cloudflare Worker URL (이미지 CDN)
```

---

## 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| 아키텍처 | `docs/architecture.md` | 전체 시스템 구성, 성능·보안·AI·테스트 |
| API | `docs/api/` | 웹 REST API 엔드포인트 명세 |
| 웹 UI | `docs/ui/web.md` | 웹 화면/컴포넌트/훅 |
| 모바일 UI | `docs/ui/mobile.md` | 모바일 화면/컴포넌트/훅/백엔드 연계 |
| DB & 인증 | `docs/db_and_auth.md` | Supabase 스키마, RLS, OAuth 설정 |
| 성능 | `docs/performance_cloudfare.md` | Cloudflare Worker 캐싱 전략 |
| 보안 | `docs/security.md` | 이미지 접근 제어 방안 |
