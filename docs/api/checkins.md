# Checkins API

## 카테고리 목록
`restaurant` | `attraction` | `accommodation` | `cafe` | `shopping` | `nature` | `activity` | `transportation` | `other`

---

## GET /api/checkins
체크인 목록 조회. `trip_id` 쿼리 파라미터로 특정 여행의 체크인만 필터링 가능.

**인증**: 필요

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `trip_id` | 선택 | 특정 여행의 체크인만 조회 |

**예시**
```
GET /api/checkins?trip_id=uuid
```

**응답 200**
```json
{
  "checkins": [
    {
      "id": "uuid",
      "trip_id": "uuid",
      "title": "성산일출봉",
      "place": "성산일출봉",
      "place_id": "google_place_id",
      "message": "일출이 정말 아름다웠다",
      "category": "attraction",
      "latitude": 33.4585,
      "longitude": 126.9422,
      "photo_url": "https://...",
      "photo_metadata": { "width": 1920, "height": 1080 },
      "checked_in_at": "2026-01-02T06:00:00Z",
      "created_at": "2026-01-02T06:00:00Z",
      "updated_at": "2026-01-02T06:00:00Z"
    }
  ]
}
```

결과는 `checked_in_at` 기준 내림차순 정렬.

---

## POST /api/checkins
체크인 생성.

**인증**: 필요

**요청 Body**
```json
{
  "trip_id": "uuid",               // 필수
  "latitude": 33.4585,             // 필수 (-90 ~ 90)
  "longitude": 126.9422,           // 필수 (-180 ~ 180)
  "title": "성산일출봉",           // 선택 (사용자 입력 제목)
  "place": "성산일출봉",           // 선택 (장소 검색으로 선택한 경우)
  "place_id": "google_place_id",   // 선택
  "message": "일출이 아름다웠다",  // 선택
  "category": "attraction",        // 선택
  "photo_url": "https://...",      // 선택
  "photo_metadata": {},            // 선택
  "checked_in_at": "2026-01-02T06:00:00Z"  // 선택 (기본값: 현재 시각)
}
```

**응답 201**
```json
{ "checkin": { /* Checkin 객체 */ } }
```

---

## PATCH /api/checkins/[id]
체크인 수정. 전달된 필드만 업데이트합니다 (partial update).

**인증**: 필요

**요청 Body** (모두 선택)
```json
{
  "latitude": 33.4585,
  "longitude": 126.9422,
  "title": "수정된 제목",
  "place": "수정된 장소",
  "place_id": "google_place_id",
  "message": "수정된 메모",
  "category": "restaurant",
  "photo_url": "https://...",
  "photo_metadata": {},
  "checked_in_at": "2026-01-02T06:00:00Z"
}
```

**응답 200**
```json
{ "checkin": { /* 업데이트된 Checkin 객체 */ } }
```

---

## DELETE /api/checkins/[id]
체크인 삭제.

**인증**: 필요

**응답 200**
```json
{ "success": true }
```
