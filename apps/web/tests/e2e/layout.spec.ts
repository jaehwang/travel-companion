import { test, expect } from '@playwright/test';

/**
 * 모바일 레이아웃 E2E 테스트 (iPhone 14 / WebKit)
 *
 * iOS Safari에서 발생하기 쉬운 레이아웃 버그를 검증한다:
 * - 가로 스크롤 오버플로우
 * - position: fixed 요소의 위치 이상
 * - 뷰포트 초과 요소
 */

test.describe('모바일 레이아웃', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 페이지에 가로 스크롤이 없다', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('로그인 페이지 viewport 메타태그가 올바르게 설정되어 있다', async ({ page }) => {
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('width=device-width');
    expect(viewportMeta).toContain('initial-scale=1');
  });

  test('로그인 페이지 전체 높이가 viewport를 초과하지 않는다 (스크롤 없는 경우)', async ({ page }) => {
    // iOS에서 100vh 버그 확인 (주소창 포함 여부)
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const windowHeight = await page.evaluate(() => window.innerHeight);

    // 로그인 페이지는 스크롤 없이 한 화면에 들어와야 함
    expect(bodyHeight).toBeLessThanOrEqual(windowHeight * 1.1); // 10% 여유
  });
});

test.describe('캘린더 페이지 레이아웃', () => {
  test('캘린더 페이지가 인증 없이 접근 시 리다이렉트된다', async ({ page }) => {
    await page.goto('/calendar');
    // 인증 없이는 로그인으로 리다이렉트
    await expect(page).toHaveURL(/\/login/);
  });
});
