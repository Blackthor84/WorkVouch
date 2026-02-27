import { supabase } from "@/lib/supabase/client";
import { logAudit } from "@/lib/audit/log";

export type SaveScenarioInput = {
  name: string;
  tags: string[];
  industry: string;
  employeeIds: string[];
  delta: unknown;
  actorId: string;
};

export async function saveScenario(input: SaveScenarioInput) {
  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      name: input.name,
      industry: input.industry,
      base_employee_ids: input.employeeIds,
      simulation_delta: input.delta,
    })
    .select()
    .single();

  if (error) throw error;

  const row = data as { id?: string };
  await logAudit(input.actorId, "scenario_saved", {
    scenarioId: row?.id,
    name: input.name,
    tags: input.tags,
  });

  return data;
}
