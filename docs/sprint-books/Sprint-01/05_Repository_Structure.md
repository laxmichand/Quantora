# Quantora — Repository Structure

> **Document ID:** QRS-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## 1. Top-Level Structure

```
Quantora/
├── apps/
│   ├── api-nest/              # NestJS Backend API
│   ├── ai-fastapi/            # Python FastAPI AI Service
│   └── web-angular/           # Angular Frontend
│
├── packages/
│   ├── shared-types/          # TypeScript shared types
│   ├── api-client/            # Generated API client (OpenAPI)
│   ├── config/                # Shared config (i18n, env, constants)
│   └── utils/                 # Shared utilities
│
├── infrastructure/
│   ├── docker/                # Dockerfiles per service
│   ├── nginx/                 # Nginx reverse proxy config
│   ├── postgres/              # Init scripts, extensions
│   ├── redis/                 # Redis config
│   └── kafka/                 # Kafka topic definitions
│
├── docs/
│   ├── Sprint-01/             # Foundation documentation
│   ├── api/                   # API documentation
│   └── guides/                # Developer guides
│
├── .github/
│   └── workflows/             # CI/CD pipelines
│
├── docker-compose.yml         # Docker Compose for local dev
├── package.json               # Root workspace config
├── turbo.json                 # Turborepo config
├── .env                       # Root environment variables
├── .env.example               # Template for .env
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier config
├── .eslintrc.js               # ESLint config
├── tsconfig.base.json         # Base TypeScript config
└── README.md                  # Project README
```

---

## 2. NestJS Backend (`apps/api-nest/`)

```
apps/api-nest/
├── src/
│   ├── main.ts                    # App bootstrap
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller
│   ├── app.service.ts             # Root service
│   │
│   ├── common/                    # Shared utilities
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth, role, rate-limit guards
│   │   ├── interceptors/          # Logging, transform interceptors
│   │   ├── pipes/                 # Validation pipes
│   │   ├── decorators/            # Custom decorators
│   │   └── interfaces/            # Shared interfaces
│   │
│   ├── config/                    # Configuration
│   │   ├── database.config.ts     # Prisma + Mongoose config
│   │   ├── redis.config.ts        # Redis config
│   │   ├── kafka.config.ts        # Kafka config
│   │   └── app.config.ts          # App-level config
│   │
│   ├── modules/
│   │   ├── auth/                  # Authentication & authorization
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── dto/
│   │   │
│   │   ├── users/                 # User management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── portfolios/            # Portfolio management
│   │   │   ├── portfolios.module.ts
│   │   │   ├── portfolios.controller.ts
│   │   │   ├── portfolios.service.ts
│   │   │   ├── holdings.controller.ts
│   │   │   ├── holdings.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── goals/                 # Goal planner
│   │   ├── alerts/                # Price/notification alerts
│   │   ├── watchlists/            # User watchlists
│   │   ├── subscriptions/         # Plan management
│   │   ├── stocks/                # Stock data (reads from MongoDB)
│   │   ├── news/                  # News data (reads from MongoDB)
│   │   ├── scores/                # AI scores (reads from MongoDB)
│   │   ├── chat/                  # AI chat interface
│   │   ├── notifications/         # Notification service
│   │   ├── i18n/                  # Language service
│   │   ├── audit/                 # Audit logging
│   │   └── health/                # Health checks
│   │
│   └── prisma/
│       └── schema.prisma          # Prisma schema
│
├── test/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── e2e/                       # E2E tests
│
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── .env
└── Dockerfile
```

---

## 3. FastAPI AI Service (`apps/ai-fastapi/`)

```
apps/ai-fastapi/
├── app/
│   ├── main.py                    # FastAPI app bootstrap
│   ├── config.py                  # Configuration
│   ├── dependencies.py            # Dependency injection
│   │
│   ├── api/
│   │   ├── v1/
│   │   │   ├── router.py          # API router
│   │   │   ├── stocks.py          # Stock analysis endpoints
│   │   │   ├── risk.py            # Risk calculation endpoints
│   │   │   ├── scores.py          # Scoring endpoints
│   │   │   ├── news.py            # News analysis endpoints
│   │   │   ├── forecasts.py       # Forecast endpoints
│   │   │   ├── chat.py            # AI chat endpoints
│   │   │   ├── technical.py       # Technical analysis endpoints
│   │   │   └── research.py        # Research report endpoints
│   │   └── deps.py                # Shared dependencies
│   │
│   ├── services/
│   │   ├── scoring/               # AI scoring engine
│   │   │   ├── ai_scorer.py
│   │   │   ├── value_scorer.py
│   │   │   ├── growth_scorer.py
│   │   │   ├── quality_scorer.py
│   │   │   ├── risk_scorer.py
│   │   │   ├── technical_scorer.py
│   │   │   └── momentum_scorer.py
│   │   │
│   │   ├── risk/                  # Risk analytics
│   │   │   ├── var_calculator.py
│   │   │   ├── portfolio_risk.py
│   │   │   ├── stress_test.py
│   │   │   └── correlation.py
│   │   │
│   │   ├── forecasting/           # Price forecasting
│   │   │   ├── price_forecaster.py
│   │   │   ├── earnings_forecaster.py
│   │   │   └── ensemble.py
│   │   │
│   │   ├── news/                  # News processing
│   │   │   ├── sentiment.py
│   │   │   ├── summarizer.py
│   │   │   └── impact_assessor.py
│   │   │
│   │   ├── technical/             # Technical analysis
│   │   │   ├── pattern_detector.py
│   │   │   ├── indicators.py
│   │   │   └── support_resistance.py
│   │   │
│   │   ├── llm/                   # LLM integration
│   │   │   ├── openai_client.py
│   │   │   ├── anthropic_client.py
│   │   │   └── prompts.py
│   │   │
│   │   └── agents/                # LangGraph agents
│   │       ├── orchestrator.py
│   │       ├── stock_agent.py
│   │       ├── risk_agent.py
│   │       ├── news_agent.py
│   │       ├── forecast_agent.py
│   │       ├── tax_agent.py
│   │       └── explainability_agent.py
│   │
│   ├── models/                    # Pydantic models
│   │   ├── request/
│   │   └── response/
│   │
│   └── utils/
│       ├── data_fetcher.py        # External API fetchers
│       ├── calculations.py        # Financial calculations
│       └── helpers.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
│
├── requirements.txt
├── pyproject.toml
├── .env
├── Dockerfile
└── alembic/                       # DB migrations (if needed)
```

