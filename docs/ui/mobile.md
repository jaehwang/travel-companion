# Mobile 앱 Frontend 문서

**플랫폼**: Expo (React Native) / TypeScript / iOS
**실행**: `cd apps/mobile && npx expo run:ios`
**백엔드**: CRUD는 Supabase JS SDK 직접 호출. Places / Calendar / AI 등 서버 비밀 키가 필요한 기능 및 복합 트랜잭션(`deleteTrip`)은 웹 앱 API (`apps/web/app/api/`)를 HTTP로 호출.

**설계 명세 문서**:
- [`docs/mobile/component-specs.md`](../mobile/component-specs.md) — `components/` 컴포넌트 동작 요구사항
- [`docs/mobile/screen-section-specs.md`](../mobile/screen-section-specs.md) — `screens/` 서브컴포넌트·섹션 동작 요구사항
- [`docs/mobile/store-specs.md`](../mobile/store-specs.md) — Zustand 스토어 및 `RootNavigator` 동작 요구사항

새 컴포넌트·스토어·액션을 추가하거나 기존 동작을 변경할 때는 해당 명세 문서에 먼저 항목을 추가한 뒤 테스트와 구현을 진행한다.

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
            │    ├─ CheckinsTab → CheckinsStack
            │    │    └─ Checkins (전체 체크인)
            │    ├─ ScheduleTab → ScheduleScreen (2주 일정 + 날씨)
            │    ├─ MakeTab (만들기 버튼 — 중앙)
            │    ├─ MapTab → MapStack
            │    │    └─ MapBrowse (전체 체크인 지도 브라우징)
            │    └─ SearchTab → SearchScreen
            ├─ CheckinForm (modal)
            ├─ LocationPicker (modal)
            ├─ CheckinDetail (modal) ← 어느 탭에서든 접근 가능
            └─ Settings
```

탭 순서: 여행 · 체크인 · 일정 · [+] · **지도** · 검색 (총 6개, `TAB_COUNT = 6`)

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
  CheckinsTab: NavigatorScreenParams<CheckinsStackParamList>;
  ScheduleTab: undefined;
  MakeTab: undefined;
  MapTab: NavigatorScreenParams<MapStackParamList>;
  SearchTab: undefined;
};

type MapStackParamList = {
  MapBrowse: undefined;
};

type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CheckinForm: {
    tripId?: string;       // 생략 시 저장 전 여행 선택 UI 표시
    tripTitle?: string;
    initialLatitude?: number;
    initialLongitude?: number;
    initialPlace?: string;
    initialPlaceId?: string;
    checkin?: Checkin;  // 수정 모드
  };
  LocationPicker: {
    tripId?: string;
    tripTitle?: string;
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
- 자주 가는 곳에 체크인하기 버튼 (헤더 바로 아래) — 현재 위치의 가장 최근 체크인 상태 표시
- 사용자의 여행 목록 표시 (`FlatList`)
- 여행 카드 우상단 `···` 버튼 → ActionSheetIOS (iOS) / Alert (Android) 메뉴
  - 공개/비공개 전환, 공개 여행 링크 복사 (`is_public = true`일 때만), 수정, 삭제
  - 삭제 선택 시 "체크인도 함께 삭제할까요?" Alert:
    - "예, 체크인도 삭제" → cascade delete
    - "아니오, 미할당으로 보관" → 체크인을 default trip으로 이동 후 여행 삭제
- 당겨 새로고침 (RefreshControl)
- 여행 카드 탭 → TripScreen 이동

**디자인**
- 상단 헤더: 앱 타이틀, 사용자 아바타
- 자주 가는 곳에 체크인하기 버튼: 주황색 테두리 카드
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
- `deleteTrip` → 웹 앱 API (`DELETE /api/trips/[id]`) 호출 (`moveCheckins=true` 지원)
- `fetchNearbyCheckins(lat, lng)` → Supabase 직접 조회 후 클라이언트에서 Haversine 거리 계산

---

### 2.2 TripScreen (여행 상세)

**파일**: `apps/mobile/src/screens/trip/TripScreen.tsx` (178줄)

**하위 구조**:
```
src/screens/trip/
  TripScreen.tsx          # 상태 조합 + 레이아웃
  TripHeader.tsx          # 헤더 + 메뉴
  TripCheckinList.tsx     # 체크인 목록 (FlatList, 날짜 구분선, 정렬 토글, 빈 상태)
  TripMap.tsx             # 지도 뷰 (마커, 팝업, 현재 위치 버튼)
  hooks/
    useTripDetail.ts      # 데이터 페칭 + 파생 상태
