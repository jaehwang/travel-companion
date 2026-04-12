# Calendar API

Google Calendar 연동 관련 엔드포인트.

**외부 의존**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 환경변수 필요

---

## GET /api/calendar
Google Calendar 이벤트 목록 조회.

**인증**: 필요 + Google Calendar 연동 완료 상태

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `timeMin` | 선택 | 조회 시작 시각 (ISO 8601, 기본: 현재 시각) |
| `timeMax` | 선택 | 조회 종료 시각 (ISO 8601) |
| `maxResults` | 선택 | 최대 결과 수 (기본: 20) |

**예시**
```
GET /api/calendar?timeMin=2026-03-20T00:00:00Z&maxResults=10
```

**응답 200**: Google Calendar API 응답을 그대로 반환 (items 배열 포함)

**응답 401 (토큰 만료)**
```json
{
  "error": "TOKEN_EXPIRED",
  "message": "구글 캘린더 접근 권한이 만료되었습니다. 재로그인이 필요합니다."
}
```

> 토큰 만료 시 자동 refresh를 시도하고, 실패 시 `TOKEN_EXPIRED` 에러 반환.

---

## GET /api/calendar/connect
Google Calendar OAuth 인증 시작. 브라우저를 Google OAuth 동의 화면으로 리다이렉트.

**인증**: 필요

**응답**: 302 리다이렉트 → Google OAuth URL

> 이 엔드포인트는 브라우저에서 직접 접근해야 합니다 (리다이렉트 기반).

---

## GET /api/calendar/connect/callback
Google OAuth 콜백. Google에서 리다이렉트 후 자동 처리됩니다.

직접 호출하지 않습니다.

---

## POST /api/calendar/disconnect
Google Calendar 연동 해제. refresh token을 revoke하고 DB에서 삭제.

**인증**: 필요

**요청 Body**: 없음

**응답 200**
```json
{ "success": true }
```

---

## GET /api/calendar/schedule
오늘부터 2주간의 Google Calendar 일정을 조회하고, 위치가 있는 이벤트에 날씨 정보를 첨부한 뒤 Gemini AI 조언을 함께 반환한다.

**인증**: 필요 + Google Calendar 연동 완료 상태
**외부 의존**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Geocoding), Open-Meteo (무료, 키 불필요), `GEMINI_API_KEY`

**Query Parameters**: 없음 (항상 오늘~+14일)

**응답 200**
```json
{
  "items": [
    {
      "id": "abc123",
      "summary": "묵호 여행",
      "location": "동해비치호텔, 강원도 동해시",
      "start": { "date": "2026-04-10" },
      "end": { "date": "2026-04-12" },
      "weather": {
        "date": "2026-04-10",
        "tempMax": 18,
        "tempMin": 11,
        "precipitation": 0.0,
        "weatherCode": 3,
        "windspeedMax": 17,
        "description": "흐림",
        "emoji": "☁️"
      }
    }
  ],
  "advice": "묵호 여행 첫날은 흐리지만 비는 없으니 해변 산책 괜찮아요. 4월 11일은 비와 강풍 예보라 실내 일정을 준비해두세요!"
}
```

`weather` 필드는 위치 정보가 있는 이벤트에만 포함된다. Geocoding 실패 시 미포함.

**WMO 날씨 코드 → 한국어**
| 코드 | 설명 |
|------|------|
| 0 | ☀️ 맑음 |
| 1 | 🌤️ 대체로 맑음 |
| 2 | 🌤️ 구름 조금 |
| 3 | ☁️ 흐림 |
| 45–48 | 🌫️ 안개 |
| 51–55 | 🌦️ 이슬비 |
| 61–67 | 🌧️ 비 |
| 71–77 | 🌨️ 눈 |
| 80–82 | 🌦️ 소나기 |
| 95–99 | ⛈️ 뇌우 |

**응답 401 (토큰 만료)**: `GET /api/calendar`와 동일

---

## GET /api/calendar/mobile/connect
모바일 앱 전용. Google Calendar OAuth 인증 URL을 반환합니다.

**인증**: 필요 (Bearer 토큰)

**응답 200**
```json
{ "url": "https://accounts.google.com/o/oauth2/v2/auth?..." }
```

모바일 앱은 이 URL을 `expo-web-browser.openAuthSessionAsync`로 열고, 콜백 결과를 `/api/calendar/mobile/complete`로 전달합니다.

---

## GET /api/calendar/mobile/callback
모바일 OAuth 콜백. Google에서 리다이렉트 후 자동 처리됩니다.

직접 호출하지 않습니다. Google OAuth 콜백을 받아 `travel-companion://calendar-callback?code=...` deep link로 리다이렉트합니다.

---

## POST /api/calendar/mobile/complete
모바일 앱 전용. OAuth code를 서버에 전달해 refresh_token을 획득·저장합니다.

**인증**: 필요 (Bearer 토큰)

**요청 Body**
```json
{ "code": "4/0AX..." }
```

**응답 200**
```json
{ "success": true }
```

---

## POST /api/calendar/advice
캘린더 이벤트 목록을 받아 Gemini AI로 한 줄 여행 조언 생성.

**인증**: 필요
**외부 의존**: `GEMINI_API_KEY` 환경변수 필요

**요청 Body**
```json
{
  "events": [
    {
      "summary": "호텔 체크아웃",
      "location": "제주 신라호텔",
      "minutesUntil": 120,
      "isAllDay": false
    }
  ],
  "userLat": 33.2530,
  "userLng": 126.5096
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `events` | 필수 | 이벤트 배열 (최소 1개) |
| `events[].summary` | 필수 | 이벤트 제목 |
| `events[].location` | 선택 | 이벤트 장소 (geocoding에 사용) |
| `events[].minutesUntil` | 필수 | 이벤트까지 남은 분 |
| `events[].isAllDay` | 선택 | 종일 이벤트 여부 |
| `userLat` | 선택 | 사용자 현재 위도 (거리 계산용) |
| `userLng` | 선택 | 사용자 현재 경도 |

**응답 200**
```json
{ "advice": "🏨 2시간 후 체크아웃, 신라호텔까지 3.2km 이동 준비하세요" }
```

최대 60자, 이모지 1개, 한국어.
