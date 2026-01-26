import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/reviews/:id
 * Get a single review by ID
 * 
 * Path parameters:
 * - id: string (review UUID)
 * 
 * Response: Review object (employee_id hidden if anonymous)
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

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
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Sanitize response: hide employee_id if anonymous
    const sanitized: any = {
      id: data.id,
      employer_id: data.employer_id,
      rating: data.rating,
      comment: data.comment,
      anonymous: data.anonymous,
      created_at: data.created_at,
    };

    // Only include employee_id if review is not anonymous
    if (!data.anonymous && data.employee_id) {
      sanitized.employee_id = data.employee_id;
    }

    return NextResponse.json(sanitized, { status: 200 });
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
 * Delete a review by ID
 * 
 * Path parameters:
 * - id: string (review UUID)
 * 
 * Authorization: RLS policies handle authorization
 * - Employees can delete their own reviews
 * - Admins can delete any review
 * 
 * Response: Success message
 */
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

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
      console.error("Error deleting review:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete review" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Review deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Review deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
