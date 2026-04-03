# PRD: 유머 있는 AI 비서

## Introduction

Travel Companion을 단순한 여행 기록 앱에서 **유머 있는 AI 비서**로 발전시킨다.

현재 앱은 사용자가 직접 체크인을 생성하고 기록을 관리하는 수동적 도구다. 이 PRD는 AI가 여행 전·중·후에 능동적으로 개입해 실용적인 도움을 주면서, 동시에 가볍고 유머 있는 말투로 여행을 더 재미있게 만드는 기능을 정의한다.

**컨셉**: "일 잘하는데 입도 산다" — 정확하고 유용하되, 한 마디씩 웃음을 준다.

**플랫폼**: 모바일 앱(Expo iOS) 우선. 웹은 후속.

---

## Goals

- 체크인 직후 AI 코멘트로 기록의 재미와 감성을 높인다
- 여행 전 캘린더·날씨·과거 패턴 기반으로 사용자가 더 잘 준비하도록 돕는다
- 여행 중 현재 위치 기반 실시간 조언으로 이동 마찰을 줄인다
- 여행 후 자동 생성된 통계·여행기·리마인더로 기억이 오래 남게 한다
- 위시리스트와 스트릭으로 다음 여행을 기대하게 만든다

---

## User Stories

### US-003: 여행 전 — 날씨 연동 조언

**Description:** 여행자로서, 여행 당일 날씨에 맞는 간단한 조언을 받아 준비를 잘 하고 싶다.

**Acceptance Criteria:**
- [ ] 홈 또는 TripScreen에서 오늘/내일 날씨 요약 표시 (외부 날씨 API 연동)
- [ ] 비/눈 예보 시 "우산 챙기세요" + 실내 장소 대안 제안
- [ ] 날씨 기반 AI 코멘트 유머 톤 적용 ("오늘 비 온다는데 카페 투어 명분 생겼네요")
- [ ] 날씨 API 실패 시 날씨 섹션 미표시 (graceful degradation)
- [ ] Typecheck 통과

**테스트 힌트:**
- E2E (Detox): 홈/TripScreen에서 날씨 카드 렌더링 확인
- 컴포넌트: 날씨 API 실패 mock → 날씨 섹션 미렌더링 확인

---

### US-001: 체크인 AI 코멘트

**Description:** 여행자로서, 체크인을 저장하면 AI가 유머 있는 한 마디를 해줘서 기록이 더 재미있어지길 원한다.

**Acceptance Criteria:**
- [ ] 체크인 저장 완료 직후 토스트에 AI 코멘트 표시 (2~3초)
- [ ] 코멘트는 장소명, 카테고리, 방문 횟수, 날씨(가능 시), 시간대를 반영
- [ ] 같은 장소 재방문 시 "또 오셨네요" 계열 코멘트 생성
- [ ] 코멘트 길이 40자 이내, 유머 톤 (태그라인 프롬프트 전략 재활용)
- [ ] API 응답 지연 시 코멘트 없이 조용히 실패 (체크인 저장에 영향 없음)
- [ ] `POST /api/checkins/[id]/comment` 엔드포인트 구현
- [ ] Typecheck 통과

**테스트 힌트:**
- E2E (Detox): 체크인 저장 → 토스트에 코멘트 텍스트 표시 확인
- API (`checkins/[id]/comment/__tests__/route.test.ts`): 성공 응답 형상, Gemini mock 오류 시 체크인 저장 영향 없음 확인
- 단위: `buildCheckinCommentPrompt` — 장소명·카테고리·방문 횟수 반영, 40자 이내 truncate

---

### US-002: 여행 전 — 캘린더 기반 장소 추천

**Description:** 여행자로서, 다가오는 일정 근처의 장소를 미리 추천받아 더 알찬 여행을 준비하고 싶다.

