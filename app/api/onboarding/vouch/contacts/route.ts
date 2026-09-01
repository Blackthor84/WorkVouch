/**
 * PUT /api/onboarding/vouch/contacts
 * Save 1–2 coworkers (name + email and/or phone).
 */

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";
import { saveOnboardingContacts } from "@/lib/onboarding/productionSafeOnboardingContacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactInput = { display_name?: string; email?: string; phone?: string; position?: number };

function norm(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

export async function PUT(req: Request) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const user = await getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: roleRow } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (String((roleRow as { role?: string } | null)?.role ?? "").toLowerCase() === "employer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const list = Array.isArray(body.contacts) ? (body.contacts as ContactInput[]) : [];
    if (list.length < 1 || list.length > 2) {
      return NextResponse.json({ error: "Add 1 or 2 coworkers" }, { status: 400 });
    }

    const cleaned: Array<{ position: number; display_name: string; email: string | null; phone: string | null }> =
      [];

    for (let i = 0; i < list.length; i++) {
      const raw = list[i];
      const position = typeof raw.position === "number" ? raw.position : i + 1;
      if (position !== 1 && position !== 2) {
        return NextResponse.json({ error: "Invalid position" }, { status: 400 });
      }
      const display_name = norm(raw.display_name);
      const email = norm(raw.email).toLowerCase() || null;
      const phone = norm(raw.phone) || null;
      if (display_name.length < 1) {
        return NextResponse.json({ error: "Name is required for each coworker" }, { status: 400 });
      }
      if (!email && !phone) {
        return NextResponse.json({ error: "Email or phone required for each coworker" }, { status: 400 });
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: `Invalid email for ${display_name}` }, { status: 400 });
      }
      if (email && email === (user.email ?? "").toLowerCase()) {
        return NextResponse.json({ error: "You cannot add yourself" }, { status: 400 });
      }
      cleaned.push({ position, display_name, email, phone });
    }

    const positions = new Set(cleaned.map((c) => c.position));
    if (positions.size !== cleaned.length) {
      return NextResponse.json({ error: "Duplicate positions" }, { status: 400 });
    }

    const { data: jobRow } = await admin
      .from("jobs")
      .select("id, company_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const job = jobRow as { id: string; company_name: string } | null;
    const result = await saveOnboardingContacts(user.id, cleaned, job);

    if (!result.ok) {
      console.error("[onboarding/vouch/contacts]", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: result.count, storage: result.storage });
  } catch (e) {
    console.error("[onboarding/vouch/contacts]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
