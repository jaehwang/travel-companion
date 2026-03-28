# DB & 인증 셋업

## Supabase 프로젝트 정보

| 항목 | 값 |
|------|---|
| 프로젝트 ID | `<SUPABASE_PROJECT_ID>` |
| Region | Northeast Asia (Seoul, ap-northeast-2) |
| URL | `https://<SUPABASE_PROJECT_ID>.supabase.co` |

---

## 데이터베이스 스키마

스키마 정의: `apps/web/supabase/schema.sql`

### 테이블

#### trips
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| user_id | UUID → auth.users | 소유자 (ON DELETE CASCADE) |
| title | VARCHAR(255) | 여행 제목 |
| description | TEXT | |
| start_date / end_date | TIMESTAMPTZ | |
| is_public | BOOLEAN | 공개 여부 (기본 false) |
| place / place_id | TEXT | 대표 장소 |
| latitude / longitude | float8 | 대표 좌표 |
| created_at / updated_at | TIMESTAMPTZ | |

#### checkins
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| trip_id | UUID → trips | (ON DELETE CASCADE) |
| title | VARCHAR(255) | 사용자 입력 제목 |
| place | VARCHAR(255) | 장소 검색으로 선택한 경우에만 저장 |
| place_id | VARCHAR(255) | |
| category | VARCHAR(100) | 9가지: restaurant, attraction, accommodation, cafe, shopping, nature, activity, transportation, other |
| message | TEXT | |
| latitude / longitude | DECIMAL | 필수 |
| photo_url | TEXT | |
| photo_metadata | JSONB | |
| checked_in_at / created_at / updated_at | TIMESTAMPTZ | |

#### user_profiles
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK → auth.users | (ON DELETE CASCADE) |
| google_refresh_token | TEXT | |
| settings | JSONB | 사용자 설정 (기본 `{}`) |
| created_at / updated_at | TIMESTAMPTZ | |

`auth.users` 생성 시 `handle_new_user` 트리거가 `user_profiles` 레코드를 자동 생성한다.

---

## Row Level Security (RLS)

### trips

| 정책 | 대상 |
|------|------|
| `trips_select` | 본인 소유(`auth.uid() = user_id`) |
| `trips_select_public` | `is_public = true`이면 비로그인도 SELECT 가능 |
| `trips_insert` | 본인 소유만 INSERT |
| `trips_update` | 본인 소유만 UPDATE |
| `trips_delete` | 본인 소유만 DELETE |

> `trips_select/update/delete` 정책에 `OR user_id IS NULL` 조건이 있다. 인증 도입 전 데이터를 위한 과도기 조건으로, 모든 데이터의 `user_id`가 채워진 상태라면 제거하는 것이 안전하다.

### checkins

`trips` 소유권을 통해 간접 확인한다 (`EXISTS (SELECT 1 FROM trips WHERE ...)`).

| 정책 | 대상 |
|------|------|
| `checkins_select` | 본인 소유 여행의 체크인 |
| `checkins_select_public` | 공개 여행의 체크인은 비로그인도 SELECT 가능 |
| `checkins_insert/update/delete` | 본인 소유 여행의 체크인만 허용 |

### user_profiles

| 정책 | 대상 |
|------|------|
| `user_profiles_select_own` | 본인만 SELECT |
| `user_profiles_update_own` | 본인만 UPDATE |

---

## Storage

버킷: `trip-photos` (Public access: true)

대시보드에서 수동 생성 후 아래 정책을 적용한다.

```sql
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'trip-photos');

CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'trip-photos');

CREATE POLICY "Public Upload" ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'trip-photos');
```

---

## Google OAuth 설정

### Google Cloud Console
- APIs & Services → Credentials → OAuth 클라이언트 → 승인된 리다이렉트 URI:
  ```
  https://<SUPABASE_PROJECT_ID>.supabase.co/auth/v1/callback
  ```

### Supabase Dashboard (Authentication → Providers → Google)
- 기존 Google Client ID / Client Secret 입력

### Supabase Dashboard (Authentication → URL Configuration)
- **Site URL**: `https://[vercel-app].vercel.app`
- **Redirect URLs**:
  ```
  travel-companion://*
  exp://localhost:*
  exp://127.0.0.1:*
  ```

---

## 환경 변수

### apps/web/.env.local
```
NEXT_PUBLIC_SUPABASE_URL=https://<SUPABASE_PROJECT_ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
```

### apps/mobile/.env.development / .env.production
```
EXPO_PUBLIC_SUPABASE_URL=https://<SUPABASE_PROJECT_ID>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon key]
```

### Vercel (Project → Settings → Environment Variables)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## DB 백업 & 복원

스크립트: `backup/supabase_backup.sh`, `backup/supabase_restore.sh`

```bash
cd backup
./supabase_backup.sh          # backup.sql 생성 (public 스키마만)
./supabase_restore.sh         # backup.sql 복원
```

Connection pooler (pg_dump/psql 모두 필수):
- `aws-1-ap-northeast-2.pooler.supabase.com:6543`

### 새 프로젝트로 이전 시 사후 작업

pg_dump로 옮겨지지 않는 항목들은 수동으로 처리해야 한다.

1. **Storage 파일 이전** — `backup/migrate-storage.ts` 실행
2. **auth.users FK로 인한 복원 오류** — 복원 스크립트가 `REFERENCES auth.users` FK를 제거하고 복원함
3. **user_id 불일치** — 새 프로젝트에서 로그인 후 발급된 UUID로 업데이트:
   ```sql
   -- 현재 로그인 사용자 UUID 확인
   SELECT id, email FROM auth.users;

   UPDATE trips SET user_id = '[새 UUID]' WHERE user_id = '[구 UUID]';
   UPDATE user_profiles SET id = '[새 UUID]' WHERE id = '[구 UUID]';
   ```
4. **Storage 정책** — 새 버킷 생성 후 위 정책 SQL 직접 실행
5. **Google OAuth Redirect URI** — Google Cloud Console과 Supabase 모두 업데이트
6. **Supabase Redirect URLs** — `travel-companion://*`, `exp://localhost:*` 등 추가