**Acceptance Criteria:**
- [ ] TripScreen 또는 홈에서 "다가오는 일정" 카드 표시 (Google Calendar 연동된 경우)
- [ ] 일정 장소 기반으로 반경 1km 내 Google Places 추천 장소 최대 3개 표시
- [ ] 추천 항목에 카테고리, 거리, 평점 표시
- [ ] "관심 없음" 또는 "위시리스트에 추가" 액션 제공
- [ ] Calendar 미연동 시 카드 미표시
- [ ] Typecheck 통과

**테스트 힌트:**
- 컴포넌트: Calendar 연동 mock → 카드 렌더링, 미연동 mock → 카드 미렌더링
- E2E (Detox): "다가오는 일정" 카드 표시 → 추천 장소 3개 이하 확인

---

### US-004: 여행 전 — 선호 장소 패턴 추천

**Description:** 여행자로서, 내 과거 방문 패턴을 바탕으로 취향에 맞는 장소를 추천받고 싶다.

**Acceptance Criteria:**
- [ ] 체크인 카테고리 빈도 분석으로 상위 2개 선호 카테고리 추출
- [ ] 현재 위치 근처 선호 카테고리 Google Places 장소 추천
- [ ] "자주 카페를 찾으시네요, 근처 카페예요" 형태의 컨텍스트 문구 표시
- [ ] 체크인 수 10개 미만일 때는 패턴 추천 미표시
- [ ] Typecheck 통과

**테스트 힌트:**
- 단위: `extractTopCategories(checkins)` — 빈도 상위 2개 반환, 체크인 10개 미만 시 빈 배열 반환
- 컴포넌트: 카테고리 추출 mock → 컨텍스트 문구 렌더링 확인

---

### US-005: 여행 중 — 자주 가는 곳 근처 체크인 알림

**Description:** 여행자로서, 자주 가는 곳 근처에 있을 때 알림을 받아 빠르게 체크인하고 싶다.

**Acceptance Criteria:**
- [ ] `is_frequent = true` 여행의 체크인 위치 반경 200m 진입 시 로컬 알림 발송
- [ ] 알림 탭 → QuickCheckinSheet 바로 열림, 해당 장소 선택된 상태
- [ ] 같은 장소 알림은 하루 1회로 제한 (중복 방지)
- [ ] 설정 화면에서 이 알림 ON/OFF 가능
- [ ] 위치 권한 `always` 필요 시 권한 요청 안내 제공
- [ ] Typecheck 통과

**테스트 힌트:**
- 단위: `isWithinRadius(userCoord, checkinCoord, 200)` — Haversine 경계값 테스트
- 단위: `shouldSendAlert(lastAlertTime, now)` — 하루 1회 제한 로직
- E2E (Detox): 설정 화면에서 알림 OFF → ON 토글 확인

---

### US-006: 여행 중 — 위시리스트 근처 알림

**Description:** 여행자로서, 가보고 싶었던 곳 근처에 있을 때 알림을 받아 기회를 놓치지 않고 싶다.

**Acceptance Criteria:**
- [ ] 위시리스트 항목(장소 + 좌표) 반경 500m 진입 시 로컬 알림 발송
- [ ] 알림 메시지에 장소명과 거리 포함 ("찜해두신 OO 카페, 300m 앞이에요")
- [ ] 알림 탭 → 해당 장소 상세 또는 LocationPicker로 이동
- [ ] Typecheck 통과

**테스트 힌트:**
- 단위: `isWithinRadius(userCoord, wishlistCoord, 500)` — 경계값 테스트
- 단위: `buildWishlistAlertMessage(placeName, distanceM)` — 메시지 형식 검증

---

### US-007: 위시리스트

**Description:** 여행자로서, 가보고 싶은 장소를 저장해두고 나중에 근처 갔을 때 알림받고 싶다.

**Acceptance Criteria:**
- [ ] 장소 검색(PlaceSearchPanel) 결과에서 "위시리스트 추가" 버튼
- [ ] 위시리스트 목록 화면 (지도 또는 리스트 뷰)
- [ ] 항목 삭제 가능
- [ ] `wishlists` 테이블 DB 스키마 추가 (user_id, place_id, place_name, latitude, longitude)
- [ ] Typecheck 통과

