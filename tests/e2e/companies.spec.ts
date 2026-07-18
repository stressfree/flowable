import { test, expect } from '@playwright/test';

test.describe('Company CRUD', () => {
  test('empty state shows create prompt', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.locator('main')).toBeVisible();
    const h1 = page.getByRole('heading', { name: 'Companies' });
    await expect(h1).toBeVisible();
    const newCompanyLink = page.getByRole('link', { name: /new company/i });
    await expect(newCompanyLink).toBeVisible();
  });

  test('create a new company', async ({ page }) => {
    await page.goto('/companies/new');

    await expect(page.getByRole('heading', { name: 'New Company' })).toBeVisible();

    await page.getByPlaceholder('e.g., Acme Corp').fill('Playwright Test Corp');
    await page.getByRole('button', { name: 'Create Company' }).click();

    await expect(page).toHaveURL(/\/companies\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Playwright Test Corp' })).toBeVisible();
  });

  test('company appears in list', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.getByRole('heading', { name: 'Companies' })).toBeVisible();
    await expect(page.getByText('Acme Corp').first()).toBeVisible();
  });

  test('create child company with parent', async ({ page }) => {
    await page.goto('/companies/new');

    await page.getByPlaceholder('e.g., Acme Corp').fill('Playwright Child Corp');

    const parentSelect = page.locator('select').filter({ hasText: /Acme Corp/i });
    const acmeOption = parentSelect.locator('option').filter({ hasText: /Acme Corp/i }).first();
    const acmeValue = await acmeOption.getAttribute('value');
    await parentSelect.selectOption(acmeValue);

    await page.getByRole('button', { name: 'Create Company' }).click();

    await expect(page).toHaveURL(/\/companies\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Playwright Child Corp' })).toBeVisible();
  });

  test('company detail shows hierarchy', async ({ page }) => {
    await page.goto('/companies');

    const acmeLink = page.getByRole('link', { name: 'Acme Corp', exact: true }).first();
    await acmeLink.click();

    await expect(page).toHaveURL(/\/companies\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible();
    await expect(page.getByText('Hierarchy')).toBeVisible();
    await expect(page.getByText('Child Companies')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Acme EU' }).first()).toBeVisible();
  });

  test('delete company without bundles', async ({ page }) => {
    await page.goto('/companies/new');
    await page.getByPlaceholder('e.g., Acme Corp').fill('Delete Me Corp');
    await page.getByRole('button', { name: 'Create Company' }).click();

    await expect(page).toHaveURL(/\/companies\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Delete Me Corp' })).toBeVisible();

    await page.goto('/companies');

    const row = page.locator('tr', { hasText: 'Delete Me Corp' });
    await row.getByRole('button', { name: 'Delete' }).click();

    await row.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByText('Delete Me Corp')).toHaveCount(0);
  });
});
