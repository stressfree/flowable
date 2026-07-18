# Wiremock Mock API

Wiremock container providing stub REST API endpoints for sample BPMN service task HTTP calls.

## Purpose

Sample BPMN processes make HTTP service task calls to external APIs (card issuance, identity verification, expense notification, audit logging). Instead of requiring real external services, Wiremock provides pre-configured stub responses.

## Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/cards/issue` | POST | Issue a virtual or physical card | `{"status":"success","mock":true,"data":{"cardId":"...","status":"ISSUED"}}` |
| `/cards/apply-changes` | POST | Apply card control changes | `{"status":"success","mock":true,"data":{"status":"APPLIED"}}` |
| `/expense/notify` | POST | Notify expense system | `{"status":"success","mock":true}` |
| `/identity/verify` | POST | Verify identity | `{"status":"success","mock":true,"data":{"verified":true,"riskScore":35}}` |
| `/audit/log` | POST | Audit log entry | `{"status":"success","mock":true,"data":{"logged":true}}` |

## Usage

Wiremock starts automatically with `docker compose up`. Stub mappings are in `mock-api/mappings/`.

- **API**: http://localhost:8081 (e.g., `curl -X POST http://localhost:8081/cards/issue -H "Content-Type: application/json" -d '{}'`)
- **Admin UI**: http://localhost:8081/__admin/webapp (view received requests)

From within Docker (e.g., backend), the URL is `http://mock-api:8080`.

## Configuration

Stub mappings are JSON files in `mock-api/mappings/`. Each file defines:
- Request matching (URL, method)
- Response (status code, JSON body, delay)

Response templating is enabled (`--global-response-templating`) so Wiremock resolves `{{now}}` to current timestamps.

## Directory Structure

```
mock-api/
└── mappings/
    ├── cards-issue.json
    ├── cards-apply-changes.json
    ├── expense-notify.json
    ├── identity-verify.json
    └── audit-log.json
```
