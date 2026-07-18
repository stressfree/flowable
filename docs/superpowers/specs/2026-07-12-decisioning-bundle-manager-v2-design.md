# Decisioning Bundle Manager v2 — Design Specification

**Date:** 2026-07-12
**Status:** Draft
**Repository:** `flowable-v2` (monorepo, fresh git repo)
**Predecessor:** `flowable-test` (v1, all 17 tasks complete)

---

## 1. Overview

A React + Java/Spring Boot 4 web application enabling administrators to define, manage, validate, publish, and execute **Decisioning Bundles** — collections of Flowable 8-compatible BPMN, CMMN, DMN, and Event Registry definition files representing enterprise expense management workflows for specific companies.

### What's New in v2 (vs v1)

| Area | v1 | v2 |
|------|----|----|
| Spring Boot | 3.4.4 | 4.0.x |
| React | 18 | 19 |
| Diagram generation | BPMN only (ELK) | BPMN + CMMN + DMN (ELK) |
| Bundle list page | Missing | `GET /v1/bundles` + `BundleListPage` |
| Bundle files in API | `fileCount` only | `files[]` array in `BundleResponse` |
| Spawn form variables | Returns empty list | Extracts actual start form variables from Flowable |
| Scheduler config | Hardcoded 30s | Configurable via `application.yml` |
| MSW test setup | Missing `server.listen()` | Proper setup in test harness |
| Sample bundles | None | 7 real, working approval workflows |
| Browser tests | None | Playwright E2E (12 specs) + Browser MCP scripts (6) |
| Help system | None | Slide-out panel with 14 articles |
| Error messaging | Basic | Full-stack structured error handling |
| Visual design | Dark zinc theme | Light professional (Stripe-inspired) |
| Event Registry | Not included | Embedded, programmatic channel, `.event` file support |
| Mock API | Not included | Wiremock container in docker-compose |
| Test coverage | Basic | 85-90% (JaCoCo + Vitest thresholds) |

### Key Capabilities

| # | Capability | Description |
|---|-----------|-------------|
| C1 | Company management | CRUD for companies with parent-child hierarchy |
| C2 | Bundle creation | Upload N+1 BPMN/CMMN/DMN/Event files, assign type and company (or Global) |
| C3 | Auto-diagram generation | Generate BPMN/CMMN/DMN diagrams via ELK layout engine when definitions lack embedded DI |
| C4 | Cross-reference validation | Verify internal references between files in a bundle (including event refs), surface structured errors with suggestions |
| C5 | Bundle lifecycle | Draft -> Published -> Archived; scheduled go-live with automatic promotion |
| C6 | Hierarchical resolution | Resolve effective bundle by company inheritance chain (company -> parent -> ... -> Global) |
| C7 | Graphical viewer | bpmn-js, cmmn-js, dmn-js integration for visual inspection of definitions |
| C8 | Process spawning | Start Flowable process/case instances with dynamic variable input forms |
| C9 | Event Registry | Event definition files in bundles, event-based process triggers, test event sending from UI |
| C10 | Mock REST API | Wiremock container providing stub endpoints for BPMN service task HTTP calls |
| C11 | Online help | Slide-out help panel with searchable articles, CMMN/BPMN/DMN learning resources |
| C12 | Comprehensive error messaging | Full-stack error handling: XML validation, parse errors, API errors, form errors, Flowable errors |
| C13 | E2E browser testing | Playwright suite + Browser MCP interactive verification scripts |
| C14 | Sample approval bundles | 7 pre-built bundles demonstrating real approval workflows with escalations |

---

## 2. Project Structure (Monorepo)

```
flowable-v2/
├── .opencode/
│   └── agents/                           # Five custom agent definitions (new)
│       ├── glm-architect.md                  # openmodel/glm-5.2 — architecture, critical decisions, final review
│       ├── glm-senior-engineer.md            # openmodel/glm-5.2 — complex implementation, cross-cutting concerns
│       ├── deepseek-junior-engineer.md       # openmodel/deepseek-v4-pro — pattern-following implementation
│       ├── glm-senior-qa.md                  # openmodel/glm-5.2 — test strategy, complex test design, review
│       └── deepseek-junior-qa.md             # openmodel/deepseek-v4-pro — writing test code from patterns
├── backend/                              # Spring Boot 4 application
│   ├── pom.xml
│   ├── src/main/java/com/example/decisioning/
│   │   ├── DecisioningApplication.java
│   │   ├── config/
│   │   │   ├── BundleTypeConfig.java          # Bundle type enum + config
│   │   │   ├── FlowableConfig.java            # Flowable 8 engine config (new)
│   │   │   └── ScheduledTasks.java            # Go-live promotion scheduler
│   │   ├── entity/
│   │   │   ├── Company.java
│   │   │   ├── DecisioningBundle.java
│   │   │   ├── BundleFile.java
│   │   │   ├── BundleType.java                # Enum
│   │   │   └── BundleStatus.java              # Enum
│   │   ├── repository/
│   │   │   ├── CompanyRepository.java
│   │   │   ├── DecisioningBundleRepository.java
│   │   │   └── BundleFileRepository.java
│   │   ├── service/
│   │   │   ├── CompanyService.java
│   │   │   ├── BundleService.java
│   │   │   ├── BundleResolutionService.java   # Hierarchical resolution
│   │   │   ├── BundlePublishService.java      # Publish now / schedule
│   │   │   ├── DiagramGenerationService.java  # ELK-based auto-diagram (BPMN + CMMN + DMN)
│   │   │   ├── CrossReferenceValidator.java   # Reference + event validation
│   │   │   ├── ProcessSpawnService.java       # Flowable instance spawning + form extraction
│   │   │   ├── EventRegistryService.java      # Event Registry management (new)
│   │   │   └── XmlParseService.java           # XML well-formedness checking (new)
│   │   ├── controller/
│   │   │   ├── CompanyController.java
│   │   │   ├── BundleController.java
│   │   │   ├── BundleTypeController.java
│   │   │   ├── EventController.java           # Event listing + test sending (new)
│   │   │   └── GlobalExceptionHandler.java    # Enhanced @RestControllerAdvice
│   │   ├── dto/                               # Request/response DTOs
│   │   └── exception/                         # Structured exception hierarchy (new)
│   │       ├── DecisioningException.java
│   │       ├── BundleValidationException.java
│   │       ├── BundleParseException.java
│   │       ├── BundleLifecycleException.java
│   │       ├── BundleFileNotFoundException.java
│   │       ├── FlowableDeploymentException.java
│   │       └── CompanyNotFoundException.java
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-test.yml
│   │   ├── db/changelog/db.changelog-master.yaml
│   │   └── samples/                           # Sample BPMN/CMMN/DMN/Event XML files
│   │       ├── expense-standard-escalation.bpmn
│   │       ├── expense-gov-client-review.bpmn
│   │       ├── expense-tiered-escalation.bpmn
│   │       ├── expense-submitted.event
│   │       ├── travel-check.dmn
│   │       ├── line-item-classification.dmn
│   │       ├── amount-thresholds.dmn
│   │       ├── virtual-card-approval.bpmn
│   │       ├── card-eligibility.dmn
│   │       ├── card-limit-check.dmn
│   │       ├── physical-card-kyc.bpmn
│   │       ├── kyc-validation.dmn
│   │       ├── risk-assessment.dmn
│   │       ├── card-controls-case.cmmn
│   │       ├── card-controls-process.bpmn
│   │       ├── apply-card-changes.bpmn
│   │       └── card-control-thresholds.dmn
│   └── src/test/java/com/example/decisioning/
│       ├── integration/                       # @SpringBootTest + Testcontainers
│       └── unit/                              # JUnit 5 + Mockito
├── frontend/                             # Vite + React 19 application
│   ├── package.json
│   ├── playwright.config.ts                   # Playwright E2E config (new)
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                            # + ErrorBoundary, BundleListPage route
│   │   ├── api/                               # TanStack Query hooks + fetch client
│   │   ├── components/
│   │   │   ├── layout/                        # AppLayout, Sidebar, HelpPanel
│   │   │   ├── companies/
│   │   │   ├── bundles/
│   │   │   ├── viewer/                        # ModelViewer (bpmn-js/cmmn-js/dmn-js)
│   │   │   ├── validation/                    # Enhanced error display
│   │   │   ├── spawn/                         # SpawnForm + event sending
│   │   │   ├── help/                          # Help articles + search (new)
│   │   │   └── error/                         # Error pages, toast config (new)
│   │   ├── pages/
│   │   │   ├── CompanyListPage.tsx
│   │   │   ├── CompanyCreatePage.tsx
│   │   │   ├── CompanyDetailPage.tsx
│   │   │   ├── BundleListPage.tsx             # New (was missing in v1)
│   │   │   ├── BundleCreatePage.tsx
│   │   │   ├── BundleDetailPage.tsx
│   │   │   ├── BundleFileViewerPage.tsx
│   │   │   ├── BundleSpawnPage.tsx
│   │   │   └── ErrorPage.tsx                  # New (404/500)
│   │   ├── lib/                               # api-client with error parsing
│   │   └── types/
│   ├── tests/
│   │   ├── e2e/                               # Playwright specs (new)
│   │   │   ├── companies.spec.ts
│   │   │   ├── bundles-create.spec.ts
│   │   │   ├── bundles-list.spec.ts
│   │   │   ├── bundles-detail.spec.ts
│   │   │   ├── bundles-viewer.spec.ts
│   │   │   ├── bundles-spawn.spec.ts
│   │   │   ├── validation.spec.ts
│   │   │   ├── error-pages.spec.ts
│   │   │   ├── help-panel.spec.ts
│   │   │   ├── visual-rendering.spec.ts
│   │   │   ├── seed-samples.spec.ts
│   │   │   └── lifecycle.spec.ts
│   │   ├── browser-mcp/                      # Browser MCP test scripts (new)
│   │   │   ├── smoke-test.md
│   │   │   ├── full-crud-flow.md
│   │   │   ├── sample-bundles-visual.md
│   │   │   ├── error-scenarios.md
│   │   │   ├── help-panel-visual.md
│   │   │   └── responsive-check.md
│   │   └── unit/                             # Vitest component tests
│   └── vitest.config.ts
├── mock-api/                             # Wiremock stub mappings (new)
│   └── mappings/
│       ├── cards-issue.json
│       ├── cards-apply-changes.json
│       ├── expense-notify.json
│       ├── identity-verify.json
│       └── audit-log.json
├── scripts/
│   └── seed-samples.sh                   # External seed script (new)
├── docker-compose.yml                    # PostgreSQL 16 + Wiremock
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-07-12-decisioning-bundle-manager-v2-design.md
        └── plans/
```

