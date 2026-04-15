-- 검색 기능을 위한 pg_trgm 확장 및 인덱스 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 참고: ilike 검색은 인덱스 없이도 동작하므로 인덱스는 데이터 증가 후 추가해도 무방

-- pg_trgm 확장 활성화 (부분 문자열 검색 및 유사도 연산자 지원)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- trips: tsvector (단어 단위 검색) + trgm (부분 일치)
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

-- checkins: tsvector (단어 단위 검색) + trgm (부분 일치)
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

-- (선택) 자동완성 RPC 함수 — /api/search/autocomplete 구현 시 사용
-- CREATE OR REPLACE FUNCTION autocomplete_suggestions(query text, max_results int DEFAULT 10)
-- RETURNS TABLE(suggestion text, score float) AS $$
--   SELECT DISTINCT ON (suggestion) suggestion, score
--   FROM (
--     SELECT title AS suggestion, similarity(title, query) AS score
--     FROM trips WHERE title % query
--     UNION ALL
--     SELECT title AS suggestion, similarity(title, query) AS score
--     FROM checkins WHERE title % query
--     UNION ALL
--     SELECT place AS suggestion, similarity(place, query) AS score
--     FROM checkins WHERE place IS NOT NULL AND place % query
--   ) candidates
--   ORDER BY suggestion, score DESC
--   LIMIT max_results;
-- $$ LANGUAGE sql STABLE;
