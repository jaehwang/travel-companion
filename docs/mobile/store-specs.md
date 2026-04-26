# 모바일 스토어 설계 명세

`apps/mobile/src/store/` 아래 Zustand 전역 상태 스토어의 동작 요구사항을 정의한다.  
각 명세 항목은 유닛 테스트 케이스와 1:1 대응을 목표로 작성한다.

## 개발 순서 원칙

```
동작 명세 작성 → 유닛 테스트 작성 → 구현
```

스토어에 새 액션을 추가하거나 기존 동작을 변경할 때는 이 문서에 명세를 먼저 추가한 뒤 테스트와 구현을 진행한다.

---

## useTripsStore

**역할**: 여행 목록의 전역 상태를 관리한다. API 호출을 감싸고 로딩·에러 상태를 포함한 결과를 노출한다.

**위치**: `store/tripsStore.ts`  
**테스트**: `store/__tests__/tripsStore.test.ts`

### 상태

| 필드 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `trips` | `Trip[]` | `[]` | 여행 목록 |
| `loading` | `boolean` | `true` | 로딩 상태 |
| `error` | `string \| null` | `null` | 에러 메시지 |

### 액션

| 액션 | 시그니처 | 설명 |
|------|----------|------|
| `loadTrips` | `() => Promise<void>` | API에서 여행 목록을 불러온다 |
| `addTrip` | `(data: TripFormData) => Promise<Trip>` | 여행을 생성하고 목록에 추가한다 |
| `updateTrip` | `(id, data) => Promise<Trip>` | 여행을 수정하고 목록을 갱신한다 |
| `removeTrip` | `(id, moveCheckins?) => Promise<void>` | 여행을 삭제하고 목록에서 제거한다 |

### 동작 명세

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 초기 상태 | `trips=[]`, `loading=true`, `error=null` |
| 2 | `loadTrips` 성공 시 | `trips`를 API 응답으로 교체하고 `loading=false`로 바꾼다 |
| 3 | `loadTrips` 실패 시 | `error`를 에러 메시지로 설정하고 `loading=false`로 바꾼다 |
| 4 | `addTrip` 호출 후 | 새 여행을 목록 맨 앞에 추가한다 |
| 5 | `updateTrip` 호출 후 | 해당 `id`의 여행 데이터를 API 응답으로 교체한다 |
| 6 | `removeTrip` 호출 후 | 해당 `id`의 여행을 목록에서 제거한다 |

---

## useCheckinsStore

**역할**: 체크인의 전역 상태를 관리한다. 특정 여행의 체크인(per-trip)과 전체 체크인(all) 두 가지 목록을 분리하여 관리한다.

**위치**: `store/checkinsStore.ts`  
**테스트**: `store/__tests__/checkinsStore.test.ts`

### 상태

| 필드 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `checkins` | `Checkin[]` | `[]` | 현재 여행의 체크인 목록 |
| `tripId` | `string \| null` | `null` | 현재 로드된 여행 ID |
| `loading` | `boolean` | `true` | per-trip 로딩 상태 |
| `error` | `string \| null` | `null` | per-trip 에러 |
| `allCheckins` | `Checkin[]` | `[]` | 전체 체크인 목록 |
| `allCheckinsLoading` | `boolean` | `true` | 전체 로딩 상태 |
| `allCheckinsError` | `string \| null` | `null` | 전체 에러 |

### 액션

| 액션 | 시그니처 | 설명 |
|------|----------|------|
| `loadCheckins` | `(tripId: string) => Promise<void>` | 특정 여행의 체크인을 불러온다 |
| `loadAllCheckins` | `(tripId?: string) => Promise<void>` | 전체(또는 특정 여행) 체크인을 불러온다 |
| `addCheckin` | `(data: CheckinInsert) => Promise<Checkin>` | 체크인을 생성한다 |
| `updateCheckin` | `(id, data) => Promise<Checkin>` | 체크인을 수정한다 |
| `removeCheckin` | `(id: string) => Promise<void>` | 체크인을 삭제한다 |

### 동작 명세

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `loadCheckins` 성공 시 | `checkins`를 API 응답으로 설정하고 `tripId`와 `loading=false`를 갱신한다 |
| 2 | `loadCheckins` 실패 시 | `error`를 설정하고 `loading=false`로 바꾼다 |
| 3 | `loadAllCheckins` 성공 시 | `allCheckins`를 API 응답으로 설정하고 `allCheckinsLoading=false`로 바꾼다 |
| 4 | `addCheckin` 호출 시, 새 체크인의 `trip_id`가 `tripId`와 일치할 때 | `checkins` 맨 앞에 추가한다 |
| 5 | `addCheckin` 호출 시, 새 체크인의 `trip_id`가 `tripId`와 다를 때 | `checkins`에 추가하지 않는다 |
| 6 | `addCheckin` 호출 시 (trip_id 무관) | `allCheckins` 맨 앞에 항상 추가한다 |
| 7 | `updateCheckin` 호출 후 | `checkins`와 `allCheckins` 양쪽 모두에서 해당 항목을 API 응답으로 교체한다 |
| 8 | `removeCheckin` 호출 후 | `checkins`와 `allCheckins` 양쪽 모두에서 해당 항목을 제거한다 |

---

## RootNavigator

**역할**: 앱 진입점 네비게이터. Supabase 세션 상태에 따라 로그인 화면과 메인 앱 네비게이터를 전환한다.

**위치**: `navigation/RootNavigator.tsx`  
**테스트**: `navigation/__tests__/RootNavigator.test.tsx`

> **참고**: RootNavigator는 순수한 컴포넌트이지만 인증 상태 전환 로직을 포함하므로 스토어 명세와 함께 관리한다.

### 상태 분기

| 상태 | 표시 내용 |
|------|----------|
| 세션 로딩 중 | 로딩 인디케이터 |
| 세션 없음 | `LoginScreen` |
| 세션 있음 | `NavigationContainer` + `AppNavigator` |

### 동작 명세

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | `getSession` 응답 대기 중 | `LoginScreen`과 `AppNavigator` 모두 표시하지 않는다 |
| 2 | `getSession`이 `null` 세션을 반환할 때 | `LoginScreen`을 표시한다 |
| 3 | `getSession`이 유효한 세션을 반환할 때 | `AppNavigator`를 표시한다 |
