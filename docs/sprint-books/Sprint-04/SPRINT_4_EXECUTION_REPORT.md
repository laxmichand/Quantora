# Sprint 4 — Execution Report

> **Sprint:** 4 — Full Stack Version Upgrade
> **Date:** July 29, 2026
> **Status:** Complete
> **Duration:** 1 day

---

## Sprint Goal

> Upgrade the entire project stack to latest stable major versions: Node 24, Angular 22, NestJS 11, TypeScript 6, Prisma 6, and all supporting packages. Fix all compatibility regressions. Ensure both apps build cleanly.

**Goal Met:** Yes

---

## Tasks Completed (8/8)

| #   | Task                                                         | Status | Notes                                                                      |
| --- | ------------------------------------------------------------ | ------ | -------------------------------------------------------------------------- |
| 4.1 | Switch Node.js from 22 → 24 (Homebrew keg-only)              | Done   | PATH fix in `.zprofile` + `.zshrc`                                         |
| 4.2 | Upgrade Angular 19.2 → 22.0 (core, cli, material, cdk)       | Done   | `@angular-devkit/build-angular` → `@angular/build`                         |
| 4.3 | Upgrade NestJS 10.4 → 11.1 (common, core, swagger, terminus) | Done   | All 7 NestJS packages updated                                              |
| 4.4 | Upgrade TypeScript 5.7 → 6.0.3                               | Done   | Fixed moduleResolution, deprecated flags                                   |
| 4.5 | Upgrade Prisma 5.22 → 6.19.3                                 | Done   | Client generated successfully                                              |
| 4.6 | Upgrade zone.js 0.15 → 0.16, other deps                      | Done   | rxjs, eslint, typescript-eslint, @types/*                                  |
| 4.7 | Fix TS 6.0 breaking changes                                  | Done   | skipLibCheck, ignoreDeprecations, catch(err: unknown), cookieParser import |
| 4.8 | Verify both apps build via turbo                             | Done   | Angular + NestJS both pass                                                 |

---

## Version Changes

| Package         | Before                          | After              |
| --------------- | ------------------------------- | ------------------ |
| Node.js         | 22.23.1 (Hermes)                | 24.18.0 (Homebrew) |
| npm             | 10.9.8                          | 11.3.0             |
| Angular         | 19.2.x                          | 22.0.8             |
| NestJS          | 10.4.x                          | 11.1.28            |
| TypeScript      | 5.7 / 5.4                       | 6.0.3              |
| Prisma          | 5.22.0                          | 6.19.3             |
| zone.js         | 0.15                            | 0.16               |
| Angular builder | `@angular-devkit/build-angular` | `@angular/build`   |

---

## Fixes Applied

| Issue                                                                    | Fix                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `moduleResolution: "node"` incompatible with Angular 22 Material exports | Changed to `"bundler"`                                          |
| `@angular/core` not resolvable from hoisted `@ngx-translate/core`        | Enabled `skipLibCheck: true`                                    |
| `baseUrl` / `downlevelIteration` deprecated in TS 6.0                    | Added `ignoreDeprecations: "6.0"`, removed `downlevelIteration` |
| `err` / `error` typed as `unknown` in catch blocks                       | Added `(err as Error)` casts                                    |
| `cookieParser` namespace import not callable                             | Changed to default import                                       |
| DTO strict property initialization errors                                | Added `strictPropertyInitialization: false`                     |

---

## Sprint Numbering Change

This version upgrade sprint is **Sprint 4**. All future sprints from the previous backlog have been shifted by +1:

- Old Sprint 4 (Live stock prices, etc.) → **Sprint 5**
- Old Sprint 5 (Portfolio CRUD, etc.) → **Sprint 6**
- Old Sprint 6 (AI scoring) → **Sprint 7**
- Old Sprint 7 → Sprint 8
- Old Sprint 8 → Sprint 9
- …and so on

---

## What's Next (Sprint 5)

| Item                            | Priority |
| ------------------------------- | -------- |
| Live stock prices from yfinance | P0       |
| Historical price data           | P1       |
| Stock detail page               | P1       |

---

## Key Metrics

| Metric               | Value                  |
| -------------------- | ---------------------- |
| Packages upgraded    | 20+                    |
| Build time (Angular) | ~5s                    |
| Build time (NestJS)  | ~2s                    |
| Total errors fixed   | 14 (TS) + build config |
| Files modified       | 8                      |

---

_Sprint 4 completed on July 29, 2026._
