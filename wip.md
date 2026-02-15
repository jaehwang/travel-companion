# Travel Companion 개발 진행 상황

## 📅 작업 일자: 2026-02-14

---

## ✅ 완료된 작업

### 1. 프로젝트 초기 설정
- [x] Next.js 15 프로젝트 생성 (App Router)
- [x] TypeScript strict mode 설정
- [x] Tailwind CSS 4 통합
- [x] ESLint + Prettier 설정
- [x] Git 초기화

### 2. 필수 패키지 설치
- [x] `exifr` - EXIF/GPS 데이터 추출
- [x] `mapbox-gl` - 지도 시각화
- [x] `@supabase/supabase-js` - 백엔드 클라이언트
- [x] `@tailwindcss/postcss` - Tailwind CSS 4 PostCSS 플러그인

### 3. 기본 프로젝트 구조
```
travel-companion/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # 루트 레이아웃 ✅
│   ├── page.tsx        # 홈 페이지 ✅
│   └── globals.css     # Tailwind CSS ✅
├── components/         # React 컴포넌트 (빈 폴더)
├── lib/                # 유틸리티
│   ├── supabase.ts    # Supabase 클라이언트 ✅
│   └── exif.ts        # GPS 추출 함수 ✅
├── types/              # TypeScript 타입 정의
│   └── index.ts       # Photo, Trip, MapMarker 타입 ✅
└── public/            # 정적 파일 (빈 폴더)
```

### 4. 유틸리티 함수 작성
- [x] Supabase 클라이언트 초기화 (`lib/supabase.ts`)
- [x] EXIF GPS 추출 함수 (`lib/exif.ts`)
  - `extractGPSFromPhoto()` - 단일 사진 GPS 추출
  - `extractGPSFromPhotos()` - 여러 사진 일괄 처리
- [x] TypeScript 타입 정의 (`types/index.ts`)
  - Photo, Trip, MapMarker 인터페이스

