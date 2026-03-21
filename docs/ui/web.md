# Web 앱 Frontend 문서

**프레임워크**: Next.js 15 (App Router) / TypeScript / Tailwind CSS
**배포**: Vercel (main 브랜치 push → 자동 배포)

---

## 1. 화면 목록

### 1.1 홈 (여행 목록) — `/`

**파일**: `apps/web/app/page.tsx`

**기능**
- 빠른 체크인 버튼 (상단) — 현재 위치의 가장 최근 체크인 상태 표시
- 사용자의 여행 목록을 카드 그리드로 표시
- 각 카드: 커버 사진, 여행 제목, 첫 체크인 날짜
- 여행 카드 클릭 → `/checkin?trip_id={id}` 이동

**디자인**
- 빠른 체크인 버튼: 주황색 테두리 카드, 현재 체크인 상태 (`[여행명]: [장소] · [시간 전]`) 표시
  - 위치 확인 중: "현재 위치 확인 중..." (회색)
  - 체크인 있음: `주차: 지하3층 · 10분 전` (주황색)
  - 없음: "자주 가는 곳을 빠르게 기록" (회색)
- 반응형 카드 그리드 (모바일 1열, 태블릿 2열, 데스크톱 3열)
- `is_frequent = true` 여행 카드 좌측 상단에 `⭐ 자주 가는 곳` 앰버색 뱃지
- 다크 모드 지원 (`dark:bg-gray-900`)
- 커버 사진 없을 경우 회색 플레이스홀더

**백엔드 연계**
- `lib/fetchTrips.ts` → `GET /api/trips`
- `QuickCheckinButton`: `navigator.geolocation` → `GET /api/checkins/nearby`

**보안**
- 미들웨어(`middleware.ts`)에서 Supabase 세션 확인
- 비인증 사용자 → `/login` 리다이렉트

---

### 1.2 로그인 — `/login`

**파일**: `apps/web/app/login/page.tsx`

**기능**
- Google OAuth 로그인 버튼
- 앱 소개 문구 및 주요 기능 안내

**디자인**
- 단순 중앙 정렬 레이아웃
- Google 로그인 버튼 (공식 스타일)

**백엔드 연계**
- Supabase Auth OAuth 시작 → Google 인증 페이지
- `/auth/callback` 콜백 처리

**보안**
- 인증 완료 후 JWT 토큰 브라우저 세션에 저장
- PKCE 흐름 지원

---

### 1.3 체크인 관리 (메인 UI) — `/checkin`

**파일**: `apps/web/app/checkin/page.tsx`

**기능**
- 여행 선택 (SideDrawer)
- 체크인 지도 시각화
- 체크인 타임라인 (날짜별 그룹핑)
- 새 체크인 추가 버튼 → CheckinForm 열기
- 체크인 수정/삭제

**디자인**
- 좌측: SideDrawer (여행 목록, 여행 CRUD)
- 중앙: Google Maps (마커 + Polyline 경로)
- 우측/하단: CheckinTimeline (날짜 구분자 + 체크인 카드)
- 하단 BottomBar: 체크인 추가 버튼, 오늘의 일정 표시
- 다크 모드 지원

**백엔드 연계**

| 훅 | API |
|---|---|
| `useTrips` | `GET /api/trips` |
| `useTrips` | `POST/PATCH/DELETE /api/trips/[id]` |
| `useCheckins(tripId)` | `GET /api/checkins?trip_id={id}` |
| `useCheckins(tripId)` | `POST/PATCH/DELETE /api/checkins/[id]` |
| `useTripTagline` | `POST /api/trips/[id]/tagline` |

**보안**
- 미들웨어 인증 확인
- 모든 API 호출에 Supabase 인증 클라이언트 사용

#### 서브 컴포넌트

**SideDrawer** (`app/checkin/components/SideDrawer.tsx`)
- 여행 목록 표시 및 선택
- `is_frequent = true` 여행은 제목 앞에 ⭐ 아이콘 표시
- 여행 신규 생성 / 수정 / 삭제
- ActionSheet 스타일 메뉴

**CheckinTimeline** (`app/checkin/components/CheckinTimeline.tsx`)
- 날짜별 그룹핑된 체크인 목록
- 정렬 토글 (최신순 / 오래된순)
- 각 체크인 카드에 수정/삭제 버튼

**TodayCalendarSection** (`app/checkin/components/TodayCalendar.tsx`)
- 오늘의 Google Calendar 일정 미리보기

---

### 1.4 체크인 작성/수정 폼 — (CheckinForm 모달)

**파일**: `apps/web/components/checkin-form/CheckinForm.tsx` (838줄)
**서브 컴포넌트**: `CheckinFormHeader`, `CheckinFormMainPanel`, `CheckinFormPlacePanel`, `CheckinFormCategoryPanel`, `CheckinFormTimePanel`, `CheckinFormToolbar`

