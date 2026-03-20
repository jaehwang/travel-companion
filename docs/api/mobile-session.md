# Mobile Session API

## GET /api/mobile-session
모바일 앱의 Supabase 세션을 웹 앱의 쿠키 세션으로 변환.

모바일에서 웹뷰(체크인 화면 등)를 열 때 로그인 상태를 유지하기 위해 사용합니다.

**인증**: 불필요 (토큰을 Query Parameter로 전달)

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `access_token` | 필수 | Supabase access token |
| `refresh_token` | 필수 | Supabase refresh token |

**예시**
```
GET /api/mobile-session?access_token=eyJ...&refresh_token=eyJ...
```

**응답**
- 성공: 302 리다이렉트 → `/checkin` (세션 쿠키 설정됨)
- 실패: 302 리다이렉트 → `/login`

**사용 흐름**
```
모바일 앱
  → Supabase 로그인 → access_token + refresh_token 획득
  → 웹뷰로 /api/mobile-session?access_token=...&refresh_token=... 열기
  → 서버가 쿠키 설정 후 /checkin 리다이렉트
  → 웹뷰에서 인증된 상태로 웹 앱 사용 가능
```

> `access_token`과 `refresh_token`이 없거나 유효하지 않으면 `/login`으로 리다이렉트됩니다.
