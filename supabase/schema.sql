-- Travel Companion Database Schema

-- 1. trips 테이블: 여행 정보
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. checkins 테이블: 체크인 (사진 + 메시지 + 위치)
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  message TEXT,
  location_name VARCHAR(255),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url TEXT,
  photo_metadata JSONB,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_checkins_trip_id ON checkins(trip_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checked_in_at ON checkins(checked_in_at);
-- 위치 기반 검색을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_checkins_latitude ON checkins(latitude);
CREATE INDEX IF NOT EXISTS idx_checkins_longitude ON checkins(longitude);

-- 3. 업데이트 시각 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkins_updated_at BEFORE UPDATE ON checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security (RLS) 설정 - 나중에 인증 추가 시 활성화
-- ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- 5. 스토리지 버킷 생성 (Supabase Dashboard에서 수동 생성 필요)
-- 버킷 이름: 'trip-photos'
-- Public access: true (공유 기능을 위해)

-- 6. 테스트 데이터 삽입 (선택적)
INSERT INTO trips (title, description, start_date) VALUES
  ('서울 여행', '서울 시내 탐방', NOW())
ON CONFLICT DO NOTHING;
