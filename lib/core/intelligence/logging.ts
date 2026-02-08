/**
 * Structured logging for intelligence pipeline.
 * Tags: INTEL_START, INTEL_SUCCESS, INTEL_FAIL, FRAUD_BLOCK.
 */

export const LOG_TAGS = {
  INTEL_START: "INTEL_START",
  INTEL_SUCCESS: "INTEL_SUCCESS",
  INTEL_FAIL: "INTEL_FAIL",
  FRAUD_BLOCK: "FRAUD_BLOCK",
} as const;

export type LogTag = (typeof LOG_TAGS)[keyof typeof LOG_TAGS];

export interface IntelLogPayload {
  tag: LogTag;
  context?: string;
  userId?: string;
  reviewId?: string;
  sandboxId?: string;
  error?: string;
  durationMs?: number;
  [key: string]: unknown;
}

function formatPayload(payload: IntelLogPayload): string {
  const parts = [payload.tag, payload.context ?? ""].filter(Boolean);
  const rest = Object.fromEntries(
    Object.entries(payload).filter(
      ([k, v]) => k !== "tag" && k !== "context" && v !== undefined
    )
  );
  return `${parts.join(" ")} ${JSON.stringify(rest)}`;
}

export function logIntel(payload: IntelLogPayload): void {
  try {
    if (payload.tag === LOG_TAGS.INTEL_FAIL && payload.error) {
      console.error(formatPayload(payload));
    } else {
      console.log(formatPayload(payload));
    }
  } catch {
    // no-op
  }
}
