import { test, expect } from '@playwright/test';

/**
 * 인증 플로우 E2E 테스트 (iPhone 14 / WebKit)
 *
 * 비인증 상태에서의 리다이렉트와 로그인 페이지 렌더링을 검증한다.
 * 실제 로그인은 Supabase Auth를 사용하므로 여기서는 UI 검증만 수행한다.
 */

test.describe('인증 플로우', () => {
  test('비로그인 상태에서 / 접속 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('로그인 페이지가 iPhone 뷰포트에서 정상 렌더링된다', async ({ page }) => {
    await page.goto('/login');

    // 로그인 버튼 확인
    const googleLoginBtn = page.getByRole('button', { name: /Google/i });
    await expect(googleLoginBtn).toBeVisible();

    // 스크린샷 (실패 디버깅용)
    await page.screenshot({ path: 'tests/e2e/screenshots/login.png', fullPage: true });
  });

  test('로그인 페이지가 가로 스크롤 없이 렌더링된다', async ({ page }) => {
    await page.goto('/login');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
