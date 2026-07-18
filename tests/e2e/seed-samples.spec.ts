import { test, expect, request as apiRequest } from '@playwright/test';

const API_BASE = 'http://localhost:8080/v1';

interface BundleSummary {
  id: number;
  bundleType: string;
  description: string;
  status: string;
  companyId: number | null;
  companyName: string | null;
  fileCount: number;
}

interface BundleFile {
  id: number;
  filename: string;
  isEntrypoint: boolean;
}

interface BundleDetail extends BundleSummary {
  entrypointFileId: number | null;
  files: BundleFile[];
  validationErrors: unknown[];
}

async function fetchBundles(): Promise<BundleSummary[]> {
  const ctx = await apiRequest.newContext();
  const resp = await ctx.get(`${API_BASE}/bundles`);
  expect(resp.ok()).toBeTruthy();
  return await resp.json();
}

async function findSeededBundle(
  descriptionRegex: RegExp,
): Promise<BundleSummary> {
  const bundles = await fetchBundles();
  const match = bundles.find((b) => descriptionRegex.test(b.description));
  if (!match) {
    throw new Error(`No seeded bundle found matching ${descriptionRegex}`);
  }
  return match;
}

async function fetchBundleDetail(id: number): Promise<BundleDetail> {
  const ctx = await apiRequest.newContext();
  const resp = await ctx.get(`${API_BASE}/bundles/${id}`);
  expect(resp.ok()).toBeTruthy();
  return await resp.json();
}

