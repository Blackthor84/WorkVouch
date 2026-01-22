import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) throw new Error("OPENAI_API_KEY is required");

    const supabase = supabaseServer;
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileBytes = await file.arrayBuffer();
    const buffer = Buffer.from(fileBytes);

    const parsed = await openai.responses.parse({
      model: "gpt-4.1",
      input: "Extract job titles, companies, start dates, end dates, and skills from this resume.",
      file: buffer
    });

    return NextResponse.json(parsed.output, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
