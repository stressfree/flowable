# Browser MCP Full CRUD Flow

**Purpose:** Complete company and bundle CRUD operations with visual verification at each step.

**Starting URL:** http://localhost:5173/companies

## Steps

### 1. Create Company
- Navigate to http://localhost:5173/companies/new
- Enter company name: "MCP Test Corp"
- Click Create
- **Verify:** Redirected to /companies/:id detail page
- **Verify:** Company name "MCP Test Corp" is displayed
- **Screenshot:** `crud-company-created.png`

### 2. Create Child Company
- Navigate to /companies/new
- Enter name: "MCP Child Corp"
- Select parent: "MCP Test Corp" (if dropdown visible)
- Click Create
- **Verify:** Detail page shows parent relationship
- **Screenshot:** `crud-child-company.png`

### 3. List Companies
- Navigate to /companies
- **Verify:** Both "MCP Test Corp" and "MCP Child Corp" appear in the list
- **Verify:** Acme Corp and other seeded companies are visible
- **Screenshot:** `crud-company-list.png`

### 4. Create Bundle
- Navigate to /bundles/new
- Select type: "Expense Approval"
- Select company: "MCP Test Corp"
- Enter description: "MCP CRUD test bundle"
- Upload files: expense-tiered-escalation.bpmn and amount-thresholds.dmn
- Click Create
- **Verify:** Redirected to bundle detail page
- **Verify:** Both files appear in the file table
- **Screenshot:** `crud-bundle-created.png`

### 5. Set Entrypoint
- On the bundle detail page, locate the BPMN file in the table
- Click "Set as Entrypoint" (or star icon) next to expense-tiered-escalation.bpmn
- **Verify:** Entrypoint indicator appears on the file
- **Screenshot:** `crud-entrypoint-set.png`

### 6. Validate Bundle
- Click the "Validate" button
- **Verify:** Validation panel shows success (green) — "All cross-references valid"
- **Screenshot:** `crud-validated.png`

### 7. Publish Bundle
- Click "Publish" button
- **Verify:** Status badge changes from DRAFT (amber) to PUBLISHED (emerald)
- **Screenshot:** `crud-published.png`

### 8. Spawn Process
- Click "Spawn" button
- **Verify:** Spawn form page loads with process variables
- Fill in variables (employeeId, amount, etc.)
- Click "Start Process Instance"
- **Verify:** Success message with instance ID
- **Screenshot:** `crud-spawned.png`

### 9. Verify Wiremock
- Open http://localhost:8081/__admin/requests in a new tab
- **Verify:** At least one request to /expense/notify is visible
- **Screenshot:** `crud-wiremock.png`

### 10. Archive Bundle (if applicable)
- Navigate back to the bundle (if DRAFT)
- Click "Archive" or "Discard"
- **Verify:** Status changes to ARCHIVED
- **Screenshot:** `crud-archived.png`

## What to Verify
- [ ] Company creation, child creation, listing all work
- [ ] Bundle creation with file upload works
- [ ] Entrypoint setting works
- [ ] Validation passes for valid bundles
- [ ] Publishing changes status correctly
- [ ] Spawning creates a process instance
- [ ] Wiremock receives HTTP calls from spawned processes
- [ ] Archive/discard works for draft bundles
