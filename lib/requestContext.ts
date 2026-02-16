/**
 * Request context utilities for traceability (e.g. request IDs).
 */

export function getRequestId(_req: Request): string {
  return crypto.randomUUID();
}
