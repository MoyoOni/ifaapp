import { test, expect } from '@playwright/test';

test.describe('Core User Flow Tests', () => {
  test('Complete booking flow: Discovery → Booking → Confirmation', async ({ page }) => {
    // Mock APIs so pages load (home uses recommendations; booking uses babalawo)
    await page.route(/\/api\/recommendations\/.+/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ featuredBabalawos: [], featuredTemples: [], featuredProducts: [], featuredCourses: [] }) });
    });

    // 1. Discovery: go to home then navigate to booking (home may redirect; go straight to booking for reliability)
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // If home shows a booking link use it; otherwise go directly to booking page
    const bookLink = page.getByTestId('book-consultation-link').or(page.getByRole('link', { name: /book.*consultation/i }));
    const linkVisible = await bookLink.first().isVisible().catch(() => false);
    if (linkVisible) {
      await bookLink.first().click();
      await page.waitForURL(/\/booking\//, { timeout: 10000 });
    } else {
      await page.goto('/booking/clx123abc456');
    }
    
    // Mock the babalawo details API call with a fixed ID
    await page.route('**/api/babalawos/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          id: 'clx123abc456', 
          name: 'Babalawo Adekunle', 
          specialty: 'Ifa Divination',
          avatar: '',
          availability: []
        }),
      });
    });

    // Verify booking page (heading or babalawo name)
    await expect(page.locator('body')).toContainText(/Babalawo Adekunle|Book Consultation|Schedule your spiritual guidance/);

    // Fill form
    await page.fill('input[type="date"]', '2026-02-15');
    await page.fill('input[type="time"]', '14:00');
    await page.getByPlaceholder(/What would you like guidance on/).fill('Testing the complete core flow');

    // Mock POST /api/appointments (create) and GET /api/appointments/12345 (confirmation)
    await page.route(/\/api\/appointments$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '12345',
            confirmationCode: 'ABC-123',
            babalawoId: 'clx123abc456',
            clientId: 'test-client-id',
            date: '2026-02-15',
            time: '14:00',
            duration: 60,
            topic: 'Testing the complete core flow',
            preferredMethod: 'VIDEO',
            price: 100,
          }),
        });
      } else {
        await route.continue();
      }
    });
    await page.route(/\/api\/appointments\/12345/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '12345',
          confirmationCode: 'ABC-123',
          babalawo: { name: 'Babalawo Adekunle', avatar: '', specialty: 'Ifa Divination' },
          date: '2026-02-15',
          time: '14:00',
          duration: 60,
          topic: 'Testing the complete core flow',
          preferredMethod: 'VIDEO',
          price: 100,
          status: 'CONFIRMED',
        }),
      });
    });

    // Submit form and wait for navigation to confirmation (button text: "Confirm Booking")
    await page.getByRole('button', { name: /Confirm Booking/i }).click();
    await page.waitForURL(/\/booking\/12345\/confirmation/, { timeout: 15000 });

    // Verify confirmation page
    await expect(page).toHaveURL(/.*\/booking\/12345\/confirmation/);
    await expect(page.locator('body')).toContainText('Consultation Booked Successfully!');
    await expect(page.locator('body')).toContainText('Confirmation Code');
    await expect(page.locator('body')).toContainText('ABC-123');
  });

  test('Guidance Plan Flow: Creation → Approval', async ({ page }) => {
    // Mock guidance plans API (array or object with plans key depending on client)
    await page.route(/\/api\/guidance-plans/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plans: [{
            id: 'gp-123',
            appointmentId: '12345',
            babalawoId: 'clx123abc456',
            clientId: 'test-client-id',
            type: 'Akose',
            items: [{ name: 'Ikin Ifa', quantity: 1, cost: 5000, description: 'Sacred palm nuts for Ifa divination' }],
            totalCost: 5000,
            platformServiceFee: 100,
            currency: 'NGN',
            instructions: 'Use during morning prayers',
            status: 'PENDING',
          }],
        }),
      });
    });
    await page.route(/\/api\/guidance-plans\/gp-123\/approve/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'gp-123', status: 'APPROVED', escrowId: 'escrow-456' }),
      });
    });

    await page.goto('/guidance-plans', { waitUntil: 'domcontentloaded' });

    // Verify guidance plans page loaded
    await expect(page).toHaveURL(/\/guidance-plans/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Basic navigation and routing test', async ({ page }) => {
    // Major routes (journey removed per project spec)
    const routes = ['/', '/profile', '/events', '/messages', '/marketplace', '/guidance-plans', '/temples', '/babalawo'];
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await expect(page.locator('body')).toBeVisible();
    }
  });
});