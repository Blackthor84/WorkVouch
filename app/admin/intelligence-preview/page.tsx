import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { AdminIntelligencePreviewClient } from "./AdminIntelligencePreviewClient";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminIntelligencePreviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const roles = (session.user as { roles?: string[] }).roles ?? [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");
  if (!isAdmin) redirect("/dashboard");

  const supabase = getSupabaseServer() as any;
  const { data: profiles } = await supabase.from("profiles").select("id, email, full_name").order("created_at", { ascending: false }).limit(100);
  const candidateList = (profiles ?? []) as { id: string; email?: string; full_name?: string }[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-2">Intelligence Preview</h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Admin-only view of team fit, risk modeling, network density, and hiring confidence.
      </p>
      <AdminIntelligencePreviewClient candidateList={candidateList} />
    </div>
  );
}
