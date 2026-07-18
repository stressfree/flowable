# Browser MCP Smoke Test

**Purpose:** Verify every page loads without errors, no console errors appear, and navigation works correctly.

**Starting URL:** http://localhost:5173/companies

## Steps

### 1. Load Companies Page
- Navigate to http://localhost:5173/companies
- Verify the page loads and the sidebar is visible
- Verify the page title contains "Companies" or shows a company table
- Check for console errors: should be none
- **Screenshot:** `smoke-companies.png`

### 2. Navigate to Bundles List
- Click the "Bundles" link in the sidebar
- Verify the bundles list page loads
- Verify at least 5 bundles are visible (from seed data)
- Check for console errors
- **Screenshot:** `smoke-bundles.png`

### 3. Navigate to New Bundle
- Click "New Bundle" in the sidebar
- Verify the bundle creation form loads
- Verify file upload dropzone is visible
- Verify bundle type selector is visible
- Check for console errors
- **Screenshot:** `smoke-new-bundle.png`

### 4. Navigate to Company Detail
- Go back to Companies
- Click on "Acme Corp" in the company list
- Verify the company detail page loads
- Verify company name, hierarchy, and bundles section are visible
- Check for console errors
- **Screenshot:** `smoke-company-detail.png`

### 5. Navigate to Bundle Detail
- Go to Bundles list
- Click on any bundle
- Verify the bundle detail page loads with file table, validation panel, and action buttons
- Check for console errors
- **Screenshot:** `smoke-bundle-detail.png`

### 6. Navigate to Bundle Viewer
- From bundle detail, click on a BPMN file
- Verify the diagram viewer page loads
- Verify the BPMN canvas renders (SVG element visible)
- Check for console errors
- **Screenshot:** `smoke-viewer.png`

### 7. Navigate to Spawn Page
- Go back to a published bundle detail
- Click the Spawn button
- Verify the spawn form page loads
- Verify process variables section is visible
- Check for console errors
- **Screenshot:** `smoke-spawn.png`

### 8. Open Help Panel
- From any page, click "Help & Docs" in the sidebar footer
- Verify the help panel slides in from the right
- Verify articles are listed
- Close the panel
- **Screenshot:** `smoke-help.png`

## What to Verify
- [ ] All 8 pages load without blank screens
- [ ] No JavaScript console errors on any page
- [ ] Sidebar navigation works between all sections
- [ ] Seed data is visible (companies, bundles)
- [ ] Diagram viewer renders SVG content
- [ ] Help panel opens and closes
