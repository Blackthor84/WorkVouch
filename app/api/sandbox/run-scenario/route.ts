import { NextResponse } from "next/server";
import { runSandboxScenario } from "@/lib/sandbox/runtime";

export async function POST(req: Request) {
  const { scenarioId } = await req.json();

  try {
    const result = runSandboxScenario(scenarioId);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 400 }
    );
  }
}
