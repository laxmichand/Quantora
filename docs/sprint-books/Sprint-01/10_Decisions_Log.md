# Quantora — Decisions Log

> **Document ID:** QDL-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## Purpose

This log records all significant project decisions, their context, and rationale. It serves as the historical record of why things were built the way they were.

---

## Decisions

| # | Date | Decision | Context | Rationale | Status |
|---|------|----------|---------|-----------|--------|
| D1 | Jul 26, 2026 | Project named "FinOS" | Starting new fintech platform | Financial Operating System concept | Superseded (D2) |
| D2 | Jul 26, 2026 | Renamed to "Quantora" | FinOS sounds like an OS, not a product | "Quant" (quantitative) + "ora" (time/aura) — modern, brandable | Accepted |
| D3 | Jul 26, 2026 | Tech stack: Angular + NestJS + FastAPI | Need frontend, backend, AI service | Angular for opinionated SPA, NestJS for structured backend, FastAPI for Python ML ecosystem | Accepted |
| D4 | Jul 26, 2026 | 3 databases: PostgreSQL + MongoDB + Redis | Different data types have different needs | PostgreSQL for ACID/relations, MongoDB for flexible docs, Redis for cache/speed | Accepted |
| D5 | Jul 26, 2026 | Prisma ORM for PostgreSQL | Need TypeScript-first ORM | End-to-end type safety, great DX, strong NestJS integration | Accepted |
| D6 | Jul 26, 2026 | Mongoose for MongoDB | Need MongoDB ODM for NestJS | Most popular, schema validation, excellent NestJS integration | Accepted |
| D7 | Jul 26, 2026 | Monorepo with Turborepo | Multiple apps + shared code | Single install, shared configs, Turborepo caching | Accepted |
| D8 | Jul 26, 2026 | Kafka for event streaming | Real-time data pipeline needed | Durable log, replay, high throughput for stock prices | Accepted |
| D9 | Jul 26, 2026 | pgvector for vector search | RAG for AI chat | No separate infra, runs in PostgreSQL, sufficient for initial scale | Accepted |
| D10 | Jul 26, 2026 | LangGraph for AI agents | Multi-agent AI workflows | Graph-based orchestration, checkpointing, LLM integration | Accepted |
| D11 | Jul 26, 2026 | i18n via API (no hardcoded text) | Hindi/English/Hinglish support | Every label through translation service for consistency | Accepted |
| D12 | Jul 26, 2026 | Solo developer project | One person building this | All planning realistic for one person, no team coordination | Accepted |
| D13 | Jul 26, 2026 | 16-month timeline (7 phases) | 20 modules is massive | Phase-based approach, MVP first, iterate | Accepted |
| D14 | Jul 26, 2026 | Sprint 1 = Documentation only (2-3 days) | Need engineering foundation before code | 10 foundational docs before any implementation | Accepted |
| D15 | Jul 26, 2026 | Tagline: "Intelligent Investing. Simplified." | Brand identity | Clear value proposition, speaks to target audience | Accepted |
| D16 | Jul 26, 2026 | MongoDB Atlas for cloud DB | Need managed MongoDB | Free/current tier, no self-hosting, easy scaling | Accepted |
| D17 | Jul 26, 2026 | Nginx reverse proxy | Route traffic to services | `/api` → NestJS, `/ai` → FastAPI, static → Angular | Accepted |
| D18 | Jul 26, 2026 | Docker Compose for local dev | Consistent dev environment | Databases in containers, apps run natively for fast reload | Accepted |
| D19 | Jul 26, 2026 | JWT + Refresh Token auth | Need stateless auth | JWT for API auth, refresh tokens for UX | Accepted |
| D20 | Jul 26, 2026 | bcrypt (12 rounds) for passwords | Need password hashing | Industry standard, good balance of security and performance | Accepted |

---

## Decisions Deferred

| # | Topic | Deferred To | Reason |
|---|-------|-------------|--------|
| DD1 | Specific LLM provider selection | Sprint 5 (AI Chat) | Not needed until AI features |
| DD2 | Kubernetes vs Docker Compose for prod | Sprint 12 | Too early, Docker sufficient for now |
| DD3 | Mobile app (React Native / Flutter) | Post-V1 | Web first, mobile later |
| DD4 | Specific charting library | Sprint 3 (Stock Data) | Not needed until charts |
| DD5 | Payment gateway (Razorpay vs Stripe) | Sprint 9 (Subscriptions) | Not needed until paid features |

---

## Overruled Decisions

| # | Original Decision | New Decision | Reason for Change |
|---|-------------------|-------------|-------------------|
| OD1 | Sprint 1 = Auth + Security | Sprint 1 = Documentation only | Staff engineer feedback: foundation first, code second |
| OD2 | MongoDB as primary DB | PostgreSQL as primary (relational) | Need ACID for financial transactions |
| OD3 | Mongoose for PostgreSQL | Prisma for PostgreSQL | Type safety, modern DX |
| OD4 | CRUD-first modules | Domain-first modules | Better separation, scalability |

---

*This log is append-only. Never delete or modify past decisions. Add new entries at the bottom.*
