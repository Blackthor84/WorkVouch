import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createServerSupabase } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );

          const employerId = session.metadata?.employerId;
          const planTier = session.metadata?.planTier || session.metadata?.plan;

          if (employerId && planTier) {
            const supabase = createServerSupabase();
            const supabaseAny = supabase as any;

            // Map tier IDs to plan_tier values (removed enterprise)
            const planTierMap: Record<string, string> = {
              starter: "starter",
              team: "team",
              pro: "pro",
              "security-bundle": "security-bundle",
              "pay-per-use": "pay-per-use",
              free: "free",
            };

            const mappedTier = planTierMap[planTier.toLowerCase()] || planTier || "free";

            await supabaseAny
              .from("employer_accounts")
              .update({
                plan_tier: mappedTier,
                stripe_customer_id: subscription.customer as string,
              })
              .eq("id", employerId);
          } else if (session.customer_email) {
            // Fallback: find employer by email if metadata not available
            const supabase = createServerSupabase();
            const supabaseAny = supabase as any;

            type ProfileRow = { id: string };
            const { data: profile } = await supabaseAny
              .from("profiles")
              .select("id")
              .eq("email", session.customer_email)
              .single();

            if (profile) {
              const profileTyped = profile as ProfileRow;
              const planTier = session.metadata?.tierId || session.metadata?.plan || "free";
              const planTierMap: Record<string, string> = {
                starter: "starter",
                team: "team",
                pro: "pro",
                "security-bundle": "security-bundle",
                "pay-per-use": "pay-per-use",
                free: "free",
              };
              const mappedTier = planTierMap[planTier.toLowerCase()] || "free";

              await supabaseAny
                .from("employer_accounts")
                .update({
                  plan_tier: mappedTier,
                  stripe_customer_id: subscription.customer as string,
                })
                .eq("user_id", profileTyped.id);
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const supabase = createServerSupabase();
        const supabaseAny = supabase as any;
        type EmployerAccountRow = { id: string };
        const { data: employer } = await supabaseAny
          .from("employer_accounts")
          .select("id")
          .eq("stripe_customer_id", subscription.customer as string)
          .single();

        if (employer) {
          const employerTyped = employer as EmployerAccountRow;
          // Determine plan tier from subscription metadata or price ID
          const tierId = subscription.metadata?.tierId || "free";
          const planTierMap: Record<string, string> = {
            starter: "starter",
            team: "team",
            pro: "pro",
            "security-bundle": "security-bundle",
            free: "free",
          };
          const planTier = subscription.status === "active" 
            ? (planTierMap[tierId.toLowerCase()] || "free")
            : "free";

          await supabaseAny
            .from("employer_accounts")
            .update({ plan_tier: planTier })
            .eq("id", employerTyped.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const supabase = createServerSupabase();
        const supabaseAny = supabase as any;
        type EmployerAccountRow = { id: string };
        const { data: employer } = await supabaseAny
          .from("employer_accounts")
          .select("id")
          .eq("stripe_customer_id", subscription.customer as string)
          .single();

        if (employer) {
          const employerTyped = employer as EmployerAccountRow;
          await supabaseAny
            .from("employer_accounts")
            .update({ plan_tier: "free" })
            .eq("id", employerTyped.id);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Update subscription status on successful payment
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          const supabase = createServerSupabase();
          const supabaseAny = supabase as any;
          
          const { data: employer } = await supabaseAny
            .from("employer_accounts")
            .select("id")
            .eq("stripe_customer_id", invoice.customer as string)
            .single();

          if (employer) {
            const tierId = subscription.metadata?.tierId || "free";
            const planTierMap: Record<string, string> = {
              starter: "starter",
              team: "team",
              pro: "pro",
              "security-bundle": "security-bundle",
              free: "free",
            };
            const planTier = planTierMap[tierId.toLowerCase()] || "free";

            await supabaseAny
              .from("employer_accounts")
              .update({ plan_tier: planTier })
              .eq("id", employer.id);
          }
        }
        break;
      }

      case "product.created":
      case "product.updated": {
        // Log product changes for reference
        const product = event.data.object as Stripe.Product;
        console.log(`Product ${event.type}:`, product.name, product.id);
        break;
      }

      case "price.created":
      case "price.updated": {
        // Log price changes for reference
        const price = event.data.object as Stripe.Price;
        console.log(`Price ${event.type}:`, price.id, price.unit_amount);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
