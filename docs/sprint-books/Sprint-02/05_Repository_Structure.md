# Sprint 2 — Repository Structure

> **Document ID:** QRS-002
> **Version:** 1.0
> **Date:** July 26-27, 2026
> **Status:** Complete ✅

---

## 1. Files Created/Modified This Sprint

```
apps/api-nest/prisma/schema.prisma          # Updated: User, RefreshToken, AuditLog, UserPreference + all other models
apps/api-nest/src/main.ts                    # Swagger, CORS, ValidationPipe, LoggingInterceptor
apps/api-nest/src/app.module.ts              # Global guards, interceptors, filters
apps/api-nest/src/app.controller.ts          # GET /api, GET /api/health
apps/api-nest/src/app.service.ts             # Health check logic

apps/api-nest/src/auth/
├── auth.module.ts                           # JwtModule, PassportModule, strategies
├── auth.controller.ts                       # 8 endpoints
├── auth.service.ts                          # bcrypt, JWT, token rotation (231 lines)
├── auth.service.spec.ts                     # 23 tests
├── dto/
│   ├── register.dto.ts                      # @IsEmail, @MinLength(8), @Matches
│   ├── login.dto.ts                         # @IsEmail, @MinLength(8)
│   ├── refresh-token.dto.ts                 # @IsString, @MinLength(1)
│   └── auth-response.dto.ts                 # Swagger response model
├── guards/
│   ├── jwt-auth.guard.ts                    # Global JWT guard + public path whitelist
│   └── local-auth.guard.ts                  # Login guard
└── strategies/
    ├── jwt.strategy.ts                      # Bearer → JWT validation
    └── local.strategy.ts                    # Email/password validation

apps/api-nest/src/preferences/
├── preferences.controller.ts                # GET + PATCH /user/preferences
└── preferences.service.ts                   # CRUD with allowed-field filter

apps/api-nest/src/common/
├── decorators/
│   ├── public.decorator.ts                  # @Public() — bypass JWT
│   ├── current-user.decorator.ts            # @CurrentUser() — extract user
│   └── roles.decorator.ts                   # @Roles('admin')
├── guards/
│   ├── roles.guard.ts                       # RBAC check
│   └── throttler.guard.ts                   # 60 req/min per IP
├── interceptors/
│   ├── logging.interceptor.ts               # Request logging
│   ├── audit.interceptor.ts                 # DB audit trail
│   └── transform.interceptor.ts             # Debug timing
├── filters/
│   └── http-exception.filter.ts             # Structured error response
├── interfaces/
│   └── user-payload.interface.ts            # { sub, email, role, iat, exp }
├── pipes/
│   └── validation.pipe.ts                   # Global validation

apps/api-nest/test/
├── app.e2e-spec.ts                          # 3 E2E tests
└── auth.e2e-spec.ts                         # 26 E2E tests

apps/web-angular/src/
├── styles.scss                              # 5 themes + TickerTape header styles
├── angular.json                             # Material prebuilt theme added
├── app/
│   ├── app.component.ts                     # Shell + stock ticker data
│   ├── app.component.html                   # Tickertape header, toolbar, mega-nav
│   └── features/auth/
│       ├── login/login.component.*           # Login form page
│       └── register/register.component.*     # Register form page

Root level:
├── Makefile                                  # make dev/stop/clean
├── scripts/dev.sh                            # Dev launcher script
├── turbo.json                                # Task orchestration
├── .gitignore                                # IDE exclusions added
├── .github/workflows/ci.yml                  # CI pipeline

docs/
├── SPRINT-PLAN.md                            # Updated to 17 sprints
└── sprint-books/Sprint-02/
    ├── 01_Project_Charter.md
    ├── 02_Product_Requirements.md
    ├── 03_System_Architecture.md
    ├── 04_Tech_Decisions.md
    ├── 05_Repository_Structure.md
    ├── 06_Coding_Standards.md
    ├── 07_Definition_of_Done.md
    ├── 08_Backlog.md
    ├── 09_Risks.md
    ├── 10_Decisions_Log.md
    └── SPRINT_2_EXECUTION_REPORT.md
```
