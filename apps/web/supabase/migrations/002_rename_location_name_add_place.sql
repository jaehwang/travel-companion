-- Rename location_name to title
ALTER TABLE checkins RENAME COLUMN location_name TO title;

-- Add place column (장소 검색으로 선택한 경우에만 저장)
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS place VARCHAR(255);

-- Create index for place
CREATE INDEX IF NOT EXISTS idx_checkins_place ON checkins(place);

-- Add comment
COMMENT ON COLUMN checkins.title IS '체크인 제목 (사용자 입력)';
COMMENT ON COLUMN checkins.place IS '장소 이름 (장소 검색으로 선택한 경우에만 저장)';
