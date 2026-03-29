describe('HomeScreen', () => {
  beforeAll(async () => {
    // 콜드 스타트는 측정 대상 제외 — 네이티브 앱을 먼저 띄워 놓는다
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'inuse' },
    });
    await waitFor(element(by.id('screen-home')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('홈 화면 JS 로드 시간을 측정한다 (콜드 스타트 제외)', async () => {
    // JS만 재시작 — 네이티브 레이어는 유지
    const start = Date.now();
    await device.reloadReactNative();
    await waitFor(element(by.id('screen-home')))
      .toBeVisible()
      .withTimeout(10000);
    const elapsed = Date.now() - start;
    console.log(`[perf] 홈 화면 JS 로드: ${elapsed}ms`);
    if (elapsed >= 10000) {
      throw new Error(`홈 화면 로드 시간 초과: ${elapsed}ms (기준: 10000ms)`);
    }
  });

  it('여행 목록이 표시된다', async () => {
    await expect(element(by.id('list-trips'))).toBeVisible();
  });

  it('탭바 + 버튼이 표시된다', async () => {
    await expect(element(by.id('btn-tab-add'))).toBeVisible();
  });
});
