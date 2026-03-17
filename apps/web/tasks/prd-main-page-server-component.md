# PRD: 메인 페이지 서버 컴포넌트 전환

## Introduction

`app/page.tsx`를 Client Component에서 async Server Component로 전환하여 메인 페이지 초기 로딩 성능을 개선한다.
현재는 브라우저에서 auth 확인 → trips fetch가 순차적으로 발생(waterfall)하여 사용자가 빈 화면을 경험한다.
서버에서 인증과 데이터 조회를 동시에 처리하고, 완성된 HTML을 클라이언트에 전달함으로써 클라이언트 fetch를 0회로 줄이고 JS 번들 크기도 감소시킨다.

## Goals

- 메인 페이지 클라이언트 fetch 횟수를 기존 2회(auth + trips)에서 0회로 줄인다.
- 서버 렌더링된 HTML로 여행 카드가 즉시 표시되도록 한다.
- `useState`, `useEffect` 등 제거로 JS 번들 크기를 소폭 감소시킨다.
- `/api/trips` GET 라우트의 쿼리 로직을 서버 컴포넌트로 이전한다 (GET 핸들러 자체는 유지).
- `TripFormModal`을 `app/checkin/components/`에서 최상위 `components/`로 이동한다.
- 전환 후 회귀가 없음을 자동화 테스트로 검증한다.

## User Stories

### US-001: TripFormModal을 최상위 components/로 이동 + TripFormData 타입 통합
**Description:** As a developer, I want `TripFormModal` moved to the top-level `components/` directory and `TripFormData` consolidated into `types/database.ts` so that cross-page imports are eliminated.

**Acceptance Criteria:**
- [ ] `types/database.ts`에 `export type TripFormData = Omit<TripInsert, 'user_id'>` 추가
- [ ] `app/checkin/hooks/useTrips.ts`에서 `TripFormData` 정의 제거, `@/types/database`에서 import로 교체
- [ ] `components/TripFormModal.tsx`로 파일 이동
- [ ] `TripFormModal.tsx` 내 `TripFormData` import를 `@/types/database`로 변경
- [ ] `app/checkin/page.tsx`의 `TripFormModal` import 경로를 `@/components/TripFormModal`로 업데이트
- [ ] `app/page.tsx`의 `TripFormModal`, `TripFormData` import 경로 업데이트
- [ ] Typecheck/lint 통과
- [ ] 브라우저에서 여행 생성/수정 모달 정상 동작 확인

### US-002: app/page.tsx async Server Component 전환
**Description:** As a developer, I want to convert `app/page.tsx` to an async Server Component so that auth and trips data are fetched on the server before HTML is sent to the client.

**Acceptance Criteria:**
- [ ] `'use client'` 지시어 제거
- [ ] `export default async function Home()` 으로 변경
- [ ] `@/lib/supabase/server`의 `createClient()`로 서버에서 user 조회
- [ ] `useState`, `useEffect`, `useCallback`, `useRouter` 제거
- [ ] 여행 카드 클릭: `button` + `router.push()` → `Link` 컴포넌트로 대체
- [ ] Typecheck/lint 통과

### US-003: trips 조회 로직을 서버 컴포넌트로 이전
**Description:** As a developer, I want the trips query logic moved from `/api/trips` into a server-side function in `page.tsx` so that no client-side fetch is needed on the main page.

**Acceptance Criteria:**
- [ ] `page.tsx` 내 `fetchTrips(supabase)` 함수 구현
- [ ] `trips` 테이블 조회 + `checkins`에서 `first_checkin_date`, `cover_photo_url` 보강 (기존 `/api/trips` GET 로직과 동일)
- [ ] 결과가 Server Component에서 직접 렌더링됨
- [ ] Typecheck 통과

### US-004: LogoutButton Client Component 신규 생성
**Description:** As a user, I want a logout button that works correctly so that I can sign out of the app.

**Acceptance Criteria:**
- [ ] `components/LogoutButton.tsx` 파일 생성
- [ ] `'use client'` 지시어 포함
- [ ] `supabase.auth.signOut()` 후 `window.location.href = '/'`로 이동
- [ ] `app/page.tsx`에서 import하여 사용
- [ ] Typecheck 통과
- [ ] 브라우저에서 로그아웃 동작 확인

### US-005: TripCreateButton Client Component 신규 생성
**Description:** As a user, I want to create a new trip from the main page so that I can start recording a new journey.

