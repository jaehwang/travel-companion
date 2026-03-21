# Travel Companion API 문서

웹 앱(Next.js)이 제공하는 REST API 목록입니다. 모바일 앱은 이 API를 통해 백엔드와 통신합니다.

## 기본 정보

- **Base URL**: `https://<your-vercel-domain>` (로컬: `http://localhost:3000`)
- **Content-Type**: `application/json`
- **인증**: 대부분의 엔드포인트는 Supabase 세션 쿠키 또는 `Authorization: Bearer <access_token>` 헤더 필요

## 인증 방식

### 웹 (쿠키)
Supabase Auth가 자동으로 쿠키를 관리합니다.

### API 직접 호출 (Bearer Token)
```
Authorization: Bearer <supabase_access_token>
```
`getAuthenticatedClient`를 사용하는 엔드포인트는 Bearer 토큰을 지원합니다.

## 에러 응답 형식

```json
{ "error": "에러 메시지" }
```

| HTTP 상태 | 의미 |
|-----------|------|
| 400 | 잘못된 요청 (필수 파라미터 누락, 유효성 오류) |
| 401 | 인증 필요 |
| 404 | 리소스 없음 |
| 500 | 서버 오류 |
| 503 | 외부 서비스 미설정 (Gemini API 등) |

## 엔드포인트 목록

| 파일 | 설명 |
|------|------|
| [trips.md](./trips.md) | 여행 CRUD + 부가 기능 |
| [checkins.md](./checkins.md) | 체크인 CRUD |
| [places.md](./places.md) | 장소 검색 (Google Places API 프록시) |
| [story.md](./story.md) | 공개 여행 스토리 조회 (인증 불필요) |
| [settings.md](./settings.md) | 사용자 설정 |
| [calendar.md](./calendar.md) | Google Calendar 연동 |
