import { requireAdmin } from "@/lib/admin/requireAdmin";
import { AdminIntelligencePreviewClient } from "./AdminIntelligencePreviewClient";

export const dynamic = "force-dynamic";

export default async function AdminIntelligencePreviewPage() {
  const { supabase } = await requireAdmin();
  const supabaseAny = supabase as any;
  const { data: profiles } = await supabaseAny.from("profiles").select("id, email, full_name").order("created_at", { ascending: false }).limit(100);
  const candidateList = (profiles ?? []) as { id: string; email?: string; full_name?: string }[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Intelligence Preview</h1>
      <p className="text-[#334155] mb-6">
        Admin-only view of team fit, risk modeling, network density, and hiring confidence.
      </p>
      <AdminIntelligencePreviewClient candidateList={candidateList} />
    </div>
  );
}
