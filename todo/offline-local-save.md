# 오프라인 로컬 저장 기능 구현 계획

## 개요

모바일 앱에서 여행과 체크인을 서버 없이 폰에 저장하고, 나중에 서버에 동기화할 수 있도록 한다.

**확정된 요구사항:**
- 로그인은 필수 (비로그인 지원 없음)
- 로컬 전용 데이터만 SQLite로 관리 (서버 데이터는 기존 방식 유지)
- 동기화 UI는 여행 상세 화면

---

## 데이터 흐름

```
[기존] 여행 생성 → Supabase DB
       사진 촬영 → Supabase Storage → photo_url
       체크인 생성 → Supabase DB

[신규] 여행 생성 (로컬) → SQLite (local_trips)
       사진 (라이브러리) → asset.uri (ph://...) 그대로 SQLite에 저장
       사진 (카메라)     → MediaLibrary.createAssetAsync()로 카메라 롤 저장
                           → 반환된 asset.uri (ph://...) SQLite에 저장
       체크인 생성 (로컬) → SQLite (local_checkins)

[동기화] ph:// URI → expo-image-manipulator 압축 → 임시 file:// URI
         임시 file:// URI → Supabase Storage 업로드 → photo_url
         local_trips → Supabase trips 테이블 INSERT
         local_checkins → Supabase checkins 테이블 INSERT
         SQLite 레코드 삭제 (로컬 전용이므로 동기화 후 제거)
         → 서버 TripScreen으로 이동
```

**사진 전략:** 사진을 앱 내부로 복사하지 않고 iOS Photos 앱(카메라 롤)에 그대로 둔다.
- `ph://` URI는 PHAsset 영구 식별자로 앱 재시작 후에도 유효
- `expo-media-library`는 이미 설치되어 있어 추가 패키지 불필요
- 동기화 시점에 `expo-image-manipulator`로 재압축 후 업로드

---

## 필요 패키지 설치 (네이티브 빌드 필요)

```bash
cd apps/mobile
npx expo install expo-sqlite
npx expo run:ios
```

`expo-file-system`은 불필요 (사진을 앱 내부로 복사하지 않으므로).
`expo-media-library`는 이미 설치됨.

**expo-sqlite API**: SDK 55 (`expo-sqlite ~15.x`)는 `SQLiteProvider` + `useSQLiteContext` 훅 방식을 사용한다. `openDatabase` 구방식은 deprecated.

```tsx
// App.tsx 최상단에 provider 추가
import { SQLiteProvider } from 'expo-sqlite';
<SQLiteProvider databaseName="travel_local.db" onInit={migrateDb}>
  ...
</SQLiteProvider>

// DB 접근 시
const db = useSQLiteContext();
```

---

## 구현 파일 목록

### 신규 파일

#### DB 레이어
- `src/lib/db/types.ts` — LocalTrip, LocalCheckin 타입 정의
- `src/lib/db/index.ts` — SQLite DB 초기화 (스키마 생성)
- `src/lib/db/localTrips.ts` — local_trips CRUD
- `src/lib/db/localCheckins.ts` — local_checkins CRUD

#### 동기화
- `src/lib/sync/syncService.ts` — 로컬 → 서버 동기화 로직

#### 스토어
- `src/store/localTripsStore.ts` — Zustand (로컬 여행). 앱 시작 시 SQLite에서 hydrate
- `src/store/localCheckinsStore.ts` — Zustand (로컬 체크인). 여행 화면 진입 시 해당 trip의 checkin 로드

#### 화면
- `src/screens/local-trip/LocalTripScreen.tsx` — 로컬 여행 상세 화면 (동기화 버튼 포함)
- `src/screens/local-trip/hooks/useLocalTripDetail.ts` — 로컬 여행 상세 훅

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `AppNavigator.tsx` | TripsStack에 `LocalTrip` 라우트 추가, CheckinForm params에 `localTripId` 추가, `_tripCheckinContext` 타입에 `localTripId?: string` 추가 |
| `HomeScreen.tsx` | 로컬 여행 섹션 추가 (서버 여행 목록 위에 표시, "로컬" 뱃지) |
| `TripFormModal.tsx` | "로컬에만 저장" 토글 추가, onSubmit에 saveLocally 플래그 전달 |
| `PhotoPickerButton.tsx` | `uploadMode: 'server' \| 'local'` prop 추가. local 모드: 업로드 없이 ph:// URI 반환. 카메라 촬영 시 MediaLibrary.createAssetAsync()로 카메라 롤 저장 후 asset.uri 반환 |
| `useCheckinForm.ts` | localTripId 감지, 로컬 모드일 때 로컬 체크인 저장 |
| `CheckinFormScreen.tsx` | 로컬 여행 모드일 때 Trip 선택 드롭다운에서 로컬 여행만 표시 (서버 여행 혼용 방지) |

