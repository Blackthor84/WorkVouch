/**
 * One-off: add Supabase admin comment + switch API routes to import { admin } from "@/lib/supabase-admin"
 */
const fs = require("fs");
const path = require("path");

const COMMENT = `// IMPORTANT:
// All server routes must use the \`admin\` Supabase client.
// Do not use \`supabase\` in API routes.

`;

function walk(dir, list = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== "node_modules" && f !== ".git") walk(full, list);
    } else if (f.endsWith(".ts") && !f.endsWith(".d.ts")) {
      list.push(full);
    }
  }
  return list;
}

const apiDir = path.join(__dirname, "..", "app", "api");
const files = walk(apiDir);
let updated = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  // Only touch files that use getSupabaseServer or the old admin import
  if (!content.includes("getSupabaseServer") && !content.includes('from "@/lib/supabase/admin"') && !content.includes("from '@/lib/supabase/admin'")) {
    continue;
  }

  // 1) Prepend comment if not already at top
  if (!content.startsWith("// IMPORTANT:") && !content.includes("// All server routes must use the `admin`")) {
    content = COMMENT + content;
  }

  // 2) Replace import
  content = content.replace(
    /import\s*\{\s*getSupabaseServer\s*\}\s*from\s*["']@\/lib\/supabase\/admin["'];?\s*\n?/g,
    'import { admin } from "@/lib/supabase-admin";\n'
  );
  content = content.replace(
    /import\s*\{\s*getSupabaseServer\s*,\s*[^}]+\}\s*from\s*["']@\/lib\/supabase\/admin["'];?\s*\n?/g,
    (m) => m.replace("getSupabaseServer,", "").replace("from \"@/lib/supabase/admin\"", 'from "@/lib/supabase-admin"').replace("getSupabaseServer", "admin")
  );
  // If we still have the old import (e.g. only getSupabaseServer)
  if (content.includes('from "@/lib/supabase/admin"') && !content.includes("supabase-admin")) {
    content = content.replace(/import\s*\{[^}]*\}\s*from\s*["']@\/lib\/supabase\/admin["'];?/g, 'import { admin } from "@/lib/supabase-admin";');
  }

  // 3) Remove const admin = getSupabaseServer() or const db = getSupabaseServer()
  content = content.replace(/\n\s*const\s+admin\s*=\s*getSupabaseServer\(\)[^;\n]*;?\s*\n/g, "\n");
  content = content.replace(/\n\s*const\s+db\s*=\s*getSupabaseServer\(\)[^;\n]*;?\s*\n/g, "\n");
  content = content.replace(/\n\s*let\s+admin\s*;[^]*?admin\s*=\s*getSupabaseServer\(\)\s*;?\s*\n/g, "\n");

  // 4) Replace db. with admin. (so former db variable usage uses imported admin)
  content = content.replace(/\bdb\./g, "admin.");

  // 5) In files that use "const admin = await requireAdminForApi()" or "requireSuperAdminForApi()",
  //    rename that variable to adminSession so the imported admin is the Supabase client.
  if (content.includes("requireAdminForApi()") || content.includes("requireSuperAdminForApi()") || content.includes("requireBoardForApi()")) {
    const hasSessionNamedAdmin = /\bconst\s+admin\s*=\s*await\s+require(Admin|SuperAdmin|Board)ForApi\(\)/.test(content);
    if (hasSessionNamedAdmin) {
      content = content.replace(/\bconst\s+admin\s*=\s*await\s+require(Admin|SuperAdmin|Board)ForApi\(\)/g, "const adminSession = await require$1ForApi()");
      content = content.replace(/\bif\s*\(\s*!admin\s*\)\s*return\s+adminForbiddenResponse\(\)/g, "if (!adminSession) return adminForbiddenResponse()");
      content = content.replace(/\badmin\.authUserId\b/g, "adminSession.authUserId");
      content = content.replace(/\badmin\.user\b/g, "adminSession.user");
      content = content.replace(/\badmin\.profile\b/g, "adminSession.profile");
      content = content.replace(/\badmin\.isSuperAdmin\b/g, "adminSession.isSuperAdmin");
      content = content.replace(/\badmin\.session\b/g, "adminSession.session");
      content = content.replace(/\bassertAdminCanModify\(\s*admin\s*,/g, "assertAdminCanModify(adminSession,");
      content = content.replace(/\binsertAdminAuditLog\(\s*\{\s*adminId:\s*admin\./g, "insertAdminAuditLog({ adminId: adminSession.");
      content = content.replace(/\badminEmail:\s*\(\s*admin\./g, "adminEmail: (adminSession.");
      content = content.replace(/\blogAdminViewedAnalytics\(\s*[^)]*userId:\s*admin\./g, (m) => m.replace("admin.", "adminSession."));
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    updated++;
    console.log("Updated:", path.relative(process.cwd(), file));
  }
}

console.log("Done. Updated", updated, "files.");
