/**
 * Sandbox/demo isolation: returns true ONLY when demo/sandbox data is allowed.
 * Use this to gate all demo/mock/fake data loaders — if false, return null and never expose demo data.
 *
 * Production: organization.mode !== "sandbox" and user.is_demo !== true → false (real data only).
 * Sandbox/demo: organization.mode === "sandbox" OR user.is_demo === true → true (demo data allowed).
 */

export interface IsSandboxOrgOrganization {
  mode?: string | null;
}

export interface IsSandboxOrgUser {
  is_demo?: boolean | null;
}

export function isSandboxOrg(params: {
  organization?: IsSandboxOrgOrganization | null;
  user?: IsSandboxOrgUser | null;
}): boolean {
  const { organization, user } = params;
  if (organization?.mode === "sandbox") return true;
  if (user?.is_demo === true) return true;
  return false;
}
