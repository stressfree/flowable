import { test, expect } from '@playwright/test';

test.describe('Diagram Viewer', () => {
  test('open BPMN file in viewer', async ({ page }) => {
    await page.goto('/bundles');
    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();

    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    const bpmnLink = page.getByRole('link', { name: /\.bpmn$/i }).first();
    await expect(bpmnLink).toBeVisible();
    await bpmnLink.click();

    await expect(page).toHaveURL(/\/files\//);

    // bpmn-js renders a .djs-container with an embedded SVG canvas
    await expect(page.locator('.djs-container, .bjs-container').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 10000 });
  });

  test('verify canvas renders diagram elements', async ({ page }) => {
    await page.goto('/bundles');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    const bpmnLink = page.getByRole('link', { name: /\.bpmn$/i }).first();
    await expect(bpmnLink).toBeVisible();
    await bpmnLink.click();
    await expect(page).toHaveURL(/\/files\//);

    // Wait for the bpmn-js viewer to render its SVG canvas
    await expect(page.locator('.djs-container svg, .bjs-container svg').first()).toBeVisible({
      timeout: 10000,
    });

    // Diagram should have rendered shapes (rectangles, circles, polygons, .djs-element wrappers)
    const shapes = page.locator('svg rect, svg circle, svg polygon, .djs-element');
    await expect(shapes.first()).toBeVisible({ timeout: 5000 });
  });

  test('zoom and pan interactions keep canvas stable', async ({ page }) => {
    await page.goto('/bundles');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    const bpmnLink = page.getByRole('link', { name: /\.bpmn$/i }).first();
    await expect(bpmnLink).toBeVisible();
    await bpmnLink.click();
    await expect(page).toHaveURL(/\/files\//);

    const container = page.locator('.djs-container, .bjs-container').first();
    await expect(container).toBeVisible({ timeout: 10000 });

    // bpmn-js ships a zoomScroll module by default — mouse wheel inside the SVG should
    // not throw or blank the canvas. If a palette zoom control is present, click it too.
    const paletteZoom = page
      .locator('.djs-palette .entry[title*="zoom" i], .bjs-icon-zoom-in, .djs-icon-zoom-in')
      .first();
    if (await paletteZoom.isVisible({ timeout: 2000 }).catch(() => false)) {
      await paletteZoom.click();
      await page.waitForTimeout(300);
    }

    const svg = page.locator('svg').first();
    await svg.hover();
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(200);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(200);

    // Canvas should remain rendered after interactions
    await expect(container).toBeVisible();
    await expect(svg).toBeVisible();
  });

  test('open CMMN file in viewer', async ({ page }) => {
    // Bundle 4 (Card Controls) ships the only .cmmn file in the seed set
    await page.goto('/bundles');
    const cardControlsRow = page
      .locator('table tbody tr', { hasText: /Card Controls/i })
      .first();
    await expect(cardControlsRow).toBeVisible();
    await cardControlsRow.click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    const cmmnLink = page.getByRole('link', { name: /\.cmmn$/i }).first();
    await expect(cmmnLink).toBeVisible();
    await cmmnLink.click();
    await expect(page).toHaveURL(/\/files\//);

    // cmmn-js is the same family as bpmn-js — renders .djs-container + SVG
    await expect(page.locator('.djs-container, .cjs-container').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 10000 });
  });

  test('open DMN file in viewer', async ({ page }) => {
    await page.goto('/bundles');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    const dmnLink = page.getByRole('link', { name: /\.dmn$/i }).first();
    await expect(dmnLink).toBeVisible();
    await dmnLink.click();
    await expect(page).toHaveURL(/\/files\//);

    // dmn-js DRD viewer renders .djs-container + SVG; decision tables render as <table>
    await expect(
      page.locator('.djs-container, .dmn-container, .dmn-decision-table-container, svg, table').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('ELK layout produces non-empty diagram content', async ({ page }) => {
    await page.goto('/bundles');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    const bpmnLink = page.getByRole('link', { name: /\.bpmn$/i }).first();
    await expect(bpmnLink).toBeVisible();
    await bpmnLink.click();
    await expect(page).toHaveURL(/\/files\//);

    await expect(page.locator('.djs-container svg, .bjs-container svg').first()).toBeVisible({
      timeout: 10000,
    });

    // The rendered SVG should contain real shape markup, not an empty canvas
    const innerHtml = await page.locator('svg').first().innerHTML();
    expect(innerHtml.length).toBeGreaterThan(100);
  });
});
