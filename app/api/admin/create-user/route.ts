import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cooldown = new Map<string, number>();

export async function POST(req: NextRequest) {
  const admin = await getAdminContext(req);
  if (!admin?.isAdmin) return adminForbiddenResponse();

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? body.role : undefined;

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const now = Date.now();
  // HARD RATE LIMIT (30s per email)
  if (cooldown.has(cleanEmail) && now - (cooldown.get(cleanEmail) ?? 0) < 30000) {
    return NextResponse.json(
      { error: "Please wait before trying again." },
      { status: 429 }
    );
  }
  cooldown.set(cleanEmail, now);

  const supabase = getServiceRoleClient();
  const { data, error } = await (supabase as any).auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: false,
    user_metadata: role ? { role } : undefined,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}
