/**
 * E2E: Default Trip (미할당 체크인)
 *
 * 전제: 앱이 로그인된 상태로 실행됨.
 *
 * 플로우:
 * 1. beforeAll — UI로 "E2E 테스트 여행" 생성
 * 2. +체크인 탭 → 저장 → CheckinsScreen "미할당" 뱃지 확인
 * 3. 체크인 롱프레스 → "E2E 테스트 여행" 선택 → 뱃지 사라짐
 */

describe('Default Trip (미할당 체크인)', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'inuse' },
    });

    // 홈 화면 로드 대기
    await waitFor(element(by.id('screen-home')))
      .toBeVisible()
      .withTimeout(10000);

    // "E2E 테스트 여행" 생성 — AddTrip 탭(+여행) 탭
    await element(by.id('btn-tab-add')).tap();
    await waitFor(element(by.id('input-trip-title')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('input-trip-title')).typeText('E2E 테스트 여행');
    await element(by.id('btn-save-trip')).tap();

    // 저장 후 TripScreen으로 이동 — 스와이프 백으로 홈으로 복귀
    await waitFor(element(by.id('screen-trip')))
      .toBeVisible()
      .withTimeout(8000);
    await element(by.id('screen-trip')).swipe('right', 'slow', 0.75, 0.02, 0.5);
    await waitFor(element(by.id('screen-home')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('+체크인 탭 탭 시 CheckinFormScreen이 열린다', async () => {
    await element(by.id('btn-tab-add-checkin')).tap();
    await waitFor(element(by.id('screen-checkin-form')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('제목 입력 후 저장하면 CheckinsScreen에 미할당 뱃지가 표시된다', async () => {
    // 제목 입력 (위치는 자동 GPS 또는 requestForegroundPermissions 처리됨)
    await element(by.id('input-checkin-title')).typeText('E2E 테스트 체크인');

    // 저장 버튼이 활성화될 때까지 대기 (위치 자동 취득 후)
    await waitFor(element(by.id('btn-save-checkin')))
      .toBeVisible()
      .withTimeout(8000);
    await element(by.id('btn-save-checkin')).tap();

    // 저장 후 modal 닫히고 탭바로 복귀 → CheckinsTab 탭
    await waitFor(element(by.text('체크인')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('체크인')).tap();

    // CheckinsScreen 진입 확인
    await waitFor(element(by.id('screen-checkins')))
      .toBeVisible()
      .withTimeout(5000);

    // 미할당 뱃지 확인
    await waitFor(element(by.id('badge-unassigned')).atIndex(0))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('롱프레스 → E2E 테스트 여행 선택 → 미할당 뱃지 사라짐', async () => {
    // 미할당 체크인 카드 롱프레스
    await element(by.id('checkin-card-unassigned')).atIndex(0).longPress();

    // Alert에서 "E2E 테스트 여행" 선택
    await waitFor(element(by.text('E2E 테스트 여행')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.text('E2E 테스트 여행')).tap();

    // 뱃지 사라짐 확인
    await waitFor(element(by.id('badge-unassigned')).atIndex(0))
      .not.toBeVisible()
      .withTimeout(5000);
  });
});
