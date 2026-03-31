import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { admin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function computeTotalCost(
  salary: number,
  trainingWeeks: number,
  replacementWeeks: number
): number {
  const trainingCost = salary * (trainingWeeks / 52);
  const lostProductivity = salary * (replacementWeeks / 52);
  const rehiringCost = salary * 0.25;
  return Math.round(trainingCost + lostProductivity + rehiringCost);
}

/**
 * GET /api/hiring-calculations
 * Returns saved calculations for the signed-in user (newest first).
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await admin
    .from("hiring_calculations")
    .select("id, salary, training_weeks, replacement_weeks, total_cost, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (
      error.message.includes("does not exist") ||
      error.message.includes("schema cache")
    ) {
      return NextResponse.json({ calculations: [] });
    }
    console.error("[api/hiring-calculations] GET:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ calculations: data ?? [] });
}

type PostBody = {
  salary?: unknown;
  training_weeks?: unknown;
  replacement_weeks?: unknown;
};

function parsePositiveInt(v: unknown, max: number, label: string) {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
        ? parseInt(v, 10)
        : NaN;
  if (!Number.isFinite(n) || n < 0 || n > max) {
    return { ok: false as const, error: `Invalid ${label}` };
  }
  return { ok: true as const, value: Math.floor(n) };
}

/**
 * POST /api/hiring-calculations
 * Body: { salary, training_weeks, replacement_weeks } — total_cost is computed server-side.
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const salaryParsed = parsePositiveInt(body.salary, 100_000_000, "salary");
  if (!salaryParsed.ok || salaryParsed.value === 0) {
    return NextResponse.json(
      { error: salaryParsed.ok ? "salary must be positive" : salaryParsed.error },
      { status: 400 }
    );
  }

  const tw = parsePositiveInt(body.training_weeks, 520, "training_weeks");
  if (!tw.ok) {
    return NextResponse.json({ error: tw.error }, { status: 400 });
  }

  const rw = parsePositiveInt(body.replacement_weeks, 520, "replacement_weeks");
  if (!rw.ok) {
    return NextResponse.json({ error: rw.error }, { status: 400 });
  }

  const total_cost = computeTotalCost(
    salaryParsed.value,
    tw.value,
    rw.value
  );

  const { data, error } = await admin
    .from("hiring_calculations")
    .insert({
      user_id: user.id,
      salary: salaryParsed.value,
      training_weeks: tw.value,
      replacement_weeks: rw.value,
      total_cost,
    })
    .select("id, salary, training_weeks, replacement_weeks, total_cost, created_at")
    .single();

  if (error) {
    console.error("[api/hiring-calculations] POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ calculation: data });
}
