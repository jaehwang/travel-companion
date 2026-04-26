# 모바일 컴포넌트 설계 명세

이 문서는 `apps/mobile/src/components/` 아래 컴포넌트의 동작 요구사항을 정의한다.  
각 명세 항목은 유닛 테스트 케이스와 1:1 대응을 목표로 작성한다.

## 개발 순서 원칙

```
동작 명세 작성 → 유닛 테스트 작성 → 구현
```

새 컴포넌트를 추가하거나 기존 동작을 변경할 때는 이 문서에 명세를 먼저 추가한 뒤 테스트와 구현을 진행한다.

---

## CheckinCard

**역할**: 단일 체크인을 카드 형태로 표시한다. 카테고리별 색상 강조, 사진 뷰어 진입, 지도 연동, 수정·삭제 메뉴를 제공한다.

**위치**: `components/CheckinCard.tsx`  
**테스트**: `components/__tests__/CheckinCard.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `checkin` | `Checkin` | ✓ | 표시할 체크인 데이터 |
| `onEdit` | `(checkin: Checkin) => void` | — | 수정 핸들러. 없으면 메뉴 버튼 미표시 |
| `onDelete` | `(id: string) => void` | — | 삭제 핸들러. 없으면 메뉴 버튼 미표시 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `checkin.title`이 있을 때 | 해당 제목을 표시한다 |
| 2 | `checkin.title`이 없을 때 | `'이름 없는 장소'`를 표시한다 |
| 3 | 항상 | `checkin.category`에 대응하는 한글 카테고리 라벨을 표시한다 |
| 4 | `checkin.message`가 있을 때 | 메모 텍스트를 표시한다 |
| 5 | `checkin.message`가 없을 때 | 메모 영역을 표시하지 않는다 |
| 6 | `checkin.tags`가 4개 이상일 때 | 앞 3개만 표시하고, 나머지 수를 `+N`으로 표시한다 |
| 7 | `checkin.place_id`가 있을 때 | 장소 링크를 누르면 `query_place_id`를 포함한 Google Maps URL을 연다 |
| 8 | `checkin.place_id`가 없을 때 | 장소 링크를 누르면 좌표(`q=lat,lng`) 기반 Google Maps URL을 연다 |
| 9 | `onEdit`과 `onDelete`가 모두 없을 때 | 메뉴 버튼(`⋮`)을 표시하지 않는다 |
| 10 | `onEdit` 또는 `onDelete` 중 하나라도 있을 때 | 메뉴 버튼(`⋮`)을 표시한다 |
| 11 | 메뉴에서 '수정'을 선택했을 때 | `onEdit`에 현재 `checkin` 객체를 전달하여 호출한다 |
| 12 | 메뉴에서 '삭제'를 선택했을 때 | 삭제 확인 Alert를 띄운다 |

---

## TripCard

**역할**: 단일 여행을 카드 형태로 표시한다. 커버 사진, 날짜, 공개 여부, 자주 가는 곳 여부를 시각화하고 탭·메뉴 이벤트를 전달한다.

**위치**: `components/TripCard.tsx`  
**테스트**: `components/__tests__/TripCard.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `trip` | `Trip` | ✓ | 표시할 여행 데이터 |
| `onPress` | `() => void` | ✓ | 카드 탭 핸들러 |
| `onMenuPress` | `() => void` | — | 케밥 메뉴 핸들러. 없으면 메뉴 버튼 미표시 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | `trip.title`을 표시한다 |
| 2 | `trip.description`이 있을 때 | 설명 텍스트를 표시한다 |
| 3 | `trip.start_date`가 있을 때 | 날짜를 포맷하여 표시한다 |
| 4 | `start_date`와 `first_checkin_date` 모두 없을 때 | `'날짜 미정'`을 표시한다 |
| 5 | `trip.is_public`이 `true`일 때 | `'공개'` 배지를 표시한다 |
| 6 | `trip.is_public`이 `false`일 때 | `'비공개'` 배지를 표시한다 |
| 7 | `trip.is_frequent`이 `true`일 때 | `'자주 가는 곳'` 배지를 표시한다 |
| 8 | `trip.is_frequent`이 `false`일 때 | `'자주 가는 곳'` 배지를 표시하지 않는다 |
| 9 | 카드를 탭했을 때 | `onPress`를 호출한다 |
| 10 | `onMenuPress`가 있을 때 | 케밥 메뉴 버튼(`⋮`)을 표시한다 |
| 11 | 케밥 메뉴를 탭했을 때 | `onMenuPress`를 호출한다 |
| 12 | `onMenuPress`가 없을 때 | 케밥 메뉴 버튼을 표시하지 않는다 |

