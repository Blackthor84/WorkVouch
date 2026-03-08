import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth/getEffectiveUser";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

export async function GET() {
  const user = await getEffectiveUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const baseData = { user: { ...user, __impersonated: user.isImpersonating } };
  const finalData = applyScenario(baseData, (authUser as any)?.user_metadata?.impersonation);
  return NextResponse.json(finalData);
}
