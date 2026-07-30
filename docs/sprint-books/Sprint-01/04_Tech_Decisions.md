# Quantora — Technology Decisions (ADRs)

> **Document ID:** QTD-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## ADR-001: Monorepo with Turborepo

**Status:** Accepted  
**Date:** July 26, 2026

### Context

We need to manage multiple apps (NestJS, FastAPI, Angular) and shared packages in a single repository.

### Decision

Use Turborepo monorepo with `apps/` and `packages/` directories.

### Rationale

- Single `npm install` for all JS/TS dependencies
- Shared TypeScript configs, ESLint rules, types
- Turborepo caching speeds up builds
- Easier cross-app refactoring
- Solo dev — monorepo reduces complexity vs multi-repo

### Consequences

- FastAPI (Python) lives in `apps/ai-fastapi/` with its own `requirements.txt`
- Must manage both npm and pip dependencies
- CI/CD needs to handle both ecosystems

---

## ADR-002: Angular for Frontend

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Need a production-grade frontend framework for a complex SPA with dashboards, charts, and real-time data.

### Decision

Angular 17+ with Angular Material.

### Rationale

- Opinionated framework = consistent patterns for solo dev
- Angular Material provides polished, accessible UI components
- Built-in i18n with `@ngx-translate`
- Strong TypeScript integration
- Excellent for data-heavy dashboards
- RxJS for real-time WebSocket handling

### Alternatives Considered

| Option          | Rejected Because                                            |
| --------------- | ----------------------------------------------------------- |
| React + MUI     | Too many decisions (state mgmt, routing, etc.) for solo dev |
| Vue 3 + Vuetify | Smaller ecosystem, less enterprise adoption                 |
| Next.js         | SSR not needed for SPA; adds complexity                     |

### Consequences

- Must learn Angular patterns (modules, services, dependency injection)
- Angular Material theme customization needed for finance look

---

## ADR-003: NestJS for Backend API

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Need a Node.js backend framework that's production-ready, well-structured, and supports TypeScript end-to-end.

### Decision

NestJS with TypeScript.

### Rationale

- Module-based architecture enforces clean separation
- Built-in DI, guards, pipes, interceptors
- Native TypeScript — shared types with frontend
- Excellent Prisma integration
- OpenAPI/Swagger auto-generation
- WebSocket support for real-time features

### Alternatives Considered

| Option         | Rejected Because                        |
| -------------- | --------------------------------------- |
| Express.js     | Too unstructured for 20-module platform |
| Fastify (Node) | Less mature ecosystem than NestJS       |
| Hono           | Too new, limited enterprise adoption    |

### Consequences

- Steeper learning curve than Express
- Must follow NestJS conventions (modules, controllers, services)

---

## ADR-004: FastAPI for AI Service

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Need a Python service for ML models, data processing, and LangGraph agent orchestration.

### Decision

Python + FastAPI.

### Rationale

- Fastest Python web framework (async, Starlette-based)
- Native OpenAPI/Swagger support
- Best integration with ML ecosystem (pandas, numpy, scikit-learn, LangGraph)
- Type hints with Pydantic models
- Async support for concurrent LLM calls

### Consequences

- Two languages in the stack (TypeScript + Python)
- Need inter-service communication (HTTP or Kafka)
- Separate dependency management (npm + pip)

---

## ADR-005: PostgreSQL + MongoDB + Redis

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Different data types have different storage needs — structured relational data vs flexible documents vs fast cache.

### Decision

Use all three databases, each for its strength.

| Database      | Data                                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| PostgreSQL    | Users, Portfolios, Holdings, Goals, Subscriptions, Alerts, Watchlists, Audit Logs |
| MongoDB Atlas | Stocks, News, Scores, Chat History, Forecasts, Research, Sector Data, Smart Money |
| Redis         | Live Prices, Sessions, Rate Limits, Cache, Feature Flags                          |

### Rationale

- PostgreSQL: ACID compliance, complex relationships, Prisma ORM
- MongoDB: Flexible schemas for varying data formats, high-volume documents
- Redis: Sub-millisecond reads for live data, TTL caching

### Alternatives Considered

| Option          | Rejected Because                                                                |
| --------------- | ------------------------------------------------------------------------------- |
| PostgreSQL only | Document storage less natural, schema migrations painful for fast-changing data |
| MongoDB only    | Relationships need joins, ACID needed for financial transactions                |
| DynamoDB        | AWS lock-in, overkill for solo dev                                              |

### Consequences

