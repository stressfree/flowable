# Browser MCP Responsive Check

**Purpose:** Verify the application renders correctly at mobile, tablet, and desktop breakpoints.

**Starting URL:** http://localhost:5173/companies

## Steps

### 1. Desktop Layout (1440px)
- Set viewport to 1440x900
- Navigate to http://localhost:5173/companies
- **Verify:** Sidebar is 220px wide on the left
- **Verify:** Main content area fills remaining space
- **Verify:** Company table is fully visible with all columns
- **Screenshot:** `responsive-desktop-companies.png`

### 2. Desktop Bundle Detail
- Still at 1440x900, navigate to a bundle detail page
- **Verify:** File table, validation panel, and action buttons are all visible
- **Verify:** No horizontal scrolling needed
- **Screenshot:** `responsive-desktop-bundle-detail.png`

### 3. Desktop Viewer
- Click on a BPMN file
- **Verify:** Diagram viewer takes full width
- **Verify:** Zoom controls are accessible
- **Screenshot:** `responsive-desktop-viewer.png`

### 4. Laptop Layout (1280px)
- Set viewport to 1280x800
- Navigate to /companies
- **Verify:** Layout still works — sidebar visible, content area sufficient
- **Screenshot:** `responsive-laptop-companies.png`

### 5. Tablet Landscape (1024px)
- Set viewport to 1024x768
- Navigate to /companies
- **Verify:** Sidebar still visible (may be narrower)
- **Verify:** Table might have fewer columns or smaller text
- **Screenshot:** `responsive-tablet-landscape.png`

### 6. Tablet Portrait (768px)
- Set viewport to 768x1024
- Navigate to /companies
- **Verify:** Sidebar may collapse to icons only or hamburger menu
- **Verify:** Content area takes most of the width
- **Verify:** Company cards or simplified list instead of full table
- **Screenshot:** `responsive-tablet-portrait.png`

### 7. Mobile Large (414px)
- Set viewport to 414x896
- Navigate to /companies
- **Verify:** Sidebar collapses (hamburger menu or hidden)
- **Verify:** Content is single-column
- **Verify:** Company list shows as cards or stacked rows
- **Screenshot:** `responsive-mobile-large.png`

### 8. Mobile Bundles List
- Still at 414px, navigate to /bundles
- **Verify:** Filter bar stacks vertically
- **Verify:** Bundle list is single-column
- **Verify:** Badges and status are still visible
- **Screenshot:** `responsive-mobile-bundles.png`

### 9. Mobile Bundle Detail
- Click on a bundle
- **Verify:** Action buttons stack vertically
- **Verify:** File table becomes card list or horizontal scroll
- **Verify:** Validation panel is full width
- **Screenshot:** `responsive-mobile-bundle-detail.png`

### 10. Mobile Help Panel
- Still at 414px, open help panel
- **Verify:** Panel takes full width (100% instead of 380px)
- **Verify:** Panel is still scrollable
- **Screenshot:** `responsive-mobile-help.png`

### 11. Mobile Viewer
- Navigate to a diagram viewer
- **Verify:** Diagram is viewable (may need scrolling)
- **Verify:** Zoom controls are accessible
- **Screenshot:** `responsive-mobile-viewer.png`

### 12. Small Mobile (375px)
- Set viewport to 375x812 (iPhone X)
- Navigate to /companies
- **Verify:** Everything still renders without overflow
- **Verify:** Text is readable
- **Screenshot:** `responsive-small-mobile.png`

### 13. Sidebar Toggle (Mobile)
- On mobile viewport, verify sidebar can be toggled
- Look for hamburger menu or menu button
- Click it to open sidebar
- **Verify:** Sidebar slides in as overlay
- Click outside to close
- **Screenshot:** `responsive-sidebar-toggle.png`

## What to Verify
- [ ] Desktop (1440px+): Full layout with sidebar, all content visible
- [ ] Laptop (1280px): Layout works without issues
- [ ] Tablet (768-1024px): Sidebar may collapse, content reflows
- [ ] Mobile (375-414px): Single-column layout, sidebar hidden/toggleable
- [ ] Help panel takes full width on mobile
- [ ] Diagram viewer is usable on all screen sizes
- [ ] No horizontal overflow on any breakpoint
- [ ] All interactive elements remain accessible (buttons, links, forms)
- [ ] Text is readable at all breakpoints
