import { supabase } from "@/lib/supabase/client";

export type SaveScenarioInput = {
  name: string;
  industry: string;
  employeeIds: string[];
  delta: Record<string, unknown>;
};

export async function saveScenario(input: SaveScenarioInput) {
  const { data, error } = await supabase.from("scenarios").insert({
    name: input.name,
    industry: input.industry,
    base_employee_ids: input.employeeIds,
    simulation_delta: input.delta,
  }).select();
  if (error) throw error;
  return data;
}