```

**기능**
- 여행의 체크인 지도 표시 (react-native-maps)
- 여행 정보 카드 (description, 날짜, 장소 — 값이 있을 때만 표시)
- AI 태그라인 배너 (TripTaglineBanner)
- 오늘의 일정 섹션 (TodayCalendarSection)
- 날짜별 그룹핑된 체크인 타임라인
- 체크인 카드 탭 → 수정, Long Press → 삭제
- `···` 버튼 → 여행 설정 액션 시트
  - 여행 수정 → `TripFormModal` (edit 모드)
  - 공개/비공개 전환 → 즉시 API 호출
  - 공개 여행 링크 복사 (`is_public = true`일 때만) → 클립보드 복사 후 Alert
  - 자주 가는 곳 추가/제거 → 즉시 API 호출

**탭 컨텍스트**
- 포커스 시 `setTripCheckinContext(trip)` 호출 → 탭 바 "만들기 > 체크인" 이 해당 여행으로 연결됨
- 블러 시 `setTripCheckinContext(null)` 복원

**디자인**
- 상단: `[≡] [여행 이름] [···] [아바타]` 헤더
- 여행 정보 카드 (웹 앱과 동일한 구조)
  - 📅 시작일 ~ 종료일 (start_date 없으면 첫 체크인 날짜 사용)
  - 여행 설명 (description)
  - 📍 대표 장소 (place)
  - description/날짜/장소 모두 없으면 카드 미표시
- AI Tagline 배너
- 지도: 체크인 순서 번호 마커(파란 원 + 숫자) 표시 (같은 좌표 중복 제거 — `dedupedMarkers`로 동일 좌표 중 최신 체크인만 표시), 우하단 현재 위치 버튼
  - 마커 탭 → 팝업 표시 (사진, 제목, 위치) + 이전/다음 체크인 네비게이션 버튼
- 날짜 구분자 + 체크인 카드 리스트

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
  - `일반`: `is_frequent = false` 여행의 체크인 + **미할당 체크인** (tripMap에 없는 체크인) 표시
  - `자주 가는 곳`: `is_frequent = true` 여행의 체크인만 표시
  - 클라이언트 사이드 필터링 (trips 스토어 기반)
- 카드 탭 → 해당 TripScreen으로 이동 (TripsTab 전환)
  - 미할당 체크인(tripMap 미포함) 탭 시 이동 없음
- **카드 우측 상단 ⋮ 버튼** → 수정 / 삭제 메뉴
  - 수정: CheckinFormScreen으로 이동 (checkin 파라미터 전달)
  - 삭제: 확인 Alert 후 DB + Storage 사진 함께 삭제
- **카드 롱프레스 → "여행으로 이동" Alert** — 여행 목록 중 하나를 선택하면 `trip_id` 변경 후 목록 갱신
- 당겨 새로고침, 탭 포커스 시 자동 새로고침

**디자인**
- 상단 헤더: "체크인" 제목
- 헤더 아래 세그먼트 탭: `[  일반  |  자주 가는 곳  ]`
- 2열 그리드 카드 (`CARD_WIDTH = (screenWidth - 16*2 - 8) / 2`)
  - 상단: 사진 있으면 정사각형 이미지, 없으면 카테고리 아이콘 플레이스홀더 (동일 높이)
  - 카드 우측 상단: 반투명 배경 `⋮` 버튼 (수정/삭제 메뉴)
  - 하단 고정 높이(80px): 제목, 여행명(주황색), 위치(장소명 또는 "지도에서 보기" — 탭 시 Google Maps 오픈), 날짜·시간
  - **미할당 체크인**: 카드 좌측 상단에 주황색 `미할당` 뱃지 (`testID="badge-unassigned"`)
- 섹션 헤더: "2026년 3월" 형식
- 빈 상태: 안내 메시지

**데이터 흐름**
1. `useAllCheckins()` — 전체 체크인 목록 (스토어에서)
2. `useTrips()` — `Map<tripId, Trip>` 생성 (`fetchTrips`는 `is_default=false` 필터 적용)
3. `filter` state (`'normal' | 'frequent'`)로 `trips.is_frequent` 기준 클라이언트 필터링
   - `normal` 필터: `normalTripIds.has(c.trip_id) || !tripMap.has(c.trip_id)` (미할당 포함)
4. `useMemo`로 체크인을 `[Checkin, Checkin | null]` 쌍으로 묶어 SectionList sections 생성

**백엔드 연계**
- `useAllCheckins` 훅 → `fetchAllCheckins(tripId?)` → Supabase `checkins` 테이블 직접 조회
- `updateCheckin(id, { trip_id })` → Supabase `checkins` UPDATE (여행으로 이동 / 수정 시)
- `deleteCheckin(id)` → Supabase `checkins` DELETE + Storage 사진 파일 삭제

---

### 2.4 CheckinFormScreen (체크인 작성/수정)

**파일**: `apps/mobile/src/screens/checkin-form/CheckinFormScreen.tsx` (96줄)

**하위 구조**:
```
src/screens/checkin-form/
  CheckinFormScreen.tsx       # 섹션 조합 + 모달 관리
  hooks/
    useCheckinForm.ts         # 폼 상태 관리 (16개 state 변수, submit 로직)
  sections/
    FormHeader.tsx            # 아바타, 여행 선택 칩, 취소/제출 버튼
    FormBody.tsx              # 제목 입력, 메모, 사진, InfoChips, 에러 표시
    PhotoSection.tsx          # 사진 업로드/미리보기
    TimePickerSection.tsx     # 시각 선택
    InfoChips.tsx             # 위치·카테고리·시각 chip 표시
    NoteSection.tsx           # 메모 TextInput
