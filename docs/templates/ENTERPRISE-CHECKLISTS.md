# Enterprise Checklists

> Reference checklists for every sprint. Copy relevant sections into sprint docs.

---

## API Checklist (Every Endpoint)

```
Authentication
├── [ ] JWT token validated
├── [ ] Token expiry checked
├── [ ] Refresh token flow works
└── [ ] Invalid token returns 401

Authorization
├── [ ] Role-based access checked
├── [ ] Resource ownership verified
├── [ ] Admin-only endpoints protected
└── [ ] Insufficient permissions returns 403

Rate Limiting
├── [ ] Global rate limit set
├── [ ] Per-user rate limit set
├── [ ] Per-endpoint rate limit set
├── [ ] Rate limit headers included
└── [ ] Exceeding limit returns 429

Caching
├── [ ] Cache-Control header set
├── [ ] ETag support
├── [ ] Cache invalidation strategy
├── [ ] Cache stampede prevention
└── [ ] Stale-while-revalidate

Pagination
├── [ ] Cursor-based or offset pagination
├── [ ] Page size limits enforced
├── [ ] Total count included
├── [ ] Next/previous links included
└── [ ] Empty page handled

Sorting
├── [ ] Allowed sort fields defined
├── [ ] Default sort order set
├── [ ] Multi-field sorting supported
└── [ ] Invalid sort field handled

Filtering
├── [ ] Allowed filter fields defined
├── [ ] Filter validation
├── [ ] Combined filters work
└── [ ] Empty filter handled

Resilience
├── [ ] Retry with exponential backoff
├── [ ] Circuit breaker configured
├── [ ] Timeout set (5s default)
├── [ ] Fallback behavior defined
└── [ ] Graceful degradation

Validation
├── [ ] Input validation (Zod/class-validator)
├── [ ] Sanitization (XSS prevention)
├── [ ] Type checking
├── [ ] Required fields enforced
└── [ ] Format validation (email, phone, etc.)

Versioning
├── [ ] API version in URL (/v1/)
├── [ ] Version header supported
├── [ ] Deprecation notices
└── [ ] Backward compatibility

Observability
├── [ ] Request ID propagated
├── [ ] Timing logged
├── [ ] Error details logged
├── [ ] Metrics emitted
└── [ ] Tracing spans created
```

---

## Database Checklist (Every Table)

```
Schema
├── [ ] UUID primary key
├── [ ] created_at (default now())
├── [ ] updated_at (auto-update)
├── [ ] created_by (FK to users)
├── [ ] updated_by (FK to users)
├── [ ] version (integer, default 1)
├── [ ] is_deleted (boolean, default false)
└── [ ] Proper data types

Indexes
├── [ ] Primary key index
├── [ ] Foreign key indexes
├── [ ] Frequently queried columns indexed
├── [ ] Composite indexes for multi-column queries
├── [ ] Partial indexes for filtered queries
└── [ ] Index naming convention: idx_{table}_{columns}

Constraints
├── [ ] NOT NULL where required
├── [ ] UNIQUE constraints
├── [ ] CHECK constraints
├── [ ] Foreign key constraints
├── [ ] Default values set
└── [ ] On delete/update actions defined

Partitioning (when needed)
├── [ ] Partition key identified
├── [ ] Partition method chosen (range/list/hash)
├── [ ] Partition maintenance scheduled
└── [ ] Query routing verified

Archiving
├── [ ] Archive threshold defined
├── [ ] Archive destination
├── [ ] Archive method (move/copy)
├── [ ] Archive retention policy
└── [ ] Archive access method

Backup
├── [ ] Backup frequency (daily minimum)
├── [ ] Backup retention (30 days)
├── [ ] Point-in-time recovery enabled
├── [ ] Backup tested monthly
├── [ ] RPO defined (max data loss)
└── [ ] RTO defined (max downtime)

Security
├── [ ] Column-level encryption (if needed)
├── [ ] Row-level security (if needed)
├── [ ] Audit logging enabled
├── [ ] Access controls documented
└── [ ] Data classification labeled
```

---

## Testing Checklist (Every Feature)

