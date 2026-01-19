// This route is disabled - Supabase handles authentication
// Next.js will still try to load this file, so we return 404

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'This route is not used. WorkVouch uses Supabase Auth.' },
    { status: 404 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'This route is not used. WorkVouch uses Supabase Auth.' },
    { status: 404 }
  )
}
