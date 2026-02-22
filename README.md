# Travel Companion - 여행 기록 앱

여행하면서 기억하고 싶은 순간을 기록하는 앱입니다. 사진과 위치 정보를 활용하여 여행의 추억을 시각화하고 공유할 수 있습니다.

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
- **Mapbox**: [https://www.mapbox.com](https://www.mapbox.com)에서 액세스 토큰 발급

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **지도**: Mapbox GL JS
- **이미지 처리**: exifr
- **백엔드**: Supabase (PostgreSQL + Storage + Auth)

## 프로젝트 구조

```
travel-companion/
├── app/                # Next.js App Router
│   ├── layout.tsx     # 루트 레이아웃
│   ├── page.tsx       # 홈 페이지
│   └── globals.css    # 전역 스타일
├── components/        # React 컴포넌트
├── lib/              # 유틸리티 함수
├── public/           # 정적 파일
└── types/            # TypeScript 타입 정의
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

## 검토 사항

### 데이터 백업
- Supabase 무료 플랜은 자동 백업 지원 없음
- 여행 기억 데이터는 대체 불가하므로 주기적 수동 백업 권장
- Supabase Dashboard → Project Settings → Backups에서 수동 다운로드 가능 (유료)
- 또는 `pg_dump`로 DB 덤프 (PostgreSQL 클라이언트 설치 필요)
- Supabase Storage 사진 파일은 DB 백업과 별도로 관리 필요

### 테스트용 DB
- 현재 단위 테스트는 Supabase를 mock으로 대체하므로 테스트 DB 불필요
- 향후 통합 테스트(RLS 정책, 복잡한 쿼리 검증) 추가 시 별도 Supabase 프로젝트를 테스트 DB로 사용 고려
- Supabase 무료 플랜으로 테스트용 프로젝트 추가 생성 가능

## 라이선스

MIT