---

## SideDrawer

**역할**: 슬라이드-인 모달로 여행 목록을 표시하고 여행 전환과 새 여행 생성을 지원한다.

**위치**: `components/SideDrawer.tsx`  
**테스트**: `components/__tests__/SideDrawer.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `visible` | `boolean` | ✓ | 드로어 표시 여부 |
| `onClose` | `() => void` | ✓ | 닫기 핸들러 |
| `trips` | `Trip[]` | ✓ | 표시할 여행 목록 |
| `currentTripId` | `string` | ✓ | 현재 선택된 여행 ID |
| `onSelectTrip` | `(trip: Trip) => void` | ✓ | 여행 선택 핸들러 |
| `onCreateTrip` | `() => void` | ✓ | 새 여행 생성 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `visible`이 `true`일 때 | 전달된 모든 여행 제목을 목록으로 표시한다 |
| 2 | 여행의 `is_frequent`이 `true`일 때 | 해당 항목에 `'자주 가는 곳'` 배지를 표시한다 |
| 3 | 여행 항목을 탭했을 때 | `onSelectTrip`에 해당 `Trip` 객체를 전달하여 호출한다 |
| 4 | `'+ 새 여행 만들기'`를 탭했을 때 | `onCreateTrip`을 호출한다 |
| 5 | `visible`이 `false`일 때 | 아무것도 렌더링하지 않는다 |

---

## TripTaglineBanner

**역할**: 여행의 AI 생성 태그라인을 비동기로 불러와 표시한다. 로딩·완료·오류 상태를 구분하고 수동 새로고침을 지원한다.

**위치**: `components/TripTaglineBanner.tsx`  
**테스트**: `components/__tests__/TripTaglineBanner.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `tripId` | `string` | ✓ | 태그라인을 조회할 여행 ID |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 마운트 직후 (로딩 중) | `'두근, 두근...'` 텍스트를 표시한다 |
| 2 | `fetchTripTagline`이 문자열을 반환했을 때 | 반환된 태그라인 텍스트를 표시한다 |
| 3 | `fetchTripTagline`이 `null`을 반환했을 때 | 아무것도 렌더링하지 않는다 |
| 4 | `fetchTripTagline`이 오류를 던졌을 때 | 아무것도 렌더링하지 않는다 |
| 5 | 새로고침 버튼(`↺`)을 탭했을 때 | `fetchTripTagline`을 다시 호출하여 태그라인을 갱신한다 |

---

## CheckinFormToolbar

**역할**: 체크인 폼 하단에 위치하며 사진·장소·분류·시각 4가지 입력 항목의 활성화 상태를 시각화하고 각 항목의 입력 진입 버튼을 제공한다.

