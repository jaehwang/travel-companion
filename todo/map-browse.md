# 지도 기반 체크인 브라우징

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
│─── ━━━ ──────────────────────│  ← 드래그 핸들 (Bottom Sheet)
│  2024년 11월 · 도쿄 여행      │  ← 선택된 클러스터/마커 기준 날짜·여행
│  [체크인 카드 가로 스크롤]    │
└──────────────────────────────┘
```

아무것도 선택하지 않은 초기 상태: Bottom Sheet 최소화(peek), 최근 체크인 표시.

## 진입점 2가지

1. **하단 탭 "지도"** — 전체 체크인 브라우징 (새 탭)
2. **여행 상세 TripMap** — 해당 여행 체크인만, 마커를 썸네일로 업그레이드

---

## 구현 계획

### Phase 0: 라이브러리 설치

```bash
# apps/mobile
npx expo install @gorhom/bottom-sheet supercluster
npx expo install --dev @types/supercluster
```

**라이브러리 선택 근거**

| 라이브러리 | 결정 | 근거 |
|-----------|------|------|
| `@gorhom/bottom-sheet` v5 | ✅ 사용 | peer deps: reanimated `>=3.16.0 \|\| >=4.0.0-` → 현재 v4.2.2와 호환 |
| `react-native-reanimated` | 이미 설치 | v4.2.2 |
| `react-native-gesture-handler` | 이미 설치 | v2.30.0 |
| `GestureHandlerRootView` | 이미 존재 | `App.tsx` 최상위 래핑 확인됨, 추가 작업 불필요 |
| `react-native-map-clustering` | ❌ 미사용 | 유지보수 사실상 중단 (마지막 배포 v4.0.0, 수년 전), TypeScript 지원 불안정 |
| `supercluster` v8 | ✅ 사용 | 업계 표준 클러스터링 라이브러리, 활발한 유지보수, TS 타입 내장 |

**supercluster 통합 방식**: `useCheckinClusters` 커스텀 훅에서 지도 region 변화 시
`supercluster.getClusters(bbox, zoom)` 호출 → `Marker`를 직접 렌더링.
`react-native-maps`의 네이티브 클러스터 prop 미사용.

### Phase 1: 공통 마커 컴포넌트

`apps/mobile/src/components/map/`

#### `CheckinMapMarker.tsx`
- 사진 있음: 원형 썸네일 (지름 52px, 흰 테두리 2px, 그림자)
- 사진 없음: 카테고리 아이콘 + 배경색 원형
- 하단에 삼각형 꼬리 (말풍선 스타일)
- 선택 시: 테두리 파란색 (애니메이션 없음 — TripMap info card overlay z-index 충돌 방지)

#### `ClusterMarker.tsx`
- 대표 사진(첫 번째 체크인) 원형 썸네일
- 우하단 카운트 뱃지 (파란 원 + 흰 숫자)
- 크기: 64px (단일보다 크게)

> **TripMap 마커 교체 주의 (Phase 5)**: 기존 TripMap info card overlay는 `MAP_SIZE` 기반
> `position: 'absolute'`로 마커 위 표시됨. `CheckinMapMarker`에 `scale(1.2)` 확대 애니메이션을
> 넣으면 z-index가 충돌하므로, TripMap에서는 선택 상태를 테두리 색상 변경으로만 표현한다.

#### `useCheckinClusters.ts` 훅

`apps/mobile/src/hooks/useCheckinClusters.ts`

```typescript
// supercluster로 region이 바뀔 때마다 클러스터 재계산
const { clusters, supercluster } = useCheckinClusters(checkins, region);
// clusters: Array<Cluster | CheckinPoint> — 구분은 cluster.properties.cluster 플래그
```

- `supercluster`를 `useMemo`로 생성, 체크인 목록 변경 시에만 재생성
- region → bbox/zoom 변환 포함
- 클러스터 탭 시 `supercluster.getLeaves(clusterId)` 로 포함 체크인 추출

### Phase 2: CheckinMapBottomSheet 컴포넌트

`apps/mobile/src/components/map/CheckinMapBottomSheet.tsx`

- `@gorhom/bottom-sheet` v5 사용
- snap points: `[80, SCREEN_HEIGHT * 0.45, SCREEN_HEIGHT * 0.85]` (v5는 숫자 pt)
  - 80pt: 핸들 + 헤더만 노출 (지도 탐색 중)
  - 45%: 기본 (날짜 헤더 + 카드 1~2행)
  - 85%: 전체 그리드
- 헤더: 날짜(년월) + 여행 이름
- 콘텐츠: 체크인 카드 2열 그리드 (사진 썸네일, 제목, 시간)
- 마커/클러스터 선택 시 해당 체크인들로 필터링

### Phase 3: MapBrowseScreen (신규 화면)

`apps/mobile/src/screens/MapBrowseScreen.tsx`

**데이터**: `fetchAllCheckins()` — `apps/mobile/src/lib/api/checkins.ts` 48번째 줄에
이미 구현됨 (tripId 생략 시 전체 체크인 반환). 추가 구현 불필요, **활용**만 하면 됨.

> **페이지네이션 전략**: 현재 `fetchAllCheckins()`는 전체 로드 방식(페이지네이션 없음).
> 초기 구현은 전체 로드로 진행하되, 체크인이 200개 이상인 사용자에서 성능 문제 발생 시
> Supabase `.range()` 또는 현재 지도 viewport bounding box 기반 쿼리로 개선.
> 지도 탐색 특성상 viewport 쿼리가 UX에 더 적합하나, 초기 구현 복잡도를 낮추기 위해 1단계 연기.

**동작**:
- 앱 마운트 시 전체 체크인 로드
- `useCheckinClusters` 훅으로 region 변화마다 클러스터 재계산
- `CheckinMapMarker` / `ClusterMarker` 렌더링
- 마커 탭: 해당 체크인을 Bottom Sheet에 표시, 지도 이동
- 클러스터 탭: `supercluster.getLeaves()` → 체크인 목록을 Bottom Sheet에 표시
- 현재 위치 버튼: expo-location으로 이동

**초기 지도 범위**: 체크인 전체 bounds로 `fitToCoordinates`.
기존 `TripMap.tsx`의 `mapReadyRef.current` 패턴을 그대로 적용 (`onMapReady` 이후 호출).

### Phase 4: 하단 탭 "지도" 추가

`apps/mobile/src/navigation/AppNavigator.tsx`

- 탭 추가 후 202번째 줄 `TAB_COUNT = 5` → `TAB_COUNT = 6` 수정 (탭 바 여백 계산에 사용)
- 아이콘: `Ionicons` `map` / `map-outline`
- 라벨: "지도" (ko) / "Map" (en)

### Phase 5: TripMap 마커 업그레이드

`apps/mobile/src/screens/trip/TripMap.tsx`

- 기존 번호 마커(파란 원 + 숫자) → `CheckinMapMarker` 컴포넌트로 교체
- 선택 상태: 기존 info card overlay 유지. 마커는 테두리 색상 변경만 (scale 애니메이션 없음)
- 클러스터링 미적용 (여행 단위 소수 체크인 → 불필요)

---

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `apps/mobile/package.json` | `@gorhom/bottom-sheet`, `supercluster`, `@types/supercluster` 추가 |
| `apps/mobile/src/hooks/useCheckinClusters.ts` | 신규 (supercluster 래핑 훅) |
| `apps/mobile/src/components/map/CheckinMapMarker.tsx` | 신규 |
| `apps/mobile/src/components/map/ClusterMarker.tsx` | 신규 |
| `apps/mobile/src/components/map/CheckinMapBottomSheet.tsx` | 신규 |
| `apps/mobile/src/screens/MapBrowseScreen.tsx` | 신규 |
| `apps/mobile/src/navigation/AppNavigator.tsx` | 지도 탭 추가 + `TAB_COUNT = 6` 수정 |
| `apps/mobile/src/screens/trip/TripMap.tsx` | 마커 → CheckinMapMarker 교체 |
| `docs/ui/mobile.md` | MapBrowseScreen 문서 추가 |

---

## 비고

- `react-native-map-clustering`은 사용하지 않음. `supercluster` 직접 통합이 장기적으로 더 안정적.
- `fetchAllCheckins()`는 기존 구현 활용. RLS로 본인 체크인만 반환되어 별도 필터 불필요.
- 이미지 로딩 성능: CDN URL 사용 중이므로 썸네일 별도 최적화 불필요.
- 체크인이 없는 경우: 빈 지도 + Bottom Sheet에 "아직 체크인이 없습니다" 안내.
- `App.tsx` `GestureHandlerRootView` 래핑 이미 존재 — 추가 작업 불필요.
