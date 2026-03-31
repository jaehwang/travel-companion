# Mobile 앱 Frontend 문서

**플랫폼**: Expo (React Native) / TypeScript / iOS
**실행**: `cd apps/mobile && npx expo run:ios`
**백엔드**: CRUD는 Supabase JS SDK 직접 호출. Places / Calendar / AI 등 서버 비밀 키가 필요한 기능만 웹 앱 API (`apps/web/app/api/`)를 HTTP로 호출.

---

## 1. 네비게이션 구조

```
App.tsx
  └─ RootNavigator
       ├─ 로딩 중 → ActivityIndicator
       ├─ 미인증 → LoginScreen
       └─ 인증 완료 → AppNavigator (RootStack)
            ├─ MainTabs (BottomTabNavigator)
            │    ├─ TripsTab → TripsStack
            │    │    ├─ Home (여행 목록)
            │    │    └─ Trip (여행 상세)
            │    ├─ AddTripTab (+ 버튼)
            │    ├─ CheckinsTab → CheckinsStack
            │    │    └─ Checkins (전체 체크인)
            │    └─ ScheduleTab → ScheduleScreen (2주 일정 + 날씨)
            ├─ CheckinForm (modal)
            ├─ LocationPicker (modal)
            └─ Settings
```

모달(CheckinForm, LocationPicker)은 탭 바 위 전체 화면으로 표시되도록 RootStack에 배치한다.

### 네비게이션 파라미터 타입

```typescript
type TripsStackParamList = {
  Home: undefined;
  Trip: { trip: Trip };
};

type CheckinsStackParamList = {
  Checkins: undefined;
};

type MainTabParamList = {
  TripsTab: NavigatorScreenParams<TripsStackParamList>;
  AddTripTab: undefined;
  CheckinsTab: NavigatorScreenParams<CheckinsStackParamList>;
  ScheduleTab: undefined;
};

type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CheckinForm: {
    tripId: string;
    tripTitle: string;
    initialLatitude?: number;
    initialLongitude?: number;
    initialPlace?: string;
    initialPlaceId?: string;
    checkin?: Checkin;  // 수정 모드
  };
  LocationPicker: {
    tripId: string;
    tripTitle: string;
    initialLatitude?: number;
    initialLongitude?: number;
  };
  Settings: undefined;
};
```

### 탭 내 화면에서 모달/Settings 이동

탭 안의 Stack에서 RootStack의 모달로 이동할 때 `CompositeNavigationProp` 사용:

```typescript
type NavigationProp = CompositeNavigationProp<
  StackNavigationProp<TripsStackParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;
```

### 탭 간 화면 이동

CheckinsScreen에서 체크인 카드 탭 시 TripsTab의 TripScreen으로 이동:

```typescript
navigation.navigate('TripsTab', {
  screen: 'Trip',
  params: { trip },
});
```

TripScreen은 `route.params.trip`이 바뀌면 `useEffect`로 내부 state를 동기화한다
(다른 탭에서 재진입 시 이전 여행이 표시되는 문제 방지).

---

## 2. 화면 목록

### 2.1 HomeScreen (여행 목록)

**파일**: `apps/mobile/src/screens/HomeScreen.tsx`

**기능**
- 빠른 체크인 버튼 (헤더 바로 아래) — 현재 위치의 가장 최근 체크인 상태 표시
- 사용자의 여행 목록 표시 (`FlatList`)
- 여행 생성 버튼 (상단 우측)
- 여행 카드 우상단 `···` 버튼 → ActionSheetIOS (iOS) / Alert (Android) 메뉴
  - 공개/비공개 전환, 공개 여행 링크 복사 (`is_public = true`일 때만), 수정, 삭제
- 당겨 새로고침 (RefreshControl)
- 여행 카드 탭 → TripScreen 이동

**디자인**
- 상단 헤더: 앱 타이틀, 사용자 아바타
- 빠른 체크인 버튼: 주황색 테두리 카드
  - 마운트 시 `expo-location` + `fetchNearbyCheckins`로 현재 상태 로드
  - 상태 텍스트: `[여행명]: [장소] · [시간 전]` (주황색) / 없으면 "자주 가는 곳을 빠르게 기록" (회색)
  - 탭 → `QuickCheckinSheet` 열림
  - 체크인 완료 시 `onCheckedIn` 콜백으로 상태 즉시 갱신
