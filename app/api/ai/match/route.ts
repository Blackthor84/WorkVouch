/**
 * API Route for AI-Powered Job Matching
 * POST /api/ai/match
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireAuth } from "@/lib/auth";
import { findTopMatches, calculateMatchScore } from "@/lib/ai/matching";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const {
      jobId,
      jobTitle,
      description,
      requirements,
      industry,
      location,
      candidateId,
    } = body;

    // If candidateId is provided, calculate match for that specific candidate
    if (candidateId) {
      const match = await calculateMatchScore(candidateId, {
        jobId,
        jobTitle,
        description,
        requirements,
        industry,
        location,
      });

      return NextResponse.json({ match });
    }

    // Otherwise, find top matches
    const matches = await findTopMatches(
      {
        jobId,
        jobTitle,
        description,
        requirements,
        industry,
        location,
      },
      20,
    );

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error("AI matching error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate matches" },
      { status: 500 },
    );
  }
}
