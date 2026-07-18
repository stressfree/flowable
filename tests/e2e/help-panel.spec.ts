import { test, expect } from '@playwright/test';

test.describe('Help Panel', () => {
  test('open help panel from sidebar', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.getByRole('heading', { name: 'Companies' })).toBeVisible();

    // Sidebar has a "Help & Docs" button
    const helpButton = page.getByRole('button', { name: /help & docs/i });
    await helpButton.click();

    // Panel slides in with its heading
    await expect(page.getByRole('heading', { name: 'Help & Docs' })).toBeVisible({
      timeout: 5000,
    });
  });

  test('help panel shows article categories and titles', async ({ page }) => {
    await page.goto('/companies');

    await page.getByRole('button', { name: /help & docs/i }).click();

    await expect(page.getByRole('heading', { name: 'Help & Docs' })).toBeVisible({
      timeout: 5000,
    });

    // Categories are rendered as uppercase labels
    await expect(page.getByText('Getting Started')).toBeVisible();
    await expect(page.getByText('Learn More')).toBeVisible();

    // Article titles from the seed content
    await expect(page.getByText('What is a Decisioning Bundle?')).toBeVisible();
    await expect(page.getByText('About BPMN')).toBeVisible();
  });

  test('search help articles', async ({ page }) => {
    await page.goto('/companies');

    await page.getByRole('button', { name: /help & docs/i }).click();

    const searchInput = page.getByPlaceholder('Search articles...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('bundle');

    // Filtered results should still include bundle-related articles
    await expect(page.getByText('What is a Decisioning Bundle?')).toBeVisible();

    // Articles unrelated to "bundle" should be filtered out, e.g. "About BPMN"
    await expect(page.getByText('About BPMN')).toHaveCount(0);
  });

  test('search with no matches shows empty state', async ({ page }) => {
    await page.goto('/companies');

    await page.getByRole('button', { name: /help & docs/i }).click();

    const searchInput = page.getByPlaceholder('Search articles...');
    await searchInput.fill('zzzznonexistent');

    await expect(page.getByText(/no articles found/i)).toBeVisible({ timeout: 5000 });
  });

  test('navigate to article view', async ({ page }) => {
    await page.goto('/companies');

    await page.getByRole('button', { name: /help & docs/i }).click();

    // Click on an article title (rendered as a button)
    const articleButton = page.getByText('What is a Decisioning Bundle?');
    await articleButton.click();

    // Article view renders a "Back to articles" button and the article heading
    await expect(page.getByText('Back to articles')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('What is a Decisioning Bundle?')).toBeVisible();
  });

  test('article view shows content blocks', async ({ page }) => {
    await page.goto('/companies');

    await page.getByRole('button', { name: /help & docs/i }).click();
    await page.getByText('Validating Your Bundles').click();

    // Article content includes headings and lists from the seed content
    await expect(page.getByText('Back to articles')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('What Gets Validated')).toBeVisible();
  });

  test('external links in Learn More articles', async ({ page }) => {
    await page.goto('/companies');

    await page.getByRole('button', { name: /help & docs/i }).click();

    // Open a Learn More article that contains external links
    await page.getByText('About BPMN').click();
    await expect(page.getByText('Back to articles')).toBeVisible({ timeout: 3000 });

    // External links render as anchors with target="_blank"
    const specLink = page.getByRole('link', { name: /OMG BPMN Specification/i });
    await expect(specLink).toBeVisible({ timeout: 3000 });
    await expect(specLink).toHaveAttribute('target', '_blank');

    const flowableLink = page.getByRole('link', { name: /Flowable BPMN Documentation/i });
    await expect(flowableLink).toBeVisible({ timeout: 3000 });
    await expect(flowableLink).toHaveAttribute('target', '_blank');
  });

  test('close help panel with X button', async ({ page }) => {
    await page.goto('/companies');

    await page.getByRole('button', { name: /help & docs/i }).click();
    await expect(page.getByRole('heading', { name: 'Help & Docs' })).toBeVisible({
      timeout: 5000,
    });

    // Close button is the SVG-only button inside the panel header
    const closeButton = page
      .locator('h2:has-text("Help & Docs")')
      .locator('..')
      .getByRole('button');
    await closeButton.click();

    // Panel heading should no longer be visible
    await expect(page.getByRole('heading', { name: 'Help & Docs' })).toHaveCount(0, {
      timeout: 3000,
    });
  });

  test('close help panel with Escape key', async ({ page }) => {
    await page.goto('/companies');

    await page.getByRole('button', { name: /help & docs/i }).click();
    await expect(page.getByRole('heading', { name: 'Help & Docs' })).toBeVisible({
      timeout: 5000,
    });

    await page.keyboard.press('Escape');

    // Panel heading should no longer be visible
    await expect(page.getByRole('heading', { name: 'Help & Docs' })).toHaveCount(0, {
      timeout: 3000,
    });
  });

  test('contextual highlight on bundle detail page', async ({ page }) => {
    // Contextual highlight only appears on /bundles/:id (detail), not /bundles (list)
    await page.goto('/bundles');
    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    await page.getByRole('button', { name: /help & docs/i }).click();
    await expect(page.getByRole('heading', { name: 'Help & Docs' })).toBeVisible({
      timeout: 5000,
    });

    // On /bundles/:id, the contextual article is "Validating Your Bundles"
    await expect(page.getByText('Relevant to current page')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Validating Your Bundles').first()).toBeVisible();
  });
});