---

## DB 스키마

```sql
-- local_trips
CREATE TABLE IF NOT EXISTS local_trips (
  local_id    TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  start_date  TEXT,
  end_date    TEXT,
  is_public   INTEGER NOT NULL DEFAULT 0,
  is_frequent INTEGER NOT NULL DEFAULT 0,
  place       TEXT,
  place_id    TEXT,
  latitude    REAL,
  longitude   REAL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- local_checkins
CREATE TABLE IF NOT EXISTS local_checkins (
  local_id        TEXT PRIMARY KEY,
  local_trip_id   TEXT NOT NULL REFERENCES local_trips(local_id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  message         TEXT,
  category        TEXT,
  tags            TEXT NOT NULL DEFAULT '[]',   -- JSON 배열
  latitude        REAL NOT NULL,
  longitude       REAL NOT NULL,
  place           TEXT,
  place_id        TEXT,
  photo_local_uri TEXT,   -- ph:// URI (iOS Photos 앱 PHAsset 영구 식별자)
  photo_width     INTEGER,
  photo_height    INTEGER,
  checked_in_at   TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  synced          INTEGER NOT NULL DEFAULT 0  -- 동기화 완료 여부 (0: 미완, 1: 완료)
);
```

---

## 타입 정의

```typescript
// src/lib/db/types.ts

export interface LocalTrip {
  local_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_public: boolean;
  is_frequent?: boolean;
  place?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface LocalCheckin {
  local_id: string;
  local_trip_id: string;
  title: string;
  message?: string;
  category?: string;
  tags: string[];
  latitude: number;
  longitude: number;
  place?: string;
  place_id?: string;
  photo_local_uri?: string;  // ph:// URI (iOS Photos 앱 영구 식별자)
  photo_width?: number;
  photo_height?: number;
  checked_in_at: string;
  created_at: string;
  updated_at: string;
  synced: boolean;           // 동기화 완료 여부
}
```

---

## 동기화 서비스 흐름

```typescript
// src/lib/sync/syncService.ts

async function syncLocalTrip(localTripId: string): Promise<Trip> {
  // 1. SQLite에서 로컬 여행 + 체크인 로드
  const localTrip = await getLocalTrip(localTripId);
  const localCheckins = await getLocalCheckins(localTripId);

  // 2. 서버에 여행 생성 (Supabase)
  const serverTrip = await apiCreateTrip({ ... });

  // 3. 각 체크인 순차 처리 (부분 실패 대비: 성공한 것만 synced=1 표시)
  for (const checkin of localCheckins) {
    if (checkin.synced) continue; // 이미 완료된 건 건너뜀 (재시도 시)
    try {
      let photoUrl: string | undefined;
      if (checkin.photo_local_uri) {
        // ph:// URI → 압축 → 임시 file:// → Supabase Storage 업로드
        const manipulated = await manipulateAsync(checkin.photo_local_uri, [], { compress: 0.7, format: SaveFormat.JPEG });
        photoUrl = await uploadPhoto(manipulated.uri, `photo_${Date.now()}.jpg`);
        // Photos 앱의 원본은 삭제하지 않음 (사용자 소유)
      }
      // 4. 서버에 체크인 생성 (photo_width, photo_height 포함)
      await apiCreateCheckin({
        trip_id: serverTrip.id, ...checkin,
        photo_url: photoUrl,
        photo_metadata: checkin.photo_width ? { width: checkin.photo_width, height: checkin.photo_height } : undefined,
      });
      await markCheckinSynced(checkin.local_id); // SQLite synced=1
    } catch (e) {
      // 실패한 체크인은 synced=0 유지 → 재시도 가능
      throw new Error(`체크인 동기화 실패: ${checkin.title}`);
    }
  }

  // 5. 모든 체크인이 synced=1이면 trip 삭제 (CASCADE로 checkins도 삭제)
  await deleteLocalTrip(localTripId);

  return serverTrip;
}
```

