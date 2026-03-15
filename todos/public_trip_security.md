# 공개 여행 이미지 보안 검토

## 현재 구현 방식

- Supabase Storage `trip-photos` 버킷: **Private**
- 이미지 업로드 시 **Signed URL** 생성 (만료: 1년)
- Signed URL을 `checkins.photo_url`에 저장
- 공개 스토리 페이지(`/story/[id]`)에서 `photo_url`을 `<img src>`로 직접 사용

### 문제점

1. **만료 문제**: Signed URL은 1년 후 만료 → 공개 여행 이미지가 깨짐
2. **비공개 전환 무력화**: 여행을 비공개로 전환해도 기존 Signed URL은 만료 전까지 계속 접근 가능
3. **토큰 노출**: URL에 JWT 토큰이 포함되어 브라우저 히스토리, 서버 로그 등에 노출

---

## 보안 강화 방안

### 방안 A: Public 버킷으로 전환 (권장 - 단순)

Supabase Dashboard에서 `trip-photos` 버킷을 Public으로 변경.

**장점**
- URL이 토큰 없이 영구적 (`/storage/v1/object/public/...`)
- 만료 걱정 없음
- 구현 변경 최소화 (업로드 시 `getPublicUrl()` 사용)

**단점**
- 버킷 내 모든 파일이 URL만 알면 접근 가능
- 비공개 여행 이미지도 URL을 알면 볼 수 있음 (단, URL 자체를 노출하지 않으면 실질적 위험 낮음)

**구현 변경 사항**
```typescript
// 현재 (signed URL)
const { data } = await supabase.storage
  .from('trip-photos')
  .createSignedUrl(path, 60 * 60 * 24 * 365);

// 변경 후 (public URL)
const { data } = supabase.storage
  .from('trip-photos')
  .getPublicUrl(path);
```

---

### 방안 B: 이미지 프록시 API (완전한 접근 제어)

`/api/image/[...path]` 서버 엔드포인트를 만들어 이미지를 프록시.

**장점**
- `is_public` 여부를 서버에서 실시간 확인
- 비공개 전환 즉시 이미지 접근 차단
- 만료 없음

**단점**
- 서버 부하 증가 (모든 이미지 요청이 서버를 통과)
- Vercel 함수 비용 발생 가능
- 구현 복잡도 높음

**구현 개요**
```
GET /api/image/photos/xxx.jpeg
  → checkin에서 trip_id 조회
  → trip.is_public 확인
  → 공개이면 Supabase Storage에서 스트리밍 반환
  → 비공개이면 403
```

---

### 방안 C: 짧은 만료 + 동적 재생성 (절충안)

`photo_url`에 Signed URL 대신 **스토리지 경로(path)만 저장**하고, 표시 시점에 서버에서 단기 Signed URL 재생성.

**장점**
- 버킷은 Private 유지 → 비공개 여행 이미지 보호
- URL 만료 문제 해결

**단점**
- 페이지 로드마다 Signed URL 재생성 필요 → API 호출 증가
- DB 스키마 변경 필요 (`photo_url` → `photo_path`)

---

## 권장 순서

1. **단기**: 방안 A (Public 버킷) 적용 — 만료 문제 즉시 해결, 구현 간단
   - 단, 비공개 여행 이미지 보호가 중요해지면 재검토 필요
2. **장기**: 사용자 수/보안 요구사항에 따라 방안 B 또는 C 검토
