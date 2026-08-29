/** PostgREST: relation not found in schema cache (table absent in this project). */
export const PGRST_TABLE_MISSING = "PGRST205";

export type HiringOutcomeStatusResponse = {
  /** When false, hiring outcome feedback is not deployed (production-safe default). */
  available: boolean;
  /** Whether to show the optional outcome prompt to the employer. */
  showPrompt: boolean;
};

export function isHiringOutcomeFeedbackTableMissingError(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false;
  if (error.code === PGRST_TABLE_MISSING) return true;
  const message = String(error.message ?? "").toLowerCase();
  return (
    message.includes("hiring_outcome_feedback") &&
    (message.includes("could not find") || message.includes("schema cache"))
  );
}

/**
 * Map hiring_outcome_feedback lookup to API status.
 * Missing table (PGRST205) → feature unavailable, do not show prompt.
 */
export function resolveHiringOutcomeStatusFromQuery(
  data: { id?: string } | null,
  error: { code?: string; message?: string } | null
): HiringOutcomeStatusResponse {
  if (isHiringOutcomeFeedbackTableMissingError(error)) {
    return { available: false, showPrompt: false };
  }
  if (error) {
    throw new Error(error.message ?? "Failed to check hiring outcome status");
  }
  return { available: true, showPrompt: !data };
}
