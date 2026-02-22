# Travel Companion - 앞으로 할 일

## 1. 인증 기능 추가

> 상세 계획: [docs/auth.md](./docs/auth.md)

- [ ] Google Cloud Console OAuth 클라이언트 발급
- [ ] Supabase Dashboard Google provider 활성화
- [ ] DB 마이그레이션: trips.user_id 추가, RLS 활성화
- [ ] `@supabase/ssr` 설치 및 Supabase 클라이언트 분리
- [ ] `middleware.ts` 작성 (세션 갱신 + 인증 보호)
- [ ] 로그인 페이지 + OAuth 콜백 라우트
- [ ] API 라우트 인증 체크 추가
- [ ] 헤더 UI: 사용자 아바타 + 로그아웃 버튼

---

## 2. 아이디어 목록

### 체크인 날씨 저장
- 체크인 시 현재 위치의 날씨 정보를 자동으로 함께 저장
- 기온, 날씨 상태(맑음/흐림/비 등), 습도
- 무료 날씨 API 활용 (Open-Meteo 등)
- checkins 테이블에 weather 컬럼(JSONB) 추가

### 체크아웃
- 체크인한 장소에서 나올 때 체크아웃 기록
- 체류 시간 자동 계산
- checkins 테이블에 checked_out_at 컬럼 추가

### 여행 스토리 공개 페이지
- 하나의 여행을 아름다운 스토리 페이지로 자동 생성
- 지도 + 체크인 타임라인 + 사진 갤러리 통합
- 공개 URL로 공유 가능 (is_public = true인 여행)
- SEO 최적화 (Server-side rendering)

### 여러 여행 묶기
- 방법 A: 라벨(Label) 태그를 여행에 부여해 묶어서 조회
- 방법 B: 상위 여행을 새로 만들고 기존 여행들의 체크인 이력을 공유
- 예: "유럽 여행 2026" 아래에 "파리", "암스테르담", "베를린" 묶기
