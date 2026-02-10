import { NextRequest } from "next/server";

/**
 * Extract IP and User-Agent from request for admin audit logging (Phase 12).
 */
export function getAuditRequestMeta(req: NextRequest): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() ?? null : req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;
  return { ipAddress: ip, userAgent };
}
