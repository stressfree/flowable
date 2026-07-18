# Browser MCP Help Panel Visual Test

**Purpose:** Open the help panel, search articles, navigate between articles, and verify presentation quality.

**Starting URL:** http://localhost:5173/companies

## Steps

### 1. Open Help Panel
- On any page, click "Help & Docs" button in the sidebar footer
- **Verify:** Panel slides in from the right (300ms animation)
- **Verify:** Backdrop dims the main content
- **Verify:** Panel is approximately 380px wide
- **Screenshot:** `help-panel-open.png`

### 2. Verify Article Categories
- In the help panel, verify three categories are visible:
  - "Getting Started" section (6 articles)
  - "Reference" section (5 articles)
  - "Learn More" section (3 articles with external links)
- **Screenshot:** `help-categories.png`

### 3. Search Articles
- Click the search input in the help panel
- Type "bundle"
- **Verify:** Article list filters to show only matching articles
- **Verify:** At least 3 articles match (What is a Decisioning Bundle?, Creating Your First Bundle, etc.)
- Clear the search
- **Verify:** Full article list returns
- **Screenshot:** `help-search-bundle.png`

### 4. Open an Article
- Click on "What is a Decisioning Bundle?"
- **Verify:** Article list fades out, article content fades in
- **Verify:** Back link or button is visible
- **Verify:** Article content has headings, paragraphs, and possibly code blocks or callouts
- **Screenshot:** `help-article-detail.png`

### 5. Navigate Back to Article List
- Click the back link
- **Verify:** Returns to the article list
- **Screenshot:** `help-back-to-list.png`

### 6. Open Reference Article
- Click on "File Types: BPMN, CMMN, DMN"
- **Verify:** Article explains each file type
- **Verify:** Content is well-formatted with headings and paragraphs
- **Screenshot:** `help-file-types.png`

### 7. Check Learn More External Links
- Scroll to "Learn More" section
- Click on "About BPMN"
- **Verify:** Article has external links (to OMG spec or Flowable docs)
- **Verify:** Links open in new tab (target="_blank")
- **Screenshot:** `help-external-links.png`

### 8. Contextual Article Highlighting
- Navigate to /bundles (bundles list page)
- Open the help panel
- **Verify:** The "Validating Your Bundles" or "Sample Bundles Overview" article is highlighted or featured
- **Screenshot:** `help-contextual.png`

### 9. Close Help Panel
- Click the X button in the panel header
- **Verify:** Panel slides out to the right
- **Verify:** Main content is no longer dimmed
- **Screenshot:** `help-closed.png`

### 10. Close via Backdrop Click
- Open the panel again
- Click on the backdrop (dimmed area)
- **Verify:** Panel closes
- **Screenshot:** `help-backdrop-close.png`

### 11. Close via Escape Key
- Open the panel
- Press the Escape key
- **Verify:** Panel closes
- **Screenshot:** `help-escape-close.png`

## What to Verify
- [ ] Help panel slides in/out smoothly (Framer Motion animation)
- [ ] All 14 articles are present across 3 categories
- [ ] Search filters articles by title, summary, and content
- [ ] Article detail view renders rich content (headings, paragraphs, code, callouts)
- [ ] External links in "Learn More" open in new tabs
- [ ] Contextual highlighting works based on current route
- [ ] Panel closes via X button, backdrop click, and Escape key
- [ ] Backdrop dims main content when panel is open