---

## 3. Backend Design

### 3.1 Technology Stack

| Component | Choice | Version |
|-----------|--------|---------|
| Language | Java | 21 |
| Framework | Spring Boot | 4.0.x |
| Persistence | Spring Data JPA + Hibernate | latest (managed by Boot 4) |
| Database | PostgreSQL | 16 |
| Workflow Engine | Flowable (embedded, open source) | 8.x |
| Event Registry | Flowable Event Registry (embedded) | 8.x |
| Diagram Layout | ELK (Eclipse Layout Kernel) | 0.11.0 |
| Build | Maven | 3.9 |
| Testing | JUnit 5 + Mockito + Testcontainers | JUnit 5, Mockito, Testcontainers 1.21.4 |
| Coverage | JaCoCo | 0.8.15 (85% minimum) |

### 3.2 Flowable 8 Embedded Engine Configuration

Flowable 8 runs fully embedded within the Spring Boot application (no separate server). Configuration:

```yaml
flowable:
  database-schema-update: true        # Auto-creates Flowable tables in PostgreSQL
  database-schema: flowable           # Schema name for Flowable tables
  async-executor-activate: false      # No async job execution (admin tool)
  rest-api-enabled: false             # We expose our own REST API
  event-registry:
    enabled: true                     # Event Registry engine auto-configured
    database-schema-update: true
```

A `FlowableConfig` class explicitly configures the embedded engine for Spring Boot 4 compatibility, including:
- `SpringProcessEngineConfiguration` bean customization
- Business calendar bean for working-day timer calculations
- Event Registry engine auto-configuration
- `RepositoryService`, `RuntimeService`, `EventRepositoryService`, `EventRegistryRuntimeService` beans available for injection

### 3.3 Entity Model

Same as v1 with no structural changes:

- **Company**: id, name, parentCompany (self-referencing), children, bundles, createdAt
- **DecisioningBundle**: id, company (nullable=Global), bundleType (enum), description, status (DRAFT/PUBLISHED/ARCHIVED), goLiveAt, entrypointFile, files, createdAt
- **BundleFile**: id, bundle, filename, mimeType, content (bytea), isEntrypoint, createdAt

Enums:
- `BundleType`: EXPENSE_APPROVAL, VIRTUAL_CARD_APPROVAL, PHYSICAL_CREDIT_CARD_APPROVAL, CARD_CONTROLS_CHANGE_APPROVAL
- `BundleStatus`: DRAFT, PUBLISHED, ARCHIVED

### 3.4 API Endpoints

All endpoints prefixed with `/v1`.

#### Bundle Types
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/bundle-types | List all configured bundle types with labels |

#### Companies
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/companies | List all companies | 200 |
| GET | /v1/companies/{id} | Get company with children and bundles | 200 / 404 |
| POST | /v1/companies | Create company `{name, parentCompanyId?}` | 201 |
| DELETE | /v1/companies/{id} | Delete company (if no bundles) | 204 / 409 |

#### Bundles
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/bundles | List bundles (query: `companyId`, `bundleType`, `status`) | 200 |
| GET | /v1/bundles/{id} | Get bundle with files[] and validation status | 200 / 404 |
| GET | /v1/bundles/resolve | Resolve effective bundle (`companyId`, `bundleType`) | 200 / 404 |
| POST | /v1/bundles | Create bundle (multipart files + metadata) | 201 |
| POST | /v1/bundles/{id}/files | Add files to existing bundle (multipart) | 200 |
| POST | /v1/bundles/{id}/validate | Validate cross-references + parse, return structured errors | 200 |
| PUT | /v1/bundles/{id}/entrypoint | Set entrypoint file `{fileId}` | 200 |
| POST | /v1/bundles/{id}/publish | Publish now or schedule `{goLiveAt?: ISO8601}` | 200 |
| DELETE | /v1/bundles/{id} | Archive (discard) a draft bundle | 204 |

#### Process Spawning
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/bundles/{id}/spawn-form | Get start form variable definitions from Flowable | 200 |
| POST | /v1/bundles/{id}/spawn | Spawn process/case instance `{variables}` | 201 |

