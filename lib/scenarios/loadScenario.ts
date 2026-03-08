import { supabase } from "@/lib/supabase/client";

export type ScenarioRow = {
  id: string;
  name: string;
  delta?: unknown;
  simulation_delta?: unknown;
  tags?: string[];
};

export async function loadScenarios(): Promise<ScenarioRow[] | null> {
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .overrideTypes<ScenarioRow[]>();
  if (error) throw error;
  return data;
}
