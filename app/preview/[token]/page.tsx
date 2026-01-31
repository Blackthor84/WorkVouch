import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/admin";
import PreviewSimulationClient from "./PreviewSimulationClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preview — WorkVouch",
  description: "Secure preview. Read-only simulation.",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function PreviewTokenPage({ params }: Props) {
  const { token } = await params;
  if (!token?.trim()) notFound();

  const supabase = getSupabaseServer() as any;
  const { data: row, error } = await supabase
    .from("preview_sessions")
    .select("preview_role, preview_plan, preview_features, expires_at")
    .eq("token", token.trim())
    .maybeSingle();

  if (error || !row) notFound();
  const expiresAt = (row as { expires_at: string }).expires_at;
  if (new Date(expiresAt) <= new Date()) notFound();

  const previewRole = (row as { preview_role: string }).preview_role ?? "employer";
  const previewPlan = (row as { preview_plan: string }).preview_plan ?? "pro";
  const rawFeatures = (row as { preview_features: string[] | Record<string, boolean> }).preview_features;
  const previewFeatures: Record<string, boolean> = Array.isArray(rawFeatures)
    ? Object.fromEntries((rawFeatures as string[]).map((k) => [k, true]))
    : (typeof rawFeatures === "object" && rawFeatures !== null ? (rawFeatures as Record<string, boolean>) : {});

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-200">
      <PreviewSimulationClient
        previewRole={previewRole}
        previewPlan={previewPlan}
        previewFeatures={previewFeatures}
      />
    </div>
  );
}
