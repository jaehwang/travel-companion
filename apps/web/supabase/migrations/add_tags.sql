-- 체크인 태그 시스템 추가
-- 실행 위치: Supabase Dashboard > SQL Editor

-- 1. tags 컬럼 추가
ALTER TABLE checkins ADD COLUMN tags text[] DEFAULT '{}';

-- 2. GIN 인덱스 (contains 연산 최적화)
CREATE INDEX checkins_tags_idx ON checkins USING GIN(tags);

-- 3. category nullable로 변경 (아이콘·색상 전용으로 유지, 필수값 해제)
ALTER TABLE checkins ALTER COLUMN category DROP NOT NULL;
