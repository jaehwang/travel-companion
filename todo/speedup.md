# 지도 마커 이미지 로딩 속도 향상

지도 화면(MapBrowseScreen)의 체크인/클러스터 마커 사진 표시 속도를 개선한다.

## 현황

- 마커가 화면에 처음 나타날 때 CDN에서 풀해상도 이미지를 다운로드
- React Native 기본 `Image`는 메모리 캐시만 사용 → 앱 재시작 시 재다운로드
- `Image.prefetch()`로 클러스터 계산 직후 선제적 다운로드는 구현됨

## 개선 방안

### A. `expo-image` 도입 — 디스크 캐시 ✅ 완료

**효과**: 앱 재시작 후 재접속 시 이미지 즉시 표시  
**변경 범위**: `CheckinMapMarker`, `ClusterMarker` 컴포넌트만

`expo-image`는 React Native 기본 `Image`의 드롭인 대체재로,
메모리 + 디스크 캐시를 지원해 앱을 종료 후 재시작해도 이미지를 다시 다운로드하지 않는다.

```bash
npx expo install expo-image
```

```tsx
// 변경 전
import { Image } from 'react-native';

// 변경 후
import { Image } from 'expo-image';
```

`Image.prefetch()` → `Image.prefetch()` (expo-image도 동일 API 제공)

---

### B. 업로드 시 썸네일 생성 — 최초 로딩 속도

**효과**: 마커용 소형 이미지 사용 → 다운로드 용량 대폭 감소 (풀해상도 대비 ~95%)  
**변경 범위**: 업로드 코드, DB 스키마, API 응답

마커 크기는 52px(단일) / 64px(클러스터)이므로 풀해상도 이미지는 낭비다.
업로드 시점에 `expo-image-manipulator`(이미 설치됨)로 200×200 썸네일을 함께 생성해
별도 파일로 저장한다.

#### DB 변경

```sql
ALTER TABLE checkins ADD COLUMN photo_thumbnail_url TEXT;
```

#### 업로드 코드 변경 (`apps/mobile/src/lib/api/storage.ts`)

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

export async function uploadPhoto(uri: string): Promise<{ photoUrl: string; thumbnailUrl: string }> {
  // 썸네일 생성 (200×200, JPEG 80%)
  const thumb = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 200, height: 200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  // 원본 + 썸네일 병렬 업로드
  const [photoUrl, thumbnailUrl] = await Promise.all([
    uploadFile(uri, `photos/${uuid()}.jpg`),
    uploadFile(thumb.uri, `thumbs/${uuid()}.jpg`),
  ]);

  return { photoUrl, thumbnailUrl };
}
```

#### 마커에서 썸네일 URL 사용

```tsx
// CheckinMapMarker, ClusterMarker
source={{ uri: checkin.photo_thumbnail_url ?? checkin.photo_url }}
```

`photo_thumbnail_url`이 없는 기존 체크인은 `photo_url`로 폴백한다.

---

## 우선순위

| 순서 | 방안 | 난이도 | 효과 |
|------|------|--------|------|
| 1 | A. expo-image | 낮음 | 재접속 시 즉시 표시 |
| 2 | B. 썸네일 생성 | 중간 | 최초 로딩 속도 대폭 개선 |

A → B 순서로 적용 권장.
