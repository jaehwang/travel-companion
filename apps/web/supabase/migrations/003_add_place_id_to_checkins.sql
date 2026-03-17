-- Add place_id column (Google Places place_id, 장소 검색으로 선택한 경우에만 저장)
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS place_id VARCHAR(255);

COMMENT ON COLUMN checkins.place_id IS 'Google Places place_id (장소 검색으로 선택한 경우에만 저장)';
