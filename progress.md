# Refactoring Progress

브랜치: `refactor/phase2-file-split`  
기준 날짜: 2026-04-05

---

## 전체 진행 상황

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | 타입 중복 제거 | ✅ 완료 |
| Phase 2-1 | 모바일 `api.ts` 도메인별 분리 | ✅ 완료 |
| Phase 2-2 | 모바일 `TripScreen.tsx` 섹션 분리 | ✅ 완료 |
| Phase 2-3 | 웹 `checkin/page.tsx` 컴포넌트 분리 | ✅ 완료 |
| Phase 2-4 | 모바일 `CheckinFormScreen.tsx` 섹션 분리 | ✅ 완료 |
| Phase 3 | 공유 순수 함수 추출 | ✅ 완료 |
| Phase 4 | API 라우트 테스트 추가 | ✅ 완료 |
| Phase 5 | 코드 품질 정리 | ✅ 완료 |
| Phase 6 | i18n 준비 | ✅ 완료 |

---

## Phase별 상세

### Phase 1 — 타입 중복 제거

**목표**: `web/types/database.ts`를 제거하고 `@travel-companion/shared` 단일 소스로 통합.

**완료 내용**:
- `apps/web/types/database.ts` 삭제 (이미 제거되어 있었음)
- `apps/web/types/index.ts` (미사용 구식 camelCase 타입) 삭제
- `apps/mobile/package.json` Jest `moduleNameMapper`에 `@travel-companion/shared` 추가
- `apps/mobile/tsconfig.json`에 `paths` alias 추가
- `apps/mobile/metro.config.js`에 `extraNodeModules` 매핑 추가
- 모바일 소스 19개 파일의 상대경로 import (`../../../../packages/shared/src/types` 등) → `@travel-companion/shared` 통일

---

### Phase 2 — 대형 파일 분할

#### 2-1. 모바일 `src/lib/api.ts` (507줄) → 도메인별 분리

**완료 내용**:
- `src/lib/api/` 하위에 도메인별 파일 분리
  - `supabase-client.ts` — Supabase 인증 헬퍼
  - `rest-client.ts` — `apiFetch()` Bearer 토큰 호출
  - `trips.ts` — fetchTrips, createTrip, updateTrip, deleteTrip (Supabase 직접)
  - `checkins.ts` — fetchCheckins, createCheckin, updateCheckin, deleteCheckin (Supabase 직접)
  - `nearby.ts` — fetchNearbyCheckins (Supabase 직접)
  - `storage.ts` — uploadPhoto (Supabase Storage 직접)
  - `places.ts` — searchPlaces, getPlaceDetails (REST API 경유)
  - `calendar.ts` — fetchCalendarEvents, fetchScheduleWithWeather (REST API 경유)
  - `settings.ts` — fetchSettings, updateSettings (REST API 경유)
  - `index.ts` — re-export
- 기존 `api.ts` → 1줄 re-export만 남김 (하위 호환)
- **설계 원칙 보존**: CRUD는 Supabase 직접, 서버 비밀키 필요 기능만 REST API 경유

#### 2-2. 모바일 `TripScreen.tsx` (892줄) → 섹션 분리

**완료 내용**:
- `src/screens/trip/` 디렉토리로 이동
  - `TripScreen.tsx` (~300줄) — 상태 조합 + 레이아웃
  - `TripHeader.tsx` — 헤더 + 메뉴
  - `TripMap.tsx` — 지도 뷰
  - `hooks/useTripDetail.ts` — 데이터 페칭, 파생 상태

#### 2-3. 웹 `app/checkin/page.tsx` (591줄) → 역할 분리

**완료 내용**:
- `app/checkin/components/` — BottomBar, CheckinTimeline, SideDrawer, TaglineBanner, TodayCalendar, TripFormModal, TripInfoCard
- `app/checkin/hooks/` — useCheckinPage, useCheckins, useTrips, useTripTagline

#### 2-4. 모바일 `CheckinFormScreen.tsx` (633줄) → 폼 섹션별 분리

