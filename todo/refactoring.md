# Refactoring Plan

아키텍처 침식과 기술 부채를 방지하기 위한 리팩토링 계획.

---

## 현황 요약

| 구분 | 문제 | 심각도 |
|------|------|--------|
| 타입 정의 | `web/types/database.ts` ↔ `packages/shared/types.ts` 100% 중복 | 높음 |
| 대형 파일 | TripScreen.tsx 892줄, CheckinFormScreen.tsx 633줄, checkin/page.tsx 591줄, api.ts 507줄 | 높음 |
| 데이터 페칭 로직 | `fetchTrips` 변환 로직이 웹 API 라우트와 모바일 api.ts에 동일하게 복제 | 높음 |
| API 라우트 일관성 | `calendar/route.ts` 등 일부가 `getAuthenticatedClient` 미사용 | 중간 |
| 모바일 api.ts 구조 | 여러 도메인 함수가 507줄 단일 파일에 집중 (두 접근 패턴은 의도된 설계) | 중간 |
| 테스트 공백 | API 라우트 중 3개 테스트 없음 (`places/nearby`, `settings`, `story/[id]`) | 중간 |
| 코드 품질 | 인라인 스타일 vs Tailwind 혼용, console.log 잔류 | 낮음 |
| 다국어 | 한국어 문자열 하드코딩, i18n 라이브러리 미도입 | 낮음 (향후 대비) |

---

## 전체 원칙

### 인증·보안 동작 불변

리팩토링 중 인증·보안 관련 코드는 **기능 동작을 절대 변경하지 않는다**.

- 인증 로직(`getAuthenticatedClient`, RLS, Bearer 토큰 처리)은 동작을 보존하면서 구조만 정리한다
- 접근 제어 결과(허용/거부)가 리팩토링 전후 동일해야 한다
- 인증·보안 코드를 수정할 때는 반드시 기존 테스트가 통과하는지 확인하고, 테스트가 없으면 **수정 전에 먼저 테스트를 작성**한다
- 조건부 인증 패턴(비인증 허용 경로 포함)은 의도된 설계일 수 있으므로, 변경 전 설계 의도를 코드·문서에서 반드시 확인한다
- `calendar/connect`, `calendar/connect/callback` 등 OAuth 흐름 핸들러는 Bearer 토큰 패턴과 무관하므로 인증 리팩토링 대상에서 제외한다

---

## 진행 순서

```
Phase 1 (타입 통합)
  → Phase 3 (공유 유틸 추출, Phase 2의 분할 전 선행)
  → Phase 2 (대형 파일 분할)
  → Phase 4 (일관성 + 테스트)
  → Phase 5 (품질 정리)
  → Phase 6 (i18n 준비 — Phase 3 완료 후 독립적으로 진행 가능)
```

Phase 1, 3은 다른 작업의 기반이므로 먼저 진행. Phase 2는 공수가 가장 크므로 별도 브랜치에서 진행 권장.

---

## Phase 1 — 타입 중복 제거

**예상 시간**: ~2시간  
**목표**: `web/types/database.ts`를 제거하고 `packages/shared/src/types.ts` 단일 소스로 통합.

### 배경

`apps/web/types/database.ts`(149줄)와 `packages/shared/src/types.ts`(144줄)가 Trip, Checkin, TripInsert, CheckinInsert, CHECKIN_CATEGORIES, CHECKIN_CATEGORY_LABELS를 100% 동일하게 중복 정의하고 있다. 타입 변경 시 두 곳을 동시에 수정해야 하며, 불일치가 발생하면 웹-모바일 간 타입 오류로 이어진다.

### 선행 작업 — workspace 패키지 연결

현재 `@travel-companion/shared`가 어디에도 npm 의존성으로 선언되어 있지 않다. 웹은 패키지 이름 import가 불가능하고, 모바일은 상대경로로 직접 import하고 있다. import 방식을 통일하기 전에 먼저 해결해야 한다.

- [ ] `apps/web/package.json`에 `"@travel-companion/shared": "*"` 추가 (workspace 의존성)
- [ ] `apps/web/tsconfig.json` 경로 alias 확인 (`@travel-companion/shared` → `packages/shared/src`)
- [ ] `apps/mobile/package.json`에도 동일하게 추가하고 상대경로 import를 패키지 이름으로 통일

