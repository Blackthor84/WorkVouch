/**
 * GET: list platform_verticals (admin only).
 * PATCH: toggle enabled for a vertical by name (admin only).
 */

import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import {
  VERTICAL_NAMES,
  VERTICAL_DISPLAY_NAMES,
  type PlatformVerticalRow,
} from "@/lib/verticals/activation";

function isAdmin(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("superadmin");
}

export const dynamic = "force-dynamic";

export async function GET() {
  const { session } = await getSupabaseSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roles = (session.user as any).roles ?? [];
  if (!isAdmin(roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = getSupabaseServer();
    const { data: rows, error } = await (supabase as any)
      .from("platform_verticals")
      .select("id, name, enabled, created_at")
      .order("name");

    if (error) {
      console.error("vertical-control GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const byName = new Map<string, PlatformVerticalRow>();
    for (const r of rows ?? []) {
      byName.set((r as PlatformVerticalRow).name, r as PlatformVerticalRow);
    }

    const list = VERTICAL_NAMES.map((name) => {
      const row = byName.get(name);
      return {
        id: row?.id,
        name,
        displayName: VERTICAL_DISPLAY_NAMES[name] ?? name,
        enabled: row ? Boolean(row.enabled) : false,
        created_at: row?.created_at,
      };
    });

    return NextResponse.json({ verticals: list });
  } catch (e) {
    console.error("vertical-control GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { session } = await getSupabaseSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roles = (session.user as any).roles ?? [];
  if (!isAdmin(roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { name?: string; enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : null;
  const enabled = typeof body.enabled === "boolean" ? body.enabled : undefined;

  if (!name || enabled === undefined) {
    return NextResponse.json(
      { error: "name (string) and enabled (boolean) required" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseServer();
    const { data: existing } = await (supabase as any)
      .from("platform_verticals")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (existing?.id) {
      const { error: updateError } = await (supabase as any)
        .from("platform_verticals")
        .update({ enabled })
        .eq("name", name);
      if (updateError) {
        console.error("vertical-control PATCH update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await (supabase as any)
        .from("platform_verticals")
        .insert({ name, enabled });
      if (insertError) {
        console.error("vertical-control PATCH insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, name, enabled });
  } catch (e) {
    console.error("vertical-control PATCH error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
