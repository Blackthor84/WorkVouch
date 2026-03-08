/**
 * Second pass: replace remaining getSupabaseServer(), supabaseServer, and db with admin.
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

  const needsFix =
    content.includes("getSupabaseServer()") ||
    content.includes("getSupabaseServer ()") ||
    /\bsupabaseServer\b/.test(content) ||
    /\bdb\./.test(content) ||
    /(?:^|\s)(\bdb\b)(?=\s*\.|;|\n|\)|,)/m.test(content) ||
    /\bsupabase\b/.test(content);

  if (!needsFix) continue;

  // Replace old getSupabaseServer-only import with admin
  content = content.replace(
    /import\s*\{\s*getSupabaseServer\s*\}\s*from\s*["']@\/lib\/supabase\/admin["'];?\s*\n?/g,
    'import { admin } from "@/lib/supabase-admin";\n'
  );
  // Combined imports: add admin from supabase-admin and remove getSupabaseServer from the other
  content = content.replace(
    /import\s*\{\s*([^}]*),\s*getSupabaseServer\s*\}\s*from\s*["']@\/lib\/supabase\/admin["'];?\s*\n?/g,
    'import { $1 } from "@/lib/supabase/admin";\nimport { admin } from "@/lib/supabase-admin";\n'
  );
  content = content.replace(
    /import\s*\{\s*getSupabaseServer\s*,\s*([^}]*)\}\s*from\s*["']@\/lib\/supabase\/admin["'];?\s*\n?/g,
    'import { $1 } from "@/lib/supabase/admin";\nimport { admin } from "@/lib/supabase-admin";\n'
  );

  // Ensure we have admin import (may already be there)
  if (!content.includes('from "@/lib/supabase-admin"') && !content.includes("from '@/lib/supabase-admin'")) {
    const firstImport = content.indexOf("import ");
    if (firstImport >= 0) {
      const lineEnd = content.indexOf("\n", firstImport);
      content = content.slice(0, lineEnd + 1) + 'import { admin } from "@/lib/supabase-admin";\n' + content.slice(lineEnd + 1);
    } else {
      content = 'import { admin } from "@/lib/supabase-admin";\n' + content;
    }
  }

  // Replace getSupabaseServer() with admin (all forms)
  content = content.replace(/getSupabaseServer\s*\(\s*\)/g, "admin");

  // Replace supabaseServer with admin
  content = content.replace(/\bsupabaseServer\b/g, "admin");

  // Remove const supabase = getSupabaseServer() or const supabase = admin (now redundant)
  content = content.replace(/\n\s*const\s+supabase\s*=\s*admin\s*;?\s*\n/g, "\n");
  content = content.replace(/\n\s*const\s+supabase\s*=\s*getSupabaseServer\(\)\s*;?\s*\n/g, "\n");

  // Replace supabase. with admin. (variable that held the client)
  content = content.replace(/\bsupabase\./g, "admin.");

  // Replace db. with admin.
  content = content.replace(/\bdb\./g, "admin.");

  // Replace standalone "db" when it's the client (e.g. "let x = db\n" or "pvQuery = db\n")
  content = content.replace(/(\s)(db)(\s*\.)/g, "$1admin$3");
  content = content.replace(/(=\s*)(db)(\s*;?\s*\n)/g, "$1admin$3");
  content = content.replace(/(\n\s*)(db)(\s*\.)/g, "$1admin$3");

  // Replace remaining supabase (client variable) with admin — only identifier uses
  content = content.replace(/\bsupabase\s*\./g, "admin.");  // supabase. or supabase\n.
  content = content.replace(/\bawait supabase\b/g, "await admin");
  content = content.replace(/= supabase\b/g, "= admin");
  content = content.replace(/, supabase\b/g, ", admin");
  content = content.replace(/\(supabase\)/g, "(admin)");
  content = content.replace(/\bsupabase\./g, "admin.");

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    updated++;
    console.log("Fixed:", path.relative(process.cwd(), file));
  }
}

console.log("Done. Updated", updated, "files.");
