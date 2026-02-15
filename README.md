# Travel Companion - 여행 기록 공유 앱

사진의 위치 정보(EXIF GPS)와 지도를 활용하여 여행 경로와 추억을 시각화하고 공유하는 웹 애플리케이션

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

## 개발 가이드

자세한 개발 가이드라인은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 배포

Vercel을 통한 자동 배포:

```bash
git push origin main
```

## 라이선스

MIT
