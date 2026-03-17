# Google Calendar 연동

## 요구 사항

- 사용자의 Google Calendar 일정을 읽어 체크인 페이지에 표시
- 여행 종료일이 있으면 오늘부터 종료일까지, 없으면 오늘 하루 일정 조회
- 다음 timed 일정(종일 일정 제외)에 대해 AI 조언 생성
- 토큰 만료 시 자동 갱신, 갱신 불가 시 재로그인 안내

## OAuth 스코프

```
https://www.googleapis.com/auth/calendar.readonly
```

- `access_type: offline` → refresh token 발급
- `prompt: consent` → 매번 동의 화면 표시 (refresh token 확보)

## 토큰 관리 설계

### 문제

Supabase SSR은 OAuth 로그인 직후에만 `provider_token` / `provider_refresh_token`을 세션에 포함한다.
페이지 새로고침 후에는 두 값 모두 세션에서 사라진다.

### 해결

1. **`/auth/callback`**: `exchangeCodeForSession` 직후 `provider_refresh_token`을 별도 httpOnly 쿠키(`google_refresh_token`)에 저장 (유효기간 6개월)
2. **`/api/calendar`**: 토큰 조회 우선순위
   - `session.provider_token` (access token, 1시간 유효)
   - `session.provider_refresh_token` (Supabase 세션에 있을 경우)
   - `google_refresh_token` 쿠키 (페이지 새로고침 후 폴백)

### 자동 갱신 흐름

```
GET /api/calendar
  └─ access token 있음 → Google Calendar API 호출
       ├─ 200 OK → 결과 반환
       └─ 401 → refresh token으로 새 access token 발급
                   ├─ 성공 → Google Calendar API 재시도
                   └─ 실패 → TOKEN_EXPIRED 반환 (재로그인 필요)
```

### 환경 변수

| 변수 | 설명 |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JavaScript API 키 (지도 표시용) |

> **주의**: Geocoding API는 Maps JavaScript API 키와 별도로 활성화해야 한다.
> Google Cloud Console → API 라이브러리 → Geocoding API → 사용 설정

## AI 조언

- 대상: 아직 끝나지 않은 timed 일정 중 가장 빠른 것
- 종일 일정은 제외
- 모델: `GEMINI_MODEL` 환경 변수 (기본값: `gemini-2.5-flash-lite`)
- 장소 정보가 있으면 현재 위치와의 직선거리 계산 후 프롬프트에 포함
- 조언 표시 조건
  - 여행 종료일 없음: 오늘 timed 일정만 대상
  - 여행 종료일 있고 미경과: 종료일 이전 모든 timed 일정 대상

## 확인 사항

- [ ] 로그인 후 캘린더 일정이 정상 표시되는지 확인
- [ ] 1시간 경과 후 access token 만료 시 자동 갱신되는지 확인
- [ ] **자동 갱신 실패 시 재로그인 없이 복구 가능한지 확인** (재로그인 필요 여부)
  - `google_refresh_token` 쿠키가 만료(6개월)되거나 Google에서 폐기되면 재로그인 필요
  - 재로그인 시 `prompt: consent`로 새 refresh token 발급됨
- [ ] Geocoding API 활성화 여부 확인 (거리 기반 조언 동작 확인)
- [ ] 종일 일정이 AI 조언에서 제외되는지 확인
- [ ] 여행 종료일 있는 경우 종료일까지 일정이 조회되는지 확인
