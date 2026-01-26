import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";

/**
 * POST /api/reviews
 * Create a new employee review for an employer
 * Supports both anonymous and verified reviews
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employer_id, review_text, rating, reviewer_id, is_verified } = body;

    // Validate required fields
    if (!employer_id || !review_text || !rating) {
      return NextResponse.json(
        { error: "employer_id, review_text, and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate review text length
    if (review_text.trim().length < 10) {
      return NextResponse.json(
        { error: "review_text must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (review_text.length > 2000) {
      return NextResponse.json(
        { error: "review_text must be less than 2000 characters" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    // Check if employer exists (using employer_accounts table)
    const { data: employer, error: employerError } = await supabaseAny
      .from("employer_accounts")
      .select("id")
      .eq("id", employer_id)
      .single();

    if (employerError || !employer) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 }
      );
    }

    // If reviewer_id is provided, verify the user exists and get their info
    let verifiedStatus = is_verified || false;
    if (reviewer_id) {
      const { data: reviewer } = await supabaseAny
        .from("profiles")
        .select("id")
        .eq("id", reviewer_id)
        .single();

      if (reviewer) {
        // Check if reviewer has verified status (you can customize this logic)
        // For now, if reviewer_id is provided and user exists, mark as verified
        verifiedStatus = true;
      }
    }

    // Insert the review
    const { data: review, error: insertError } = await supabaseAny
      .from("employee_reviews")
      .insert({
        employer_id,
        reviewer_id: reviewer_id || null, // Allow null for anonymous reviews
        rating,
        review_text: review_text.trim(),
        is_verified: verifiedStatus,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting review:", insertError);
      return NextResponse.json(
        { error: "Failed to create review", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        review: {
          id: review.id,
          employer_id: review.employer_id,
          rating: review.rating,
          review_text: review.review_text,
          is_verified: review.is_verified,
          created_at: review.created_at,
          // Don't expose reviewer_id for privacy
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Review creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?employer_id=xxx
 * Get all reviews for a specific employer
 * Returns reviews sorted by newest first
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

    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    // Get all reviews for this employer, sorted by newest first
    const { data: reviews, error: fetchError } = await supabaseAny
      .from("employee_reviews")
      .select("id, rating, review_text, is_verified, created_at")
      .eq("employer_id", employer_id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching reviews:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch reviews", details: fetchError.message },
        { status: 500 }
      );
    }

    // Calculate aggregate statistics
    const totalReviews = reviews?.length || 0;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
        : 0;
    const ratingDistribution = {
      5: reviews?.filter((r: any) => r.rating === 5).length || 0,
      4: reviews?.filter((r: any) => r.rating === 4).length || 0,
      3: reviews?.filter((r: any) => r.rating === 3).length || 0,
      2: reviews?.filter((r: any) => r.rating === 2).length || 0,
      1: reviews?.filter((r: any) => r.rating === 1).length || 0,
    };

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
      statistics: {
        total_reviews: totalReviews,
        average_rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        rating_distribution: ratingDistribution,
      },
    });
  } catch (error: any) {
    console.error("Review fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
