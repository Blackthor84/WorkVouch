import type { DiagnosticBundle, BundleValidationResult } from "./bundle-types";
import { scanForSecretLeaks } from "./bundle-redactor";

/** Validates diagnostic bundle structure and confirms secrets are redacted. */
export class BundleValidator {
  validate(bundle: DiagnosticBundle): BundleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!bundle.manifest?.bundleVersion) errors.push("Missing manifest.bundleVersion");
    if (!bundle.manifest?.connectionId) errors.push("Missing manifest.connectionId");
    if (!bundle.manifest?.employerAccountId) errors.push("Missing manifest.employerAccountId");
    if (!bundle.connection) errors.push("Missing connection section");
    if (!bundle.health) errors.push("Missing health section");
    if (!bundle.readme) warnings.push("Missing README summary");

    if (!Array.isArray(bundle.recentEvents)) errors.push("recentEvents must be an array");
    if (!Array.isArray(bundle.replayReferences)) errors.push("replayReferences must be an array");
    if (!Array.isArray(bundle.redactions)) warnings.push("redactions list missing");

    const secretLeaks = scanForSecretLeaks(bundle);
    if (secretLeaks.length > 0) {
      errors.push(`Potential secret leaks detected at: ${secretLeaks.slice(0, 5).join(", ")}`);
    }

    const serialized = JSON.stringify(bundle);
    if (serialized.includes("accessTokenEncrypted") && !serialized.includes("[REDACTED]")) {
      errors.push("Unredacted token field detected");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      redactionCount: bundle.redactions?.length ?? 0,
      secretLeaks,
    };
  }
}
