# 지도 기반 체크인 브라우징

> **상태**: 구현 완료

Apple Photos / Google Photos 스타일의 지도 브라우징 기능.
전체 여행의 모든 체크인을 지도 위 클러스터 썸네일 마커로 탐색한다.

## 레퍼런스 UX

- **Apple Photos**: 전체화면 지도 + 사진 썸네일 마커 + 클러스터(대표 사진 + 카운트 뱃지)
- **Google Photos**: 상단 지도 + 하단 드래그 시트(날짜별 체크인 그리드)

## 화면 구조

```
┌──────────────────────────────┐
│   [전체화면 지도]             │
│   • 원형 썸네일 마커          │
│   • 클러스터: 대표 사진 +     │
│     카운트 뱃지 (우하단)      │
│   ● 현재 위치 버튼 (우하단)   │
│─── ━━━ ──────────────────────│  ← 드래그 핸들 (Bottom Sheet, 초기 45%)
│  [헤더 없음 — 초기/전체 상태] │
│  [선택 시: 날짜 · 여행 이름]  │  ← 마커/클러스터 선택 시에만 조건부
│  [체크인 2열 그리드]          │
└──────────────────────────────┘
```

**Bottom Sheet 상태 전이**:
- 초기 진입: snap 45%, 헤더 없음, **현재 viewport 체크인** 그리드 (`checked_in_at` 내림차순)
- 마커 탭: snap 45% 유지, 헤더(날짜·여행명) 표시, 해당 체크인 1개만 그리드 표시
- 클러스터 탭: 클러스터 bounds로 줌인, snap 45% 유지, 헤더 표시, 클러스터 내 체크인 그리드
- 빈 곳 탭 / Bottom Sheet 최소화(snap 80pt): 헤더 숨김, viewport 체크인으로 복귀

## 진입점 2가지

1. **하단 탭 "지도"** — 전체 체크인 브라우징 (새 탭)
2. **여행 상세 TripMap** — 해당 여행 체크인만, 번호 마커 유지 (Phase 5 미적용)

---

## 구현 내역

### Phase 0: 라이브러리 설치 ✅

- `@gorhom/bottom-sheet` v5.2.9
- `supercluster` v8.0.1
- `@types/supercluster` v7.1.3

### Phase 1: 공통 마커 컴포넌트 ✅

`apps/mobile/src/components/map/`

#### `CheckinMapMarker.tsx`
- 사진 있음: 원형 썸네일 (지름 52px, 흰 테두리 2px, 그림자)
- 사진 없음: 카테고리 아이콘 + 배경색 원형
- 하단에 삼각형 꼬리 (말풍선 스타일)
- 선택 시: 테두리 파란색
- `onImageLoad` 콜백: 이미지 로드 완료 시 호출 (부모에서 `tracksViewChanges` 제어용)

#### `ClusterMarker.tsx`
- 대표 사진: 최신순 정렬 후 **사진이 있는 첫 번째 체크인**의 photo_url 사용
- 우하단 카운트 뱃지 (파란 원 + 흰 숫자)
- 크기: 64px
- `onImageLoad` 콜백 제공

#### `useCheckinClusters.ts` 훅

- `supercluster`를 `useMemo`로 생성, 체크인 목록 변경 시에만 재생성
- region → bbox/zoom 변환 포함
- 클러스터 탭 시 `supercluster.getLeaves(clusterId)` 로 포함 체크인 추출

### Phase 2: CheckinMapBottomSheet 컴포넌트 ✅

`apps/mobile/src/components/map/CheckinMapBottomSheet.tsx`

- snap points: `[80, SCREEN_HEIGHT * 0.45, SCREEN_HEIGHT * 0.85]`
- 헤더: 날짜 · 여행 이름 (trips store에서 `trip_id`로 조회)
- 기본 상태: viewport 체크인 목록 표시 (allCheckins prop으로 전달)
- snap 0(80pt) 도달 시 `onCollapse` 콜백 호출 → 부모에서 선택 초기화

### Phase 3: MapBrowseScreen ✅

`apps/mobile/src/screens/MapBrowseScreen.tsx`

**마커 이미지 로딩**: 사진 있는 마커는 `tracksViewChanges={true}`로 시작, `onLoad` 후 `false` 전환.

**초기 region 동기화**: 체크인 로드 직후 `useEffect`로 `buildInitialRegion(checkins)` 즉시 반영
(로드 전 SEOUL 기본값으로 클러스터가 빈 결과를 반환하는 문제 방지).

**재진입 시 지도 위치 유지**: `loading && checkins.length === 0`일 때만 로딩 스피너 표시.
데이터가 이미 있으면 지도를 유지한 채 백그라운드 재로드 (`onMapReady` 재호출 방지).

### Phase 3-b: TripMap 초기 범위 ✅

여행 상세 진입 시: 해당 여행 체크인 전체 bounds로 `fitToCoordinates` (기존 동작 유지).

### Phase 4: 하단 탭 "지도" + 네비게이션 ✅

- `TAB_COUNT = 6`, `MapStack`, `MapTab` (map-outline 아이콘, 라벨 "지도")
- `CheckinDetailScreen` — RootStack Modal로 등록, 어느 탭에서든 접근 가능

### Phase 4-b: CheckinDetailScreen ✅

`apps/mobile/src/screens/CheckinDetailScreen.tsx`

- 위치 링크 항상 표시: 장소명 있으면 장소명, 없으면 "지도에서 보기"
- Google Maps URL 우선순위: `place_id` → 장소명 검색 → 좌표

### Phase 5: TripMap 마커 업그레이드 ❌ 미적용

원래 계획(`CheckinMapMarker`로 교체)을 구현했으나, 기존 번호 마커(파란 원 + 숫자) 방식이
체크인 순서를 직관적으로 보여주므로 원복.

---

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `apps/mobile/package.json` | `@gorhom/bottom-sheet`, `supercluster`, `@types/supercluster` 추가 |
| `apps/mobile/src/hooks/useCheckinClusters.ts` | 신규 |
| `apps/mobile/src/components/map/CheckinMapMarker.tsx` | 신규 |
| `apps/mobile/src/components/map/ClusterMarker.tsx` | 신규 |
| `apps/mobile/src/components/map/CheckinMapBottomSheet.tsx` | 신규 |
| `apps/mobile/src/screens/MapBrowseScreen.tsx` | 신규 |
| `apps/mobile/src/screens/CheckinDetailScreen.tsx` | 신규 |
| `apps/mobile/src/navigation/AppNavigator.tsx` | MapStack + 지도 탭 + `TAB_COUNT = 6` |
| `apps/mobile/src/screens/trip/TripMap.tsx` | Phase 5 원복 — 번호 마커 유지 |
| `apps/mobile/src/i18n/en.json` | `tab.map` 추가 |
| `apps/mobile/src/i18n/ko.json` | `tab.map` 추가 |
| `docs/ui/mobile.md` | MapBrowseScreen, CheckinDetailScreen 문서 추가 |

---

## 비고

- `react-native-map-clustering`은 사용하지 않음. `supercluster` 직접 통합.
- `fetchAllCheckins()`는 기존 구현 활용. RLS로 본인 체크인만 반환.
- 이미지 로딩: CDN URL 사용 중이므로 썸네일 별도 최적화 불필요.
- `App.tsx` `GestureHandlerRootView` 래핑 이미 존재 — 추가 작업 불필요.