**완료 내용**:
- `src/screens/checkin-form/` 디렉토리 생성
  - `CheckinFormScreen.tsx` (~250줄) — 상태 조합 + 레이아웃
  - `hooks/useCheckinForm.ts` — 16개 state 변수, submit 로직
  - `sections/PhotoSection.tsx` — 사진 업로드/미리보기
  - `sections/TimePickerSection.tsx` — 시각 선택
  - `sections/InfoChips.tsx` — 위치/카테고리/시각 chip

---

### Phase 3 — 공유 순수 함수 추출

**목표**: 웹·모바일에 중복된 변환 로직을 `packages/shared/src/utils/`로 추출.

**완료 내용**:
- `packages/shared/src/utils/geo.ts`
  - `haversineDistance(lat1, lng1, lat2, lng2): number`
- `packages/shared/src/utils/date.ts`
  - `parseLocalDate(dateStr)` — YYYY-MM-DD 타임존 안전 파싱
  - `formatTripDate(dateStr, options?)` — 여행 날짜 표시 (locale 파라미터 지원)
  - `toISODateString(date)` — Date → "YYYY-MM-DD"
  - `formatDateDisplay(date, options?)` — 날짜 선택 버튼 표시 (locale, fallback 파라미터 지원)
- `packages/shared/src/utils/trip.ts`
  - `buildTripMetaMap(checkins)` — trip_id별 first_checkin_date, cover_photo_url 계산
  - **설계 결정**: `cover_photo_url`을 `Math.random()` → 첫 번째 사진(index 0)으로 고정 (테스트 가능성, 결정론적 동작)
- `packages/shared/src/utils/index.ts` — re-export
- `packages/shared/src/index.ts`에 `export * from './utils'` 추가
- 웹 jest.config.ts에 `roots`에 shared 패키지 추가 (shared 유닛 테스트 웹 jest runner에서 실행)
- 각 유틸에 대한 유닛 테스트 작성 (20개 이상)
- 소비처 업데이트: 웹 API 라우트 2개, 모바일 api 파일 2개, 웹·모바일 컴포넌트/훅 다수

---

### Phase 4 — API 라우트 일관성 + 테스트 공백

**완료 내용**:
- `app/api/places/nearby/__tests__/route.test.ts` 신규 작성
  - lat/lng 필수 검증 (400), ZERO_RESULTS → 빈 배열, 최대 5개 반환, API 오류 → 500, type 파라미터
- `app/api/settings/__tests__/route.test.ts` 신규 작성
  - GET 성공, PATCH 성공, 잘못된 JSON → 400, profile 없는 초기 상태 → `{}`
- `app/api/story/[id]/__tests__/route.test.ts` 신규 작성
  - 공개 여행 비인증 조회, 비공개 여행 → `{ is_public: false, checkins: [] }`, 404, 체크인 없는 공개 여행
- calendar 라우트 인증 패턴 검토 → 조건부 인증이 의도된 설계임을 확인 (비인증 허용은 공개 데이터 반환 목적), 수정 없음

---

### Phase 5 — 코드 품질 정리

#### 5-1. console.* 제거

**완료 내용**:
- API 라우트 전체에서 `console.error`, `console.warn`, `console.log` 제거
  - `calendar/route.ts` (9개), `calendar/connect/callback/route.ts` (1개)
  - `checkins/route.ts`, `checkins/[id]/route.ts` (각 4개)
  - `trips/route.ts`, `trips/[id]/route.ts` (각 4개)
  - `trips/[id]/tagline/route.ts`, `trips/[id]/apply-place/route.ts` (각 2개)
  - `places/autocomplete/route.ts`, `places/details/route.ts`, `places/nearby/route.ts` (각 2개)
  - `story/[id]/route.ts` (1개)
- `catch (error)` → `catch` (미사용 변수 제거)

#### 5-2. 인라인 스타일 → Tailwind 전환

