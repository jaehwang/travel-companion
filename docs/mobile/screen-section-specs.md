# 모바일 화면 서브컴포넌트 설계 명세

화면(Screen) 파일에서 분리된 서브컴포넌트와 섹션 컴포넌트의 동작 요구사항을 정의한다.  
각 명세 항목은 유닛 테스트 케이스와 1:1 대응을 목표로 작성한다.

## 개발 순서 원칙

```
동작 명세 작성 → 유닛 테스트 작성 → 구현
```

새 서브컴포넌트를 추가하거나 기존 동작을 변경할 때는 이 문서에 명세를 먼저 추가한 뒤 테스트와 구현을 진행한다.

---

## FormHeader

**역할**: 체크인 폼 상단 헤더. 아바타, 여행 선택(또는 여행 이름 고정 표시), 취소·저장 버튼을 제공한다.

**위치**: `screens/checkin-form/sections/FormHeader.tsx`  
**테스트**: `screens/checkin-form/sections/__tests__/FormHeader.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `paramTripId` | `string \| undefined` | — | 라우트에서 미리 지정된 여행 ID. 있으면 여행 선택 목록 숨김 |
| `tripTitle` | `string \| undefined` | — | 고정 표시할 여행 제목 |
| `trips` | `Trip[]` | ✓ | 선택 목록에 표시할 여행 배열 |
| `selectedTripId` | `string \| undefined` | — | 현재 선택된 여행 ID |
| `onSelectTripId` | `(id: string \| undefined) => void` | ✓ | 여행 선택 핸들러 |
| `isEditMode` | `boolean` | ✓ | 수정 모드 여부 |
| `isSubmitting` | `boolean` | ✓ | 제출 진행 중 여부 |
| `canSubmit` | `boolean` | ✓ | 저장 버튼 활성화 여부 |
| `onCancel` | `() => void` | ✓ | 취소 핸들러 |
| `onSubmit` | `() => void` | ✓ | 저장 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `paramTripId`가 없을 때 | 여행 선택 목록(`trip-selector`)을 표시한다 |
| 2 | `paramTripId`가 있을 때 | 여행 선택 목록 대신 `tripTitle` 텍스트를 표시한다 |
| 3 | 취소 버튼을 탭했을 때 | `onCancel`을 호출한다 |
| 4 | 저장 버튼을 탭했을 때 | `onSubmit`을 호출한다 |
| 5 | `isEditMode=false`일 때 | 저장 버튼에 `'체크인'` 레이블을 표시한다 |
| 6 | `isEditMode=true`일 때 | 저장 버튼에 `'저장'` 레이블을 표시한다 |
| 7 | `isSubmitting=true`일 때 | 저장 버튼의 텍스트를 숨기고 로딩 인디케이터를 표시한다 |

---

## NoteSection

**역할**: 체크인 메모 입력 필드. 멀티라인 텍스트 입력을 제공한다.

**위치**: `screens/checkin-form/sections/NoteSection.tsx`  
**테스트**: `screens/checkin-form/sections/__tests__/NoteSection.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `value` | `string` | ✓ | 현재 입력 값 |
| `onChangeText` | `(text: string) => void` | ✓ | 텍스트 변경 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | `'이 순간을 기록해보세요...'` placeholder를 표시한다 |
| 2 | `value`가 있을 때 | 해당 텍스트를 표시한다 |
| 3 | 텍스트를 입력했을 때 | `onChangeText`에 새 텍스트를 전달하여 호출한다 |

---

## TagInput

**역할**: 체크인 태그 입력 및 추천 표시. 직접 입력, AI 추천 태그, 이전 사용 태그 제안을 통합하여 제공한다.

