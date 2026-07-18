# Browser MCP Error Scenarios Test

**Purpose:** Trigger each error type and verify the error messaging is clear, actionable, and correctly displayed.

**Starting URL:** http://localhost:5173/companies

## Steps

### 1. 404 — Non-existent Bundle
- Navigate to http://localhost:5173/bundles/999999
- **Verify:** Error page displays with 404 message
- **Verify:** Navigation back to safety (link to /bundles or /companies)
- **Screenshot:** `error-404-bundle.png`

### 2. 404 — Non-existent Company
- Navigate to http://localhost:5173/companies/999999
- **Verify:** Error page displays with 404 message
- **Screenshot:** `error-404-company.png`

### 3. 404 — Non-existent Route
- Navigate to http://localhost:5173/nonexistent-page
- **Verify:** Error page or redirect to 404
- **Screenshot:** `error-404-route.png`

### 4. Form Validation Error
- Navigate to /companies/new
- Click Create without entering a name
- **Verify:** Inline validation error appears ("Name is required" or similar)
- **Verify:** Form does not submit
- **Screenshot:** `error-form-validation.png`

### 5. Cross-Reference Validation Error
- Navigate to /bundles/new
- Create a bundle with only expense-tiered-escalation.bpmn (no DMN)
- After creation, click "Validate"
- **Verify:** Error panel appears with red styling
- **Verify:** Error shows: file name, element type (businessRuleTask/serviceTask), missing reference (amount-thresholds), suggestion text
- **Screenshot:** `error-cross-reference.png`

### 6. Lifecycle Error — Publish with Validation Errors
- Using the bundle from step 5 (with missing DMN)
- Try to click "Publish"
- **Verify:** Error message appears — "Cannot publish with unresolved validation errors"
- **Verify:** Bundle remains in DRAFT status
- **Screenshot:** `error-publish-with-errors.png`

### 7. API Error Toast
- Navigate to /companies/new
- Enter a name, submit the form
- If the company name already exists or API returns an error
- **Verify:** Toast notification appears (red) with error title and detail
- **Verify:** Toast auto-dismisses after a few seconds or has a close button
- **Screenshot:** `error-toast.png`

### 8. Delete Company with Bundles
- Navigate to a company that has bundles (e.g., Acme Corp)
- Click "Delete"
- **Verify:** Error message — "Company has bundles, cannot delete"
- **Verify:** Company is NOT deleted
- **Screenshot:** `error-delete-with-bundles.png`

## What to Verify
- [ ] 404 pages display for non-existent bundles, companies, and routes
- [ ] 404 pages have navigation back to a safe page
- [ ] Form validation shows inline errors (red border + message)
- [ ] Cross-reference validation errors show structured error panel with file, element, reference, and suggestion
- [ ] Lifecycle errors prevent invalid state transitions
- [ ] API errors show as toast notifications
- [ ] Delete protection works for companies with bundles
- [ ] Error messages are clear and actionable
