import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { getEffectiveRoles } from "@/lib/permissions/requireRole";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { type OrgSwitcherItem } from "./navbar-client";
import { NavbarClientDynamic } from "./navbar-client-dynamic";

export async function NavbarServer() {
  const admin = await getAdminContext();
  const showAdmin = admin.isAdmin;
  const showSandboxAdmin = admin.appEnvironment === "sandbox" && admin.isAdmin;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getCurrentUserProfile() : null;
  const role = profile?.role ?? null;
  let orgSwitcherItems: OrgSwitcherItem[] | null = null;
  if (user?.id) {
    const effectiveRoles = await getEffectiveRoles(user.id);
    if (effectiveRoles.includes("org_admin") || effectiveRoles.includes("enterprise_owner")) {
      const { data: euOrgs } = await (supabase as any)
        .from("employer_users")
        .select("organization_id")
        .eq("profile_id", user.id);
      const { data: tenantRows } = await (supabase as any)
        .from("tenant_memberships")
        .select("organization_id")
        .eq("user_id", user.id)
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
  const impersonating = Boolean((user as { user_metadata?: { impersonating?: boolean } } | null)?.user_metadata?.impersonating);
  return (
    <NavbarClientDynamic
      user={user ?? undefined}
      role={role ?? undefined}
      showAdmin={showAdmin}
      showSandboxAdmin={showSandboxAdmin}
      orgSwitcherItems={orgSwitcherItems}
      impersonating={impersonating}
    />
  );
}
