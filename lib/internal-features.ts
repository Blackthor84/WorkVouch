/**
 * Internal feature flags and visibility gating for unreleased WorkVouch functionality.
 * Keeps features completely hidden in production until public launch.
 *
 * Rules:
 * - All flags OFF in production by default.
 * - ON in development and staging.
 * - Access restricted to superadmin and founder (role or isFounder).
 * - No DOM rendering when gated; no route exposure; no export leakage.
 * - Single access function: canAccessFeature. No component decides visibility independently.
 */

export const FEATURE_ROI_CALCULATOR = "FEATURE_ROI_CALCULATOR";
export const FEATURE_ENTERPRISE_PRICING = "FEATURE_ENTERPRISE_PRICING";
export const FEATURE_COUNTERFACTUAL_COMPARISON = "FEATURE_COUNTERFACTUAL_COMPARISON";
export const FEATURE_POPULATION_SIM = "FEATURE_POPULATION_SIM";
export const FEATURE_MULTIVERSE_ADVANCED = "FEATURE_MULTIVERSE_ADVANCED";
export const FEATURE_ADVERSARIAL_MODE = "FEATURE_ADVERSARIAL_MODE";

export type InternalFeatureKey =
  | typeof FEATURE_ROI_CALCULATOR
  | typeof FEATURE_ENTERPRISE_PRICING
  | typeof FEATURE_COUNTERFACTUAL_COMPARISON
  | typeof FEATURE_POPULATION_SIM
  | typeof FEATURE_MULTIVERSE_ADVANCED
  | typeof FEATURE_ADVERSARIAL_MODE;

const INTERNAL_FEATURE_KEYS: InternalFeatureKey[] = [
  FEATURE_ROI_CALCULATOR,
  FEATURE_ENTERPRISE_PRICING,
  FEATURE_COUNTERFACTUAL_COMPARISON,
  FEATURE_POPULATION_SIM,
  FEATURE_MULTIVERSE_ADVANCED,
  FEATURE_ADVERSARIAL_MODE,
];

/** Production = flags off by default. Dev/staging = on by default. */
function isProduction(): boolean {
  if (typeof process === "undefined" || process.env === undefined) return false;
  return process.env.NODE_ENV === "production";
}

/**
 * Whether the feature is enabled for the current environment.
 * Production: OFF unless NEXT_PUBLIC_FEATURE_<KEY> is explicitly "1".
 * Development/staging: ON unless NEXT_PUBLIC_FEATURE_<KEY> is explicitly "0".
 */
export function isFeatureEnabledForEnv(featureKey: InternalFeatureKey): boolean {
  const prod = isProduction();
  const envKey = featureKey.replace("FEATURE_", "NEXT_PUBLIC_FEATURE_");
  const override = typeof process !== "undefined" && process.env && (process.env as Record<string, string>)[envKey];
  if (override === "1") return true;
  if (override === "0") return false;
  return !prod;
}

/** Global override: when set to "1", all internal features are enabled (e.g. staging). */
function isInternalFeaturesOverrideEnabled(): boolean {
  if (typeof process === "undefined" || process.env === undefined) return false;
  return (process.env as Record<string, string>).NEXT_PUBLIC_ENABLE_INTERNAL_FEATURES === "1";
}

function isFeatureEnabledForEnvWithOverride(featureKey: InternalFeatureKey): boolean {
  if (isInternalFeaturesOverrideEnabled()) return true;
  return isFeatureEnabledForEnv(featureKey);
}

/**
 * Role + founder context for access checks.
 * Use role from AuthContext; isFounder from admin layout (email match to FOUNDER_EMAIL).
 */
export interface FeatureAccessContext {
  role: string | null;
  isFounder?: boolean;
}

/** True if the user is allowed to see internal features (superadmin or founder). */
export function isInternalRole(context: FeatureAccessContext): boolean {
  const r = (context.role ?? "").toLowerCase();
  if (r === "superadmin") return true;
  if (r === "founder") return true;
  if (context.isFounder === true) return true;
  return false;
}

/**
 * Single access check for internal features. Use this everywhere; no component may decide visibility independently.
 * Returns true only when:
 * 1. The feature is enabled for the environment (off in production unless explicitly on), and
 * 2. The user is superadmin or founder.
 */
export function canAccessFeature(
  featureKey: InternalFeatureKey,
  context: FeatureAccessContext
): boolean {
  if (!isFeatureEnabledForEnvWithOverride(featureKey)) return false;
  return isInternalRole(context);
}

/** All internal feature keys (for iteration / admin). */
export function getAllInternalFeatureKeys(): readonly InternalFeatureKey[] {
  return INTERNAL_FEATURE_KEYS;
}
