#!/usr/bin/env node
/**
 * Generates PWA and favicon icons. Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install sharp (dev)
 * - If public/icons/icon-1024.png exists: resizes to icon-192, icon-512, apple-touch, favicons.
 * - If not: creates valid placeholder PNGs (white) for icon-192 and icon-512 so manifest works.
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const iconsDir = join(root, "public", "icons");
const srcPath = join(iconsDir, "icon-1024.png");

const sizes = [
  { name: "icon-512.png", size: 512 },
  { name: "icon-192.png", size: 192 },
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
  await mkdir(iconsDir, { recursive: true });

  let buf;
  try {
    buf = await readFile(srcPath);
  } catch {
    console.warn("No icon-1024.png found; creating placeholder icon-192 and icon-512 (valid PNGs).");
    for (const size of [192, 512]) {
      const outPath = join(iconsDir, `icon-${size}.png`);
      await sharp({
        create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      })
        .png()
        .toFile(outPath);
      console.log("Wrote", `icon-${size}.png`, `${size}x${size}`);
    }
    return;
  }
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
