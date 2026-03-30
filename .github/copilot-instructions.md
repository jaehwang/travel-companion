# Travel Companion — Copilot Instructions

## Commands

```bash
# Root (runs web by default)
npm run dev          # Next.js dev server (Turbopack)
npm run build        # Next.js production build
npm test             # TypeScript check + Jest (web) + Jest (mobile)
npm run lint         # ESLint (web)

# Web only (apps/web)
npm run test --workspace=apps/web          # tsc --noEmit && jest
npm run test:watch --workspace=apps/web    # jest --watch
npm run test:e2e --workspace=apps/web      # Playwright

# Single Jest test
npx jest path/to/__tests__/route.test.ts --workspace=apps/web
npx jest -t "test name" --workspace=apps/web

# Mobile only (apps/mobile)
npm test --prefix apps/mobile              # Jest unit tests
npm run e2e:build --prefix apps/mobile     # Detox build (only when native code changes)
npm run e2e:test --prefix apps/mobile      # Detox E2E (requires dev server running)
```

> **중요**: `npm run build` 실행 전 dev 서버를 반드시 종료한다 (`.next` 충돌 발생).  
> 커밋 전 순서: `npm run build` → `npm test` (모두 통과 후 커밋).

---

## Architecture

**Monorepo** (npm workspaces):
```
apps/web/      → Next.js 15 PWA (App Router)
apps/mobile/   → Expo iOS (React Native)
packages/shared/ → 공통 TypeScript 타입
```

### Web app (`apps/web`)

- `app/api/` — REST API Route Handlers (Next.js App Router)
- `app/(pages)/` — 서버/클라이언트 페이지
- `components/` — React 컴포넌트 (Tailwind CSS)
- `hooks/` — 커스텀 훅
- `lib/` — 유틸리티, Supabase 클라이언트
- `types/database.ts` — DB 타입 (shared와 일부 중복)

API 모듈 경로 alias: `@/` → `apps/web/`

### Mobile app (`apps/mobile`)

Expo React Native (iOS only). CRUD는 Supabase JS SDK 직접 호출, Places / Calendar / AI 등 서버 비밀 키가 필요한 기능만 Next.js REST API 경유.

- `src/lib/api.ts` — `apiFetch()`: Bearer 토큰으로 Next.js API 호출
- `src/lib/supabase.ts` — Supabase direct 클라이언트
- `src/hooks/useTrips.ts` 등 — 데이터 훅
- `src/screens/` — 화면 컴포넌트

Mobile 환경 변수 파일:
- `.env.development` — 시뮬레이터 (`EXPO_PUBLIC_API_URL=http://localhost:3000`)
- `.env.production` — 실기기 (`EXPO_PUBLIC_API_URL=https://...vercel.app`)

### 인증

`getAuthenticatedClient(request)` (in `lib/supabase/server.ts`) — 단일 함수로 두 가지 방식 처리:
- **쿠키**: 웹 앱 세션 (자동)
- **Bearer 토큰**: 모바일 앱 (`Authorization: Bearer <access_token>`)

모든 인증 필요 API 라우트는 이 함수를 사용한다.

---

## Key Conventions

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

### 공유 타입

`packages/shared/src/types.ts` — `Trip`, `Checkin`, `TripFormData`, `CheckinInsert` 등.  
모바일은 여기서 import, 웹은 `apps/web/types/database.ts`에도 복사본 존재.

---

## Environment Variables

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
