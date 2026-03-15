import { test, expect } from '@playwright/test';

/**
 * PWA 요건 E2E 테스트 (iPhone 14 / WebKit)
 *
 * iOS에서 "홈 화면에 추가" 후 앱처럼 동작하기 위한 PWA 요건을 검증한다.
 */

test.describe('PWA 요건', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('웹 앱 매니페스트가 존재한다', async ({ page }) => {
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
  });

  test('apple-touch-icon이 설정되어 있다', async ({ page }) => {
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveCount(1);
  });

  test('viewport 메타태그가 올바르게 설정되어 있다', async ({ page }) => {
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveCount(1);
    const content = await viewportMeta.getAttribute('content');
    expect(content).toContain('width=device-width');
  });

  test('페이지 title이 비어 있지 않다', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('apple-mobile-web-app-capable 메타태그가 yes로 설정되어 있다', async ({ page }) => {
    const meta = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(meta).toHaveCount(1);
    const content = await meta.getAttribute('content');
    expect(content).toBe('yes');
  });

  test('apple-mobile-web-app-title 메타태그가 설정되어 있다', async ({ page }) => {
    const meta = page.locator('meta[name="apple-mobile-web-app-title"]');
    await expect(meta).toHaveCount(1);
    const content = await meta.getAttribute('content');
    expect(content?.length).toBeGreaterThan(0);
  });
});

test.describe('페이지 응답 속도', () => {
  test('로그인 페이지가 3초 내에 렌더링된다', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });
});
