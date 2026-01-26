import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";

/**
 * DELETE /api/reviews/:id
 * Delete a review (admin-only or reviewer can delete their own)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id;

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    // Get the review to check ownership
    const { data: review, error: fetchError } = await supabaseAny
      .from("employee_reviews")
      .select("id, reviewer_id")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Check if user is admin
    const isAdmin =
      session?.user?.role === "admin" ||
      session?.user?.roles?.includes("admin") ||
      session?.user?.roles?.includes("superadmin");

    // Check if user is the reviewer
    const isReviewer =
      session?.user?.id && review.reviewer_id === session.user.id;

    // Only allow deletion if user is admin or the reviewer
    if (!isAdmin && !isReviewer) {
      return NextResponse.json(
        { error: "Unauthorized. Only admins or the review author can delete reviews." },
        { status: 403 }
      );
    }

    // Delete the review
    const { error: deleteError } = await supabaseAny
      .from("employee_reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      console.error("Error deleting review:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete review", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    console.error("Review deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
