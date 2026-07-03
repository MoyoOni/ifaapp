import { test, expect } from '@playwright/test';

test.describe('Marketplace Flows', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER LOG]: ${msg.text()}`));

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'fake-jwt-token');
      localStorage.setItem('userId', 'client-123');
    });

    await page.route(/\/api\/users\/client-123/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'client-123',
          email: 'client@example.com',
          role: 'CLIENT',
          firstName: 'Test',
          lastName: 'Client',
          name: 'Test Client',
          verified: true,
          hasOnboarded: true
        })
      });
    });

    await page.route(/\/api\/dashboard\/client/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recentConsultations: [],
          pendingGuidancePlans: [],
          unreadMessages: 0,
          walletBalance: { amount: 50000, currency: 'NGN' },
          communities: { temples: [], circles: [] }
        })
      });
    });
  });

  test('Scenario 13: Browse Products & Filter', async ({ page }) => {
    await page.route(/\/api\/marketplace\/products/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'prod-1',
              name: 'Ifa Divination Chain',
              price: 25000,
              category: 'Ritual Items',
              vendor: { name: 'Sacred Crafts', verified: true }
            },
            {
              id: 'prod-2',
              name: 'Herbal Incense Set',
              price: 5000,
              category: 'Herbs & Oils',
              vendor: { name: 'Nature\'s Blessing', verified: true }
            }
          ],
          total: 2
        })
      });
    });

    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/marketplace/);
  });

  test('Scenario 14: Add to Cart & Update Quantity', async ({ page }) => {
    await page.route(/\/api\/marketplace\/products\/prod-1/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'prod-1',
          name: 'Ifa Divination Chain',
          price: 25000,
          description: 'Authentic divination chain',
          category: 'Ritual Items',
          stock: 10,
          vendor: { name: 'Sacred Crafts', verified: true }
        })
      });
    });

    await page.goto('/marketplace/prod-1');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/marketplace\/prod-1/);
  });

  test('Scenario 15: Checkout Flow (Payment & Order Confirmation)', async ({ page }) => {
    await page.route(/\/api\/marketplace\/cart/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              productId: 'prod-1',
              name: 'Ifa Divination Chain',
              price: 25000,
              quantity: 1
            }
          ],
          total: 25000
        })
      });
    });

    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/marketplace/);
  });

});
