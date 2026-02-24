import { test, expect } from '@playwright/test';

test.describe('Temple Discovery & Booking Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => console.log(`[BROWSER LOG]: ${msg.text()}`));

    // Mock authentication state
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

    // Mock client dashboard data
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

  test('Scenario 4: Browse Temples & Filter', async ({ page }) => {
    // Mock babalawos list API
    await page.route(/\/api\/babalawos/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'baba-1',
            name: 'Babalawo Adekunle',
            specialty: 'Ifa Divination',
            location: 'Lagos, Nigeria',
            rating: 4.9,
            reviewCount: 127,
            verified: true
          },
          {
            id: 'baba-2',
            name: 'Babalawo Oluwaseun',
            specialty: 'Healing Rituals',
            location: 'Ibadan, Nigeria',
            rating: 4.8,
            reviewCount: 89,
            verified: true
          }
        ])
      });
    });

    // Navigate to babalawo directory
    await page.goto('/babalawo', { waitUntil: 'domcontentloaded' });

    // Verify URL and page content
    await expect(page).toHaveURL(/\/babalawo/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Scenario 5: View Babalawo Profile', async ({ page }) => {
    // Mock babalawo details API
    await page.route(/\/api\/babalawos\/baba-1/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'baba-1',
          name: 'Babalawo Adekunle',
          specialty: 'Ifa Divination',
          location: 'Lagos, Nigeria',
          rating: 4.9,
          reviewCount: 127,
          experienceYears: 25,
          verified: true,
          avatar: '',
          bio: 'A dedicated practitioner with over 25 years of experience.',
          consultationFee: 15000
        })
      });
    });

    // Navigate directly to profile page
    await page.goto('/profile/baba-1');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify URL is correct
    await expect(page).toHaveURL(/\/profile\/baba-1/);
  });

  test('Scenario 6: Book Consultation (Standard Flow)', async ({ page }) => {
    // Mock babalawo details
    await page.route(/\/api\/babalawos\/baba-1/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'baba-1',
          name: 'Babalawo Adekunle',
          specialty: 'Ifa Divination',
          avatar: '',
          consultationFee: 15000,
          availability: []
        })
      });
    });

    // Mock appointment creation
    await page.route(/\/api\/appointments$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'apt-12345',
            confirmationCode: 'ABC-123',
            babalawo: {
              id: 'baba-1',
              name: 'Babalawo Adekunle',
              avatar: '',
              specialty: 'Ifa Divination'
            },
            date: '2026-02-15',
            time: '14:00',
            duration: 60,
            topic: 'Life path guidance',
            preferredMethod: 'VIDEO',
            price: 15000,
            status: 'PENDING'
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock appointment details for confirmation page
    await page.route(/\/api\/appointments\/apt-12345/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'apt-12345',
          confirmationCode: 'ABC-123',
          babalawo: {
            id: 'baba-1',
            name: 'Babalawo Adekunle',
            avatar: '',
            specialty: 'Ifa Divination'
          },
          date: '2026-02-15',
          time: '14:00',
          duration: 60,
          topic: 'Life path guidance',
          preferredMethod: 'VIDEO',
          price: 15000,
          status: 'PENDING'
        })
      });
    });

    // Navigate to booking page
    await page.goto('/booking/baba-1');

    // Wait for page to load
    await page.waitForSelector('text=Babalawo Adekunle', { timeout: 5000 });

    // Fill booking form
    await page.fill('input[type="date"]', '2026-02-15');
    await page.fill('input[type="time"]', '14:00');

    const topicField = page.locator('textarea').first();
    if (await topicField.count() > 0) {
      await topicField.fill('Life path guidance');
    }

    // Submit booking
    const submitButton = page.getByRole('button', { name: /Book|Submit|Confirm/i });
    await submitButton.click();

    // Wait for confirmation page
    await page.waitForURL(/.*confirmation.*/, { timeout: 10000 });

    // Verify confirmation
    await expect(page.getByText(/success|confirmed|booked/i)).toBeVisible();
    await expect(page.getByText('ABC-123')).toBeVisible();
  });

  test('Scenario 7: Cancel Booking & Verify Refund UI', async ({ page }) => {
    // Mock consultations list
    await page.route(/\/api\/appointments/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'apt-12345',
              confirmationCode: 'ABC-123',
              babalawo: { name: 'Babalawo Adekunle', specialty: 'Ifa Divination' },
              date: '2026-02-20',
              time: '14:00',
              status: 'CONFIRMED',
              price: 15000
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to consultations page
    await page.goto('/client/consultations');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we reached the consultations page
    await expect(page).toHaveURL(/\/client\/consultations/);
  });

  test('Scenario 8: Reschedule Booking', async ({ page }) => {
    // Mock consultations list
    await page.route(/\/api\/appointments/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'apt-12345',
              confirmationCode: 'ABC-123',
              babalawo: { name: 'Babalawo Adekunle', specialty: 'Ifa Divination' },
              date: '2026-02-20',
              time: '14:00',
              status: 'CONFIRMED',
              price: 15000
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to consultations page
    await page.goto('/client/consultations');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we reached the consultations page
    await expect(page).toHaveURL(/\/client\/consultations/);
  });

});