#### File Viewer
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/bundles/{id}/files/{fileId} | Get file content (XML) for viewer | 200 / 404 |

#### Event Registry (new)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/bundles/{id}/events | List event definitions in bundle | 200 |
| POST | /v1/bundles/{id}/events/{eventKey}/send | Send test event `{payload}` | 200 / 404 |

**v2 fix:** `GET /v1/bundles/{id}` and `GET /v1/bundles` now return a `files[]` array in each `BundleResponse`, not just `fileCount`. This fixes the v1 gap where the frontend file table and viewer page could not access file metadata.

### 3.5 Service Layer

#### BundleService
- `createBundle(files, companyId?, bundleType, description)` — processes upload, runs XML parse check, triggers diagram generation for BPMN/CMMN/DMN, stores to DB, runs cross-reference validation
- `addFiles(bundleId, files[])` — appends files, re-runs diagram generation and validation (DRAFT only)
- `setEntrypoint(bundleId, fileId)` — marks a file as entrypoint (DRAFT only)
- `getBundleWithValidation(bundleId)` — returns bundle DTO including `files[]` and validation error list
- `listBundles(companyId?, bundleType?, status?)` — filtered list with files[] (v2 fix)
- `getFileContent(bundleId, fileId)` — returns raw XML bytes

#### BundleResolutionService
Walks company hierarchy upward looking for PUBLISHED bundle. Falls back to Global. Unknown companyId -> Global.

#### BundlePublishService
- `publishNow(bundleId)` — DRAFT only, archives current published for same (company, bundleType), promotes
- `schedulePublish(bundleId, goLiveAt)` — sets goLiveAt, keeps DRAFT
- `promoteScheduled()` — `@Scheduled(fixedDelayString = "${scheduler.go-live-interval-ms:30000}")` (v2 fix: configurable)

#### DiagramGenerationService (v2 enhancement: BPMN + CMMN + DMN)

**BPMN:** Parse via `BpmnXMLConverter`, check `model.getLocationMap().isEmpty()`. If no DI, build ELK graph from flow nodes + sequence flows, run `RecursiveGraphLayoutEngine` with LAYERED algorithm (direction=RIGHT, spacing=40px, layer-spacing=60px), apply positions via `model.addGraphicInfo()`, re-serialize.

**CMMN:** Parse via `CmmnXMLConverter`, check for existing `CmmnDiagrams`. If absent, build ELK graph from case plan model stages, tasks, milestones, and sentries. Apply LAYERED layout with same parameters, write positions back to CMMN DI model, re-serialize.

**DMN:** Parse via `DmnXMLConverter`. If no DI:
- Decision tables: generate structured grid layout with proper row/column sizing
- Decision requirement graphs (DRG): use ELK LAYERED layout for the dependency graph

All diagram generation runs automatically on file upload (`createBundle` and `addFiles`). Stored XML always contains DI, so bpmn-js/cmmn-js/dmn-js render clean diagrams without client-side layout.

#### CrossReferenceValidator (v2 enhancement: event refs + parse errors)

Extracts all `id` attributes from all files. Checks:
- BPMN: `callActivity.calledElement`, `businessRuleTask.decisionRef`, event references (`eventRef` attributes on events)
- CMMN: `caseTask.caseRef`, `processTask.processRef`, `decisionTask.decisionRef`
- DMN: `decision.decisionRef` in decision requirements

Returns `List<ValidationError>` with structured fields:
```java
public record ValidationError(
    Long fileId,
    String filename,
    String fileType,          // BPMN, CMMN, DMN, EVENT
    String elementType,       // callActivity, businessRuleTask, etc.
    String elementName,       // human-readable name
    String elementId,         // XML id of the element
    String missingReference,  // the unresolved reference value
    String referenceAttribute, // calledElement, decisionRef, etc.
    String suggestion         // actionable fix text
) {}
```

#### ProcessSpawnService (v2 fix: actual form extraction)

- `getSpawnForm(bundleId)` — deploys bundle to Flowable, extracts start form variables from the process definition (via `FormService.getStartFormVariables()` or process variable definitions). Returns `List<SpawnVariable>` with `{name, type, required, label}`.
- `spawn(bundleId, variables)` — deploys if not already deployed (lazy, cached), starts process/case instance with given variables. Returns instance ID.

#### EventRegistryService (new)

- `getEventDefinitions(bundleId)` — parses `.event` files in the bundle, returns event key, name, correlation parameters, and payload fields
- `sendEvent(bundleId, eventKey, payload)` — sends a test event via `EventRegistryRuntimeService`, correlating to any waiting process instances

#### XmlParseService (new)

- `validateWellFormed(xmlBytes)` — checks XML well-formedness, returns `Optional<ParseError>` with line, column, message
- Used by `BundleService` on upload and by `CrossReferenceValidator` before parsing

### 3.6 Exception Hierarchy (new)

```
DecisioningException (abstract base)
├── BundleValidationException     → 422 (cross-reference validation failures)
├── BundleParseException           → 422 (malformed XML)
├── BundleLifecycleException       → 409 (invalid state transitions)
├── BundleFileNotFoundException    → 404 (missing bundle/file)
├── FlowableDeploymentException    → 503 (Flowable deploy/spawn failures)
└── CompanyNotFoundException       → 404 (missing company)
```

### 3.7 Error Handling (RFC 7807 ProblemDetail)

Every error returns structured ProblemDetail JSON with type, title, status, detail, instance, timestamp, and type-specific fields.

**Cross-reference validation error (422):**
```json
{
  "type": "https://flowable-v2/errors/validation-failed",
  "title": "Cross-reference validation failed",
  "status": 422,
  "detail": "2 unresolved references found in this bundle",
  "instance": "/v1/bundles/7/validate",
  "errors": [
    {
      "fileId": 12,
      "filename": "expense-approval.bpmn",
      "fileType": "BPMN",
      "elementType": "callActivity",
      "elementName": "Approve Invoice",
      "elementId": "callActivity_1",
      "missingReference": "subprocess-invoice",
      "referenceAttribute": "calledElement",
      "suggestion": "Upload a BPMN file containing process id=\"subprocess-invoice\", or remove this callActivity from expense-approval.bpmn"
    }
  ],
  "timestamp": "2026-07-12T14:30:00Z"
}
```

**XML parse error (422):**
```json
{
  "type": "https://flowable-v2/errors/parse-failed",
  "title": "XML parse error",
  "status": 422,
  "detail": "The file expense-approval.bpmn contains malformed XML",
  "fileId": 12,
  "filename": "expense-approval.bpmn",
  "parseError": {
    "line": 14,
    "column": 7,
    "message": "Expected closing tag </process> but found </sequenceFlow>",
    "suggestion": "Check that all XML tags are properly opened and closed. The error occurred at line 14."
  }
}
```

**Lifecycle error (409):**
```json
{
  "type": "https://flowable-v2/errors/lifecycle",
  "title": "Invalid bundle state",
  "status": 409,
  "detail": "Cannot publish a bundle with unresolved validation errors",
  "bundleId": 7,
  "currentStatus": "DRAFT",
  "action": "PUBLISH",
  "reason": "Bundle has 2 unresolved cross-references",
  "suggestion": "Fix all validation errors before publishing"
}
```

