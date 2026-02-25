import { NextResponse } from "next/server";
import { addCustomScenario } from "@/lib/sandbox/runtime";

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}));
  addCustomScenario(data);
  return NextResponse.json({ success: true });
}
