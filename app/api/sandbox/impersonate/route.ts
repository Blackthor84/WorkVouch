import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";

export async function POST(req: Request) {
  try {
    const forbidden = await requireSuperadmin();
    if (forbidden) return forbidden;

    // 2️⃣ Parse body CORRECTLY
    const body = await req.json();
    const { id, type, name, sandboxId } = body ?? {};

    // 3️⃣ Validate ONLY what matters
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid id" },
        { status: 400 }
      );
    }

    // 4️⃣ Write impersonation cookie
    const cookieStore = await cookies();
    cookieStore.set(
      "sandbox_impersonation",
      JSON.stringify({
        id,
        type: type ?? "impersonated",
        name: name ?? null,
        sandboxId: sandboxId ?? null,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }
    );

    // 5️⃣ Success
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("IMPERSONATE ERROR:", err);
    return NextResponse.json(
      { error: "Impersonation failed" },
      { status: 400 }
    );
  }
}
