# 이미지 캐싱 전략

모바일 앱 전체에서 `expo-image`를 사용해 이미지를 디스크 캐시한다.

## 사용 라이브러리

**`expo-image`** — React Native 기본 `Image`의 대체재. 메모리 + 디스크 캐시를 지원하여 앱 재시작 후에도 이미지를 재다운로드하지 않는다.

```bash
npx expo install expo-image
```

## 적용 범위

앱 내 모든 CDN 이미지를 표시하는 컴포넌트에 적용. `resizeMode` → `contentFit`으로 prop명이 다름에 주의.

| 파일 | 용도 |
|------|------|
| `src/components/map/CheckinMapMarker.tsx` | 지도 마커 체크인 사진 (52px) |
| `src/components/map/ClusterMarker.tsx` | 지도 클러스터 대표 사진 (64px) |
| `src/components/map/CheckinMapBottomSheet.tsx` | 지도 바텀시트 체크인 사진 |
| `src/components/CheckinCard.tsx` | 체크인 카드 사진 |
| `src/components/TripCard.tsx` | 여행 커버 사진 |
| `src/screens/CheckinsScreen.tsx` | 체크인 목록 카드 사진 |
| `src/screens/CheckinDetailScreen.tsx` | 체크인 상세 사진 |
| `src/screens/HomeScreen.tsx` | 홈 화면 아바타 |
| `src/screens/SettingsScreen.tsx` | 설정 화면 프로필 아바타 |
| `src/screens/trip/TripHeader.tsx` | 여행 헤더 아바타 |
| `src/screens/trip/TripMap.tsx` | 선택된 체크인 사진 (InfoWindow) |
| `src/screens/checkin-form/sections/FormHeader.tsx` | 체크인 작성 폼 헤더 아바타 |

```tsx
import { Image } from 'expo-image';

<Image source={{ uri: photoUrl }} style={styles.photo} onLoad={onImageLoad} />
```

## Prefetch

클러스터가 바뀔 때마다 현재 뷰포트에 표시될 마커 이미지를 선제적으로 다운로드한다. 네트워크 오류는 무시.

```tsx
// MapBrowseScreen.tsx
useEffect(() => {
  clusters.forEach((cluster) => {
    const photoUrl = /* 클러스터 대표 사진 URL */;
    if (photoUrl) Image.prefetch(photoUrl).catch(() => {});
  });
}, [clusters, supercluster]);
```

## 주기적 캐시 정리

디스크 캐시가 무한히 쌓이는 것을 방지하기 위해 7일마다 자동 정리한다. 마지막 정리 시각은 `expo-secure-store`에 저장.

```tsx
// MapBrowseScreen.tsx
const CACHE_CLEAR_KEY = 'mapImageCacheLastCleared';
const CACHE_CLEAR_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

async function clearImageCacheIfNeeded() {
  const last = await SecureStore.getItemAsync(CACHE_CLEAR_KEY);
  if (!last || Date.now() - Number(last) > CACHE_CLEAR_INTERVAL_MS) {
    await Image.clearDiskCache();
    await SecureStore.setItemAsync(CACHE_CLEAR_KEY, String(Date.now()));
  }
}

useEffect(() => { clearImageCacheIfNeeded(); }, []);
```

## tracksViewChanges 최적화

React Native Maps의 `Marker`는 `tracksViewChanges={true}`일 때 매 프레임 재렌더링한다. 이미지가 로드된 마커는 `false`로 전환하여 렌더링 비용을 낮춘다.

```tsx
<Marker tracksViewChanges={!loadedMarkerKeys.has(markerKey)}>
  <CheckinMapMarker onImageLoad={() => handleMarkerImageLoad(markerKey)} />
</Marker>
```

## 빌드 관련 주의사항

Xcode 26 beta (iOS 26 SDK) 환경에서 Debug 시뮬레이터 빌드 시 SwiftUICore 링크 에러가 발생할 수 있다.
**워크어라운드**: Release 빌드를 먼저 실행한 뒤 Debug 빌드. 또는 Clean Build Folder(⇧⌘K) 후 다시 시도.

## 향후 개선 — 썸네일 생성

마커 크기(52–64px)에 비해 원본 이미지(수 MB)는 낭비다. 업로드 시 200×200 썸네일을 함께 생성하면 초기 로딩 속도를 대폭 개선할 수 있다. 상세 계획: `todo/speedup.md`.
