import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/reviews/employer
 * Create an anonymous employer review
 * 
 * This endpoint is specifically for employees to leave anonymous reviews about employers.
 * All reviews created through this endpoint are forced to be anonymous.
 * 
 * Request body:
 * {
 *   employer_id: string (required)
 *   rating: number (1-5, required)
 *   comment?: string (optional, max 2000 chars)
 * }
 * 
 * Response: 201 Created with review data (employee_id is never included)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employer_id, rating, comment } = body;

    // Validation: employer_id and rating are required
    if (!employer_id || rating === undefined) {
      return NextResponse.json(
        { error: "employer_id and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating range (1-5 integer)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate comment length if provided
    if (comment && comment.length > 2000) {
      return NextResponse.json(
        { error: "comment must be less than 2000 characters" },
        { status: 400 }
      );
    }

    // Verify employer exists
    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    const { data: employer, error: employerError } = await supabaseAny
      .from("employer_accounts")
      .select("id")
      .eq("id", employer_id)
      .single();

    if (employerError || !employer) {
      return NextResponse.json(
        { error: "Invalid employer_id" },
        { status: 404 }
      );
    }

    // Create anonymous review (employee_id is NOT stored)
    const { data: review, error: insertError } = await supabaseAny
      .from("employee_reviews")
      .insert({
        employer_id,
        rating,
        comment: comment || null,
        anonymous: true, // Always anonymous for this endpoint
        // employee_id is explicitly NOT included
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating review:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create review" },
        { status: 500 }
      );
    }

    // Return sanitized response (never include employee_id)
    const sanitized = {
      id: review.id,
      employer_id: review.employer_id,
      rating: review.rating,
      comment: review.comment,
      anonymous: true,
      created_at: review.created_at,
    };

    return NextResponse.json(sanitized, { status: 201 });
  } catch (error: any) {
    console.error("Review creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews/employer?employer_id=xxx
 * Get all anonymous reviews for an employer
 * 
 * Query parameters:
 * - employer_id: string (required)
 * 
 * Response: Array of reviews (employee_id is never included)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const employer_id = searchParams.get("employer_id");

    if (!employer_id) {
      return NextResponse.json(
        { error: "employer_id query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    const { data: reviews, error } = await supabaseAny
      .from("employee_reviews")
      .select("*")
      .eq("employer_id", employer_id)
      .eq("anonymous", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    // Sanitize: never include employee_id
    const sanitized = (reviews || []).map((review: any) => ({
      id: review.id,
      employer_id: review.employer_id,
      rating: review.rating,
      comment: review.comment,
      anonymous: true,
      created_at: review.created_at,
    }));

    return NextResponse.json(sanitized, { status: 200 });
  } catch (error: any) {
    console.error("Review fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
