# Quantora — Database Design

> **Stack**: PostgreSQL (Supabase) + Prisma ORM + Redis (session/rate-limit/blacklist caching).
> Source of truth: `apps/api-nest/prisma/schema.prisma`. `DATABASE_URL` comes from the root `.env`.

---

## Overview

- **Primary store**: PostgreSQL via Prisma. Every table has `created_at` / `updated_at`, and most business tables carry `created_by`, `updated_by`, `version`, and soft-delete `is_deleted`.
- **Redis** (`REDIS_URL`): revoked-JWT blacklist, session TTL cache, rate-limit counters. Optional — the app degrades gracefully when Redis is down (Postgres sessions stay authoritative).
- No MongoDB. Early docs describing MongoDB collections are obsolete.

---

## Tables (Prisma models)

### users

Auth identity, OAuth, lockout, MFA.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID (pk) | |
| `email` | text (unique) | |
| `password_hash` | text? | argon2id, peppered |
| `name` | text | |
| `phone` | text? | |
| `role` | text | `user`, `pro`, `admin` |
| `is_active` | bool | |
| `is_email_verified` | bool | |
| `email_verify_token` | text? | |
| `provider` | text? | `local`, `google` |
| `provider_id` | text? | |
| `failed_login_attempts` | int | lockout counter |
| `locked_until` | timestamp? | 5 fails → 15 min |
| `mfa_enabled` / `mfa_secret` / `mfa_method` / `mfa_phone` / `backup_codes` | | TOTP MFA |
| `last_login_at` | timestamp? | |
| `created_by` / `updated_by` / `version` / `is_deleted` | | audit columns |

Indexes: `email`, `role`, `(provider, provider_id)`, `is_deleted`.

### devices

Rich device fingerprint (browser, OS, screen, canvas/audio/fonts, network, geo, VPN/proxy/TOR), trust, risk.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID (pk) | |
| `user_id` | UUID (fk → users, cascade) | |
| `device_id` | text (unique) | client-provided fingerprint id |
| `fingerprint_hash` | text? | |
| `device_name` / `device_type` | text? | |
| `browser` / `browser_version` / `engine` / `engine_version` | text? | |
| `os` / `os_version` / `platform` / `cpu_architecture` | text? | |
| `hardware_concurrency` / `device_memory` / `pixel_ratio` | int/float? | |
| `screen_resolution` / `viewport` | text? | |
| `timezone` / `language` / `languages[]` | | |
| `country` / `state` / `city` / `postal_code` / `latitude` / `longitude` | | from IP intelligence |
| `public_ip` / `private_ip` / `isp` / `network_type` | text? | |
| `vpn_detected` / `proxy_detected` / `tor_detected` | bool | |
| `user_agent` / `accept_*` / `referer` / `origin` | text? | |
| `login_method` / `oauth_provider` / `biometric_enabled` / `mfa_enabled` | | |
| `trusted_device` / `trusted_until` | | trust window |
| `risk_score` / `risk_level` | int / text | low/medium/high/critical |
| `first_login` / `last_login` / `last_activity` / `login_count` / `failed_login_count` | | |
| `status` | text | `active`, `blocked` |

Indexes: `user_id`, `device_id`, `fingerprint_hash`, `public_ip`, `country`, `risk_level`, `status`, `created_at`.

### sessions

Session/token binding — powers logout-all, "log out other devices", token reuse detection.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID (pk) | `sid` claim in JWTs |
| `user_id` | UUID (fk → users, cascade) | |
| `device_id` | UUID (fk → devices) | |
| `session_token` | text (unique) | |
| `access_token_id` | text? (unique) | = access token `jti` |
| `refresh_token_id` | text? (unique) | = refresh token `jti` |
| `refresh_token_hash` / `previous_refresh_token_hash` | text? | SHA-256 of rotated tokens |
| `csrf_token` | text? | |
| `login_time` / `last_activity` / `expires_at` | timestamp | |
| `idle_timeout` / `absolute_timeout` | timestamp? | |
| `logout_time` / `logout_reason` | | |
| `revoked` / `revoked_by` / `revoked_ip` / `revoked_device` | | |
| `is_current` | bool | |
| `ip_address` / `country` / `city` / `user_agent` | text? | |

Indexes: `user_id`, `device_id`, `session_token`, `refresh_token_hash`, `revoked`, `expires_at`, `last_activity`, `login_time`.

**Concurrency rules**: `MAX_ACTIVE_SESSIONS = 2` (oldest evicted); refresh rotates tokens; reusing a rotated refresh token revokes the session (`token_reuse`).

### refresh_tokens

**Legacy** — kept for migration compatibility. Sessions are now the primary mechanism.

### portfolios / holdings