---

## 네비게이션 변경

```typescript
// TripsStackParamList 추가
LocalTrip: { localTripId: string };

// CheckinForm 파라미터 추가
CheckinForm: {
  // 기존...
  localTripId?: string;      // 설정되면 로컬 저장 모드
  localTripTitle?: string;
  localCheckin?: LocalCheckin; // 수정 모드
};
```

---

## UI 변경

### HomeScreen
- 서버 여행 목록 위에 로컬 여행 섹션 표시
- 로컬 여행 카드에 "로컬" 오렌지 뱃지
- 로컬 여행 탭 시 LocalTripScreen으로 이동

### TripFormModal
- 하단에 "로컬에만 저장" Switch 추가
- 체크 시 onSubmit(data, { saveLocally: true }) 호출

### LocalTripScreen
- TripHeader와 유사한 헤더 + "서버에 올리기" 버튼
- 로컬 체크인 목록 (CheckinCard 재사용 or 간단한 커스텀 카드)
- 체크인 수정/삭제 지원 (서버 TripScreen과 동일 수준)
- 지도 마커 표시
- 동기화 중 ActivityIndicator

---

## 구현 순서

1. [ ] `expo-sqlite` 설치 + iOS 빌드
2. [ ] `src/lib/db/types.ts` — 타입 정의
3. [ ] `src/lib/db/index.ts` — DB 초기화
4. [ ] `src/lib/db/localTrips.ts` — CRUD
5. [ ] `src/lib/db/localCheckins.ts` — CRUD
6. [ ] `src/store/localTripsStore.ts` — Zustand 스토어
7. [ ] `src/store/localCheckinsStore.ts` — Zustand 스토어
8. [ ] `src/lib/sync/syncService.ts` — 동기화 서비스
9. [ ] `AppNavigator.tsx` 수정 — 라우트/파라미터 추가
10. [ ] `TripFormModal.tsx` 수정 — 로컬 저장 토글
11. [ ] `PhotoPickerButton.tsx` 수정 — 로컬 저장 모드 (ph:// URI 반환)
12. [ ] `useCheckinForm.ts` 수정 — 로컬 모드 분기
13. [ ] `src/screens/local-trip/LocalTripScreen.tsx` 구현
14. [ ] `src/screens/local-trip/hooks/useLocalTripDetail.ts` 구현
15. [ ] `HomeScreen.tsx` 수정 — 로컬 여행 섹션
16. [ ] 테스트 및 검증

---

## 주의사항

- `ph://` URI는 PHAsset 영구 식별자로 앱 재시작 후에도 유효하나, 사용자가 Photos 앱에서 직접 삭제하면 무효화됨. 동기화 시 오류 처리 필요
- 카메라 촬영 사진: `MediaLibrary.createAssetAsync()`로 카메라 롤에 저장 후 `asset.uri` 사용. 저장 전 `MediaLibrary.requestPermissionsAsync()` 필요
- 라이브러리 사진: `expo-image-picker`의 `asset.uri`가 이미 `ph://` 형태이므로 그대로 저장
- 동기화 시 `ph://` → `manipulateAsync()` → 임시 `file://` 생성 → 업로드. 업로드 후 임시 파일은 OS 캐시 정리에 맡김
- Photos 앱의 원본은 동기화 후에도 삭제하지 않음 (사용자 소유)
- 동기화 성공 후 SQLite 레코드만 삭제
- 동기화 실패 시 SQLite 데이터 유지, 에러 메시지 표시
- `_tripCheckinContext` 구조에 `localTripId?: string` 추가. `tripId`(서버)와 `localTripId`(로컬) 중 하나만 설정됨. CheckinForm은 어느 쪽이 설정됐는지 보고 저장 방식 결정
- `tags`는 SQLite에 `TEXT`(JSON 문자열)로 저장, CRUD 레이어에서 `JSON.stringify` / `JSON.parse` 처리
