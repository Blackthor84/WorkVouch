import { cookies } from "next/headers";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const forbidden = await requireSuperadmin();
  if (forbidden) return forbidden;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const userId = typeof body?.userId === "string" ? body.userId.trim() : null;
  if (!userId) {
    return new Response("Bad Request", { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("impersonate_user", userId, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  return Response.json({ success: true });
}
