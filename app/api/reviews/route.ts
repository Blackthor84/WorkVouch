import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/reviews
 * Create a new employee review for an employer
 * Supports both anonymous and verified reviews
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employee_id, employer_id, rating, comment, anonymous } = body;

    // Validation
    if (!employer_id || !rating) {
      return NextResponse.json(
        { error: "employer_id and rating are required" },
        { status: 400 }
      );
    }

    // employee_id is optional for anonymous reviews
    // If anonymous is false, employee_id should be provided
    if (!anonymous && !employee_id) {
      return NextResponse.json(
        { error: "employee_id is required when anonymous is false" },
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

    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    // Insert the review
    const reviewData: any = {
      employer_id,
      rating,
      comment: comment || null,
      anonymous: anonymous || false,
    };

    // Only include employee_id if provided (for verified reviews)
    if (employee_id) {
      reviewData.employee_id = employee_id;
    }
    // For anonymous reviews, employee_id is null

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

    return NextResponse.json({ 
      success: true, 
      review: {
        id: data.id,
        employee_id: data.employee_id,
        employer_id: data.employer_id,
        rating: data.rating,
        comment: data.comment,
        anonymous: data.anonymous,
        created_at: data.created_at,
      }
    }, { status: 201 });
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
    const employee_id = searchParams.get("employee_id");

    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    let query = supabaseAny
      .from("employee_reviews")
      .select("*");

    // Filter by employer_id if provided
    if (employer_id) {
      query = query.eq("employer_id", employer_id);
    }

    // Filter by employee_id if provided
    if (employee_id) {
      query = query.eq("employee_id", employee_id);
    }

    // If neither is provided, return error
    if (!employer_id && !employee_id) {
      return NextResponse.json(
        { error: "employer_id or employee_id query parameter is required" },
        { status: 400 }
      );
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

    return NextResponse.json(reviews || []);
  } catch (error: any) {
    console.error("Review fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
