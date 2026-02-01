/**
 * POST /api/search/passport — Secure passport search. No direct client Supabase.
 * Search inputs: name, employer, industry. Requires authenticated session (employer or employee).
 * GET /api/search/passport?slug=xxx — Single passport view by slug; employer views logged to search_logs.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchPassport, getPassportViewBySlug } from "@/lib/actions/passport-search";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const employer = typeof body.employer === "string" ? body.employer.trim() : undefined;
    const industry = typeof body.industry === "string" ? body.industry.trim() : undefined;

    const { results, error } = await searchPassport({ name, employer, industry });
    if (error) {
      return NextResponse.json({ error, results: [] }, { status: 400 });
    }
    return NextResponse.json({ results });
  } catch (e) {
    console.error("Passport search error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const response = await getPassportViewBySlug(slug);
    if ("error" in response && response.error) {
      if (response.error === "Profile not found") {
        return NextResponse.json({ error: response.error }, { status: 404 });
      }
      return NextResponse.json({ error: response.error }, { status: 400 });
    }
    return NextResponse.json(response);
  } catch (e) {
    console.error("Passport view error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
