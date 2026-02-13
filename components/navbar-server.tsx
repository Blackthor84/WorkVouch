import { getSupabaseSession } from "@/lib/supabase/server";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { getEffectiveRoles } from "@/lib/permissions/requireRole";
import { createServerSupabase } from "@/lib/supabase/server";
import { NavbarClient, type OrgSwitcherItem } from "./navbar-client";

export async function NavbarServer() {
  const { session } = await getSupabaseSession();
  const profile = session?.user ? await getCurrentUserProfile() : null;
  const roles = session?.user ? await getCurrentUserRoles() : [];
  const role = profile?.role ?? roles[0] ?? (session?.user as { role?: string })?.role ?? null;
  let orgSwitcherItems: OrgSwitcherItem[] | null = null;
  if (session?.user?.id) {
    const effectiveRoles = await getEffectiveRoles(session.user.id);
    if (effectiveRoles.includes("org_admin") || effectiveRoles.includes("enterprise_owner")) {
      const supabase = await createServerSupabase();
      const { data: euOrgs } = await (supabase as any)
        .from("employer_users")
        .select("organization_id")
        .eq("profile_id", session.user.id);
      const { data: tenantRows } = await (supabase as any)
        .from("tenant_memberships")
        .select("organization_id")
        .eq("user_id", session.user.id)
        .in("role", ["enterprise_owner", "location_admin"]);
      const orgIds = [...new Set([
        ...(euOrgs ?? []).map((r: { organization_id: string }) => r.organization_id),
        ...(tenantRows ?? []).map((r: { organization_id: string }) => r.organization_id),
      ])];
      if (orgIds.length > 0) {
        const { data: orgs } = await (supabase as any)
          .from("organizations")
          .select("id, name")
          .in("id", orgIds);
        const items: OrgSwitcherItem[] = (orgs ?? []).map((o: { id: string; name: string }) => ({
          id: o.id,
          name: o.name,
          type: "organization",
        }));
        const { data: locs } = await (supabase as any)
          .from("locations")
          .select("id, name, organization_id")
          .in("organization_id", orgIds);
        (locs ?? []).forEach((l: { id: string; name: string; organization_id: string }) => {
          items.push({
            id: l.id,
            name: l.name,
            type: "location",
            organizationId: l.organization_id,
          });
        });
        orgSwitcherItems = items;
      }
    }
  }
  const impersonating = Boolean((session as { impersonating?: boolean } | null)?.impersonating);
  return (
    <NavbarClient
      user={session?.user ?? undefined}
      roles={roles.length > 0 ? roles : (session?.user as { roles?: string[] })?.roles ?? undefined}
      role={role ?? undefined}
      orgSwitcherItems={orgSwitcherItems}
      impersonating={impersonating}
    />
  );
}