---

## 4. Angular Frontend (`apps/web-angular/`)

```
apps/web-angular/
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── index.html                 # Entry HTML
│   ├── styles.scss                # Global styles
│   ├── environments/              # Environment configs
│   │
│   ├── app/
│   │   ├── app.module.ts          # Root module
│   │   ├── app.component.ts       # Root component
│   │   ├── app-routing.module.ts  # Routing
│   │   │
│   │   ├── core/                  # Singleton services
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── theme.service.ts
│   │   │   │   ├── language.service.ts
│   │   │   │   └── websocket.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   └── models/
│   │   │
│   │   ├── shared/                # Reusable components
│   │   │   ├── components/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── toolbar/
│   │   │   │   ├── stock-card/
│   │   │   │   ├── score-badge/
│   │   │   │   ├── chart/
│   │   │   │   └── loading/
│   │   │   ├── directives/
│   │   │   └── pipes/
│   │   │
│   │   └── features/              # Feature modules
│   │       ├── dashboard/
│   │       │   ├── dashboard.component.ts
│   │       │   ├── dashboard.module.ts
│   │       │   └── dashboard-routing.module.ts
│   │       │
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   ├── register/
│   │       │   └── auth.module.ts
│   │       │
│   │       ├── stocks/
│   │       │   ├── stock-list/
│   │       │   ├── stock-detail/
│   │       │   ├── stock-scores/
│   │       │   └── stocks.module.ts
│   │       │
│   │       ├── portfolio/
│   │       │   ├── portfolio-upload/
│   │       │   ├── portfolio-health/
│   │       │   ├── holdings/
│   │       │   └── portfolio.module.ts
│   │       │
│   │       ├── chat/
│   │       │   ├── chat-window/
│   │       │   ├── chat-input/
│   │       │   └── chat.module.ts
│   │       │
│   │       ├── goals/
│   │       │   ├── goal-list/
│   │       │   ├── goal-create/
│   │       │   └── goals.module.ts
│   │       │
│   │       ├── news/
│   │       ├── alerts/
│   │       ├── learning/
│   │       ├── community/
│   │       └── admin/
│   │
│   └── assets/
│       ├── i18n/
│       │   ├── en.json
│       │   ├── hi.json
│       │   └── hi-en.json
│       ├── images/
│       └── icons/
│
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── package.json
├── .editorconfig
└── Dockerfile
```

---

## 5. Packages (`packages/`)

```
packages/
├── shared-types/
│   ├── src/
│   │   ├── index.ts
│   │   ├── user.types.ts
│   │   ├── portfolio.types.ts
│   │   ├── stock.types.ts
│   │   ├── score.types.ts
│   │   ├── news.types.ts
│   │   ├── chat.types.ts
│   │   ├── goal.types.ts
│   │   └── api.types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── api-client/
│   ├── src/
│   │   └── generated/             # Generated from OpenAPI spec
│   ├── openapi.json               # NestJS Swagger export
│   ├── package.json
│   └── tsconfig.json
│
├── config/
│   ├── src/
│   │   ├── index.ts
│   │   ├── constants.ts
│   │   ├── i18n/
│   │   │   ├── en.json
│   │   │   ├── hi.json
│   │   │   └── hi-en.json
│   │   └── env.ts
│   ├── package.json
│   └── tsconfig.json
│
└── utils/
    ├── src/
    │   ├── index.ts
    │   ├── formatters.ts
    │   ├── validators.ts
    │   ├── calculations.ts
    │   └── date.ts
    ├── package.json
    └── tsconfig.json
```

---

## 6. Infrastructure (`infrastructure/`)

```
infrastructure/
├── docker/
│   ├── Dockerfile.api-nest        # NestJS Dockerfile
│   ├── Dockerfile.ai-fastapi      # FastAPI Dockerfile
│   └── Dockerfile.web-angular     # Angular Dockerfile (nginx)
│
├── nginx/
│   ├── nginx.conf                 # Nginx config
│   └── ssl/                       # SSL certs (dev)
│
├── postgres/
│   ├── init.sql                   # Init script
│   └── extensions.sql             # pgvector extension
│
├── redis/
│   └── redis.conf                 # Redis config
│
└── kafka/
    └── topics.json                # Topic definitions
```

---

_This structure scales with the project. New modules go in `apps/*/modules/` and new features in `apps/web-angular/src/app/features/`._
