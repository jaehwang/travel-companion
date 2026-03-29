# Project: Travel Companion (여행 기록 앱)

## 프로젝트 개요
여행하면서 기억하고 싶은 순간을 기록하는 앱입니다. 사진과 위치 정보를 활용하여 여행의 추억을 시각화하고 공유하는 모바일/웹 애플리케이션입니다.

## 핵심 컨셉
- 여행 중 인상 깊었던 장소, 맛있었던 음식, 아름다웠던 풍경 등 기억하고 싶은 순간을 체크인으로 기록
- 사진과 메모, 위치 정보를 함께 저장하여 나만의 여행 스토리 생성
- 시간이 지나도 여행의 순간들을 생생하게 되돌아볼 수 있는 개인 여행 일기

## 핵심 기능
- 사진 업로드 및 EXIF 데이터에서 GPS 정보 추출
- 지도 위에 사진 위치 표시 및 여행 경로 시각화
- 시간순/위치별 여행 스토리 생성
- 여행 기록 공유 (링크, SNS 등)
- 여행 타임라인 및 갤러리 뷰

## 기술 스택
### 웹 앱 (Progressive Web App)
- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **UI**: React + Tailwind CSS
- **지도**: Google Maps API
- **이미지 처리**: exifr (EXIF 데이터 추출), browser-image-compression
- **배포**: Vercel (자동 배포)

### 모바일 앱 환경 변수
- `apps/mobile/.env.development` — 시뮬레이터용 (로컬 서버 URL)
- `apps/mobile/.env.production` — 실기기/배포용 (`https://PRODUCTION_URL`)
- 시뮬레이터: `npx expo run:ios`
- 실기기: `npx expo run:ios --device --configuration Release`
- E2E 빌드: `cd apps/mobile && npm run e2e:build` (.env.development 사용, Metro 불필요)
- E2E 테스트: `cd apps/mobile && npm run e2e:test`
- **E2E 실행 전 웹 dev 서버 필수**: `npm run dev` (모바일 앱이 localhost:3000 API 사용)
- 네이티브 코드 변경 시에만 `e2e:build` 재실행 필요, 시뮬레이터에 로그인 세션 필요

### 백엔드
- **데이터베이스**: Supabase PostgreSQL
- **스토리지**: Supabase Storage (이미지 저장)
- **인증**: Supabase Auth (Google OAuth, 필수)

## 개발 우선순위
1. 사진에서 GPS 정보 추출 프로토타입
2. 지도에 마커 표시 기본 기능
3. 여행 경로 연결 및 시각화
4. UI/UX 디자인
5. 공유 기능
6. 소셜 기능 (좋아요, 댓글 등)

## 고려사항
- GPS 정보가 없는 사진 처리 방법 (수동 위치 지정)
- 개인정보 보호 (위치 정보 노출 제어)
- 대용량 이미지 처리 최적화
- 모바일 우선 vs 웹 우선 결정
- 오프라인 모드 지원 여부

## 개발 가이드라인
### Git
- 한국어/영어 커밋 메시지 혼용 가능
- Feature branch 사용
- 주요 기능 완성 시 커밋
- main 브랜치 push → Vercel 자동 배포
- **커밋 전 반드시 아래 순서로 실행하여 모두 통과해야 한다**
  1. `npm run build` - 빌드 성공 확인 (웹)
  2. `npm test` - 모든 테스트 통과 확인 (웹 + 모바일)
- **dev 서버가 실행 중인 상태에서 `npm run build`를 실행하지 않는다** (`.next` 충돌 발생)

### 코드 스타일
- TypeScript strict mode
- ESLint + Prettier
- 함수형 컴포넌트 + Hooks
- 컴포넌트 기반 아키텍처

## 문서

### API 문서 (`docs/api/`)

웹 앱의 REST API 문서는 `docs/api/` 에 Markdown으로 관리합니다.

- **위치**: `docs/api/README.md` (인덱스), `docs/api/trips.md`, `docs/api/checkins.md` 등
- **업데이트 원칙**: `apps/web/app/api/` 하위 Route Handler를 추가/수정할 때 아래를 함께 업데이트한다
  1. `docs/api/` 해당 문서 (엔드포인트, 요청/응답 형상)
  2. `apps/web/app/api/**/__tests__/route.test.ts` 응답 형상 검증 어설션 (문서에 명시된 필드가 실제 응답에 존재하는지 확인)
- **용도**: 모바일 앱 개발 시 백엔드 인터페이스 참조

### UI 문서 (`docs/ui/`)

웹/모바일 앱의 화면 구조, 컴포넌트, 훅, API 연계 방식을 Markdown으로 관리합니다.

- **위치**: `docs/ui/web.md` (웹 앱), `docs/ui/mobile.md` (모바일 앱)
- **업데이트 원칙**: 화면/컴포넌트/훅을 추가·변경할 때 해당 문서를 함께 업데이트한다

## 참고 사항
- 사용자는 여행을 자주 다니며 사진을 많이 찍음
- 실제 사용자의 니즈를 반영한 실용적인 앱 지향
- 개발자: 30년 개발 경력
- 웹 앱으로 빠른 프로토타입 우선
- PWA로 모바일에서도 앱처럼 사용 가능
