#!/usr/bin/env node
/**
 * Generates apple-touch-icon (180), favicon-32 (32), favicon-16 (16)
 * from public/icons/icon-1024.png. Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install sharp (dev)
 */
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const iconsDir = join(root, "public", "icons");
const srcPath = join(iconsDir, "icon-1024.png");

const sizes = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
];

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Run: npm install sharp --save-dev");
    process.exit(1);
  }
  const buf = await readFile(srcPath);
  for (const { name, size } of sizes) {
    const outPath = join(iconsDir, name);
    await sharp(buf)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log("Wrote", name, `${size}x${size}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