### 작업

- [ ] `apps/web` 내 `database.ts` import를 `@travel-companion/shared`로 일괄 교체
- [ ] `apps/web/types/database.ts` 삭제
- [ ] 웹 전용 타입이 있으면 `packages/shared/src/types.ts`로 이동
- [ ] `npm run build && npm test` 통과 확인

---

## Phase 2 — 대형 파일 분할

**예상 시간**: ~1주  
**기준**: 단일 책임 원칙. 컴포넌트는 렌더링, 훅은 상태/데이터, 유틸은 순수 함수.

### 2-1. 모바일 `src/lib/api.ts` (507줄) → 도메인별 분리

여러 도메인의 함수가 단일 파일에 집중되어 있어 탐색과 유지보수가 어렵다.

> **아키텍처 원칙 보존**: 모바일은 CRUD(여행·체크인·이미지 업로드)를 Vercel을 거치지 않고 Supabase JS SDK로 직접 호출한다. Vercel cold start(1~3초)와 왕복 레이턴시를 없애기 위한 의도된 설계다. 분리 후에도 이 경계는 반드시 유지해야 한다.
>
> | 접근 패턴 | 대상 | 이유 |
> |-----------|------|------|
> | Supabase 직접 | CRUD (trips, checkins), 이미지 업로드, 근처 조회 | 성능 (cold start 없음) |
> | REST API 경유 | Places, Calendar, AI 태그라인, Settings | 서버 비밀키 필요 |

**목표 구조**:

```
src/lib/
  api/
    supabase-client.ts   # getUser(), Supabase 인증 헬퍼
    rest-client.ts       # apiFetch() — Vercel API Bearer 토큰 호출
    trips.ts             # fetchTrips, createTrip, updateTrip, deleteTrip (Supabase 직접)
    checkins.ts          # fetchCheckins, createCheckin, updateCheckin, deleteCheckin (Supabase 직접)
    nearby.ts            # fetchNearbyCheckins (Supabase 직접)
    storage.ts           # uploadPhoto (Supabase Storage 직접)
    places.ts            # searchPlaces, getPlaceDetails (REST API 경유)
    calendar.ts          # fetchCalendarEvents, fetchScheduleWithWeather (REST API 경유)
    settings.ts          # fetchSettings, updateSettings (REST API 경유)
  api.ts                 # re-export only (하위 호환 유지 후 점진적 제거)
```

- [ ] `supabase-client.ts` 추출 (getUser, Supabase 인증 헬퍼)
- [ ] `rest-client.ts` 추출 (apiFetch, Bearer 토큰 처리)
- [ ] `trips.ts` 추출 (Supabase 직접)
- [ ] `checkins.ts` 추출 (Supabase 직접)
- [ ] `nearby.ts` 추출 (Supabase 직접, haversineDistance 포함 — Phase 3에서 shared로 이동)
- [ ] `storage.ts` 추출 (Supabase Storage 직접)
- [ ] `places.ts` 추출 (REST API 경유)
- [ ] `calendar.ts` 추출 (REST API 경유)
- [ ] `settings.ts` 추출 (REST API 경유)
- [ ] 기존 `api.ts` re-export만 남기고 점진적 import 교체 후 삭제
- [ ] 모바일 Jest 테스트 통과 확인

### 2-2. 모바일 `TripScreen.tsx` (892줄) → 섹션별 분리

단일 컴포넌트가 체크인 목록, 지도, 필터링, 상태 관리를 모두 담당하고 있다.

**목표 구조**:

```
src/screens/trip/
  TripScreen.tsx          # 상태 조합 + 레이아웃 (~150줄)
  TripHeader.tsx          # 헤더 + 메뉴
  TripCheckinList.tsx     # 체크인 목록 + 필터
  TripMap.tsx             # 지도 뷰
  hooks/
    useTripDetail.ts      # 데이터 페칭 + 파생 상태
```

- [ ] `useTripDetail.ts` 훅 추출 (데이터 페칭, 파생 상태)
- [ ] `TripHeader.tsx` 분리
- [ ] `TripCheckinList.tsx` 분리 (필터 로직 포함)
- [ ] `TripMap.tsx` 분리
- [ ] `TripScreen.tsx` 슬림화 (~150줄 목표)
- [ ] 테스트 통과 확인

