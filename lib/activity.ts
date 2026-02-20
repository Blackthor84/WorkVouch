/**
 * Reusable activity logger for activity_log (user-facing, RLS).
 * Uses server Supabase client so inserts run in request auth context.
 */

import { supabaseServer } from "@/lib/supabase/server";

type InsertActivityArgs = {
  userId: string;
  action: string;
  target?: string | null;
  metadata?: Record<string, unknown> | null;
  sandboxId?: string | null;
  scenarioId?: string | null;
};

export async function insertActivityLog({
  userId,
  action,
  target,
  metadata = null,
  sandboxId = null,
  scenarioId = null,
}: InsertActivityArgs): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    target: target ?? null,
    metadata: metadata ?? null,
    sandbox_id: sandboxId ?? null,
    scenario_id: scenarioId ?? null,
  });
}
