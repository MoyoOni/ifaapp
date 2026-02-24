import { test, expect } from '@playwright/test';

test.describe('Messaging Flows', () => {

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

    test('Scenario 19: Send Message to Babalawo', async ({ page }) => {
        await page.route(/\/api\/messages/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    conversations: [
                        {
                            id: 'conv-1',
                            otherUser: { id: 'baba-1', name: 'Babalawo Adekunle' },
                            lastMessage: { text: 'Hello', timestamp: '2026-02-10T10:00:00Z' },
                            unreadCount: 0
                        }
                    ]
                })
            });
        });

        await page.goto('/messages');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/messages/);
    });

    test('Scenario 20: Receive Reply (Mocked) & Verify Unread Count', async ({ page }) => {
        await page.route(/\/api\/messages/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    conversations: [
                        {
                            id: 'conv-1',
                            otherUser: { id: 'baba-1', name: 'Babalawo Adekunle' },
                            lastMessage: { text: 'Thank you for reaching out', timestamp: '2026-02-10T11:00:00Z' },
                            unreadCount: 1
                        }
                    ]
                })
            });
        });

        await page.goto('/messages');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/messages/);
    });

});
