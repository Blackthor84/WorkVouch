import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateLong } from "@/lib/utils/date";
import { Database } from "@/types/database";

// Note: This page shows all profiles (users who have completed signup)
// For complete auth.users data, you'd need service role key or RPC function

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

export default async function AdminSignupsPage() {
  const isSuper = await isSuperAdmin();

  if (!isSuper) {
    redirect("/admin");
  }

  const supabase = await createServerSupabase();

  // Get all profiles (which includes user IDs)
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Get all user roles
  const { data: userRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("*");

  // Query auth.users via RPC or direct query
  // Since we can't use admin API, we'll use profiles and supplement with what we can get
  // For superadmin, RLS should allow access to all profiles

  // Get all profiles and combine with roles
  const signups = ((profiles || []) as unknown as Profile[]).map((profile: Profile) => {
    const roles =
      ((userRoles || []) as unknown as UserRole[])
        .filter((ur: UserRole) => ur.user_id === profile.id)
        .map((ur: UserRole) => ur.role) || [];

    return {
      id: profile.id,
      email: profile.email,
      emailConfirmed: true, // Assume confirmed if profile exists
      createdAt: profile.created_at,
      lastSignIn: null, // Can't access auth.users.last_sign_in_at without admin API
      fullName: profile.full_name || null,
      industry: null, // Industry not in profiles table - would need to check jobs or other tables
      role: null, // Role not in profiles table - using roles array instead
      roles: roles,
      profileCreated: true,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">All Signups</h1>
          <p className="text-[#334155]">Complete list of all user signups and accounts</p>
        </div>

        <div className="mb-4 p-4 bg-white rounded-xl border border-[#E2E8F0]">
          <p className="text-sm text-[#334155]">
            <strong>Total Signups:</strong> {signups.length} |
            <strong> Email Confirmed:</strong>{" "}
            {signups.filter((s) => s.emailConfirmed).length} |
            <strong> Profiles Created:</strong>{" "}
            {signups.filter((s) => s.profileCreated).length}
          </p>
        </div>

        <div className="space-y-4">
          {signups.map((signup) => (
            <Card key={signup.id} className="p-6 bg-white border border-[#E2E8F0]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#0F172A]">
                      {signup.fullName || "No Name"}
                    </h3>
                    {signup.emailConfirmed ? (
                      <Badge variant="success" className="text-xs">
                        Email Confirmed
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        Unconfirmed
                      </Badge>
                    )}
                    {signup.role && (
                      <Badge variant="info" className="text-xs">
                        {signup.role}
                      </Badge>
                    )}
                    {signup.roles.length > 0 && (
                      <div className="flex gap-1">
                        {signup.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="info"
                            className="text-xs bg-purple-100"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-slate-300 mb-2">
                    {signup.email}
                  </p>

                  {signup.industry && (
                    <p className="text-sm text-slate-300 mb-2">
                      Industry:{" "}
                      <span className="font-medium">{signup.industry}</span>
                    </p>
                  )}

                  <div className="flex gap-4 text-xs text-[#64748B] mt-3">
                    <span>
                      <strong>Signed Up:</strong>{" "}
                      {signup.createdAt
                        ? formatDateLong(signup.createdAt)
                        : "N/A"}
                    </span>
                    {signup.lastSignIn && (
                      <span>
                        <strong>Last Sign In:</strong>{" "}
                        {formatDateLong(signup.lastSignIn)}
                      </span>
                    )}
                    {!signup.profileCreated && (
                      <Badge variant="warning" className="text-xs">
                        No Profile
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {signups.length === 0 && (
          <Card className="p-8 text-center bg-[#111827] border border-slate-700">
            <p className="text-slate-300">No signups found.</p>
          </Card>
        )}
    </div>
  );
}