**테스트 힌트:**
- E2E (Detox): 장소 검색 → 위시리스트 추가 → 목록 표시 → 삭제 플로우
- API (`wishlists/__tests__/route.test.ts`): CRUD 응답 형상, 인증 없는 요청 401

---

### US-008: 여행 후 — 여행 통계

**Description:** 여행자로서, 여행이 끝나면 간단한 통계를 확인하고 싶다.

**Acceptance Criteria:**
- [ ] TripScreen 하단 또는 여행 정보 카드에 통계 표시
  - 총 이동 거리 (체크인 간 직선 거리 합산)
  - 카테고리별 방문 수 (카페 3, 식당 2 등)
  - 총 체크인 수, 여행 기간
- [ ] 통계는 클라이언트에서 계산 (API 추가 불필요)
- [ ] 체크인 2개 미만이면 통계 미표시
- [ ] Typecheck 통과

**테스트 힌트:**
- 단위: `calcTripStats(checkins)` — 이동 거리 합산, 카테고리 빈도 집계, 체크인 2개 미만 시 null 반환
- 컴포넌트: 체크인 2개 미만 mock → 통계 섹션 미렌더링 확인

---

### US-009: 여행 후 — AI 여행기 자동 생성

**Description:** 여행자로서, 체크인들을 바탕으로 짧은 여행기를 자동 생성받아 기억을 글로 남기고 싶다.

**Acceptance Criteria:**
- [ ] TripScreen에 "여행기 생성" 버튼 (체크인 3개 이상일 때 활성화)
- [ ] `POST /api/trips/[id]/story` 엔드포인트 — Gemini로 300자 내외 여행기 생성
- [ ] 여행기에 AI 하이라이트 한 줄 포함 ("이번 여행의 주인공은 점심이었던 것 같아요")
- [ ] 생성된 여행기 화면에 표시, 클립보드 복사 버튼 제공
- [ ] 유머 톤 적용 (태그라인 프롬프트 전략 재활용)
- [ ] Typecheck 통과

**테스트 힌트:**
- API (`trips/[id]/story/__tests__/route.test.ts`): 성공 응답에 `story`, `highlight` 필드 포함 확인, Gemini mock 오류 시 500
- 컴포넌트: 체크인 3개 미만 mock → 버튼 비활성화, 3개 이상 → 버튼 활성화
- E2E (Detox): "여행기 생성" 탭 → 텍스트 표시 → 복사 버튼 동작 확인

---

### US-010: 여행 후 — 지도 경로 애니메이션 리플레이

**Description:** 여행자로서, 체크인 순서대로 지도 위 경로가 애니메이션으로 재생되는 것을 보고 싶다.

**Acceptance Criteria:**
- [ ] TripScreen 지도에 "리플레이" 버튼
- [ ] 탭 시 체크인 순서대로 마커가 순차적으로 나타나며 경로선이 그려짐
- [ ] 재생 속도 조절 또는 일시정지 가능
- [ ] 체크인 2개 미만이면 버튼 미표시
- [ ] Typecheck 통과

**테스트 힌트:**
- 컴포넌트: 체크인 2개 미만 mock → 리플레이 버튼 미렌더링
- 단위: 애니메이션 타이머 로직 — `jest.useFakeTimers()`로 마커 순차 표시 순서 검증

---

### US-011: 여행 후 — "1년 전 오늘" 리마인더

**Description:** 여행자로서, 1년 전 오늘 방문했던 곳을 알림으로 받아 추억을 되새기고 싶다.

**Acceptance Criteria:**
- [ ] 매일 오전 9시, 정확히 1년 전 체크인이 있으면 로컬 알림 발송
- [ ] 알림 메시지: "1년 전 오늘 [장소명]에 가셨었어요" + 사진 (있으면)
- [ ] 알림 탭 → 해당 체크인이 포함된 TripScreen으로 이동
- [ ] 설정 화면에서 ON/OFF 가능
- [ ] Typecheck 통과

