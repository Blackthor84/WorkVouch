import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const filterCoworkersSchema = z.object({
  startDate: z.string(), // ISO date string
  endDate: z.string().optional().nullable(), // ISO date string or null
  potentialCoworkerJobs: z.array(z.any()).optional().default([]), // Array of job objects
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const validatedData = filterCoworkersSchema.parse(data);

    const startDate = new Date(validatedData.startDate);
    const endDate = validatedData.endDate
      ? new Date(validatedData.endDate)
      : new Date();

    const potentialCoworkers = (validatedData.potentialCoworkerJobs || [])
      .filter((job: any) => {
        const jobStart = new Date(job.start_date);
        const jobEnd = job.end_date ? new Date(job.end_date) : new Date();
        return jobStart <= endDate && jobEnd >= startDate;
      })
      .map((job: any) => ({
        userId: job.user_id,
        name: job.profiles?.full_name || null,
        email: job.profiles?.email || null,
        jobTitle: job.job_title,
        startDate: job.start_date,
        endDate: job.end_date,
      }));

    return NextResponse.json({ potentialCoworkers });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Filter coworkers error:", error);
    return NextResponse.json(
      { error: "Failed to filter coworkers" },
      { status: 500 },
    );
  }
}
