# Decisioning Bundle Manager v2

A web application for managing **Decisioning Bundles** — collections of Flowable 8-compatible BPMN, CMMN, DMN, and Event Registry definition files representing enterprise expense management workflows.

Built with Spring Boot 4.0, Flowable 8, React 19, and PostgreSQL 16.

---

## Quick Start

### Prerequisites

- Java 21
- Docker (for PostgreSQL 16 and Wiremock)
- Node.js (for frontend development)

### Option 1: Full Docker Stack

```bash
# Build artifacts
cd backend && mvn package -DskipTests
cd ../frontend && npm install && npm run build
cd ..

# Start everything
docker compose up -d
```

The application will be available at **http://localhost:3000**.

### Option 2: Development Mode (backend + frontend separately)

```bash
# Start infrastructure
docker compose up -d postgres mock-api

# Start backend (terminal 1)
cd backend && mvn spring-boot:run

# Start frontend (terminal 2)
cd frontend && npm install && npm run dev
```

The frontend dev server will be at **http://localhost:5173** with API proxied to the backend at port 8080.

### Load Sample Data

```bash
./scripts/seed-samples.sh
```

This creates 4 companies and 7 sample approval bundles (expense approval variants, virtual card, physical card with KYC, card controls).

---

## Architecture

```
flowable-v2/
├── backend/                          # Spring Boot 4 / Java 21
│   ├── pom.xml                       # Maven build
│   └── src/
│       ├── main/java/com/example/decisioning/
│       │   ├── config/               # FlowableConfig, BusinessCalendar, BundleTypeConfig
│       │   ├── entity/               # Company, DecisioningBundle, BundleFile
│       │   ├── repository/           # Spring Data JPA repositories
│       │   ├── service/              # Business logic + Flowable integration
│       │   ├── controller/           # REST controllers
│       │   ├── dto/                  # Request/response records
│       │   └── exception/            # Structured exception hierarchy
│       └── test/                     # JUnit 5 + Testcontainers
├── frontend/                         # React 19 / Vite 8
│   ├── src/
│   │   ├── api/                      # TanStack Query hooks
│   │   ├── components/               # UI components (layout, help, viewer, validation, spawn)
│   │   ├── pages/                    # Page components
│   │   ├── lib/                      # API client with error parsing
│   │   └── types/                    # TypeScript interfaces
│   └── tests/
│       ├── e2e/                      # Playwright E2E specs
│       └── browser-mcp/              # Browser MCP verification scripts
├── samples/                          # Sample BPMN/CMMN/DMN/Event files
├── mock-api/                         # Wiremock stub mappings
├── scripts/                          # Seed script
├── docker-compose.yml                # PostgreSQL 16 + Wiremock + Backend + Frontend
└── docs/                             # Design spec and implementation plan
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend Framework | Spring Boot | 4.0.0 |
| Workflow Engine | Flowable (embedded) | 8.0.0 |
| Database | PostgreSQL | 16 |
| Java | OpenJDK | 21 |
| Build | Maven | 3.9 |
| Frontend Framework | React | 19 |
| Build Tool | Vite | 8 |
| Routing | React Router | 8 |
| Server State | TanStack Query | 5 |
| Styling | Tailwind CSS | 4 |
| Animation | Framer Motion | 12 |
| Process Viewers | bpmn-js / cmmn-js / dmn-js | 18 / 0.20 / 17 |
| Mock API | Wiremock | latest |
| E2E Testing | Playwright | 1 |
| Unit Testing (FE) | Vitest / React Testing Library | 4 / 16 |
| Unit Testing (BE) | JUnit 5 / Testcontainers | - / 1.21 |
| Coverage | JaCoCo / Vitest c8 | 85% minimum |

---

## Key Features

- **Bundle Management**: Upload BPMN/CMMN/DMN/Event files, validate cross-references, publish workflows
- **Company Hierarchy**: Inherit bundles through parent companies with Global fallback
- **Auto-Diagram Generation**: ELK layout engine auto-generates clean diagrams for BPMN, CMMN, and DMN files
- **Process Spawning**: Start Flowable process/case instances with dynamic variable forms
- **Event Registry**: Event-driven process triggers with test event sending
- **Online Help**: Slide-out panel with 14 searchable articles
- **Comprehensive Error Handling**: RFC 7807 ProblemDetail responses with structured suggestions
- **Sample Bundles**: 7 pre-built approval workflows with escalation paths

---

## BPMN, CMMN & DMN Formatting Guide

When authoring process definitions for this application, follow these conventions. The application uses **Flowable 8** as the embedded workflow engine and **bpmn-js 18 / cmmn-js 0.20 / dmn-js 17** for diagram rendering. Each library has specific requirements.

### BPMN (Business Process Model and Notation)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:flowable="http://flowable.org/bpmn"
             targetNamespace="http://www.flowable.org/processdef">

  <process id="my-process" name="My Process" isExecutable="true">
    <startEvent id="start" />
    <userTask id="task1" name="Review Request" flowable:assignee="manager" />
    <endEvent id="end" />
    <sequenceFlow sourceRef="start" targetRef="task1" />
    <sequenceFlow sourceRef="task1" targetRef="end" />
  </process>

</definitions>
```

**Format rules:**
- Use **unprefixed** elements (`<definitions>`, `<process>`, `<userTask>`, etc.) with the default BPMN 2.0 namespace
- Flowable extensions use the `flowable:` prefix: `flowable:type="http"`, `flowable:assignee`, `flowable:class`
- **HTTP service tasks**: `<serviceTask flowable:type="http">` with `<flowable:field name="requestMethod">` and `<flowable:field name="requestUrl">`
- **DMN routing**: `<businessRuleTask flowable:type="dmn" flowable:decisionRef="my-dmn-decision-id">`
- **Boundary timers**: `<boundaryEvent attachedToRef="taskId">` with `<timerEventDefinition><timeDuration>P5D</timeDuration></timerEventDefinition>` — use `businessCalendarName="workingDay"` to exclude weekends
- **Event-based starts**: Use `<messageEventDefinition>` with `<extensionElements>` containing `<flowable:eventType>` and `<flowable:eventOutParameter>` elements
- All elements require unique `id` attributes — these are used for cross-reference validation

