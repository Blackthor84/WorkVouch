/**
 * PUT /api/onboarding/vouch/contacts
 * Save 1–2 coworkers (name + email and/or phone).
 */

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";

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

    await admin.from("worker_onboarding_contacts").delete().eq("user_id", user.id);

    const { error: insErr } = await admin.from("worker_onboarding_contacts").insert(
      cleaned.map((c) => ({
        user_id: user.id,
        position: c.position,
        display_name: c.display_name,
        email: c.email,
        phone: c.phone,
      }))
    );

    if (insErr) {
      console.error("[onboarding/vouch/contacts]", insErr);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: cleaned.length });
  } catch (e) {
    console.error("[onboarding/vouch/contacts]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
