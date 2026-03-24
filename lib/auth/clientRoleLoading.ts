/**
 * Client-side: `role === undefined` means profile role is not resolved yet (wait).
 * `null` = no session / no role in context (after load).
 * `"pending"` = signed in, must complete choose-role.
 */

export function isClientRoleLoading(loading: boolean, role: string | null | undefined): boolean {
  return loading || role === undefined;
}
