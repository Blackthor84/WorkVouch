import { NextResponse } from "next/server";
import { getScenarioPayload } from "@/lib/sandbox/runtime";

export async function POST(req: Request) {
  const { scenarioId } = await req.json();

  try {
    const payload = getScenarioPayload(scenarioId);
    return NextResponse.json(payload);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 400 }
    );
  }
}