### 2-3. 웹 `app/checkin/page.tsx` (591줄) → 역할 분리

페이지 컴포넌트가 LocationPicker 제어, 여행 선택, 체크인 폼, 지도, 서랍을 직접 조율하고 있다.

**구현된 구조**:

```
app/[locale]/checkin/
  page.tsx                      # 상태 조합 + Provider (134줄) ✅
  components/
    CheckinPageHeader.tsx       # 헤더 (햄버거 메뉴, 여행 제목, 아바타) ✅
    TripContent.tsx             # 선택된 여행의 본문 (폼, 지도, 태그라인, 타임라인) ✅
    EmptyTripsView.tsx          # 여행 없음 안내 ✅
    CheckinPageOverlays.tsx     # SideDrawer, BottomBar, TripFormModal, LocationPicker 등 ✅
    (기존) BottomBar.tsx, CheckinTimeline.tsx, SideDrawer.tsx, TaglineBanner.tsx 등
  hooks/
    useCheckinPage.ts           # LocationPicker 제어, 선택 상태 ✅
```

> **계획 대비 변경**: `CheckinPageLayout`(전체 레이아웃), `TripSelector`(여행 선택 사이드바), `CheckinDrawer`(하단 서랍) 대신 실제 책임 단위에 맞게 `CheckinPageHeader`, `TripContent`, `EmptyTripsView`, `CheckinPageOverlays`로 분리됨. 기존 컴포넌트(SideDrawer, BottomBar 등)가 이미 각 역할을 담당하고 있어 추가 레이어 대신 조합 컴포넌트로 구성.

- [x] `useCheckinPage.ts` 훅 추출 (LocationPicker useRef 패턴 포함)
- [x] `CheckinPageHeader.tsx` 분리
- [x] `TripContent.tsx` 분리
- [x] `EmptyTripsView.tsx` 분리
- [x] `CheckinPageOverlays.tsx` 분리
- [x] `page.tsx` 슬림화 (284줄 → 134줄)
- [x] 웹 빌드 + 테스트 통과 확인

### 2-4. 모바일 `CheckinFormScreen.tsx` (633줄) → 폼 섹션별 분리

**구현된 구조**:

```
src/screens/checkin-form/
  CheckinFormScreen.tsx         # 폼 상태 조합 (96줄) ✅
  hooks/
    useCheckinForm.ts           # 폼 상태 관리 ✅
  sections/
    FormHeader.tsx              # 아바타, 여행 선택 칩, 취소/제출 버튼 ✅
    FormBody.tsx                # 제목 입력, 메모, 사진, InfoChips, 에러 표시 ✅
    PhotoSection.tsx            # 사진 업로드 ✅
    TimePickerSection.tsx       # 시간 선택 ✅
    InfoChips.tsx               # 위치·카테고리 칩 표시 ✅
    NoteSection.tsx             # 메모 입력 ✅
```

> **계획 대비 변경**: `LocationSection`, `CategorySection`은 기존 `InfoChips`(위치·카테고리 칩)와 `CategorySelector`가 이미 해당 역할을 수행하고 있어 별도 섹션 생성 생략. `TimeSection` → `TimePickerSection`으로 명명. 폼을 `FormHeader`(상단 액션바)와 `FormBody`(입력 영역) 두 섹션으로 구조화.

- [x] `FormHeader.tsx` 분리 (아바타, 여행 선택, 버튼)
- [x] `FormBody.tsx` 분리 (입력 필드 묶음)
- [x] `PhotoSection.tsx` 분리
- [x] `TimePickerSection.tsx` 분리
- [x] `InfoChips.tsx` 분리
- [x] `NoteSection.tsx` 분리
- [x] `CheckinFormScreen.tsx` 슬림화 (355줄 → 96줄)
- [x] 테스트 통과 확인

---

## Phase 3 — 공유 순수 함수 추출

**예상 시간**: ~1주 (날짜 포맷 API 설계 포함, 당초 3일에서 상향)  
**목표**: 웹과 모바일에 중복된 변환 로직을 `packages/shared` 유틸로 추출한다.

### 배경

