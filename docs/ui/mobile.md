# Mobile 앱 Frontend 문서

**플랫폼**: Expo (React Native) / TypeScript / iOS
**실행**: `cd apps/mobile && npx expo run:ios`
**백엔드**: 웹 앱 API (`apps/web/app/api/`)를 HTTP로 호출

---

## 1. 네비게이션 구조

```
App.tsx
  └─ RootNavigator
       ├─ 로딩 중 → ActivityIndicator
       ├─ 미인증 → LoginScreen
       └─ 인증 완료 → AppNavigator (Stack.Navigator)
            ├─ Home (기본 화면)
            ├─ Trip (여행 상세)
            ├─ CheckinForm (modal)
            ├─ LocationPicker (modal)
            └─ Settings
```

### 네비게이션 파라미터 타입

```typescript
type AppStackParamList = {
  Home: undefined;
  Trip: { trip: Trip };
  CheckinForm: {
    tripId: string;
    tripTitle: string;
    initialLatitude?: number;
    initialLongitude?: number;
    initialPlace?: string;
    initialPlaceId?: string;
    locationResult?: LocationPickerResult;  // LocationPicker 반환값
    checkin?: Checkin;                      // 수정 모드
  };
  LocationPicker: {
    initialLatitude?: number;
    initialLongitude?: number;
  };
  Settings: undefined;
};
```

---

## 2. 화면 목록

### 2.1 HomeScreen (여행 목록)

**파일**: `apps/mobile/src/screens/HomeScreen.tsx`

**기능**
- 사용자의 여행 목록 표시 (`FlatList`)
- 여행 생성 버튼 (상단 우측)
- 여행 카드 Long Press → ActionSheetIOS (iOS) / Alert (Android) 메뉴
  - 수정, 삭제, 공개/비공개 토글
- 당겨 새로고침 (RefreshControl)
- 여행 카드 탭 → TripScreen 이동

**디자인**
- 상단 헤더: 앱 타이틀, 사용자 아바타
- 여행 카드: 커버 사진 (없으면 회색 플레이스홀더), 제목, 첫 체크인 날짜
- 빈 상태: "여행을 추가해보세요" 안내

**백엔드 연계**
- `useTrips` 훅 → `GET /api/trips`
- `createTrip` → `POST /api/trips`
- `updateTrip` → `PATCH /api/trips/[id]`
- `deleteTrip` → `DELETE /api/trips/[id]`

---

### 2.2 TripScreen (여행 상세)

**파일**: `apps/mobile/src/screens/TripScreen.tsx`

**기능**
- 여행의 체크인 지도 표시 (react-native-maps)
- 여행 정보 배너 (TripTaglineBanner)
- 오늘의 일정 섹션 (TodayCalendarSection)
- 날짜별 그룹핑된 체크인 타임라인
- 체크인 카드 탭 → 수정, Long Press → 삭제
- 새 체크인 추가 버튼 (하단 FAB)

**디자인**
- 상단: 여행 제목 헤더 + 설정 아이콘
- 지도: 화면 상단 약 40% 차지
  - 체크인 마커 표시 (같은 좌표 중복 제거, 최신 마커만)
  - 지도 영역은 체크인 좌표 기반 자동 조정
- 여행 정보 배너: AI Tagline, 여행 기간, 대표 장소
- 날짜 구분자 + 체크인 카드 리스트
- 하단: 체크인 추가 FAB 버튼

**지도 영역 계산**
```typescript
// 체크인 좌표로 바운드 계산
const mapRegion = useMemo(() => {
  const lats = checkins.map(c => c.latitude);
  const lngs = checkins.map(c => c.longitude);
  return {
    latitude: (max(lats) + min(lats)) / 2,
    longitude: (max(lngs) + min(lngs)) / 2,
    latitudeDelta: (max(lats) - min(lats)) * 1.5 || 0.05,
    longitudeDelta: (max(lngs) - min(lngs)) * 1.5 || 0.05,
  };
}, [checkins]);
```

**리스트 데이터 구조**
```typescript
type ListItem =
  | { type: 'date'; date: string; label: string }
  | { type: 'checkin'; checkin: Checkin };
```

**백엔드 연계**
- `useCheckins(tripId)` → `GET /api/checkins?trip_id={id}`
- `updateCheckin` → `PATCH /api/checkins/[id]`
- `deleteCheckin` → `DELETE /api/checkins/[id]`
- `GET /api/trips/[id]/tagline` → AI 여행 요약

---

### 2.3 CheckinFormScreen (체크인 작성/수정)

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
- 전체화면 모달 스타일 (Stack 네비게이터 modal 모드)
- 상단: 취소 / 저장 버튼
- 사진 미리보기 영역
- 입력 필드: 제목, 메모
- 위치 표시 행: 장소명 + 지도 아이콘
- 카테고리 선택 행
- 날짜/시간 선택 행

