# Frontend — Decisioning Bundle Manager

React 19 SPA for managing decisioning bundles, built with Vite 8, TanStack Query 5, and Tailwind CSS 4.

## Purpose

- View and manage companies with hierarchical tree display
- Create bundles with drag-and-drop file upload
- Browse all bundles with filterable list view
- Manage bundle lifecycle (publish, schedule, archive, spawn)
- View BPMN/CMMN/DMN diagrams with zoom/pan
- Spawn Flowable processes with dynamic variable forms
- Browse searchable online help (14 articles)
- Structured error display with actionable suggestions

## Tech Stack

| Component | Version |
|-----------|---------|
| React | 19.x |
| Vite | 8.x |
| React Router | 8.x |
| TanStack Query | 5.x |
| Tailwind CSS | 4.x |
| Framer Motion | 12.x |
| bpmn-js | 18.x |
| cmmn-js | 0.20.x |
| dmn-js | 17.x |
| React Hook Form | 7.x |
| Zod | 4.x |
| Sonner | 2.x |
| Vitest | 4.x |
| React Testing Library | 16.x |
| MSW | 2.x |

## Building

```bash
cd frontend

# Install dependencies
npm install

# Development server (with API proxy to backend)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

The dev server runs on **http://localhost:5173** with `/v1` API calls proxied to the backend at `http://localhost:8080`.

For production, the built artifacts in `frontend/dist/` are served by nginx (see `nginx.conf` and `docker-compose.yml`), which proxies `/v1` to the backend container.

## Testing

```bash
# Run tests
npx vitest run

# Run tests with coverage
npx vitest run --coverage

# Run tests in watch mode
npx vitest
```

**Test coverage target:** 85% minimum (Vitest c8)

Tests use MSW (Mock Service Worker) to mock API responses. The test setup properly starts/stops the MSW server in `beforeAll`/`afterEach`/`afterAll` hooks.

## Visual Design

Light professional theme (Stripe-inspired):
- Background: `#f9fafb`
- Cards: `#ffffff` with `1px solid #e5e7eb` borders
- Primary accent: `#4f46e5` (indigo)
- Status badges: emerald (published), amber (draft), zinc (archived)

## Directory Structure

```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── nginx.conf
├── index.html
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Routes + Suspense
│   ├── index.css                 # Tailwind import
│   ├── api/                      # TanStack Query hooks
│   │   ├── companies.ts
│   │   └── bundles.ts
│   ├── components/
│   │   ├── layout/               # AppLayout, Sidebar
│   │   ├── companies/            # CompanyTable, CompanyHierarchy
│   │   ├── bundles/              # BundleFileDropzone
│   │   ├── viewer/               # ModelViewer (bpmn-js/cmmn-js/dmn-js)
│   │   ├── validation/           # ValidationErrorsPanel
│   │   ├── spawn/                # SpawnForm
│   │   ├── help/                 # HelpPanel, articles, search
│   │   └── error/                # ErrorBoundary
│   ├── pages/                    # Page components
│   ├── lib/                      # API client with error parsing
│   └── types/                    # TypeScript interfaces
└── tests/
    ├── unit/                     # Vitest component tests
    ├── e2e/                      # Playwright E2E specs
    └── browser-mcp/              # Browser MCP verification scripts
```
