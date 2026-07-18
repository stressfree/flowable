# Backend — Decisioning Bundle Manager

Spring Boot 4.0 application with embedded Flowable 8 engine, providing REST APIs for managing decisioning bundles.

## Purpose

- Company CRUD with parent-child hierarchy
- Bundle creation (multipart upload of BPMN/CMMN/DMN/Event files)
- Cross-reference validation with structured error suggestions
- Auto-diagram generation via ELK layout engine (BPMN/CMMN/DMN)
- Bundle lifecycle management (draft → publish → archive, scheduled go-live)
- Hierarchical bundle resolution through company inheritance chain
- Flowable process/case instance spawning
- Event Registry integration (event definitions, test event sending)

## Tech Stack

| Component | Version |
|-----------|---------|
| Spring Boot | 4.0.0 |
| Flowable | 8.0.0 |
| Java | 21 |
| PostgreSQL | 16 |
| Hibernate | 7.1 (managed by Boot) |
| ELK Layout | 0.11.0 |
| Liquibase | (managed by Boot) |
| Testcontainers | 1.21.4 |
| JaCoCo | 0.8.15 |

## Building

```bash
cd backend

# Compile
mvn compile

# Run tests
mvn test

# Run tests with coverage
mvn verify

# Package (skip tests for faster builds)
mvn package -DskipTests

# Run application (requires PostgreSQL on localhost:5432)
mvn spring-boot:run
```

## Testing

Unit and integration tests use Testcontainers to spin up a real PostgreSQL 16 instance.

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=CompanyIntegrationTest

# Generate coverage report
mvn verify
# Report: backend/target/site/jacoco/index.html
```

**Test coverage target:** 85% minimum (JaCoCo BUNDLE instruction ratio)

## API Endpoints

All endpoints prefixed with `/v1`. See the [design spec](../docs/superpowers/specs/2026-07-12-decisioning-bundle-manager-v2-design.md) for full API documentation.

## Configuration

Key properties in `src/main/resources/application.yml`:

| Property | Default | Description |
|----------|---------|-------------|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/decisioning` | Database URL |
| `flowable.database-schema-update` | `true` | Auto-create Flowable tables |
| `flowable.event-registry.enabled` | `true` | Enable Event Registry engine |
| `mock.api.base-url` | `http://mock-api:8080` | Wiremock base URL |
| `scheduler.go-live-interval-ms` | `30000` | Go-live promotion check interval |

When running inside Docker, datasource properties are overridden via command-line arguments.

## Directory Structure

```
backend/
├── pom.xml
├── src/main/java/com/example/decisioning/
│   ├── DecisioningApplication.java
│   ├── config/               # FlowableConfig, BusinessCalendarConfig, BundleTypeConfig
│   ├── entity/               # JPA entities (Company, DecisioningBundle, BundleFile)
│   ├── repository/           # Spring Data JPA repositories
│   ├── service/              # Business logic services
│   ├── controller/           # REST controllers + GlobalExceptionHandler
│   ├── dto/                  # Request/response DTO records
│   └── exception/            # Structured exception hierarchy
├── src/main/resources/
│   ├── application.yml
│   ├── application-test.yml
│   └── db/changelog/         # Liquibase migration scripts
└── src/test/
    ├── integration/          # @SpringBootTest + Testcontainers
    └── unit/                 # JUnit 5 + Mockito
```
