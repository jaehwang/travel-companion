# Frontend Design System

## 컨셉: 따뜻한 여행 일기 (Warm Travel Journal)

톡톡 튀는 감성과 편안한 스타일을 동시에 추구한다.
크림 톤 바탕, 따뜻한 타이포그래피, 카테고리별 팝한 액센트 컬러가 핵심이다.

---

## 색상 시스템

### 액센트 컬러 (브랜드 액션)

| 용도 | 값 |
|---|---|
| 주 액션 (버튼, FAB, 강조) | `#FF6B47` (코랄) |
| 보조 강조 | `#F59E0B` (앰버) |
| 위험/삭제 | `#EF4444` |

### 배경 & 표면 (CSS 변수 — `globals.css`)

| 변수 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--tc-bg` | `#FFF8F0` | `#1A1208` | 페이지 전체 배경 |
| `--tc-dot` | `#DDD0C4` | `#2A1C0A` | 도트 패턴, 구분선, 테두리 |
| `--tc-card-bg` | `#FFFFFF` | `#2A1E0E` | 카드 표면 |
| `--tc-card-empty` | `#F5EEE6` | `#2D2010` | 사진 없는 카드 영역, 버튼 배경 |
| `--tc-skeleton` | `#EDE3D5` | `#3A2A14` | 스켈레톤 로딩 채움 |

### 텍스트 (CSS 변수)

| 변수 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--tc-warm-dark` | `#2D2416` | `#F5EEE6` | 제목, 주 텍스트 |
| `--tc-warm-mid` | `#8B7355` | `#C4A882` | 본문, 설명 텍스트 |
| `--tc-warm-faint` | `#C4A882` | `#8B7355` | 날짜, 힌트, 비활성 |

### 카테고리 컬러 (체크인 카드 액센트)

카테고리별 좌측 스트립과 칩(chip) 색상으로 사용한다.

| 카테고리 | 이모지 | 컬러 |
|---|---|---|
| restaurant | 🍽️ | `#FF6B47` |
| cafe | ☕ | `#F59E0B` |
| attraction | 🏛️ | `#3B82F6` |
| accommodation | 🏨 | `#8B5CF6` |
| shopping | 🛍️ | `#EC4899` |
| nature | 🌿 | `#10B981` |
| activity | 🎯 | `#EF4444` |
| transportation | 🚌 | `#6B7280` |
| other | 📌 | `#C4A882` |

여행 카드 목록에서는 인덱스 순서로 동일 배열을 순환한다:
```ts
const CARD_ACCENTS = ['#FF6B47', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
```

---

## 타이포그래피

### 브랜드 폰트

- **Pacifico** (Google Fonts) — 앱 타이틀 "Travel Companion"에만 사용
- `globals.css` 상단에서 import: `@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap')`
- 클래스: `.tc-brand` (`font-family: 'Pacifico', cursive; color: var(--tc-warm-dark)`)

### 본문 폰트

OS 기본 시스템 폰트를 사용한다 (`-apple-system, BlinkMacSystemFont, ...`).

### 텍스트 크기 패턴

| 용도 | 크기 | 굵기 |
|---|---|---|
| 여행/체크인 폼 제목 입력 | 26px | 800 |
| 카드 제목 | 14–16px | 900 |
| 섹션 헤더 | 18px | 900 |
| 본문 | 14–15px | 400 |
| 날짜/메타 | 10–12px | 700 |
| 힌트/보조 | 11–13px | 400–600 |

제목과 레이블에는 `letter-spacing: -0.01em ~ -0.02em`을 적용해 모던하고 꽉 찬 느낌을 준다.

---

## 레이아웃

