const { readFileSync } = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

async function main() {
  const client = await pool.connect();
  await client.query('SET statement_timeout = 120000');

  let ok = 0, skip = 0, fail = 0;

  // ── ALTER EXISTING TABLES ──
  const alters = [
    // User MFA columns
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_enabled" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_secret" TEXT`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_method" TEXT`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_phone" TEXT`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "backup_codes" TEXT`,

    // Login history columns
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "login_method" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "mfa_method" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "mfa_success" BOOLEAN`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "device_id" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "device_name" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "device_type" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "browser" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "os" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "city" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "country" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "isp" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "isp_organization" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "timezone" TEXT`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "vpn_detected" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "proxy_detected" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "tor_detected" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "is_new_device" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "is_new_country" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "is_new_ip" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "risk_score" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "risk_level" TEXT NOT NULL DEFAULT 'low'`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "risk_factors" JSONB`,
    `ALTER TABLE "login_history" ADD COLUMN IF NOT EXISTS "session_id" TEXT`,

    // Audit log columns
    `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "old_value" JSONB`,
    `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "new_value" JSONB`,
    `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "reason" TEXT`,
    `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "device_id" TEXT`,
    `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "session_id" TEXT`,
    `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "country" TEXT`,
    `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "city" TEXT`,
    `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "severity" TEXT NOT NULL DEFAULT 'info'`,
    `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "risk_score" INTEGER NOT NULL DEFAULT 0`,
  ];

  console.log('Adding columns to existing tables...');
  for (const stmt of alters) {
    try { await client.query(stmt); ok++; process.stdout.write('.'); }
    catch (e) { skip++; process.stdout.write('s'); }
  }

  // ── DROP old indexes that conflict ──
  const drops = [
    `DROP INDEX IF EXISTS "login_history_user_id_idx"`,
    `DROP INDEX IF EXISTS "login_history_email_idx"`,
    `DROP INDEX IF EXISTS "audit_logs_user_id_action_idx"`,
    `DROP INDEX IF EXISTS "audit_logs_user_id_idx"`,
  ];
  for (const stmt of drops) {
    try { await client.query(stmt); process.stdout.write('x'); } catch {}
  }

  // ── NEW TABLE: devices ──
  const createDevices = `
    CREATE TABLE IF NOT EXISTS "devices" (
      "id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "device_id" TEXT NOT NULL,
      "fingerprint_hash" TEXT,
      "device_name" TEXT,
      "device_type" TEXT,
      "browser" TEXT, "browser_version" TEXT, "engine" TEXT, "engine_version" TEXT,
      "os" TEXT, "os_version" TEXT, "platform" TEXT, "cpu_architecture" TEXT,
      "hostname" TEXT, "manufacturer" TEXT, "model" TEXT,
      "hardware_concurrency" INTEGER, "device_memory" DOUBLE PRECISION,
      "screen_resolution" TEXT, "viewport" TEXT, "pixel_ratio" DOUBLE PRECISION,
      "timezone" TEXT, "language" TEXT, "languages" TEXT[] DEFAULT '{}',
      "country" TEXT, "state" TEXT, "city" TEXT, "postal_code" TEXT,
      "latitude" DOUBLE PRECISION, "longitude" DOUBLE PRECISION,
      "public_ip" TEXT, "private_ip" TEXT, "isp" TEXT,
      "network_type" TEXT, "wifi_name" TEXT,
      "vpn_detected" BOOLEAN NOT NULL DEFAULT false,
      "proxy_detected" BOOLEAN NOT NULL DEFAULT false,
      "tor_detected" BOOLEAN NOT NULL DEFAULT false,
      "webgl_vendor" TEXT, "webgl_renderer" TEXT,
      "canvas_fingerprint" TEXT, "audio_fingerprint" TEXT,
      "fonts_hash" TEXT, "plugins_hash" TEXT,
      "touch_support" BOOLEAN NOT NULL DEFAULT false,
      "cookies_enabled" BOOLEAN NOT NULL DEFAULT false,
      "local_storage" BOOLEAN NOT NULL DEFAULT false,
      "session_storage" BOOLEAN NOT NULL DEFAULT false,
      "battery_supported" BOOLEAN NOT NULL DEFAULT false,
      "battery_level" DOUBLE PRECISION, "charging" BOOLEAN,
      "connection_downlink" DOUBLE PRECISION, "effective_network_type" TEXT,
      "user_agent" TEXT, "accept_language" TEXT, "accept_encoding" TEXT,
      "accept_header" TEXT, "referer" TEXT, "origin" TEXT,
      "login_method" TEXT DEFAULT 'local', "oauth_provider" TEXT,
      "biometric_enabled" BOOLEAN NOT NULL DEFAULT false,
      "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
      "trusted_device" BOOLEAN NOT NULL DEFAULT false, "trusted_until" TIMESTAMP(3),
      "risk_score" INTEGER NOT NULL DEFAULT 0, "risk_level" TEXT NOT NULL DEFAULT 'low',
      "first_login" TIMESTAMP(3), "last_login" TIMESTAMP(3), "last_activity" TIMESTAMP(3),
      "login_count" INTEGER NOT NULL DEFAULT 1, "failed_login_count" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'active',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "devices_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "devices_device_id_key" UNIQUE ("device_id"),
      CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    )`;
  try { await client.query(createDevices); ok++; console.log('\nCreated devices table'); }
  catch (e) { if (!e.message.includes('already exists')) { fail++; console.error('devices:', e.message); } else skip++; }

  // ── NEW TABLE: sessions ──
  const createSessions = `
    CREATE TABLE IF NOT EXISTS "sessions" (
      "id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "device_id" TEXT NOT NULL,
      "session_token" TEXT NOT NULL,
      "access_token_id" TEXT, "refresh_token_id" TEXT,
      "refresh_token_hash" TEXT, "previous_refresh_token_hash" TEXT,
      "csrf_token" TEXT,
      "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expires_at" TIMESTAMP(3) NOT NULL,
      "idle_timeout" TIMESTAMP(3), "absolute_timeout" TIMESTAMP(3),
      "logout_time" TIMESTAMP(3), "logout_reason" TEXT,
      "revoked" BOOLEAN NOT NULL DEFAULT false,
      "revoked_by" TEXT, "revoked_ip" TEXT, "revoked_device" TEXT,
      "is_current" BOOLEAN NOT NULL DEFAULT false,
      "ip_address" TEXT, "country" TEXT, "city" TEXT, "user_agent" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "sessions_session_token_key" UNIQUE ("session_token")
    )`;
  try { await client.query(createSessions); ok++; console.log('Created sessions table'); }
  catch (e) { if (!e.message.includes('already exists')) { fail++; console.error('sessions:', e.message); } else skip++; }

  // ── FOREIGN KEY for sessions → devices (separate in case devices wasn't created yet) ──
  try { await client.query(`ALTER TABLE "sessions" ADD CONSTRAINT IF NOT EXISTS "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`); } catch {}
  try { await client.query(`ALTER TABLE "sessions" ADD CONSTRAINT IF NOT EXISTS "sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE`); } catch {}

  // ── NEW TABLE: security_events ──
  const createEvents = `
    CREATE TABLE IF NOT EXISTS "security_events" (
      "id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "event_type" TEXT NOT NULL,
      "severity" TEXT NOT NULL DEFAULT 'info',
      "description" TEXT, "metadata" JSONB,
      "risk_score" INTEGER NOT NULL DEFAULT 0,
      "device_id" TEXT, "session_id" TEXT,
      "ip_address" TEXT, "country" TEXT, "city" TEXT,
      "email_sent" BOOLEAN NOT NULL DEFAULT false,
      "push_sent" BOOLEAN NOT NULL DEFAULT false, "email_sent_at" TIMESTAMP(3),
      "acknowledged" BOOLEAN NOT NULL DEFAULT false, "acknowledged_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
    )`;
  try { await client.query(createEvents); ok++; console.log('Created security_events table'); }
  catch (e) { if (!e.message.includes('already exists')) { fail++; console.error('security_events:', e.message); } else skip++; }
  try { await client.query(`ALTER TABLE "security_events" ADD CONSTRAINT IF NOT EXISTS "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`); } catch {}

  // ── INDEXES ──
  console.log('Creating indexes...');
  const indexes = [
    // Login history indexes
    `CREATE INDEX IF NOT EXISTS "login_history_user_id_created_at_idx" ON "login_history"("user_id", "created_at" DESC)`,
    `CREATE INDEX IF NOT EXISTS "login_history_email_created_at_idx" ON "login_history"("email", "created_at" DESC)`,
    `CREATE INDEX IF NOT EXISTS "login_history_device_id_idx" ON "login_history"("device_id")`,
    `CREATE INDEX IF NOT EXISTS "login_history_ip_address_idx" ON "login_history"("ip_address")`,
    `CREATE INDEX IF NOT EXISTS "login_history_country_idx" ON "login_history"("country")`,
    `CREATE INDEX IF NOT EXISTS "login_history_risk_level_idx" ON "login_history"("risk_level")`,
    `CREATE INDEX IF NOT EXISTS "login_history_created_at_idx" ON "login_history"("created_at" DESC)`,
    // Audit log indexes
    `CREATE INDEX IF NOT EXISTS "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at" DESC)`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC)`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id")`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_ip_address_idx" ON "audit_logs"("ip_address")`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_severity_idx" ON "audit_logs"("severity")`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_device_id_idx" ON "audit_logs"("device_id")`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_session_id_idx" ON "audit_logs"("session_id")`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC)`,
    // Device indexes
    `CREATE INDEX IF NOT EXISTS "devices_user_id_idx" ON "devices"("user_id")`,
    `CREATE INDEX IF NOT EXISTS "devices_device_id_idx" ON "devices"("device_id")`,
    `CREATE INDEX IF NOT EXISTS "devices_fingerprint_hash_idx" ON "devices"("fingerprint_hash")`,
    `CREATE INDEX IF NOT EXISTS "devices_public_ip_idx" ON "devices"("public_ip")`,
    `CREATE INDEX IF NOT EXISTS "devices_country_idx" ON "devices"("country")`,
    `CREATE INDEX IF NOT EXISTS "devices_risk_level_idx" ON "devices"("risk_level")`,
    `CREATE INDEX IF NOT EXISTS "devices_status_idx" ON "devices"("status")`,
    `CREATE INDEX IF NOT EXISTS "devices_created_at_idx" ON "devices"("created_at" DESC)`,
    // Session indexes
    `CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id")`,
    `CREATE INDEX IF NOT EXISTS "sessions_device_id_idx" ON "sessions"("device_id")`,
    `CREATE INDEX IF NOT EXISTS "sessions_session_token_idx" ON "sessions"("session_token")`,
    `CREATE INDEX IF NOT EXISTS "sessions_refresh_token_hash_idx" ON "sessions"("refresh_token_hash")`,
    `CREATE INDEX IF NOT EXISTS "sessions_revoked_idx" ON "sessions"("revoked")`,
    `CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions"("expires_at")`,
    `CREATE INDEX IF NOT EXISTS "sessions_last_activity_idx" ON "sessions"("last_activity" DESC)`,
    `CREATE INDEX IF NOT EXISTS "sessions_login_time_idx" ON "sessions"("login_time" DESC)`,
    // Security events indexes
    `CREATE INDEX IF NOT EXISTS "security_events_user_id_created_at_idx" ON "security_events"("user_id", "created_at" DESC)`,
    `CREATE INDEX IF NOT EXISTS "security_events_event_type_created_at_idx" ON "security_events"("eventType", "created_at" DESC)`,
    `CREATE INDEX IF NOT EXISTS "security_events_severity_idx" ON "security_events"("severity")`,
    `CREATE INDEX IF NOT EXISTS "security_events_device_id_idx" ON "security_events"("device_id")`,
    `CREATE INDEX IF NOT EXISTS "security_events_created_at_idx" ON "security_events"("created_at" DESC)`,
  ];
  for (const stmt of indexes) {
    try { await client.query(stmt); ok++; process.stdout.write('.'); }
    catch (e) { if (e.message.includes('already exists')) { skip++; process.stdout.write('s'); } else { fail++; console.error(`\nINDEX FAIL: ${e.message.substring(0, 150)}`); } }
  }

  console.log(`\n\nOK: ${ok} | Skipped: ${skip} | Failed: ${fail}`);
  if (fail > 0) process.exit(1);
  console.log('✓ Schema applied successfully');

  client.release();
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