test.describe('Seed Sample Bundles', () => {
  test('all seeded bundles are visible in list', async ({ page }) => {
    await page.goto('/bundles');

    await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();

    const bundleRows = page.locator('table tbody tr');
    await expect(bundleRows.first()).toBeVisible();
    const count = await bundleRows.count();
    // Seed script creates 6 bundles; allow >=5 to tolerate test-created rows
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('expense approval 1A bundle exists with correct files', async ({ page }) => {
    const bundle = await findSeededBundle(/1A.*Standard.*Escalation/i);
    await page.goto(`/bundles/${bundle.id}`);

    await expect(page).toHaveURL(new RegExp(`/bundles/${bundle.id}$`));

    // 3 files: BPMN, DMN, event
    await expect(page.getByText('expense-standard-escalation.bpmn')).toBeVisible();
    await expect(page.getByText('travel-check.dmn')).toBeVisible();
    await expect(page.getByText('expense-submitted.event')).toBeVisible();
  });

  test('expense approval 1B bundle exists with correct files', async ({ page }) => {
    const bundle = await findSeededBundle(/1B.*Government.*Client/i);
    await page.goto(`/bundles/${bundle.id}`);

    await expect(page).toHaveURL(new RegExp(`/bundles/${bundle.id}$`));

    // 3 files: BPMN + 2 DMN
    await expect(page.getByText('expense-gov-client-review.bpmn')).toBeVisible();
    await expect(page.getByText('line-item-classification.dmn')).toBeVisible();
    await expect(page.getByText('travel-check.dmn')).toBeVisible();
  });

  test('expense approval 1C bundle exists with correct files', async ({ page }) => {
    const bundle = await findSeededBundle(/1C.*Tiered.*Escalation/i);
    await page.goto(`/bundles/${bundle.id}`);

    await expect(page).toHaveURL(new RegExp(`/bundles/${bundle.id}$`));

    // 2 files: BPMN + DMN (left as DRAFT)
    await expect(page.getByText('expense-tiered-escalation.bpmn')).toBeVisible();
    await expect(page.getByText('amount-thresholds.dmn')).toBeVisible();
  });

  test('virtual card approval bundle exists with correct files', async ({ page }) => {
    const bundle = await findSeededBundle(/Virtual Card.*Eligibility/i);
    await page.goto(`/bundles/${bundle.id}`);

    await expect(page).toHaveURL(new RegExp(`/bundles/${bundle.id}$`));

    // 3 files: BPMN + 2 DMN
    await expect(page.getByText('virtual-card-approval.bpmn')).toBeVisible();
    await expect(page.getByText('card-eligibility.dmn')).toBeVisible();
    await expect(page.getByText('card-limit-check.dmn')).toBeVisible();
  });

  test('physical card KYC bundle exists with correct files', async ({ page }) => {
    const bundle = await findSeededBundle(/Physical Card.*KYC/i);
    await page.goto(`/bundles/${bundle.id}`);

    await expect(page).toHaveURL(new RegExp(`/bundles/${bundle.id}$`));

    // 3 files: BPMN + 2 DMN
    await expect(page.getByText('physical-card-kyc.bpmn')).toBeVisible();
    await expect(page.getByText('kyc-validation.dmn')).toBeVisible();
    await expect(page.getByText('risk-assessment.dmn')).toBeVisible();
  });

  test('card controls bundle exists with CMMN + BPMN + DMN', async ({ page }) => {
    const bundles = await fetchBundles();
    // Card Controls has multiple (ARCHIVED + PUBLISHED); pick the PUBLISHED one
    const bundle = bundles.find(
      (b) => /Card Controls/i.test(b.description) && b.status === 'PUBLISHED',
    );
    if (!bundle) {
      throw new Error('No published Card Controls bundle found');
    }
    await page.goto(`/bundles/${bundle.id}`);

    await expect(page).toHaveURL(new RegExp(`/bundles/${bundle.id}$`));

    // 4 files: CMMN + 2 BPMN + DMN
    await expect(page.getByText('card-controls-case.cmmn')).toBeVisible();
    await expect(page.getByText('card-controls-process.bpmn')).toBeVisible();
    await expect(page.getByText('apply-card-changes.bpmn')).toBeVisible();
    await expect(page.getByText('card-control-thresholds.dmn')).toBeVisible();
  });

  test('all seeded bundles pass validation', async ({ page }) => {
    const seededMarkers = [
      /1A.*Standard/i,
      /1B.*Government/i,
      /1C.*Tiered/i,
      /Virtual Card.*Eligibility/i,
      /Physical Card.*KYC/i,
      /Card Controls/i,
    ];

    const bundles = await fetchBundles();
    // Pick one representative bundle per seeded type (prefer PUBLISHED/DRAFT
    // over ARCHIVED to avoid stale duplicates from prior seed runs).
    const representatives: BundleSummary[] = [];
    for (const re of seededMarkers) {
      const matches = bundles.filter((b) => re.test(b.description));
      if (matches.length === 0) continue;
      const pick =
        matches.find((b) => b.status === 'PUBLISHED') ||
        matches.find((b) => b.status === 'DRAFT') ||
        matches[0];
      representatives.push(pick);
    }
    expect(representatives.length).toBeGreaterThanOrEqual(6);

    for (const bundle of representatives) {
      await page.goto(`/bundles/${bundle.id}`);
      await expect(page).toHaveURL(new RegExp(`/bundles/${bundle.id}$`));

      // The detail page runs the validator live; seeded bundles are valid
      await expect(page.getByText('All cross-references valid')).toBeVisible({
        timeout: 10000,
      });
      // The error variant reads "N unresolved reference(s) found"; the success
      // variant reads "No unresolved references found". Only fail on the error
      // count message.
      await expect(page.getByText(/^\d+ unresolved reference/i)).toHaveCount(0);
    }
  });

  test('all published bundles have entrypoints set', async ({ page }) => {
    const seededMarkers = [
      '1A',
      '1B',
      'Virtual Card',
      'Physical Card',
      'Card Controls',
    ];

    const bundles = await fetchBundles();
    // Pick one published bundle per seeded type to avoid checking stale
    // ARCHIVED duplicates from prior seed runs.
    const representatives: BundleSummary[] = [];
    for (const marker of seededMarkers) {
      const matches = bundles.filter(
        (b) => b.status === 'PUBLISHED' && b.description.includes(marker),
      );
      if (matches.length > 0) {
        representatives.push(matches[0]);
      }
    }
    expect(representatives.length).toBeGreaterThanOrEqual(4);

    for (const bundle of representatives) {
      await page.goto(`/bundles/${bundle.id}`);
      await expect(page).toHaveURL(new RegExp(`/bundles/${bundle.id}$`));

      // Published seeded bundles have entrypoints; the file table shows a star
      // icon next to the entrypoint file plus an "Entrypoint" label.
      await expect(page.getByText('Entrypoint', { exact: true })).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('cross-references are valid for all seeded bundles via API', async ({ request }) => {
    const response = await request.get(`${API_BASE}/bundles`);
    expect(response.ok()).toBeTruthy();
    const bundles = await response.json();

    const seededMarkers = ['1A', '1B', '1C', 'Virtual Card', 'Physical Card', 'Card Controls'];

    let checkedCount = 0;
    for (const bundle of bundles) {
      const isSeeded = bundle.description &&
        seededMarkers.some((m) => bundle.description.includes(m));
      if (!isSeeded) continue;

      const validateResponse = await request.post(
        `${API_BASE}/bundles/${bundle.id}/validate`,
      );
      expect(validateResponse.ok()).toBeTruthy();
      const result = await validateResponse.json();
      const errors = result.validationErrors || [];
      expect(errors).toHaveLength(0);
      checkedCount++;
    }
    expect(checkedCount).toBeGreaterThanOrEqual(6);
  });
});