### 5. 개발 환경 설정
- [x] 개발 서버 실행 확인 (http://localhost:3000)
- [x] Tailwind CSS 4 PostCSS 플러그인 설정 수정
- [x] 환경 변수 템플릿 작성 (`.env.local.example`)

### 6. Git 커밋
- [x] Initial commit (프로젝트 설정)
- [x] Tailwind CSS 4 PostCSS 플러그인 설정 수정

---

## 🚧 진행 중인 작업

현재 없음

---

## 📋 다음 단계 (우선순위 순)

### Phase 1: 환경 설정 및 프로토타입
1. **환경 변수 설정**
   - [ ] Supabase 프로젝트 생성
   - [ ] Supabase URL 및 Anon Key 발급
   - [ ] Mapbox 계정 생성 및 Access Token 발급
   - [ ] `.env.local` 파일 생성 및 설정

2. **Supabase 데이터베이스 스키마 설계**
   - [ ] `trips` 테이블 생성
   - [ ] `photos` 테이블 생성
   - [ ] RLS (Row Level Security) 정책 설정
   - [ ] Storage 버킷 생성 (이미지 저장용)

### Phase 2: 사진 업로드 및 GPS 추출 프로토타입
3. **사진 업로드 컴포넌트**
   - [ ] `PhotoUploader` 컴포넌트 생성
   - [ ] Drag & Drop 파일 업로드
   - [ ] 다중 파일 선택 지원
   - [ ] 파일 미리보기 표시

4. **GPS 정보 추출 기능**
   - [ ] 업로드된 사진에서 EXIF GPS 추출
   - [ ] GPS 정보가 없는 사진 처리 로직
   - [ ] 추출된 GPS 데이터 표시 (위도, 경도, 시간)
   - [ ] 에러 핸들링 (GPS 정보 없음, 파일 형식 오류 등)

5. **Supabase Storage 연동**
   - [ ] 이미지 업로드 함수 작성
   - [ ] 썸네일 생성 (선택사항)
   - [ ] 업로드 진행률 표시
   - [ ] 이미지 메타데이터 저장

### Phase 3: 지도 기본 기능
6. **Mapbox 지도 컴포넌트**
   - [ ] `MapView` 컴포넌트 생성
   - [ ] Mapbox GL JS 초기화
   - [ ] 기본 지도 스타일 설정
   - [ ] 줌/팬 컨트롤

7. **지도에 마커 표시**
   - [ ] GPS 좌표를 지도 마커로 변환
   - [ ] 사진 썸네일을 마커로 표시
   - [ ] 마커 클릭 시 사진 상세 정보 팝업
   - [ ] 여러 마커 동시 표시

### Phase 4: 여행 경로 시각화
8. **경로 연결 및 시각화**
   - [ ] 시간순으로 마커 정렬
   - [ ] 마커 간 경로선(polyline) 그리기
   - [ ] 경로선 스타일링 (색상, 두께 등)
   - [ ] 애니메이션 효과 (선택사항)

9. **여행 타임라인**
   - [ ] 시간순 사진 목록 컴포넌트
   - [ ] 날짜별 그룹핑
   - [ ] 타임라인과 지도 연동
   - [ ] 타임라인 항목 클릭 시 지도 이동

### Phase 5: UI/UX 개선
10. **레이아웃 및 디자인**
    - [ ] 반응형 레이아웃 (모바일/데스크톱)
    - [ ] 네비게이션 바
    - [ ] 사이드바 (여행 목록, 사진 목록)
    - [ ] 로딩 상태 표시
    - [ ] 에러 메시지 디자인

11. **갤러리 뷰**
    - [ ] 그리드 갤러리 레이아웃
    - [ ] 사진 상세보기 모달
    - [ ] 이미지 라이트박스
    - [ ] 스와이프 제스처 (모바일)

### Phase 6: 여행 관리 기능
12. **여행(Trip) 생성 및 관리**
    - [ ] 새 여행 생성 폼
    - [ ] 여행 제목/설명 입력
    - [ ] 사진을 여행에 추가
    - [ ] 여행 수정/삭제
    - [ ] 여행 목록 페이지

### Phase 7: 공유 기능
13. **여행 공유**
    - [ ] 공개/비공개 설정
    - [ ] 공유 링크 생성
    - [ ] SNS 공유 버튼 (카카오톡, 페이스북 등)
    - [ ] 임베드 코드 생성 (선택사항)

### Phase 8: 인증 및 사용자 관리 (선택사항)
14. **Supabase Auth 연동**
    - [ ] 이메일 로그인
    - [ ] 소셜 로그인 (Google, GitHub 등)
    - [ ] 사용자 프로필
    - [ ] 내 여행 목록

### Phase 9: 고급 기능 (선택사항)
15. **추가 기능**
    - [ ] 사진에 메모/태그 추가
    - [ ] 위치 검색 및 수동 위치 지정
    - [ ] 여행 통계 (총 거리, 방문 장소 수 등)
    - [ ] 좋아요/댓글 기능
    - [ ] PWA 설정 (오프라인 모드)

---

## 🐛 알려진 이슈

없음

---

## 💡 메모 및 아이디어

### 기술적 고려사항
- GPS 정보가 없는 사진 처리: 수동으로 위치 지정할 수 있는 UI 필요
- 대용량 이미지 최적화: Next.js Image 컴포넌트 활용, 썸네일 자동 생성
- 개인정보 보호: GPS 정보 노출 제어 옵션 필요

### UI/UX 아이디어
- 지도와 갤러리를 분할 화면으로 동시에 표시
- 타임라인 슬라이더로 시간 이동
- 여행 경로를 스토리 형식으로 표현
- 다크 모드 지원

### 성능 최적화
- 마커가 많을 때 클러스터링
- 이미지 lazy loading
- Virtual scrolling for large photo lists
- Server-side rendering for public trips (SEO)

---

## 📚 참고 자료

- [Next.js 15 문서](https://nextjs.org/docs)
- [Mapbox GL JS 문서](https://docs.mapbox.com/mapbox-gl-js/)
- [Supabase 문서](https://supabase.com/docs)
- [exifr 문서](https://github.com/MikeKovarik/exifr)
- [Tailwind CSS 4 문서](https://tailwindcss.com/docs)