**완료 내용**:
- `components/TripDeleteDialog.tsx` — 전체 Tailwind 전환
- `components/checkin-form/CheckinFormToolbar.tsx` — 레이아웃/사이징 Tailwind 전환 (동적 색상·`bottom: toolbarBottom`은 inline 유지)
- `components/checkin-form/CheckinFormTimePanel.tsx` — 전체 Tailwind 전환
- `app/checkin/page.tsx` — 대부분 Tailwind 전환 (`paddingBottom: calc(80px + env(safe-area-inset-bottom))` inline 유지)

---

### Phase 6 — i18n 준비

**목표**: 하드코딩 한국어 문자열을 메시지 카탈로그로 추출하고 웹/모바일에 i18n 라이브러리 도입.

**완료 내용**:

**웹 (next-intl v4)**:
- next-intl 설치
- `apps/web/i18n/routing.ts` — locales: ['en', 'ko'], defaultLocale: 'en'
- `apps/web/i18n/request.ts` — 서버 측 locale 요청 처리
- `next.config.ts`에 `withNextIntl` 플러그인 추가
- 모든 페이지를 `app/[locale]/` 하위로 이동 (login, checkin, settings, calendar, story, test-map, test-upload)
- `app/[locale]/layout.tsx` — `NextIntlClientProvider` 주입
- `app/layout.tsx` — HTML 셸만 유지 (SessionRefresher → locale layout으로 이동)
- `middleware.ts` — next-intl 로케일 감지 + Supabase auth 통합
- `apps/web/messages/en.json`, `ko.json` — common, category, home, trip, checkin, location, settings, auth, story, calendar 네임스페이스
- 서버 async 컴포넌트: `getTranslations` from `next-intl/server` 사용 (home/page, settings/page)
- 클라이언트 컴포넌트: `useTranslations` 적용
  - TripDeleteDialog, TripFormModal, CheckinFormHeader, CheckinFormTimePanel, CheckinTimeline, checkin/page, login/page, settings/page, home/page

**모바일 (i18next)**:
- i18next, react-i18next, expo-localization 설치
- `apps/mobile/src/i18n/en.json`, `ko.json` — common, category, tab, home, trip, checkin, schedule 네임스페이스
- `apps/mobile/src/i18n/index.ts` — 디바이스 언어 기반 초기화 (expo-localization)
- `App.tsx`에 `I18nextProvider` 추가

**공유 메시지**:
- `packages/shared/messages/en.json`, `ko.json` — 카테고리 레이블

**date utils 업데이트**:
- `formatTripDate`, `formatDateDisplay`에 `locale` 파라미터 추가 (기본값 'ko', 하위 호환 유지)

---

## 검증

| 검증 항목 | 결과 |
|-----------|------|
| `npm run build` | ✅ 통과 |
| `npm test` (웹 339개 + 모바일 108개) | ✅ 통과 |
| 웹 E2E (Playwright, 14개) | ✅ 통과 |
| 모바일 E2E (Detox, 6개) | ✅ 통과 |

---

## 미완료 / 향후 과제

| 항목 | 설명 |
|------|------|
| i18n 문자열 추출 완성 | 웹 컴포넌트 다수(LocationPicker, CheckinListItem, CheckinFormMainPanel, CheckinFormCategoryPanel 등)와 모바일 컴포넌트에 아직 하드코딩 한국어 문자열 잔류. `t()` 교체 작업 미완료. |
| `CHECKIN_CATEGORY_LABELS` 메시지 카탈로그 이전 | `packages/shared/src/types.ts`의 `CHECKIN_CATEGORY_LABELS`를 `packages/shared/messages/`로 이전하고 `t('category.key')` 패턴으로 교체 미완료. |
| 모바일 i18next `t()` 적용 | i18n 인프라는 구축됐으나 실제 컴포넌트에 `useTranslation()` hook 적용 미완료. |
| E2E 로케일 경로 갱신 | `/login` → `/en/login` 리다이렉트가 투명하게 동작하므로 현재 E2E는 통과하지만, 명시적 locale 경로 테스트 케이스 미작성. |
