# Trips API

## GET /api/trips
여행 목록 조회. 각 여행에 첫 번째 체크인 날짜와 랜덤 커버 사진 URL이 포함됩니다.

`is_default = true`인 default trip은 응답에서 제외됩니다 (내부 전용).

**인증**: 필요

**응답 200**
```json
{
  "trips": [
    {
      "id": "uuid",
      "title": "제주도 여행",
      "description": "3박 4일",
      "start_date": "2026-01-01",
      "end_date": "2026-01-04",
      "is_public": false,
      "is_frequent": false,
      "is_default": false,
      "place": "제주도",
      "place_id": "google_place_id",
      "latitude": 33.4996,
      "longitude": 126.5312,
      "user_id": "uuid",
      "created_at": "2026-01-01T00:00:00Z",
      "first_checkin_date": "2026-01-01T10:00:00Z",
      "cover_photo_url": "https://..."
    }
  ]
}
```

---

## POST /api/trips
새 여행 생성.

**인증**: 필요

**요청 Body**
```json
{
  "title": "제주도 여행",          // 필수
  "description": "3박 4일",       // 선택
  "start_date": "2026-01-01",    // 선택 (ISO date string)
  "end_date": "2026-01-04",      // 선택
  "is_public": false,             // 선택 (기본값: false)
  "is_frequent": false,           // 선택 (기본값: false) — 빠른 체크인 노출 여부
  "place": "제주도",              // 선택 (장소 이름)
  "place_id": "google_place_id", // 선택
  "latitude": 33.4996,           // 선택
  "longitude": 126.5312          // 선택
}
```

**응답 201**
```json
{ "trip": { /* Trip 객체 */ } }
```

---

## PATCH /api/trips/[id]
여행 수정. 전달된 필드만 업데이트합니다 (partial update).

**인증**: 필요

**요청 Body** (모두 선택)
```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "start_date": "2026-01-01",
  "end_date": "2026-01-04",
  "is_public": true,
  "is_frequent": true,
  "place": "제주도",
  "place_id": "google_place_id",
  "latitude": 33.4996,
  "longitude": 126.5312
}
```

**응답 200**
```json
{ "trip": { /* 업데이트된 Trip 객체 */ } }
```

---

## DELETE /api/trips/[id]
여행 삭제.

**인증**: 필요

**응답 200**
```json
{ "success": true }
```

---

## POST /api/trips/[id]/apply-place
여행의 장소 정보(place, place_id, latitude, longitude)를 해당 여행의 모든 체크인에 일괄 적용.

**인증**: 필요

**요청 Body**: 없음

**조건**: 여행에 `place`, `latitude`, `longitude`가 모두 설정되어 있어야 합니다.

**응답 200**
```json
{ "success": true }
```

**응답 400** (장소 정보 불완전)
```json
{ "error": "Trip has no complete place data" }
```

---

## POST /api/trips/[id]/tagline
Gemini AI를 사용해 여행 한 줄 소개(tagline)를 자동 생성.

**인증**: 필요 (Bearer 토큰 또는 쿠키)
**외부 의존**: `GEMINI_API_KEY` 환경변수 필요

**요청 Body**: 없음

**응답 200**
```json
{ "tagline": "봄바람 맞으며 걷는 제주의 하루" }
```

**응답 502** (Gemini 빈 응답)
```json
{ "error": "Gemini returned an empty tagline" }
```

**응답 503** (Gemini 미설정)
```json
{ "error": "Gemini API is not configured" }
```
