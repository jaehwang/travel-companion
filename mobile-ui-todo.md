# 모바일 앱 UI 디자인 개선 TODO

모던 아이폰 앱(iOS HIG) 기준으로 검토한 결과입니다.

## 전체 평가: B- (양호하지만 iOS답지 않음)

따뜻한 색감과 일관성은 잘 잡혀있지만, "iOS 앱"보다 "React Native 앱"처럼 보이는 지점들이 있습니다.

---

## P1 — 높은 우선순위

### 이모지 아이콘 남용
- **문제**: 모든 아이콘이 이모지(✈️ 🍽️ 📍 🏁 📅 ⭐ ✕ 등). 해상도·색상·크기가 제각각이라 디자인이 일관되지 않음
- **기준**: 모던 iOS 앱은 SF Symbols 또는 고품질 벡터 아이콘 사용
- **해결**: `@expo/vector-icons`의 `Ionicons`으로 전환 (이미 위치 아이콘 일부는 Ionicons 사용 중 — 전체 확장)
- [x] HomeScreen 이모지 아이콘 → Ionicons 전환
- [x] TripCard, CheckinCard 이모지 → Ionicons 전환
- [x] TripFormModal, CheckinFormScreen 이모지 → Ionicons 전환
- [x] CategorySelector 이모지 → Ionicons 전환

### 사이드 드로어 (햄버거 메뉴)
- **문제**: iOS는 탭 바(Tab Bar) 기반 네비게이션이 표준. 사이드 드로어는 Android 패턴이며 iOS HIG에 어긋남
- **해결**: 하단 탭 바로 전환
- [ ] `@react-navigation/bottom-tabs` 도입
- [ ] 탭 구성: 여행 목록 / 체크인 / 설정 (또는 홈 / 여행 / 설정)
- [ ] SideDrawer 컴포넌트 제거

---

## P2 — 중간 우선순위

### 체크인 카드 왼쪽 컬러 스트립
- **문제**: 5px 왼쪽 컬러 스트립은 2018년대 Material Design 패턴
- **현재 코드**: `strip: { width: 5, backgroundColor: categoryColor }`
- **해결**: 카테고리 아이콘 + 배경 tint 조합으로 변경
- [ ] CheckinCard 리디자인: 스트립 제거, 카테고리 아이콘(Ionicons) + 아이콘 배경 원형으로 대체

### FAB (Floating Action Button)
- **문제**: 56×56 오렌지 원형 버튼은 Android FAB 패턴. iOS는 네비게이션 바 버튼 선호
- **해결**: 각 화면 네비게이션 바 우측 `+` 버튼으로 이동
- [ ] HomeScreen FAB → 네비게이션 바 우측 버튼으로 변경
- [ ] TripScreen FAB → 네비게이션 바 우측 버튼으로 변경

---

## P3 — 낮은 우선순위

### 블러/유리 효과 없음
- **문제**: iOS의 핵심 시각 언어인 Frosted Glass 효과 없음
- **해결**: `expo-blur`의 `BlurView` 적용
- [ ] 퀵 체크인 시트 배경에 BlurView 적용
- [ ] 헤더 스크롤 시 블러 처리

### 카드 그림자 너무 약함
- **현재**: `shadowOpacity: 0.06`
- **해결**: `shadowOpacity: 0.10~0.12`로 상향, `shadowRadius: 10~12`
- [ ] TripCard, CheckinCard 그림자 강도 조정

---

## 작업 접근 방식

### 병렬 작업이 어려운 이유
- **탭 바 전환(P1)**은 네비게이션 구조 자체를 변경 → 이후 모든 화면에 영향
- **이모지 → Ionicons(P1)**은 거의 모든 컴포넌트에 걸쳐 있음
- git worktree로 병렬 진행하면 머지 충돌이 심각해짐
- 시뮬레이터 UI 확인은 사람의 눈으로만 판단 가능 → 에이전트 자율 루프 불가

### 권장 작업 순서 (순차)

| 단계 | 작업 | 확인 방법 |
|------|------|-----------|
| 1단계 | 이모지 → Ionicons 전환 | 시뮬레이터로 각 화면 확인 |
| 2단계 | 탭 바 전환 (네비게이션 구조 변경) | 시뮬레이터로 탭 전환 확인 |
| 3단계 | 체크인 카드 리디자인 + FAB 제거 | 시뮬레이터로 카드 UI 확인 |
| 4단계 | BlurView + 그림자 강도 조정 | 시뮬레이터로 마무리 확인 |

각 단계 완료 후 사용자가 시뮬레이터로 확인 → 승인 시 다음 단계 진행.

---

## 잘 된 점 (유지)

| 항목 | 이유 |
|------|------|
| 색상 팔레트 (#FFF8F0 크림 + #FF6B47 코랄) | 따뜻하고 개성 있음, iOS답게 잘 어울림 |
| 카드 border-radius (14-20px) | iOS 16+ 스타일과 일치 |
| 바텀 시트 (QuickCheckinSheet) | 모던 iOS 패턴, 잘 구현됨 |
| pageSheet 모달 애니메이션 | iOS 네이티브 느낌 |
| 폰트 weight 계층 (800-900) | 명확한 시각적 위계 |
| 카테고리 컬러 시스템 (9가지) | 일관되고 직관적 |
| 날짜 구분자 (도트 + 라인) | 세련된 패턴 |
| KeyboardAvoidingView + Safe Area 처리 | 플랫폼 고려 잘 됨 |