**Flowable deployment error (503):**
```json
{
  "type": "https://flowable-v2/errors/flowable-deploy",
  "title": "Flowable deployment failed",
  "status": 503,
  "detail": "Process could not be deployed to the Flowable engine",
  "bundleId": 7,
  "processKey": "expense-approval",
  "reason": "Duplicate process key — a different version is already deployed",
  "suggestion": "Archive the existing published bundle for this process key, or update the process id in your BPMN file"
}
```

**Error mapping:**

| Exception | HTTP Status | When |
|-----------|-------------|------|
| CompanyNotFoundException | 404 | Company ID doesn't exist |
| BundleFileNotFoundException | 404 | Bundle or file ID doesn't exist |
| BundleParseException | 422 | XML is malformed, can't parse |
| BundleValidationException | 422 | Cross-references don't resolve |
| BundleLifecycleException | 409 | Invalid state transition |
| FlowableDeploymentException | 503 | Flowable engine can't deploy or spawn |
| IllegalArgumentException | 400 | Bad request params |
| MethodArgumentNotValidException | 400 | DTO validation fails |
| MaxUploadSizeExceededException | 413 | File exceeds 10MB limit |
| Unhandled Exception | 500 | Unexpected error (logged with trace ID) |

### 3.8 Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/decisioning
    username: decisioning
    password: decisioning
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.yaml
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 50MB

flowable:
  database-schema-update: true
  database-schema: flowable
  async-executor-activate: false
  rest-api-enabled: false
  event-registry:
    enabled: true
    database-schema-update: true

server:
  port: 8080

bundle:
  types:
    EXPENSE_APPROVAL: "Expense Approval"
    VIRTUAL_CARD_APPROVAL: "Virtual Card Approval"
    PHYSICAL_CREDIT_CARD_APPROVAL: "Physical Credit Card Approval"
    CARD_CONTROLS_CHANGE_APPROVAL: "Card Controls Change Approval"

diagram:
  elk:
    direction: RIGHT
    spacing: 40.0
    layer-spacing: 60.0

scheduler:
  go-live-interval-ms: 30000

mock:
  api:
    base-url: http://mock-api:8080
```

---

## 4. Mock REST API (Wiremock)

### 4.1 Docker Setup

```yaml
services:
  mock-api:
    image: wiremock/wiremock:latest
    ports:
      - "8081:8080"
    volumes:
      - ./mock-api/mappings:/home/wiremock/mappings
```

### 4.2 Stub Endpoints

| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| /cards/issue | POST | Simulates issuing a virtual/physical card | virtual-card-approval.bpmn, physical-card-kyc.bpmn |
| /cards/apply-changes | POST | Simulates applying card control changes | apply-card-changes.bpmn |
| /expense/notify | POST | Simulates notifying an external expense system | Expense approval BPMN service tasks |
| /identity/verify | POST | Simulates identity verification check | physical-card-kyc.bpmn |
| /audit/log | POST | Simulates audit logging | All approval processes |

Each stub:
- Accepts JSON body
- Returns `{"status": "success", "mock": true, "receivedAt": "<timestamp>", "data": {...}}`
- Has a 200ms artificial delay
- Wiremock records all received requests — viewable at `http://localhost:8081` for debugging and demos

### 4.3 BPMN Service Task Integration

Sample BPMN files use Flowable HTTP service tasks that call the mock API:
```xml
<serviceTask id="issueCard" name="Issue Virtual Card" flowable:type="http">
  <extensionElements>
    <flowable:field name="requestMethod"><flowable:string>POST</flowable:string></flowable:field>
    <flowable:field name="requestUrl"><flowable:string>${mockApiBaseUrl}/cards/issue</flowable:string></flowable:field>
    <flowable:field name="requestBody"><flowable:string>{"cardType":"virtual","employeeId":"${employeeId}"}</flowable:string></flowable:field>
  </extensionElements>
</serviceTask>
```

The mock API base URL (`mock.api.base-url`) is injected as a process variable on spawn.

---

## 5. Event Registry

### 5.1 Overview

Flowable 8's Event Registry is embedded alongside the process engine, sharing the same PostgreSQL database. It enables event-driven process flows: BPMN processes can start on events, wait for events at event-based gateways, and emit events to external systems.

### 5.2 Scope for v2

**Included:**
- Event definition files (`.event` JSON) in bundles — deployed to Event Registry on spawn
- Cross-reference validation for BPMN event references (`eventRef` attributes)
- Event listing on bundle detail page (event key, correlation parameters, payload)
- Test event sending from spawn page via `EventRegistryRuntimeService` (programmatic channel)
- One sample bundle (1A) includes an event definition demonstrating event-based start

**Deferred:**
- JMS/Kafka/RabbitMQ channel definitions (infrastructure config, not admin tool scope)
- Event subscription management UI (engine handles automatically)
- Event instance history/querying (available via Flowable REST API if needed later)

### 5.3 Event Definition File Format

```json
{
  "key": "expense-submitted",
  "name": "Expense Submitted",
  "correlationParameters": [
    {"name": "employeeId", "type": "string"},
    {"name": "expenseId", "type": "string"}
  ],
  "payload": [
    {"name": "amount", "type": "double"},
    {"name": "description", "type": "string"},
    {"name": "hasTravel", "type": "boolean"}
  ]
}
```

### 5.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/bundles/{id}/events | List event definitions in bundle |
| POST | /v1/bundles/{id}/events/{eventKey}/send | Send test event with payload |

---

## 6. Sample Approval Bundles

Seven bundles stored as XML/JSON files in `backend/src/main/resources/samples/`, loaded via an external seed script (`scripts/seed-samples.sh`).

### 6.1 Expense Approval — Scenario 1A: Standard with Time + Travel Escalation

**Files:**
- `expense-standard-escalation.bpmn` (entrypoint)
- `travel-check.dmn`
- `expense-submitted.event` (Event Registry definition)

**Workflow:**
- Start (event-based, triggered by `expense-submitted` event) -> Submit Expense -> DMN travel-check -> branch
- Non-travel: Manager Approval with **boundary timer (5 working days)** -> approved -> End | timeout -> ESCALATE: Financial Controller -> End
- Travel > $10K: Manager Approval -> ESCALATE: Senior Director -> End

**DMN `travel-check`:** inputs `hasTravel` (boolean), `amount` (number) -> output `approvalPath` (STANDARD / DIRECTOR)

**Working day timer:** BPMN boundary timer events use Flowable's `businessCalendar` mechanism to exclude weekends. Timer expression uses a custom business calendar bean counting Monday-Friday only.

### 6.2 Expense Approval — Scenario 1B: Government Client + Travel Escalation

**Files:**
- `expense-gov-client-review.bpmn` (entrypoint)
- `line-item-classification.dmn`
- `travel-check.dmn` (shared with 1A)

**Workflow:**
- Start -> Submit Expense -> DMN line-item-check -> branch
- Has government client items: Governmental Spend Approvers Review -> DMN travel-check -> travel > $10K -> ESCALATE: Senior Director -> End | non-travel -> End
- No government items: DMN travel-check -> travel > $10K -> Manager Approval -> ESCALATE: Senior Director -> End | non-travel -> Manager Approval -> End

**DMN `line-item-classification`:** input `lineItems` (JSON array of `{description, clientType}`) -> output `hasGovernmentClient` (boolean)

### 6.3 Expense Approval — Scenario 1C: Tiered Amount with Time Escalation

**Files:**
- `expense-tiered-escalation.bpmn` (entrypoint)
- `amount-thresholds.dmn`

