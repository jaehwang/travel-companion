# Mobile 앱 개발 헌법 (Constitution)

이 문서는 `apps/mobile/` 모바일 앱 코드를 수정할 때 따라야 할 설계·구현 규칙을 정의한다.  
에이전트와 개발자 모두 이 문서를 작업의 출발점으로 삼는다.

---

## 1. 핵심 원칙: 명세 우선 개발

모든 기능 추가·변경은 아래 순서를 따른다.

```
1. 명세 문서에 동작 항목 추가/수정
2. 해당 항목에 대응하는 유닛 테스트 작성
3. 테스트를 통과하도록 구현
4. npm test 전체 통과 확인 후 커밋
```

명세 없이 코드를 먼저 작성하지 않는다.  
테스트 없이 명세를 건너뛰지 않는다.

---

## 2. 소스 파일 → 명세 문서 매핑

소스 파일을 수정할 때는 아래 표에서 대응하는 명세 문서를 먼저 확인한다.

### 2-1. `components/` — 공용 컴포넌트

**명세 문서**: [`component-specs.md`](component-specs.md)  
**테스트 위치**: `src/components/__tests__/`

| 소스 파일 | 명세 섹션 |
|----------|----------|
| `components/CheckinCard.tsx` | `## CheckinCard` |
| `components/TripCard.tsx` | `## TripCard` |
| `components/SideDrawer.tsx` | `## SideDrawer` |
| `components/TripTaglineBanner.tsx` | `## TripTaglineBanner` |
| `components/CheckinFormToolbar.tsx` | `## CheckinFormToolbar` |
| `components/CategorySelector.tsx` | `## CategorySelector` |
| `components/PlaceSearchPanel.tsx` | `## PlaceSearchPanel` |
| `components/TripFormSections.tsx` | `## TripFormSections — TripPlaceSection`, `## TripToggleSection` |
| `components/TripFormModal.tsx` | `## TripFormModal` |
| `components/QuickCheckinSheet.tsx` | `## QuickCheckinSheet` |
| `components/TodayCalendarSection.tsx` | `## TodayCalendarSection` |
| `components/map/CheckinMapBottomSheet.tsx` | `## CheckinMapBottomSheet` |
| `components/map/CheckinMapMarker.tsx` | `## CheckinMapMarker` |
| `components/map/ClusterMarker.tsx` | `## ClusterMarker` |

### 2-2. `screens/` — 화면 서브컴포넌트·섹션

**명세 문서**: [`screen-section-specs.md`](screen-section-specs.md)  
**테스트 위치**: 각 화면 디렉토리 내 `__tests__/`

| 소스 파일 | 명세 섹션 |
|----------|----------|
| `screens/checkin-form/sections/FormHeader.tsx` | `## FormHeader` |
| `screens/checkin-form/sections/NoteSection.tsx` | `## NoteSection` |
| `screens/checkin-form/sections/TagInput.tsx` | `## TagInput` |
| `screens/checkin-form/sections/TimePickerSection.tsx` | `## TimePickerSection` |
| `screens/trip/TripHeader.tsx` | `## TripHeader` |
| `screens/trip/TripCheckinList.tsx` | `## TripCheckinList` |
| `screens/checkins/CheckinGridCard.tsx` | `## CheckinGridCard` |
| `screens/checkins/MoveCheckinModal.tsx` | `## MoveCheckinModal` |
| `screens/home/HomeScreenSections.tsx` | `## HomeQuickCheckinCard`, `## HomeTripList` |
| `screens/settings/SettingsSections.tsx` | `## SettingsHeader`, `## SettingsProfileCard`, `## SettingsCalendarSection`, `## SettingsAccountSection` |

### 2-3. `store/` — Zustand 스토어, `navigation/RootNavigator`

**명세 문서**: [`store-specs.md`](store-specs.md)  
**테스트 위치**: `src/store/__tests__/`, `src/navigation/__tests__/`

| 소스 파일 | 명세 섹션 |
|----------|----------|
| `store/tripsStore.ts` | `## useTripsStore` |
| `store/checkinsStore.ts` | `## useCheckinsStore` |
| `navigation/RootNavigator.tsx` | `## RootNavigator` |

### 2-4. 명세가 없는 파일

아래 파일은 현재 명세 문서가 없다. 수정 시 기존 동작을 유지하고 변경 이유를 커밋 메시지에 명확히 기록한다.

| 파일 | 이유 |
|------|------|
| `lib/supabase.ts` | 클라이언트 초기화 — 런타임 전용 |
| `lib/auth.ts` | 네이티브 OAuth — 단위 테스트 불가 |
| `lib/api/rest-client.ts` | 얇은 fetch 래퍼 |
| `lib/api/*.ts` (places, nearby, search, settings, calendar, storage) | REST 래퍼 — 호출 경로 테스트로 커버 |
| `lib/api.ts`, `lib/api/index.ts` | re-export 모듈 |
| `i18n/index.ts` | 초기화 전용 |
| `screens/LoginScreen.tsx` | 네이티브 OAuth UI |
| `screens/LocationPickerScreen.tsx` | 지도 인터랙션 위주 |
| `screens/checkin-form/sections/FormBody.tsx` | 복합 조합 컴포넌트 |
| `components/PhotoViewerModal.tsx` | 제스처 엔진 의존 — E2E로 검증 |
| `components/PhotoPickerButton.tsx` (`usePhotoPicker`) | 네이티브 이미지 피커 의존 |

---

## 3. 기능 추가 체크리스트

