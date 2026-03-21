-- trips 테이블에 자주 가는 곳 플래그 추가
-- 빠른 체크인 기능에서 is_frequent=true인 여행의 체크인만 표시
ALTER TABLE trips ADD COLUMN is_frequent BOOLEAN NOT NULL DEFAULT FALSE;