**Workflow:**
- Start -> Submit Expense -> DMN amount-thresholds -> branch
- < $500 (AUTO): Auto-Approve -> End
- $500-$5000 (MANAGER): Manager Approval with **boundary timer (5 working days)** -> approved -> End | timeout -> ESCALATE: Financial Controller -> End
- > $5000 (DUAL): Manager Approval (with timer) -> Finance Approval -> End | timeout -> ESCALATE: Financial Controller -> End

**DMN `amount-thresholds`:** input `amount` -> output `approvalLevel` (AUTO / MANAGER / DUAL)

### 6.4 Virtual Card Request Approval

**Files:**
- `virtual-card-approval.bpmn` (entrypoint)
- `card-eligibility.dmn`
- `card-limit-check.dmn`

**Workflow:**
- Start -> Submit Request -> DMN card-eligibility -> branch
- Eligible: Manager Approval -> DMN limit-check -> Issue Virtual Card (HTTP service task to mock API) -> End
- Ineligible: Notify Rejection -> End

**DMN `card-eligibility`:** inputs `employeeStatus`, `existingCards`, `requestedLimit` -> output `eligible` (boolean)
**DMN `card-limit-check`:** inputs `requestedLimit`, `creditScore` -> output `approvedLimit` (number)

### 6.5 Physical Card Request with KYC

**Files:**
- `physical-card-kyc.bpmn` (entrypoint)
- `kyc-validation.dmn`
- `risk-assessment.dmn`

**Workflow:**
- Start -> KYC Data Entry (user task: fullName, DOB, address, governmentId, employmentInfo) -> DMN kyc-validation -> branch
- Incomplete: Request Missing Info -> loop back to KYC Data Entry
- Complete: Identity Verification (user task + HTTP service task to mock API) -> DMN risk-assessment -> branch
  - Low risk: Auto-Approve -> Issue Card (HTTP service task) -> End
  - Medium risk: Manager + Compliance Approval -> Issue Card -> End
  - High risk: Compliance Review -> Reject/Escalate -> End

**DMN `kyc-validation`:** inputs `hasName`, `hasDOB`, `hasAddress`, `hasGovernmentId`, `hasEmployment` -> outputs `kycComplete` (boolean), `missingFields` (string)
**DMN `risk-assessment`:** inputs `creditScore`, `identityVerified`, `employmentStatus` -> output `riskLevel` (LOW / MEDIUM / HIGH)

### 6.6 Card Controls Change Approval (CMMN + BPMN + DMN)

**Files:**
- `card-controls-case.cmmn` (entrypoint)
- `card-controls-process.bpmn`
- `apply-card-changes.bpmn`
- `card-control-thresholds.dmn`

**CMMN Case:**
- Stage 1: Process Task "Evaluate Request" -> references `card-controls-process.bpmn` via `processRef`
- Stage 2 (conditional, if amount > $1000): Human Task "Manager Review"
- Stage 3 (conditional, if amount > $5000): Human Task "Finance Review"
- Stage 4: Process Task "Apply Changes" -> references `apply-card-changes.bpmn` via `processRef`

**BPMN `card-controls-process`:**
- Start -> DMN card-control-thresholds -> branch
- < $1000: Auto-Apply -> End (sets `approvalLevel=AUTO`)
- $1000-$5000: Manager Task -> End (sets `approvalLevel=MANAGER`)
- > $5000: Manager + Finance Task -> End (sets `approvalLevel=DUAL`)

**BPMN `apply-card-changes`:**
- Start -> Apply Limit Change (HTTP service task to mock API) -> Notify Cardholder -> End

**DMN `card-control-thresholds`:** inputs `amount`, `changeType` (LIMIT_INCREASE / LIMIT_DECREASE / FREEZE / UNFREEZE) -> output `approvalLevel`

### 6.7 Cross-Reference Summary

| Bundle | Files | Cross-References |
|--------|-------|-----------------|
| 1A: Standard Expense | 1 BPMN + 1 DMN + 1 event | BPMN -> DMN (decisionRef), BPMN -> event (eventRef) |
| 1B: Government Client | 1 BPMN + 2 DMN | BPMN -> DMN (2 decisionRefs) |
| 1C: Tiered Amount | 1 BPMN + 1 DMN | BPMN -> DMN (decisionRef) |
| 2: Virtual Card | 1 BPMN + 2 DMN | BPMN -> DMN (2 decisionRefs) |
| 3: Physical Card + KYC | 1 BPMN + 2 DMN | BPMN -> DMN (2 decisionRefs) |
| 4: Card Controls | 1 CMMN + 2 BPMN + 1 DMN | CMMN -> BPMN (2 processRefs), BPMN -> DMN (decisionRef) |

### 6.8 Escalation Matrix

| Scenario | Time Escalation | Government Client Check | Travel > $10K Escalation |
|----------|----------------|------------------------|-------------------------|
| 1A: Standard | 5 working days -> Financial Controller | -- | -> Senior Director |
| 1B: Government Client | -- | -> Governmental Spend Approvers | -> Senior Director |
| 1C: Tiered Amount | 5 working days -> Financial Controller | -- | -- |

### 6.9 Seed Script

`scripts/seed-samples.sh` — bash script that:
1. Creates sample companies (Acme Corp, Acme EU as child, TechStart Inc, GovContract LLC)
2. Creates bundles via `curl` multipart uploads to `POST /v1/bundles`
3. Sets entrypoints via `PUT /v1/bundles/{id}/entrypoint`
4. Validates each bundle via `POST /v1/bundles/{id}/validate`
5. Publishes select bundles via `POST /v1/bundles/{id}/publish`

Reads sample XML files from `backend/src/main/resources/samples/`. Configurable `BASE_URL` variable for different environments.

---

## 7. Frontend Design

### 7.1 Technology Stack

| Component | Choice | Version |
|-----------|--------|---------|
| Framework | React | 19.x |
| Build | Vite | 8.x |
| Routing | React Router | 8.x |
| Server State | TanStack Query | 5.x |
| Styling | Tailwind CSS | 4.x |
| Animation | Framer Motion | latest |
| Process Viewer | bpmn-js / cmmn-js / dmn-js | bpmn-js 18.x, cmmn-js 0.20.x, dmn-js 17.x |
| Forms | React Hook Form + Zod | latest |
| Notifications | Sonner | latest |
| Testing | Vitest + React Testing Library | Vitest 4.x |
| E2E Testing | Playwright | 1.x |

### 7.2 Visual Design (Light Professional / Stripe-inspired)

**Color palette:**
- Background: `#f9fafb` (light gray)
- Cards/panels: `#ffffff` with `1px solid #e5e7eb` borders, `8px` border radius
- Primary accent: `#4f46e5` (indigo) for buttons, active states, links
- Text hierarchy: `#111827` (primary), `#374151` (secondary), `#6b7280` (tertiary), `#9ca3af` (muted)
- Status badges: emerald (`#059669` published), amber (`#d97706` draft), zinc (`#71717a` archived)
- Error states: `#dc2626` (red), `#fef2f2` (light red bg)
- Warning states: `#f59e0b` (amber), `#fffbeb` (light amber bg)
- Success states: `#059669` (green), `#ecfdf5` (light green bg)

**Sidebar:**
- White background, 220px wide
- Branded logo at top (indigo square with "D" + "Decisioning" text)
- Section labels (uppercase, muted): "Workspace"
- Nav items: Companies, Bundles, New Bundle
- Footer: connection status indicator (green dot + "Flowable connected"), Help & Docs button

