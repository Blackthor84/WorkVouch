import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { checkPaywall } from "@/lib/middleware/paywall";

/**
 * POST /api/messages
 * Send a message to a verified coworker
 * 
 * Requires: Team, Pro, or Security Bundle plan for unlimited messaging
 * Starter plan has limited messaging
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recipientId, message, subject } = body;

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: "recipientId and message are required" },
        { status: 400 }
      );
    }

    // Get user's subscription tier
    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    // Check if user is employer or worker
    const { data: profile } = await supabaseAny
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userType = profile?.role === "employer" ? "employer" : "employee";

    // Get subscription tier
    let subscriptionTier = "free";
    if (userType === "employer") {
      const { data: employerAccount } = await supabaseAny
        .from("employer_accounts")
        .select("plan_tier")
        .eq("user_id", user.id)
        .single();

      subscriptionTier = employerAccount?.plan_tier || "free";
    }

    // Check paywall for messaging feature
    const paywallCheck = await checkPaywall(
      userType,
      subscriptionTier,
      "unlimited_messaging",
      user.email,
      user.role
    );

    if (!paywallCheck.allowed) {
      return NextResponse.json(
        {
          error: paywallCheck.reason || "Upgrade required",
          requiredTier: paywallCheck.requiredTier,
        },
        { status: 403 }
      );
    }

    // Insert message
    const { data: messageData, error } = await supabaseAny
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        subject: subject || "Message from WorkVouch",
        message: message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: messageData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/messages?conversationId=xxx
 * Get messages for a conversation
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");
    const otherUserId = searchParams.get("otherUserId");

    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    let query = supabaseAny
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (otherUserId) {
      query = query.or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
      );
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error: any) {
    console.error("Message fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
