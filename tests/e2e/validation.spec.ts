import { test, expect } from '@playwright/test';

// Inline BPMN with a businessRuleTask whose decisionRef points at a decision id
// that is NOT present in this bundle. The CrossReferenceValidator inspects
// businessRuleTask[decisionRef] (BPMN namespace, unprefixed attribute) and will
// flag this as an unresolved reference.
const INVALID_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:flowable="http://flowable.org/bpmn"
             targetNamespace="http://test/invalid">
  <process id="invalidProcess" name="Invalid Process" isExecutable="true">
    <startEvent id="startEvent" name="Start" />
    <businessRuleTask id="missingDecisionTask" name="Check Missing Decision" decisionRef="missingDecisionId" />
    <endEvent id="endEvent" name="End" />
    <sequenceFlow id="flow1" sourceRef="startEvent" targetRef="missingDecisionTask" />
    <sequenceFlow id="flow2" sourceRef="missingDecisionTask" targetRef="endEvent" />
  </process>
</definitions>`;

// DMN that defines the decision id referenced above. Uploading this file to the
// invalid bundle should resolve the cross-reference on re-validation.
const RESOLVING_DMN = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"
             id="resolvingDmn" name="Resolving Decision">
  <decision id="missingDecisionId" name="Missing Decision">
    <decisionTable id="dt1" hitPolicy="FIRST">
      <input id="in1" label="Input">
        <inputExpression id="ie1" typeRef="string">
          <text>input</text>
        </inputExpression>
      </input>
      <output id="out1" label="Output" typeRef="string" />
      <rule id="r1">
        <inputEntry id="ie_r1"><text>"any"</text></inputEntry>
        <outputEntry id="oe_r1"><text>"ok"</text></outputEntry>
      </rule>
    </decisionTable>
  </decision>
</definitions>`;

async function createInvalidBundle(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/bundles/new');
  await expect(page.getByRole('heading', { name: 'New Bundle' })).toBeVisible();

  await page.locator('select').first().selectOption('EXPENSE_APPROVAL');
  await page.getByPlaceholder('e.g., Standard expense approval with escalation').fill(
    'Invalid bundle — missing decision ref',
  );

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: 'invalid-decision-ref.bpmn',
    mimeType: 'application/xml',
    buffer: Buffer.from(INVALID_BPMN),
  });

  await page.getByRole('button', { name: 'Create Bundle' }).click();
  await expect(page).toHaveURL(/\/bundles\/\d+$/);
}

test.describe('Cross-Reference Validation', () => {
  test('valid bundle shows no validation errors', async ({ page }) => {
    await page.goto('/bundles');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    await expect(page.getByText('Validation')).toBeVisible();

    // Seeded bundles are internally consistent — validator returns zero errors
    await expect(page.getByText('All cross-references valid')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/unresolved reference/i)).toHaveCount(0);
  });

  test('bundle with missing cross-refs shows structured errors', async ({ page }) => {
    await createInvalidBundle(page);

    // getBundle runs the validator live, so the error panel renders on load
    await expect(page.getByText('Validation')).toBeVisible();
    await expect(page.getByText(/unresolved reference/i).first()).toBeVisible({ timeout: 10000 });

    // Clicking Re-validate should keep the error visible
    const revalidateButton = page.getByRole('button', { name: /Re-?validate/i });
    await expect(revalidateButton).toBeVisible();
    await revalidateButton.click();
    await expect(page.getByText(/unresolved reference/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('validation error panel shows file and element details', async ({ page }) => {
    await createInvalidBundle(page);

    await expect(page.getByText(/unresolved reference/i).first()).toBeVisible({ timeout: 10000 });

    // Per-error card should expose structured fields from ValidationError
    await expect(page.getByText('invalid-decision-ref.bpmn')).toBeVisible();
    await expect(page.getByText('Element type:')).toBeVisible();
    await expect(page.getByText('Reference attribute:')).toBeVisible();
    await expect(page.getByText('Missing reference:')).toBeVisible();
    await expect(page.getByText('Element ID:')).toBeVisible();
    // The unresolved reference id should appear as code
    await expect(page.locator('code', { hasText: 'missingDecisionId' })).toBeVisible();
    // Suggestion line should mention uploading a DMN file
    await expect(page.getByText(/Upload a DMN file containing decision id="missingDecisionId"/i)).toBeVisible();
  });

  test('upload missing file and re-validate succeeds', async ({ page }) => {
    await createInvalidBundle(page);
    await expect(page.getByText(/unresolved reference/i).first()).toBeVisible({ timeout: 10000 });

    // Add the resolving DMN file via the "Add Files" dialog
    await page.getByRole('button', { name: 'Add Files' }).click();
    await expect(page.getByRole('heading', { name: 'Add Files' })).toBeVisible();

    const addFileInput = page.locator('input[type="file"]').first();
    await addFileInput.setInputFiles({
      name: 'resolving-decision.dmn',
      mimeType: 'application/xml',
      buffer: Buffer.from(RESOLVING_DMN),
    });

    await expect(page.getByText('resolving-decision.dmn')).toBeVisible();
    await page.getByRole('button', { name: 'Add Files' }).last().click();
    await expect(page.getByRole('heading', { name: 'Add Files' })).toHaveCount(0, { timeout: 10000 });

    // addFiles endpoint re-validates and returns fresh errors; the panel should flip to success
    await expect(page.getByText('All cross-references valid')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/unresolved reference/i)).toHaveCount(0);
  });

  test('re-validate button works', async ({ page }) => {
    await page.goto('/bundles');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/bundles\/\d+$/);

    const revalidateButton = page.getByRole('button', { name: /Re-?validate/i });
    await expect(revalidateButton).toBeVisible();

    // First click
    await revalidateButton.click();
    await expect(revalidateButton).toBeVisible({ timeout: 10000 });

    // Second click — re-validate again, page should remain functional
    await revalidateButton.click();
    await expect(revalidateButton).toBeVisible({ timeout: 10000 });
    await expect(page.locator('main')).toBeVisible();
  });
});