**Typography:**
- System font stack (system-ui)
- Page titles: 22px, weight 600
- Subtitles: 13px, muted
- Body text: 14px
- Labels/badges: 11-12px
- Monospace for XML/IDs: font-family monospace

**Animations (Framer Motion):**
- Page transitions: fade + slight slide (200ms)
- Modal/dialog: scale + fade in (150ms)
- Help panel: slide from right (300ms)
- Toast notifications: slide from top-right (200ms)
- Skeleton loaders: pulse animation on gray placeholders

### 7.3 Route Map

| Path | Page Component | Purpose |
|------|---------------|---------|
| / | -- | Redirect -> /companies |
| /companies | CompanyListPage | Table of all companies, search, create button |
| /companies/new | CompanyCreatePage | Form: name + optional parent company selector |
| /companies/:id | CompanyDetailPage | Company info, parent/children hierarchy, bundles grouped by type/status |
| /bundles | BundleListPage | All bundles, filterable by type/company/status (new) |
| /bundles/new | BundleCreatePage | Multi-file upload, type selector, company selector, description |
| /bundles/:id | BundleDetailPage | File list, validation panel, publish/schedule, spawn, events |
| /bundles/:id/files/:fileId | BundleFileViewerPage | Full-screen bpmn-js/cmmn-js/dmn-js viewer |
| /bundles/:id/spawn | BundleSpawnPage | Dynamic variable form, event sending, submit to start instance |
| * | ErrorPage | 404/500 error page with navigation |

### 7.4 Key Component Descriptions

#### AppLayout
Light theme flexbox layout. Sidebar (220px) + main content area. React ErrorBoundary wraps the Outlet for graceful error handling.

#### Sidebar
White sidebar with branded logo, nav links (Companies, Bundles, New Bundle), connection status indicator, and Help & Docs button in footer.

#### BundleListPage (new)
Table of all bundles with columns: type badge, company name, status badge, file count, created date. Filter bar: type dropdown, company dropdown, status dropdown. Click row -> bundle detail.

#### BundleDetailPage (enhanced)
Header: bundle type badge, company name, status badge. Action buttons: Publish/Schedule (draft), Spawn (published + entrypoint), Add Files (draft).
Sections: description panel, validation panel (enhanced error display), file table (with files[] from API), events section (if bundle has .event files).

#### ValidationErrorsPanel (enhanced)
- Error banner: red panel with count and summary at top
- Per-file error cards: file type badge, element details, missing reference in monospace, suggested fix
- Success panel: green checkmark with "All cross-references valid" when no errors
- Re-validate button

#### HelpPanel (new)
Slide-out panel (380px) from right side. Framer Motion animation (300ms). Searchable article list. Article categories: Getting Started, Reference, Learn More. Article view with rich content blocks. Contextual: highlights relevant article based on current route.

#### HelpButton (new)
Sidebar footer button that toggles the HelpPanel open/closed.

#### ErrorPage (new)
Full-page error display for 404 (bundle/company not found) and 500 (unexpected error). Illustration, message, navigation back to safety.

#### ErrorBoundary (new)
React error boundary wrapping route outlet. Catches render errors, shows fallback with "Reload" button.

### 7.5 API Client Error Handling (enhanced)

Centralized error parsing in `lib/api-client.ts`:
```typescript
interface ApiError {
  status: number;
  title: string;
  detail: string;
  errors?: ValidationError[];
  parseError?: ParseError;
  lifecycleError?: LifecycleError;
  suggestion?: string;
  traceId?: string;
}
```

All `apiGet`/`apiPost`/`apiPut`/`apiDelete` calls throw `ApiError` on non-2xx. Mutations catch in `onError` callbacks.

**Three display mechanisms:**
1. **Inline panels** — validation errors on Bundle Detail Page (per-file cards with suggestions)
2. **Toast notifications** — API errors, mutations, warnings (Sonner: red/error, amber/warning, green/success)
3. **Inline form errors** — React Hook Form + Zod: red border, error message below field
4. **Error pages** — route-level 404/500 pages

**XML parse errors** — client-side well-formedness check in the dropzone on file selection, with red highlight and line/column message. Backend does authoritative parse on upload.

---

## 8. Online Help System

### 8.1 Architecture

Slide-out panel accessible from any page via "Help & Docs" button in sidebar footer. React context state (not URL-based). Framer Motion animation.

**Component structure:**
```
frontend/src/components/help/
├── HelpPanel.tsx          # Slide-out container, search, article list, article view
├── HelpButton.tsx         # Sidebar button that toggles the panel
├── HelpArticle.tsx        # Renders a selected article with rich text
├── HelpSearch.tsx         # Search input with live filtering
└── articles.ts            # Article content as structured data
```

### 8.2 Help Article Data Model

```typescript
interface HelpArticle {
  id: string;
  title: string;
  category: 'getting-started' | 'reference' | 'learn-more';
  summary: string;
  content: HelpContent[];
  relatedPages?: string[];
}

interface HelpContent {
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'callout' | 'link';
  text?: string;
  items?: string[];
  url?: string;
  variant?: 'info' | 'warning' | 'tip';
}
```

### 8.3 Article Content

**Getting Started (6 articles):**

| Article | Summary |
|---------|---------|
| What is a Decisioning Bundle? | Explains how BPMN, CMMN, and DMN files work together to define approval workflows |
| Creating Your First Bundle | Step-by-step: select type, choose company, upload files, set entrypoint |
| Company Hierarchy & Resolution | How bundles inherit through parent companies, fallback to Global |
| Publishing & Scheduling | Draft -> Published -> Archived lifecycle, go-live scheduling, auto-promotion |
| Validating Your Bundles | How cross-reference validation works, common errors, how to fix them |
| Spawning Processes | How to start a Flowable process instance from a published bundle |

**Reference (5 articles):**

| Article | Summary |
|---------|---------|
| Bundle Types Explained | Expense Approval (3 variants), Virtual Card, Physical Card + KYC, Card Controls |
| File Types: BPMN, CMMN, DMN | What each file type represents, when to use each, how they cross-reference |
| Diagram Auto-Generation | How ELK layouts work, what happens when files lack embedded diagrams |
| Sample Bundles Overview | Describes the 7 included sample bundles and what they demonstrate |
| Error Messages Reference | Catalog of error types, what they mean, and how to resolve them |

**Learn More (3 articles with external links):**

| Article | Summary |
|---------|---------|
| About CMMN | What is Case Management Model and Notation, link to OMG spec, Flowable CMMN docs |
| About BPMN | What is Business Process Model and Notation, link to OMG spec, Flowable BPMN docs |
| About DMN | What is Decision Model and Notation, link to OMG spec, Flowable DMN docs |

### 8.4 Panel Behavior

- **Open:** Click "Help & Docs" in sidebar -> panel slides in from right (300ms), backdrop dims main content
- **Search:** Type in search input -> live-filters articles by title, summary, and content
- **Article view:** Click an article -> list fades out, article content fades in with back link
- **Contextual:** Panel highlights relevant article for current route (e.g., on /bundles/:id -> highlights "Validating Your Bundles")
- **Close:** Click x, click backdrop, or press Escape -> panel slides out
- **Mobile:** Panel takes full width on screens < 768px

---

## 9. Browser Test Suite

