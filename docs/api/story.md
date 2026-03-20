# Story API

## GET /api/story/[id]
공개 여행 스토리 조회. **인증 불필요** — 공유 링크 용도.

**인증**: 불필요

**응답 200 (공개 여행)**
```json
{
  "trip": {
    "id": "uuid",
    "title": "제주도 여행",
    "is_public": true,
    ...
  },
  "checkins": [
    { /* Checkin 객체, checked_in_at 오름차순 */ }
  ]
}
```

**응답 200 (비공개 여행)**
```json
{
  "trip": { "id": "uuid", "is_public": false },
  "checkins": []
}
```

**응답 404**
```json
{ "error": "Trip not found" }
```

> 비공개 여행은 404가 아닌 200 + `is_public: false`를 반환합니다. 클라이언트가 접근 불가 상태를 구분하여 처리해야 합니다.