**기능**
- 체크인 신규 생성 / 수정 (editingCheckin prop으로 전환)
- 패널 기반 아키텍처: `main` → `place-search` / `category` / `time` 패널 전환
- 사진 업로드 (EXIF GPS 자동 추출)
- 장소 검색 (Google Places Autocomplete)
- 카테고리 선택 (9가지)
- 체크인 시각 수동 설정
- 위치 선택 → LocationPicker 연동 (콜백 방식)

**디자인**
- `createPortal(content, document.body)`로 전체화면 모달 렌더링
- iOS 소프트키보드 높이 자동 감지 (`useKeyboardHeight`)
- 패널 슬라이드 전환 애니메이션

**LocationPicker 연동 구조** (중요)
```
checkin/page.tsx
  ├─ LocationPicker 직접 렌더링 (CheckinForm 외부)
  └─ CheckinForm
       └─ onOpenLocationPicker(initial, onSelect) 콜백
```
> CheckinForm 내부에서 LocationPicker를 렌더링하면 Google Maps의 `transform` 스타일이 `position: fixed`의 stacking context를 어긋나게 만드는 iOS 문제 발생.
> checkin/page.tsx 최상위에서 `locationPickerCallback` (useRef) 방식으로 연결.

**백엔드 연계**
- `usePhotoUpload` → Supabase Storage 업로드
- `usePlaceSearch` → `GET /api/places/autocomplete`
- `useCheckins.addCheckin` → `POST /api/checkins`
- `useCheckins.updateCheckin` → `PATCH /api/checkins/[id]`

**보안**
- 사진 업로드 시 Supabase Storage 인증 경로 사용
- API 요청에 세션 토큰 자동 첨부

---

### 1.5 위치 선택 모달 — (LocationPicker)

**파일**: `apps/web/components/LocationPicker.tsx`

**기능**
- Google Maps에서 핀 드래그/클릭으로 위치 선택
- 장소 검색창 및 자동완성 목록
- 현재 위치 버튼

**디자인**
- `createPortal(content, document.body)` + `position: fixed, zIndex: 9999`로 전체화면
- 상단: 검색창 + 예측 목록
- 중앙: 지도 (선택된 위치에 핀)
- 하단: 취소 / 확인 버튼

**백엔드 연계**
- `GET /api/places/autocomplete?input={text}&lat={lat}&lng={lng}`
- `GET /api/places/details?place_id={id}`

---

### 1.6 공개 여행 스토리 — `/story/[id]`

**파일**: `apps/web/app/story/[id]/page.tsx`

**기능**
- 공개 여행의 체크인 목록 갤러리 표시
- 비공개 여행 접근 시 안내 메시지

**디자인**
- 체크인 사진 그리드 갤러리
- 카테고리 아이콘 + 제목 + 메모

**백엔드 연계**
- `GET /api/story/[id]` (인증 불필요, is_public 확인)

**보안**
- `is_public = false` 여행은 "비공개" 안내 렌더링 (데이터 미노출)
- 로그인 없이 접근 가능 (공유 링크 용도)

---

### 1.7 설정 — `/settings`

**파일**: `apps/web/app/settings/page.tsx`

**기능**
- 프로필 정보 표시 (이름, 이메일, 아바타)
- Google Calendar 연동 활성화/비활성화
- 연동 해제 (calendar/disconnect)

**백엔드 연계**
- `GET /api/settings` / `PATCH /api/settings`
- `POST /api/calendar/connect` → Google OAuth
- `POST /api/calendar/disconnect`

**보안**
- Google Calendar OAuth 토큰 서버 측 관리
- 사용자별 설정 격리 (Supabase Row Level Security)

---

### 1.8 캘린더 — `/calendar`

**파일**: `apps/web/app/calendar/page.tsx`

**기능**
- 연동된 Google Calendar 이벤트 조회
- AI(Gemini) 캘린더 조언 생성

**백엔드 연계**
- `GET /api/calendar?maxResults={n}`
- `POST /api/calendar/advice`

---

## 2. 공통 컴포넌트

### Map (`components/Map.tsx`)

- Google Maps AdvancedMarker로 체크인 위치 표시
- InfoWindow: 마커 클릭 시 체크인 제목/카테고리/사진 표시
- Polyline: 체크인 순서대로 여행 경로 연결
- 자동 줌/중심: 마커 1개 → 13줌, 여러 개 → fitBounds
- 기본 중심: 서울 (37.5665, 126.9780)
- Map ID (AdvancedMarker 필수): `f61fd161984b7ef0b0aaa09b`

**주의사항**
- `defaultCenter/defaultZoom` 사용 (uncontrolled 모드)
- `absolute inset-0` 오버레이 금지 → iOS에서 컨테이너 밖 넘침

