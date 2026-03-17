-- trips 테이블에 대표 장소 필드 추가
ALTER TABLE trips
ADD COLUMN place text,
ADD COLUMN place_id text,
ADD COLUMN latitude float8,
ADD COLUMN longitude float8;