모바일은 성능을 위해 Supabase를 직접 호출하고, 웹 API 라우트도 서버에서 Supabase를 호출한다. **두 Supabase 쿼리 자체는 의도적으로 각자 유지된다** — 하나를 없애면 모바일이 Vercel을 경유하게 되어 성능 아키텍처가 무너진다.

공유 대상은 Supabase 쿼리 결과를 **도메인 객체로 변환하는 로직**과 날짜 포맷팅, 거리 계산이다.

### 설계 결정 필요 사항

#### cover_photo_url 선택 로직 (`buildTripWithMeta`)

현재 구현이 `Math.random()`으로 커버 사진을 선택한다. 같은 입력에 다른 결과가 나오므로 순수 함수로 추출할 수 없다.

**결정: 첫 번째 사진(index 0)으로 고정**
- 테스트 가능해지고 동작이 예측 가능해짐
- 랜덤 선택이 사용자에게 의미 있는 기능이 아님
- 기존 동작과 미세하게 달라질 수 있으나 기능 저하 없음

#### 날짜 포맷 API 설계

웹 4개 + 모바일 4개, 총 8개의 날짜 포맷 함수가 각기 다른 이름과 포맷으로 산재해 있다. 단순 추출이 아니라 포맷 종류별 API를 먼저 설계해야 한다.

| 현재 함수명 | 위치 | 용도 |
|------------|------|------|
| `formatDate` | web/calendar/page.tsx | 캘린더 이벤트 날짜 |
| `formatDateHeader` | web/checkin/CheckinTimeline.tsx | 날짜 구분선 |
| `formatDateHeader` | web/story/StoryContent.tsx | 동일 이름, 다른 구현 |
| `formatDateForPrompt` | web/lib/ai/tripTagline.ts | AI 프롬프트용 |
| `formatDate` | mobile/TripScreen.tsx | 모바일 날짜 |
| `formatDateTime` | mobile/CheckinsScreen.tsx | 날짜+시간 |
| `formatDateHeader` | mobile/ScheduleScreen.tsx | 모바일 스케줄 |
| `formatDate`, `formatDateDisplay` | mobile/TripFormModal.tsx | 2개 혼용 |

통합 API 설계 방향:
```typescript
// 포맷 종류별로 명확히 분리 (packages/shared/utils/date.ts)
formatDate(date, locale?)         // 날짜만: "Jan 5, 2026" / "2026년 1월 5일"
formatDateTime(date, locale?)     // 날짜+시간: "Jan 5, 2026 3:00 PM"
formatDateHeader(date, locale?)   // 날짜 구분선: "Sunday, January 5"
```

> `formatDateForPrompt`는 웹 AI 기능(`apps/web/lib/ai/tripTagline.ts`)에서만 사용하는 웹 전용 함수다. shared에 포함하면 웹 AI 로직이 공유 패키지로 유입되므로 **현재 위치에 그대로 유지**한다.

### 목표 구조

```
packages/shared/src/
  types.ts
  utils/
    trip.ts       # buildTripWithMeta(rawTrip, checkins[]) → Trip 변환
    checkin.ts    # sortCheckins, filterCheckins
    date.ts       # formatDate, formatDateTime, formatDateHeader
    geo.ts        # haversineDistance
```

### 작업

- [ ] `cover_photo_url` 선택을 첫 번째 사진으로 고정 (웹·모바일 동시)
- [ ] `packages/shared/src/utils/trip.ts` 생성 — `buildTripWithMeta()` 추출
- [ ] `packages/shared/src/utils/date.ts` 생성 — 포맷 종류별 API 설계 후 8개 함수 통합
- [ ] `packages/shared/src/utils/geo.ts` 생성 — `haversineDistance` 이동 (Phase 2-1의 nearby.ts에서)
- [ ] `packages/shared/src/utils/checkin.ts` 생성 — 정렬/필터 로직 추출
- [ ] `packages/shared/src/index.ts`에 re-export 추가
- [ ] 웹 API 라우트에서 shared utils import로 교체
- [ ] 모바일에서 shared utils import로 교체
- [ ] 빌드 + 테스트 통과 확인

---

## Phase 4 — API 라우트 일관성 + 테스트 공백

**예상 시간**: ~3일

### 4-0. 유닛 테스트 작성 원칙

