# Refactoring Status

`progress.md` 내용을 실제 코드와 대조 검증한 결과.  
검증 기준: `origin/main..HEAD` 변경 내용 (브랜치: `refactor/phase2-file-split`)

---

## 전체 요약

| Phase | 내용 | progress.md | 실제 상태 |
|-------|------|-------------|-----------|
| Phase 1 | 타입 중복 제거 | ✅ 완료 | ✅ 정확 |
| Phase 2-1 | 모바일 `api.ts` 도메인별 분리 | ✅ 완료 | ✅ 정확 |
| Phase 2-2 | 모바일 `TripScreen.tsx` 섹션 분리 | ✅ 완료 | ⚠️ 부분 완료 |
| Phase 2-3 | 웹 `checkin/page.tsx` 컴포넌트 분리 | ✅ 완료 | ⚠️ 부분 완료 |
| Phase 2-4 | 모바일 `CheckinFormScreen.tsx` 섹션 분리 | ✅ 완료 | ⚠️ 부분 완료 |
| Phase 3 | 공유 순수 함수 추출 | ✅ 완료 | ✅ 정확 |
| Phase 4 | API 라우트 일관성 + 테스트 추가 | ✅ 완료 | ✅ 정확 |
| Phase 5 | 코드 품질 정리 | ✅ 완료 | ✅ 정확 |
| Phase 6 | i18n 준비 | ✅ 완료 | ✅ 정확 |

---

## Phase별 상세 검증

### Phase 1 — 타입 중복 제거 ✅

- `apps/web/types/database.ts` 삭제 확인
- 웹 전체 import가 `@travel-companion/shared`로 교체됨
- `apps/web/package.json` workspace 의존성 추가 확인

---

### Phase 2-1 — 모바일 `api.ts` 도메인별 분리 ✅

`src/lib/api/` 하위 9개 파일 모두 존재 확인:
`supabase-client.ts`, `rest-client.ts`, `trips.ts`, `checkins.ts`, `nearby.ts`, `storage.ts`, `places.ts`, `calendar.ts`, `settings.ts`, `index.ts`

기존 `api.ts`는 re-export만 남음.

---

### Phase 2-2 — 모바일 `TripScreen.tsx` 섹션 분리 ⚠️

| 항목 | 목표 | 실제 |
|------|------|------|
| `TripScreen.tsx` 슬림화 | ~150줄 | 303줄 |
| `TripHeader.tsx` | 생성 | ✅ 존재 |
| `TripMap.tsx` | 생성 | ✅ 존재 |
| `hooks/useTripDetail.ts` | 생성 | ✅ 존재 |
| `TripCheckinList.tsx` | 생성 | ❌ **미생성** |

`TripCheckinList.tsx`(체크인 목록 + 필터 로직)가 분리되지 않음.  
`TripScreen.tsx`도 목표(~150줄)보다 2배 많음.

---

### Phase 2-3 — 웹 `checkin/page.tsx` 컴포넌트 분리 ⚠️

Phase 6의 i18n 작업으로 파일 위치가 `app/[locale]/checkin/`으로 이동됨.

| 항목 | 목표 | 실제 |
|------|------|------|
| `page.tsx` 슬림화 | ~100줄 | **284줄** |
| `CheckinPageLayout.tsx` | 생성 | ❌ **미생성** |
| `TripSelector.tsx` | 생성 | ❌ **미생성** |
| `CheckinDrawer.tsx` | 생성 | ❌ **미생성** |
| `useCheckinPage.ts` | 생성 | ✅ 존재 |
| 기타 컴포넌트 | — | `BottomBar.tsx`, `TaglineBanner.tsx`, `TripInfoCard.tsx` 등 추출됨 |

목표 구조의 핵심 컴포넌트 3개가 미생성. `page.tsx`는 목표의 약 3배.

---

### Phase 2-4 — 모바일 `CheckinFormScreen.tsx` 섹션 분리 ⚠️

| 항목 | 목표 | 실제 |
|------|------|------|
| `CheckinFormScreen.tsx` 슬림화 | ~150줄 | **355줄** |
| `hooks/useCheckinForm.ts` | — (계획에 없었으나 추가) | ✅ 존재 |
| `sections/PhotoSection.tsx` | 생성 | ✅ 존재 |
| `sections/TimePickerSection.tsx` | 생성 | ✅ 존재 (계획명: `TimeSection.tsx`) |
| `sections/InfoChips.tsx` | — (계획에 없었으나 추가) | ✅ 존재 |
| `sections/LocationSection.tsx` | 생성 | ❌ **미생성** |
| `sections/CategorySection.tsx` | 생성 | ❌ **미생성** |
| `sections/NoteSection.tsx` | 생성 | ❌ **미생성** |

계획된 5개 섹션 중 2개만 분리됨. `CheckinFormScreen.tsx`가 목표의 약 2.4배.

---

### Phase 3 — 공유 순수 함수 추출 ✅

`packages/shared/src/utils/` 하위 파일 모두 존재 확인:
`geo.ts`, `date.ts`, `trip.ts`, `index.ts`

---

### Phase 4 — API 라우트 일관성 + 테스트 추가 ✅

신규 테스트 파일 3개 모두 존재 확인:
- `app/api/places/nearby/__tests__/route.test.ts` ✅
- `app/api/settings/__tests__/route.test.ts` ✅
- `app/api/story/[id]/__tests__/route.test.ts` ✅

calendar 라우트 조건부 인증 패턴은 의도된 설계로 확인, 수정 없음.

---

### Phase 5 — 코드 품질 정리 ✅

- `apps/web/app/api/` 전체에서 `console.*` 없음 확인
- `app/[locale]/` 하위 컴포넌트에서 인라인 스타일 제거 작업 반영됨

---

### Phase 6 — i18n 준비 ✅

| 항목 | 실제 |
|------|------|
| `apps/web/i18n/routing.ts`, `request.ts` | ✅ 존재 |
| `apps/web/middleware.ts` (next-intl 통합) | ✅ 존재 |
| `apps/web/messages/en.json`, `ko.json` | ✅ 존재 |
| `app/[locale]/` 하위로 페이지 이동 | ✅ 완료 |
| `packages/shared/messages/en.json`, `ko.json` | ✅ 존재 |
| `apps/mobile/src/i18n/en.json`, `ko.json`, `index.ts` | ✅ 존재 |

---

## 미완료 항목 (progress.md 대비 실제 차이)

| 항목 | 설명 |
|------|------|
| `TripCheckinList.tsx` 미생성 | Phase 2-2: 체크인 목록 + 필터 로직이 `TripScreen.tsx`에 잔류 |
| `CheckinPageLayout.tsx`, `TripSelector.tsx`, `CheckinDrawer.tsx` 미생성 | Phase 2-3: 목표 구조의 핵심 컴포넌트 3개 미분리 |
| `[locale]/checkin/page.tsx` 284줄 | Phase 2-3: 목표 ~100줄 대비 약 3배 |
| `LocationSection.tsx`, `CategorySection.tsx`, `NoteSection.tsx` 미생성 | Phase 2-4: 계획된 5개 섹션 중 3개 미분리 |
| `CheckinFormScreen.tsx` 355줄 | Phase 2-4: 목표 ~150줄 대비 약 2.4배 |
| `TripScreen.tsx` 303줄 | Phase 2-2: 목표 ~150줄 대비 약 2배 |
