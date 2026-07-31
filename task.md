# Quantora — Local Task Log

Kept up to date on every problem/command. Current → Completed → Pending.

## Current Task

**Device-fingerprint enrichment + anti-tamper (in progress — backend + client done, not yet committed)**

- Server-side enrichment implemented in `registerOrUpdateDevice()` (`auth.service.ts`):
  - `IpIntelligenceService.lookup(ip)` now persisted into the `Device` row (create + update): country, state, city, postal_code, lat/long, isp, network_type, vpn/proxy/tor_detected, public_ip.
  - UA parsed server-side with `ua-parser-js` (authoritative over client claims): browser/engine/os (+versions), cpu_architecture, manufacturer/model/device_type/device_name.
  - Request headers persisted: accept_language, accept_encoding, accept_header, referer, origin; plus login_method.
  - Post-login risk update reduced to risk_score/risk_level + last_login + login_count (no redundant geo writes).
- Client (`DeviceFingerprintService.collect()`) now actually captures `batteryLevel`/`charging` via `navigator.getBattery()`; still sends ONLY browser-exposed fields (no geo/IP/risk). `FingerprintService.hash()` already ignores volatile battery fields → hash stays stable.
- Remaining: e2e geo-field assertions optional (needs IPAPI_KEY/live IP), commit + push.

## Completed

### Device-fingerprint enrichment + anti-tamper (backend + client)

- **Backend:** `registerOrUpdateDevice()` persists server-derived geo/IP/UA/header/lifecycle fields from `IpInfo`, `UAParser`, and request headers — never trusts client-sent geo/IP/risk. `LoginContext.headers`, `register()` 4th arg, `auth.controller.deviceHeaders()` helper added; risk update refactored.
- **Client:** `DeviceFingerprintService.collect()` fills `batteryLevel`/`charging` via `navigator.getBattery()` (falls back gracefully); fingerprint payload unchanged in surface — still browser-exposed fields only.
- **Tests:** `auth.service.spec.ts` +2 (server-authoritative UA override + header/geo persistence on register; IP-intelligence + geo-free risk update on login) → API unit 47/47.
- **Checks:** `nest build` green, web `tsc --noEmit` + prod `ng build` green, eslint 0 (fixed empty `catch {}` in e2e spec), prettier clean.

### Session policy — enforce max 2 active sessions per user (committed + pushed)

- **Root cause:** login reused/overwrote sessions by device; refresh-token reuse handler revoked *other* sessions; no atomic limit.
- **Fix:**
  - `TokenService`: `MAX_ACTIVE_SESSIONS = 2`, atomic eviction (transaction + `SELECT … FOR UPDATE` row lock, oldest-first by `lastActivity`), refresh-token reuse revokes only the reused session, rotated access tokens blacklisted, evicted sessions removed from Redis.
  - `AuthService`: every login creates an independent session (no per-device reuse); eviction emits `SESSION_REVOKED` security event (`reason: MAX_ACTIVE_SESSIONS_EXCEEDED`).
  - `JwtStrategy`: validates the session is active and the access token matches the session (`accessTokenId === jti`) → revoked/evicted sessions get 401 immediately.
  - `RedisService.onModuleDestroy`: no longer crashes when Redis is down (jest teardown fix).
- **Tests:** `token.service.spec.ts` (13 unit: eviction, oldest-first, concurrency invariant, reuse-scoping, revoke helpers — 92% cov); `session-policy.e2e-spec.ts` (12 e2e: coexist, eviction, same-device re-login, refresh isolation, stale-reuse scope, logout scopes, parallel logins ≤ 2); repaired pre-existing broken `app.e2e-spec.ts` + `auth.e2e-spec.ts` (cookie-based); `jest-e2e.json` `transformIgnorePatterns` + `testTimeout`.
- **Results:** API unit 45/45; e2e 34/34; web unit 39/39; api lint + tsc + build green; web prod build green.

## Pending

- [ ] Commit + push device-fingerprint enrichment (auth.service/controller/spec, web device-fingerprint service, session-policy e2e catch fix, task.md).
- [ ] Optional: e2e test asserting geo/ISP/VPN fields land in the device row (needs real IP / IPAPI_KEY).
- [ ] Decide offline geo (`geoip-lite`/MaxMind) vs keeping optional IPAPI_KEY only.

## Commands Run (recent)

| Command | Result |
| --- | --- |
| `npm run test --workspace=@quantora/api -- --runInBand` | 45/45 pass |
| `npm run test:e2e --workspace=@quantora/api -- --runInBand --forceExit` | 34/34 pass |
| `npx prettier --check …` | 2 files fixed |
| `npx eslint "apps/api-nest/src/**/*.ts"` | clean |
| `npx tsc --noEmit -p apps/api-nest/tsconfig.build.json` / `tsconfig.json` | clean |
| `npm run build --workspace=@quantora/api` | ok |
| `npx ng build --configuration production` | ok |
| `npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox` | 39/39 pass |
| AI `pytest` | skipped locally (no pytest in venv; ai app untouched) |

## Blockers / Notes

- Redis down locally → e2e must run with `--forceExit` (teardown guard added).
- e2e requires live Supabase DB + `cookieParser()` in test app setup.
- CI runs unit tests only (e2e job disabled in `ci.yml`).
