import { test, expect } from '@playwright/test';

test.describe('Authentication & Onboarding Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Debug logging
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    // page.on('request', req => console.log(`REQUEST: ${req.method()} ${req.url()}`)); 

    // Mock dashboard (ClientDashboardSummary shape: recentConsultations, pendingGuidancePlans, communities, unreadMessages, walletBalance)
    await page.route(/\/api\/dashboard\/.+/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recentConsultations: [],
          pendingGuidancePlans: [],
          communities: { temples: [], circles: [] },
          unreadMessages: 0,
          walletBalance: { amount: 0, currency: 'NGN' },
        }),
      });
    });
    await page.route(/\/api\/recommendations\/.+/, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify({
          featuredBabalawos: [],
          featuredTemples: [],
          featuredProducts: [],
          featuredCourses: []
        })
      });
    });
    await page.route(/\/api\/appointments\/.+/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route(/\/api\/wallet\/.+/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ balance: 0, currency: 'NGN' }) });
    });

    // Mock user profile (User shape: id, email, name, role, verified, hasOnboarded)
    await page.route(/\/api\/users\/.+/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'client-123',
          email: 'client@example.com',
          name: 'Client User',
          role: 'CLIENT',
          firstName: 'Client',
          lastName: 'User',
          verified: true,
          hasOnboarded: true,
        }),
      });
    });
  });

  test('Scenario 1: User Sign Up & Email Verification', async ({ page }) => {
    // 1. Mock API handling for signup (using regex)
    await page.route(/\/api\/auth\/register/, async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      if (postData.email && postData.password) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'User registered successfully. Please verify your email.',
            userId: 'new-user-123',
            user: { id: 'new-user-123', email: postData.email, role: 'CLIENT' },
            accessToken: 'fake-jwt-token',
            refreshToken: 'fake-refresh-token'
          })
        });
      } else {
        await route.fulfill({ status: 400, body: JSON.stringify({ message: 'Invalid data' }) });
      }
    });

    // 2. Navigate to Signup Page
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/signup/);

    // 3. Wait for form and fill (resilient to slow load)
    const fullName = page.getByPlaceholder('Your full name');
    await fullName.waitFor({ state: 'visible', timeout: 15000 });
    await fullName.fill('Test User');
    await page.getByPlaceholder(/name@example\.com|email/i).fill('testuser@example.com');
    await page.locator('input[id="password"]').fill('Password123!');
    await page.locator('input[id="confirmPassword"]').fill('Password123!');

    // 4. Submit form
    await page.locator('button[type="submit"]').click();

    // 5. Verify redirection to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('Scenario 2: Authenticated client can view dashboard', async ({ page }) => {
    // Pre-authenticated session: set auth state then visit dashboard (mocks from beforeEach).
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'fake-jwt-token');
      localStorage.setItem('refreshToken', 'fake-refresh-token');
      localStorage.setItem('userId', 'client-123');
    });
    await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/Welcome|Dashboard|Consultations|Guidance/i)).toBeVisible({ timeout: 10000 });
  });

  test('Scenario 3: After clearing auth state, dashboard redirects to login', async ({ page }) => {
    // Pre-authenticated then "logout" (clear storage); visit dashboard → expect login redirect.
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'fake-jwt-token');
      localStorage.setItem('refreshToken', 'fake-refresh-token');
      localStorage.setItem('userId', 'client-123');
    });
    await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/dashboard/);

    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
    });
    await page.goto('/client/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

});
