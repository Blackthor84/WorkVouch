/**
 * Industry name pool registry. Auto-pluggable: add a new pool file and register it here.
 * No hardcoded industry switch — lookup by normalized key.
 */

export type { NamePool } from "./types";
export { security } from "./security";
export { healthcare } from "./healthcare";
export { tech } from "./tech";
export { enterprise } from "./enterprise";
export { logistics } from "./logistics";
export { hospitality } from "./hospitality";

import type { NamePool } from "./types";
import { security } from "./security";
import { healthcare } from "./healthcare";
import { tech } from "./tech";
import { enterprise } from "./enterprise";
import { logistics } from "./logistics";
import { hospitality } from "./hospitality";

const REGISTRY: Record<string, NamePool> = {
  security,
  healthcare,
  tech,
  technology: tech,
  enterprise,
  corporate: enterprise,
  logistics,
  hospitality,
};

/**
 * Normalize industry string to registry key (lowercase, aliases).
 */
function normalizeIndustryKey(industry: string): string {
  const key = industry?.trim().toLowerCase().replace(/\s+/g, "_") ?? "";
  if (REGISTRY[key]) return key;
  if (key === "corporate") return "enterprise";
  if (key === "technology") return "tech";
  return key;
}

/**
 * Get name pool for industry. Returns null if unknown (caller can fallback).
 * Future-proof: add new pool to REGISTRY; no switch statements.
 */
export function getPool(industry: string): NamePool | null {
  const key = normalizeIndustryKey(industry);
  return REGISTRY[key] ?? null;
}

/**
 * Register a new industry pool at runtime (optional, for plugins).
 */
export function registerPool(key: string, pool: NamePool): void {
  REGISTRY[key.toLowerCase().replace(/\s+/g, "_")] = pool;
}

const CANONICAL_KEYS = ["security", "healthcare", "tech", "enterprise", "logistics", "hospitality"] as const;

/**
 * List all registered industry keys (canonical; no aliases).
 */
export function listIndustryKeys(): string[] {
  return [...CANONICAL_KEYS];
}
