import { NextResponse } from "next/server";
import { listAllScenarios } from "@/lib/sandbox/runtime";

export async function GET() {
  return NextResponse.json(
    listAllScenarios().map((s) => ({
      id: s.id,
      title: s.title,
    }))
  );
}