### 홈 페이지
- 컨테이너: 모바일에서 데스크톱까지 지원하는 가변 너비 (Tailwind: `max-w-md md:max-w-3xl lg:max-w-5xl`, 중앙 정렬 `mx-auto`)
- 패딩: `px-4 py-6 md:py-10`, 하단 `pb-20` (바텀바 높이 확보)
- 여행 카드 슬롯: 반응형 그리드 렌더링 (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`)

### 체크인 페이지
- 컨테이너: full-width (지도가 전체 너비를 사용)
- 패딩: `20px 16px`, 하단 `calc(80px + env(safe-area-inset-bottom, 0px))`
- 체크인 카드 그리드: `.checkin-grid` (640px→2단, 768px→3단, 900px→4단)
  - Tailwind 반응형 클래스 대신 `globals.css`에 직접 정의 (Turbopack arbitrary value 미지원 우회)

---

## Tailwind CSS v4 연동 및 클래스

프로젝트는 **Tailwind CSS v4**를 기반으로 하며, 다음과 같이 `globals.css` 및 `tailwind.config.ts`가 연동된다.
1. `globals.css` 상단에 `@import "tailwindcss";` 및 `@config "../tailwind.config.ts";` 선언.
2. 커스텀 색상(CSS 변수)은 Tailwind Config(`theme.extend.colors`) 내에 `tc-bg`, `tc-warm-dark` 등의 이름으로 주입하여 유틸리티 클래스(`text-tc-warm-dark`, `bg-tc-bg` 등)로 사용함.
3. 인라인 스타일(`style={{...}}`) 지양, Tailwind의 Utility-First 클래스와 아래에 정의된 공통 클래스 사용.

### 배경

```css
.tc-page-bg
```
크림 배경 + 28px 간격 도트 패턴. 홈, 체크인 목록 페이지에 사용.
폼 오버레이(체크인 폼, 여행 폼)는 도트 패턴 없이 `background-color: var(--tc-bg)`만 사용.

### 여행 카드

```css
.tc-trip-card
```
- 흰 카드 배경 + 따뜻한 그림자
- 로드 시 `tc-card-enter` 애니메이션 (fade + scale)
- `animation-delay`를 인덱스 × 70ms로 stagger 적용
- hover: `translateY(-7px) scale(1.025)` — spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`
- 카드 상단에 카테고리/인덱스 액센트 컬러의 5px 스트립

### 체크인 카드

```css
.tc-checkin-card
```
- 16px 둥근 모서리 + 따뜻한 그림자
- hover 시 그림자 강화 (transition만, transform 없음)
- 카드 좌측에 카테고리 컬러의 5px 스트립

### 헤더 / 사이드 드로어 / 바텀바

```css
.tc-header        /* background: tc-card-bg, border-bottom: 1.5px tc-dot */
.tc-drawer-panel  /* background: tc-bg */
.tc-bottom-bar    /* background: tc-card-bg, border-top: 1.5px tc-dot */
```

### 로딩 스켈레톤

```css
.tc-skeleton-card   /* 카드 모양 골격 */
.tc-skeleton-fill   /* 채움 영역 */
.tc-shimmer         /* opacity 펄스 애니메이션 (1.4s) */
```

---

## 버튼 패턴

### 주 액션 버튼 (코랄 pill)

- 클래스 예시: `rounded-full text-white font-normal border-none flex items-center justify-center leading-none hover:scale-105 transition-transform`
- 배경은 인라인 혹은 `bg-[#FF6B47]`, 그림자는 인라인 혹은 Tailwind box-shadow 확장 사용 (`boxShadow: '0 3px 10px rgba(255,107,71,0.4)'`)

비활성 시 `background: 'var(--tc-card-empty)'`, `color: 'var(--tc-warm-faint)'`, `boxShadow: 'none'`

### FAB (중앙 체크인 버튼)

- 중앙 하단에 고정되는 원형 주황색 버튼.
- 크기: `w-14 h-14` (56px) 등 Tailwind 유틸리티 우선 적용 + Glow 그림자.

### 보조 버튼 (크림 pill)

```tsx
style={{
  background: 'var(--tc-card-empty)',
  color: 'var(--tc-warm-mid)',
  borderRadius: 9999,
  padding: '8px 16px',
  fontWeight: 700,
  border: 'none',
}}
```

### 칩 (chip) — 선택된 항목 표시

항목 타입별로 색상 tint를 다르게 적용한다.

```tsx
// 위치 칩
{ background: 'rgba(255,107,71,0.1)', color: '#FF6B47' }

// 카테고리 칩 (catColor = 해당 카테고리 컬러)
{ background: `${catColor}18`, color: catColor }

// 시각 칩
{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }
```

---

## 애니메이션

| 이름 | 클래스 | 효과 |
|---|---|---|
| 히어로 페이드인 | `.tc-hero` | fade + translateY(18px→0), 0.6s |
| 히어로 서브 페이드인 | `.tc-hero-sub` | 위와 동일, delay 0.15s |
| 비행기 플로팅 | `.tc-plane` | translateY + rotate, 3.5s 무한 반복 |
| 카드 등장 | `.tc-trip-card` | fade + scale(0.96→1) + translateY, 0.45s |
| 스켈레톤 shimmer | `.tc-shimmer` | opacity 0.5↔1, 1.4s 무한 반복 |
| 스피너 | `animation: spin 0.8s linear infinite` | rotate 360° |

Easing 원칙:
- 등장 애니메이션: `cubic-bezier(0.22, 1, 0.36, 1)` (decelerate — 빠르게 시작, 부드럽게 착지)
- hover spring: `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot — 살짝 튀어오르는 느낌)

---

## 컴포넌트별 적용 현황

### 로그인 (`app/login/page.tsx`)
- 배경: `.tc-page-bg`
- 로고 SVG: 코랄(`#FF6B47`) 배경의 경로 지도 아이콘 (96px)
- 타이틀: `.tc-brand` + `.tc-hero`
- 기능 소개: 3개 흰 카드 (📸 / 🗺️ / 📖)
- Google 로그인 버튼: 흰 카드 pill, hover 시 shadow + translateY(-1px)

### 홈 (`app/page.tsx`)
- 배경: `.tc-page-bg`
- 타이틀: `.tc-brand` + `.tc-plane`
- 여행 카드: `.tc-trip-card`, 상단 액센트 스트립, stagger 애니메이션
- 스켈레톤: `.tc-skeleton-card` + `.tc-shimmer`
- 새 여행 버튼: 코랄 FAB

### 체크인 목록 (`app/checkin/page.tsx`)
- 배경: `.tc-page-bg`
- 헤더: `.tc-header`
- 여행 정보 블록: 흰 카드 + 코랄 좌측 4px 바
- 지도 래퍼: `border-radius: 16px` + 따뜻한 그림자

### 체크인 카드 (`components/CheckinListItem.tsx`)
- 컨테이너: `.tc-checkin-card`
- 좌측: 카테고리 컬러 5px 스트립
- 상단 메타: 카테고리 이모지 + 레이블 (카테고리 컬러), 우측 시간 (faint)

### 체크인 타임라인 (`app/checkin/components/CheckinTimeline.tsx`)
- 날짜 구분: 코랄 8px 도트 + 따뜻한 텍스트 + `--tc-dot` 라인
- 체크인 카드: 날짜별 그룹핑 후 `.checkin-grid`로 반응형 다단 배치

### 사이드 드로어 (`app/checkin/components/SideDrawer.tsx`)
- 패널: `.tc-drawer-panel` (크림 배경)
- 선택된 여행: 코랄 4px 좌측 바 + 코랄 텍스트

### 바텀바 (`app/checkin/components/BottomBar.tsx`)
- 컨테이너: `.tc-bottom-bar`
- 체크인 FAB: 코랄 원형, glow 그림자

### 체크인 폼 (`components/checkin-form/`)
- 전체 배경: `var(--tc-bg)` (도트 없음)
- 헤더: `--tc-dot` 하단 테두리, 취소(크림)/저장(코랄) pill 버튼
- 툴바 버튼: 이모지 + 한글 레이블, 활성 시 코랄 tint 배경
- 카테고리 패널: 카테고리 컬러 테두리 + tint 배경

### 여행 폼 (`app/checkin/components/TripFormModal.tsx`)
- 전체 배경: `var(--tc-bg)`
- 날짜 입력: 흰 카드 (`--tc-card-bg`) 안에 컬러 레이블
- 공개 토글: 활성 시 코랄 (`#FF6B47`) + glow 그림자

---

## 다크 모드

`tailwind.config.ts`에 `darkMode: 'media'` 설정 기반.
`prefers-color-scheme: dark` 미디어 쿼리로 `--tc-*` 변수가 자동 전환된다.
최소한의 인라인 스타일이나 Tailwind 클래스 모두 이 `var(--tc-*)` 변수에 의존하여 다크 모드를 자동 지원한다.
하드코딩 색상(`#FF6B47` 등 액센트 컬러)은 다크 모드에서도 동일하게 사용한다.