- 여행 카드: 커버 사진 (없으면 회색 플레이스홀더), 제목, 첫 체크인 날짜
- `is_frequent = true` 여행 카드 사진 좌측 상단에 `⭐ 자주 가는 곳` 앰버색 뱃지
- 빈 상태: "여행을 추가해보세요" 안내

**백엔드 연계**
- `useTrips` 훅 → Supabase `trips` 테이블 직접 조회
- `createTrip` → Supabase `trips` INSERT
- `updateTrip` → Supabase `trips` UPDATE
- `deleteTrip` → Supabase `trips` DELETE
- `fetchNearbyCheckins(lat, lng)` → Supabase 직접 조회 후 클라이언트에서 Haversine 거리 계산

---

### 2.2 TripScreen (여행 상세)

**파일**: `apps/mobile/src/screens/TripScreen.tsx`

**기능**
- 여행의 체크인 지도 표시 (react-native-maps)
- 여행 정보 카드 (description, 날짜, 장소 — 값이 있을 때만 표시)
- AI 태그라인 배너 (TripTaglineBanner)
- 오늘의 일정 섹션 (TodayCalendarSection)
- 날짜별 그룹핑된 체크인 타임라인
- 체크인 카드 탭 → 수정, Long Press → 삭제
- 새 체크인 추가 버튼 (우하단 FAB)
- `···` 버튼 → 여행 설정 액션 시트
  - 여행 수정 → `TripFormModal` (edit 모드)
  - 공개/비공개 전환 → 즉시 API 호출
  - 공개 여행 링크 복사 (`is_public = true`일 때만) → 클립보드 복사 후 Alert
  - 자주 가는 곳 추가/제거 → 즉시 API 호출

**디자인**
- 상단: `[≡] [여행 이름] [···] [아바타]` 헤더
- 여행 정보 카드 (웹 앱과 동일한 구조)
  - 📅 시작일 ~ 종료일 (start_date 없으면 첫 체크인 날짜 사용)
  - 여행 설명 (description)
  - 📍 대표 장소 (place)
  - description/날짜/장소 모두 없으면 카드 미표시
- AI Tagline 배너
- 지도: 체크인 마커 표시 (같은 좌표 중복 제거 — `dedupedMarkers`로 동일 좌표 중 최신 체크인만 표시), 우하단 현재 위치 버튼
  - 마커 탭 → 팝업 표시 (사진, 제목, 위치) + 이전/다음 체크인 네비게이션 버튼
- 날짜 구분자 + 체크인 카드 리스트
- 우하단 FAB: 체크인 추가 (`position: absolute`, `bottom: insets.bottom + 16`)

**지도 영역 계산**
```typescript
const mapRegion = useMemo(() => {
  const lats = filteredCheckins.map(c => c.latitude);
  const lngs = filteredCheckins.map(c => c.longitude);
  return {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta: Math.max((Math.max(...lats) - Math.min(...lats)) * 1.5, 0.01),
    longitudeDelta: Math.max((Math.max(...lngs) - Math.min(...lngs)) * 1.5, 0.01),
  };
}, [filteredCheckins, trip]);
```

**리스트 데이터 구조**
```typescript
type ListItem =
  | { type: 'date'; date: string; label: string }
  | { type: 'checkin'; checkin: Checkin };
```

**백엔드 연계**
- `useCheckins(tripId)` → Supabase `checkins` 테이블 직접 조회
- `updateCheckin` → Supabase `checkins` UPDATE
- `deleteCheckin` → Supabase `checkins` DELETE
- `POST /api/trips/[id]/tagline` → AI 여행 요약 (Vercel API 경유)

---

### 2.3 CheckinsScreen (전체 체크인)

**파일**: `apps/mobile/src/screens/CheckinsScreen.tsx`

**기능**
- 전체 여행의 체크인을 최신순으로 표시
- 월별 섹션 헤더 (SectionList)
- 2열 그리드 레이아웃
- 세그먼트 탭 필터: `일반` (기본) / `자주 가는 곳`
  - `일반`: `is_frequent = false` 여행의 체크인만 표시
  - `자주 가는 곳`: `is_frequent = true` 여행의 체크인만 표시
  - 클라이언트 사이드 필터링 (trips 스토어 기반)
- 카드 탭 → 해당 TripScreen으로 이동 (TripsTab 전환)
- 당겨 새로고침, 탭 포커스 시 자동 새로고침

