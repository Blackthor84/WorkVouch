import { NextResponse } from "next/server";
import { addAIScenario } from "@/lib/sandbox/runtime";

export async function POST(req: Request) {
  const { prompt } = await req.json().catch(() => ({}));
  const scenario = addAIScenario(prompt ?? "");
  return NextResponse.json({ id: scenario.id, title: scenario.title });
}
