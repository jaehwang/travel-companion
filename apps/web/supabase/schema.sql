-- Travel Companion Database Schema
-- 모든 마이그레이션(001~005)이 반영된 현재 상태

-- 1. trips 테이블: 여행 정보
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT false,
  place TEXT,
  place_id TEXT,
  latitude float8,
  longitude float8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. checkins 테이블: 체크인 (사진 + 메시지 + 위치)
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  message TEXT,
  title VARCHAR(255),
  place VARCHAR(255),
  place_id VARCHAR(255),
  category VARCHAR(100),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url TEXT,
  photo_metadata JSONB,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_checkins_trip_id ON checkins(trip_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checked_in_at ON checkins(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_checkins_latitude ON checkins(latitude);
CREATE INDEX IF NOT EXISTS idx_checkins_longitude ON checkins(longitude);
CREATE INDEX IF NOT EXISTS idx_checkins_category ON checkins(category);
CREATE INDEX IF NOT EXISTS idx_checkins_place ON checkins(place);

-- 4. 업데이트 시각 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkins_updated_at BEFORE UPDATE ON checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- trips RLS 정책
CREATE POLICY "trips_select" ON trips FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "trips_insert" ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trips_update" ON trips FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "trips_delete" ON trips FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- checkins RLS 정책: trips를 통해 소유권 확인
CREATE POLICY "checkins_select" ON checkins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = checkins.trip_id
      AND (trips.user_id = auth.uid() OR trips.user_id IS NULL)
  ));
CREATE POLICY "checkins_insert" ON checkins FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = checkins.trip_id
      AND (trips.user_id = auth.uid() OR trips.user_id IS NULL)
  ));
CREATE POLICY "checkins_update" ON checkins FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = checkins.trip_id
      AND (trips.user_id = auth.uid() OR trips.user_id IS NULL)
  ));
CREATE POLICY "checkins_delete" ON checkins FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = checkins.trip_id
      AND (trips.user_id = auth.uid() OR trips.user_id IS NULL)
  ));

-- 6. 스토리지 버킷 (Supabase Dashboard에서 수동 생성)
-- 버킷 이름: 'trip-photos' / Public access: true
