const fs = require("fs");
const path = require("path");

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes("getServerSession") && !content.includes("authOptions")) return false;

  content = content.replace(
    /import\s*\{\s*getServerSession\s*\}\s*from\s*["']next-auth["'];\s*\n\s*import\s*\{\s*authOptions\s*\}\s*from\s*["']@\/app\/api\/auth\/\[\.\.\.nextauth\]\/authOptions["'];/g,
    'import { getSupabaseSession } from "@/lib/supabase/server";'
  );
  content = content.replace(
    /import\s*\{\s*getServerSession\s*\}\s*from\s*["']next-auth\/next["'];\s*\n\s*import\s*\{\s*authOptions\s*\}\s*from\s*["']@\/lib\/auth-config["'];/g,
    'import { getSupabaseSession } from "@/lib/supabase/server";'
  );
  content = content.replace(
    /const session = await getServerSession\(authOptions\);/g,
    "const { session } = await getSupabaseSession();"
  );
  fs.writeFileSync(filePath, content);
  return true;
}

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules") walk(full, list);
    else if (e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".tsx"))) list.push(full);
  }
  return list;
}

const dirs = ["app/api", "app/admin", "app/directory", "app/(app)"];
let count = 0;
for (const dir of dirs) {
  for (const file of walk(dir)) {
    if (replaceInFile(file)) {
      console.log(file);
      count++;
    }
  }
}
console.log("Updated", count, "files");
