/**
 * Normalize and validate phone numbers to E.164 format.
 * Rejects invalid numbers.
 */

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Normalize US/CA 10-digit to E.164 (+1...).
 */
function normalizeUS(digits: string): string | null {
  if (digits.length === 10 && digits[0] !== "0") return "+1" + digits;
  if (digits.length === 11 && digits[0] === "1") return "+" + digits;
  return null;
}

/**
 * Normalize phone number to E.164 (e.g. +16035551234).
 * Returns null for invalid or unparseable input.
 */
export function normalizePhoneNumber(value: string | null | undefined): string | null {
  if (value == null || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length === 0) return null;

  const e164 = trimmed.startsWith("+")
    ? "+" + digitsOnly
    : normalizeUS(digitsOnly) ?? (digitsOnly.length >= 10 && digitsOnly.length <= 15 ? "+" + digitsOnly : null);

  if (e164 === null || !E164_REGEX.test(e164)) return null;
  if (e164.length < 11 || e164.length > 16) return null;

  return e164;
}

/**
 * Returns true if the value is a valid E.164 number after normalization.
 */
export function isValidPhoneNumber(value: string | null | undefined): boolean {
  return normalizePhoneNumber(value) !== null;
}
