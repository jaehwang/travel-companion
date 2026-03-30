# 시스템 아키텍처

## 전체 구성도

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Client Layer                                                                │
│                                                                              │
│   ┌─────────────────────────┐         ┌──────────────────────────────────┐  │
│   │       Mobile App        │         │            Web App               │  │
│   │      (Expo / iOS)       │         │        (Next.js / Vercel)        │  │
│   └────┬──────────────┬─────┘         └────────────────┬─────────────────┘  │
│        │              │                                 │                    │
└────────┼──────────────┼─────────────────────────────────┼────────────────────┘
         │              │                                 │
         │ (A) Direct   │ (B) Server features             │ Cookie session
         │ Supabase SDK │ Bearer token / HTTP             │ HTTP/HTTPS
         │ CRUD, upload │ Places, Calendar, AI tagline    │
         │              │                                 │
         │              └──────────────┐                  │
         │                             ▼                  ▼
         │              ┌──────────────────────────────────────────────────┐
         │              │          Vercel  (Next.js /api/* handlers)       │
         │              └──────────────────────┬───────────────────────────┘
         │                                     │
         │                                     │ SQL / REST
         ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Supabase                                   │
│                   PostgreSQL + Auth + Storage                           │
└─────────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │ Storage egress proxy
                                   │
                      ┌────────────┴───────────────┐
                      │      Cloudflare Worker      │
                      │    (Image CDN / caching)    │
                      └────────────────────────────┘
```

---

## 구성 요소

### 1. Mobile App (Expo / iOS)

**역할**
- 여행 기록의 주 입력 인터페이스
- 현장에서 실시간 체크인 생성 (위치, 사진, 메모)
- 여행 목록 및 체크인 조회/수정/삭제
- Google 계정으로 로그인

**기술 특성**

| 항목 | 내용 |
|------|------|
| 프레임워크 | Expo 55 + React Native 0.83 |
| 언어 | TypeScript 5.9 |
| 네비게이션 | React Navigation 7 (Stack + Bottom Tabs) |
| 지도 | react-native-maps |
| 상태 관리 | zustand |
| 인증 세션 저장 | expo-secure-store (iOS Keychain) |
| 테스트 | Jest (unit), Detox (E2E) |
| 플랫폼 | iOS (주), Web (Expo 지원) |

**인증 방식**
- Supabase Auth (Google OAuth) 로 로그인
- 발급된 `access_token`을 iOS Keychain에 영속 저장 (expo-secure-store)
- `autoRefreshToken: true`로 만료 전 자동 갱신

**Supabase 직접 호출 (주 경로)**
- 여행·체크인 CRUD, 이미지 업로드는 Supabase JS SDK로 직접 호출
- Vercel API를 거치지 않아 cold start 지연 없음
- RLS 정책이 보안 경계: `anon key` 노출 시에도 타인 데이터 접근 불가

**Web App API 호출 (서버 기능 한정)**
- 서버 비밀 키가 필요하거나 서버에서만 가능한 기능에 한정
- `Authorization: Bearer <access_token>` 헤더 사용
- 개발 환경(`localhost:3000`) / 프로덕션 URL을 `.env`로 분리

| 작업 | 호출 경로 |
|------|----------|
| 여행·체크인 CRUD | Supabase 직접 |
| 이미지 업로드 | Supabase Storage 직접 |
| 장소 검색 (Google Places) | `/api/places/*` (API Key 서버 보관) |
| Google Calendar 연동 | `/api/calendar/*` (OAuth refresh token 서버 보관) |
| AI 태그라인 생성 | `/api/trips/[id]/tagline` (Gemini API Key 서버 보관) |
| 설정 조회/변경 | `/api/settings` |

---

### 2. Web App (Next.js / Vercel)

**역할**
- 여행 기록 조회 및 편집 (PWA)
- 모바일 앱의 백엔드 API 서버 역할 (`/api/*`)
- 공개 여행 스토리 공유 페이지 제공 (`/story/[id]`)
- Google Calendar 연동 및 AI 여행 추천

**기술 특성**

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript 5.7 |
| 스타일링 | Tailwind CSS 4.1 |
| 지도 | Google Maps JavaScript API |
| 이미지 처리 | exifr (EXIF 추출), browser-image-compression |
| AI | Google Gemini API (여행 태그라인 생성) |
| 배포 | Vercel (main 브랜치 push 시 자동 배포) |
| 테스트 | Jest, Playwright E2E |

**API 라우트 (`/api/*`)**

웹 자체 기능과, 서버 비밀 키가 필요한 모바일 요청을 처리한다.

| 경로 | 역할 | 호출 주체 |
|------|------|----------|
| `/api/trips` | 여행 CRUD | 웹 |
| `/api/trips/[id]/tagline` | Gemini AI 여행 태그라인 생성 | 웹, 모바일 |
| `/api/trips/[id]/apply-place` | Google Places 장소를 여행에 적용 | 웹 |
| `/api/checkins` | 체크인 CRUD, 근처 조회 | 웹 |
| `/api/places/*` | Google Places API 프록시 | 웹, 모바일 |
| `/api/calendar/*` | Google Calendar 연동 | 웹, 모바일 |
| `/api/settings` | 사용자 설정 | 웹, 모바일 |
| `/api/story/[id]` | 공개 여행 스토리 조회 (비인증 허용) | 웹 |

**인증 방식**
- 웹: 쿠키 기반 세션 (`createServerClient` + middleware)
- 모바일: Bearer 토큰 (`Authorization` 헤더 파싱, `getAuthenticatedClient()`)
- 미들웨어가 미인증 요청을 `/login`으로 자동 리다이렉트 (공개 경로 예외 처리)

---

### 3. Supabase

**역할**
- 여행·체크인 데이터 영속 저장 (PostgreSQL)
- 사용자 인증 (Google OAuth)
- 이미지 원본 파일 저장소 (Storage)
- Row Level Security로 데이터 접근 제어

**기술 특성**

| 항목 | 내용 |
|------|------|
| 데이터베이스 | PostgreSQL (managed) |
| 인증 | Supabase Auth — Google OAuth 2.0 |
| 스토리지 | Supabase Storage (`trip-photos` 버킷, Public) |
| 보안 | Row Level Security (RLS) 정책 |
| 연결 | JS SDK (`@supabase/supabase-js`) |

**데이터베이스 스키마**

```
trips
  id (UUID PK)
  user_id  → auth.users (ON DELETE CASCADE)
  title, description
  start_date, end_date
  latitude, longitude
  is_public, is_frequent
  place, place_id
  created_at, updated_at
  -- 가상 필드 (checkins 조인으로 계산, DB 컬럼 아님)
  first_checkin_date?  -- 가장 이른 체크인 일시
  cover_photo_url?     -- photo_url이 있는 첫 번째 체크인의 사진 URL

checkins
  id (UUID PK)
  trip_id  → trips (ON DELETE CASCADE)
  title, place, place_id, category
  message
  latitude, longitude
  photo_url, photo_metadata (JSONB)
  checked_in_at, created_at, updated_at

user_profiles
  id (UUID PK) → auth.users (ON DELETE CASCADE)
  google_refresh_token
  settings (JSONB: calendar_sync_enabled 등)
  created_at, updated_at
```

**RLS 정책 요약**

| 테이블 | 읽기 | 쓰기 |
|--------|------|------|
| trips | 본인 소유 + 공개 여행 (비인증 포함) | 본인 소유만 |
| checkins | 본인 소유 여행의 체크인 + 공개 여행의 체크인 | 본인 소유 여행만 |
| user_profiles | 본인만 | 본인만 |

**이미지 업로드 흐름**
1. 클라이언트가 이미지를 압축 (최대 1MB / 1920px)
2. `trip-photos` 버킷에 직접 업로드
3. Public URL 생성 → 도메인을 Cloudflare Worker URL로 교체
4. `checkins.photo_url`에 저장

---

### 4. Cloudflare Worker

**역할**
- Supabase Storage 앞단의 이미지 CDN 프록시
- 이미지 요청을 Cloudflare 엣지 네트워크에서 캐싱
- Supabase Storage egress 비용 절감

**기술 특성**

| 항목 | 내용 |
|------|------|
| 런타임 | Cloudflare Workers (V8 isolate) |
| 캐시 | `Cache-Control: public, max-age=31536000, immutable` (1년) |
| 엔드포인트 | `https://<worker-name>.<account>.workers.dev` |
| 원본 | Supabase Storage (`trip-photos` 버킷) |

**요청 흐름**

```
클라이언트 이미지 요청
  → Cloudflare Worker
      → Cache HIT: 엣지 캐시에서 즉시 응답
      → Cache MISS: Supabase Storage에서 fetch → 캐싱 후 응답
```

**URL 변환**

앱 내에서 이미지 URL을 생성할 때, Supabase Storage의 도메인을 Worker 도메인으로 교체한다.

```
https://[project-id].supabase.co/storage/v1/object/public/trip-photos/...
                  ↓
https://<worker-name>.<account>.workers.dev/storage/v1/object/public/trip-photos/...
```

---

## 공유 패키지 (`packages/shared`)

**역할**
- 웹 앱과 모바일 앱이 공통으로 사용하는 TypeScript 타입 정의

**내보내는 타입**
- `Trip`, `TripInsert`, `TripFormData`
- `Checkin`, `CheckinInsert`
- `UserProfile`, `UserProfileSettings`
- `CHECKIN_CATEGORIES`, `CHECKIN_CATEGORY_LABELS` (카테고리 12가지)
- `Database` (Supabase 생성 스키마 타입)

---

## 데이터 흐름 요약

### 체크인 생성 (모바일)

```
1. 사용자가 현장에서 체크인 생성
2. 사진 선택 → 이미지 압축 → EXIF GPS 추출
3. Supabase Storage에 직접 업로드 → Cloudflare Worker URL로 변환
4. supabase.from('checkins').insert(...) — Supabase 직접 호출
5. zustand 스토어 업데이트 → 화면 갱신
```

### 공개 스토리 공유

```
1. 여행을 is_public = true로 설정
2. /story/[id] 링크 공유
3. 비인증 사용자도 RLS 공개 정책으로 조회 가능
4. 지도 + 타임라인으로 여행 스토리 렌더링
```

### 모바일 로그인

```
1. Google OAuth 버튼 클릭
2. Supabase Auth → Google 로그인 → access_token 발급
3. expo-secure-store (iOS Keychain)에 세션 영속 저장
4. 이후 Supabase 직접 호출: SDK가 자동으로 토큰 첨부
5. 이후 Web App API 호출: Authorization: Bearer <access_token> 헤더 수동 첨부
```

---

## 성능

### 모바일 → Supabase 직접 호출

모바일 앱의 CRUD는 Vercel API를 거치지 않고 Supabase JS SDK로 직접 호출한다.
`Mobile → Vercel → Supabase` 2-hop 구조를 제거해 Vercel cold start(1~3초)와 왕복 레이턴시(100~300ms)를 없앤다.
서버 비밀 키가 필요한 기능(Google Places, Calendar, Gemini AI)만 Vercel API를 경유한다.

### Cloudflare Worker 이미지 캐싱

Supabase Storage 앞에 Cloudflare Worker를 프록시로 배치해 이미지를 Cloudflare 엣지에 1년간 캐시한다.
`CF-Cache-Status: HIT` 응답은 Supabase까지 요청이 전달되지 않으므로 egress 비용이 발생하지 않는다.

```
Cache-Control: public, max-age=31536000, immutable
```

업로드 시점에 Supabase Storage 도메인을 Worker 도메인으로 치환해 DB에 저장한다.
이후 조회·렌더링은 항상 Worker URL을 통해 이뤄지므로 별도 변환 없이 캐시가 적용된다.

### Supabase Region

서울 리전(ap-northeast-2)을 사용한다. 인도 리전(ap-south-1) 대비 왕복 100~200ms 단축.

### Supabase pause 방지

무료 플랜은 7일 비활성 시 DB가 자동 pause된다. 외부 cron(예: GitHub Actions, cron-job.org)으로 헬스체크 엔드포인트를 6일마다 호출해 방지할 수 있다 (미구현).

---

## 보안

### 인증 경계

| 경로 | 인증 방식 | 처리 위치 |
|------|----------|----------|
| 웹 브라우저 → Vercel API | 쿠키 세션 | Next.js middleware |
| 모바일 → Vercel API | `Authorization: Bearer <token>` | `getAuthenticatedClient()` |
| 모바일 → Supabase | Supabase JS SDK (토큰 자동 첨부) | Supabase RLS |

### Row Level Security (RLS)

모바일 앱이 Supabase를 직접 호출하므로 `anon key`가 앱에 포함된다. RLS가 유일한 데이터 접근 경계다.

| 테이블 | SELECT | INSERT/UPDATE/DELETE |
|--------|--------|----------------------|
| `trips` | 본인 소유 또는 `is_public = true` | 본인 소유만 |
| `checkins` | 본인 소유 여행 또는 공개 여행 소속 | 본인 소유 여행만 (trips 경유 확인) |
| `user_profiles` | 본인만 | 본인만 |

비로그인 사용자는 `is_public = true`인 여행과 그 체크인만 읽을 수 있다.

### 이미지 접근 제어

`trip-photos` 버킷은 public으로 설정되어 있다. URL을 아는 누구든 사진에 접근할 수 있다.
비공개 여행(`is_public = false`)의 사진도 URL 노출 시 열람 가능하다는 한계가 있다.

현재는 URL이 추측하기 어려운 형태(타임스탬프 포함)임을 감안해 현상 유지 중이다.
접근 제어가 필요한 경우 아래 방안을 검토한다.

| 방안 | 설명 | 캐시 |
|------|------|------|
| Worker에서 service role key로 fetch | bucket을 private으로 복원, Worker가 인증 대행 | 유지 가능 |
| Worker에서 사용자 JWT 검증 후 전달 | 사용자별 접근 제어 가능 | 불가 (응답이 사용자마다 다름) |

### 서버 비밀 키 보호

Google Places API Key, Gemini API Key, Google OAuth Client Secret은 Vercel 환경변수에만 보관한다.
모바일 앱 `.env`에는 Supabase `anon key`만 포함되며, 이는 RLS로 보호된다.

### Google OAuth

Supabase Auth가 OAuth 코드 교환을 처리한다. `google_refresh_token`은 `user_profiles` 테이블에 저장되며 RLS로 본인만 접근 가능하다.
Supabase redirect URL에는 등록된 scheme(`travel-companion://`)과 개발용 Expo URL만 허용된다.

---

## AI 기능

모든 AI 기능은 Google Gemini API(`@google/genai`)를 사용하며, Vercel 서버에서만 호출한다.
`GEMINI_API_KEY`는 서버 환경변수에만 보관되고 클라이언트에 노출되지 않는다.
모델은 환경변수 `GEMINI_MODEL`로 지정하며 기본값은 `gemini-2.5-flash-lite`다.

### 1. 여행 태그라인 생성

**엔드포인트**: `POST /api/trips/[id]/tagline`
**호출 주체**: 웹, 모바일
**구현**: `apps/web/lib/ai/tripTagline.ts`, `apps/web/app/api/trips/[id]/tagline/route.ts`

여행의 분위기를 담은 한 줄 문구(32자 이내)를 생성한다.

**설계**

```
클라이언트
  → POST /api/trips/[id]/tagline
  → Supabase에서 여행 정보 + 체크인 목록 조회 (최대 6개)
  → buildTripTaglinePrompt()로 프롬프트 조립
  → Gemini API 호출
  → normalizeTripTagline()으로 응답 정제
  → { tagline } 반환
```

프롬프트에 포함되는 컨텍스트:
- 여행 제목, 설명, 대표 장소, 시작/종료일
- 체크인 수
- 대표 체크인 최대 6개 (날짜 | 장소 | 제목 | 메모 | 카테고리, 각 72자로 압축)

응답 정제(`normalizeTripTagline`): 첫 줄만 추출 → 따옴표·공백 제거 → 32자 truncate

**프롬프트 전략**

- 페르소나: "여행 기록 앱의 카피라이터"
- 톤 지시: "피식 웃기고, 여행 분위기가 느껴지고, 너무 오버하지 않음"
- 금지 조건: 이모지, 따옴표, 해시태그, 줄바꿈, 광고 문구
- 예시 문구를 프롬프트에 포함해 톤을 고정

### 2. 캘린더 기반 일정 조언

**엔드포인트**: `POST /api/calendar/advice`
**호출 주체**: 웹, 모바일
**구현**: `apps/web/app/api/calendar/advice/route.ts`

오늘의 Google Calendar 일정을 보고 가장 급하거나 중요한 일정에 대한 한 줄 조언(40자 이내)을 생성한다.

**설계**

```
클라이언트 (현재 위치 포함)
  → POST /api/calendar/advice  { events, userLat, userLng }
  → 각 이벤트에 대해 location → Google Maps Geocoding API로 좌표 변환
  → Haversine 공식으로 현재 위치와의 거리 계산
  → 프롬프트 조립: "남은 시간 / 거리 / 제목" 형식의 목록
  → Gemini API 호출
  → { advice } 반환
```

클라이언트가 전달하는 이벤트 구조:
```
{ summary, location?, minutesUntil, isAllDay? }
```

서버에서 이벤트별로 추가하는 정보:
- `minutesUntil` → "30분 후", "진행 중", "내일" 등 자연어로 변환
- `location` + `userLat/Lng` → Geocoding → Haversine → "1.2km", "300m" 등

**프롬프트 전략**

- 페르소나: "여행 중인 사용자를 돕는 친근한 AI 어시스턴트"
- 출력 조건: 한 줄 40자 이내, 이모지 1개(맨 앞)만 허용, 따옴표·줄바꿈 금지
- 시간·거리 정보를 자연어로 녹이도록 지시

---

## 테스트

### 구조 개요

| 구분 | 프레임워크 | 대상 | 실행 명령 |
|------|-----------|------|----------|
| 웹 단위 테스트 | Jest + Testing Library | API 라우트, 컴포넌트, 훅, 유틸 | `cd apps/web && npm test` |
| 모바일 단위 테스트 | Jest (jest-expo) + Testing Library | 컴포넌트, 훅, 유틸 | `cd apps/mobile && npm test` |
| 모바일 E2E | Detox | 네비게이션, 화면 전환, 성능 | `cd apps/mobile && npm run e2e:test` |
| 전체 | — | 웹 + 모바일 | `npm test` (루트) |

웹 `npm test`는 `tsc --noEmit && jest` 순서로 실행된다. 타입 오류가 있으면 Jest 실행 전에 실패한다.

### 웹 단위 테스트

**파일 위치**: `apps/web/**/__tests__/*.{ts,tsx}`
**환경**: jsdom (기본), `@jest-environment node` 주석으로 라우트별 Node 환경 지정

#### API 라우트 테스트

각 Route Handler(`route.ts`)마다 `__tests__/route.test.ts`가 존재한다.
`NextRequest`를 직접 생성해 핸들러를 호출하고 응답 형상을 검증한다.

커버리지 원칙:
- 성공 케이스: 반환 필드가 API 문서(`docs/api/`)에 명시된 형상과 일치하는지 확인
- 인증 실패: 비인증 요청 시 401 반환 확인
- DB 에러: Supabase가 에러를 반환할 때 적절한 상태 코드 확인
- 입력 검증: 필수 필드 누락·잘못된 값에 대한 400 반환 확인

Supabase mock 패턴 — 메서드 체이닝을 지원하는 재사용 가능한 QueryBuilder:

```typescript
// jest.mock('@/lib/supabase/server')으로 모듈 전체 mock
function createQueryBuilder(resolvedValue: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn().mockResolvedValue(resolvedValue),
    // Thenable: await builder 시 resolvedValue로 resolve
    then: (resolve: any, reject: any) =>
      Promise.resolve(resolvedValue).then(resolve, reject),
  };
  return builder;
}
```

#### 컴포넌트 테스트

`@testing-library/react` 기반. 실제 렌더링 후 `fireEvent` / `screen`으로 검증한다.
외부 의존성(Supabase client, Next.js router 등)은 `jest.mock()`으로 대체한다.

#### 훅 테스트

`renderHook`으로 독립 실행. fetch / Supabase 호출을 mock으로 교체한다.

#### 유틸 테스트

순수 함수는 mock 없이 입출력만 검증한다 (`exif.ts`, `humanizeDuration.ts`, `tripTagline.ts` 등).
AI 프롬프트 빌더(`buildTripTaglinePrompt`)는 Gemini API를 호출하지 않고 프롬프트 문자열만 검증한다.

### 모바일 단위 테스트

**파일 위치**: `apps/mobile/src/**/__tests__/*.{ts,tsx}`
**프리셋**: `jest-expo` (React Native 트랜스파일 포함)

컴포넌트 테스트는 훅과 네이티브 라이브러리를 mock으로 분리해 렌더링 로직만 검증한다.

주요 mock 대상:

| 대상 | 이유 |
|------|------|
| `../../hooks/useAllCheckins`, `useTrips` 등 | 데이터 로딩을 컴포넌트와 분리 |
| `@react-navigation/native` | 테스트 환경에 Navigator 없음 |
| `react-native-safe-area-context` | 네이티브 레이아웃 모듈 없음 |
| `@expo/vector-icons` | 네이티브 폰트 모듈 없음 |
| `expo-location`, `expo-clipboard` | 기기 권한/시스템 API 없음 |

컴포넌트 stub 패턴 — 하위 컴포넌트를 testID를 가진 최소 구현으로 대체:

```typescript
jest.mock('../../components/TripCard', () => {
  const { Text } = require('react-native');
  return ({ trip }: any) => <Text testID={`trip-${trip.id}`}>{trip.title}</Text>;
});
```

테스트 데이터 헬퍼 — 반복을 줄이기 위해 파일 내 팩토리 함수를 둔다:

```typescript
const makeTrip = (id: string, title: string, isFrequent = false) => ({ id, title, isFrequent, ... });
const makeCheckin = (id: string, tripId: string, title: string) => ({ id, tripId, title, ... });
```

### 모바일 E2E 테스트 (Detox)

**파일 위치**: `apps/mobile/e2e/*.test.ts`
**대상 기기**: iPhone 17 Pro Simulator
**설정**: `.detoxrc.js`, `e2e/jest.config.js` (timeout 120초, maxWorkers 1)

실제 앱 바이너리를 빌드해 시뮬레이터에서 실행한다. mock 없이 실제 앱 동작을 검증한다.

현재 테스트 커버리지:

| 테스트 | 내용 |
|--------|------|
| `home.test.ts` | 홈 화면 JS 로드 시간(10초 기준), 여행 목록·탭바 표시 |
| `navigation.test.ts` | 여행 카드 탭 → 여행 화면, iOS 스와이프 백 → 홈 복귀 |

요소 선택은 `testID` 기반(`by.id()`)을 원칙으로 한다. 텍스트 기반(`by.text()`)은 다국어·동적 텍스트에 취약하므로 보조적으로만 사용한다.

E2E 실행 전제 조건:
- 웹 dev 서버 실행 필요 (`npm run dev`) — 모바일 앱이 `localhost:3000` API 사용
- 시뮬레이터에 로그인 세션 필요
- 네이티브 코드 변경 시에만 `e2e:build` 재실행

### Testability 원칙

#### 1. 외부 의존성을 경계에서 주입하라

Supabase 클라이언트, fetch, 환경변수 등 외부 의존성은 모듈 경계(`lib/supabase/server.ts`, `lib/supabase/client.ts`)에서만 생성한다.
비즈니스 로직(`tripTagline.ts`, `humanizeDuration.ts` 등)은 외부 의존성 없는 순수 함수로 작성해 mock 없이 테스트 가능하게 유지한다.

#### 2. 프롬프트 빌더를 API 호출과 분리하라

AI 기능은 프롬프트 조립 로직(`buildTripTaglinePrompt`)을 API 호출(`ai.models.generateContent`)과 분리한다.
프롬프트 빌더는 순수 함수로 단독 테스트 가능하고, API 라우트 테스트에서는 Gemini 클라이언트를 mock으로 대체한다.

#### 3. 컴포넌트는 훅을 통해 데이터를 받아라

컴포넌트가 Supabase나 fetch를 직접 호출하면 컴포넌트 테스트에서 네트워크 mock이 필요해진다.
훅(`useAllCheckins`, `useTrips` 등)이 데이터를 담당하고 컴포넌트는 props/훅 반환값만 소비하면, 컴포넌트 테스트에서 훅만 mock하면 된다.

#### 4. testID를 조건부로 달지 말라

E2E 테스트에서 `by.id()`로 요소를 찾으려면 `testID`가 항상 존재해야 한다.
조건부 렌더링으로 사라지는 요소에 testID를 붙이면 `waitFor` 타임아웃으로 이어진다.
화면의 루트 컨테이너(`screen-home`, `screen-trip` 등)는 반드시 고정 testID를 유지한다.

#### 5. API 라우트 테스트는 문서와 함께 유지하라

`docs/api/`에 응답 형상이 명시되면, 해당 라우트의 `__tests__/route.test.ts`에도 그 필드가 실제 응답에 존재하는지 검증하는 어설션을 추가한다.
문서와 테스트가 함께 변경되면 드리프트를 조기에 잡을 수 있다.
