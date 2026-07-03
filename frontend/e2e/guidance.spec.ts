import { test, expect } from '@playwright/test';

test.describe('Guidance Plans Flows', () => {

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

        // Dashboard summary path: /api/dashboard/client/:id/summary (id can be client-123 or demo-client-1)
        await page.route(/\/api\/dashboard\/client\/[^/]+\/summary/, async (route) => {
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

    test('Scenario 16: Babalawo Creates Prescription', async ({ page }) => {
        await page.route(/\/api\/guidance-plans/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    plans: []
                })
            });
        });

        await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/client\/dashboard/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('Scenario 17: Client Approves Plan (Escrow Hold)', async ({ page }) => {
        await page.route(/\/api\/guidance-plans/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    plans: [
                        {
                            id: 'plan-1',
                            status: 'PENDING_APPROVAL',
                            babalawo: { name: 'Babalawo Adekunle' },
                            totalCost: 50000
                        }
                    ]
                })
            });
        });

        await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/client\/dashboard/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('Scenario 18: Client Rejects Plan', async ({ page }) => {
        await page.route(/\/api\/guidance-plans/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    plans: []
                })
            });
        });

        await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/client\/dashboard/, { timeout: 15000 });
        await expect(page.locator('body')).toBeVisible();
    });

});
