# Sample Bundles

Seven pre-built Flowable 8 approval workflow bundles demonstrating real-world enterprise expense management processes with escalation paths.

## Purpose

These samples demonstrate:
- BPMN process modeling with user tasks, gateways, boundary timers, and HTTP service tasks
- CMMN case management with stages, sentries, and process task orchestration
- DMN decision tables for threshold-based routing
- Event Registry definitions for event-driven process triggers
- Cross-references between BPMN, CMMN, DMN, and Event files within a bundle
- Escalation patterns (time-based, amount-based, client-type-based)

## Bundles

### Expense Approval (3 variants)

| Bundle | Files | Key Features |
|--------|-------|-------------|
| **1A: Standard** | `expense-standard-escalation.bpmn`, `travel-check.dmn`, `expense-submitted.event` | Event-based start, 5-working-day manager timer → financial controller escalation, travel > $10K → senior director |
| **1B: Government Client** | `expense-gov-client-review.bpmn`, `line-item-classification.dmn` (+ shared `travel-check.dmn`) | Line item government client classification → Governmental Spend Approvers, travel > $10K → senior director |
| **1C: Tiered Amount** | `expense-tiered-escalation.bpmn`, `amount-thresholds.dmn` | DMN routing: <$500 auto, $500-$5000 manager + timer, >$5000 manager + finance dual approval |

### Virtual Card Approval

| Bundle | Files | Key Features |
|--------|-------|-------------|
| **Virtual Card** | `virtual-card-approval.bpmn`, `card-eligibility.dmn`, `card-limit-check.dmn` | Eligibility + limit checks, manager approval, HTTP service task to mock card issuance |

### Physical Card with KYC

| Bundle | Files | Key Features |
|--------|-------|-------------|
| **Physical Card + KYC** | `physical-card-kyc.bpmn`, `kyc-validation.dmn`, `risk-assessment.dmn` | KYC data entry with loop-back for incomplete data, identity verification HTTP call, risk-based routing (low/medium/high) |

### Card Controls Change

| Bundle | Files | Key Features |
|--------|-------|-------------|
| **Card Controls** | `card-controls-case.cmmn`, `card-controls-process.bpmn`, `apply-card-changes.bpmn`, `card-control-thresholds.dmn` | CMMN case orchestrating BPMN processes, DMN threshold routing, sentry-based conditional stages |

## Loading Samples

```bash
# Start the application first (Docker or dev mode)
# Then run the seed script:
./scripts/seed-samples.sh

# Or specify a custom API URL:
BASE_URL=http://localhost:8080/v1 ./scripts/seed-samples.sh
```

The seed script:
1. Creates 4 companies (Acme Corp, Acme EU, TechStart Inc, GovContract LLC)
2. Uploads each bundle via the API
3. Sets entrypoints
4. Validates cross-references
5. Publishes select bundles

## File Format Notes

### XML Conventions

All XML files must use well-formed XML with proper namespace declarations and element prefixes where required by the viewer libraries.

### BPMN Format

- **Namespace**: `xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"`
- **Flowable extensions**: `xmlns:flowable="http://flowable.org/bpmn"`
- **Root element**: `<definitions>` (unprefixed, uses default namespace)
- **Viewer**: bpmn-js 18.x renders unprefixed BPMN elements, including DI (Diagram Interchange) for visual layout
- **Service tasks**: Use `flowable:type="http"` for HTTP calls, `flowable:type="dmn"` for DMN routing
- **Timers**: Boundary timer events use `businessCalendarName="workingDay"` with ISO 8601 durations (e.g., `P5D` for 5 days). The custom `workingDay` calendar excludes weekends
- **Event-based starts**: Use `<startEvent>` with `<messageEventDefinition>` and `<extensionElements>` containing `<flowable:eventType>` and `<flowable:eventOutParameter>` elements

### CMMN Format

- **Namespace**: `xmlns="http://www.omg.org/spec/CMMN/20151109/MODEL"`
- **Flowable extensions**: `xmlns:flowable="http://flowable.org/cmmn"`
- **Root element**: `<definitions>` (unprefixed, uses default namespace)
- **Viewer**: cmmn-js 0.20.x renders unprefixed CMMN elements
- **Case plan model**: Define `<case>` with `<casePlanModel>` containing stages, tasks, milestones, and sentries
- **Process references**: Use `processRef="bpmn-process-id"` on `<processTask>` elements to cross-reference BPMN processes
- **Sentry conditions**: Use `<sentry>` with `<planItemOnPart>` and `<ifPart>` for conditional stage/task activation

### DMN Format (⚠️ dmn-js 17.x Prefix Requirement)

**Critical:** dmn-js 17.x requires **DMN 1.3** with the `dmn:` prefix on ALL DMN elements. DMN 1.1 (`http://www.omg.org/spec/DMN/20151101`) is not supported. Unprefixed elements or wrong namespace will fail with: `failed to parse document as <dmn:Definitions>`.

- **Namespace**: `xmlns:dmn="https://www.omg.org/spec/DMN/20191111/MODEL/"` — **DMN 1.3 only**. Do not use the DMN 1.1 namespace (`...20151101`) as dmn-js 17.x does not support it. Do not add `.xsd` suffix
- **Root element**: `<dmn:definitions>` (NOT `<definitions>`)
- **All child elements**: MUST use `dmn:` prefix — `<dmn:decision>`, `<dmn:decisionTable>`, `<dmn:input>`, `<dmn:inputExpression>`, `<dmn:output>`, `<dmn:rule>`, `<dmn:inputEntry>`, `<dmn:outputEntry>`, `<dmn:text>`
- **Hit policy**: Decision tables use `hitPolicy="FIRST"` for priority-based rule matching
- **FEEL expressions**: `<dmn:text>` content uses FEEL (Friendly Enough Expression Language) — e.g., `>= 750`, `== 'FULL_TIME'`, `>= 650 && < 750`
- **HTML entities**: Use `&gt;` for `>`, `&lt;` for `<`, `&amp;&amp;` for `&&` in XML attributes

**Example (correct DMN structure):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<dmn:definitions xmlns:dmn="https://www.omg.org/spec/DMN/20191111/MODEL/"
                 namespace="http://www.flowable.org/dmn"
                 name="Example Decision">

  <dmn:decision id="example-decision" name="Example">
    <dmn:decisionTable id="exampleTable" hitPolicy="FIRST">
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

### Event Registry Format

- **Format**: JSON (not XML)
- **Structure**: `{"key": "event-name", "name": "Display Name", "correlationParameters": [...], "payload": [...]}`
- **Correlation parameters**: Used to match events to waiting process instances
- **Payload fields**: Data passed to the process when the event triggers

## Cross-Reference Validation

The application validates cross-references between files:
- BPMN → DMN (`decisionRef` on business rule tasks)
- CMMN → BPMN (`processRef` on process tasks)
- BPMN → Event (`eventRef` on event definitions)

All 7 bundles pass validation after upload.
