/**
 * Script to hash passwords with bcrypt
 * Usage: npx tsx scripts/hash-password.ts "your-password-here"
 */

import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

const hashed = bcrypt.hashSync(password, 10);
console.log("\n✅ Hashed password:");
console.log(hashed);
console.log("\n📝 Copy this hash and paste it into the password field in:");
console.log("   app/api/auth/[...nextauth]/route.ts\n");
