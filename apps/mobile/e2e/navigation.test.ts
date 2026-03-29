describe('Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { location: 'inuse' },
    });
    await waitFor(element(by.id('screen-home')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('여행 카드를 탭하면 여행 화면으로 이동한다', async () => {
    await waitFor(element(by.id('trip-card')).atIndex(0))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('trip-card')).atIndex(0).tap();

    await waitFor(element(by.id('screen-trip')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('여행 화면에 체크인 목록이 표시된다', async () => {
    await expect(element(by.id('list-checkins'))).toBeVisible();
  });

  it('스와이프 백으로 홈 화면으로 돌아온다', async () => {
    // iOS 스와이프 백: 왼쪽 엣지(x=0.02)에서 오른쪽으로 스와이프
    await element(by.id('screen-trip')).swipe('right', 'slow', 0.75, 0.02, 0.5);
    await waitFor(element(by.id('screen-home')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