**위치 선택 연동 (LocationPickerScreen 경유)**
```typescript
// LocationPickerScreen에서 CheckinFormScreen으로 반환
navigation.navigate('CheckinForm', {
  ...route.params,
  locationResult: {
    latitude, longitude,
    placeName, placeId,
  },
});

// CheckinFormScreen에서 결과 수신
useEffect(() => {
  if (locationResult) {
    setLatitude(locationResult.latitude);
    setLongitude(locationResult.longitude);
    if (locationResult.placeName) setPlace(locationResult.placeName);
  }
}, [locationResult]);
```

**백엔드 연계**
- `createCheckin` → `POST /api/checkins`
- `updateCheckin` → `PATCH /api/checkins/[id]`
- `uploadPhoto` → Supabase Storage 직접 업로드

**보안**
- 사진 업로드: Supabase Storage 인증 경로
- 위치 권한: `Location.requestForegroundPermissionsAsync()`

---

### 2.4 LocationPickerScreen (위치 선택)

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

### 2.5 LoginScreen (로그인)

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

### 2.6 WebAppScreen (웹앱 하이브리드)

**파일**: `apps/mobile/src/screens/WebAppScreen.tsx`

**기능**
- 웹 앱 전체를 WebView로 표시하는 하이브리드 화면
- Supabase 세션 토큰을 `/api/mobile-session` 엔드포인트에 전달해 서버 쿠키 세션 설정 후 로드
- 세션 만료 감지: 웹 앱이 `/login`으로 리다이렉트하면 `onSessionExpired()` 콜백 호출 → 모바일 로그아웃
- Android 뒤로가기 버튼으로 웹 히스토리 탐색

**인터페이스**
```typescript
type Props = {
  onSessionExpired: () => void;
};
```

**인증 흐름**
```
Supabase getSession() → access_token + refresh_token
  → GET /api/mobile-session?access_token=...&refresh_token=...
  → 서버 쿠키 설정 → /checkin 리다이렉트 → WebView 로드
```

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
- `fetchSettings` → `GET /api/settings`
- `disconnectCalendar` → `POST /api/calendar/disconnect`
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
- 공개/비공개 배지

### PhotoPickerButton (`src/components/PhotoPickerButton.tsx`)

- 사진 선택 ActionSheet: "사진 라이브러리" / "카메라"
- 선택 후 Supabase Storage 업로드
- 미리보기 이미지 표시

### CategorySelector (`src/components/CategorySelector.tsx`)

- 카테고리 선택 모달
- 9가지 카테고리 아이콘 그리드

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

### SideDrawer (`src/components/SideDrawer.tsx`)

- 여행 목록 표시 (TripScreen에서 사용)
- 여행 선택 및 관리

---

## 4. 커스텀 훅

| 훅 | 파일 | 역할 |
|---|---|---|
| `useTrips` | `src/hooks/useTrips.ts` | 여행 CRUD + 상태 관리 |
| `useCheckins` | `src/hooks/useCheckins.ts` | 체크인 CRUD + 상태 관리 |

---

## 5. 라이브러리 (lib/)

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

| 함수 | HTTP | 경로 |
|---|---|---|
| `fetchTrips()` | GET | `/api/trips` |
| `createTrip(data)` | POST | `/api/trips` |
| `updateTrip(id, data)` | PATCH | `/api/trips/[id]` |
| `deleteTrip(id)` | DELETE | `/api/trips/[id]` |
| `fetchCheckins(tripId)` | GET | `/api/checkins?trip_id=` |
| `createCheckin(data)` | POST | `/api/checkins` |
| `updateCheckin(id, data)` | PATCH | `/api/checkins/[id]` |
| `deleteCheckin(id)` | DELETE | `/api/checkins/[id]` |
| `searchPlaces(query, lat, lng)` | GET | `/api/places/autocomplete` |
| `getPlaceDetails(place_id)` | GET | `/api/places/details` |
| `fetchSettings()` | GET | `/api/settings` |
| `updateSettings(data)` | PATCH | `/api/settings` |
| `fetchCalendarEvents()` | GET | `/api/calendar` |
| `fetchCalendarAdvice()` | POST | `/api/calendar/advice` |
| `disconnectCalendar()` | POST | `/api/calendar/disconnect` |
| `uploadPhoto(uri)` | — | Supabase Storage 직접 업로드 |

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

## 6. 인증 및 보안

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

- 모든 API 요청: `Authorization: Bearer {access_token}` 헤더
- 웹 앱 API 서버에서 Supabase JWT 검증
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

## 7. 환경 변수

**파일**: `apps/mobile/.env.development` / `apps/mobile/.env.production`

```
EXPO_PUBLIC_SUPABASE_URL      # Supabase 프로젝트 URL
EXPO_PUBLIC_SUPABASE_ANON_KEY # Supabase anon 키
```

**API URL 설정**
- `.env.development`: `http://localhost:3000` (시뮬레이터용)
- `.env.production`: `https://PRODUCTION_URL` (실기기/배포용)

**실행 방법**
- 시뮬레이터: `npx expo run:ios`
- 실기기: `NODE_ENV=production npx expo run:ios --device`

---

## 8. 사진 업로드 흐름

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
