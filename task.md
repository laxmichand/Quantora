# Quantora — Local Task Log

Kept up to date on every problem/command. Current → Completed → Pending.

## Current Task

None.

## Pending

- [ ] (none — device-fingerprint work fully done; see git log for completed items)

## Blockers / Notes

- Redis down locally → e2e must run with `--forceExit` (teardown guard added).
- e2e requires live Supabase DB + `cookieParser()` in test app setup.
- CI runs unit tests only (e2e job disabled in `ci.yml`).
- `geoip-lite` (offline geo) + optional `IPAPI_KEY` (ISP/VPN/proxy/TOR enrichment). Key lives in gitignored `apps/api-nest/.env`, never committed.
