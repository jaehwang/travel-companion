# 검색 기능 설계

## 결론: 서버(Supabase/PostgreSQL) 인덱스

여행·체크인 검색 인덱스는 모바일 로컬이 아닌 Supabase DB에 둔다.

### 근거

- 데이터가 이미 PostgreSQL에 있으므로 별도 동기화 불필요
- PostgreSQL 네이티브 전문 검색(`tsvector`)과 부분 일치·자동완성(`pg_trgm`)을 조합
- 웹·모바일 양쪽이 동일 인덱스를 공유
- 모바일은 Supabase JS SDK로 직접 쿼리 가능 → API Route 추가 불필요

### 모바일 로컬 인덱스를 쓰지 않는 이유

- 전체 데이터를 디바이스에 내려받아 인덱싱 → 데이터 증가 시 메모리·스토리지 부담
- 앱 시작 시 서버 동기화 비용 발생
- 오프라인 검색 요구사항이 없으므로 복잡도 대비 이득 없음

---

## 구현 계획

### 1. DB 마이그레이션 (Supabase Dashboard SQL Editor)

```sql
-- pg_trgm 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- trips: tsvector (단어 단위) + trgm (부분 일치 및 자동완성)
ALTER TABLE trips
  ADD COLUMN fts tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple',
        coalesce(title, '') || ' ' || coalesce(description, '')
      )
    ) STORED;

CREATE INDEX trips_fts_idx ON trips USING GIN(fts);
CREATE INDEX trips_title_trgm_idx ON trips USING GIN(title gin_trgm_ops);
CREATE INDEX trips_description_trgm_idx ON trips USING GIN(description gin_trgm_ops);

-- checkins: tsvector (단어 단위) + trgm (부분 일치 및 자동완성)
ALTER TABLE checkins
  ADD COLUMN fts tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple',
        coalesce(title, '') || ' ' || coalesce(place, '') || ' ' || coalesce(message, '')
      )
    ) STORED;

CREATE INDEX checkins_fts_idx ON checkins USING GIN(fts);
CREATE INDEX checkins_title_trgm_idx ON checkins USING GIN(title gin_trgm_ops);
CREATE INDEX checkins_place_trgm_idx ON checkins USING GIN(place gin_trgm_ops);
CREATE INDEX checkins_message_trgm_idx ON checkins USING GIN(message gin_trgm_ops);
```

> `tsvector`는 공백 기준 토크나이징(단어 단위 매칭), `pg_trgm`은 3글자 단위 부분 일치로 한국어 부분 문자열 검색·자동완성을 지원한다.

---

### 2. 검색 전략

| 방식 | 적합한 경우 | 쿼리 방법 |
|------|------------|----------|
| `tsvector` | 단어 단위 정확 매칭 | `.textSearch('fts', query)` |
| `pg_trgm` ILIKE | 부분 문자열 검색 | `.ilike('col', '%query%')` |
| `pg_trgm` similarity | 자동완성 후보 제안 | `similarity(col, query) > threshold` |

---

### 3. 모바일 쿼리 (Supabase JS SDK 직접 호출)

```typescript
// src/lib/api.ts

// 본문 검색 (제목·장소·메모 부분 일치)
export async function searchCheckins(tripId: string, query: string) {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('trip_id', tripId)
    .or(`title.ilike.%${query}%,place.ilike.%${query}%,message.ilike.%${query}%`);
  if (error) throw error;
  return data;
}

export async function searchTrips(query: string) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  if (error) throw error;
  return data;
}
```

---

### 4. 자동완성 API (Next.js API Route)

자동완성은 `pg_trgm`의 `similarity()` 함수를 활용한다.
Supabase JS SDK로는 직접 표현하기 어려우므로 서버 API Route를 경유한다.

```typescript
// apps/web/app/api/search/autocomplete/route.ts
export async function GET(request: Request) {
  const { user, supabase } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  // trip 제목 + checkin 제목·장소에서 유사 문자열 추출
  const { data, error } = await supabase.rpc('autocomplete_suggestions', {
    query: q,
    max_results: 10,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ suggestions: data });
}
```

#### Supabase RPC 함수 (SQL)

```sql
CREATE OR REPLACE FUNCTION autocomplete_suggestions(query text, max_results int DEFAULT 10)
RETURNS TABLE(suggestion text, score float) AS $$
  SELECT DISTINCT ON (suggestion) suggestion, score
  FROM (
    SELECT title AS suggestion, similarity(title, query) AS score
    FROM trips
    WHERE title % query  -- pg_trgm 유사도 연산자 (기본 threshold 0.3)
    UNION ALL
    SELECT title AS suggestion, similarity(title, query) AS score
    FROM checkins
    WHERE title % query
    UNION ALL
    SELECT place AS suggestion, similarity(place, query) AS score
    FROM checkins
    WHERE place IS NOT NULL AND place % query
  ) candidates
  ORDER BY suggestion, score DESC
  LIMIT max_results;
$$ LANGUAGE sql STABLE;
```

> `%` 연산자 threshold 기본값은 0.3. `SET pg_trgm.similarity_threshold = 0.2`로 낮추면 더 많은 후보가 나온다.

---

### 5. 웹 본문 검색 API

```typescript
// apps/web/app/api/search/route.ts
export async function GET(request: Request) {
  const { user, supabase } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';

  const [trips, checkins] = await Promise.all([
    supabase
      .from('trips')
      .select('*')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`),
    supabase
      .from('checkins')
      .select('*')
      .or(`title.ilike.%${q}%,place.ilike.%${q}%,message.ilike.%${q}%`),
  ]);

  return NextResponse.json({ trips: trips.data, checkins: checkins.data });
}
```

---

## API 엔드포인트 요약

| 엔드포인트 | 설명 | 사용처 |
|-----------|------|-------|
| `GET /api/search?q=` | 여행·체크인 본문 검색 | 웹 (API Route 경유) |
| `GET /api/search/autocomplete?q=` | 자동완성 후보 제안 | 웹·모바일 공통 |
| Supabase SDK `.or(ilike)` | 본문 검색 직접 쿼리 | 모바일 |

---

## 향후 고려사항

- 검색 범위 확대: 카테고리 필터, 날짜 범위 결합
- 자동완성 debounce: 입력 300ms 후 요청 (클라이언트 측)
- 전문 검색 엔진(Elasticsearch 등): 데이터가 수만 건 이상으로 커질 경우 검토
