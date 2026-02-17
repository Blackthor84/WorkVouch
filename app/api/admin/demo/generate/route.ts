import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/roles";
import { APP_MODE } from "@/lib/app-mode";
import { NextResponse } from "next/server";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_PASSWORD = "DemoAccount1!Secure";

const FAKE = {
  employee: { fullName: "Demo Employee", company: "Acme Corp", title: "Operations Associate" },
  employer: { fullName: "Demo Employer", company: "Demo Company LLC", plan: "pro" as const },
  security: { fullName: "Demo Security Admin", company: "Sentinel Security Demo", plan: "security_bundle" as const },
  custom: { fullName: "Demo Custom Admin", company: "Custom Demo Corp", plan: "custom" as const },
};

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(request: Request) {
  try {
    if (APP_MODE !== "sandbox") return NextResponse.json({ error: "Demo account creation is only allowed in sandbox mode" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (!isSuperAdmin(role)) return NextResponse.json({ error: "Forbidden: superadmin only" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const type = (body?.type as string) || "";
    if (!["employee", "employer", "security", "custom"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Use employee | employer | security | custom" }, { status: 400 });
    }

    const supabase = getSupabaseServer() as any;
    const suffix = randomSuffix();
    const email = `demo-${type}-${suffix}@workvouch.demo`;
    const info = type === "employee" ? FAKE.employee : type === "security" ? FAKE.security : type === "custom" ? FAKE.custom : FAKE.employer;
    const companyName = "company" in info ? (info as { company: string }).company : (FAKE.employer as { company: string }).company;
    const plan = "plan" in info ? (info as { plan: string }).plan : "pro";

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    if (authError || !authUser?.user?.id) {
      console.error("Demo generate auth error:", authError);
      return NextResponse.json({ error: "Failed to create demo user" }, { status: 500 });
    }

    const userId = authUser.user.id;

    await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: info.fullName,
        email,
        demo_account: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    const roleValue = type === "employee" ? "user" : "employer";
    await supabase.from("profiles").update({ role: roleValue }).eq("id", userId);

    if (type !== "employee") {
      const { data: empRow } = await supabase
        .from("employer_accounts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!empRow) {
        await supabase.from("employer_accounts").insert({
          user_id: userId,
          company_name: companyName,
          plan_tier: plan,
          demo_account: true,
        });
      } else {
        await supabase.from("employer_accounts").update({ plan_tier: plan, demo_account: true }).eq("user_id", userId);
      }
    }

    return NextResponse.json({
      userId,
      email,
      type,
      message: "Demo account created. Use Impersonate to sign in as this user.",
    });
  } catch (e) {
    console.error("Demo generate error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
