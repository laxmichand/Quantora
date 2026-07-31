# Quantora — Local Task Log

All tasks complete. See git log for the completed work.

## Blockers / Notes

- Redis down locally → e2e must run with `--forceExit` (teardown guard added).
- e2e requires live Supabase DB + `cookieParser()` in test app setup.
- CI runs unit tests only (e2e job disabled in `ci.yml`).
- `geoip-lite` (offline geo) + optional `IPAPI_KEY` (ISP/VPN/proxy/TOR enrichment). Key lives in gitignored `apps/api-nest/.env`, never committed.