신규 테스트와 기존 테스트 보강 모두 아래 세 가지 조건을 커버한다.

| 조건 | 정의 | 예시 |
|------|------|------|
| **Positive** | 올바른 입력에 대해 기대 결과를 반환한다 | 인증된 사용자가 여행 조회 → 200 + 목록 반환 |
| **Negative** | 잘못된 입력·권한 부재 시 적절한 오류를 반환한다 | 비인증 요청 → 401, 타인 리소스 접근 → 403/404, 필수 필드 누락 → 400 |
| **Boundary** | 경계값·엣지 케이스에서 의도대로 동작한다 | 빈 배열 반환, 최대/최솟값 입력, 체크인 0개인 여행, 정확히 반경 경계에 있는 좌표 |

```typescript
describe('GET /api/trips', () => {
  it('인증된 사용자의 여행 목록을 반환한다', ...);          // positive
  it('비인증 요청은 401을 반환한다', ...);                 // negative
  it('여행이 없는 사용자는 빈 배열을 반환한다', ...);       // boundary
});
```

기존 테스트가 positive만 커버하는 경우 negative·boundary를 보강한다.

### 4-1. calendar 라우트 인증 패턴 검토

> **인증·보안 동작 불변 원칙 적용** — 접근 제어 결과(허용/거부)가 변경되어서는 안 된다. 코드 구조 정리에 한정한다.

`calendar/route.ts`와 `calendar/schedule/route.ts`는 이미 `getAuthenticatedClient`를 조건부로 사용 중이다. 인증된 사용자에게는 개인화 데이터를, 비인증 사용자에게는 공개 데이터를 반환하는 의도된 설계일 수 있으므로 단순 교체가 아니라 **설계 의도 적절성을 먼저 검토**한다.

> `calendar/connect/route.ts`, `calendar/connect/callback/route.ts`는 OAuth 리다이렉트 핸들러로 Bearer 토큰 패턴 적용 대상이 아님 — 수정 제외.

- [ ] 각 라우트의 인증 패턴 검토 전 **테스트가 없으면 먼저 작성**
- [ ] `app/api/calendar/route.ts` — 조건부 인증 패턴이 의도된 설계인지 확인, 불필요한 비인증 허용이면 수정
- [ ] `app/api/calendar/schedule/route.ts` — 동일하게 검토
- [ ] `app/api/calendar/disconnect/route.ts`, `advice/route.ts` — 표준 패턴 사용 여부 점검
- [ ] 수정 전후 인증/비인증 요청 동작이 동일한지 테스트로 확인

### 4-2. 테스트 없는 API 라우트 테스트 추가

우선순위 순 (버그 위험도 기준):

- [ ] `app/api/places/nearby/route.ts` — 공개 엔드포인트(인증 없음), Google Places API로 근처 **장소** 반환. Positive: 좌표 제공 시 근처 장소 목록 반환 / Negative: lat·lng 누락 → 400, Google API 오류 → 500 / Boundary: ZERO_RESULTS 응답 시 빈 배열 반환
- [ ] `app/api/settings/route.ts` — Positive: GET/PATCH 성공 / Negative: 비인증·허용되지 않는 필드 / Boundary: settings 미존재 초기 상태
- [ ] `app/api/story/[id]/route.ts` — Positive: 공개 여행 비인증 조회 / Negative: 비공개 여행 비인증 접근·존재하지 않는 ID / Boundary: 체크인 없는 공개 여행

각 테스트는 AGENTS.md의 API Route 테스트 패턴을 따른다:
- 파일 위치: route 파일 옆 `__tests__/route.test.ts`
- 파일 최상단: `/** @jest-environment node */`
- `docs/api/` 문서에 명시된 응답 필드 assertion 포함

### 4-3. 기존 테스트 보강

새로 작성되는 공유 유틸(`packages/shared/utils/`)과 분리된 모바일 api 모듈도 세 조건을 커버한다:

- [ ] `shared/utils/trip.ts` — Positive: 정상 변환 / Negative: 체크인 배열 없음 / Boundary: 체크인 0개·photo_url 없는 체크인만 있는 경우
- [ ] `shared/utils/geo.ts` — Positive: 두 좌표 간 거리 / Boundary: 동일 좌표(0m)·antipodal points(최대 거리)
- [ ] `shared/utils/date.ts` — Positive: 각 locale 포맷 / Boundary: 잘못된 날짜 문자열·locale 미지정 시 기본값 'en'