```

**기능**
- 체크인 신규 생성 또는 수정 (route.params.checkin 유무로 판별)
- **여행 없이 진입 시** (`tripId` 미전달): 저장 전 여행 선택 UI 표시 (FlatList 칩 목록)
  - 여행 선택 전까지 저장 버튼 비활성화
  - 여행 선택 없이 저장하면 `trip_id` 없이 `createCheckin` 호출 → default trip 자동 할당
- 사진 첨부 (PhotoPickerButton → 라이브러리 또는 카메라)
- 위치 선택 → LocationPickerScreen 이동 후 결과 수신
- 장소 검색 (PlaceSearchPanel)
- 카테고리 선택 (CategorySelector 모달)
- 체크인 시각 DateTimePicker
- 현재 위치 자동 설정 (초기값 없을 때)

**디자인**
- 전체화면 모달 스타일 (RootStack modal 모드)
- 상단: 취소 / 저장 버튼
- `tripId` 없을 때: 여행 선택 칩 목록 (`testID="trip-selector"`)
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
- Google Calendar 연동하기 (OAuth)
- Google Calendar 연동 해제
- 로그아웃

**디자인**
- 프로필 섹션 (아바타 + 이름 + 이메일)
- 설정 항목 리스트 (섹션 구분)
- 미연동 상태: 파란색 "연동하기" 버튼
- 연동 상태: "연동됨" 텍스트 + "연동 해제" 버튼
- 로그아웃 버튼 (빨간색)

**Google Calendar OAuth 플로우 (모바일)**
1. "연동하기" 버튼 클릭 → `GET /api/calendar/mobile/connect` (Bearer) → Google OAuth URL 획득
2. `expo-web-browser.openAuthSessionAsync(url, 'travel-companion://calendar-callback')` 로 인앱 브라우저 열기
3. 사용자 Google 계정 동의
4. `travel-companion://calendar-callback?code=xxx` deep link로 앱 복귀
5. `POST /api/calendar/mobile/complete` (Bearer, `{code}`) → 서버에서 refresh_token 저장
6. 연동 상태 갱신

**백엔드 연계**
- `fetchSettings` → Supabase `user_profiles` 직접 조회
- `connectCalendar` → `GET /api/calendar/mobile/connect` (Vercel API 경유)
- `completeCalendarConnect` → `POST /api/calendar/mobile/complete` (Vercel API 경유)
- `disconnectCalendar` → `POST /api/calendar/disconnect` (Vercel API 경유)
- Supabase `signOut()` → 로그아웃

---

### 2.9 MapBrowseScreen (지도 기반 체크인 브라우징)

**파일**: `apps/mobile/src/screens/MapBrowseScreen.tsx`

