# PRD: 여행 대표 장소 지정 및 체크인 자동 상속

## Introduction

같은 장소(예: 도쿄, 제주도)에서 여러 번 체크인할 때마다 매번 동일한 장소를 검색해야 하는 불편함을 없애기 위한 기능이다.

여행(Trip)에 대표 장소를 한 번 지정해두면, 이후 그 여행에서 생성하는 모든 체크인에 장소가 자동으로 채워진다. 이미 있는 체크인도 일괄 업데이트할 수 있다. 장소 검색은 기존 체크인과 동일하게 Google Places를 사용한다.

## Goals

- 여행에 대표 장소(Google Places)를 지정할 수 있다
- 신규 체크인 생성 시 여행의 장소가 기본값으로 미리 채워진다
- 기존 체크인에도 여행의 장소를 일괄 적용할 수 있다
- 장소 검색을 반복하는 횟수를 줄여 체크인 생성 속도를 높인다

## User Stories

### US-001: trips 테이블에 장소 필드 추가

**Description:** As a developer, I need to store a trip's representative place so it can be inherited by checkins.

**Acceptance Criteria:**
- [ ] trips 테이블에 다음 3개 컬럼 추가: `place` (text), `place_id` (text), `latitude` (float8), `longitude` (float8)
- [ ] Supabase Dashboard SQL Editor에서 migration 실행 성공
- [ ] `types/database.ts`의 `Trip`, `TripInsert`, `TripFormData` 타입에 4개 필드 추가
- [ ] Typecheck 통과

### US-002: 여행 생성/수정 폼에 장소 검색 추가

**Description:** As a user, I want to search and set a representative place when creating or editing a trip, so I don't have to repeat the search for every checkin.

**Acceptance Criteria:**
- [ ] `TripFormModal`에 장소 검색 섹션이 추가된다
- [ ] "장소 추가" 버튼을 탭하면 체크인 폼의 장소 검색과 동일한 Google Places 자동완성 UI가 인라인으로 펼쳐진다 (기존 `usePlaceSearch` hook 재사용)
- [ ] 장소 선택 후 폼에 선택한 장소 이름(main_text + secondary_text)이 표시된다
- [ ] 선택한 장소에는 X 버튼이 표시되어 장소를 지워 초기화할 수 있다
- [ ] 장소 없이도 여행 저장이 가능하다 (장소 필드는 선택 사항)
- [ ] 여행 수정 시 기존 장소가 표시된다
- [ ] `POST /api/trips`, `PATCH /api/trips/[id]`에서 `place`, `place_id`, `latitude`, `longitude` 처리
- [ ] Typecheck 통과
- [ ] 브라우저에서 여행 생성/수정 시 장소 검색 및 선택 동작 확인

### US-003: 신규 체크인 생성 시 여행 장소 자동 제안

**Description:** As a user, I want the trip's place to be pre-filled when I create a new checkin, so I can save without re-searching the same location.

**Acceptance Criteria:**
- [ ] 여행에 대표 장소가 있을 때 체크인 생성 폼 진입 시 장소, 위도/경도가 여행의 값으로 미리 채워진다
- [ ] 채워진 장소는 사용자가 자유롭게 수정하거나 지울 수 있다 (overridable)
- [ ] 여행에 대표 장소가 없으면 기존 동작과 동일하게 빈 상태로 시작한다
- [ ] `checkin/page.tsx` 또는 관련 컴포넌트에서 trip 데이터를 참조하여 `CheckinForm`의 초기값으로 전달한다
- [ ] Typecheck 통과
- [ ] 브라우저에서 여행 장소가 체크인 폼에 미리 채워지는 것 확인

### US-004: 기존 체크인 장소 일괄 업데이트

**Description:** As a user, I want to apply the trip's place to all existing checkins at once, so past checkins also get consistent location data without individual edits.

**Acceptance Criteria:**
- [ ] 여행에 대표 장소가 지정되어 있고 체크인이 1개 이상 있을 때, 여행 상세(또는 여행 수정 완료 후)에 "체크인 장소 일괄 적용" 버튼이 표시된다
- [ ] 버튼 탭 시 확인 다이얼로그가 표시된다: "[장소명]을 이 여행의 모든 체크인(N개)에 적용합니다. 기존 장소가 덮어씌워집니다."
- [ ] 확인 시 해당 여행의 모든 체크인에 `place`, `place_id`, `latitude`, `longitude`가 여행의 값으로 일괄 업데이트된다
- [ ] `PATCH /api/checkins/bulk` (신규) 또는 `POST /api/trips/[id]/apply-place` API로 처리한다
- [ ] 업데이트 중 로딩 상태가 표시된다
- [ ] 완료 후 성공 토스트/메시지가 표시되고 체크인 목록이 갱신된다
- [ ] Typecheck 통과
- [ ] 브라우저에서 일괄 적용 동작 확인

