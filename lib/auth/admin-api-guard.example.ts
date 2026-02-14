/**
 * Example: Admin API protection using ONLY auth metadata.
 * Use in any admin API route. Never trust UI-only checks.
 *
 * Usage in app/api/admin/.../route.ts:
 *
 *   import { getAdminFromMetadata } from "@/lib/auth/admin-from-metadata";
 *
 *   export async function GET() {
 *     const { isAdmin } = await getAdminFromMetadata();
 *     if (!isAdmin) {
 *       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *     }
 *     // ... admin-only logic
 *   }
 *
 *   export async function POST(req: NextRequest) {
 *     const { isAdmin } = await getAdminFromMetadata();
 *     if (!isAdmin) {
 *       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *     }
 *     // ... admin-only logic
 *   }
 */

import { NextResponse } from "next/server";
import { getAdminFromMetadata } from "@/lib/auth/admin-from-metadata";

export async function adminApiGuard(): Promise<NextResponse | null> {
  const { isAdmin } = await getAdminFromMetadata();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
