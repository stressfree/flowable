import { test, expect } from '@playwright/test';

test.describe('Bundle List', () => {
  test('view all bundles', async ({ page }) => {
    await page.goto('/bundles');

    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();

    const bundleRows = page.locator('table tbody tr');
    await expect(bundleRows.first()).toBeVisible();
    const count = await bundleRows.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('filter by bundle type', async ({ page }) => {
    await page.goto('/bundles');

    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();

    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('EXPENSE_APPROVAL');

    await expect(page.locator('table tbody tr').first()).toBeVisible();

    const typeCells = page.locator('table tbody tr td:nth-child(1)');
    const count = await typeCells.count();
    for (let i = 0; i < count; i++) {
      await expect(typeCells.nth(i)).toContainText(/expense approval/i);
    }
  });

  test('filter by company', async ({ page }) => {
    await page.goto('/bundles');

    const companySelect = page.locator('select').nth(1);
    const acmeOption = companySelect.locator('option').filter({ hasText: /^Acme Corp$/ }).first();
    const acmeValue = await acmeOption.getAttribute('value');
    await companySelect.selectOption(acmeValue);

    await expect(page.locator('table tbody tr').first()).toBeVisible();

    const companyCells = page.locator('table tbody tr td:nth-child(2)');
    const count = await companyCells.count();
    for (let i = 0; i < count; i++) {
      await expect(companyCells.nth(i)).toContainText(/acme corp/i);
    }
  });

  test('filter by status', async ({ page }) => {
    await page.goto('/bundles');

    const statusSelect = page.locator('select').nth(2);
    await statusSelect.selectOption('PUBLISHED');

    await expect(page.locator('table tbody tr').first()).toBeVisible();

    const statusCells = page.locator('table tbody tr td:nth-child(3)');
    const count = await statusCells.count();
    for (let i = 0; i < count; i++) {
      await expect(statusCells.nth(i)).toContainText(/published/i);
    }
  });

  test('click through to bundle detail', async ({ page }) => {
    await page.goto('/bundles');

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    await expect(page).toHaveURL(/\/bundles\/\d+$/);
  });
});
