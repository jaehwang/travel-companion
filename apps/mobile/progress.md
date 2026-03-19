# Mobile App 개발 진행 상황

## 완료된 작업

### Phase 0 — 프로젝트 구조
- `expo-dev-client` 설치 및 `app.json` 플러그인 등록 (첫 번째 플러그인으로)
- `package.json` scripts 업데이트: `start` → `expo start --dev-client`
- `src/lib/api.ts` — Bearer 토큰 자동 첨부 fetch 래퍼 + Trips/Checkins/Places/Calendar/Storage API
- `src/navigation/RootNavigator.tsx` — Supabase 세션 기반 로그인 전/후 분기
- `src/navigation/AppNavigator.tsx` — Stack 네비게이터 (Home, Trip, CheckinForm, LocationPicker, Settings)

### Phase 1 — HomeScreen
- `src/screens/HomeScreen.tsx` — FlatList 여행 카드 목록, Pull-to-refresh, 오렌지 FAB
- `src/components/TripCard.tsx` — 커버 사진, 날짜/제목, 공개/비공개 배지, 케밥 메뉴(⋮)
- `src/components/TripFormModal.tsx` — 여행 생성 모달 (제목, 설명, 날짜)
- `src/hooks/useTrips.ts` — `/api/trips` CRUD

### Phase 2 — TripScreen
- `src/screens/TripScreen.tsx` — Google Maps + 체크인 타임라인, 날짜 필터, FAB
- `src/components/SideDrawer.tsx` — 좌측 슬라이드인 여행 전환 드로어
- `src/components/CheckinCard.tsx` — 카테고리 컬러 스트립, 사진, 시간, 케밥 메뉴
- `src/components/TripTaglineBanner.tsx` — AI 태그라인 배너
- `src/hooks/useCheckins.ts` — `/api/checkins?trip_id=` CRUD

### Phase 3 — CheckinFormScreen
- `src/screens/CheckinFormScreen.tsx` — 전체화면 체크인 생성 모달
- `src/screens/LocationPickerScreen.tsx` — 지도 위치 선택 (검색, 탭, 드래그, 지도/위성 토글)
- `src/components/CheckinFormToolbar.tsx` — 하단 툴바 (사진/장소/분류/시각)
- `src/components/PlaceSearchPanel.tsx` — 장소 자동완성 (`/api/places/autocomplete`)
- `src/components/CategorySelector.tsx` — 9가지 카테고리 선택 그리드
- `src/components/PhotoPickerButton.tsx` — EXIF GPS 추출, 이미지 압축, Supabase Storage 업로드

### Phase 4 — SettingsScreen
- `src/screens/SettingsScreen.tsx` — 프로필 카드, Google Calendar 연동, 로그아웃

### 빌드 환경
- `npx expo run:ios` 로 iOS 시뮬레이터 빌드 완료
- CocoaPods 설치됨 (Homebrew)
- Google Maps iOS SDK: `app.json` plugins에 `react-native-maps` 플러그인 + `iosGoogleMapsApiKey` 추가
  - Podfile에 `react-native-maps/Google` subspec이 포함되어 Google Maps SDK 자동 설치됨
  - `AppDelegate.swift`에 `GMSServices.provideAPIKey(...)` 자동 생성됨

---

## 해결된 이슈

### ~~1. 지도 회색 (Google Maps 미표시)~~ ✅ 해결
- **원인**: `app.json`에 `react-native-maps` config plugin이 없어 Podfile에 `react-native-maps/Google` subspec이 누락됨
  - Google Maps SDK(`GoogleMaps` CocoaPod)가 설치되지 않아 `#if canImport(GoogleMaps)` 조건이 false
  - `GMSServices.provideAPIKey()`가 실제로 호출되지 않았음
- **해결**: `app.json` plugins에 `["react-native-maps", {"iosGoogleMapsApiKey": "..."}]` 추가 → `expo prebuild` + `pod install` + `expo run:ios`

### ~~2. 이미지 미표시 (Supabase Storage)~~ ✅ 해결

---

## 실행 방법

```bash
# 개발 서버 (JS 번들)
cd apps/mobile
npm start          # expo start --dev-client

# 웹 API 서버 (별도 터미널)
cd apps/web
npm run dev

# 네이티브 재빌드 필요 시 (네이티브 코드 변경 시)
cd apps/mobile
npx expo run:ios
```

## 환경 변수

- `apps/mobile/.env` — `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`은 로컬 개발 시 웹 서버가 실행 중이어야 동작함
