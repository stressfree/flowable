import { test, expect } from '@playwright/test';

test.describe('Error Pages', () => {
  test('404 page for non-existent bundle', async ({ page }) => {
    await page.goto('/bundles/999999');

    // BundleDetailPage renders an inline not-found state for missing bundles
    await expect(page.getByText(/bundle not found/i)).toBeVisible({ timeout: 5000 });
  });

  test('404 page for non-existent company', async ({ page }) => {
    await page.goto('/companies/999999');

    // CompanyDetailPage renders an inline not-found state for missing companies
    await expect(page.getByText(/company not found/i)).toBeVisible({ timeout: 5000 });
  });

  test('error page has navigation back to safety', async ({ page }) => {
    await page.goto('/bundles/999999');

    // Inline not-found state has a "Back to Bundles" link
    const backButton = page.getByRole('link', { name: /back to bundles/i });
    await expect(backButton).toBeVisible({ timeout: 5000 });
  });

  test('company not-found has navigation back to companies', async ({ page }) => {
    await page.goto('/companies/999999');

    const backButton = page.getByRole('link', { name: /back to companies/i });
    await expect(backButton).toBeVisible({ timeout: 5000 });
  });

  test('API error shows toast notification', async ({ page }) => {
    await page.goto('/companies/new');

    // Intercept the POST /v1/companies call and return a 400
    await page.route('**/v1/companies', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'https://flowable-v2/errors/bad-request',
          title: 'Bad Request',
          status: 400,
          detail: 'Company name is required',
        }),
      });
    });

    // Fill a name so the client-side zod validation passes, then submit so the
    // API call is made (and intercepted with an error)
    await page.getByPlaceholder('e.g., Acme Corp').fill('Toast Error Corp');
    await page.getByRole('button', { name: 'Create Company' }).click();

    // Sonner toast should surface the API error detail
    await expect(page.getByText(/company name is required/i)).toBeVisible({ timeout: 5000 });
  });

  test('form validation errors show inline', async ({ page }) => {
    await page.goto('/companies/new');

    // Submit without filling the required name field
    await page.getByRole('button', { name: 'Create Company' }).click();

    // Zod validation message rendered inline under the name input
    await expect(page.getByText('Name is required')).toBeVisible({ timeout: 5000 });
  });

  test('non-existent route shows error boundary', async ({ page }) => {
    await page.goto('/nonexistent-route-xyz');

    // The ErrorPage component uses useRouteError() which requires a data router.
    // Since the app uses component routing, ErrorBoundary catches the thrown error
    // and renders its own "Something went wrong" fallback.
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText(/unexpected error occurred while rendering/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test('non-existent route has reload button', async ({ page }) => {
    await page.goto('/nonexistent-route-xyz');

    const reloadButton = page.getByRole('button', { name: /reload page/i });
    await expect(reloadButton).toBeVisible({ timeout: 5000 });
  });
});
