/** PostgREST: relation not found in schema cache (table absent in this project). */
export const PGRST_TABLE_MISSING = "PGRST205";

/** PostgREST: column not found in schema cache (column absent in this project). */
export const PGRST_COLUMN_MISSING = "PGRST204";

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
  if (error.code === "42703" || error.code === PGRST_COLUMN_MISSING) return true;
  const message = String(error.message ?? "").toLowerCase();
  if (message.includes("does not exist")) return true;
  return (
    message.includes("could not find") &&
    message.includes("column") &&
    message.includes("schema cache")
  );
}

export function isSchemaMismatchError(error: PostgrestErrorLike): boolean {
  return isMissingTableError(error) || isMissingColumnError(error);
}

/** Parse PostgREST/Postgres missing-column errors, e.g. profiles.industry → industry */
export function missingColumnFromError(error: PostgrestErrorLike): string | null {
  if (!error) return null;
  const message = String(error.message ?? "");
  const postgresMatch = message.match(/column (?:[\w.]+\.)?(\w+) does not exist/i);
  if (postgresMatch?.[1]) return postgresMatch[1];
  const pgrstMatch = message.match(/could not find the '(\w+)' column of/i);
  return pgrstMatch?.[1] ?? null;
}
