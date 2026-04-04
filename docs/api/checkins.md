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
  "trip_id": "uuid",               // 선택 — 생략 시 사용자의 default trip에 자동 할당
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

`trip_id`를 생략하면 서버가 `is_default = true`인 사용자 전용 default trip을 조회하거나 자동 생성하여 할당한다.

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
  "trip_id": "uuid",
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

`trip_id`를 전달하면 체크인을 다른 여행으로 이동한다. 대상 여행이 현재 사용자 소유가 아닌 경우 403을 반환한다.

**응답 200**
```json
{ "checkin": { /* 업데이트된 Checkin 객체 */ } }
```

---

## DELETE /api/checkins/[id]
체크인 삭제. `photo_url`이 있으면 Supabase Storage(`trip-photos` 버킷)의 사진 파일도 함께 삭제.

**인증**: 필요

**응답 200**
```json
{ "success": true }
```

---

## GET /api/checkins/nearby
현재 위치 주변의 체크인 목록 조회. `is_frequent = true`로 설정된 여행의 체크인만 반환. 빠른 체크인 기능에서 사용.

**인증**: 필요

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `lat` | 필수 | 현재 위도 |
| `lng` | 필수 | 현재 경도 |
| `radius` | 선택 | 검색 반경 (미터, 기본값: 1000) |

**예시**
```
GET /api/checkins/nearby?lat=37.5665&lng=126.9780&radius=1000
```

**응답 200**
```json
{
  "checkins": [
    {
      "id": "uuid",
      "trip_id": "uuid",
      "trip_title": "주차",
      "title": "지하3층",
      "place": null,
      "category": "other",
      "checked_in_at": "2026-03-21T10:00:00Z",
      "distance": 45.3
    }
  ]
}
```

- `distance`: 현재 위치로부터의 거리 (미터, Haversine 공식)
- 결과는 `checked_in_at` 기준 내림차순 정렬 (가장 최근 체크인 우선)
- `trip_title`: 체크인이 속한 여행의 제목 (JOIN 포함)