**디자인**
- 상단 헤더: "체크인" 제목
- 헤더 아래 세그먼트 탭: `[  일반  |  자주 가는 곳  ]`
- 2열 그리드 카드 (`CARD_WIDTH = (screenWidth - 16*2 - 8) / 2`)
  - 상단: 사진 있으면 정사각형 이미지, 없으면 카테고리 아이콘 플레이스홀더 (동일 높이)
  - 하단 고정 높이(80px): 제목, 여행명(주황색), 카테고리 라벨, 날짜·시간
- 섹션 헤더: "2026년 3월" 형식
- 빈 상태: 안내 메시지

**데이터 흐름**
1. `useAllCheckins()` — 전체 체크인 목록 (스토어에서)
2. `useTrips()` — `Map<tripId, Trip>` 생성
3. `filter` state (`'normal' | 'frequent'`)로 `trips.is_frequent` 기준 클라이언트 필터링
4. `useMemo`로 체크인을 `[Checkin, Checkin | null]` 쌍으로 묶어 SectionList sections 생성

**백엔드 연계**
- `useAllCheckins` 훅 → `fetchAllCheckins(tripId?)` → Supabase `checkins` 테이블 직접 조회

---

### 2.4 CheckinFormScreen (체크인 작성/수정)

**파일**: `apps/mobile/src/screens/CheckinFormScreen.tsx`

**기능**
- 체크인 신규 생성 또는 수정 (route.params.checkin 유무로 판별)
- 사진 첨부 (PhotoPickerButton → 라이브러리 또는 카메라)
- 위치 선택 → LocationPickerScreen 이동 후 결과 수신
- 장소 검색 (PlaceSearchPanel)
- 카테고리 선택 (CategorySelector 모달)
- 체크인 시각 DateTimePicker
- 현재 위치 자동 설정 (초기값 없을 때)

**디자인**
- 전체화면 모달 스타일 (RootStack modal 모드)
- 상단: 취소 / 저장 버튼
- 사진 미리보기 영역
- 입력 필드: 제목, 메모
- 위치 표시 행: 장소명 + 지도 아이콘
- 카테고리 선택 행
- 날짜/시간 선택 행

**위치 선택 연동 (LocationPickerScreen 경유)**

LocationPickerScreen과 CheckinFormScreen 간 통신은 `locationPickerStore`를 통한 전역 Store 기반으로 구현한다 (라우팅 파라미터 방식 미사용).

```typescript
// LocationPickerScreen에서 결과 저장 후 goBack
setLocationPickerResult({ latitude, longitude, placeName, placeId });
navigation.goBack();

// CheckinFormScreen에서 useFocusEffect로 결과 수신
useFocusEffect(
  useCallback(() => {
    const result = consumeLocationPickerResult();
    if (result) {
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      if (result.placeName) setPlace(result.placeName);
    }
  }, [])
);
```

**백엔드 연계**
- `createCheckin` → Supabase `checkins` INSERT
- `updateCheckin` → Supabase `checkins` UPDATE
- `uploadPhoto` → Supabase Storage 직접 업로드

**보안**
- 사진 업로드: Supabase Storage 인증 경로
- 위치 권한: `Location.requestForegroundPermissionsAsync()`

---

### 2.5 LocationPickerScreen (위치 선택)

**파일**: `apps/mobile/src/screens/LocationPickerScreen.tsx`

**기능**
- 지도에서 탭하여 위치 선택
- 장소 검색 (검색창 → 자동완성 예측 목록 → 선택)
- 선택한 위치에 핀 마커 표시
- "확인" → CheckinFormScreen으로 결과 반환

**디자인**
- 상단: 검색창
- 검색 결과 드롭다운 (예측 목록)
- 전체 화면: react-native-maps 지도
- 하단: 취소 / 확인 버튼

**장소 검색 흐름**
```typescript
// 입력 → debounce → API 호출
const handleSearch = async (query: string) => {
  const results = await searchPlaces(query, currentLat, currentLng);
  setPredictions(results);
};

// 예측 항목 선택 → 지도 이동
const handleSelectPrediction = async (prediction: PlacePrediction) => {
  const details = await getPlaceDetails(prediction.place_id);
  setSelectedLocation({ latitude: details.latitude, longitude: details.longitude });
  mapRef.current?.animateToRegion({ ...details });
};
```

**백엔드 연계**
- `searchPlaces(query, lat, lng)` → `GET /api/places/autocomplete`
- `getPlaceDetails(place_id)` → `GET /api/places/details`