**위치**: `screens/checkin-form/sections/TagInput.tsx`  
**테스트**: `screens/checkin-form/sections/__tests__/TagInput.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `tags` | `string[]` | ✓ | 현재 선택된 태그 목록 |
| `suggestions` | `string[]` | ✓ | 이전에 사용한 태그 제안 |
| `aiSuggestions` | `string[]` | — | AI가 추천한 태그 (기본값 `[]`) |
| `onAddTag` | `(tag: string) => void` | ✓ | 태그 추가 핸들러 |
| `onRemoveTag` | `(tag: string) => void` | ✓ | 태그 제거 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `tags`에 항목이 있을 때 | 각 태그를 `#태그명` 형태로 표시한다 |
| 2 | 입력 후 추가 버튼을 탭했을 때 | `onAddTag`에 입력 텍스트를 전달하여 호출한다 |
| 3 | 입력 텍스트에 `#` 접두사가 있을 때 | 접두사를 제거한 태그명으로 `onAddTag`를 호출한다 |
| 4 | 이미 선택된 태그와 동일한 입력일 때 | `onAddTag`를 호출하지 않는다 |
| 5 | `aiSuggestions`에 미선택 항목이 있을 때 | 해당 항목을 AI 추천 칩으로 표시한다 |
| 6 | `aiSuggestions` 항목이 이미 `tags`에 있을 때 | 해당 항목을 AI 추천 칩으로 표시하지 않는다 |
| 7 | AI 추천 칩을 탭했을 때 | `onAddTag`에 해당 태그를 전달하여 호출한다 |
| 8 | `suggestions`에 AI 추천과 중복되지 않는 항목이 있을 때 | 해당 항목을 제안 칩으로 표시한다 |
| 9 | `suggestions` 항목이 `aiSuggestions`에 있을 때 | 해당 항목을 제안 칩으로 표시하지 않는다 |
| 10 | 제안 칩을 탭했을 때 | `onAddTag`에 해당 태그를 전달하여 호출한다 |
| 11 | 선택된 태그 칩을 탭했을 때 | `onRemoveTag`에 해당 태그를 전달하여 호출한다 |

---

## TimePickerSection

**역할**: 체크인 시각 선택 섹션. 날짜·시간 피커와 지정 시각 삭제 기능을 제공한다.

**위치**: `screens/checkin-form/sections/TimePickerSection.tsx`  
**테스트**: `screens/checkin-form/sections/__tests__/TimePickerSection.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `checkedInAt` | `Date \| null` | ✓ | 현재 지정된 시각. null이면 지정 없음 |
| `onClose` | `() => void` | ✓ | 완료 핸들러 |
| `onClear` | `() => void` | ✓ | 시각 지정 삭제 핸들러 |
| `onChangeDate` | `(date: Date) => void` | ✓ | 날짜 변경 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | `'언제 방문했나요?'` 제목을 표시한다 |
| 2 | `'완료'` 버튼을 탭했을 때 | `onClose`를 호출한다 |
| 3 | `checkedInAt`이 `Date` 객체일 때 | `'시각 지정 삭제'` 버튼을 표시한다 |
| 4 | `checkedInAt`이 `null`일 때 | `'시각 지정 삭제'` 버튼을 표시하지 않는다 |
| 5 | `'시각 지정 삭제'` 버튼을 탭했을 때 | `onClear`를 호출한다 |

---

## TripHeader

**역할**: 여행 상세 화면의 상단 헤더. 드로어 열기, 여행 옵션 메뉴, 설정 화면 진입을 제공한다.

**위치**: `screens/trip/TripHeader.tsx`  
**테스트**: `screens/trip/__tests__/TripHeader.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | `string` | ✓ | 현재 여행 제목 |
| `avatarUrl` | `string \| undefined` | — | 사용자 아바타 이미지 URL |
| `onOpenDrawer` | `() => void` | ✓ | 사이드 드로어 열기 핸들러 |
| `onTripOptions` | `() => void` | ✓ | 여행 옵션 메뉴 핸들러 |
| `onNavigateSettings` | `() => void` | ✓ | 설정 화면 이동 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | 여행 제목을 표시한다 |
| 2 | 햄버거 버튼(`≡`)을 탭했을 때 | `onOpenDrawer`를 호출한다 |
| 3 | 옵션 버튼을 탭했을 때 | `onTripOptions`를 호출한다 |
| 4 | `avatarUrl`이 없을 때 | 기본 아바타 아이콘을 표시한다 |

---

## TripCheckinList

**역할**: 여행 상세 화면의 체크인 목록. 날짜별 구분선, 정렬 토글, 로딩·에러·빈 상태를 표시한다.

