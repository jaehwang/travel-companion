# Travel Companion - 여행 기록 앱

여행하면서 기억하고 싶은 순간을 기록하는 앱입니다. 사진과 위치 정보를 활용하여 여행의 추억을 시각화하고 공유할 수 있습니다.

## 주요 기능

- 사진 업로드 및 EXIF GPS 정보 자동 추출
- 이미지 자동 압축 (최대 1MB/1920px)
- 현재 위치 또는 지도에서 위치 선택하여 체크인
- 장소 이름, 카테고리(9가지), 메모 입력
- Google Maps 위에 체크인 마커 및 여행 경로 시각화
- 다크 모드 지원 (시스템 설정 자동 감지)

## 시작하기

### 필수 요구사항
- Node.js 18.x 이상
- npm, yarn, 또는 pnpm

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env.local.example` 파일을 `.env.local`로 복사하고 필요한 API 키를 입력하세요:

```bash
cp .env.local.example .env.local
```

필요한 API 키:
- **Supabase**: [https://supabase.com](https://supabase.com)에서 프로젝트 생성
- **Google Maps**: [https://console.cloud.google.com](https://console.cloud.google.com)에서 Maps JavaScript API 키 발급
- **Gemini**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)에서 Gemini API 키 발급

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
GEMINI_API_KEY=...
```

`GEMINI_API_KEY`는 서버 전용 환경 변수입니다. 브라우저에서 직접 사용하지 말고, Next.js API 라우트에서만 호출하세요.

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **지도**: Google Maps JavaScript API
- **이미지 처리**: exifr (EXIF 추출), browser-image-compression
- **백엔드**: Supabase (PostgreSQL + Storage + Auth)
- **배포**: Vercel

## 프로젝트 구조

```
travel-companion/
├── app/
│   ├── api/
│   │   ├── checkins/      # 체크인 CRUD API
│   │   └── trips/         # 여행 CRUD API
│   ├── checkin/page.tsx   # 체크인 메인 페이지
│   ├── layout.tsx
│   ├── page.tsx           # 홈 페이지 (여행 목록)
│   └── globals.css
├── components/
│   ├── CheckinForm.tsx    # 체크인 생성 폼
│   ├── CheckinListItem.tsx
│   ├── LocationPicker.tsx # 지도 위치 선택 모달
│   ├── Map.tsx            # Google Maps 지도
│   └── PhotoUpload.tsx
├── hooks/
│   └── useGeolocation.ts
├── lib/
│   ├── supabase.ts
│   └── exif.ts
└── types/
    └── database.ts
```

## 테스트

```bash
npm test                # 전체 테스트 1회 실행
npm run test:watch      # 파일 변경 감지 후 자동 재실행
npm run test:coverage   # 커버리지 리포트 포함 실행
```

테스트 파일 위치:
- `lib/__tests__/` - 유틸리티 함수 단위 테스트
- `app/api/**/__tests__/` - API 라우트 테스트
- `components/__tests__/` - React 컴포넌트 테스트

## 개발 가이드

자세한 개발 가이드라인은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 배포

Vercel을 통한 자동 배포:

```bash
git push origin main
```

커밋 전 반드시 빌드 및 테스트를 확인하세요:

```bash
npm run build
npm test
```

## 검토 사항

### 테스트용 DB
- 현재 단위 테스트는 Supabase를 mock으로 대체하므로 테스트 DB 불필요
- 향후 통합 테스트(RLS 정책, 복잡한 쿼리 검증) 추가 시 별도 Supabase 프로젝트를 테스트 DB로 사용 고려
- Supabase 무료 플랜으로 테스트용 프로젝트 추가 생성 가능

## 라이선스

MIT
