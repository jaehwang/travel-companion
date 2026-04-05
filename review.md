# refactoring.md 검토 결과

> 최초 검토: 2026-04-04 / 2차 검토: 2026-04-04 / 3차 검토: 2026-04-04

---

## 1. Phase 4-2 — 테스트 공백 (수정 필요)

현황 요약의 **"API 라우트 18개 중 5개 테스트 없음"이 실제와 다름**.

이미 테스트 파일이 존재하는 라우트 (계획서에 누락으로 잘못 기재):
- `apps/web/app/api/places/details/__tests__/route.test.ts` ✅
- `apps/web/app/api/places/autocomplete/__tests__/route.test.ts` ✅

실제 테스트 미작성 라우트는 **3개**:
- `apps/web/app/api/places/nearby/route.ts`
- `apps/web/app/api/settings/route.ts`
- `apps/web/app/api/story/[id]/route.ts`

**수정 사항**:
- 현황 표 "5개" → "3개"
- Phase 4-2에서 `places/details`, `places/autocomplete` 항목 제거

---

## 2. Phase 4-1 — calendar 라우트 인증 패턴 (뉘앙스 수정 필요)

계획서 설명: `calendar/route.ts` — "`createClient()` 직접 사용 → `getAuthenticatedClient` 교체"

실제 코드 상황:
- `calendar/route.ts` (line 145~152), `calendar/schedule/route.ts` (line 109~116): 이미 `getAuthenticatedClient`를 **조건부로** 사용 중. 인증 사용자에겐 개인화 데이터를, 비인증 사용자에겐 공개 데이터를 반환하는 의도된 설계로 보임.
- `calendar/connect/route.ts`, `calendar/connect/callback/route.ts`: OAuth 리다이렉트 핸들러로, Bearer 토큰 기반인 `getAuthenticatedClient` 패턴 적용 대상이 아님.

**수정 사항**:
- Phase 4-1을 "단순 교체"가 아니라 "조건부 인증 패턴의 적절성 검토"로 표현 변경
- `calendar/connect`, `calendar/connect/callback`은 OAuth 흐름이므로 수정 대상에서 명시적으로 제외

---

## 3. Phase 5-1 — console 수 오기입

`calendar/route.ts`의 실제 console 문: **9개** (계획서에는 "6개"로 기재).

```
line 45:  console.warn('[Places] API key not found')
line 53:  console.warn('[Places] Text Search HTTP error', ...)
line 58:  console.warn('[Places] Text Search status:', ...)
line 63:  console.warn('[Places] No place found for:', ...)
line 71:  console.warn('[Places] Place Details HTTP error', ...)
line 76:  console.warn('[Places] Place Details status:', ...)
line 82:  console.log('[Places] No opening_hours for:', ...)
line 86:  console.log('[Places] OK (periods:', ...)
line 96:  console.error('[Places] Error:', ...)
```

**수정 사항**: "console.warn, console.log, console.error 6개" → "9개"

---

## 4. Phase 1 — `@travel-companion/shared` 의존성 선행 작업 누락 (2차 검토)

`@travel-companion/shared`가 **어디에도 npm 의존성으로 선언되지 않음**:
- `apps/web/package.json` — `@travel-companion/shared` 없음
- `apps/mobile/package.json` — 없음. 모바일은 현재 **상대경로**로 직접 import:
  ```
  import type { Trip } from '../../../../packages/shared/src/types';
  ```

Phase 1 작업 목록에 아래 항목 추가 필요:
```
- [ ] `apps/web/package.json`에 `"@travel-companion/shared": "*"` 추가 (workspace 의존성)
- [ ] `apps/web/tsconfig.json`에 경로 alias 설정 확인
- [ ] (선택) 모바일도 `@travel-companion/shared` 패키지 이름으로 통일 (상대경로 정리)
```

---

## 5. Phase 3 — `buildTripWithMeta` 순수 함수 가정 모순 (2차 검토)

계획서: `buildTripWithMeta(rawTrip, checkins[]) → Trip 변환 (순수 함수)`

실제 웹·모바일 `fetchTrips` 구현:
```typescript
const cover_photo_url = photos.length > 0
  ? photos[Math.floor(Math.random() * photos.length)]  // ← Math.random() 사용
  : null;
```

`cover_photo_url`이 `Math.random()`으로 선택되므로 **같은 입력에 다른 결과가 나온다 — 순수 함수가 아님**. 설계 결정 필요:
- **옵션 A**: 첫 번째 사진으로 고정 → 진짜 순수 함수
- **옵션 B**: 함수 설명에서 "(순수 함수)" 표현 제거, cover 선택 로직은 호출부에 위임

---

## 6. Phase 3 — `formatDate` 산재 정도 과소평가 (2차 검토)

