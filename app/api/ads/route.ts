import { NextRequest, NextResponse } from 'next/server';
import { getAds, getVisibleAds, addAd, updateAd, removeAd, toggleAdVisibility, Ad } from '@/lib/ads';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const visibleOnly = searchParams.get('visible') === 'true';
  
  const ads = visibleOnly ? getVisibleAds() : getAds();
  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const newAd = addAd({
    title: data.title || 'New Ad',
    type: data.type || 'text',
    content: data.content || '',
    link: data.link,
    visible: data.visible || false,
  });
  return NextResponse.json(newAd);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  const { id, ...updates } = data;
  const updated = updateAd(id, updates);
  if (!updated) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('id') || '0');
  const success = removeAd(id);
  if (!success) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const data = await req.json();
  const { id, action } = data;
  
  if (action === 'toggle') {
    const updated = toggleAdVisibility(id);
    if (!updated) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
