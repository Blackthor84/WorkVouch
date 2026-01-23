import { writeFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

console.log("Regenerating Supabase types...");

const projectRef = "sjwxcrmtivmhbqqlkrsh";
const outputPath = join(process.cwd(), "types", "database.types.ts");

try {
  // Generate types using Supabase CLI
  const command = `npx supabase gen types typescript --project-id ${projectRef}`;
  console.log(`Running: ${command}`);
  
  const typesOutput = execSync(command, {
    encoding: "utf-8",
    stdio: "pipe",
  });

  // Write to file
  writeFileSync(outputPath, typesOutput, "utf-8");
  
  console.log(`Types regenerated successfully at: ${outputPath}`);
} catch (error: any) {
  console.error("Error generating types:", error.message);
  console.error("\nNote: Make sure you have:");
  console.error("1. Supabase CLI installed: npm install -g supabase");
  console.error("2. Authenticated: npx supabase login");
  console.error("3. Correct project ref:", projectRef);
  process.exit(1);
}