**위치**: `components/CheckinFormToolbar.tsx`  
**테스트**: `components/__tests__/CheckinFormToolbar.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `hasPhoto` | `boolean` | ✓ | 사진 입력 완료 여부 |
| `hasLocation` | `boolean` | ✓ | 장소 입력 완료 여부 |
| `hasCategory` | `boolean` | ✓ | 분류 입력 완료 여부 |
| `hasTime` | `boolean` | ✓ | 시각 입력 완료 여부 |
| `onPhoto` | `() => void` | ✓ | 사진 버튼 핸들러 |
| `onPlace` | `() => void` | ✓ | 장소 버튼 핸들러 |
| `onCategory` | `() => void` | ✓ | 분류 버튼 핸들러 |
| `onTime` | `() => void` | ✓ | 시각 버튼 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | 사진·장소·분류·시각 4개 버튼 레이블을 표시한다 |
| 2 | 대응하는 `has*` prop이 `true`일 때 | 버튼 레이블에 강조 색상(`#FF6B47`)을 적용한다 |
| 3 | 대응하는 `has*` prop이 `false`일 때 | 버튼 레이블에 기본 색상(`#C4B49A`)을 적용한다 |
| 4 | 사진 버튼을 탭했을 때 | `onPhoto`를 호출한다 |
| 5 | 장소 버튼을 탭했을 때 | `onPlace`를 호출한다 |
| 6 | 분류 버튼을 탭했을 때 | `onCategory`를 호출한다 |
| 7 | 시각 버튼을 탭했을 때 | `onTime`을 호출한다 |

---

## CategorySelector

**역할**: 모달 형태로 9가지 카테고리 목록을 표시하고 선택을 처리한다. 현재 선택된 카테고리를 시각적으로 강조한다.

**위치**: `components/CategorySelector.tsx`  
**테스트**: `components/__tests__/CategorySelector.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `visible` | `boolean` | ✓ | 모달 표시 여부 |
| `selected` | `string` | ✓ | 현재 선택된 카테고리 키 |
| `onSelect` | `(category: string) => void` | ✓ | 카테고리 선택 핸들러 |
| `onClose` | `() => void` | ✓ | 닫기 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `selected`에 해당하는 카테고리 항목 | 강조 색상(`color`, `fontWeight: '800'`) 및 배경 색을 적용한다 |
| 2 | 카테고리 항목을 탭했을 때 | `onSelect`를 먼저 호출한 뒤 `onClose`를 호출한다 |

---

## PlaceSearchPanel

**역할**: 모달 형태로 Google Places API 검색 인터페이스를 제공한다. 입력 디바운싱으로 불필요한 API 호출을 줄이고 선택된 장소의 상세 정보를 조회하여 전달한다.

**위치**: `components/PlaceSearchPanel.tsx`  
**테스트**: `components/__tests__/PlaceSearchPanel.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `visible` | `boolean` | ✓ | 모달 표시 여부 |
| `onClose` | `() => void` | ✓ | 닫기 핸들러 |
| `onPlaceSelected` | `(lat, lng, name, placeId) => void` | ✓ | 장소 선택 완료 핸들러 |
| `currentLat` | `number` | — | 현재 위치 위도 (검색 편향에 사용) |
| `currentLng` | `number` | — | 현재 위치 경도 (검색 편향에 사용) |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 입력이 없거나 1자 이하일 때 | `'장소 이름을 2자 이상 입력하세요'` 안내를 표시한다 |
| 2 | 2자 이상 입력 후 300ms 경과 | `searchPlaces`를 입력값과 현재 위치로 호출한다 |
| 3 | `searchPlaces`가 결과를 반환했을 때 | 결과 목록(메인 텍스트·보조 텍스트)을 표시한다 |
| 4 | 결과 항목을 탭했을 때 | `getPlaceDetails`로 상세 정보를 조회한 뒤 `onPlaceSelected(lat, lng, name, placeId)`를 호출한다 |
| 5 | `searchPlaces`가 빈 배열을 반환했을 때 | `'검색 결과가 없습니다'`를 표시한다 |
| 6 | 뒤로 버튼을 탭했을 때 | `onClose`를 호출한다 |
| 7 | X(지우기) 버튼을 탭했을 때 | 입력 값을 초기화한다 |

---

## TripFormSections — TripPlaceSection

**역할**: 여행 폼 내 대표 장소 입력 영역. 장소가 선택된 상태와 미선택 상태를 각각 다르게 표시한다.

