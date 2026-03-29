# 보안 고려사항

## 사진 접근 제어

### 현재 상태

Supabase Storage 버킷이 **public**으로 설정되어 있다.
Cloudflare Worker를 통해 서빙되며, URL을 아는 사람은 누구든 인증 없이 사진에 접근할 수 있다.

URL 패턴: `https://<worker>.workers.dev/storage/v1/object/public/<bucket>/photos/{타임스탬프}_{파일명}`

### 위험

- URL이 노출되면 인증 없이 사진 열람 가능
- `is_public: false`인 비공개 여행의 사진도 URL만 알면 접근 가능

### 개선 방안

#### 방안 1: Worker에서 서비스 키로 인증 (권장)

bucket을 private으로 복원하고, Worker가 Supabase service role key로 fetch한다.
클라이언트는 Worker URL만 사용하므로 캐시 효과는 유지된다.
단, Worker URL을 아는 사람은 여전히 접근 가능하다 (URL 비공개에 의존).

```js
response = await fetch(supabaseUrl, {
  headers: {
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'apikey': env.SUPABASE_SERVICE_KEY,
  },
});
```

Cloudflare Worker 환경변수에 `SUPABASE_SERVICE_KEY`를 secret으로 등록.

#### 방안 2: Worker에서 사용자 JWT 검증

요청 헤더에 Supabase JWT를 포함시키고, Worker에서 검증 후 Supabase에 전달한다.
사용자별 접근 제어가 가능하지만, 응답이 사용자마다 달라지므로 **캐시 효과가 없어진다**.

#### 방안 3: 현재 유지 (보안보다 성능 우선)

여행 사진의 특성상 민감도가 낮고, URL이 추측하기 어려운 형태(타임스탬프 포함)이므로
현재 상태를 허용 가능한 수준으로 판단하는 경우. Slack, Notion 첨부파일 등 많은 서비스가
이와 유사한 방식(URL 비공개에 의존)을 사용한다.

### 결정 기준

| 요구사항 | 권장 방안 |
|----------|-----------|
| 비공개 여행 사진 보호 필요 | 방안 1 (최소한의 보호) 또는 방안 2 |
| 사용자별 접근 제어 필요 | 방안 2 (캐시 포기) |
| 성능 우선, 사진 민감도 낮음 | 방안 3 (현상 유지) |
