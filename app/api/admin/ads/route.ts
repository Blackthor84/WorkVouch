import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { v4 as uuid } from "uuid";
import { Ad } from "../../../../types/ad";

// TEMP IN-MEMORY STORE (replace with DB)
let ads: Ad[] = [];

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (!session.user?.roles?.includes("admin") &&
      !session.user?.roles?.includes("superadmin"))
  ) {
    return unauthorized();
  }
  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (!session.user?.roles?.includes("admin") &&
      !session.user?.roles?.includes("superadmin"))
  ) {
    return unauthorized();
  }
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
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (!session.user?.roles?.includes("admin") &&
      !session.user?.roles?.includes("superadmin"))
  ) {
    return unauthorized();
  }
  const data = await req.json();
  const index = ads.findIndex((ad) => ad.id === data.id);
  if (index === -1) return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  ads[index] = { ...ads[index], ...data, updatedAt: new Date().toISOString() };
  return NextResponse.json(ads[index]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (!session.user?.roles?.includes("admin") &&
      !session.user?.roles?.includes("superadmin"))
  ) {
    return unauthorized();
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  ads = ads.filter((ad) => ad.id !== id);
  return NextResponse.json({ success: true });
}