**위치**: `screens/trip/TripCheckinList.tsx`  
**테스트**: `screens/trip/__tests__/TripCheckinList.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `loading` | `boolean` | ✓ | 로딩 상태 |
| `refreshing` | `boolean` | ✓ | 당겨서 새로고침 상태 |
| `error` | `string \| null` | ✓ | 에러 메시지 |
| `groupedData` | `ListItem[]` | ✓ | 날짜 구분선과 체크인이 섞인 렌더 데이터 |
| `filteredCheckins` | `Checkin[]` | ✓ | 현재 표시 중인 체크인 배열 (개수 표시용) |
| `sortOrder` | `'newest' \| 'oldest'` | ✓ | 현재 정렬 순서 |
| `onSortToggle` | `() => void` | ✓ | 정렬 전환 핸들러 |
| `onRefresh` | `() => void` | ✓ | 새로고침 핸들러 |
| `onEditCheckin` | `(checkin: Checkin) => void` | ✓ | 수정 핸들러 |
| `onDeleteCheckin` | `(id: string) => void` | ✓ | 삭제 핸들러 |
| `ListHeaderComponent` | `ReactElement \| null` | ✓ | 목록 상단에 삽입할 컴포넌트 |
| `scrollToCheckinId` | `string` | — | 자동 스크롤할 체크인 ID |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `loading=true`이고 `refreshing=false`일 때 | 체크인 목록 대신 로딩 인디케이터를 표시한다 |
| 2 | `error`가 있을 때 | 에러 메시지를 표시한다 |
| 3 | 항상 | `'기록 N곳'` 형태로 현재 체크인 개수를 표시한다 |
| 4 | `sortOrder='newest'`일 때 | 정렬 버튼에 `'최신순 ↓'`을 표시한다 |
| 5 | `sortOrder='oldest'`일 때 | 정렬 버튼에 `'오래된순 ↑'`을 표시한다 |
| 6 | 정렬 버튼을 탭했을 때 | `onSortToggle`을 호출한다 |
| 7 | `groupedData`가 비어있을 때 | `'아직 체크인이 없습니다'` 빈 상태 메시지를 표시한다 |
| 8 | `groupedData`에 날짜 항목이 있을 때 | 날짜 구분선 레이블을 표시한다 |

---

## CheckinGridCard

**역할**: 체크인 목록 화면의 그리드 카드. 사진·카테고리 아이콘·여행명·태그를 표시하고 수정·삭제 메뉴를 제공한다.

**위치**: `screens/checkins/CheckinGridCard.tsx`  
**테스트**: `screens/checkins/__tests__/CheckinGridCard.test.tsx`

**유틸리티 함수**

| 함수 | 설명 |
|------|------|
| `formatDateTime(dateStr: string): string` | ISO 날짜 문자열을 `M/D(요일) 오전/오후 H:MM` 형태로 변환한다 |

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `checkin` | `Checkin` | ✓ | 표시할 체크인 데이터 |
| `tripMap` | `Map<string, Trip>` | ✓ | trip_id → Trip 매핑. 키가 없으면 미할당 체크인으로 처리 |
| `onPress` | `(checkin, trip) => void` | ✓ | 카드 탭 핸들러 |
| `onLongPress` | `(checkin) => void` | ✓ | 카드 길게 탭 핸들러 |
| `onEdit` | `(checkin) => void` | ✓ | 수정 핸들러 |
| `onDelete` | `(id: string) => void` | ✓ | 삭제 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `checkin.title`이 있을 때 | 해당 제목을 표시한다 |
| 2 | `checkin.title`이 없을 때 | `'이름 없는 장소'`를 표시한다 |
| 3 | 항상 | 카테고리 아이콘과 한글 레이블을 카드 상단에 표시한다 |
| 4 | `tripMap`에 해당 여행이 있을 때 | 여행 제목을 표시한다 |
| 5 | `tripMap`에 해당 여행이 없을 때 | `'미할당'` 배지를 표시한다 |
| 5 | `checkin.tags`가 3개 이상일 때 | 앞 2개만 표시하고 나머지를 `+N`으로 표시한다 |
| 6 | 카드를 탭했을 때 | `onPress`에 `checkin`과 해당 `Trip` 객체를 전달하여 호출한다 |
| 7 | 카드를 길게 탭했을 때 | `onLongPress`에 `checkin`을 전달하여 호출한다 |
| 8 | 메뉴에서 `'수정'`을 선택했을 때 | `onEdit`에 `checkin`을 전달하여 호출한다 |
| 9 | 메뉴에서 `'삭제'`를 선택했을 때 | 삭제 확인 Alert를 표시한다 |

---

## MoveCheckinModal

**역할**: 체크인을 다른 여행으로 이동할 때 여행 선택 모달을 표시한다.

**위치**: `screens/checkins/MoveCheckinModal.tsx`  
**테스트**: `screens/checkins/__tests__/MoveCheckinModal.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `visible` | `boolean` | ✓ | 모달 표시 여부 |
| `assignableTrips` | `Trip[]` | ✓ | 이동 가능한 여행 목록 |
| `onClose` | `() => void` | ✓ | 닫기 핸들러 |
| `onMoveToTrip` | `(tripId: string) => void` | ✓ | 여행 선택 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `visible=true`일 때 | `assignableTrips` 목록의 제목을 표시한다 |
| 2 | `is_frequent` 여행이 있을 때 | `'자주 가는 곳'` 배지를 표시한다 |
| 3 | `assignableTrips`가 비어있을 때 | `'이동할 수 있는 여행이 없습니다'`를 표시한다 |
| 4 | 여행 항목을 탭했을 때 | `onMoveToTrip`에 해당 `tripId`를 전달하여 호출한다 |
| 5 | 닫기 버튼을 탭했을 때 | `onClose`를 호출한다 |
| 6 | `visible=false`일 때 | 아무것도 렌더링하지 않는다 |