---

### 2.6 LoginScreen (로그인)

**파일**: `apps/mobile/src/screens/LoginScreen.tsx`

**기능**
- Google OAuth 로그인

**디자인**
- 앱 로고 + 타이틀
- Google 로그인 버튼

**인증 흐름**
```typescript
await signInWithGoogle();
// RootNavigator가 onAuthStateChange 감지 → AppNavigator로 자동 전환
```

**보안**
- `WebBrowser.openAuthSessionAsync` 사용 (인앱 브라우저)
- PKCE 흐름 우선, Implicit 흐름 폴백
- 세션 iOS Keychain(expo-secure-store) 저장

---

### 2.7 ScheduleScreen (2주 일정)

**파일**: `apps/mobile/src/screens/ScheduleScreen.tsx`

**기능**
- 오늘부터 2주간 Google Calendar 일정 표시
- 위치 정보가 있는 이벤트에 날씨 배지 표시 (Open-Meteo)
- 상단 Gemini AI 조언 카드
- 당겨서 새로고침

**디자인**
- 헤더: "일정" 제목 + "오늘부터 2주" 부제
- AI 조언 카드 (주황색 좌측 보더, 상단 고정)
- 날짜별 섹션 헤더 (오늘/내일/모레 강조, 오늘은 주황색)
- 이벤트 카드: 시간 | 제목 + 위치 링크 + 날씨 배지
  - 위치 텍스트 탭 → Google Maps 열기
  - 날씨 배지: 이모지, 한국어 설명, 최저~최고°C, 강수량(있을 때), 강풍 경고(30km/h↑)
- 빈 상태 / 토큰 만료 안내 화면

**백엔드 연계**
- `fetchScheduleWithWeather()` → `GET /api/calendar/schedule` (Vercel API 경유)

---

### 2.8 SettingsScreen (설정)

**파일**: `apps/mobile/src/screens/SettingsScreen.tsx`

**기능**
- 로그인 사용자 프로필 표시 (이름, 이메일, 아바타)
- Google Calendar 연동 상태 표시
- Google Calendar 연동 해제
- 로그아웃

**디자인**
- 프로필 섹션 (아바타 + 이름 + 이메일)
- 설정 항목 리스트 (섹션 구분)
- 로그아웃 버튼 (빨간색)

**백엔드 연계**
- `fetchSettings` → Supabase `user_profiles` 직접 조회
- `updateSettings` → Supabase `user_profiles` UPDATE
- `disconnectCalendar` → `POST /api/calendar/disconnect` (Vercel API 경유)
- Supabase `signOut()` → 로그아웃

---

## 3. 주요 컴포넌트

### CheckinCard (`src/components/CheckinCard.tsx`)

- 체크인 카드 표시
- 사진 썸네일, 카테고리 아이콘, 제목, 메모, 시각
- 수정 / 삭제 버튼

### TripCard (`src/components/TripCard.tsx`)

- 여행 카드 표시
- 커버 사진, 제목, 첫 체크인 날짜
- 공개/비공개 배지 (사진 좌측 하단)
- `is_frequent = true`이면 `⭐ 자주 가는 곳` 앰버색 배지 (사진 좌측 상단)

### PhotoPickerButton (`src/components/PhotoPickerButton.tsx`)

- 사진 선택 ActionSheet: "사진 라이브러리" / "카메라"
- 선택 후 Supabase Storage 업로드
- 미리보기 이미지 표시

### CategorySelector (`src/components/CategorySelector.tsx`)

- 카테고리 선택 모달
- 12가지 카테고리 아이콘 그리드

### PlaceSearchPanel (`src/components/PlaceSearchPanel.tsx`)

- 장소 검색 입력창 + 예측 목록
- `GET /api/places/autocomplete` 호출

### TodayCalendarSection (`src/components/TodayCalendarSection.tsx`)

- 오늘의 Google Calendar 일정 표시
- `GET /api/calendar` 호출

### TripTaglineBanner (`src/components/TripTaglineBanner.tsx`)

- AI 생성 여행 한줄 요약 표시
- `GET /api/trips/[id]/tagline` 호출

### TripFormModal (`src/components/TripFormModal.tsx`)

- 여행 생성/수정 모달
- 제목, 설명, 시작일/종료일, 장소 입력
- "⭐ 자주 가는 곳" Switch 토글 (`is_frequent`) — 빠른 체크인 기능에서 해당 여행의 체크인 노출 여부 제어

