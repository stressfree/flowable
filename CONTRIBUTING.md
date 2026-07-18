# Contributing to Decisioning Bundle Manager v2

This guide covers project conventions, architecture, testing standards, and workflows for both human developers and AI agents.

---

## Architecture Overview

The project is a monorepo with four main modules:

```
flowable-v2/
├── backend/       # Spring Boot 4.0 + Flowable 8.0 (Java 21)
├── frontend/      # React 19 SPA (Vite 8, TypeScript)
├── mock-api/      # Wiremock stub mappings
└── samples/       # Sample BPMN/CMMN/DMN/Event files
```

**Data flow:** Frontend → REST API (`/v1/*`) → Spring Boot Controllers → Services → JPA Repositories → PostgreSQL 16

**Flowable integration:** The Flowable 8 engine is embedded in the Spring Boot application. All 6 engines (Process, EventRegistry, Idm, Dmn, Cmmn, App) are auto-configured. The app manages bundle deployments to Flowable and spawns process/case instances via `RepositoryService` and `RuntimeService`.

See [README.md](README.md) for the full architecture diagram.

---

## Technology Stack

### Backend

| Component | Version | Purpose |
|-----------|---------|---------|
| Spring Boot | 4.0.0 | Application framework |
| Flowable | 8.0.0 | Embedded workflow engine (BPMN, CMMN, DMN, Event Registry) |
| PostgreSQL | 16 | Primary database |
| Hibernate | 7.1 | ORM (managed by Spring Boot) |
| ELK | 0.11.0 | Diagram auto-layout (Eclipse Layout Kernel) |
| Liquibase | (managed) | Database migrations |
| Maven | 3.9 | Build tool |
| JUnit 5 | (managed) | Testing framework |
| Testcontainers | 1.21.4 | Integration test database |
| JaCoCo | 0.8.15 | Code coverage |

### Frontend

| Component | Version | Purpose |
|-----------|---------|---------|
| React | 19.x | UI framework |
| Vite | 8.x | Build tool |
| React Router | 8.x | Client-side routing |
| TanStack Query | 5.x | Server state management |
| Tailwind CSS | 4.x | Utility-first CSS |
| Framer Motion | 12.x | Animations |
| bpmn-js/dmn-js/cmmn-js | 18/17/0.20 | Process diagram viewers |
| React Hook Form + Zod | 7.x/4.x | Form handling and validation |
| Sonner | 2.x | Toast notifications |
| Vitest | 4.x | Unit/component testing |
| React Testing Library | 16.x | Component testing |
| MSW | 2.x | API mocking in tests |
| Playwright | 1.x | E2E testing |

---

## Coding Standards

### Java (Backend)

- **Style**: Google Java Style Guide
- **Null safety**: Use JSpecify `@Nullable` annotations (Spring Framework 7 / Boot 4 convention)
- **Records**: Prefer Java records for DTOs
- **Testing**: TDD whenever practical — write the failing test first, implement, verify passing
- **Transactions**: Services annotated with `@Transactional` where needed
- **Error handling**: All exceptions extend `DecisioningException` base class; handled by `GlobalExceptionHandler` producing RFC 7807 ProblemDetail JSON

### TypeScript (Frontend)

