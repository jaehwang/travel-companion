# 아이디어 목록

## 체크인 날씨 저장
- 체크인 시 현재 위치의 날씨 정보를 자동으로 함께 저장
- 기온, 날씨 상태(맑음/흐림/비 등), 습도
- 무료 날씨 API 활용 (Open-Meteo 등)
- checkins 테이블에 weather 컬럼(JSONB) 추가

## 체크아웃
- 체크인한 장소에서 나올 때 체크아웃 기록
- 체류 시간 자동 계산
- checkins 테이블에 checked_out_at 컬럼 추가

## 여행 스토리 공개 페이지
- 하나의 여행을 아름다운 스토리 페이지로 자동 생성
- 지도 + 체크인 타임라인 + 사진 갤러리 통합
- 공개 URL로 공유 가능 (is_public = true인 여행)
- SEO 최적화 (Server-side rendering)
- 이미지 보안 및 만료 문제 → [todos/public_trip_security.md](todos/public_trip_security.md) 참고

## 여러 여행 묶기
- 방법 A: 라벨(Label) 태그를 여행에 부여해 묶어서 조회
- 방법 B: 상위 여행을 새로 만들고 기존 여행들의 체크인 이력을 공유
- 예: "유럽 여행 2026" 아래에 "파리", "암스테르담", "베를린" 묶기

## 빠른 체크인 (Quick Check-in)

자주 가는 곳(주차장 층수 등)을 빠르게 기록하는 기능.

### 개념
- 기존 Trip + Checkin 데이터 모델 재사용 (새 테이블 불필요)
- `trips.is_frequent = true`인 여행만 빠른 체크인 대상
- 예: "주차" 여행을 만들고 지하 1·2·3층을 체크인으로 미리 등록
- 빠른 체크인 = 기존 체크인의 `checked_in_at`을 현재 시각으로 업데이트
- 가장 최근에 업데이트된 체크인 = 현재 위치(주차 위치)

### 흐름
1. 홈 화면의 "빠른 체크인" 버튼 탭
2. 현재 위치 확인
3. `is_frequent = true` 여행의 체크인 중 반경 1km 이내 항목 수집
4. 정렬: 마지막으로 업데이트된 체크인 맨 위 → 나머지 거리순
5. 항목 탭 → `checked_in_at = NOW()` 업데이트 → 완료
6. 홈 화면에 현재 위치 표시 (예: 🅿️ 지하 2층 · 2시간 전)

### 필요한 변경
- **DB**: `trips` 테이블에 `is_frequent BOOLEAN DEFAULT FALSE` 컬럼 추가
- **API**: `GET /api/checkins/nearby?lat=&lng=&radius=1000` 신규 (is_frequent 여행만 조회)
- **API**: `POST/PATCH /api/trips` — `is_frequent` 필드 추가
- **웹/모바일**: 여행 생성·수정 폼에 "자주 가는 곳" 토글 추가
- **모바일**: 홈 화면에 빠른 체크인 버튼 + 현재 상태 위젯 추가
- **모바일**: 빠른 체크인 바텀 시트 신규

## E2E 테스트 보강 (Playwright / iPhone 14 WebKit)
- 로그인 플로우 (Google OAuth mock 또는 test 계정)
- 여행 생성 → 체크인 생성 전체 플로우
- 사진 업로드 → GPS 추출 → 위치 자동 설정
- LocationPicker 지도 클릭 → 위치 선택
- 체크인 수정 / 삭제
- 지도 마커 클릭 → InfoWindow 표시
- 캘린더 페이지 렌더링 및 조언 표시
- 다크 모드 전환