**기능**
- Apple Photos / Google Photos 스타일 지도 브라우징
- 전체 체크인을 클러스터 썸네일 마커로 탐색 (`supercluster` 사용)
- 전체화면 지도 + Bottom Sheet(초기 snap 45%) 구조
- 마커 탭 → Bottom Sheet에 해당 체크인 1개 표시, 헤더에 "날짜 · 여행 이름" 표시
- 클러스터 탭 → 클러스터 bounds로 줌인 + 포함 체크인 그리드 표시
- 빈 곳 탭 / Bottom Sheet 최소화(snap 80pt) → 헤더 숨김, 전체 복귀
- 현재 위치 버튼 (expo-location)
- Bottom Sheet는 현재 지도 viewport에 보이는 체크인만 표시 (기본 상태)

**초기 지도 범위**
1. 현재 위치 취득 성공 → 현재 위치 중심, 줌 레벨 도시 수준
2. 권한 거부/타임아웃 → 전체 체크인 bounds fitToCoordinates
3. 체크인 없음 → 서울 기본값 (37.5665, 126.9780)

초기 region state는 체크인 로드 직후 `buildInitialRegion(checkins)`으로 동기화한다
(로드 전 SEOUL 기본값 상태에서 클러스터 계산이 빈 결과를 반환하는 문제 방지).
재진입 시 지도가 재마운트되지 않도록 `loading && checkins.length === 0`일 때만 로딩 스피너를 표시한다.

**마커 이미지 로딩**
사진이 있는 마커는 `tracksViewChanges={true}`로 시작해 `Image.onLoad` 콜백 후 `false`로 전환한다.
사진 없는 마커(아이콘)는 처음부터 `false`로 고정한다.

**백엔드 연계**
- `useAllCheckins()` 훅 → 전체 체크인 로드 (RLS로 본인 것만)

---

### 2.10 CheckinDetailScreen (체크인 상세)

**파일**: `apps/mobile/src/screens/CheckinDetailScreen.tsx`

**기능**
- 체크인 상세 정보 전용 화면 (RootStack Modal로 등록)
- `navigation.navigate('CheckinDetail', { checkin })` — 어느 탭에서든 접근 가능
- 뒤로가기 → 이전 화면(MapBrowseScreen 등)으로 복귀

**표시 내용**
- 사진 (전체 너비, 상단) — 없으면 카테고리 아이콘 플레이스홀더
- 카테고리 뱃지
- 제목
- 위치 링크 (항상 표시): 장소명이 있으면 장소명, 없으면 "지도에서 보기"
  - 탭 → Google Maps 열기: `place_id` 있으면 place_id 기반, 장소명만 있으면 장소명 검색, 둘 다 없으면 좌표 링크
- 날짜·시간
- 메시지
- 태그

---

## 3. 주요 컴포넌트

### CheckinCard (`src/components/CheckinCard.tsx`)

- 체크인 카드 표시
- 사진 썸네일, 카테고리 아이콘, 제목, 메모, 시각
- 수정 / 삭제 버튼

### CheckinMapMarker (`src/components/map/CheckinMapMarker.tsx`)

- 지도 위 체크인 단일 마커
- photo_url 있음: 원형 썸네일(52px), 흰 테두리 2px
- photo_url 없음: 카테고리 아이콘 + 배경색 원형
- 하단 삼각형 꼬리 (말풍선 스타일)
- `selected=true`: 파란 테두리 (`#3B82F6`)
- `onImageLoad` 콜백: 이미지 로드 완료 시 호출 (부모에서 `tracksViewChanges` 제어용)

### ClusterMarker (`src/components/map/ClusterMarker.tsx`)

- 지도 위 클러스터 마커 (64px, 단일 마커보다 크게)
- 대표 사진: 클러스터 내 최신순 정렬 후 **사진이 있는 첫 번째 체크인**의 photo_url 사용
- 우하단 파란 카운트 뱃지
- `onImageLoad` 콜백: 이미지 로드 완료 시 호출

### CheckinMapBottomSheet (`src/components/map/CheckinMapBottomSheet.tsx`)

- `@gorhom/bottom-sheet` v5 기반
- snap points: `[80, 45%, 85%]`
- `selectedCheckins=null`: 헤더 없음, 전달받은 체크인 목록(viewport 기준) 2열 그리드
- `selectedCheckins=[...]`: 헤더(날짜 · 여행 이름) 표시, 해당 체크인 그리드
- snap 0(80pt)으로 최소화 시 `onCollapse` 콜백 호출 → 부모에서 선택 초기화
- 빈 상태: "아직 체크인이 없습니다" 안내

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
- "⭐ 자주 가는 곳" Switch 토글 (`is_frequent`) — "자주 가는 곳에 체크인하기" 기능에서 해당 여행의 체크인 노출 여부 제어