- **React patterns**: Server state in TanStack Query, avoid `useEffect` for data fetching
- **Code splitting**: All pages lazy-loaded via `React.lazy()` wrapped in `<Suspense>`
- **Styling**: Tailwind CSS 4 utility classes; use light theme colors consistently:
  - Background: `bg-zinc-50` (#f9fafb)
  - Cards: `bg-white border border-zinc-200 rounded-lg`
  - Primary: `text-indigo-600 bg-indigo-50` for active states
  - Status badges: emerald (published), amber (draft), zinc (archived)
- **Forms**: React Hook Form with Zod validation schemas
- **Notifications**: Sonner for toast messages (error/warning/success)
- **Imports**: React Router 8 uses `react-router` (not `react-router-dom`)

### XML (BPMN/CMMN/DMN)

- Flowable 8 namespace: `xmlns:flowable="http://flowable.org/bpmn"`
- DMN 1.3 namespace: `https://www.omg.org/spec/DMN/20191111/MODEL` (dmn-js 17.x requirement)
- All elements require unique IDs
- Cross-references between files use `decisionRef`, `processRef`, `calledElement`, `caseRef`

---

## Testing

### Backend Testing

```bash
cd backend

# Run all tests
mvn test

# Run with coverage
mvn verify

# Run specific test class
mvn test -Dtest=CompanyIntegrationTest
```

**Test types:**
- **Unit tests** (`src/test/.../unit/`): Mock dependencies with Mockito, test individual services
- **Integration tests** (`src/test/.../integration/`): `@SpringBootTest` with Testcontainers PostgreSQL 16

**Coverage target:** 85% minimum (JaCoCo BUNDLE instruction ratio)

### Frontend Testing

```bash
cd frontend

# Run all tests
npx vitest run

# Run with coverage
npx vitest run --coverage

# Watch mode
npx vitest
```

**Test types:**
- **Component tests**: Render components with React Testing Library, verify behavior
- **Page integration tests**: Render pages with MSW-mocked API responses
- **API hook tests**: Test TanStack Query hooks with mocked fetch

**Coverage target:** 85% minimum (Vitest c8 line coverage)

### E2E Testing

```bash
# Install Playwright browsers
npx playwright install --with-deps chromium

# Run E2E suite
npx playwright test

# Run specific spec
npx playwright test tests/e2e/companies.spec.ts

# Interactive UI mode
npx playwright test --ui
```

**Browser MCP tests:** See `frontend/tests/browser-mcp/` for interactive verification scripts.

### Test Structure

```
Tests should:
- Verify real behavior, not mock behavior
- Cover happy path + error cases + edge cases
- Have descriptive names that explain what they test
- Be independent (no shared state between tests)
- Run in CI (fast, reliable, no flaky tests)
```

---

## AI Agent Workflow

This project was built using a five-agent model with two LLM backends. AI contributors should follow the same model:

### Agent Roles

| Agent | Model | Role | Example Tasks |
|-------|-------|------|---------------|
| `glm-architect` | glm-5.2 | Architecture, critical decisions, final review | Flowable config, ELK diagrams, Event Registry, final code review |
| `glm-senior-engineer` | glm-5.2 | Complex implementation, cross-cutting concerns | CrossReferenceValidator, ProcessSpawnService, error hierarchy, complex frontend pages |
| `deepseek-junior-engineer` | deepseek-v4-pro | Pattern-following implementation | Entities, DTOs, repositories, simple controllers, Wiremock mappings, help content, sample XML |
| `glm-senior-qa` | glm-5.2 | Test strategy, complex test design, test review | Integration test design, Playwright spec design, coverage analysis |
| `deepseek-junior-qa` | deepseek-v4-pro | Writing test code from patterns | Unit tests, component tests, MSW handlers, Browser MCP scripts |

### Quality Gate Flow

1. **Design** → `glm-architect` or `glm-senior-engineer`
2. **Implement** → `deepseek-junior-engineer` (pattern-following) or `glm-senior-engineer` (complex)
3. **Test** → `deepseek-junior-qa` writes tests; `glm-senior-qa` designs test approach
4. **Review** → `glm-architect` or `glm-senior-engineer` reviews; `glm-senior-qa` reviews tests

**Rule:** Work done by a `deepseek-*` agent is always reviewed by a `glm-*` agent before acceptance.

### Working with the Plan

The project follows spec-driven development (see `docs/superpowers/`):
- **Design spec** → `docs/superpowers/specs/` — what to build
- **Implementation plan** → `docs/superpowers/plans/` — how to build it (tasks with exact code)
- **Progress ledger** → `.superpowers/sdd/progress.md` — what's been done

For new features:
1. Read the design spec to understand requirements
2. Use the implementation plan to find task boundaries
3. Each task specifies which agent should implement, test, and review
4. Follow TDD: write failing test → implement → verify passing → commit
5. Update the progress ledger after each completed task

### Commit Conventions

- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — project setup, config
- `docs:` — documentation changes

Each commit should be focused on one task or one logical change.

---

## Quick Start for Contributors

```bash
# Clone and set up
git clone <repo-url> flowable-v2
cd flowable-v2

# Start infrastructure
docker compose up -d postgres mock-api

# Build and test backend
cd backend && mvn verify

# Build and test frontend
cd ../frontend && npm install && npx vitest run

# Start development servers
# Terminal 1: cd backend && mvn spring-boot:run
# Terminal 2: cd frontend && npm run dev

# Load sample data
./scripts/seed-samples.sh
```
