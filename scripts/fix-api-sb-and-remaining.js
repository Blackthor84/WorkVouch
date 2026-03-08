/**
 * Replace remaining sb (Supabase client alias) with admin, and fix getSupabaseServer/supabase.
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

  // Remove "const sb = admin as any;" or "const sb = admin;" or "const sb = admin as ReturnType..."
  content = content.replace(/\n\s*const sb = admin as any\s*;?\s*\n/g, "\n");
  content = content.replace(/\n\s*const sb = admin as ReturnType[^;]+;\s*\n/g, "\n");
  content = content.replace(/\n\s*const sb = admin\s*;?\s*\n/g, "\n");

  // Replace sb. with admin.
  content = content.replace(/\bsb\./g, "admin.");
  // Replace standalone sb (await sb, = sb, (sb), let query = sb, etc.)
  content = content.replace(/\bawait sb\b/g, "await admin");
  content = content.replace(/\b= sb\b/g, "= admin");
  content = content.replace(/\blet query = sb\b/g, "let query = admin");
  content = content.replace(/\b\(sb\)/g, "(admin)");
  content = content.replace(/\b, sb\b/g, ", admin");
  content = content.replace(/\brunFraudDetection\(sb\)/g, "runFraudDetection(admin)");

  // getSupabaseServer() -> admin
  content = content.replace(/getSupabaseServer\s*\(\s*\)/g, "admin");

  // supabase -> admin (identifier only, avoid comment)
  content = content.replace(/\bsupabase\./g, "admin.");
  content = content.replace(/\bsupabase\s*\./g, "admin.");
  content = content.replace(/\bawait supabase\b/g, "await admin");
  content = content.replace(/= supabase\b/g, "= admin");

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    updated++;
    console.log("Fixed:", path.relative(process.cwd(), file));
  }
}

console.log("Done. Updated", updated, "files.");
