#!/usr/bin/env node
/**
 * Seed superadmin role for a user. Per-environment.
 * Sets auth.users.raw_app_meta_data.role = "superadmin" and profiles.role = "super_admin".
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/seed-superadmin-role.mjs <user-email>
 * Or set env in .env.local and: node scripts/seed-superadmin-role.mjs user@example.com
 */

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/seed-superadmin-role.mjs <user-email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("List users failed:", listError.message);
    process.exit(1);
  }
  const user = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error("User not found with email:", email);
    process.exit(1);
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: "superadmin" },
  });
  if (authError) {
    console.error("Auth update failed:", authError.message);
    process.exit(1);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "super_admin" })
    .eq("id", user.id);
  if (profileError) {
    console.error("Profile update failed:", profileError.message);
    process.exit(1);
  }

  console.log("OK: superadmin role set for", email, "(" + user.id + ")");
  console.log("Run per environment (dev/staging/prod) as needed.");
}

main();
