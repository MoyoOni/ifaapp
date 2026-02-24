import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('home page loads and shows main content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).toBeVisible();
    // Expect app shell or prominent CTA
    await expect(
      page.getByRole('link', { name: /book consultation|consultation/i }).or(
        page.locator('text=Ilé Àṣẹ').first()
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('home has navigation or main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Sidebar, nav, or main content area visible
    const navOrMain = page.locator('nav, [role="navigation"], aside, main, [class*="sidebar"], [class*="layout"]').first();
    await expect(navOrMain).toBeVisible({ timeout: 5000 });
  });
});
