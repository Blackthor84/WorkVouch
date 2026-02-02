import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getTierFromSubscription, getMeteredSubscriptionItemIds, getLookupQuotaForTier } from "@/lib/stripe/config";
import type { Database } from "@/types/supabase";
import Stripe from "stripe";

type EmployerAccountUpdate = Database["public"]["Tables"]["employer_accounts"]["Update"];

function getSubscriptionInterval(subscription: Stripe.Subscription): string {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  return typeof interval === "string" ? interval : "month";
}

/** Update employer plan_tier, subscription_status, subscription_interval, lookup_quota by stripe_customer_id. Uses service role. Never throws. */
async function updateEmployerFromSubscription(
  stripeCustomerId: string,
  subscription: Stripe.Subscription,
  payload?: { employerId?: string }
): Promise<void> {
  try {
    const tier = getTierFromSubscription(subscription);
    const ids = getMeteredSubscriptionItemIds(subscription);
    const subscriptionStatus = subscription.status ?? "active";
    const subscriptionInterval = getSubscriptionInterval(subscription);
    const lookupQuota = getLookupQuotaForTier(tier);
    const adminSupabase = getSupabaseServer();
    const update: EmployerAccountUpdate = {
      plan_tier: tier,
      stripe_subscription_id: subscription.id,
      subscription_status: subscriptionStatus,
      subscription_interval: subscriptionInterval,
      lookup_quota: lookupQuota,
      stripe_report_overage_item_id: ids.reportOverageItemId ?? null,
      stripe_search_overage_item_id: ids.searchOverageItemId ?? null,
      stripe_seat_overage_item_id: ids.seatOverageItemId ?? null,
    };
    if (payload?.employerId) {
      const { error } = await adminSupabase
        .from("employer_accounts")
        .update(update)
        .eq("id", payload.employerId);
      if (error) console.error("[Stripe Webhook] updateEmployerFromSubscription by id:", error.message);
    } else {
      const { error } = await adminSupabase
        .from("employer_accounts")
        .update(update)
        .eq("stripe_customer_id", stripeCustomerId);
      if (error) console.error("[Stripe Webhook] updateEmployerFromSubscription:", error.message);
    }
  } catch (e) {
    console.error("[Stripe Webhook] updateEmployerFromSubscription error:", e);
  }
}

/** Update employer plan_tier only (e.g. on subscription deleted). */
async function updateEmployerPlanTier(stripeCustomerId: string, tier: string): Promise<void> {
  try {
    const adminSupabase = getSupabaseServer();
    const { error } = await adminSupabase
      .from("employer_accounts")
      .update({ plan_tier: tier })
      .eq("stripe_customer_id", stripeCustomerId);
    if (error) console.error("[Stripe Webhook] updateEmployerPlanTier:", error.message);
  } catch (e) {
    console.error("[Stripe Webhook] updateEmployerPlanTier error:", e);
  }
}

/** Reset usage and billing cycle for employer on invoice.paid. Never throws. */
async function resetUsageForCustomer(stripeCustomerId: string, periodEnd: Date): Promise<void> {
  try {
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 1);
    const adminSupabase = getSupabaseServer();
    const { error } = await adminSupabase
      .from("employer_accounts")
      .update({
        reports_used: 0,
        searches_used: 0,
        billing_cycle_start: periodStart.toISOString(),
        billing_cycle_end: periodEnd.toISOString(),
      })
      .eq("stripe_customer_id", stripeCustomerId);
    if (error) console.error("[Stripe Webhook] resetUsageForCustomer:", error.message);
  } catch (e) {
    console.error("[Stripe Webhook] resetUsageForCustomer error:", e);
  }
}

/** Log webhook event for idempotency. Returns true if already processed. */
async function logStripeEvent(
  eventId: string,
  type: string,
  status: "processed" | "error",
  errorMessage?: string | null
): Promise<boolean> {
  try {
    const adminSupabase = getSupabaseServer();
    const { data: existing } = await adminSupabase
      .from("stripe_events")
      .select("event_id")
      .eq("event_id", eventId)
      .maybeSingle();
    if (existing) return true;
    await adminSupabase.from("stripe_events").insert({
      event_id: eventId,
      type,
      status,
      error_message: errorMessage ?? null,
    });
  } catch {
    // Table may not exist; skip
  }
  return false;
}

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }

  try {
    const alreadyProcessed = await logStripeEvent(event.id, event.type, "processed");
    if (alreadyProcessed) {
      return NextResponse.json({ received: true });
    }
  } catch {
    // Continue even if logging fails
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string,
            );
            const customerId = subscription.customer as string;
            const adminSupabase = getSupabaseServer();
            const employerId = session.metadata?.employerId as string | undefined;
            const supabaseUserId = session.metadata?.supabase_user_id as string | undefined;

            if (employerId) {
              await adminSupabase
                .from("employer_accounts")
                .update({ stripe_customer_id: customerId })
                .eq("id", employerId);
              await updateEmployerFromSubscription(customerId, subscription, { employerId });
            } else if (supabaseUserId) {
              const { data: employer } = await adminSupabase
                .from("employer_accounts")
                .select("id")
                .eq("user_id", supabaseUserId)
                .maybeSingle();
              const eaId = (employer as { id?: string } | null)?.id;
              if (eaId) {
                await adminSupabase
                  .from("employer_accounts")
                  .update({ stripe_customer_id: customerId })
                  .eq("id", eaId);
                await updateEmployerFromSubscription(customerId, subscription, { employerId: eaId });
              } else {
                await updateEmployerFromSubscription(customerId, subscription);
              }
            } else {
              await updateEmployerFromSubscription(customerId, subscription);
            }
          } catch (e) {
            console.error("[Stripe Webhook] checkout.session.completed:", e);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        try {
          const customerId = subscription.customer as string;
          await updateEmployerFromSubscription(customerId, subscription);
        } catch (e) {
          console.error(`[Stripe Webhook] ${event.type}:`, e);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        try {
          const customerId = subscription.customer as string;
          await updateEmployerPlanTier(customerId, "lite");
        } catch (e) {
          console.error("[Stripe Webhook] customer.subscription.deleted:", e);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceAny = invoice as { subscription?: string };
        const subscriptionId =
          typeof invoiceAny.subscription === "string"
            ? invoiceAny.subscription
            : (invoiceAny.subscription as unknown as { id?: string } | undefined)?.id;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const customerId = invoice.customer as string;
            await updateEmployerFromSubscription(customerId, subscription);
            const sub = subscription as { current_period_end?: number };
            const periodEndSec = sub.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
            await resetUsageForCustomer(customerId, new Date(periodEndSec * 1000));
          } catch (e) {
            console.error("[Stripe Webhook] invoice.payment_succeeded:", e);
          }
        }
        break;
      }

      case "product.created":
      case "product.updated": {
        const product = event.data.object as Stripe.Product;
        console.log(`[Stripe] ${event.type}:`, product.name, product.id);
        break;
      }

      case "price.created":
      case "price.updated": {
        const price = event.data.object as Stripe.Price;
        console.log(`[Stripe] ${event.type}:`, price.id, price.unit_amount);
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] handler error:", error);
    try {
      await logStripeEvent(
        event.id,
        event.type,
        "error",
        error instanceof Error ? error.message : String(error),
      );
    } catch {
      // ignore
    }
    return NextResponse.json({ received: true });
  }
}
