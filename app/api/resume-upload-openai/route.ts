import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Mark route as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// READ VARIABLES (Works on Vercel)
const supabaseUrl = process.env.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl) {
  throw new Error('Missing supabaseUrl (set supabaseUrl or NEXT_PUBLIC_SUPABASE_URL)')
}
if (!supabaseKey) {
  throw new Error('Missing supabaseKey (set supabaseKey or SUPABASE_SERVICE_ROLE_KEY)')
}
if (!openaiKey) {
  throw new Error('Missing OPENAI_API_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiKey })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // ---- STEP 1: Extract text from file ----
    // Read file as text (for PDF, we'll need to extract text first)
    // For now, convert to text - in production, use pdf-parse or similar
    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)
    
    // Extract text based on file type
    let rawText: string
    if (file.type === 'application/pdf') {
      const { extractTextFromPDF } = await import('@/lib/utils/resume-parser')
      rawText = await extractTextFromPDF(buffer)
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { extractTextFromDOCX } = await import('@/lib/utils/resume-parser')
      rawText = await extractTextFromDOCX(buffer)
    } else {
      // For text files, read directly
      rawText = buffer.toString('utf-8')
    }
    
    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from file. The file may be corrupted or password-protected.' },
        { status: 400 }
      )
    }

    // ---- STEP 2: Clean + Structure Work History ----
    const jobInfo = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Extract all job titles, companies, dates, duties, and skills from this resume. Return JSON only.\n\n${rawText.substring(0, 15000)}`, // Limit text length
        },
      ],
      response_format: { type: 'json_object' },
    })

    const extracted = JSON.parse(jobInfo.choices[0]?.message?.content || '{}')

    // ---- STEP 3: Save to Supabase ----
    const supabaseAny = supabase as any
    const { error } = await supabaseAny
      .from('resumes')
      .insert([{
        user_id: userId,
        raw_text: rawText,
        extracted_data: extracted,
        uploaded_at: new Date().toISOString(),
      }])

    if (error) {
      console.error('DB insert error:', error)
      return NextResponse.json(
        { error: 'DB insert failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        extracted,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Resume Upload Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