**테스트 힌트:**
- 단위: `findCheckinOneYearAgo(checkins, today)` — 정확히 1년 전 체크인 반환, 없으면 null
- 단위: `scheduleAnniversaryNotification(checkin)` — `expo-notifications` mock으로 스케줄 파라미터 검증

---

### US-013: 여행 없이 체크인 (Default Trip)

**Status:** ✅ 완료

**Description:** 여행자로서, 여행을 먼저 만들지 않고 바로 체크인을 기록한 뒤 나중에 원하는 여행에 추가하고 싶다.

**Acceptance Criteria:**
- [x] 탭바에 "+체크인" 탭 추가 (+여행 탭과 나란히 배치) — 탭 시 `trip_id` 없이 `CheckinFormScreen` 열림
- [x] `trip_id` 없이 체크인 저장 시 서버에서 `{userId}_default` 이름의 default trip 자동 조회/생성 후 할당
- [x] Default trip은 여행 목록(HomeScreen)에 표시되지 않음
- [x] Default trip에 속한 체크인은 `CheckinsScreen`에서 "미할당" 뱃지와 함께 표시
- [x] `CheckinFormScreen`에 여행 선택 드롭다운 추가 — 미할당 체크인을 특정 여행으로 이동 가능
- [x] `CheckinCard` 롱프레스 → "여행으로 이동" 액션 → 여행 선택 시트 → `trip_id` 업데이트
- [x] 여행 지정 완료 후 "미할당" 뱃지 즉시 제거
- [x] `trips` 테이블에 `is_default boolean DEFAULT false` 컬럼 추가
- [x] `POST /api/checkins` — `trip_id` 선택적 허용, 미전달 시 default trip 자동 조회/생성
- [x] `GET /api/trips` — `is_default = false` 필터 적용
- [x] `PATCH /api/checkins/[id]` — `trip_id` 변경 허용 (여행 이동)
- [x] Typecheck 통과

**테스트 힌트:**
- E2E (Detox): +체크인 탭 → 저장 → CheckinsScreen "미할당" 뱃지 확인 → 여행 선택 → 뱃지 제거 확인
- API (`checkins/__tests__/route.test.ts`): `trip_id` 없이 POST → 응답에 default trip id 할당 확인
- API (`trips/__tests__/route.test.ts`): GET 응답에 `is_default=true` 여행 미포함 확인
- API (`checkins/[id]/__tests__/route.test.ts`): PATCH로 `trip_id` 변경 성공 확인
- 단위: `buildDefaultTripName(userId)` — `{userId}_default` 형식 반환

---

### US-012: 여행 스트릭

**Description:** 여행자로서, 이번 달 새로운 곳을 얼마나 방문했는지 확인하며 동기부여를 받고 싶다.

**Acceptance Criteria:**
- [ ] 홈 화면 또는 설정에 이번 달 신규 장소 방문 수 표시
- [ ] 신규 장소 기준: 동일 `place_id`로 처음 체크인한 경우
- [ ] 전월 대비 증감 표시 (▲2, ▼1)
- [ ] 클라이언트에서 체크인 데이터 기반 계산
- [ ] Typecheck 통과

**테스트 힌트:**
- 단위: `calcMonthlyStreak(checkins, month)` — 동일 `place_id` 첫 체크인만 카운트, 전월 대비 증감 반환
- 컴포넌트: 스트릭 수치 렌더링, ▲/▼ 표시 조건 확인

---

## Functional Requirements

- FR-1 (US-001): 체크인 저장 직후 `POST /api/checkins/[id]/comment`를 호출해 Gemini 코멘트를 받아 토스트로 표시한다
  - 테스트: `checkins/[id]/comment/__tests__/route.test.ts` — 성공 시 `{ comment }` 반환, Gemini 오류 시 500
- FR-2 (US-001): AI 코멘트는 장소명·카테고리·방문 횟수·시간대 컨텍스트를 포함한 프롬프트로 생성하며 40자 이내로 제한한다
  - 테스트: `lib/__tests__/checkinComment.test.ts` — `buildCheckinCommentPrompt` 출력 검증, 40자 초과 입력 시 truncate 확인