계획서는 "날짜 포맷 함수 추출"로 단순 기술하지만, 실제로는 **웹 4개 + 모바일 4개** 구현이 각기 다른 포맷으로 산재해 있음:

| 파일 | 함수명 | 비고 |
|------|--------|------|
| `app/calendar/page.tsx` | `formatDate` | CalendarEvent 날짜 포맷 |
| `app/checkin/components/CheckinTimeline.tsx` | `formatDateHeader` | 날짜 구분선 포맷 |
| `app/story/[id]/StoryContent.tsx` | `formatDateHeader` | 동일 이름, 다른 구현 |
| `lib/ai/tripTagline.ts` | `formatDateForPrompt` | AI 프롬프트용 |
| `mobile/screens/TripScreen.tsx` | `formatDate` | 모바일 |
| `mobile/screens/CheckinsScreen.tsx` | `formatDateTime` | 날짜+시간 포함 |
| `mobile/screens/ScheduleScreen.tsx` | `formatDateHeader` | 모바일 스케줄 |
| `mobile/components/TripFormModal.tsx` | `formatDate`, `formatDateDisplay` | 2개 |

단순 추출이 아닌 **포맷 종류별 API 설계**가 필요하며, Phase 3 작업 공수 재산정이 필요함.

---

## 7. Phase 4-2 — `places/nearby` 테스트 케이스 오류 (3차 검토)

계획서: `Negative: 인증 실패·잘못된 좌표 / Positive: 근처 체크인 반환`

실제 `apps/web/app/api/places/nearby/route.ts`는:
- 인증 코드가 전혀 없는 **공개 엔드포인트** → "Negative: 인증 실패" 는 테스트할 수 없는 케이스
- Google Places API로 근처 **장소(place)** 를 반환 → "근처 체크인"이 아님 (`checkins/nearby`와 혼동)

수정 필요:
```
Positive: 좌표 제공 시 근처 장소 목록 반환
Negative: latitude/longitude 누락 → 400 / Google API 오류 → 500
Boundary: ZERO_RESULTS 응답 시 빈 배열 반환
```

---

## 8. Phase 3 — `formatDateForPrompt`를 `packages/shared`에 포함하는 것이 부적절 (3차 검토)

계획서의 통합 API 설계 테이블에 `formatDateForPrompt`가 포함되어 있지만:
- `apps/web/lib/ai/tripTagline.ts` **에서만** 사용됨 (모바일에는 AI 태그라인 기능 없음)
- shared에 포함하면 웹 전용 AI 로직이 공유 패키지로 유입됨

→ `formatDateForPrompt`는 `packages/shared/utils/date.ts`에서 제외하고 `apps/web/lib/ai/tripTagline.ts`에 그대로 유지. 계획서 설계 테이블에서 삭제 필요.

---

## 9. Phase 6 — `/login` E2E 경로 처리 미명시 (3차 검토)

Playwright E2E 테스트(`auth.spec.ts`, `layout.spec.ts`, `pwa.spec.ts`)가 locale prefix 없는 경로를 직접 사용:
```typescript
await page.goto('/login');
await page.goto('/calendar');
await page.goto('/');
```

Phase 6에서 `app/[locale]/` 구조 전환 시:
- `/login`이 `[locale]/` 하위로 이동하는지 계획서에 명시 없음
- middleware 리다이렉트(`/login → /en/login`)가 동작해도, E2E 테스트가 최종 URL 검증이나 특정 경로 응답을 기대하면 실패 가능

→ Phase 6 완료 기준 또는 6-3 작업 목록에 아래 항목 추가 필요:
```
- [ ] `/login` 등 locale prefix 없는 공개 경로의 [locale]/ 이동 여부 결정
- [ ] E2E 경로 영향 범위 확인 및 테스트 수정
```

---

## 그 외 — 계획 타당성 확인 (이상 없음)

| 항목 | 확인 결과 |
|------|-----------|
| Phase 1: `database.ts` ↔ `shared/types.ts` 중복 | `UserProfile`, `UserProfileSettings`, `Database` 등 포함 100% 중복 확인 |
| Phase 2: 대형 파일 크기 | api.ts 507줄, TripScreen.tsx 892줄, CheckinFormScreen.tsx 633줄, checkin/page.tsx 591줄 — 계획서와 일치 |
| Phase 3: `haversineDistance` 중복 | `apps/web/app/api/checkins/nearby/route.ts`와 `apps/mobile/src/lib/api.ts` 양쪽에 동일 구현 확인 |
| Phase 5-1: 기타 console 항목 | checkins/route.ts 4개, trips/route.ts 4개, trips/[id]/route.ts 4개, places/ 각 2개 — 계획서와 일치 |
| Phase 5-2, 6 라이브러리: 인라인 스타일, i18n | 계획 그대로 유효 |
