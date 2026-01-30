import { getSupabaseServer } from "@/lib/supabase/admin";

export async function getActiveModel(scoreType: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await (supabase as any)
    .from("scoring_models")
    .select("*")
    .eq("score_type", scoreType)
    .eq("is_active", true)
    .single();

  if (error) throw error;
  return data;
}
