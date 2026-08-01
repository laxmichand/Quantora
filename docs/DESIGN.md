# Quantora — Design Document

> **Sections 20–22 of the Enterprise Sprint Template.**
> Covers Scalability, Performance, and Caching Strategy.
>
> **Current state (0.4.3)**: targets below are aspirational; live stack is Supabase PostgreSQL + optional Redis (no MongoDB, no Kafka, no queue yet).

---

## 1. Scalability Design

### Current Scale (Day 1 — 100 Users)

```
100 Users
├── Angular (Vercel CDN)
├── NestJS (1 instance, Render free)
├── FastAPI (1 instance, Render free)
├── Supabase PostgreSQL (managed)
└── Redis (optional, Docker)
Cost: ~₹0/month
```

### 10K Users

```
Load Balancer
├── NestJS x3
├── FastAPI x2
├── Redis (1 instance, managed)
└── Supabase (managed)
Cost: ~$200/month
```

### 100K Users

```
API Gateway
├── Kubernetes
├── Kafka
├── Redis Cluster
├── PostgreSQL Read Replica
└── Supabase Pro
Cost: ~$2,000/month
```

### 1M Users

```
CDN
├── Global Load Balancer
├── Kubernetes (auto-scale)
├── Kafka Cluster
├── Redis Cluster
├── ElasticSearch
├── ClickHouse (analytics)
├── S3 (assets)
└── PostgreSQL Cluster
Cost: ~$20,000/month
```

### What Changes at Each Stage

| Stage      | Infrastructure                                                                                                                 | Code Changes                                                                                 | Cost Est.      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | -------------- |
| 100 Users  | Vercel CDN, Render free (1 instance each), Supabase free, Redis Docker                                                         | Monolithic single instances, no caching layer, no queue                                      | ~₹0/month      |
| 10K Users  | Load balancer, NestJS x3, FastAPI x2, managed Redis, Supabase                                                                  | Add connection pooling, response caching, basic rate limiting, health checks                 | ~$200/month    |
| 100K Users | API Gateway, Kubernetes, Kafka, Redis Cluster, PG read replica, Supabase Pro                                                   | Event-driven async processing, read/write splitting, horizontal scaling, circuit breakers    | ~$2,000/month  |
| 1M Users   | CDN edge, global load balancer, auto-scale Kubernetes, Kafka cluster, Redis cluster, ElasticSearch, ClickHouse, S3, PG cluster | Microservice decomposition, CQRS, event sourcing, analytics offload, asset CDN, multi-region | ~$20,000/month |

---

## 2. Performance Design

### Latency Budget

| Operation    | Target      | Measurement              |
| ------------ | ----------- | ------------------------ |
| Page load    | < 2s        | Lighthouse               |
| API response | < 200ms p95 | APM (Render / New Relic) |
| DB query     | < 50ms p95  | `pg_stat_statements`     |
| AI response  | < 5s p95    | Custom instrumentation   |

### Resource Budget

| Resource  | Target | Current                |
| --------- | ------ | ---------------------- |
| CPU       | < 70%  | Render free tier       |
| Memory    | < 80%  | Render free tier       |
| Storage   | < 80%  | Supabase free (500 MB) |
| Bandwidth | < 70%  | Render free tier       |

### Optimization Strategies

| Area     | Strategy                                                              | Impact                              |
| -------- | --------------------------------------------------------------------- | ----------------------------------- |
| Frontend | Lazy loading modules, tree shaking, code splitting                    | Reduces initial bundle size by ~60% |
| Backend  | Connection pooling (Prisma), query optimization, response compression | Cuts p95 latency by ~40%            |
| AI       | Redis caching for common queries, response streaming                  | Reduces repeat AI calls by ~70%     |
| DB       | Proper indexes, query explain plans, connection pooling               | Keeps queries under 50ms p95        |

---

## 3. Caching Strategy

### Cache Layers

| Layer   | Technology               | TTL     | Invalidation                        |
| ------- | ------------------------ | ------- | ----------------------------------- |
| Browser | Angular HttpClient cache | 5 min   | User action (navigation / refresh)  |
| API     | Redis                    | 15 min  | Data update trigger (write-through) |
| DB      | PostgreSQL query cache   | Default | Write invalidation                  |

### Cache Keys

| Key Pattern               | Data               | TTL    | Invalidation           |
| ------------------------- | ------------------ | ------ | ---------------------- |
| `stock:{symbol}:quote`    | Real-time price    | 60s    | Price update event     |
| `stock:{symbol}:analysis` | AI analysis result | 15 min | New analysis requested |
| `user:{id}:portfolio`     | Portfolio summary  | 5 min  | Holding change         |
| `ai:chat:{session_id}`    | Chat context       | 30 min | Session end            |

### Cache Stampede Prevention

| Mechanism          | Implementation                                                        |
| ------------------ | --------------------------------------------------------------------- |
| Lock               | Redis `SETNX` with TTL — only one process refreshes a key at a time   |
| Background refresh | Proactively refresh cache before TTL expiry (stale-while-revalidate)  |
| Fallback           | Serve stale data on cache miss / backend failure — degrade gracefully |