### QuickCheckinSheet (`src/components/QuickCheckinSheet.tsx`)

- 빠른 체크인용 바텀 시트 모달 (`Modal presentationStyle="overFullScreen"`)
- 현재 위치 기반으로 `is_frequent = true` 여행의 주변 체크인 목록 로드
- 체크인을 여행별로 그룹핑: 그룹 헤더에 여행명 + "현재: [장소] · [시간 전]" 표시
- 각 항목에 거리 및 체크인 버튼 (현재 위치 항목은 주황색 강조)
- 체크인 완료 시 `onCheckedIn(checkin)` 콜백 호출
- 하단 탭 바와 시각적 충돌 없음 (Modal이 전체 화면을 덮음)

### SideDrawer (`src/components/SideDrawer.tsx`)

- 여행 목록 표시 (TripScreen에서 사용)
- 여행 선택 및 관리

---

## 4. 상태 관리 (Zustand)

trips와 checkins는 Zustand 전역 스토어로 관리한다. 어느 화면에서 수정해도 모든 화면에 즉시 반영된다.

### tripsStore (`src/store/tripsStore.ts`)

```typescript
interface TripsState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  loadTrips: () => Promise<void>;
  addTrip: (data: TripFormData) => Promise<Trip>;
  updateTrip: (id: string, data: Partial<TripFormData>) => Promise<Trip>;
  removeTrip: (id: string) => Promise<void>;
}
```

### checkinsStore (`src/store/checkinsStore.ts`)

```typescript
interface CheckinsState {
  checkins: Checkin[];      // 현재 trip의 체크인
  tripId: string | null;
  loading: boolean;
  error: string | null;
  allCheckins: Checkin[];   // 전체 체크인 (CheckinsScreen용)
  allCheckinsLoading: boolean;
  allCheckinsError: string | null;
  loadCheckins: (tripId: string) => Promise<void>;
  loadAllCheckins: () => Promise<void>;
  addCheckin: (data: CheckinInsert) => Promise<Checkin>;
  updateCheckin: (id: string, data: Partial<CheckinInsert>) => Promise<Checkin>;
  removeCheckin: (id: string) => Promise<void>;
}
```

`addCheckin` / `updateCheckin` / `removeCheckin` 시 `checkins`와 `allCheckins` 양쪽 모두 업데이트된다.

### locationPickerStore (`src/store/locationPickerStore.ts`)

LocationPickerScreen → CheckinFormScreen 간 위치 결과 전달에 사용되는 단순 Store.

```typescript
export function setLocationPickerResult(result: LocationPickerResult): void;
export function consumeLocationPickerResult(): LocationPickerResult | null;

type LocationPickerResult = {
  latitude: number;
  longitude: number;
  placeName?: string;
  placeId?: string;
};
```

CheckinFormScreen은 `useFocusEffect` 내에서 `consumeLocationPickerResult()`를 호출하여 결과를 읽고 소비한다.

---

## 5. 커스텀 훅

훅은 Zustand 스토어의 얇은 래퍼로, 기존 인터페이스를 유지한다.

| 훅 | 파일 | 역할 |
|---|---|---|
| `useTrips` | `src/hooks/useTrips.ts` | `tripsStore` 래퍼 — 여행 CRUD |
| `useCheckins` | `src/hooks/useCheckins.ts` | `checkinsStore` 래퍼 — 특정 여행의 체크인 CRUD |
| `useAllCheckins` | `src/hooks/useAllCheckins.ts` | `checkinsStore` 래퍼 — 전체 체크인, `useFocusEffect`로 탭 포커스 시 자동 새로고침 |

---

## 6. 라이브러리 (lib/)

### api.ts (`src/lib/api.ts`)

모든 백엔드 API 호출의 단일 진입점.

```typescript
// 인증 헤더 자동 첨부
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}
```

**API 모듈 목록**

Supabase 직접 호출과 Vercel API 경유로 구분된다.

