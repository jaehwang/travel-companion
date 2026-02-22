# 인증 기능 설계 - Supabase Auth + Google OAuth

## 사용자 경험 (UX)

### 로그인 흐름
1. 앱 접속 → 비로그인 상태면 `/login` 페이지로 자동 리다이렉트
2. "Google로 로그인" 버튼 클릭
3. Google 계정 선택 (Google OAuth 동의 화면)
4. 앱으로 복귀 → 이전에 접근하려던 페이지로 이동

### 로그인 후
- 본인이 만든 여행(trips)만 표시
- 체크인 생성/수정/삭제 가능
- 상단에 내 계정 정보(아바타, 이름) + 로그아웃 버튼 표시

### 로그아웃
- 로그아웃 → `/login` 페이지로 이동

### 공개 여행 (is_public = true)
- 추후 구현: 링크를 통해 비로그인 사용자도 조회 가능

---

## 구현 계획

### 1단계: 외부 서비스 설정

#### Google Cloud Console
- OAuth 2.0 클라이언트 ID 발급
- 승인된 리다이렉트 URI 등록:
  - `https://<supabase-project>.supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback` (로컬 개발용)

#### Supabase Dashboard
- Authentication > Providers > Google 활성화
- Google Client ID / Client Secret 입력

### 2단계: DB 변경

```sql
-- trips 테이블에 user_id 추가
ALTER TABLE trips ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS 활성화
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- trips RLS 정책: 본인 데이터만 접근
CREATE POLICY "본인 여행만 조회" ON trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 여행만 생성" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 여행만 수정" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "본인 여행만 삭제" ON trips FOR DELETE USING (auth.uid() = user_id);

-- checkins RLS 정책: trips를 통해 소유권 확인
CREATE POLICY "본인 체크인만 조회" ON checkins FOR SELECT
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = checkins.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "본인 체크인만 생성" ON checkins FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM trips WHERE trips.id = checkins.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "본인 체크인만 수정" ON checkins FOR UPDATE
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = checkins.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "본인 체크인만 삭제" ON checkins FOR DELETE
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = checkins.trip_id AND trips.user_id = auth.uid()));
```

### 3단계: 패키지 설치

```bash
npm install @supabase/ssr
```

### 4단계: 코드 변경

#### 파일 구조
```
app/
  login/
    page.tsx              # 로그인 페이지 (Google 버튼)
  auth/
    callback/
      route.ts            # OAuth 콜백 처리
lib/
  supabase/
    client.ts             # 클라이언트 컴포넌트용
    server.ts             # 서버 컴포넌트/API 라우트용
middleware.ts             # 세션 갱신 + 인증 보호
```

#### middleware.ts
- 모든 요청에서 세션 토큰 갱신
- 비로그인 상태로 보호된 페이지 접근 시 `/login`으로 리다이렉트
- `/login`, `/auth/callback` 경로는 인증 없이 접근 허용

#### Supabase 클라이언트 분리
- `lib/supabase/client.ts`: `createBrowserClient` (클라이언트 컴포넌트)
- `lib/supabase/server.ts`: `createServerClient` (Server Component, API Route)

#### API 라우트 변경
- 모든 API에서 `supabase.auth.getUser()`로 세션 확인
- 비인증 요청 → 401 응답
- trips 생성 시 `user_id: user.id` 자동 포함

#### 로그인 페이지 (`app/login/page.tsx`)
- "Google로 로그인" 버튼 하나
- `supabase.auth.signInWithOAuth({ provider: 'google' })` 호출

#### OAuth 콜백 (`app/auth/callback/route.ts`)
- Google 인증 후 Supabase가 리다이렉트하는 엔드포인트
- `code`를 세션으로 교환 후 `/checkin`으로 이동

### 5단계: UI 변경
- 헤더에 사용자 아바타 + 이름 표시
- 로그아웃 버튼
- 기존 체크인 페이지에 인증 상태 연동

---

## 환경 변수 추가 없음
- Supabase URL/Key는 이미 설정됨
- Google OAuth 설정은 Supabase Dashboard에서 관리

---

## 구현 순서 요약

| 순서 | 작업 | 비고 |
|------|------|------|
| 1 | Google Cloud Console OAuth 클라이언트 발급 | 수동 |
| 2 | Supabase Dashboard Google provider 활성화 | 수동 |
| 3 | DB 마이그레이션 (user_id, RLS) | SQL 실행 |
| 4 | `@supabase/ssr` 설치 | `npm install` |
| 5 | Supabase 클라이언트 분리 | 코드 |
| 6 | `middleware.ts` 작성 | 코드 |
| 7 | 로그인 페이지 + OAuth 콜백 | 코드 |
| 8 | API 라우트 인증 체크 추가 | 코드 |
| 9 | UI 헤더 업데이트 | 코드 |
