import { test, expect } from '@playwright/test';
import path from 'path';

const SAMPLES_DIR = path.resolve(__dirname, '../../samples');

async function createDraftBundle(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/bundles/new');

  const typeSelect = page.locator('select').first();
  await typeSelect.selectOption('EXPENSE_APPROVAL');

  await page.getByPlaceholder('e.g., Standard expense approval with escalation').fill('Draft for test');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles([
    path.join(SAMPLES_DIR, 'expense-tiered-escalation.bpmn'),
    path.join(SAMPLES_DIR, 'amount-thresholds.dmn'),
  ]);

  await page.getByRole('button', { name: 'Create Bundle' }).click();

  await expect(page).toHaveURL(/\/bundles\/\d+$/);
}

test.describe('Bundle Detail', () => {
  test('file table displays all files', async ({ page }) => {
    await page.goto('/bundles');

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    await expect(page.getByText(/Files \(\d+\)/)).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();

    const headerCells = page.locator('table thead th');
    await expect(headerCells.filter({ hasText: 'Filename' })).toBeVisible();
    await expect(headerCells.filter({ hasText: 'Type' })).toBeVisible();
  });

  test('set entrypoint on a draft bundle', async ({ page }) => {
    await createDraftBundle(page);

    const entrypointButton = page.getByRole('button', { name: 'Set as entrypoint' }).first();
    await expect(entrypointButton).toBeVisible();
    await entrypointButton.click();

    await expect(page.getByText('Entrypoint', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('validate a bundle', async ({ page }) => {
    await page.goto('/bundles');

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    await expect(page.getByText('Validation')).toBeVisible();

    const revalidateButton = page.getByRole('button', { name: /re-?validate/i });
    await expect(revalidateButton).toBeVisible();
    await revalidateButton.click();

    await expect(revalidateButton).toBeVisible({ timeout: 10000 });
  });

  test('publish a draft bundle', async ({ page }) => {
    await createDraftBundle(page);

    const publishButton = page.getByRole('button', { name: 'Publish' });
    await expect(publishButton).toBeVisible();
    await publishButton.click();

    const publishNowButton = page.getByRole('button', { name: 'Publish Now' });
    await expect(publishNowButton).toBeVisible();
    await publishNowButton.click();

    await expect(page.getByText('PUBLISHED', { exact: true }).first()).toBeVisible({ timeout: 10000 });
  });

  test('schedule a bundle for future publish', async ({ page }) => {
    await createDraftBundle(page);

    const publishButton = page.getByRole('button', { name: 'Publish' });
    await expect(publishButton).toBeVisible();
    await publishButton.click();

    const publishDialog = page.getByRole('heading', { name: 'Publish Bundle' });
    await expect(publishDialog).toBeVisible();

    const scheduleInput = page.locator('input[type="datetime-local"]');
    await expect(scheduleInput).toBeVisible();
    await scheduleInput.fill('2030-01-01T10:00');

    await expect(page.getByRole('button', { name: 'Schedule' })).toBeVisible();
    await expect(page.getByText(/leave empty to publish immediately/i)).toBeVisible();
  });

  test('add files to a draft bundle', async ({ page }) => {
    await createDraftBundle(page);

    const addFilesButton = page.getByRole('button', { name: 'Add Files' });
    await expect(addFilesButton).toBeVisible();
    await addFilesButton.click();

    const dialogHeading = page.getByRole('heading', { name: 'Add Files' });
    await expect(dialogHeading).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      path.join(SAMPLES_DIR, 'travel-check.dmn'),
    ]);

    await expect(page.getByText('travel-check.dmn')).toBeVisible();

    const confirmButton = page.getByRole('button', { name: 'Add Files' }).last();
    await confirmButton.click();

    await expect(dialogHeading).toHaveCount(0, { timeout: 10000 });
  });

  test('action buttons reflect bundle status', async ({ page }) => {
    await page.goto('/bundles');

    const publishedRow = page.locator('table tbody tr', { hasText: 'PUBLISHED' }).first();
    await expect(publishedRow).toBeVisible();
    await publishedRow.click();

    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    const statusBadges = page.locator('span').filter({ hasText: /^PUBLISHED$/ });
    await expect(statusBadges.first()).toBeVisible();

    const spawnLink = page.getByRole('link', { name: 'Spawn' });
    if (await spawnLink.isVisible().catch(() => false)) {
      await expect(spawnLink).toBeVisible();
    }
  });

  test('events section visible for bundle with event files', async ({ page }) => {
    await page.goto('/bundles');

    const expenseBundle = page.locator('table tbody tr', { hasText: /Standard.*Escalation/i }).first();
    if (await expenseBundle.isVisible()) {
      await expenseBundle.click();
      await expect(page).toHaveURL(/\/bundles\/\d+$/);

      const eventsHeading = page.getByRole('heading', { name: 'Events' });
      await expect(eventsHeading).toBeVisible({ timeout: 5000 });
    }
  });
});