### US-005: 여행 카드/상세에 대표 장소 표시

**Description:** As a user, I want to see the representative place on the trip card and detail view so I can quickly identify what location a trip is associated with.

**Acceptance Criteria:**
- [ ] 여행 목록의 각 카드에 대표 장소가 있으면 장소 이름이 표시된다 (없으면 표시 안 함)
- [ ] 여행 상세 페이지/뷰에도 대표 장소가 표시된다
- [ ] Typecheck 통과
- [ ] 브라우저에서 장소 이름 표시 확인

## Functional Requirements

- FR-1: `trips` 테이블에 `place` (text, nullable), `place_id` (text, nullable), `latitude` (float8, nullable), `longitude` (float8, nullable) 컬럼을 추가한다
- FR-2: 여행 생성/수정 폼(`TripFormModal`)에 Google Places 자동완성 장소 검색 UI를 추가한다. 기존 체크인 폼의 `usePlaceSearch` hook을 재사용한다
- FR-3: 장소 선택 시 `place`(장소 전체 텍스트), `place_id`, `latitude`, `longitude`를 함께 저장한다. `latitude`/`longitude`는 `places.getDetails` API로 조회하여 저장한다
- FR-4: 체크인 생성 폼 초기화 시, 해당 여행에 대표 장소가 있으면 `place`, `place_id`, `latitude`, `longitude`를 초기값으로 주입한다
- FR-5: "체크인 장소 일괄 적용" 액션은 확인 다이얼로그를 통해 명시적 동의를 받은 후 실행한다. 취소 선택 시 아무 것도 변경하지 않는다
- FR-6: 일괄 적용 API는 해당 trip_id에 속한 모든 체크인의 `place`, `place_id`, `latitude`, `longitude`를 덮어쓴다
- FR-7: 여행 목록 카드와 여행 상세에서 대표 장소 이름을 표시한다

## Non-Goals

- 여행에 여러 개의 장소를 지정하는 기능
- 지도에서 영역을 그려서 장소를 지정하는 기능
- 체크인별 장소를 여행 장소와 연동 상태(linked/unlinked)로 별도 관리하는 기능
- 여행 장소 변경 시 체크인 자동 재동기화 (일괄 적용은 수동 액션)
- 장소 기반 여행 추천 또는 검색

## Design Considerations

- 장소 검색 UI는 기존 `CheckinFormPlacePanel` 컴포넌트와 시각적으로 일관성을 유지한다
- `TripFormModal`에서 장소 검색 영역은 날짜 섹션 아래, 공개 토글 위에 배치한다
- "체크인 장소 일괄 적용" 버튼은 파괴적 액션이므로 주황색이 아닌 중립적인 스타일(예: gray outline)로 표시하고, 확인 다이얼로그에서 장소명과 영향받는 체크인 수를 명시한다
- 여행 카드의 장소 이름은 작은 보조 텍스트(12px, `var(--tc-warm-faint)`)로 제목 아래에 표시한다

## Technical Considerations

- `places.getDetails`로 위도/경도를 가져오려면 Google Places Details API 호출이 필요하다. 기존 `usePlaceSearch`가 자동완성(Autocomplete)만 처리하므로, TripFormModal에서 장소 선택 시 `PlacesService.getDetails`를 추가 호출해야 한다
- 기존 checkin 폼에서 장소 선택 시에도 이미 동일한 패턴을 사용 중인지 확인 후 재사용한다 (`checkin-form/hooks/` 참고)
- `POST /api/trips/[id]/apply-place` 엔드포인트를 신규 생성하거나, `/api/checkins` PATCH bulk 처리를 구현한다. 구현 단순성을 고려해 `POST /api/trips/[id]/apply-place`를 권장한다
- Supabase migration은 Dashboard SQL Editor에서 실행한다 (CLI 아님)

## Success Metrics

- 같은 장소에서 체크인 생성 시 장소 검색 탭 횟수가 0회 (여행 장소 상속으로 스킵 가능)
- 일괄 적용 후 해당 여행의 모든 체크인에 동일한 place_id가 저장됨

## Open Questions

- `latitude`/`longitude`를 Google Places Details API로 가져올 때 API 비용이 발생한다. 기존 체크인 폼은 어떻게 처리하고 있는지 확인 필요 (`checkin-form/hooks/` 내 `usePlaceSearch` 확인)
- 여행 장소를 지운 경우(초기화), 기존에 여행 장소에서 상속받은 체크인들은 그대로 유지할지 물어볼 것인가, 아니면 자동으로 지울 것인가? (현재 PRD에서는 여행 장소 삭제가 기존 체크인에 영향 없음으로 가정)