### MakeTab 만들기 버튼 (`src/navigation/AppNavigator.tsx` — `MakeTabButton`)

- 탭 바 우측 끝에 위치하는 "만들기" 버튼
- 탭 시 하단에서 `AddActionSheet`가 슬라이드 업
- **여행**: 여행 생성 모달 (`TripFormModal`) 열기
- **체크인**:
  - TripScreen 포커스 중 (`_tripCheckinContext` non-null) → 해당 여행이 선택된 상태로 CheckinForm 열기 (서브텍스트로 여행명 표시)
  - 다른 화면 → tripId 없이 CheckinForm 열기 (default trip 자동 할당)
- `setTripCheckinContext(ctx | null)` 로 현재 여행 컨텍스트를 모듈 레벨 변수로 공유

### QuickCheckinSheet (`src/components/QuickCheckinSheet.tsx`)

- 자주 가는 곳에 체크인하기 바텀 시트 모달 (`Modal presentationStyle="overFullScreen"`)
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
| `useCheckinClusters` | `src/hooks/useCheckinClusters.ts` | `supercluster` 래퍼 — 체크인 배열 + region → 클러스터 배열 반환, `getLeaves()` 노출 |

---

## 6. 라이브러리 (lib/)

### api/ (`src/lib/api/`)

도메인별로 분리된 API 모듈. `src/lib/api.ts`는 하위 호환 re-export만 남아 있다.

```
src/lib/api/
  supabase-client.ts  # getUser(), Supabase 인증 헬퍼
  rest-client.ts      # apiFetch() — Vercel API Bearer 토큰 호출
  trips.ts            # Supabase 직접
  checkins.ts         # Supabase 직접
  nearby.ts           # Supabase 직접 + Haversine 클라이언트 필터링
  storage.ts          # Supabase Storage 직접
  places.ts           # Vercel API 경유
  calendar.ts         # Vercel API 경유
  settings.ts         # Vercel API 경유
  index.ts            # re-export
```

**API 모듈 목록**

| 함수 | 모듈 | 호출 방식 | 비고 |
|---|---|---|---|
| `fetchTrips()` | `trips.ts` | Supabase 직접 | `is_default=false` 필터. checkins 조인으로 `first_checkin_date`, `cover_photo_url` 보강 |
| `createTrip(data)` | `trips.ts` | Supabase 직접 | |
| `updateTrip(id, data)` | `trips.ts` | Supabase 직접 | |
| `deleteTrip(id)` | `trips.ts` | Supabase 직접 | |
| `fetchCheckins(tripId)` | `checkins.ts` | Supabase 직접 | |
| `fetchAllCheckins(tripId?)` | `checkins.ts` | Supabase 직접 | |
| `createCheckin(data)` | `checkins.ts` | Supabase 직접 | `trip_id` 생략 시 `getOrCreateDefaultTrip` 자동 할당 |
| `updateCheckin(id, data)` | `checkins.ts` | Supabase 직접 | |
| `deleteCheckin(id)` | `checkins.ts` | Supabase 직접 | |
| `fetchNearbyCheckins(lat, lng, radius?)` | `nearby.ts` | Supabase 직접 | `is_frequent` 여행 체크인 조회 후 Haversine 필터링 |
| `uploadPhoto(uri)` | `storage.ts` | Supabase Storage 직접 | 업로드 후 `EXPO_PUBLIC_PHOTO_CDN_URL`로 도메인 치환 |
| `fetchSettings()` | `settings.ts` | Vercel API | `GET /api/settings` |
| `updateSettings(data)` | `settings.ts` | Vercel API | `PATCH /api/settings` |
| `searchPlaces(query, lat, lng)` | `places.ts` | Vercel API | `GET /api/places/autocomplete` |
| `getPlaceDetails(place_id)` | `places.ts` | Vercel API | `GET /api/places/details` |
| `fetchCalendarEvents()` | `calendar.ts` | Vercel API | `GET /api/calendar` |
| `fetchCalendarAdvice(events)` | `calendar.ts` | Vercel API | `POST /api/calendar/advice` |
| `fetchScheduleWithWeather()` | `calendar.ts` | Vercel API | `GET /api/calendar/schedule` |
| `disconnectCalendar()` | `calendar.ts` | Vercel API | `POST /api/calendar/disconnect` |
| `generateTagline(tripId)` | `calendar.ts` | Vercel API | `POST /api/trips/[id]/tagline` |

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