- FR-3 (US-002): Google Calendar 연동 사용자에게 다가오는 일정의 장소 기반 Places 추천을 제공한다
  - 테스트: 컴포넌트 테스트 — Calendar 연동/미연동 mock으로 카드 렌더링 여부 분기 확인
- FR-4 (US-003): 외부 날씨 API(Open-Meteo 또는 동등한 무료 API)를 연동해 당일 날씨 기반 조언을 표시한다
  - 테스트: 컴포넌트 테스트 — fetch mock 성공/실패로 날씨 카드 렌더링/미렌더링 분기 확인
- FR-5 (US-004): 과거 체크인 카테고리 빈도를 분석해 선호 카테고리 상위 2개를 추출하고 근처 장소를 추천한다
  - 테스트: `lib/__tests__/categoryPattern.test.ts` — `extractTopCategories` 빈도 정렬, 체크인 10개 미만 시 빈 배열
- FR-6 (US-005): `is_frequent = true` 여행의 체크인 위치 반경 200m 진입 시 로컬 알림을 발송한다 (하루 1회 제한)
  - 테스트: `lib/__tests__/proximity.test.ts` — `isWithinRadius(200)` 경계값, `shouldSendAlert` 하루 1회 제한
- FR-7 (US-006, US-007): `wishlists` 테이블을 추가하고, 위시리스트 항목 반경 500m 진입 시 로컬 알림을 발송한다
  - 테스트: `wishlists/__tests__/route.test.ts` — CRUD 응답 형상, 401; `lib/__tests__/proximity.test.ts` — `isWithinRadius(500)`
- FR-8 (US-008): TripScreen에 총 이동 거리·카테고리별 방문 수·체크인 수를 클라이언트에서 계산해 표시한다
  - 테스트: `lib/__tests__/tripStats.test.ts` — `calcTripStats` 거리 합산, 카테고리 집계, 체크인 2개 미만 시 null
- FR-9 (US-009): `POST /api/trips/[id]/story`에서 Gemini로 300자 내외 여행기와 하이라이트 한 줄을 생성한다
  - 테스트: `trips/[id]/story/__tests__/route.test.ts` — 응답에 `{ story, highlight }` 포함, Gemini mock 오류 시 500
- FR-10 (US-010): TripScreen 지도에서 체크인 순서대로 마커와 경로선이 애니메이션으로 재생되는 리플레이 기능을 제공한다
  - 테스트: 단위 — `jest.useFakeTimers()`로 마커 순차 표시 순서 검증; 컴포넌트 — 체크인 2개 미만 시 버튼 미렌더링
- FR-11 (US-011): 매일 오전 9시 1년 전 체크인이 있으면 로컬 알림을 발송한다
  - 테스트: `lib/__tests__/anniversary.test.ts` — `findCheckinOneYearAgo` 날짜 매칭, `expo-notifications` mock으로 스케줄 파라미터 검증
- FR-12 (US-012): 홈 화면에 이번 달 신규 장소 방문 수(스트릭)를 표시한다
  - 테스트: `lib/__tests__/streak.test.ts` — `calcMonthlyStreak` 동일 `place_id` 중복 제거, 전월 대비 증감 반환
- FR-13 (US-013): `POST /api/checkins`에서 `trip_id` 미전달 시 `{userId}_default` default trip을 자동 조회/생성하여 할당한다
  - 테스트: `checkins/__tests__/route.test.ts` — `trip_id` 없이 POST → 응답 체크인의 `trip_id`가 default trip id, 두 번째 호출 시 동일 trip id 재사용
- FR-14 (US-013): `GET /api/trips`는 `is_default = false` 조건으로 default trip을 목록에서 제외한다
  - 테스트: `trips/__tests__/route.test.ts` — `is_default=true` 여행 포함 mock → GET 응답에 미포함 확인