```
Unit Tests
├── [ ] Service methods tested
├── [ ] Controller methods tested
├── [ ] Utility functions tested
├── [ ] Edge cases covered
├── [ ] Error cases covered
├── [ ] Mocks/stubs defined
├── [ ] Coverage >90%
└── [ ] No flaky tests

Integration Tests
├── [ ] Database operations tested
├── [ ] External service mocks
├── [ ] Authentication flow tested
├── [ ] Authorization flow tested
├── [ ] Error propagation tested
└── [ ] Cleanup after tests

API Tests
├── [ ] All endpoints tested
├── [ ] Request validation tested
├── [ ] Response format verified
├── [ ] Status codes correct
├── [ ] Headers correct
├── [ ] Content-Type correct
└── [ ] Error responses tested

Contract Tests
├── [ ] OpenAPI schema valid
├── [ ] Request schema matches
├── [ ] Response schema matches
├── [ ] Breaking changes detected
└── [ ] Consumer/provider aligned

E2E Tests
├── [ ] Critical user flows tested
├── [ ] Cross-browser tested
├── [ ] Responsive design tested
├── [ ] Accessibility tested
├── [ ] Performance budgets met
└── [ ] Error states handled

Load Tests
├── [ ] Normal load baseline
├── [ ] Peak load tested
├── [ ] Stress test performed
├── [ ] Soak test (extended duration)
├── [ ] Spike test performed
└── [ ] Performance thresholds met

Security Tests
├── [ ] SQL injection tested
├── [ ] XSS tested
├── [ ] CSRF tested
├── [ ] Authentication bypass tested
├── [ ] Authorization bypass tested
├── [ ] Rate limiting tested
├── [ ] Input validation tested
└── [ ] Secrets not in code

Chaos Tests
├── [ ] Database failure handled
├── [ ] Redis failure handled
├── [ ] AI service failure handled
├── [ ] Network timeout handled
├── [ ] Partial failure handled
└── [ ] Recovery tested

Accessibility Tests
├── [ ] Keyboard navigation
├── [ ] Screen reader compatible
├── [ ] Color contrast (4.5:1)
├── [ ] Focus indicators
├── [ ] ARIA labels
└── [ ] Error announcements
```

---

## AI Feature Checklist

```
Prompt Engineering
├── [ ] Prompt template documented
├── [ ] Variables identified
├── [ ] Examples provided (few-shot)
├── [ ] Output format defined
├── [ ] Constraints specified
├── [ ] Prompt versioned (v1, v2, ...)
└── [ ] Prompt tested with diverse inputs

Model Selection
├── [ ] Primary model chosen
├── [ ] Fallback model defined
├── [ ] Model capabilities matched to use case
├── [ ] Cost per request estimated
├── [ ] Latency requirements met
└── [ ] Token limits considered

Cost Management
├── [ ] Input tokens estimated
├── [ ] Output tokens estimated
├── [ ] Daily cost estimated
├── [ ] Monthly budget set
├── [ ] Cost alerts configured
└── [ ] Token usage logged

Safety & Guardrails
├── [ ] Input sanitization
├── [ ] Output filtering
├── [ ] Toxicity check
├── [ ] PII detection
├── [ ] Hallucination detection
├── [ ] Fact verification (where possible)
└── [ ] Fallback to safe response on failure

Evaluation
├── [ ] Test dataset created
├── [ ] Baseline metrics recorded
├── [ ] Accuracy measured
├── [ ] Relevance measured
├── [ ] Safety measured
├── [ ] Latency measured
└── [ ] Regression tests pass

Caching
├── [ ] Cache key strategy defined
├── [ ] Cache TTL set
├── [ ] Similar query detection
├── [ ] Cache invalidation plan
└── [ ] Cache hit rate target

Feedback Loop
├── [ ] User feedback UI (thumbs up/down)
├── [ ] Feedback storage
├── [ ] Feedback analysis process
├── [ ] Prompt improvement cycle
└── [ ] Model fine-tuning plan

Monitoring
├── [ ] Request count logged
├── [ ] Latency tracked
├── [ ] Error rate monitored
├── [ ] Token usage tracked
├── [ ] Cost tracked
├── [ ] Quality score tracked
└── [ ] Dashboard created

A/B Testing
├── [ ] Experiment defined
├── [ ] Control vs variant
├── [ ] Success metric defined
├── [ ] Sample size calculated
├── [ ] Duration set
├── [ ] Statistical significance threshold
└── [ ] Rollback plan

Explainability
├── [ ] Confidence score shown
├── [ ] Reasoning provided (where applicable)
├── [ ] Source cited (where applicable)
├── [ ] Uncertainty indicated
└── [ ] User can request clarification
```

---

## Scalability Checklist