**위치**: `components/TripFormSections.tsx`  
**테스트**: `components/__tests__/TripFormSections.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `place` | `string` | ✓ | 현재 선택된 장소명. 빈 문자열이면 미선택 상태 |
| `onClear` | `() => void` | ✓ | 장소 삭제 핸들러 |
| `onAdd` | `() => void` | ✓ | 장소 추가 진입 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `place`가 비어있지 않을 때 | 장소 이름을 표시한다 |
| 2 | `place`가 빈 문자열일 때 | `'장소 추가'` 버튼을 표시한다 |
| 3 | 장소가 선택된 상태에서 삭제 버튼을 탭했을 때 | `onClear`를 호출한다 |
| 4 | `'장소 추가'` 버튼을 탭했을 때 | `onAdd`를 호출한다 |

---

## TripFormSections — TripToggleSection

**역할**: 여행 폼 내 공개 여행·자주 가는 곳 두 가지 토글 스위치 영역.

**위치**: `components/TripFormSections.tsx`  
**테스트**: `components/__tests__/TripFormSections.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `isPublic` | `boolean` | ✓ | 공개 여행 여부 |
| `setIsPublic` | `(v: boolean) => void` | ✓ | 공개 여부 변경 핸들러 |
| `isFrequent` | `boolean` | ✓ | 자주 가는 곳 여부 |
| `setIsFrequent` | `(v: boolean) => void` | ✓ | 자주 가는 곳 변경 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | `'공개 여행'`과 `'자주 가는 곳'` 레이블을 표시한다 |
| 2 | 공개 스위치를 토글했을 때 | `setIsPublic`에 새 값을 전달하여 호출한다 |
| 3 | 자주 가는 곳 스위치를 토글했을 때 | `setIsFrequent`에 새 값을 전달하여 호출한다 |

---

## TripFormModal

**역할**: 여행 생성·수정 폼 모달. 제목·날짜·장소·공개 여부·자주 가는 곳 설정을 입력받고 저장 시 `onSubmit`으로 전달한다.

**위치**: `components/TripFormModal.tsx`  
**테스트**: `components/__tests__/TripFormModal.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `visible` | `boolean` | ✓ | 모달 표시 여부 |
| `onClose` | `() => void` | ✓ | 닫기 핸들러 |
| `onSubmit` | `(data: TripFormData) => Promise<void>` | ✓ | 저장 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 위치 선택 완료 후 저장 버튼을 탭했을 때 | `onSubmit`에 선택된 `place`, `place_id`, `latitude`, `longitude`가 포함된 payload를 전달한다 |
| 2 | 위치 선택 모달의 닫기를 탭했을 때 | 위치 선택 모달을 닫고 폼 상태로 돌아간다 |

---

## QuickCheckinSheet

**역할**: 현재 위치 기반으로 가까운 체크인 목록을 조회하고, 같은 여행의 체크인을 그룹으로 묶어 빠른 체크인을 지원한다.

**위치**: `components/QuickCheckinSheet.tsx`  
**테스트**: `components/__tests__/QuickCheckinSheet.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `visible` | `boolean` | ✓ | 시트 표시 여부 |
| `onClose` | `() => void` | ✓ | 닫기 핸들러 |
| `onCheckedIn` | `(checkin: Checkin) => void` | — | 체크인 성공 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 같은 `trip_id`를 가진 체크인이 여러 개일 때 | 해당 여행으로 그룹화하고, 가장 최근 체크인을 `'현재: {제목} · {경과 시간}'` 형태로 표시한다 |
| 2 | 체크인 버튼을 탭했을 때 | `updateCheckin`으로 `checked_in_at`을 현재 시각으로 갱신하고 `onCheckedIn`과 `onClose`를 순서대로 호출한다 |
| 3 | 위치 권한이 거부되었을 때 | `'위치 권한이 필요합니다.'` 오류 메시지를 표시한다 |

---

## TodayCalendarSection

**역할**: 여행 종료일까지 남은 Google Calendar 일정을 조회하여 접이식 섹션으로 표시한다.

