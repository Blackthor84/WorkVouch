import { supabase } from "@/lib/supabase/client";

export async function loadScenarios() {
  const { data, error } = await supabase.from("scenarios").select("*");
  if (error) throw error;
  return data;
}
