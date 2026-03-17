-- trips 테이블에 user_id 추가
ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS 활성화
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- trips RLS 정책
-- 기존 데이터(user_id IS NULL) 또는 본인 데이터 접근 허용 (마이그레이션 기간 동안)
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

-- ============================================================
-- 기존 데이터에 user_id 할당 (최초 로그인 후 아래 쿼리를 별도로 실행)
-- auth.users 테이블에서 본인의 user id를 확인 후 실행:
--
-- UPDATE trips SET user_id = '<your-user-id>' WHERE user_id IS NULL;
-- ============================================================