| 함수 | 호출 방식 | 비고 |
|---|---|---|
| `fetchTrips()` | Supabase 직접 | checkins 조인으로 `first_checkin_date`, `cover_photo_url` 보강 |
| `createTrip(data)` | Supabase 직접 | |
| `updateTrip(id, data)` | Supabase 직접 | |
| `deleteTrip(id)` | Supabase 직접 | |
| `fetchCheckins(tripId)` | Supabase 직접 | |
| `fetchAllCheckins(tripId?)` | Supabase 직접 | |
| `createCheckin(data)` | Supabase 직접 | |
| `updateCheckin(id, data)` | Supabase 직접 | |
| `deleteCheckin(id)` | Supabase 직접 | |
| `fetchSettings()` | Supabase 직접 | `user_profiles.settings` 조회 |
| `updateSettings(data)` | Supabase 직접 | `user_profiles.settings` 업데이트 |
| `fetchNearbyCheckins(lat, lng, radius?)` | Supabase 직접 | `is_frequent` 여행 체크인 조회 후 Haversine 클라이언트 필터링 |
| `uploadPhoto(uri)` | Supabase Storage 직접 | 업로드 후 `EXPO_PUBLIC_PHOTO_CDN_URL`로 도메인 치환 |
| `searchPlaces(query, lat, lng)` | Vercel API | `GET /api/places/autocomplete` |
| `getPlaceDetails(place_id)` | Vercel API | `GET /api/places/details` |
| `fetchCalendarEvents()` | Vercel API | `GET /api/calendar` |
| `fetchCalendarAdvice(events)` | Vercel API | `POST /api/calendar/advice` |
| `fetchScheduleWithWeather()` | Vercel API | `GET /api/calendar/schedule` — 2주 일정 + 날씨 + AI 조언 |
| `disconnectCalendar()` | Vercel API | `POST /api/calendar/disconnect` |
| `generateTagline(tripId)` | Vercel API | `POST /api/trips/[id]/tagline` |

### supabase.ts (`src/lib/supabase.ts`)

```typescript
const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,  // iOS Keychain
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### auth.ts (`src/lib/auth.ts`)

```typescript
export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'travel-companion' });

  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === 'success') {
    const code = new URL(result.url).searchParams.get('code');
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);  // PKCE
    } else {
      // Implicit flow fallback
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  }
}
```

---

## 7. 인증 및 보안

### 인증 흐름

```
LoginScreen → Google OAuth (WebBrowser)
  → Supabase OAuth → Google 인증 페이지
  → Redirect URI (travel-companion://)
  → code 파라미터 교환 (PKCE) 또는 access_token (Implicit)
  → Supabase 세션 수립
  → iOS Keychain 저장 (expo-secure-store)
  → RootNavigator: session 감지 → AppNavigator 전환
```

### API 보안

- **Supabase 직접 호출**: SDK가 세션 토큰을 자동 첨부. RLS 정책이 데이터 접근 경계.
- **Vercel API 호출**: `Authorization: Bearer {access_token}` 헤더를 수동 첨부. 서버에서 JWT 검증.
- 세션 만료 시 `autoRefreshToken`으로 자동 갱신

### 위치 권한

```typescript
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  // 권한 없으면 현재 위치 사용 불가, 수동 입력 안내
}
```

### 사진/카메라 권한

- `expo-image-picker`: `requestMediaLibraryPermissionsAsync()` / `requestCameraPermissionsAsync()`

---

## 8. 환경 변수

**파일**: `apps/mobile/.env.development` / `apps/mobile/.env.production`

```
EXPO_PUBLIC_SUPABASE_URL      # Supabase 프로젝트 URL
EXPO_PUBLIC_SUPABASE_ANON_KEY # Supabase anon 키
EXPO_PUBLIC_API_URL           # Vercel API 베이스 URL
EXPO_PUBLIC_PHOTO_CDN_URL     # Cloudflare Worker URL (사진 CDN 도메인 치환용)
```

**API URL 설정**
- `.env.development`: `http://localhost:3000` (시뮬레이터용)
- `.env.production`: `https://PRODUCTION_URL` (실기기/배포용)

**실행 방법**
- 시뮬레이터: `npx expo run:ios`
- 실기기: `NODE_ENV=production npx expo run:ios --device`

---

## 9. 사진 업로드 흐름

```
PhotoPickerButton 탭
  → ActionSheet: 라이브러리 / 카메라 선택
  → expo-image-picker로 이미지 선택
  → (선택사항) exifr.gps()로 GPS 추출
  → Supabase Storage 업로드 (`uploadPhoto(uri)`)
  → Public URL 반환
  → CheckinFormScreen: photo_url + 좌표 설정
```

> iOS에서 사진 라이브러리 선택 시 EXIF GPS가 제거될 수 있음.
> 이 경우 LocationPickerScreen에서 수동 위치 설정 유도.