---

## HomeQuickCheckinCard

**역할**: 홈 화면의 빠른 체크인 진입 버튼. 현재 근처 여행 상태를 표시한다.

**위치**: `screens/home/HomeScreenSections.tsx`  
**테스트**: `screens/home/__tests__/HomeScreenSections.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `statusText` | `string` | ✓ | 현재 근처 여행 상태 텍스트 |
| `isActive` | `boolean` | ✓ | 활성 상태 여부 (강조 색상 적용) |
| `onPress` | `() => void` | ✓ | 탭 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | `statusText`를 표시한다 |
| 2 | 항상 | `'자주 가는 곳에 체크인하기'` 레이블을 표시한다 |
| 3 | 카드를 탭했을 때 | `onPress`를 호출한다 |

---

## HomeTripList

**역할**: 홈 화면의 여행 목록. 로딩·에러·빈 상태를 처리하고 당겨서 새로고침을 지원한다.

**위치**: `screens/home/HomeScreenSections.tsx`  
**테스트**: `screens/home/__tests__/HomeScreenSections.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `trips` | `Trip[]` | ✓ | 표시할 여행 목록 |
| `loading` | `boolean` | ✓ | 로딩 상태 |
| `refreshing` | `boolean` | ✓ | 당겨서 새로고침 상태 |
| `error` | `string \| null` | ✓ | 에러 메시지 |
| `onRefresh` | `() => Promise<void>` | ✓ | 새로고침 핸들러 |
| `reload` | `() => Promise<unknown>` | ✓ | 에러 후 재시도 핸들러 |
| `renderTrip` | `({ item: Trip }) => ReactElement` | ✓ | 여행 아이템 렌더러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `loading=true`이고 `refreshing=false`일 때 | 목록 대신 로딩 인디케이터를 표시한다 |
| 2 | `error`가 있을 때 | 에러 메시지를 표시한다 |
| 3 | `error`가 있을 때 | `'다시 시도'` 버튼을 표시한다 |
| 4 | `'다시 시도'`를 탭했을 때 | `reload`를 호출한다 |
| 5 | `trips`가 비어있을 때 | `'아직 여행이 없습니다'` 빈 상태 메시지를 표시한다 |

---

## SettingsHeader

**역할**: 설정 화면 상단 헤더. 돌아가기 버튼과 제목을 제공한다.