- `portfolios`: `user_id` (fk, cascade), `name`, `benchmark` (default `NIFTY_50`), audit columns.
- `holdings`: `portfolio_id` (fk, cascade), `stock_symbol`, `quantity`, `avg_buy_price` `DECIMAL(10,2)`.

### goals

`user_id`, `name`, `target_amount` `DECIMAL(15,2)`, `current_amount`, `deadline` (date), `type`, `sip_amount`, `risk_tolerance`, `status` (active/completed/paused).

### subscriptions

`user_id` (unique), `plan` (free/pro/enterprise), `status`, `start_date`, `end_date`, `payment_method`, `amount` `DECIMAL(10,2)`, `currency` (INR).

### alerts / watchlists

- `alerts`: `user_id`, `type` (price_target/volume/news/portfolio/goal), `stock_symbol`, `condition` (above/below/percent_change), `threshold`, `is_active`, `last_triggered_at`.
- `watchlists`: `user_id`, `name`, `stock_symbols text[]`.

### login_history

One row per login attempt — success/failure, provider, MFA, geo/ISP/VPN, risk, new-device/country/IP flags, `session_id`.

Indexes: `(user_id, created_at)`, `(email, created_at)`, `device_id`, `ip_address`, `country`, `risk_level`, `created_at`.

### audit_logs

`user_id` (set null), `action`, `entity`, `entity_id`, `old_value`/`new_value` (json), `details` (json), `reason`, `ip_address`, `user_agent`, `device_id`, `session_id`, `country`, `city`, `severity`, `risk_score`.

### security_events

Alert timeline for the Security Center: `event_type`, `severity`, `description`, `metadata`, `risk_score`, `device_id`, `session_id`, `ip_address`, `country`, `city`, `email_sent`/`push_sent`, `acknowledged`/`acknowledged_at`.

### user_preferences

1:1 with `users` (`user_id` unique).

| Field | Default |
| --- | --- |
| `language` | `en` |
| `theme` | `slate` (slate/light/dark/indigo/emerald/rose) |
| `date_format` | `DD/MM/YYYY` |
| `number_format` | `indian` |
| `timezone` | `Asia/Kolkata` |
| `default_exchange` | `NSE` |
| `risk_tolerance` | `moderate` |
| `investment_style` | `long_term` |
| `sidebar_collapsed` | false |
| `default_view` | `dashboard` |
| `notifications_email` / `notifications_push` / `notifications_sms` | true / true / false |
| `notify_price_alerts` / `notify_portfolio` / `notify_news` / `notify_ai_insights` | true / true / false / true |
| `stock_list_columns` / `dashboard_layout` | json? |
| `profile_public` / `show_portfolio` | false |

> Note: user language lives **here**, not on `users`.

### blocked_ips

`ip_address`, `user_id` (nullable = globally blocked), `reason`, `blocked_by`, `expires_at`. Unique `(ip_address, user_id)`.

### notifications

`user_id`, `type` (email/push/sms), `channel`, `title`, `body`, `message`, `metadata`, `status` (pending/sent/failed/read), `read_at`, `sent_at`.

### oauth_accounts

`user_id`, `provider`, `provider_id`, `email`, `name`, `avatar_url`, `access_token`, `refresh_token`, `expires_at`. Unique `(provider, provider_id)`.

---

## Redis Keys

```
# Revoked JWTs (TTL = remaining token life)
blacklist:{jti}       → "1"

# Session blacklist (revoked session ids)
session:blacklist:{sid} → "1"

# Rate limiting (TTL = window)
rate:{ip}:{route}     → count

# Latest-price cache — Sprint 4 (per-tick, no TTL or configurable stale window)
quote:{exchange}:{symbol} → { ltp, open, high, low, prevClose, change, changePct, volume, timestamp, sourceTimestamp }
```

---

## Seed / Reset

| Script | Purpose |
| --- | --- |
| `npm run db:seed` (`apps/api-nest/prisma/seed.ts`) | Idempotent demo data; **note**: plain `ts-node` doesn't load `.env`, so run with `DATABASE_URL="..." npm run db:seed` |
| `npm run reset-and-create-user` (`scripts/reset-and-create-user.ts`) | Wipe all tables (FK order) then create a single admin (`lcdhuvare3010@gmail.com`), plus `user_preferences` |

Both connect through the Supabase pooler via `DATABASE_URL` in the root `.env`.

---

## Conventions

- **Migrations**: Prisma Migrate (`apps/api-nest/prisma/migrations/`). Run `npx prisma generate` after schema changes (also enforced by the pre-commit hook).
- **Mapping**: `camelCase` fields → `snake_case` columns via `@map`/`@@map`.
- **Soft delete**: prefer `is_deleted = true` over hard deletes on business tables.
