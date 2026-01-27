import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

// Mark route as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const subscriptionStatusSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    const validationResult = subscriptionStatusSchema.safeParse({ userId });

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid userId", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    // Check for active subscription in user_subscriptions table
    const { data: subscription, error } = await supabaseAny
      .from("user_subscriptions")
      .select("status, stripe_subscription_id")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine (no subscription)
      console.error("Subscription query error:", error);
    }

    // Also check by stripe_customer_id if available
    if (!subscription) {
      const { data: profile } = await supabaseAny
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .single();

      if (profile && (profile as any).stripe_customer_id) {
        const { data: subByCustomer } = await supabaseAny
          .from("user_subscriptions")
          .select("status, stripe_subscription_id")
          .eq("stripe_customer_id", (profile as any).stripe_customer_id)
          .in("status", ["active", "trialing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (subByCustomer) {
          return NextResponse.json({ 
            success: true,
            active: true,
            status: (subByCustomer as any).status,
            subscriptionId: (subByCustomer as any).stripe_subscription_id,
          });
        }
      }
    }

    const isActive = subscription && 
      ((subscription as any).status === "active" || (subscription as any).status === "trialing");

    return NextResponse.json({ 
      success: true,
      active: !!isActive,
      status: subscription ? (subscription as any).status : null,
      subscriptionId: subscription ? (subscription as any).stripe_subscription_id : null,
    });
  } catch (error: any) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check subscription status" },
      { status: 500 },
    );
  }
}
