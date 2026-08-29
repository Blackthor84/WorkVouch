/** PostgREST: relation not found in schema cache (table absent in this project). */
export const PGRST_TABLE_MISSING = "PGRST205";

export type PostgrestErrorLike = {
  code?: string;
  message?: string;
} | null | undefined;

export function isMissingTableError(error: PostgrestErrorLike): boolean {
  if (!error) return false;
  if (error.code === PGRST_TABLE_MISSING) return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("could not find") && message.includes("schema cache");
}

export function isMissingColumnError(error: PostgrestErrorLike): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  return String(error.message ?? "").includes("does not exist");
}

export function isSchemaMismatchError(error: PostgrestErrorLike): boolean {
  return isMissingTableError(error) || isMissingColumnError(error);
}
