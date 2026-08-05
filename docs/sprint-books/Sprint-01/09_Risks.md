# Quantora — Risk Register

> **Document ID:** QR-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## 1. Risk Matrix

| #   | Risk                                          | Probability | Impact   | Severity     | Mitigation                                                          |
| --- | --------------------------------------------- | ----------- | -------- | ------------ | ------------------------------------------------------------------- |
| R1  | Data source (NSE/Yahoo) blocks API access     | Medium      | High     | **High**     | Multiple fallback sources, respect rate limits, cache aggressively  |
| R2  | AI hallucination in financial explanations    | High        | High     | **Critical** | Confidence thresholds, disclaimers, human review layer              |
| R3  | MongoDB Atlas free tier limit exceeded        | Medium      | Medium   | **Medium**   | Monitor usage, optimize queries, upgrade path planned               |
| R4  | LLM API costs exceed budget                   | Medium      | High     | **High**     | Cache responses, use smaller models for simple tasks, budget alerts |
| R5  | Solo developer burnout                        | High        | High     | **Critical** | Realistic timeline, take breaks, celebrate milestones               |
| R6  | Regulatory change (SEBI/DPDP Act)             | Low         | High     | **Medium**   | Modular compliance layer, legal monitoring, disclaimers             |
| R7  | Scope creep (20 modules is massive)           | High        | Medium   | **High**     | Strict prioritization, MVP first, say no to features                |
| R8  | Security breach (user data)                   | Low         | Critical | **High**     | bcrypt, JWT, HTTPS, input validation, audit logs                    |
| R9  | PostgreSQL/MongoDB sync issues                | Medium      | Medium   | **Medium**   | Clear data ownership per DB, idempotent operations                  |
| R10 | Kafka complexity for solo dev                 | Medium      | Low      | **Low**      | Defer Kafka to Phase 2, use Redis pub/sub initially                 |
| R11 | User trust (AI giving wrong financial advice) | Medium      | High     | **High**     | Clear disclaimers, never say "buy/sell", only "analysis"            |
| R12 | Low user adoption                             | Medium      | High     | **High**     | Focus on one killer feature, SEO, content marketing                 |
| R13 | Angular learning curve                        | Low         | Medium   | **Low**      | Follow official docs, use Angular Material patterns                 |
| R14 | Prisma schema migrations break data           | Low         | High     | **Medium**   | Test migrations on copy of data, rollback plan                      |
| R15 | LLM response latency too slow                 | Medium      | Medium   | **Medium**   | Stream responses, cache, use faster models                          |

---

## 2. Critical Risks (Deep Dive)

### R2: AI Hallucination

**Description:** AI generates incorrect financial analysis or gives wrong stock recommendations.

**Impact:** Users lose money, legal liability, reputation damage.

**Mitigation:**

1. Every AI response includes confidence score
2. Never use language like "buy" or "sell" — only "analysis" and "information"
3. Clear disclaimer: "This is not investment advice"
4. Factual data (prices, ratios) pulled from verified sources, not generated
5. AI explains its reasoning (chain-of-thought) for auditability

### R5: Solo Developer Burnout

**Description:** Trying to build 20 modules alone leads to exhaustion and project abandonment.

**Impact:** Project fails.

**Mitigation:**

1. Realistic 16-month timeline (not 6 months)
2. Phase-based approach — MVP in Month 2, then iterate
3. Take 1 day off per week minimum
4. Celebrate small wins (each sprint completion)
5. If needed, defer P2/P3 modules indefinitely

### R7: Scope Creep

**Description:** 20 modules is already massive. Adding more features delays launch.

**Impact:** Never ship anything.

**Mitigation:**

1. MVP = Module 1 (Data) + Module 9 (Portfolio Upload) + Module 2 (AI Scores) + Auth
2. Ship MVP at Month 2, get feedback
3. Only build modules that users actually use
4. "No" is a complete sentence for feature requests

---

## 3. Risk Response Plan

| Severity     | Response                                    |
| ------------ | ------------------------------------------- |
| **Critical** | Active mitigation required. Review weekly.  |
| **High**     | Mitigation plan in place. Review bi-weekly. |
| **Medium**   | Monitor. Plan B ready. Review monthly.      |
| **Low**      | Accept. Note for future reference.          |

---

## 4. Risk Owners

| Risk   | Owner        | Action                                |
| ------ | ------------ | ------------------------------------- |
| R1-R15 | Laxmichandra | Monitor, mitigate, escalate if needed |

---

## 5. Risk Review Schedule

| Frequency  | Action                                        |
| ---------- | --------------------------------------------- |
| Weekly     | Review Critical and High risks                |
| Monthly    | Review all risks, update register             |
| Per Sprint | Check if any sprint work introduces new risks |

---

_This risk register is a living document. Update as new risks emerge._
