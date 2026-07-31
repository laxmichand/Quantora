# TODO — Sprint 4

Remaining items only. Everything else verified done (auth flows, register/login/Google OAuth, route protection, AuthService, AuthInterceptor, E2E auth coverage).

## Pre-requisites (CI/CD) — need GitHub admin (not verifiable from repo)

- [ ] Add `RENDER_DEPLOY_HOOK_API` to GitHub Secrets (deploy-api job in `ci.yml` skips without it)
- [ ] Add `VERCEL_TOKEN` to GitHub Secrets (deploy-web job in `ci.yml` skips without it)
- [ ] Verify SonarCloud scan passes — `sonar-project.properties` + `sonarcloud` job exist in `ci.yml`, but `SONAR_TOKEN` secret must be set

## Testing — missing coverage (workable)

- [ ] E2E: token refresh with **expired** token (valid + revoked already covered)
- [ ] E2E: account lockout after 5 failed attempts (unit-tested only)
- [ ] Unit tests: AuthController methods, Google OAuth callback handler, login-history endpoints (no specs exist)
- [ ] E2E: assert geo/ISP/VPN fields land in the device row — needs a public IP or a mocked `IpIntelligenceService` (loopback keeps geo null; `IPAPI_KEY` now configured in gitignored `.env`)
