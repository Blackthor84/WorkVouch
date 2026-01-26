import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/reviews/:id
 * Get a single review by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    const { data, error } = await supabaseAny
      .from("employee_reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Review not found" },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Review fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews/[id]?employee_id=xxx
 * Get all reviews for a specific employee
 * Alternative endpoint: GET /api/reviews?employee_id=xxx
 */
export async function GET_EMPLOYEE_REVIEWS(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = req.nextUrl.searchParams;
    const filterBy = searchParams.get("filter"); // "employee" or "employer"

    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    let query = supabaseAny
      .from("employee_reviews")
      .select("*");

    if (filterBy === "employee") {
      query = query.eq("employee_id", id);
    } else {
      // Default: filter by employer_id
      query = query.eq("employer_id", id);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch reviews" },
        { status: 400 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Review fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/:id
 * Delete a review (admin or employee who created it)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    const { error } = await supabaseAny
      .from("employee_reviews")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to delete review" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Review deleted" 
    });
  } catch (error: any) {
    console.error("Review deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