### 9.1 Playwright E2E Suite

**Config:** `playwright.config.ts` at project root. Base URL: `http://localhost:5173` (Vite dev). Auto-starts docker-compose, backend, frontend via `webServer` config. Test isolation via DB reset.

**Test files:**

| File | Scope | Key Scenarios |
|------|-------|--------------|
| companies.spec.ts | Company CRUD | Empty state -> create -> list -> create child -> detail with hierarchy -> delete |
| bundles-create.spec.ts | Bundle upload | New bundle -> select type -> company -> drop files -> submit -> detail renders |
| bundles-list.spec.ts | Bundle listing | View all -> filter by type -> filter by company -> filter by status -> click through |
| bundles-detail.spec.ts | Bundle detail | File table -> set entrypoint -> validate (success + error) -> add files -> publish -> schedule |
| bundles-viewer.spec.ts | Diagram viewer | Open BPMN -> verify canvas -> zoom/pan -> open CMMN -> open DMN -> verify ELK layout |
| bundles-spawn.spec.ts | Process spawning | Published bundle -> spawn form -> fill variables -> submit -> instance ID |
| validation.spec.ts | Error messaging | Missing cross-refs -> validate -> structured error panel -> upload missing file -> re-validate -> success |
| error-pages.spec.ts | Error handling | Non-existent bundle (404) -> error page -> API error toast -> form validation errors |
| help-panel.spec.ts | Help system | Open from sidebar -> search -> navigate articles -> external links -> close |
| visual-rendering.spec.ts | Visual design | Screenshot comparisons of key pages against baselines (light theme, badges, layout) |
| seed-samples.spec.ts | Sample bundles | Run seed script -> 7 bundles created -> files present -> validate all pass -> cross-refs |
| lifecycle.spec.ts | Full lifecycle | Company -> bundle -> files -> validate -> entrypoint -> publish -> spawn -> archive -> schedule -> promote |

**Screenshot testing:** `toHaveScreenshot()` captures and compares rendered pages. Baselines in `tests/e2e/screenshots/`.

### 9.2 Browser MCP Test Scripts

Structured markdown scripts guiding an agent through interactive verification:

| File | Purpose |
|------|---------|
| smoke-test.md | Every page loads, no console errors, navigation works |
| full-crud-flow.md | Complete company + bundle CRUD with visual verification |
| sample-bundles-visual.md | Load all 7 sample bundles, open each diagram, verify ELK layout |
| error-scenarios.md | Trigger each error type, verify messaging |
| help-panel-visual.md | Open help, search, navigate, verify presentation |
| responsive-check.md | Mobile/tablet/desktop breakpoints, sidebar collapse, layout |

---

## 10. Testing Strategy

### 10.1 Backend Testing

| Test Type | Tools | Scope |
|-----------|-------|-------|
| Unit | JUnit 5, Mockito | Every service, validator, DTO mapper with mocked dependencies |
| Integration | @SpringBootTest, Testcontainers (PostgreSQL 16) | Every API endpoint: happy path, error cases, edge cases |
| Diagram generation | JUnit 5 | BPMN/CMMN/DMN input without DI -> verify DI present, ELK properties |
| Cross-reference validator | JUnit 5 | Valid bundles, missing refs, event refs, parse errors |
| Flowable integration | @SpringBootTest with Flowable enabled | Deployment, spawn, form variable extraction |
| Event Registry | @SpringBootTest | Event definition deployment, correlation, programmatic sending |

**Coverage:** JaCoCo Maven plugin with `minimum 0.85` rule. Fails build if below threshold.

**Test profile (`application-test.yml`):**
- Disables Liquibase, uses `ddl-auto: create`
- Flowable auto-configuration enabled for Flowable-specific tests (via separate test profile or `@TestConfiguration`)
- Testcontainers PostgreSQL 16

### 10.2 Frontend Testing

| Test Type | Tools | Scope |
|-----------|-------|-------|
| Component | Vitest, React Testing Library | All components: rendering, interactions, prop validation |
| Page integration | Vitest + MSW | Each page with mocked API, mutations, error states |
| API hook | Vitest + MSW | All TanStack Query hooks with mocked responses |

**Coverage:** Vitest c8/istanbul with 85% threshold.

**MSW setup (v2 fix):** Proper `server.listen()` / `server.resetHandlers()` / `server.close()` in test setup file with `beforeAll`/`afterEach`/`afterAll`.

### 10.3 E2E Testing

Playwright covers full user journeys (not counted in unit coverage %). Browser MCP scripts for interactive visual verification.

---

## 11. Data Flow Diagrams

### 11.1 Bundle Resolution Flow

```
Request: GET /v1/bundles/resolve?companyId=42&bundleType=EXPENSE_APPROVAL
                    |
                    v
        +-----------------------+
        | companyId exists in DB?|
        +-----------+-----------+
              Yes   |   No
                    |   +-----------------------------------+
                    v                                       v
        +-----------------------+          +-------------------------+
        | Find PUBLISHED bundle  |          | Use Global PUBLISHED     |
        | for company 42 + type  |          | (company_id = null)      |
        +-----------+-----------+          +-------------------------+
           Found?   |  Not found
           Yes      |    |
                    |    v
                    |  +----------------+
                    |  | Has parent?    |
                    |  +---+---------+---+
                    |  Yes |    No   |
                    |      |         |     +------------------+
                    |      v         v                         |
                    |  +----------+ +-----------------------+  |
                    |  | Walk up  | | Find Global PUBLISHED |  |
                    |  | parent   | | (company_id = null)   |  |
                    |  | chain    | +-----------------------+  |
                    |  +----------+                             |
                    |      |                                     |
                    v      v                                     v
        +--------------------------------------------------------+
        |                    Return Bundle DTO                    |
        |  (with source: "company" | "parent" | "global" | 404)  |
        +--------------------------------------------------------+
```

### 11.2 Go-Live Promotion Flow

```
+----------------+
| @Scheduled job  | -- runs every 30s (configurable)
| (fixedDelay)    |
+-------+--------+
        v
+-------------------------------+
| SELECT * FROM decisioning_bundles
| WHERE status = 'DRAFT'
|   AND go_live_at <= now()     |
+---------------+---------------+
        +-------+-------+   (per bundle found)
        v               v
+-------------------------------+
| Find currently PUBLISHED bundle
| for same (company_id, bundle_type)
| -> set status = ARCHIVED      |
+---------------+---------------+
                v
+-------------------------------+
| Set this bundle:              |
|   status = PUBLISHED          |
|   go_live_at = null           |
+-------------------------------+
```

---

## 12. docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: decisioning
      POSTGRES_USER: decisioning
      POSTGRES_PASSWORD: decisioning
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
  mock-api:
    image: wiremock/wiremock:latest
    ports:
      - "8081:8080"
    volumes:
      - ./mock-api/mappings:/home/wiremock/mappings
volumes:
  pgdata:
