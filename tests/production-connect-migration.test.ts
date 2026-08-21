import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const BUNDLE_PATH = join(
  process.cwd(),
  "supabase/migrations/20260820220000_production_connect_and_saved_candidates_bundle.sql"
);

const SOURCE_FILES = [
  "20260808120000_connect_event_store.sql",
  "20260808130000_connect_oauth_snapshots.sql",
  "20260808140000_connect_sync_cursor.sql",
  "20260808150000_connect_lifecycle_orchestration.sql",
  "20260808160000_connect_hiring_intelligence.sql",
  "20260808170000_connect_dead_letter_queue.sql",
  "20250616000000_saved_candidates.sql",
];

const EXPECTED_TABLES = [
  "connect_event_store",
  "connect_connections",
  "connect_provider_accounts",
  "connect_candidate_map",
  "connect_job_map",
  "connect_sync_log",
  "connect_webhook_log",
  "connect_projection_state",
  "connect_oauth_state",
  "connect_event_snapshots",
  "connect_sync_cursor",
  "connect_sync_checkpoints",
  "connect_lifecycle_state",
  "connect_invitation_queue",
  "connect_workflow_log",
  "connect_hiring_metrics_snapshots",
  "connect_dead_letter_queue",
  "saved_candidates",
];

const FORBIDDEN_DDL = [
  "CREATE TABLE IF NOT EXISTS public.organizations",
  "CREATE TABLE public.organizations",
  "CREATE TABLE IF NOT EXISTS public.tenant_memberships",
  "CREATE TABLE IF NOT EXISTS public.employer_users",
  "CREATE TABLE IF NOT EXISTS public.profiles",
  "ALTER TABLE public.profiles",
];

describe("production connect + saved_candidates migration bundle", () => {
  const sql = readFileSync(BUNDLE_PATH, "utf8");

  it("wraps changes in a transaction", () => {
    expect(sql).toMatch(/^\s*BEGIN;/m);
    expect(sql).toMatch(/COMMIT;\s*$/m);
  });

  it("includes all seven canonical source migrations in order", () => {
    let lastIndex = -1;
    for (const source of SOURCE_FILES) {
      const idx = sql.indexOf(source);
      expect(idx, `missing source marker ${source}`).toBeGreaterThan(-1);
      expect(idx, `${source} out of dependency order`).toBeGreaterThan(lastIndex);
      lastIndex = idx;
    }
  });

  it("creates every required Connect and saved_candidates table", () => {
    for (const table of EXPECTED_TABLES) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
  });

  it("does not introduce enterprise or profiles schema changes", () => {
    for (const forbidden of FORBIDDEN_DDL) {
      expect(sql).not.toContain(forbidden);
    }
  });

  it("defines connect_connections before dependent FK tables", () => {
    const connectionsIdx = sql.indexOf("CREATE TABLE IF NOT EXISTS public.connect_connections");
    const oauthIdx = sql.indexOf("CREATE TABLE IF NOT EXISTS public.connect_oauth_state");
    const cursorIdx = sql.indexOf("CREATE TABLE IF NOT EXISTS public.connect_sync_cursor");
    expect(connectionsIdx).toBeGreaterThan(-1);
    expect(oauthIdx).toBeGreaterThan(connectionsIdx);
    expect(cursorIdx).toBeGreaterThan(connectionsIdx);
  });

  it("adds OAuth token columns before connect_oauth_state", () => {
    const alterIdx = sql.indexOf("ADD COLUMN IF NOT EXISTS access_token_encrypted");
    const oauthIdx = sql.indexOf("CREATE TABLE IF NOT EXISTS public.connect_oauth_state");
    expect(alterIdx).toBeGreaterThan(-1);
    expect(alterIdx).toBeLessThan(oauthIdx);
  });

  it("saved_candidates references profiles only (no connect FK)", () => {
    const savedIdx = sql.indexOf("CREATE TABLE IF NOT EXISTS public.saved_candidates");
    expect(savedIdx).toBeGreaterThan(
      sql.indexOf("CREATE TABLE IF NOT EXISTS public.connect_dead_letter_queue")
    );
    expect(sql.slice(savedIdx)).toContain("REFERENCES public.profiles(id)");
    expect(sql.slice(savedIdx)).not.toContain("connect_connections");
  });
});