**Acceptance Criteria:**
- [ ] `components/TripCreateButton.tsx` 파일 생성
- [ ] `'use client'` 지시어 포함
- [ ] `+` 버튼 클릭 시 `TripFormModal` 표시
- [ ] 여행 생성(`POST /api/trips`) 성공 시 `/checkin?trip_id=...`으로 이동 (기존 동작 유지)
- [ ] `app/page.tsx`에서 import하여 사용
- [ ] Typecheck 통과
- [ ] 브라우저에서 여행 생성 플로우 확인

### US-006: /api/trips GET 핸들러 쿼리 로직 이전
**Description:** As a developer, I want the trips query logic duplicated into a server-side `fetchTrips()` function while keeping the GET handler intact, so that the checkin page continues to work without changes.

**Acceptance Criteria:**
- [ ] `page.tsx` 내 `fetchTrips(supabase)` 함수가 기존 GET 핸들러와 동일한 쿼리 로직(trips + checkins 보강)을 가짐
- [ ] `/api/trips` GET 핸들러는 그대로 유지 (`app/checkin/hooks/useTrips.ts`가 계속 사용)
- [ ] Typecheck/lint 통과

### US-007: 자동화 테스트 추가
**Description:** As a developer, I want automated tests for the refactored main page and related components so that regressions are caught automatically.

**Acceptance Criteria:**
- [ ] `fetchTrips()` 함수에 대한 단위 테스트 작성 (Supabase 클라이언트 mock)
- [ ] `LogoutButton` 렌더링 및 클릭 핸들러 테스트
- [ ] `TripCreateButton` 렌더링 및 모달 열기 테스트
- [ ] 기존 테스트 모두 통과 (`npm test`)
- [ ] 빌드 성공 (`npm run build`)

## Functional Requirements

- FR-1: `app/page.tsx`는 async Server Component여야 하며, 클라이언트 사이드 state나 effect를 사용하지 않아야 한다.
- FR-2: 서버에서 `createClient()`(server)로 현재 로그인 user를 조회하고, 로그인하지 않은 경우 `/login`으로 redirect한다.
- FR-3: `fetchTrips(supabase)` 함수는 `trips` 테이블을 `created_at` 내림차순으로 조회하고, `checkins`에서 `first_checkin_date`와 `cover_photo_url`을 보강하여 반환한다.
- FR-4: `LogoutButton`은 독립 Client Component로 분리되며, `page.tsx`에 import된다.
- FR-5: `TripCreateButton`은 독립 Client Component로 분리되며, 내부에서 `TripFormModal`을 조건부 렌더링한다.
- FR-6: `/api/trips` GET 핸들러는 `app/checkin/hooks/useTrips.ts`가 계속 사용하므로 유지한다. 쿼리 로직만 `fetchTrips()`로 복제한다. POST 핸들러도 그대로 유지한다.
- FR-8: `TripFormData`는 `types/database.ts`에 `Omit<TripInsert, 'user_id'>`로 통합하고, `useTrips.ts`의 중복 정의는 제거한다.
- FR-9: `TripFormModal`은 `components/TripFormModal.tsx`로 이동하며, 기존 사용처(`app/checkin/page.tsx`, `app/page.tsx`, `TripCreateButton`)의 import 경로를 모두 업데이트한다.
- FR-7: 메인 페이지 로드 시 클라이언트에서 발생하는 네트워크 fetch는 0회여야 한다.

## Non-Goals

- `/api/trips` POST 핸들러 변경 없음 (TripCreateButton이 계속 사용)
- 체크인 관련 API 변경 없음
- 로그인 페이지(`/login`) UI 변경 없음
- SSR 캐싱 전략 도입 (이번 범위 외)
- Lighthouse 점수 측정 및 목표 수치 설정 없음

## Technical Considerations

- `@/lib/supabase/server`의 `createClient()`는 서버 환경 전용이므로, Client Component에서 사용 금지
- `LogoutButton`, `TripCreateButton`은 `'use client'` 지시어가 필수
- `TripFormModal` 이동 + `TripFormData` 통합(US-001)은 `TripCreateButton` 구현(US-005) 전에 완료해야 함
- `TripFormData`는 US-001에서 `types/database.ts`로 통합 (`Omit<TripInsert, 'user_id'>`)
- 빌드 전 dev 서버 종료 필요 (`.next` 충돌 방지, CLAUDE.md 참고)
- Supabase 서버 클라이언트는 cookies를 사용하므로, Next.js 15 App Router의 `cookies()` API 호환성 확인

## Success Metrics

- 메인 페이지 로드 시 클라이언트 fetch 0회 (Network 탭에서 auth, trips 관련 fetch 없음)
- `npm run build` 성공
- `npm test` 전체 통과

## Open Questions

없음.
