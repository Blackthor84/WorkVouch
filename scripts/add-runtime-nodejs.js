const fs = require("fs");
const path = require("path");

function findRouteFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findRouteFiles(full, list);
    else if (e.name === "route.ts") list.push(full);
  }
  return list;
}

const RUNTIME_LINE = 'export const runtime = "nodejs";';
const files = findRouteFiles(path.join(__dirname, "..", "app", "api"));
const needRuntime = files.filter((f) => {
  const c = fs.readFileSync(f, "utf8");
  return !/runtime\s*=\s*["']nodejs["']/.test(c);
});

for (const f of needRuntime) {
  let content = fs.readFileSync(f, "utf8");
  // Insert after first line that imports from "next/server" (keep existing export const dynamic if any)
  const nextServerImport = /import\s+.*\s+from\s+["']next\/server["'];?\s*\n/;
  const match = content.match(nextServerImport);
  if (match) {
    const insertAt = match.index + match[0].length;
    const before = content.slice(0, insertAt);
    const after = content.slice(insertAt);
    if (after.trimStart().startsWith("export const dynamic")) {
      content = before + "\n" + RUNTIME_LINE + "\n" + after;
    } else {
      content = before + "\n" + RUNTIME_LINE + "\n" + after;
    }
    fs.writeFileSync(f, content);
    console.log("Added runtime:", f);
  }
}

console.log("Done. Added runtime to", needRuntime.length, "files.");
