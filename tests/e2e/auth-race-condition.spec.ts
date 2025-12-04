import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Authentication Race Condition Tests
 *
 * NOTE: These tests require a real Kinde authentication flow to work.
 * They will be skipped if the TEST_AUTH_ENABLED environment variable is not set.
 * To run these tests:
 * 1. Set up Kinde test credentials
 * 2. Set TEST_AUTH_ENABLED=true
 * 3. Optionally set TEST_USER_EMAIL and TEST_USER_PASSWORD
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Authentication Race Condition Fix', () => {
  // Skip all tests in this suite if auth testing is not enabled
  test.skip(!isAuthTestEnabled, 'Skipping auth tests - set TEST_AUTH_ENABLED=true to enable');

  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('user can login without 500 errors during concurrent requests', async ({ page }) => {
    // Start monitoring network requests for errors
    const errors: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 500) {
        errors.push(`${response.status()} error on ${response.url()}`);
      }
    });

    page.on('pageerror', error => {
      errors.push(`JavaScript error: ${error.message}`);
    });

    // Simulate user login
    await page.click('[data-testid="login-button"]');
    
    // Wait for Kinde auth to complete (adjust URL as needed)
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    // Verify we're on the dashboard (user was created successfully)
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();

    // Check that no 500 errors occurred
    expect(errors).toHaveLength(0);
  });

  test('new user onboarding works correctly without race condition errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 500) {
        errors.push(`${response.status()} error on ${response.url()}`);
      }
    });

    // Simulate new user sign up
    await page.click('[data-testid="signup-button"]');
    
    // Wait for Kinde auth to complete and redirect to onboarding
    await page.waitForURL('**/onboarding**', { timeout: 10000 });

    // Verify onboarding page loads correctly
    await expect(page.locator('[data-testid="onboarding-form"]')).toBeVisible();

    // Fill out onboarding form
    await page.fill('[data-testid="clinic-name"]', 'Test Clinic');
    await page.fill('[data-testid="clinic-email"]', 'test@clinic.com');
    await page.fill('[data-testid="clinic-phone"]', '+1234567890');
    
    // Submit onboarding
    await page.click('[data-testid="complete-onboarding"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    // Verify dashboard loads successfully
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();

    // Check that no server errors occurred during the process
    expect(errors).toHaveLength(0);
  });

  test('concurrent login attempts work without conflicts', async ({ context }) => {
    // Create multiple pages to simulate concurrent login attempts
    const pages: Page[] = [];
    const errors: string[] = [];
    
    try {
      // Create 3 concurrent browser tabs
      for (let i = 0; i < 3; i++) {
        const page = await context.newPage();
        pages.push(page);
        
        // Monitor each page for errors
        page.on('response', response => {
          if (response.status() >= 500) {
            errors.push(`Page ${i}: ${response.status()} error on ${response.url()}`);
          }
        });

        page.on('pageerror', error => {
          errors.push(`Page ${i} JavaScript error: ${error.message}`);
        });
      }

      // Simultaneously navigate all pages to home and trigger login
      await Promise.all(pages.map(async (page, i) => {
        await page.goto('/');
        await page.click('[data-testid="login-button"]');
      }));

      // Wait for all pages to complete authentication
      await Promise.all(pages.map(page => 
        page.waitForURL('**/dashboard**', { timeout: 15000 })
      ));

      // Verify all pages successfully loaded the dashboard
      for (const page of pages) {
        await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      }

      // Check that no race condition errors occurred
      expect(errors).toHaveLength(0);

    } finally {
      // Clean up pages
      await Promise.all(pages.map(page => page.close()));
    }
  });

  test('API endpoints handle concurrent authentication requests', async ({ page, context }) => {
    // Navigate to login
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    // Wait for authentication to complete
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    const errors: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 500) {
        errors.push(`${response.status()} error on ${response.url()}`);
      }
    });

    // Trigger multiple API calls that would hit getAuthenticatedUser
    const apiCalls = Promise.all([
      page.request.get('/api/user'),
      page.request.get('/api/user'),
      page.request.get('/api/user'),
      page.request.get('/api/appointments'),
      page.request.get('/api/customers'),
    ]);

    const responses = await apiCalls;

    // All API calls should succeed
    responses.forEach((response, index) => {
      expect(response.status()).toBeLessThan(500);
    });

    // No server errors should have occurred
    expect(errors).toHaveLength(0);
  });

  test('user data consistency across multiple page loads', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    // Get user data from first load
    const userData1 = await page.evaluate(() => {
      // Assuming user data is available in a global context or localStorage
      return JSON.parse(localStorage.getItem('user-data') || '{}');
    });

    // Reload the page multiple times quickly
    await Promise.all([
      page.reload(),
      page.reload(),
      page.reload(),
    ]);

    // Get user data after reloads
    const userData2 = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('user-data') || '{}');
    });

    // User data should be consistent
    expect(userData1.id).toBe(userData2.id);
    expect(userData1.email).toBe(userData2.email);
  });

  test('authentication works correctly with rapid navigation', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 500) {
        errors.push(`${response.status()} error on ${response.url()}`);
      }
    });

    // Login
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    // Rapidly navigate between protected routes that require authentication
    const navigationPromises = [
      page.goto('/dashboard/customers'),
      page.goto('/dashboard/appointments'),
      page.goto('/dashboard/pets'),
      page.goto('/dashboard/inventory'),
      page.goto('/dashboard'),
    ];

    await Promise.all(navigationPromises);

    // Wait for final page to fully load
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();

    // No authentication errors should have occurred
    expect(errors).toHaveLength(0);
  });

  test('super admin access works correctly after race condition fix', async ({ page }) => {
    // This test assumes you have a super admin test account
    // Skip if not in test environment with super admin access
    if (!process.env.TEST_SUPER_ADMIN_EMAIL) {
      test.skip();
    }

    const errors: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 500) {
        errors.push(`${response.status()} error on ${response.url()}`);
      }
    });

    // Login as super admin
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to admin panel for super admin
    await page.waitForURL('**/admin**', { timeout: 10000 });

    // Verify admin panel loads
    await expect(page.locator('[data-testid="admin-header"]')).toBeVisible();
    
    // Test admin functionality
    await page.click('[data-testid="tenants-tab"]');
    await expect(page.locator('[data-testid="tenants-list"]')).toBeVisible();

    // No errors should have occurred
    expect(errors).toHaveLength(0);
  });

  test('handles authentication with slow network conditions', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', route => {
      setTimeout(() => route.continue(), 100); // Add 100ms delay to all requests
    });

    const errors: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 500) {
        errors.push(`${response.status()} error on ${response.url()}`);
      }
    });

    // Login with slow network
    await page.goto('/');
    await page.click('[data-testid="login-button"]');
    
    // Authentication should still work, just slower
    await page.waitForURL('**/dashboard**', { timeout: 20000 }); // Increased timeout

    // Verify dashboard loads
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();

    // No race condition errors should occur even with slow network
    expect(errors).toHaveLength(0);
  });
}); 