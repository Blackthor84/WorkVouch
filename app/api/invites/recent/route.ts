import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
};

/**
 * GET /api/invites/recent
 *
 * Same idea as:
 * `invites.select("contact, status, created_at").order(...).limit(10)`
 *
 * WorkVouch: **`coworker_invites`** with **`email` / `phone`** (no single `contact` column).
 * Scoped to the **signed-in user** as `sender_id`. Uses **`admin`** for the query.
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await admin
    .from("coworker_invites")
    .select("email, phone, status, created_at")
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const recent = ((data ?? []) as Row[]).map((row) => {
    const email = (row.email ?? "").trim();
    const phone = (row.phone ?? "").trim();
    const contact = email || phone || "";
    return {
      contact: contact || "(no contact)",
      status: row.status,
      created_at: row.created_at,
    };
  });

  return NextResponse.json({ recent });
}