### CMMN (Case Management Model and Notation)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/CMMN/20151109/MODEL"
             xmlns:flowable="http://flowable.org/cmmn"
             targetNamespace="http://www.flowable.org/casedef">

  <case id="my-case" name="My Case">
    <casePlanModel id="casePlan">
      <planItem id="stage1" definitionRef="stage1Def" />
      <stage id="stage1Def" name="Stage 1">
        <planItem id="task1" definitionRef="task1Def" />
        <humanTask id="task1Def" name="Review" />
      </stage>
    </casePlanModel>
  </case>

</definitions>
```

**Format rules:**
- Use **unprefixed** elements with the default CMMN 1.1 namespace
- Process tasks reference BPMN files: `<processTask id="..." processRef="bpmn-process-id" />`
- **Sentries** for conditional activation: `<sentry>` with `<planItemOnPart>` and `<ifPart>` containing `<condition>` elements
- Case elements: `<case>`, `<casePlanModel>`, `<stage>`, `<humanTask>`, `<processTask>`, `<milestone>`, `<sentry>`
- All elements require unique `id` attributes

### DMN (Decision Model and Notation) ⚠️

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dmn:definitions xmlns:dmn="https://www.omg.org/spec/DMN/20191111/MODEL/"
                 namespace="http://www.flowable.org/dmn"
                 name="Example Decision">

  <dmn:decision id="my-decision" name="My Decision">
    <dmn:decisionTable id="myTable" hitPolicy="FIRST">
      <dmn:input id="input_1" label="Amount">
        <dmn:inputExpression id="expr_1" typeRef="number">
          <dmn:text>amount</dmn:text>
        </dmn:inputExpression>
      </dmn:input>
      <dmn:output id="output_1" label="Result" typeRef="string" />
      <dmn:rule id="rule_1">
        <dmn:inputEntry id="entry_1"><dmn:text>&gt; 1000</dmn:text></dmn:inputEntry>
        <dmn:outputEntry id="out_1"><dmn:text>'HIGH'</dmn:text></dmn:outputEntry>
      </dmn:rule>
    </dmn:decisionTable>
  </dmn:decision>

</dmn:definitions>
```

**Format rules (⚠️ dmn-js 17.x is strict):**
- **ALL elements require `dmn:` prefix** — `<dmn:definitions>`, `<dmn:decision>`, `<dmn:decisionTable>`, etc. Unprefixed elements will fail with `failed to parse document as <dmn:Definitions>`
- **DMN 1.3 namespace**: `xmlns:dmn="https://www.omg.org/spec/DMN/20191111/MODEL/"` — **trailing slash is required** for dmn-js 17.x. DMN 1.1 (`...20151101`) is **not supported**. No `.xsd` suffix.
- Decision tables use `hitPolicy="FIRST"` for priority-based matching
- **FEEL expressions** in `<dmn:text>` content — e.g., `>= 750`, `== 'FULL_TIME'`, `>= 650 && < 750`
- **HTML entities** in XML attributes: use `&gt;` for `>`, `&lt;` for `<`, `&amp;&amp;` for `&&`
- All elements require unique `id` attributes
- BPMN files reference DMN decisions via `decisionRef="my-decision"` on `<businessRuleTask>` elements

### Cross-Reference Rules

Files within a bundle cross-reference each other. The application validates these references:
- BPMN `businessRuleTask` → `decisionRef` must match a DMN `<dmn:decision id="...">` in the bundle
- BPMN `callActivity` → `calledElement` must match a BPMN `<process id="...">` in the bundle
- CMMN `processTask` → `processRef` must match a BPMN `<process id="...">` in the bundle
- BPMN event references → must match an event `.event` file's `key` in the bundle

### Validation & Error Messages

When a bundle fails cross-reference validation, the error panel shows:
- **File**: which file contains the error
- **Element type**: the BPMN/CMMN/DMN element (e.g., `callActivity`, `businessRuleTask`)
- **Element name**: the human-readable name of the element
- **Missing reference**: the ID that couldn't be resolved
- **Suggested fix**: actionable guidance on how to resolve the error

Malformed XML produces **parse errors** with line and column numbers and a description of the syntax issue.

See the [samples README](samples/README.md) for detailed format examples for each file type.

---

## Test Coverage

| Layer | Tests | Coverage |
|-------|-------|----------|
| Backend (JUnit 5 + Testcontainers) | 202 | 90.51% |
| Frontend (Vitest + React Testing Library) | 300 | 95.51% |
| E2E (Playwright) | 79 | Full user journeys |

Run tests:
```bash
# Backend
cd backend && mvn verify

# Frontend
cd frontend && npx vitest run --coverage

# E2E
npx playwright test
```

---

## Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL 16 database |
| mock-api | 8081 (host), 8080 (internal) | Wiremock mock REST API |
| backend | 8082 | Spring Boot 4 application |
| frontend | 3000 | Nginx serving React SPA |

---

## Documentation

- [Design Specification](docs/superpowers/specs/2026-07-12-decisioning-bundle-manager-v2-design.md)
- [Implementation Plan](docs/superpowers/plans/2026-07-12-decisioning-bundle-manager-v2.md)
- [Final Review](docs/superpowers/reviews/2026-07-12-final-integration-review.md)
- [Contributing Guide](CONTRIBUTING.md)