- Three connection pools to manage
- Data sync between PostgreSQL and MongoDB needed for some flows
- Must track which data lives where

---

## ADR-006: Prisma ORM for PostgreSQL

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Need a TypeScript-first ORM for PostgreSQL that's type-safe and developer-friendly.

### Decision

Prisma ORM.

### Rationale

- End-to-end type safety (schema → TypeScript types)
- Excellent migration system
- Declarative schema syntax
- Great DX (Prisma Studio, introspection)
- Strong NestJS integration via `@nestjs/prisma`

### Alternatives Considered

| Option  | Rejected Because                                |
| ------- | ----------------------------------------------- |
| TypeORM | Less type-safe, decorator-based (older pattern) |
| Drizzle | Too new, smaller ecosystem                      |
| Raw SQL | No type safety, more boilerplate                |

### Consequences

- Schema lives in `prisma/schema.prisma`
- Must run `prisma generate` after schema changes
- Migrations via `prisma migrate`

---

## ADR-007: Mongoose for MongoDB

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Need a MongoDB ODM for NestJS that supports schemas and validation.

### Decision

Mongoose via `@nestjs/mongoose`.

### Rationale

- Most popular MongoDB ODM for Node.js
- Schema-based validation
- Excellent NestJS integration
- Good for flexible document schemas

### Consequences

- Schema definitions in Mongoose (separate from Prisma)
- Must keep Prisma and Mongoose schemas in sync where data overlaps

---

## ADR-008: Kafka for Event Streaming

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Need event-driven architecture for real-time data pipeline (stock prices, news, alerts).

### Decision

Apache Kafka (via Docker Compose for local dev).

### Rationale

- Durable event log — no data loss
- Perfect for high-throughput stock price streaming
- Decouples producers and consumers
- Supports replay for debugging

### Alternatives Considered

| Option        | Rejected Because                   |
| ------------- | ---------------------------------- |
| RabbitMQ      | Less durable, no replay capability |
| Redis Streams | Not as robust for event sourcing   |
| AWS SNS/SQS   | Cloud lock-in                      |

### Consequences

- Adds complexity to local dev (Kafka + Zookeeper containers)
- Must manage topics, partitions, consumer groups
- Overkill for initial MVP — can defer Kafka to Phase 2

---

## ADR-009: pgvector for Vector Search

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Need vector search for RAG (Retrieval-Augmented Generation) in AI chat.

### Decision

pgvector (PostgreSQL extension) instead of managed vector databases.

### Rationale

- No separate infrastructure (runs inside PostgreSQL)
- Sufficient for initial scale (millions of vectors)
- Free and open-source
- Good enough performance for our use case

### Consequences

- Must enable pgvector extension in PostgreSQL
- Embedding storage alongside relational data
- May need to migrate to dedicated vector DB at scale (100M+ vectors)

---

## ADR-010: LangGraph for AI Agent Orchestration

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Need multi-agent AI system where agents collaborate (Planner → Stock Agent + Risk Agent + News Agent → Explainability).

### Decision

LangGraph for agent orchestration.

### Rationale

- Mature ecosystem for agent workflows
- Graph-based agent workflows (nodes, edges, state)
- Supports human-in-the-loop
- Checkpointing for long-running agents
- Integrates with major LLM providers

### Consequences

- Python dependency (FastAPI service)
- Learning curve for LangGraph patterns
- Must manage agent state and memory

---

## ADR-011: i18n via API

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Every UI label, value, and explanation must be available in Hindi, English, and Hinglish.

### Decision

All text served through API language service — no hardcoded strings.

### Implementation

- **Frontend:** `@ngx-translate` with JSON translation files
- **Backend:** `nestjs-i18n` for error messages and notifications
- **AI Service:** Language parameter in LLM prompts

### Consequences

- Every component must use translation keys
- Translation files maintained in `packages/config/i18n/`
- Initial load may be slightly slower (fetch translations)

---

## ADR-012: Docker Compose for Local Dev

**Status:** Accepted  
**Date:** July 26, 2026

### Context

Need consistent local development environment with all services.

### Decision

Docker Compose for PostgreSQL, Redis, Kafka, Nginx. App services (NestJS, FastAPI, Angular) run natively for faster dev iteration.

### Rationale

- Database containers ensure consistent state
- Native app services = faster hot-reload
- `docker compose up -d` for infra, `npm run dev` for apps

### Consequences

- Developers need Docker Desktop installed
- Some services (Kafka) easier in Docker than native
- Production deployment will use Docker for all services

---

_These ADRs document all major technology decisions and their rationale._
