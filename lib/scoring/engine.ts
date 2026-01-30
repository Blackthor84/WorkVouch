import { getActiveModel } from "./models";
import { gatherUserMetrics } from "./metrics";
import { calculateRehire } from "./calculators/rehire";
import { calculateIntegrity } from "./calculators/integrity";
import { calculateRisk } from "./calculators/risk";
import { calculateCompatibility } from "./calculators/compatibility";
import { getSupabaseServer } from "@/lib/supabase/admin";
import type { ScoreType } from "./types";

export async function calculateUserScore(userId: string, type: ScoreType) {
  const model = await getActiveModel(type);
  const weights = (model as { weights: Record<string, number> }).weights;
  const metrics = await gatherUserMetrics(userId);

  let result;

  switch (type) {
    case "rehire":
      result = calculateRehire(weights, metrics);
      break;
    case "integrity":
      result = calculateIntegrity(weights, metrics);
      break;
    case "risk":
      result = calculateRisk(weights, metrics);
      break;
    case "compatibility":
      result = calculateCompatibility(weights, metrics);
      break;
    default:
      throw new Error("Unsupported score type");
  }

  const supabase = getSupabaseServer() as any;
  await supabase.from("user_scores").insert({
    user_id: userId,
    model_id: (model as { id: string }).id,
    score_type: type,
    score_value: result.score,
    breakdown: result.breakdown,
  });

  return result;
}
