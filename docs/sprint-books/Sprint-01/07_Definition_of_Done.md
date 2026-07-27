# Quantora — Definition of Done

> **Document ID:** QDD-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## 1. Story-Level Definition of Done

A user story is **Done** when ALL of the following are true:

### Code Quality
- [ ] Code follows coding standards (`06_Coding_Standards.md`)
- [ ] No `any` types (TypeScript) or `Any` (Python)
- [ ] No hardcoded strings — all text through i18n
- [ ] No `console.log` or `print` debug statements left
- [ ] No commented-out code
- [ ] Error handling implemented with specific exceptions
- [ ] Input validation on all API endpoints

### Testing
- [ ] Unit tests written and passing (>80% coverage for new code)
- [ ] Integration tests written for API endpoints
- [ ] E2E tests written for critical user flows
- [ ] Edge cases tested (empty states, errors, loading)

### API
- [ ] OpenAPI/Swagger documentation complete
- [ ] Request/response DTOs validated
- [ ] Rate limiting configured
- [ ] Authentication/authorization enforced where required

### Frontend
- [ ] Responsive on mobile, tablet, desktop
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Accessibility (WCAG 2.1 AA) — keyboard navigation, screen reader support
- [ ] Works in Hindi and English

### Database
- [ ] Prisma schema updated (if applicable)
- [ ] Migrations created and tested
- [ ] Indexes added for query performance
- [ ] Seed data updated (if applicable)

### Documentation
- [ ] API docs updated (Swagger)
- [ ] README updated (if setup changes)
- [ ] Inline comments for complex logic only

---

## 2. Sprint-Level Definition of Done

A sprint is **Done** when ALL of the following are true:

### All Stories Complete
- [ ] Every story in the sprint meets Story-Level DoD
- [ ] No known bugs remaining (or documented with severity)

### Code Review
- [ ] All PRs reviewed (self-review for solo dev — check against standards)
- [ ] No merge conflicts
- [ ] Branch deleted after merge

### CI/CD
- [ ] CI pipeline passes (lint, build, test)
- [ ] No failing tests
- [ ] No lint errors

### Documentation
- [ ] Sprint documentation complete
- [ ] API documentation current
- [ ] Architecture diagrams updated (if changed)

### Deployment
- [ ] `docker compose up -d` works with new changes
- [ ] All health checks pass
- [ ] Seed script works
- [ ] No environment variable issues

---

## 3. Release-Level Definition of Done

A release is **Done** when ALL of the following are true:

### All Sprints Complete
- [ ] All sprints in the release meet Sprint-Level DoD

### Quality
- [ ] No P0/P1 bugs open
- [ ] Performance benchmarks met (API <200ms p95, page load <2s)
- [ ] Security review complete
- [ ] No secrets in codebase

### Infrastructure
- [ ] Docker Compose tested on fresh machine
- [ ] Database migrations reversible
- [ ] Rollback plan documented

### Documentation
- [ ] User-facing documentation complete
- [ ] API documentation published
- [ ] Deployment guide current

---

## 4. Bug Severity Levels

| Severity | Description | Fix Timeline |
|----------|-------------|--------------|
| **P0 — Critical** | System down, data loss, security breach | Fix immediately |
| **P1 — High** | Major feature broken, no workaround | Fix within 24 hours |
| **P2 — Medium** | Feature degraded, workaround exists | Fix within current sprint |
| **P3 — Low** | Minor issue, cosmetic | Fix when convenient |

---

## 5. Code Review Checklist (Solo Dev)

Since this is a solo project, code review is self-review against this checklist:

- [ ] Does the code do what the story requires?
- [ ] Is it the simplest solution that works?
- [ ] Would I understand this code in 6 months?
- [ ] Are there any security issues?
- [ ] Are there any performance concerns?
- [ ] Does it follow the coding standards?
- [ ] Are errors handled gracefully?
- [ ] Is it tested adequately?

---

*Every story, sprint, and release must meet these criteria before being considered Done.*
