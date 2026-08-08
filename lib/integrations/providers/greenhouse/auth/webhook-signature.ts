import { createHmac, timingSafeEqual } from "crypto";

/** Verify Greenhouse Hookshot HMAC-SHA256 signature (Signature: sha256={hex}). */
export function verifyGreenhouseWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const normalized = signatureHeader.replace(/^sha256=/i, "").trim();

  if (normalized.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(normalized), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function hashWebhookPayload(rawBody: string): string {
  return createHmac("sha256", "webhook-payload").update(rawBody).digest("hex");
}
