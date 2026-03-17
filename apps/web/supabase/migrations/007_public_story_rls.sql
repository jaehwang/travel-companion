-- 공개 여행 스토리 조회를 위한 RLS 정책 추가
-- 비로그인 사용자도 is_public = true인 여행과 그 체크인을 읽을 수 있도록 허용

-- 공개 여행은 누구나 조회 가능
CREATE POLICY "trips_select_public"
  ON trips FOR SELECT
  USING (is_public = true);

-- 공개 여행의 체크인도 누구나 조회 가능
CREATE POLICY "checkins_select_public"
  ON checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = checkins.trip_id
        AND trips.is_public = true
    )
  );
