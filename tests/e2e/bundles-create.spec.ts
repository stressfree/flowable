import { test, expect } from '@playwright/test';
import path from 'path';

const SAMPLES_DIR = path.resolve(__dirname, '../../samples');

test.describe('Bundle Creation', () => {
  test('create a new bundle with files', async ({ page }) => {
    await page.goto('/bundles/new');

    await expect(page.getByRole('heading', { name: 'New Bundle' })).toBeVisible();

    const typeSelect = page.locator('select').nth(0);
    await typeSelect.selectOption('EXPENSE_APPROVAL');

    await page.getByPlaceholder('e.g., Standard expense approval with escalation').fill('Playwright test bundle');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      path.join(SAMPLES_DIR, 'expense-tiered-escalation.bpmn'),
      path.join(SAMPLES_DIR, 'amount-thresholds.dmn'),
    ]);

    await expect(page.getByText('expense-tiered-escalation.bpmn')).toBeVisible();
    await expect(page.getByText('amount-thresholds.dmn')).toBeVisible();

    await page.getByRole('button', { name: 'Create Bundle' }).click();

    await expect(page).toHaveURL(/\/bundles\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Playwright test bundle' })).toBeVisible();
  });

  test('bundle detail renders files array', async ({ page }) => {
    await page.goto('/bundles');

    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    await expect(page.getByText(/Files \(\d+\)/)).toBeVisible();
    const fileTable = page.locator('table').first();
    await expect(fileTable).toBeVisible();

    await expect(page.getByText(/\.bpmn|\.dmn|\.cmmn|\.event/i).first()).toBeVisible();
  });
});
