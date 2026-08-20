#!/usr/bin/env node
/**
 * Connect demo reset — documents marketplace demo URLs (no DB mutation).
 * Usage: node scripts/connect-demo-reset.mjs
 */
const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const scenarios = [
  { id: "high", label: "High confidence — ready to hire", candidate: "demo-high" },
  { id: "moderate", label: "Moderate confidence — interview stage", candidate: "demo-moderate" },
  { id: "warning", label: "Stale sync — needs verification", candidate: "demo-warning" },
  { id: "not_linked", label: "Not linked — empty state", candidate: "demo-unlinked" },
];

console.log("WorkVouch Connect — Marketplace Demo URLs\n");
console.log("Set CONNECT_DEMO_MODE_ENABLED=true in production for reviewer sandbox.\n");

for (const s of scenarios) {
  console.log(`${s.label}`);
  console.log(`  ${base}/integrations/greenhouse/panel?demo=1&scenario=${s.id}&candidateId=${s.candidate}`);
  console.log("");
}

console.log("Employer portal demo: /employer/integrations (requires employer account)");
console.log("Static product demo: /demo");
console.log("\nDemo reset complete — URLs are stateless; no database cleanup required.");