**위치**: `components/TodayCalendarSection.tsx`  
**테스트**: `components/__tests__/TodayCalendarSection.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `tripEndDate` | `string` | — | 여행 종료일 (ISO 날짜 문자열). 생략 시 당일 기준 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 일정 목록을 불러온 뒤 헤더를 탭했을 때 | 각 일정의 제목과 장소를 펼쳐 표시한다 |
| 2 | 일정이 없을 때 | 아무것도 렌더링하지 않는다 |

---

## CheckinMapBottomSheet

**역할**: 지도 화면 하단에서 체크인 목록을 그리드로 표시한다. 클러스터 선택 상태에 따라 전체 또는 부분 목록을 표시하며, 빈 상태와 헤더 표시 여부를 분기한다.

**위치**: `components/map/CheckinMapBottomSheet.tsx`  
**테스트**: `components/map/__tests__/CheckinMapBottomSheet.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `allCheckins` | `Checkin[]` | ✓ | 전체 체크인 목록 |
| `selectedCheckins` | `Checkin[] \| null` | ✓ | 클러스터 선택 시 해당 체크인만. `null`이면 전체 표시 |
| `headerTitle` | `string \| null` | ✓ | 클러스터 선택 시 표시할 헤더 제목 |
| `onCheckinPress` | `(checkin: Checkin) => void` | ✓ | 카드 탭 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `selectedCheckins`가 `null`일 때 | 헤더를 표시하지 않는다 |
| 2 | `selectedCheckins`가 있고 `headerTitle`이 있을 때 | 헤더와 제목을 표시한다 |
| 3 | `selectedCheckins`가 `null`일 때 | `allCheckins` 전체를 그리드에 표시한다 |
| 4 | `selectedCheckins`가 배열일 때 | 해당 체크인만 그리드에 표시한다 |
| 5 | 체크인 카드를 탭했을 때 | `onCheckinPress`에 해당 `Checkin` 객체를 전달하여 호출한다 |
| 6 | `allCheckins`가 빈 배열일 때 | 빈 상태 메시지를 표시한다 |
| 7 | `selectedCheckins`가 빈 배열일 때 | 빈 상태 메시지를 표시한다 |

---

## CheckinMapMarker

**역할**: 지도 위 단일 체크인의 위치 마커. 사진이 있으면 썸네일을, 없으면 카테고리 아이콘을 표시한다. 선택 상태에 따라 테두리 색상을 구분한다.

**위치**: `components/map/CheckinMapMarker.tsx`  
**테스트**: `components/map/__tests__/CheckinMapMarker.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `checkin` | `Checkin` | ✓ | 표시할 체크인 데이터 |
| `selected` | `boolean` | ✓ | 선택 상태 여부 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `checkin.photo_url`이 있을 때 | 해당 URL의 이미지를 렌더링한다 |
| 2 | `checkin.photo_url`이 없을 때 | 카테고리 아이콘을 표시하고 이미지를 표시하지 않는다 |
| 3 | `selected`가 `true`일 때 | 마커 원형 테두리에 파란색(`#3B82F6`)을 적용한다 |
| 4 | `selected`가 `false`일 때 | 마커 원형 테두리에 흰색(`#FFFFFF`)을 적용한다 |
| 5 | 항상 | 마커 하단에 꼬리(tail) 요소를 렌더링한다 |
| 6 | `photo_url`도 없고 `category`도 없을 때 | 기본 아이콘을 표시한다 |

---

## ClusterMarker

**역할**: 지도 위 여러 체크인의 클러스터를 나타내는 마커. 단일 마커보다 크게 렌더링되며 포함된 체크인 수를 배지로 표시한다.

**위치**: `components/map/ClusterMarker.tsx`  
**테스트**: `components/map/__tests__/ClusterMarker.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `count` | `number` | ✓ | 클러스터에 포함된 체크인 수 |
| `photoUrl` | `string \| undefined` | ✓ | 대표 사진 URL |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | `count` 숫자를 배지에 표시한다 |
| 2 | `photoUrl`이 있을 때 | 해당 URL의 이미지를 렌더링한다 |
| 3 | `photoUrl`이 없을 때 | 아이콘을 표시하고 이미지를 표시하지 않는다 |
| 4 | 항상 | 카운트 배지에 파란 배경색(`#3B82F6`)을 적용한다 |
| 5 | 항상 | 마커 크기(width, height)가 단일 마커(52px)보다 크다 |
