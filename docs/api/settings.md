# Settings API

사용자 설정(user_profiles.settings JSONB 컬럼)을 조회/수정합니다.

---

## GET /api/settings
현재 사용자 설정 조회.

**인증**: 필요

**응답 200**
```json
{
  "settings": {
    "calendar_sync_enabled": true
    // 추후 확장 가능한 JSONB 구조
  }
}
```

설정이 없으면 `{ "settings": {} }` 반환.

---

## PATCH /api/settings
설정 부분 업데이트. 기존 설정과 merge됩니다 (shallow merge).

**인증**: 필요

**요청 Body** (전달된 키만 업데이트)
```json
{
  "calendar_sync_enabled": false
}
```

**응답 200**
```json
{
  "settings": {
    "calendar_sync_enabled": false
  }
}
```
