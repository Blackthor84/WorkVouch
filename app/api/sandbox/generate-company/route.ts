import { NextResponse } from "next/server";
import { generateMockCompany } from "@/lib/sandbox/runtime";

export async function POST() {
  return NextResponse.json(generateMockCompany());
}