```

---

## 13. Agent Configuration (Five-Agent Model)

The implementation plan targets five custom opencode agents, each backed by a specific LLM and scoped to a role. This mirrors a real engineering team and ensures deepseek work is always reviewed by a glm model before acceptance.

### 13.1 Agent Definitions

Agents are defined as files in `.opencode/agents/`:

#### glm-architect (`openmodel/glm-5.2`)

| Field | Value |
|-------|-------|
| Model | `openmodel/glm-5.2` |
| Mode | `subagent` |
| Role | System design, critical architecture decisions, final review |

**Responsibilities:**
- Spring Boot 4 + Flowable 8 engine configuration (`FlowableConfig`)
- ELK diagram generation service (BPMN + CMMN + DMN)
- Event Registry integration (`EventRegistryService`)
- Final code review before tasks are marked complete
- Architecture decisions and cross-cutting design

**Tasks in plan:** Project scaffolding, FlowableConfig, DiagramGenerationService, EventRegistryService, Flowable integration tests, final reviews

---

#### glm-senior-engineer (`openmodel/glm-5.2`)

| Field | Value |
|-------|-------|
| Model | `openmodel/glm-5.2` |
| Mode | `subagent` |
| Role | Complex implementation, cross-cutting concerns |

**Responsibilities:**
- CrossReferenceValidator (BPMN/CMMN/DMN/event reference checking)
- ProcessSpawnService (form variable extraction, lazy deployment)
- Error exception hierarchy and GlobalExceptionHandler
- BundleResolutionService (hierarchical resolution)
- Frontend API client error parsing
- BundleDetailPage (complex state management)

**Tasks in plan:** Services with complex logic, error handling, validation, resolution, spawn, frontend state management

---

#### deepseek-junior-engineer (`openmodel/deepseek-v4-pro`)

| Field | Value |
|-------|-------|
| Model | `openmodel/deepseek-v4-pro` |
| Mode | `subagent` |
| Role | Pattern-following implementation |

**Responsibilities:**
- JPA entities and enums
- DTOs (request/response records)
- Spring Data JPA repositories
- Simple CRUD controllers (CompanyController, BundleTypeController)
- Wiremock JSON mappings
- Help article content (`articles.ts`)
- Seed script (`seed-samples.sh`)
- Sidebar, AppLayout, CompanyTable (simple components)
- Sample BPMN/CMMN/DMN XML files

**Tasks in plan:** Entities, DTOs, repositories, simple controllers, Wiremock mappings, help content, seed script, sample XML files, simple frontend components

---

#### glm-senior-qa (`openmodel/glm-5.2`)

| Field | Value |
|-------|-------|
| Model | `openmodel/glm-5.2` |
| Mode | `subagent` |
| Role | Test strategy, complex test design, test review |

**Responsibilities:**
- Integration test design (`@SpringBootTest` + Testcontainers)
- Flowable-enabled test configuration
- Playwright spec design and structure
- Test coverage analysis and gap identification
- Reviewing tests written by deepseek-junior-qa

**Tasks in plan:** Test configuration, integration test specs, Playwright spec design, coverage review

---

#### deepseek-junior-qa (`openmodel/deepseek-v4-pro`)

| Field | Value |
|-------|-------|
| Model | `openmodel/deepseek-v4-pro` |
| Mode | `subagent` |
| Role | Writing test code from established patterns |

**Responsibilities:**
- Unit tests for services and controllers (following patterns set by glm-senior-qa)
- Frontend component tests (Vitest + React Testing Library)
- MSW handlers and test fixtures
- Browser MCP test scripts
- Simple Playwright test implementations

**Tasks in plan:** Unit tests, component tests, MSW handlers, Browser MCP scripts, Playwright test code

### 13.2 Quality Gate Flow

Each task follows this workflow:

1. **Design** — `glm-architect` or `glm-senior-engineer` designs the approach (for complex tasks)
2. **Implement** — `deepseek-junior-engineer` (pattern-following) or `glm-senior-engineer` (complex) implements
3. **Test** — `deepseek-junior-qa` writes tests (from patterns established by `glm-senior-qa`)
4. **Review** — `glm-senior-qa` reviews tests, `glm-architect` or `glm-senior-engineer` reviews implementation

Work done by `deepseek-*` agents is always reviewed by a `glm-*` agent before the task is marked complete.

### 13.3 Agent File Structure

```
.opencode/agents/
├── glm-architect.md
├── glm-senior-engineer.md
├── deepseek-junior-engineer.md
├── glm-senior-qa.md
└── deepseek-junior-qa.md
```

Each agent file contains frontmatter specifying model, mode, and permissions, plus a prompt body defining the agent's role, constraints, and coding standards.

### 13.4 Task-to-Agent Mapping (Summary)

| Task Category | Implementer | Tester | Reviewer |
|---------------|------------|--------|----------|
| Project scaffolding | glm-architect | -- | -- |
| Flowable config | glm-architect | glm-senior-qa | -- |
| Entities/DTOs/repos | deepseek-junior-engineer | deepseek-junior-qa | glm-senior-engineer |
| Simple controllers | deepseek-junior-engineer | deepseek-junior-qa | glm-senior-engineer |
| Complex services | glm-senior-engineer | deepseek-junior-qa | glm-architect |
| Error handling | glm-senior-engineer | deepseek-junior-qa | glm-architect |
| Diagram generation | glm-architect | glm-senior-qa | -- |
| Event Registry | glm-architect | glm-senior-qa | -- |
| Frontend scaffolding | deepseek-junior-engineer | -- | glm-senior-engineer |
| Frontend pages (simple) | deepseek-junior-engineer | deepseek-junior-qa | glm-senior-engineer |
| Frontend pages (complex) | glm-senior-engineer | deepseek-junior-qa | glm-architect |
| Help system content | deepseek-junior-engineer | -- | glm-senior-engineer |
| Sample XML files | deepseek-junior-engineer | -- | glm-senior-engineer |
| Wiremock mappings | deepseek-junior-engineer | -- | -- |
| Seed script | deepseek-junior-engineer | -- | glm-senior-engineer |
| Integration tests | glm-senior-qa | -- | glm-architect |
| Playwright specs | deepseek-junior-qa | -- | glm-senior-qa |
| Browser MCP scripts | deepseek-junior-qa | -- | glm-senior-qa |
| Final review | glm-architect | -- | -- |

---

## 14. Global Constraints

- Google Java Style Guide for all Java code
- Vercel React best practices (loaders/query for server state, Suspense boundaries, lazy code-split pages)
- All API endpoints prefixed with `/v1`
- No authentication (internal admin tool)
- Liquibase for database migrations
- Test-first: write failing test, run it, implement, run passing, commit
- 85-90% test coverage (JaCoCo + Vitest thresholds)
- Light professional visual design (Stripe-inspired)
- BPMN/CMMN/DMN files auto-enriched with ELK diagrams on upload
- RFC 7807 ProblemDetail for all error responses
- Five-agent model: glm-5.2 for architecture/complex/review, deepseek-v4-pro for pattern-following/test-writing

---

## 15. Open Questions / Deferred Items

| # | Item | Status |
|---|------|--------|
| Q1 | Authentication | Deferred (no auth) |
| Q2 | File size limits | 10MB per file, 50MB per request (enforced via Spring multipart config) |
| Q3 | JMS/Kafka channel definitions for Event Registry | Deferred — programmatic channel only for v2 |
| Q4 | Kafka container in docker-compose | Deferred — Wiremock only for v2 |
| Q5 | GenAI natural-language-to-BPMN feature | Deferred — bolt-on after fundamentals work |
| Q6 | Event instance history/querying UI | Deferred — available via Flowable REST API if needed |
| Q7 | Agent model targeting | Five agents: glm-architect, glm-senior-engineer (glm-5.2), deepseek-junior-engineer, deepseek-junior-qa (deepseek-v4-pro), glm-senior-qa (glm-5.2) |