---

## Phase 5 — 코드 품질 정리

**예상 시간**: ~반나절  
**전제**: 기능 변경 없음, 순수 정리 작업.

### 5-1. console.log 제거

API 라우트의 console.error는 Vercel 로그에 노출되므로 구조화된 에러 처리로 대체하거나 제거.

- [ ] `app/api/calendar/route.ts` — console.warn, console.log, console.error 9개
- [ ] `app/api/checkins/route.ts` — console.error 4개
- [ ] `app/api/trips/route.ts` — console.error 4개
- [ ] `app/api/trips/[id]/route.ts` — console.error 4개
- [ ] `app/api/places/` 하위 라우트 — console.error 각 2개
- [ ] 모바일 소스 파일 console.log 점검 및 제거

### 5-2. 인라인 스타일 → Tailwind 전환

> **주의**: `position: fixed` + `zIndex` 조합은 Google Maps API의 `transform` 주입으로 인한 stacking context 문제를 우회하기 위한 의도적 구현일 수 있다. 변환 전 기능 검증 필수.

- [ ] `components/TripDeleteDialog.tsx` — 인라인 style 10개 이상
- [ ] `components/checkin-form/CheckinFormToolbar.tsx` — 인라인 style 8개 이상
- [ ] `app/checkin/page.tsx` — 인라인 style 6개 이상
- [ ] `components/checkin-form/CheckinFormTimePanel.tsx` — 인라인 style 4개 이상
- [ ] `components/LocationPicker.tsx` — fixed overlay는 기능 검증 후 결정
- [ ] iOS Safari에서 UI 동작 확인

---

## Phase 6 — 다국어(i18n) 준비

**예상 시간**: ~1주  
**목표**: 실제 번역 작업 전에 코드베이스를 i18n-ready 상태로 만드는 것. 하드코딩된 한국어 문자열을 메시지 카탈로그로 추출하고, 웹/모바일 각각 i18n 라이브러리를 도입한다.

> **선행 조건**: Phase 3 완료 후 진행 권장. `packages/shared/utils/date.ts`의 날짜 포맷 함수가 로케일을 인수로 받도록 미리 설계되어 있어야 한다.

### 6-1. 라이브러리 선택

| 플랫폼 | 라이브러리 | 이유 |
|--------|-----------|------|
| 웹 (Next.js App Router) | `next-intl` | App Router 네이티브 지원, 서버 컴포넌트 호환, 타입 안전 메시지 |
| 모바일 (Expo) | `i18next` + `react-i18next` + `expo-localization` | React Native 생태계 표준, 웹과 메시지 파일 구조 공유 가능 |
| 공유 카탈로그 | `packages/shared/messages/` | 카테고리 레이블 등 웹·모바일 공통 문자열 |

### 6-2. 메시지 파일 구조

지원 언어: **영어(en, 기본값)**, 한국어(ko)

```
packages/shared/
  messages/
    en.json          # 영어 (기본값)
    ko.json          # 한국어

apps/web/
  messages/
    en.json          # 웹 전용 문자열 (페이지 제목, 에러 메시지 등) — 기본값
    ko.json

apps/mobile/
  src/i18n/
    en.json          # 모바일 전용 문자열 — 기본값
    ko.json
    index.ts         # i18next 초기화
```

공통 문자열(카테고리 레이블, 상태 메시지 등)은 `packages/shared/messages/`에 두고 웹·모바일이 각자 import.

### 6-3. 웹 설정

Next.js App Router의 locale 기반 라우팅 적용:

기본 로케일은 `en`. `/checkin` 접근 시 `/en/checkin`으로 리다이렉트.

```
app/
  [locale]/          # /en/checkin (기본), /ko/checkin
    checkin/
    settings/
    ...
  layout.tsx         # NextIntlClientProvider 주입
```

- [ ] `next-intl` 설치 및 `next.config.ts` 설정
- [ ] `app/[locale]/` 구조로 페이지 이동
- [ ] `middleware.ts`에 locale 감지 및 리다이렉트 추가 (브라우저 Accept-Language 기반)
- [ ] `NextIntlClientProvider`를 루트 레이아웃에 추가
- [ ] 웹 빌드 통과 확인

