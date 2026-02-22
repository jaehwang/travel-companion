# Supabase 설정 가이드

## 1. 테이블 스키마 생성

### Supabase Dashboard에서 실행

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택 (rpdwmxinsylddgzcthbf)
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New Query** 클릭
5. `schema.sql` 파일 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭

### 생성되는 테이블

#### `trips` - 여행 정보
- `id`: 여행 고유 ID (UUID)
- `title`: 여행 제목
- `description`: 여행 설명
- `start_date`: 시작일
- `end_date`: 종료일
- `is_public`: 공개 여부
- `created_at`, `updated_at`: 생성/수정 시각

#### `checkins` - 체크인 (사진 + 메시지 + 위치)
- `id`: 체크인 고유 ID (UUID)
- `trip_id`: 여행 ID (외래키)
- `message`: 메시지/메모
- `title`: 체크인 제목 (사용자 입력)
- `place`: 장소 이름 (장소 검색으로 선택한 경우에만 저장)
- `latitude`: 위도
- `longitude`: 경도
- `photo_url`: 사진 URL (Supabase Storage)
- `photo_metadata`: 사진 메타데이터 (EXIF 등)
- `checked_in_at`: 체크인 시각
- `created_at`, `updated_at`: 생성/수정 시각

## 2. 스토리지 버킷 생성

### trip-photos 버킷 생성

1. Supabase Dashboard에서 **Storage** 메뉴 클릭
2. **New bucket** 클릭
3. 버킷 이름: `trip-photos`
4. **Public bucket** 체크 (공유 기능을 위해)
5. **Create bucket** 클릭

### 버킷 정책 설정 (선택적)

```sql
-- 모든 사용자가 읽기 가능
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'trip-photos' );

-- 모든 사용자가 업로드 가능 (나중에 인증 추가 시 수정)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'trip-photos' );
```

## 3. 연결 테스트

```bash
# 환경 변수와 함께 테스트 실행
NEXT_PUBLIC_SUPABASE_URL=https://rpdwmxinsylddgzcthbf.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
npx tsx test-supabase.ts
```

## 4. 다음 단계

- [ ] 체크인 API 엔드포인트 생성
- [ ] 사진 업로드 기능 구현
- [ ] EXIF GPS 데이터 추출
- [ ] 지도에 체크인 마커 표시
- [ ] 여행 경로 시각화
