import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { saveScenario } from "@/lib/scenarios/saveScenario";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getAuthedUser();
    if (!user?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { name, tags, industry, employeeIds, delta } = body;
    if (!name || !Array.isArray(employeeIds) || delta === undefined) {
      return NextResponse.json({ error: "Missing name, employeeIds, or delta" }, { status: 400 });
    }
    const data = await saveScenario({
      name: String(name),
      tags: Array.isArray(tags) ? tags.map(String) : [],
      industry: String(industry ?? "healthcare"),
      employeeIds,
      delta,
      actorId: user.user.id,
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[playground/scenarios]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}
