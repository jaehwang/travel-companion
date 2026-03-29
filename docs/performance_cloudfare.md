# Cloudflare Worker를 통한 사진 egress 절감

## 배경

Supabase Storage egress가 10.65GB에 달해 비용 절감이 필요했다.
신규 업로드 사진에 `cacheControl: '31536000'`을 설정했음에도 불구하고,
Supabase CDN 캐시 적중률이 낮아 매 요청마다 egress가 발생했다.

## 해결 방법

Cloudflare Worker를 Supabase Storage 앞에 프록시로 배치해
Cloudflare CDN이 이미지를 1년간 캐시하도록 구성했다.

```
클라이언트 → Cloudflare Worker → Supabase Storage
                 (캐시 HIT 시 Supabase 요청 생략)
```

## Cloudflare Worker

- **도메인**: `<your-worker>.workers.dev`
- **대상 버킷**: `trip-photos` (public 버킷)
- Worker는 요청을 `<project-id>.supabase.co`로 프록시하고
  응답에 `Cache-Control: public, max-age=31536000, immutable` 헤더를 적용한다.
- 캐시 확인: 응답 헤더 `CF-Cache-Status: HIT` / `MISS`

### Worker 코드

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const supabaseUrl =
      `https://<project-id>.supabase.co${url.pathname}${url.search}`;

    const cache = caches.default;
    const cacheKey = new Request(supabaseUrl);

    let response = await cache.match(cacheKey);
    if (response) return response;

    response = await fetch(supabaseUrl);
    if (!response.ok) return response;

    const cached = new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

    try {
      await cache.put(cacheKey, cached.clone());
    } catch (_) {}

    return cached;
  }
};
```

> **주의**: `new Response()` 생성 시 Supabase 헤더를 그대로 복사하면 `Vary: *` 등
> 캐싱 불가 헤더가 포함돼 `cache.put()`이 예외를 던진다. 필요한 헤더만 명시적으로 지정해야 한다.

## 코드 변경

### Supabase bucket 설정
- `trip-photos` 버킷을 **private → public**으로 변경

### 업로드 코드 (3곳)

| 파일 | 변경 내용 |
|------|-----------|
| `apps/web/components/checkin-form/hooks/usePhotoUpload.ts` | `createSignedUrl` → `getPublicUrl` + Worker 도메인 치환 |
| `apps/web/components/PhotoUpload.tsx` | 동일, `cacheControl` 3600 → 31536000 |
| `apps/mobile/src/lib/api.ts` | 동일, `cacheControl` 추가 |

업로드 후 URL 생성 패턴:

```ts
const { data: publicData } = supabase.storage
  .from('trip-photos')
  .getPublicUrl(filePath);
const photoUrl = publicData.publicUrl.replace(
  'https://<project-id>.supabase.co',
  'https://<your-worker>.workers.dev'
);
```

### DB 마이그레이션

기존에 저장된 signed URL을 public URL로 일괄 변환 (Supabase SQL Editor):

```sql
-- 1. 도메인 치환 (Supabase → Worker)
UPDATE checkins
SET photo_url = REPLACE(
  photo_url,
  'https://<project-id>.supabase.co',
  'https://<your-worker>.workers.dev'
)
WHERE photo_url LIKE 'https://<project-id>.supabase.co%';

-- 2. signed URL 경로를 public URL 경로로 변환
UPDATE checkins
SET photo_url = REPLACE(
  photo_url,
  '/storage/v1/object/sign/trip-photos/',
  '/storage/v1/object/public/trip-photos/'
)
WHERE photo_url LIKE '%/storage/v1/object/sign/trip-photos/%';
```

> **참고**: `?token=...` 파라미터는 public URL에서 무시되므로 제거하지 않아도 정상 동작한다.

## 효과

- 신규 업로드: Cloudflare가 1년 캐시 → Supabase egress 없음
- 기존 사진: DB URL 마이그레이션으로 동일하게 Worker 경유
- `CF-Cache-Status: HIT` 응답은 Supabase에 요청 자체가 전달되지 않음