**위치**: `screens/settings/SettingsSections.tsx`  
**테스트**: `screens/settings/__tests__/SettingsSections.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `onBack` | `() => void` | ✓ | 뒤로가기 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | `'설정'` 제목을 표시한다 |
| 2 | `'돌아가기'`를 탭했을 때 | `onBack`을 호출한다 |

---

## SettingsProfileCard

**역할**: 설정 화면의 사용자 프로필 카드. 아바타, 이름, 이메일을 표시한다.

**위치**: `screens/settings/SettingsSections.tsx`  
**테스트**: `screens/settings/__tests__/SettingsSections.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `avatarUrl` | `string \| undefined` | — | 아바타 이미지 URL |
| `userName` | `string` | ✓ | 사용자 이름 |
| `userEmail` | `string` | ✓ | 사용자 이메일 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | `userEmail`을 표시한다 |
| 2 | `userName`이 있을 때 | 해당 이름을 표시한다 |
| 3 | `userName`이 빈 문자열일 때 | `'사용자'`를 표시한다 |
| 4 | `avatarUrl`이 없을 때 | 기본 아바타 아이콘을 표시한다 |

---

## SettingsCalendarSection

**역할**: Google Calendar 연동 상태를 표시하고 연동·해제를 수행한다.

**위치**: `screens/settings/SettingsSections.tsx`  
**테스트**: `screens/settings/__tests__/SettingsSections.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `calendarConnected` | `boolean` | ✓ | 연동 여부 |
| `calendarLoading` | `boolean` | ✓ | 연동 상태 로딩 중 여부 |
| `calendarConnecting` | `boolean` | ✓ | 연동 진행 중 여부 |
| `onConnect` | `() => void` | ✓ | 연동 핸들러 |
| `onDisconnect` | `() => void` | ✓ | 해제 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `calendarConnected=true`일 때 | `'연동됨'` 상태 텍스트를 표시한다 |
| 2 | `calendarConnected=false`일 때 | `'미연동'` 상태 텍스트를 표시한다 |
| 3 | 미연동 상태에서 `'연동하기'`를 탭했을 때 | `onConnect`를 호출한다 |
| 4 | 연동 상태에서 `'연동 해제'`를 탭했을 때 | `onDisconnect`를 호출한다 |
| 5 | `calendarLoading=true`일 때 | 연동·해제 버튼을 표시하지 않는다 |

---

## SettingsAccountSection

**역할**: 로그아웃 버튼을 제공하는 계정 섹션.

**위치**: `screens/settings/SettingsSections.tsx`  
**테스트**: `screens/settings/__tests__/SettingsSections.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `loggingOut` | `boolean` | ✓ | 로그아웃 진행 중 여부 |
| `onLogout` | `() => void` | ✓ | 로그아웃 핸들러 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `'로그아웃'` 버튼을 탭했을 때 | `onLogout`을 호출한다 |
| 2 | `loggingOut=true`일 때 | `'로그아웃'` 텍스트를 숨기고 로딩 인디케이터를 표시한다 |

---

## CategorySuggestionBanner

**역할**: 제목·메모·태그를 분석해 AI가 추천한 카테고리를 표시한다. 사용자가 수락하거나 무시할 수 있으며, 카테고리가 이미 설정된 경우에는 표시하지 않는다.

**위치**: `screens/checkin-form/sections/CategorySuggestionBanner.tsx`  
**테스트**: `screens/checkin-form/sections/__tests__/CategorySuggestionBanner.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `category` | `string` | ✓ | 추천된 카테고리 키 (예: `'restaurant'`) |
| `onAccept` | `() => void` | ✓ | 수락 핸들러 — 추천 카테고리를 현재 카테고리로 설정 |
| `onDismiss` | `() => void` | ✓ | 무시 핸들러 — 배너를 닫고 카테고리는 변경하지 않음 |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 항상 | 추천 카테고리의 한글 레이블을 표시한다 |
| 2 | 항상 | `'적용'` 버튼과 닫기 버튼을 표시한다 |
| 3 | `'적용'` 버튼을 탭했을 때 | `onAccept`를 호출한다 |
| 4 | 닫기 버튼을 탭했을 때 | `onDismiss`를 호출한다 |
