import type { RedactionRecord } from "./bundle-types";

const SECRET_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /session[_-]?id/i,
  /refresh/i,
  /access[_-]?token/i,
  /encrypted/i,
  /cipher/i,
  /private[_-]?key/i,
  /bearer/i,
  /credential/i,
];

const SECRET_VALUE_PATTERNS = [
  /^Bearer\s+/i,
  /^gho_/,
  /^ghp_/,
  /^sk_/,
  /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
];

const PII_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REDACTED = "[REDACTED]";

/** Automatically removes or masks secrets and sensitive values from diagnostic bundles. */
export class BundleRedactor {
  private redactions: RedactionRecord[] = [];

  redact<T>(value: T, path = "root"): T {
    this.redactions = [];
    return this.walk(value, path) as T;
  }

  getRedactions(): RedactionRecord[] {
    return [...this.redactions];
  }

  private walk(value: unknown, path: string): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === "string") {
      return this.redactString(value, path);
    }

    if (Array.isArray(value)) {
      return value.map((item, i) => this.walk(item, `${path}[${i}]`));
    }

    if (typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        const childPath = `${path}.${key}`;
        if (this.isSecretKey(key)) {
          this.recordRedaction(childPath, "secret_key", typeof val);
          result[key] = REDACTED;
          continue;
        }
        result[key] = this.walk(val, childPath);
      }
      return result;
    }

    return value;
  }

  private redactString(value: string, path: string): string {
    if (this.looksLikeSecretValue(value)) {
      this.recordRedaction(path, "secret_value", "string");
      return REDACTED;
    }
    if (PII_EMAIL.test(value)) {
      this.recordRedaction(path, "pii_email", "string");
      return maskEmail(value);
    }
    return value;
  }

  private isSecretKey(key: string): boolean {
    return SECRET_KEY_PATTERNS.some((p) => p.test(key));
  }

  private looksLikeSecretValue(value: string): boolean {
    if (value.length > 20 && /^[A-Za-z0-9+/=_-]+$/.test(value) && !value.includes(" ")) {
      if (value.length > 32) return true;
    }
    return SECRET_VALUE_PATTERNS.some((p) => p.test(value));
  }

  private recordRedaction(path: string, reason: string, originalType: string): void {
    this.redactions.push({ path, reason, originalType });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return REDACTED;
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

/** Scan for leaked secrets after redaction (validation pass). */
export function scanForSecretLeaks(value: unknown, path = "root"): string[] {
  const leaks: string[] = [];

  if (typeof value === "string") {
    if (value.includes("Bearer ") || /^eyJ/.test(value) || /^gho_/.test(value)) {
      leaks.push(path);
    }
    return leaks;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => leaks.push(...scanForSecretLeaks(item, `${path}[${i}]`)));
    return leaks;
  }

  if (value && typeof value === "object") {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (/token|secret|password|apikey|authorization/i.test(key) && val !== REDACTED && val !== "[REDACTED]") {
        leaks.push(`${path}.${key}`);
      }
      leaks.push(...scanForSecretLeaks(val, `${path}.${key}`));
    }
  }

  return leaks;
}