---

## 3. 커스텀 훅

| 훅 | 파일 | 역할 |
|---|---|---|
| `useTrips` | `app/checkin/hooks/useTrips.ts` | 여행 CRUD + 상태 관리 |
| `useCheckins` | `app/checkin/hooks/useCheckins.ts` | 체크인 CRUD + 상태 관리 |
| `useTripTagline` | `app/checkin/hooks/useTripTagline.ts` | Gemini AI 여행 요약 생성 |
| `usePhotoUpload` | `components/checkin-form/hooks/usePhotoUpload.ts` | 사진 선택, 압축, Storage 업로드 |
| `usePlaceSearch` | `components/checkin-form/hooks/usePlaceSearch.ts` | Google Places 자동완성 |
| `useLocationSource` | `components/checkin-form/hooks/useLocationSource.ts` | GPS / 수동 위치 관리 |
| `useKeyboardHeight` | `components/checkin-form/hooks/useKeyboardHeight.ts` | iOS 소프트키보드 높이 감지 |
| `useGeolocation` | `hooks/useGeolocation.ts` | 브라우저 Geolocation API |

---

## 4. API 라우트 목록

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/trips` | 여행 목록 |
| POST | `/api/trips` | 여행 생성 |
| PATCH | `/api/trips/[id]` | 여행 수정 |
| DELETE | `/api/trips/[id]` | 여행 삭제 |
| POST | `/api/trips/[id]/tagline` | AI 여행 요약 생성 (Gemini) |
| GET | `/api/checkins` | 체크인 목록 (`?trip_id=`) |
| POST | `/api/checkins` | 체크인 생성 |
| PATCH | `/api/checkins/[id]` | 체크인 수정 |
| DELETE | `/api/checkins/[id]` | 체크인 삭제 |
| GET | `/api/checkins/nearby` | 현재 위치 주변 체크인 (`?lat=&lng=&radius=`) |
| GET | `/api/places/autocomplete` | 장소 자동완성 (Google Places 프록시) |
| GET | `/api/places/details` | 장소 상세 (Google Places 프록시) |
| GET | `/api/settings` | 사용자 설정 조회 |
| PATCH | `/api/settings` | 사용자 설정 수정 |
| GET | `/api/calendar` | Google Calendar 이벤트 조회 |
| POST | `/api/calendar/advice` | AI 캘린더 조언 (Gemini) |
| POST | `/api/calendar/connect` | Google Calendar OAuth 연동 |
| POST | `/api/calendar/disconnect` | Google Calendar 연동 해제 |
| GET | `/api/story/[id]` | 공개 여행 스토리 조회 |
| GET | `/api/places/nearby` | 현재 위치 주변 장소 검색 (`?latitude=&longitude=&type=`) |
| POST | `/api/trips/[id]/apply-place` | 여행 장소를 해당 여행의 모든 체크인에 일괄 적용 |

---

## 5. 인증 및 보안

### 인증 흐름

```
사용자 접근 → middleware.ts → Supabase 세션 확인
  → 세션 없음 → /login 리다이렉트
  → 세션 있음 → 페이지 렌더링

/login → Google OAuth 버튼 → Supabase signInWithOAuth
       → Google 인증 → /auth/callback → JWT 저장 → /
```

### API 보안

```typescript
// 모든 API Route Handler 내부
const supabase = await getAuthenticatedClient();
// getUser()로 인증 확인, 실패 시 401 반환
```

- Supabase Row Level Security (RLS): 사용자별 데이터 격리
- Google Places API 키: 서버 측에서만 사용 (클라이언트 미노출)
- Gemini API 키: 서버 측 환경변수 (`GEMINI_API_KEY`)

### 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL       # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # 공개 anon 키
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY # Google Maps (클라이언트)
GEMINI_API_KEY                 # Gemini AI (서버만)
```

---

## 6. 다크 모드

- `tailwind.config.ts`: `darkMode: 'media'` (시스템 설정 자동 감지)
- 헤더: `bg-white dark:bg-gray-900`
- 텍스트: `text-gray-900 dark:text-gray-100`
- 인라인 color 스타일 사용 금지 → Tailwind 클래스 사용

---

## 7. 사진 업로드 흐름

```
사진 선택 (input[type=file])
  → browser-image-compression (최대 1MB, 1920px)
  → exifr.gps() 로 GPS 좌표 추출 (있을 경우)
  → Supabase Storage 업로드 → Public URL 반환
  → CheckinForm에 photo_url + 좌표 자동 설정
```

> iOS 브라우저에서 카메라 직접 촬영 또는 사진 라이브러리 선택 시 EXIF GPS가 제거됨.
> 이 경우 Geolocation API 폴백 또는 LocationPicker로 수동 지정.
