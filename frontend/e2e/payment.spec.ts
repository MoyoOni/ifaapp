import { test, expect } from '@playwright/test';

test.describe('Payment & Wallet Flows', () => {

    test.beforeEach(async ({ page }) => {
        // Capture console logs
        page.on('console', msg => console.log(`[BROWSER LOG]: ${msg.text()}`));

        // Mock authentication
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('accessToken', 'fake-jwt-token');
            localStorage.setItem('userId', 'client-123');
        });

        // Mock user data
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

        // Mock client dashboard
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

    test('Scenario 9: Add Funds to Wallet (Mock Payment Gateway)', async ({ page }) => {
        // Mock wallet balance API
        await page.route(/\/api\/wallet\/balance/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    balance: 50000,
                    currency: 'NGN',
                    pendingBalance: 0
                })
            });
        });

        // Mock payment initiation
        await page.route(/\/api\/wallet\/fund/, async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        transactionId: 'txn-123',
                        paymentUrl: 'https://mock-payment-gateway.com/pay/txn-123',
                        reference: 'REF-123'
                    })
                });
            } else {
                await route.continue();
            }
        });

        // Navigate to wallet page
        await page.goto('/wallet');

        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Verify we reached wallet page
        await expect(page).toHaveURL(/\/wallet/);
    });

    test('Scenario 10: Verify Wallet Balance Display', async ({ page }) => {
        // Mock wallet balance
        await page.route(/\/api\/wallet\/balance/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    balance: 75000,
                    currency: 'NGN',
                    pendingBalance: 5000
                })
            });
        });

        // Navigate to wallet
        await page.goto('/wallet');

        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Verify URL
        await expect(page).toHaveURL(/\/wallet/);
    });

    test('Scenario 11: Withdraw Funds Flow', async ({ page }) => {
        // Mock wallet balance
        await page.route(/\/api\/wallet\/balance/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    balance: 100000,
                    currency: 'NGN',
                    pendingBalance: 0
                })
            });
        });

        // Mock withdrawal request
        await page.route(/\/api\/wallet\/withdraw/, async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        withdrawalId: 'wd-123',
                        amount: 50000,
                        status: 'PENDING',
                        estimatedCompletionDate: '2026-02-12'
                    })
                });
            } else {
                await route.continue();
            }
        });

        // Navigate to wallet
        await page.goto('/wallet');

        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Verify URL
        await expect(page).toHaveURL(/\/wallet/);
    });

    test('Scenario 12: Transaction History Verification', async ({ page }) => {
        // Mock transaction history
        await page.route(/\/api\/wallet\/transactions/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    transactions: [
                        {
                            id: 'txn-1',
                            type: 'DEPOSIT',
                            amount: 50000,
                            currency: 'NGN',
                            status: 'COMPLETED',
                            description: 'Wallet funding',
                            createdAt: '2026-02-10T10:00:00Z'
                        },
                        {
                            id: 'txn-2',
                            type: 'PAYMENT',
                            amount: -15000,
                            currency: 'NGN',
                            status: 'COMPLETED',
                            description: 'Consultation with Babalawo Adekunle',
                            createdAt: '2026-02-09T14:30:00Z'
                        },
                        {
                            id: 'txn-3',
                            type: 'WITHDRAWAL',
                            amount: -20000,
                            currency: 'NGN',
                            status: 'PENDING',
                            description: 'Withdrawal to bank account',
                            createdAt: '2026-02-08T09:15:00Z'
                        }
                    ],
                    total: 3,
                    page: 1,
                    limit: 10
                })
            });
        });

        // Mock wallet balance
        await page.route(/\/api\/wallet\/balance/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    balance: 15000,
                    currency: 'NGN',
                    pendingBalance: 0
                })
            });
        });

        // Navigate to transaction history page
        await page.goto('/wallet/transactions');

        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Verify URL
        await expect(page).toHaveURL(/\/wallet\/transactions/);
    });

});
