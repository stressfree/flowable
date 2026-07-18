# Browser MCP Sample Bundles Visual Test

**Purpose:** Load all seeded sample bundles, open each diagram type, and verify ELK layout renders correctly.

**Starting URL:** http://localhost:5173/bundles

## Steps

### 1. Expense Approval 1A (BPMN + DMN + Event)
- Navigate to /bundles
- Click on "Expense Approval 1A: Standard with Time + Travel Escalation"
- **Verify:** 3 files visible: expense-standard-escalation.bpmn, travel-check.dmn, expense-submitted.event
- Click on expense-standard-escalation.bpmn
- **Verify:** BPMN diagram renders with start event, user tasks, DMN service task, gateways, boundary timer, end events
- **Verify:** ELK layout has proper spacing (no overlapping elements)
- **Screenshot:** `sample-1a-bpmn.png`
- Go back, click on travel-check.dmn
- **Verify:** DMN decision table renders
- **Screenshot:** `sample-1a-dmn.png`

### 2. Expense Approval 1B (BPMN + 2 DMN)
- Navigate to /bundles, find 1B bundle
- Click on expense-gov-client-review.bpmn
- **Verify:** Diagram shows line-item DMN, gov client gateway, travel check DMN, branching paths
- **Screenshot:** `sample-1b-bpmn.png`

### 3. Expense Approval 1C (BPMN + DMN)
- Navigate to /bundles, find 1C bundle
- Click on expense-tiered-escalation.bpmn
- **Verify:** Diagram shows 3-way gateway (AUTO/MANAGER/DUAL), boundary timers, escalation paths
- **Screenshot:** `sample-1c-bpmn.png`

### 4. Virtual Card Approval (BPMN + 2 DMN)
- Navigate to /bundles, find Virtual Card bundle
- Click on virtual-card-approval.bpmn
- **Verify:** Diagram shows eligibility check, manager approval, limit check, HTTP service task, rejection path
- **Screenshot:** `sample-virtual-card-bpmn.png`

### 5. Physical Card KYC (BPMN + 2 DMN)
- Navigate to /bundles, find Physical Card bundle
- Click on physical-card-kyc.bpmn
- **Verify:** Diagram shows KYC entry, validation DMN, loop-back, identity verification, risk assessment, 3-way risk gateway, HTTP service tasks
- **Screenshot:** `sample-physical-card-bpmn.png`

### 6. Card Controls CMMN
- Navigate to /bundles, find Card Controls bundle
- Click on card-controls-case.cmmn
- **Verify:** CMMN case diagram renders with stages, process tasks, human tasks, sentries
- **Screenshot:** `sample-card-controls-cmmn.png`
- Go back, click on card-controls-process.bpmn
- **Verify:** BPMN diagram shows DMN threshold check, 3-way gateway, manager/finance tasks
- **Screenshot:** `sample-card-controls-process-bpmn.png`
- Go back, click on apply-card-changes.bpmn
- **Verify:** Simple BPMN with HTTP service task and notification
- **Screenshot:** `sample-apply-changes-bpmn.png`

## What to Verify
- [ ] All 6 seeded bundles are visible in the bundles list
- [ ] BPMN diagrams render with bpmn-js (SVG elements visible)
- [ ] CMMN diagram renders with cmmn-js
- [ ] DMN tables render with dmn-js
- [ ] ELK layout produces non-overlapping, properly spaced elements
- [ ] All elements have labels (task names, gateway conditions)
- [ ] Boundary timer events are visible on applicable tasks
- [ ] HTTP service tasks are distinguishable from user tasks