### 새 컴포넌트 추가

```
□ 1. 해당 명세 문서에 ## ComponentName 섹션 추가
       - 역할, 위치, 테스트 위치, Props 표, 동작 명세 표 작성
□ 2. __tests__/ 에 테스트 파일 작성
       - 명세 동작 항목 하나당 테스트 케이스 하나
□ 3. 컴포넌트 구현
□ 4. npm test --prefix apps/mobile 전체 통과 확인
```

| 컴포넌트 위치 | 명세 문서 | 테스트 디렉토리 |
|-------------|----------|---------------|
| `components/` | `component-specs.md` | `components/__tests__/` |
| `components/map/` | `component-specs.md` | `components/map/__tests__/` |
| `screens/checkin-form/sections/` | `screen-section-specs.md` | `screens/checkin-form/sections/__tests__/` |
| `screens/trip/` | `screen-section-specs.md` | `screens/trip/__tests__/` |
| `screens/checkins/` | `screen-section-specs.md` | `screens/checkins/__tests__/` |
| `screens/home/` | `screen-section-specs.md` | `screens/home/__tests__/` |
| `screens/settings/` | `screen-section-specs.md` | `screens/settings/__tests__/` |

### 기존 컴포넌트 동작 변경

```
□ 1. 명세 문서에서 해당 섹션의 동작 항목 수정/추가
□ 2. 대응하는 테스트 케이스 수정/추가
□ 3. 구현 수정
□ 4. npm test --prefix apps/mobile 전체 통과 확인
```

### 스토어 액션 추가/변경

```
□ 1. store-specs.md 의 해당 스토어 섹션에 동작 명세 항목 추가/수정
□ 2. store/__tests__/ 에 테스트 케이스 추가/수정
□ 3. 스토어 구현 수정
□ 4. npm test --prefix apps/mobile 전체 통과 확인
```

---

## 4. 테스트 작성 규칙

### 파일 위치 규칙

테스트 파일은 소스 파일 바로 옆 `__tests__/` 디렉토리에 위치한다.

```
src/
  components/
    CheckinCard.tsx
    __tests__/
      CheckinCard.test.tsx        ← 반드시 이 위치
  screens/
    trip/
      TripHeader.tsx
      __tests__/
        TripHeader.test.tsx       ← 반드시 이 위치
  store/
    tripsStore.ts
    __tests__/
      tripsStore.test.ts
```

### Mock 규칙

| 의존성 | Mock 방식 |
|--------|----------|
| `expo-image` | `jest.mock('expo-image', () => ({ Image: 'Image' }))` |
| `@expo/vector-icons` | `jest.mock(...)` 후 아이콘 이름을 `<Text>` 로 렌더 |
| `react-native Modal` | `visible ? children : null` 패턴 |
| `@react-native-community/datetimepicker` | `<View testID="date-time-picker" />` |
| `lib/api` 함수들 | `jest.mock('../../lib/api', () => ({ funcName: jest.fn() }))` |
| Zustand 스토어 (테스트 간 격리) | `beforeEach` 에서 `useStore.setState({...초기값})` |

### 테스트 케이스 명명 규칙

명세 표의 "기대 결과" 열 문장을 그대로 테스트 이름으로 사용한다.

```typescript
// 명세: "title이 없을 때 → '이름 없는 장소'를 표시한다"
it('title이 없으면 "이름 없는 장소"를 표시한다', () => { ... });

// 명세: "완료 버튼을 탭했을 때 → onClose를 호출한다"
it('"완료" 버튼을 누르면 onClose를 호출한다', () => { ... });
```

---

## 5. 명세 문서 작성 규칙

새 컴포넌트·스토어 명세를 작성할 때 아래 형식을 따른다.

```markdown
## ComponentName

**역할**: 한 줄 설명

**위치**: `경로/파일명.tsx`  
**테스트**: `경로/__tests__/파일명.test.tsx`

**Props**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| ... | ... | ✓/— | ... |

**동작 명세**

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | [언제/무엇일 때] | [무엇을 한다] |
| 2 | ... | ... |
```

**조건 작성 요령**:
- 상태 조건: `propName이 true/false일 때`, `propName이 있을 때/없을 때`
- 이벤트 조건: `버튼명 버튼을 탭했을 때`, `입력 후 X 버튼을 탭했을 때`
- 초기 상태: `항상`, `마운트 직후`

**기대 결과 작성 요령**:
- 표시: `'텍스트'를 표시한다`, `컴포넌트를 렌더링한다`
- 미표시: `~를 표시하지 않는다`, `아무것도 렌더링하지 않는다`
- 콜백: `handlerName을 호출한다`, `handlerName에 X를 전달하여 호출한다`
- 상태 변경: `fieldName을 X로 바꾼다`

---

## 6. 명세 문서 목록

| 문서 | 대상 |
|------|------|
| [`component-specs.md`](component-specs.md) | `src/components/` 전체 컴포넌트 |
| [`screen-section-specs.md`](screen-section-specs.md) | `src/screens/` 서브컴포넌트·섹션 |
| [`store-specs.md`](store-specs.md) | `src/store/` Zustand 스토어, `navigation/RootNavigator` |

---

## 7. 커밋 전 체크리스트

```
□ 변경한 소스 파일에 대응하는 명세 문서를 업데이트했다
□ 명세 변경사항에 맞게 테스트를 추가/수정했다
□ npm test --prefix apps/mobile 전체 통과
□ npm run lint 경고·에러 0건
```
