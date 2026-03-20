# Travel Companion - 여행 기록 앱

여행하면서 기억하고 싶은 순간을 기록하는 앱입니다. 사진과 위치 정보를 활용하여 여행의 추억을 시각화하고 공유할 수 있습니다.

## 주요 기능

- 사진 업로드 및 EXIF GPS 정보 자동 추출
- 이미지 자동 압축 (최대 1MB/1920px)
- 현재 위치 또는 지도에서 위치 선택하여 체크인
- 장소 이름, 카테고리(9가지), 메모 입력
- Google Maps 위에 체크인 마커 및 여행 경로 시각화
- 다크 모드 지원 (시스템 설정 자동 감지)

## 프로젝트 구조

모노레포 구조로 웹 앱과 모바일 앱을 함께 관리합니다.

```
travel-companion/
├── apps/
│   ├── web/                       # Next.js PWA
│   │   ├── app/
│   │   │   ├── api/               # REST API 라우트
│   │   │   │   ├── checkins/      # 체크인 CRUD
│   │   │   │   ├── trips/         # 여행 CRUD
│   │   │   │   ├── places/        # Google Places 프록시
│   │   │   │   ├── calendar/      # Google Calendar 연동
│   │   │   │   ├── story/         # 공개 여행 스토리
│   │   │   │   └── settings/      # 사용자 설정
│   │   │   ├── checkin/           # 체크인 페이지
│   │   │   ├── calendar/          # 캘린더 페이지
│   │   │   ├── settings/          # 설정 페이지
│   │   │   └── story/             # 공개 스토리 페이지
│   │   ├── components/            # React 컴포넌트
│   │   ├── hooks/                 # 커스텀 훅
│   │   ├── lib/                   # 유틸리티
│   │   ├── tests/e2e/             # Playwright E2E 테스트
│   │   └── docs/api/              # API 문서 (Markdown)
│   └── mobile/                    # Expo iOS 앱
│       ├── src/
│       │   ├── screens/           # 화면 컴포넌트
│       │   ├── components/        # 공통 컴포넌트
│       │   ├── navigation/        # 네비게이션 설정
│       │   ├── hooks/             # 커스텀 훅
│       │   └── lib/               # 유틸리티 (Supabase 등)
│       └── App.tsx
└── packages/
    └── shared/                    # 공통 TypeScript 타입
```

## 기술 스택

### 웹 (`apps/web`)
- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **지도**: Google Maps JavaScript API
- **이미지 처리**: exifr (EXIF 추출), browser-image-compression
- **백엔드**: Supabase (PostgreSQL + Storage + Auth)
- **배포**: Vercel (main 브랜치 push 시 자동 배포)

### 모바일 (`apps/mobile`)
- **프레임워크**: Expo (React Native)
- **언어**: TypeScript
- **인증**: Supabase Auth (Keychain 기반 세션 저장)

## 시작하기

### 필수 요구사항
- Node.js 18.x 이상
- Expo CLI (모바일 개발 시)
- Xcode (iOS 시뮬레이터 사용 시)

### 설치

```bash
# 루트에서 전체 의존성 설치
npm install
```

### 환경 변수 설정

**웹** (`apps/web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
GEMINI_API_KEY=...          # 서버 전용 (API 라우트에서만 사용)
GOOGLE_CLIENT_ID=...        # Google Calendar 연동 시
GOOGLE_CLIENT_SECRET=...    # Google Calendar 연동 시
```

**모바일** — 환경별로 파일을 분리합니다:

`apps/mobile/.env.development` (시뮬레이터용):
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

`apps/mobile/.env.production` (실기기/배포용):
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=https://PRODUCTION_URL
```

API 키 발급:
- **Supabase**: [https://supabase.com](https://supabase.com)에서 프로젝트 생성
- **Google Maps**: [Google Cloud Console](https://console.cloud.google.com)에서 Maps JavaScript API 키 발급
- **Gemini**: [AI Studio](https://aistudio.google.com/app/apikey)에서 Gemini API 키 발급

### 개발 서버 실행

```bash
# 웹
npm run dev                          # 루트에서
cd apps/web && npm run dev           # 또는 직접

# 모바일 (iOS 시뮬레이터 — development)
cd apps/mobile && npx expo run:ios

# 모바일 (iPhone 실기기 — production URL 사용)
cd apps/mobile && NODE_ENV=production npx expo run:ios --device
```

## 테스트

### 단위 테스트 (Jest) — 웹

```bash
npm test                             # 루트에서
cd apps/web && npm test              # 또는 직접
npm run test:watch                   # 파일 변경 감지 후 자동 재실행
npm run test:coverage                # 커버리지 리포트 포함 실행
```

테스트 파일 위치 (`apps/web`):
- `lib/__tests__/` - 유틸리티 함수 단위 테스트
- `app/api/**/__tests__/` - API 라우트 테스트 (응답 형상 검증 포함)
- `components/__tests__/` - React 컴포넌트 테스트

### E2E 테스트 (Playwright) — 웹

iPhone 14 / WebKit 환경에서 실제 브라우저로 실행합니다.

```bash
# 최초 1회: Playwright 브라우저 바이너리 설치
cd apps/web && npx playwright install webkit

# E2E 테스트 실행 (dev 서버 자동 시작)
npm run test:e2e                     # 루트에서
cd apps/web && npm run test:e2e      # 또는 직접

# UI 모드로 인터랙티브하게 실행
cd apps/web && npx playwright test --ui

# 특정 파일만 실행
cd apps/web && npx playwright test tests/e2e/auth.spec.ts
```

E2E 테스트 파일 위치 (`apps/web/tests/e2e/`):
- `auth.spec.ts` - 비로그인 리다이렉트, 로그인 페이지 렌더링
- `layout.spec.ts` - iOS 가로 스크롤, viewport 메타태그 검증
- `pwa.spec.ts` - manifest, apple-touch-icon, 페이지 로딩 속도

> **참고**: E2E 테스트는 인증이 필요 없는 페이지(`/login` 등)만 대상으로 합니다.
> 로그인이 필요한 페이지 테스트는 `playwright.config.ts`의 `storageState`로 세션을 저장한 뒤 재사용해야 합니다.

## API 문서

웹 앱의 REST API 명세는 `apps/web/docs/api/`에 Markdown으로 관리합니다.

- [API 개요](apps/web/docs/api/README.md)
- [Trips API](apps/web/docs/api/trips.md)
- [Checkins API](apps/web/docs/api/checkins.md)
- [Places API](apps/web/docs/api/places.md)
- [Calendar API](apps/web/docs/api/calendar.md)

## 배포

```bash
git push origin main    # Vercel 자동 배포 (웹)
```

커밋 전 반드시 빌드 및 테스트를 확인하세요:

```bash
cd apps/web && npm run build && npm test
```

## 개발 가이드

자세한 개발 가이드라인은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 검토 사항

### 테스트용 DB
- 현재 단위 테스트는 Supabase를 mock으로 대체하므로 테스트 DB 불필요
- 향후 통합 테스트(RLS 정책, 복잡한 쿼리 검증) 추가 시 별도 Supabase 프로젝트를 테스트 DB로 사용 고려
- Supabase 무료 플랜으로 테스트용 프로젝트 추가 생성 가능

## 라이선스

MIT
