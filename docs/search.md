# 검색 기능

여행·체크인을 제목·장소·메모로 검색한다. 모바일은 Supabase JS SDK 직접 쿼리, 웹은 API Route 경유.

---

## 현재 구현 (모바일)

### 검색 화면 (`apps/mobile/src/screens/SearchScreen.tsx`)

- 하단 탭 맨 오른쪽 "검색" 탭에서 접근
- 탭 포커스 시 검색창 자동 포커스
- 2자 이상 입력 시 300ms 디바운스 후 검색
- 여행·체크인 결과를 교차 인터리빙 (trips[0], checkins[0], trips[1], checkins[1], …)
- 체크인 결과에 소속 여행명 표시
- 여행 선택 → 해당 여행 화면 이동
- 체크인 선택 → 해당 여행 화면 이동 + 선택된 체크인으로 자동 스크롤

### 검색 API (`apps/mobile/src/lib/api/search.ts`)

```typescript
searchTrips(query: string): Promise<Trip[]>
// trips.title, description ilike 검색, 최신순 10건

searchCheckins(query: string): Promise<Checkin[]>
// checkins.title, place, message ilike 검색, 최신순 20건
```

Supabase `.or()` + `ilike` 직접 쿼리. API Route 불필요.

### 스크롤 연동

- `AppNavigator`: `TripsStackParamList.Trip`에 `scrollToCheckinId?: string` 파라미터 추가
- `useTripDetail`: route params에서 `scrollToCheckinId` 추출
- `TripCheckinList`: `scrollToCheckinId` prop 수신 → `FlatList.scrollToIndex` (400ms 지연, `onScrollToIndexFailed` 오프셋 폴백)

---

## DB 인덱스 (`apps/web/supabase/migrations/add_search_indexes.sql`)

현재 `ilike`는 인덱스 없이도 동작한다. 데이터 증가 시 아래 마이그레이션을 Supabase Dashboard SQL Editor에서 실행한다.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- trips
ALTER TABLE trips ADD COLUMN fts tsvector GENERATED ALWAYS AS (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;
CREATE INDEX trips_fts_idx ON trips USING GIN(fts);
CREATE INDEX trips_title_trgm_idx ON trips USING GIN(title gin_trgm_ops);

-- checkins
ALTER TABLE checkins ADD COLUMN fts tsvector GENERATED ALWAYS AS (
  to_tsvector('simple',
    coalesce(title, '') || ' ' || coalesce(place, '') || ' ' || coalesce(message, ''))
) STORED;
CREATE INDEX checkins_fts_idx ON checkins USING GIN(fts);
CREATE INDEX checkins_title_trgm_idx ON checkins USING GIN(title gin_trgm_ops);
CREATE INDEX checkins_place_trgm_idx ON checkins USING GIN(place gin_trgm_ops);
```

