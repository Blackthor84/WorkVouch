import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { v4 as uuid } from "uuid";
import { Ad } from "../../../../types/ad";

// TEMP IN-MEMORY STORE (replace with DB)
let ads: Ad[] = [];

export async function GET() {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  const data = await req.json();
  const newAd: Ad = {
    id: uuid(),
    title: data.title,
    type: data.type,
    content: data.content,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl,
    careers: data.careers || [],
    isActive: data.isActive || false,
    createdBy: data.createdBy || 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  ads.push(newAd);
  return NextResponse.json(newAd);
}

export async function PUT(req: NextRequest) {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  const data = await req.json();
  const index = ads.findIndex((ad) => ad.id === data.id);
  if (index === -1) return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  ads[index] = { ...ads[index], ...data, updatedAt: new Date().toISOString() };
  return NextResponse.json(ads[index]);
}

export async function DELETE(req: NextRequest) {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  ads = ads.filter((ad) => ad.id !== id);
  return NextResponse.json({ success: true });
}