### 6-4. 모바일 설정

- [ ] `i18next`, `react-i18next`, `expo-localization` 설치
- [ ] `src/i18n/index.ts` — 디바이스 언어(`Localization.getLocales()`) 기반 초기화
- [ ] `I18nextProvider`를 `App.tsx` 루트에 추가
- [ ] 모바일 빌드 + Jest 통과 확인

### 6-5. 공통 타입 i18n 대응

`packages/shared/src/types.ts`의 `CHECKIN_CATEGORY_LABELS`는 현재 한국어 하드코딩:

```typescript
// 현재
export const CHECKIN_CATEGORY_LABELS: Record<CheckinCategory, string> = {
  restaurant: '음식점',
  ...
};

// 변경 후 — 레이블은 메시지 카탈로그에서 조회
// types.ts에서 제거하고 messages/ko.json, messages/en.json으로 이동
```

- [ ] `CHECKIN_CATEGORY_LABELS`를 `packages/shared/messages/ko.json`, `en.json`으로 이동
- [ ] 웹·모바일에서 `t('category.restaurant')` 패턴으로 교체
- [ ] 기존 `CHECKIN_CATEGORY_LABELS` 사용처 전체 교체

### 6-6. 하드코딩 문자열 추출

우선순위 높은 영역부터 추출:

**웹**
- [ ] 체크인 폼 레이블, 플레이스홀더, 에러 메시지 (`components/checkin-form/`)
- [ ] 여행 목록/상세 UI 문자열 (`app/checkin/page.tsx`, `components/TripCard.tsx`)
- [ ] 설정 페이지 (`app/settings/`)
- [ ] 공개 스토리 페이지 (`app/story/`)

**모바일**
- [ ] 홈 화면, 여행 상세 화면 (`HomeScreen.tsx`, `TripScreen.tsx`)
- [ ] 체크인 폼 (`CheckinFormScreen.tsx`)
- [ ] 네비게이션 탭 레이블

### 6-7. 날짜/시간 포맷 로케일 대응

Phase 3에서 추출한 `packages/shared/utils/date.ts` 함수들이 로케일을 인수로 받도록 변경:

```typescript
// 변경 전
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ko', { ... }).format(new Date(date));
}

// 변경 후
export function formatDate(date: string, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, { ... }).format(new Date(date));
}
```

- [ ] `utils/date.ts` 함수 시그니처에 `locale` 파라미터 추가
- [ ] 웹·모바일 호출부에서 현재 로케일 전달

### 6-8. Playwright E2E 경로 처리

기존 E2E 테스트(`auth.spec.ts`, `layout.spec.ts`, `pwa.spec.ts`)는 locale prefix 없는 경로를 직접 사용한다:
```typescript
await page.goto('/login');
await page.goto('/calendar');
await page.goto('/');
```

`app/[locale]/` 구조 전환 시 이 경로들이 영향을 받는다.

- [ ] `/login` 등 인증·공개 경로를 `[locale]/` 하위로 이동할지, locale prefix 없이 유지할지 결정
- [ ] middleware 리다이렉트 동작 확인 (`/login` → `/en/login` 여부)
- [ ] E2E 테스트에서 영향받는 경로 전수 확인 및 수정

### 6-9. 완료 기준

- [ ] `/en/checkin` 접속 시 영어 UI 표시, `/ko/checkin` 접속 시 한국어 UI 표시 (웹)
- [ ] `/checkin` 등 locale 없는 경로 접근 시 `/en/checkin`으로 리다이렉트 (웹)
- [ ] 디바이스 언어가 한국어인 경우 한국어, 그 외는 영어 UI 표시 (모바일)
- [ ] `npm run build && npm test` 전체 통과
- [ ] Playwright E2E 전체 통과 (locale 전환 후 경로 수정 포함)

---

## 완료 기준

각 Phase 완료 조건:
1. `npm run build` 성공
2. `npm test` 전체 통과
3. 기존 E2E 테스트 통과 (해당하는 경우)
4. PR 단위로 커밋 — Phase별 또는 세부 작업별
