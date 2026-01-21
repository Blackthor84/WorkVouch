import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const supabaseUrl = process.env.supabaseUrl;
    const supabaseKey = process.env.supabaseKey;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl) throw new Error("supabaseUrl is required");
    if (!supabaseKey) throw new Error("supabaseKey is required");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY is required");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
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
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