- FR-15 (US-013): `PATCH /api/checkins/[id]`로 `trip_id` 변경을 허용해 미할당 체크인을 특정 여행으로 이동할 수 있다
  - 테스트: `checkins/[id]/__tests__/route.test.ts` — `trip_id` PATCH 성공, 타인 여행 id로 변경 시 403

---

## Non-Goals

- 자동 전화 발신 또는 AI 음성 통화 기능
- 소셜 기능 (좋아요, 댓글, 팔로우)
- 웹 앱 구현 (모바일 우선, 웹은 후속)
- 날씨 기반 경로 자동 재설계
- 실시간 교통 정보 연동
- 푸시 알림 (APNs 서버 푸시) — 로컬 알림으로 구현

---

## Technical Considerations

- **AI 코멘트**: 기존 `buildTripTaglinePrompt` / `normalizeTripTagline` 패턴 재활용. 프롬프트 톤 지침 공유.
  - 테스트: `buildCheckinCommentPrompt`를 API 호출과 분리된 순수 함수로 구현 → mock 없이 단위 테스트
- **날씨 API**: Open-Meteo (무료, API Key 불필요). `GET https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=weathercode,precipitation`
  - 테스트: `parseWeatherResponse(raw)` 순수 함수 단위 테스트 — WMO 코드 → 한국어 변환, 필드 누락 시 graceful 처리
- **로컬 알림**: `expo-notifications` + `expo-location` (background location). iOS `always` 위치 권한 필요. App Store 심사 시 사용 목적 명시 필요.
  - 테스트: `expo-notifications`를 mock으로 대체 → 스케줄 호출 파라미터(trigger 시각, body 형식) 단위 검증
- **위시리스트**: `wishlists` 테이블 신규 추가. RLS는 기존 trips 패턴 동일하게 적용.
  - 테스트: RLS는 현재 mock으로 대체 (통합 테스트는 향후 별도 Supabase 프로젝트 사용 시 추가)
- **여행 통계**: 서버 호출 없이 클라이언트에서 체크인 배열로 계산.
  - 테스트: `calcTripStats(checkins)` 순수 함수 → 입출력만 검증, mock 불필요
- **지도 애니메이션**: `react-native-maps`의 `Animated` API 또는 setInterval로 마커 순차 표시.
  - 테스트: 애니메이션 타이머 로직을 훅으로 분리 → `jest.useFakeTimers()`로 마커 인덱스 진행 순서 검증
- **1년 전 알림**: `expo-notifications` `scheduleNotificationAsync`로 매일 오전 9시 로컬 스케줄링.
  - 테스트: `findCheckinOneYearAgo(checkins, today)` 순수 함수 단위 테스트 — 날짜 경계값 (윤년 포함)
- **Default Trip**: `trips.is_default = true`로 식별. 이름은 `{userId}_default` 고정. user당 최대 1개. 첫 미할당 체크인 저장 시 서버에서 자동 생성. 일반 여행 목록 API에서 제외.
  - 테스트: `buildDefaultTripName(userId)` 순수 함수; `getOrCreateDefaultTrip` — Supabase mock으로 생성/재사용 분기 검증

---

## Success Metrics

- 체크인 후 AI 코멘트 노출률 90% 이상 (API 실패 제외)
- 위시리스트 기능 사용자 중 50% 이상이 알림 후 체크인으로 전환
- 여행기 자동 생성 버튼 탭률 (체크인 3개 이상 여행 기준) 30% 이상
- "1년 전 오늘" 알림 탭률 40% 이상

---

## Open Questions

- 날씨 API를 서버(Vercel)에서 호출할지, 클라이언트에서 직접 호출할지 (키 불필요하므로 클라이언트 직접 호출 가능)
- 로컬 알림을 위한 `always` 위치 권한이 앱 심사에 미치는 영향 사전 검토 필요
- 여행기 생성 결과를 DB에 저장할지, 매번 생성할지 (저장 시 `trips.story` 컬럼 추가 필요)
- 스트릭 카운트를 홈 화면 어느 위치에 배치할지 (빠른 체크인 버튼 영역 vs 별도 위젯)