```
Day 1 (100 Users)
├── [ ] Single server deployment
├── [ ] Managed database (Supabase)
├── [ ] Single Redis instance
├── [ ] No message queue needed
├── [ ] Cost: ~$50/month
└── [ ] Monitoring: basic health checks

10K Users
├── [ ] Load balancer added
├── [ ] App scaled to 3 instances
├── [ ] Redis vertical scaled
├── [ ] Read replica considered
├── [ ] CDN for static assets
├── [ ] Cost: ~$200/month
└── [ ] Monitoring: APM + alerts

100K Users
├── [ ] Kubernetes migration
├── [ ] Auto-scaling configured
├── [ ] Kafka for event processing
├── [ ] Redis cluster (3+ nodes)
├── [ ] PostgreSQL read replicas
├── [ ] Connection pooling (PgBouncer)
├── [ ] Cost: ~$2,000/month
└── [ ] Monitoring: full observability

1M Users
├── [ ] Global load balancer
├── [ ] Multi-region deployment
├── [ ] Kafka cluster
├── [ ] ElasticSearch for search
├── [ ] ClickHouse for analytics
├── [ ] S3 for assets
├── [ ] PostgreSQL cluster + sharding
├── [ ] CDN with edge caching
├── [ ] Cost: ~$20,000/month
└── [ ] Monitoring: full stack + business metrics
```

---

## Security Checklist

```
Authentication
├── [ ] JWT with short expiry (15min)
├── [ ] Refresh token rotation
├── [ ] Secure token storage (httpOnly cookie)
├── [ ] Password hashing (bcrypt/argon2)
├── [ ] MFA support (future)
├── [ ] Account lockout after failures
└── [ ] Session management

Authorization
├── [ ] RBAC implemented
├── [ ] Resource-level permissions
├── [ ] API-level permissions
├── [ ] Admin role separated
└── [ ] Permission inheritance

Input Validation
├── [ ] Server-side validation
├── [ ] Client-side validation (UX only)
├── [ ] SQL injection prevention (Prisma)
├── [ ] XSS prevention (sanitization)
├── [ ] File upload validation
└── [ ] Request size limits

Transport Security
├── [ ] HTTPS enforced
├── [ ] HSTS header
├── [ ] TLS 1.3
└── [ ] Certificate rotation

Headers Security
├── [ ] Content-Security-Policy
├── [ ] X-Frame-Options: DENY
├── [ ] X-Content-Type-Options: nosniff
├── [ ] X-XSS-Protection
├── [ ] Referrer-Policy
└── [ ] Permissions-Policy

Secrets Management
├── [ ] No secrets in code
├── [ ] .env files gitignored
├── [ ] Secrets in vault (production)
├── [ ] Secret rotation schedule
└── [ ] Access audit trail

Dependencies
├── [ ] Dependencies scanned (npm audit)
├── [ ] No known vulnerabilities
├── [ ] Dependencies pinned
└── [ ] Regular updates scheduled

Audit Logging
├── [ ] Auth events logged
├── [ ] Data mutations logged
├── [ ] Admin actions logged
├── [ ] Log retention defined
└── [ ] Log integrity protected
```

---

## Performance Checklist

```
Frontend
├── [ ] First Contentful Paint <1.5s
├── [ ] Largest Contentful Paint <2.5s
├── [ ] Cumulative Layout Shift <0.1
├── [ ] First Input Delay <100ms
├── [ ] Time to Interactive <3s
├── [ ] Bundle size <250KB (initial)
├── [ ] Image optimization (WebP/AVIF)
├── [ ] Lazy loading implemented
└── [ ] Service worker (offline support)

Backend
├── [ ] API response <200ms (p95)
├── [ ] Database query <50ms (p95)
├── [ ] Connection pooling configured
├── [ ] N+1 queries eliminated
├── [ ] Eager/lazy loading optimized
├── [ ] Pagination implemented
└── [ ] Compression enabled (gzip/brotli)

AI Service
├── [ ] Response <5s (p95)
├── [ ] Streaming implemented
├── [ ] Token limits enforced
├── [ ] Caching for common queries
├── [ ] Fallback on timeout
└── [ ] Background processing for heavy ops

Infrastructure
├── [ ] CPU <70% average
├── [ ] Memory <80% average
├── [ ] Disk <80% usage
├── [ ] Network bandwidth monitored
├── [ ] Auto-scaling configured
└── [ ] Resource limits set
```

---

*Checklists Version: 1.0*
*Last Updated: 2026-07-26*
