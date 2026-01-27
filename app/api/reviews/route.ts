import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/reviews
 * Create a new employee review for an employer
 * 
 * Supports both anonymous and verified reviews:
 * - If anonymous=true, employee_id is optional and will not be exposed in responses
 * - If anonymous=false, employee_id is required for verified reviews
 * 
 * Request body:
 * {
 *   employee_id?: string (required if anonymous=false)
 *   employer_id: string (required)
 *   rating: number (1-5, required)
 *   comment?: string (optional)
 *   anonymous: boolean (default: false)
 * }
 * 
 * Response: 201 Created with review data (employee_id hidden if anonymous)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employee_id, employer_id, rating, comment, anonymous } = body;

    // Validation: employer_id and rating are always required
    if (!employer_id || rating === undefined) {
      return NextResponse.json(
        { error: "employer_id and rating are required" },
        { status: 400 }
      );
    }

    // If not anonymous, employee_id must be provided
    if (!anonymous && !employee_id) {
      return NextResponse.json(
        { error: "employee_id is required when anonymous is false" },
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

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    // Build review data object
    const reviewData: {
      employer_id: string;
      rating: number;
      comment: string | null;
      anonymous: boolean;
      employee_id?: string;
    } = {
      employer_id,
      rating,
      comment: comment?.trim() || null,
      anonymous: anonymous || false,
    };

    // Only include employee_id if provided (for verified reviews)
    if (employee_id) {
      reviewData.employee_id = employee_id;
    }

    // Insert the review
    const { data, error } = await supabaseAny
      .from("employee_reviews")
      .insert([reviewData])
      .select()
      .single();

    if (error) {
      console.error("Error inserting review:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create review" },
        { status: 400 }
      );
    }

    // Return response - hide employee_id if anonymous
    const responseData: any = {
      id: data.id,
      employer_id: data.employer_id,
      rating: data.rating,
      comment: data.comment,
      anonymous: data.anonymous,
      created_at: data.created_at,
    };

    // Only include employee_id if not anonymous
    if (!data.anonymous && data.employee_id) {
      responseData.employee_id = data.employee_id;
    }

    return NextResponse.json(
      {
        success: true,
        review: responseData,
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
 * GET /api/reviews?employer_id=xxx OR ?employee_id=xxx
 * Get all reviews for a specific employer or employee
 * 
 * Query parameters:
 * - employer_id: string (optional, filter by employer)
 * - employee_id: string (optional, filter by employee)
 * 
 * At least one query parameter is required.
 * 
 * Response: Array of reviews (employee_id hidden for anonymous reviews)
 * Sorted by created_at descending (newest first)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const employer_id = searchParams.get("employer_id");
    const employee_id = searchParams.get("employee_id");

    // At least one filter is required
    if (!employer_id && !employee_id) {
      return NextResponse.json(
        { error: "employer_id or employee_id query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    // Build query
    let query = supabaseAny.from("employee_reviews").select("*");

    // Apply filters
    if (employer_id) {
      query = query.eq("employer_id", employer_id);
    }
    if (employee_id) {
      query = query.eq("employee_id", employee_id);
    }

    // Order by newest first
    query = query.order("created_at", { ascending: false });

    const { data: reviews, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching reviews:", fetchError);
      return NextResponse.json(
        { error: fetchError.message || "Failed to fetch reviews" },
        { status: 400 }
      );
    }

    // Sanitize response: hide employee_id for anonymous reviews
    const sanitizedReviews = (reviews || []).map((review: any) => {
      const sanitized: any = {
        id: review.id,
        employer_id: review.employer_id,
        rating: review.rating,
        comment: review.comment,
        anonymous: review.anonymous,
        created_at: review.created_at,
      };

      // Only include employee_id if review is not anonymous
      if (!review.anonymous && review.employee_id) {
        sanitized.employee_id = review.employee_id;
      }

      return sanitized;
    });

    return NextResponse.json(sanitizedReviews, { status: 200 });
  } catch (error: any) {
    console.error("Review fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
