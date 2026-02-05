/**
 * Sync production feature_flags into sandbox_feature_registry.
 * Run on build or cron. Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage: node scripts/sync-sandbox-feature-registry.js
 * Or: npm run sandbox:sync-features (with env set)
 */

const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function sync() {
  const { data: flags, error: listErr } = await supabase.from("feature_flags").select("key");
  if (listErr) {
    console.error("feature_flags list error:", listErr.message);
    process.exit(1);
  }
  const keys = (flags ?? []).map((f) => f.key).filter(Boolean);
  let synced = 0;
  for (const feature_key of keys) {
    const { error } = await supabase
      .from("sandbox_feature_registry")
      .upsert({ feature_key, is_enabled: true }, { onConflict: "feature_key" });
    if (!error) synced++;
  }
  console.log("Sandbox feature registry synced:", synced, "features");
}

sync().catch((e) => {
  console.error(e);
  process.exit(1);
});
