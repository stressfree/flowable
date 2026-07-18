import { test, expect } from '@playwright/test';

test.describe('Visual Rendering', () => {
  test('company list page renders correctly', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.getByRole('heading', { name: 'Companies' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('company-list.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  test('bundle list page renders correctly', async ({ page }) => {
    await page.goto('/bundles');
    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('bundle-list.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  test('bundle detail page renders correctly', async ({ page }) => {
    await page.goto('/bundles');
    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();
    await page.waitForLoadState('networkidle');

    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('bundle-detail.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  test('diagram viewer renders correctly', async ({ page }) => {
    await page.goto('/bundles');
    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();
    await page.waitForLoadState('networkidle');

    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    const bpmnLink = page.getByRole('link', { name: /\.bpmn$/i }).first();
    await expect(bpmnLink).toBeVisible();
    await bpmnLink.click();
    await expect(page).toHaveURL(/\/files\//);

    // Wait for bpmn-js to render the SVG canvas
    await expect(page.locator('.djs-container, .bjs-container').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('diagram-viewer.png', {
      maxDiffPixelRatio: 0.15,
    });
  });

  test('help panel renders correctly', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.getByRole('heading', { name: 'Companies' })).toBeVisible();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /help & docs/i }).click();
    // Wait for framer-motion slide-in animation to settle
    await expect(page.getByRole('heading', { name: 'Help & Docs' })).toBeVisible({
      timeout: 5000,
    });
    await page.waitForTimeout(500);

    // Panel is 380px wide on desktop, fixed to the right edge
    await expect(page).toHaveScreenshot('help-panel.png', {
      maxDiffPixelRatio: 0.1,
      clip: { x: 0, y: 0, width: 600, height: 800 },
    });
  });

  test('error page renders correctly', async ({ page }) => {
    await page.goto('/nonexistent-route-xyz');
    // ErrorBoundary renders "Something went wrong" for non-existent routes
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toBeVisible({
      timeout: 5000,
    });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('error-page.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  test('bundle not-found renders correctly', async ({ page }) => {
    await page.goto('/bundles/999999');
    await expect(page.getByText(/bundle not found/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('bundle-not-found.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  test('sidebar renders with branding and nav', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.getByRole('heading', { name: 'Companies' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Sidebar is 220px wide on the left
    await expect(page).toHaveScreenshot('sidebar.png', {
      maxDiffPixelRatio: 0.05,
      clip: { x: 0, y: 0, width: 220, height: 800 },
    });
  });

  test('status badges render with correct colors', async ({ page }) => {
    await page.goto('/bundles');
    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Seed data guarantees at least one PUBLISHED bundle
    const publishedBadge = page
      .locator('span', { hasText: /^PUBLISHED$/ })
      .first();
    await expect(publishedBadge).toBeVisible();

    // Screenshot the badge area to verify emerald color styling
    await expect(page).toHaveScreenshot('status-badges.png', {
      maxDiffPixelRatio: 0.1,
      clip: { x: 0, y: 120, width: 1280, height: 200 },
    });
  });

  test('company create form renders correctly', async ({ page }) => {
    await page.goto('/companies/new');
    await expect(page.getByRole('heading', { name: 'New Company' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('company-create.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  test('bundle create form renders correctly', async ({ page }) => {
    await page.goto('/bundles/new');
    await expect(page.getByRole('heading', { name: 'New Bundle' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('bundle-create.png', {
      maxDiffPixelRatio: 0.1,
    });
  });
});
