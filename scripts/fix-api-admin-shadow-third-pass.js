/**
 * Third pass: fix shadowed `admin` when it's from isAdmin() or getAdminContext().
 * - isAdmin(): rename to isAdminUser, remove sb = admin as any, use imported admin for DB.
 * - getAdminContext(): rename to adminContext, use imported admin for .from/.rpc/.auth/.storage.
 */
const fs = require("fs");
const path = require("path");

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

  // ---- Pattern 1: const admin = await isAdmin() or const admin = isAdmin(...)
  if (content.includes("const admin = await isAdmin()") || /const admin = isAdmin\([^)]+\)/.test(content)) {
    content = content.replace(/\bconst admin = await isAdmin\(\)/g, "const isAdminUser = await isAdmin()");
    content = content.replace(/\bconst admin = isAdmin\(/g, "const isAdminUser = isAdmin(");
    content = content.replace(/\bif\s*\(\s*!admin\s*\)/g, "if (!isAdminUser)");
    content = content.replace(/\bif\s*\(\s*!admin\s*\)/g, "if (!isAdminUser)");
    // Remove "const sb = admin as any" or "const sb = admin" and use admin (import) for sb.
    content = content.replace(/\n\s*const sb = admin as any\s*;?\s*\n/g, "\n");
    content = content.replace(/\n\s*const sb = admin\s*;?\s*\n/g, "\n");
    content = content.replace(/\bsb\./g, "admin.");
  }

  // ---- Pattern 2: const admin = await getAdminContext(...)
  if (/const admin = await getAdminContext\(/.test(content)) {
    content = content.replace(/\bconst admin = await getAdminContext\(/g, "const adminContext = await getAdminContext(");
    content = content.replace(/\bconst admin = await getAdminContext\s*\(\s*\)/g, "const adminContext = await getAdminContext()");
    // Replace admin. with adminContext. (so context props are correct)
    content = content.replace(/\badmin\./g, "adminContext.");
    // Restore Supabase client methods: adminContext.from -> admin.from, etc.
    content = content.replace(/\badminContext\.from\b/g, "admin.from");
    content = content.replace(/\badminContext\.rpc\b/g, "admin.rpc");
    content = content.replace(/\badminContext\.auth\b/g, "admin.auth");
    content = content.replace(/\badminContext\.storage\b/g, "admin.storage");
  }

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    updated++;
    console.log("Fixed:", path.relative(process.cwd(), file));
  }
}

console.log("Done. Updated", updated, "files.");
