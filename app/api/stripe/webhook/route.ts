import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { stripe } from "@/lib/stripe";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getTierFromSubscription, getMeteredSubscriptionItemIds, getLookupQuotaForTier } from "@/lib/stripe/config";
import type { Database } from "@/types/supabase";
import Stripe from "stripe";

type EmployerAccountUpdate = Database["public"]["Tables"]["employer_accounts"]["Update"];

// --- Profiles subscription (single source of truth from webhooks) ---
type ProfileSubscriptionRow = {
  id: string;
  last_stripe_event_id: string | null;
  stripe_customer_id?: string | null;
  admin_override?: boolean | null;
};
type ProfileSubscriptionUpdate = {
  subscription_tier?: string;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_period_end?: string | null;
  subscription_expires_at?: string | null;
  plan_interval?: string | null;
  grace_period_end?: string | null;
  usage_limit?: number | null;
  seat_count?: number | null;
  last_stripe_event_id?: string | null;
};

/** Usage limits by tier: Pro 1000 units, Enterprise 10000 per seat. */
const USAGE_LIMIT_PRO = 1000;
const USAGE_LIMIT_ENTERPRISE_BASE = 10000;

/** Resolve profile subscription tier from Stripe subscription + metadata: pro or enterprise. */
function getProfileTierFromSubscription(
  subscription: Stripe.Subscription,
  metadata?: Record<string, string> | null
): "pro" | "enterprise" {
  const plan = metadata?.plan?.toLowerCase();
  if (plan === "enterprise") return "enterprise";
  const productName = (subscription.items?.data?.[0]?.price?.product as string | Stripe.Product) ?? "";
  const name = typeof productName === "string" ? "" : (productName as Stripe.Product).name?.toLowerCase() ?? "";
  if (name.includes("enterprise")) return "enterprise";
  return "pro";
}

/** Seat count from subscription quantity (enterprise) or metadata; default 1. */
function getSeatCount(subscription: Stripe.Subscription, metadata?: Record<string, string> | null): number {
  const fromMeta = metadata?.seat_count ?? metadata?.seats;
  if (fromMeta !== undefined && fromMeta !== null) {
    const n = parseInt(String(fromMeta), 10);
    if (!Number.isNaN(n) && n >= 1) return n;
  }
  const qty = subscription.items?.data?.[0]?.quantity;
  return typeof qty === "number" && qty >= 1 ? qty : 1;
}

/** usage_limit = base * seat_count (Pro 1000, Enterprise 10000 * seats). */
function getUsageLimit(tier: "pro" | "enterprise", seatCount: number): number {
  const base = tier === "enterprise" ? USAGE_LIMIT_ENTERPRISE_BASE : USAGE_LIMIT_PRO;
  return base * Math.max(1, seatCount);
}

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

/** Upsert finance_subscriptions for MRR/ARR. Never throws. */
async function upsertFinanceSubscription(
  stripeCustomerId: string,
  subscription: Stripe.Subscription,
  employerId?: string
): Promise<void> {
  try {
    const adminSupabase = getSupabaseServer();
    let employer_id = employerId;
    if (!employer_id) {
      const { data: row } = await adminSupabase
        .from("employer_accounts")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .maybeSingle();
      employer_id = (row as { id?: string } | null)?.id ?? undefined;
    }
    if (!employer_id) return;
    const plan = getTierFromSubscription(subscription);
    const status = subscription.status ?? "active";
    const item = subscription.items?.data?.[0]?.price;
    const monthlyAmountCents = item?.recurring?.interval === "year"
      ? Math.round((item.unit_amount ?? 0) / 12)
      : (item?.unit_amount ?? 0);
    await adminSupabase.from("finance_subscriptions").upsert(
      {
        employer_id,
        stripe_customer_id: stripeCustomerId,
        stripe_sub_id: subscription.id,
        plan,
        status,
        monthly_amount_cents: monthlyAmountCents,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_sub_id" }
    );
  } catch (e) {
    console.error("[Stripe Webhook] upsertFinanceSubscription error:", e);
  }
}

/** Record paid invoice to finance_payments (revenue truth). Never throws. */
async function recordFinancePayment(invoice: Stripe.Invoice): Promise<void> {
  try {
    const inv = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
    const subId =
      typeof inv.subscription === "string"
        ? inv.subscription
        : (inv.subscription as { id?: string } | undefined)?.id;
    if (!subId) return;
    const adminSupabase = getSupabaseServer();
    const paidAt = (invoice as { status_transitions?: { paid_at?: number } }).status_transitions?.paid_at;
    await adminSupabase.from("finance_payments").insert({
      stripe_subscription_id: subId,
      stripe_invoice_id: invoice.id ?? null,
      amount_cents: invoice.amount_paid ?? 0,
      currency: (invoice.currency ?? "usd").toLowerCase(),
      paid_at: paidAt ? new Date(paidAt * 1000).toISOString() : new Date().toISOString(),
    });
  } catch (e) {
    console.error("[Stripe Webhook] recordFinancePayment error:", e);
  }
}

/** Get profile by Stripe customer id for webhook updates. Returns null if not found. */
async function getProfileByStripeCustomerId(customerId: string): Promise<ProfileSubscriptionRow | null> {
  const adminSupabase = getSupabaseServer();
  const { data } = await (adminSupabase as any)
    .from("profiles")
    .select("id, last_stripe_event_id, stripe_customer_id, admin_override")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data as ProfileSubscriptionRow | null;
}

/** Get profile by Supabase user id (profiles.id = auth user id). */
async function getProfileByUserId(userId: string): Promise<ProfileSubscriptionRow | null> {
  const adminSupabase = getSupabaseServer();
  const { data } = await (adminSupabase as any)
    .from("profiles")
    .select("id, last_stripe_event_id, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  return data as ProfileSubscriptionRow | null;
}

/**
 * Idempotency: if this profile was already updated by this event, skip.
 * Returns true if already processed (caller should skip update).
 */
function alreadyProcessedForProfile(profile: ProfileSubscriptionRow | null, eventId: string): boolean {
  return profile?.last_stripe_event_id === eventId;
}

/** Update profile subscription fields and set last_stripe_event_id atomically. Never throws. */
async function updateProfileSubscription(
  profileId: string,
  update: ProfileSubscriptionUpdate,
  eventId: string
): Promise<void> {
  try {
    const adminSupabase = getSupabaseServer();
    await (adminSupabase as any)
      .from("profiles")
      .update({ ...update, last_stripe_event_id: eventId })
      .eq("id", profileId);
  } catch (e) {
    console.error("[Stripe Webhook] updateProfileSubscription:", e);
  }
}

/** Plan interval from Stripe subscription: month | year. */
function getPlanInterval(subscription: Stripe.Subscription): "month" | "year" {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  return interval === "year" ? "year" : "month";
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

  // Global idempotency: skip if we already processed this event (e.g. Stripe retry).
  try {
    const alreadyProcessed = await logStripeEvent(event.id, event.type, "processed");
    if (alreadyProcessed) {
      return NextResponse.json({ received: true });
    }
  } catch {
    // Continue even if logging fails (e.g. stripe_events table missing).
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
              await upsertFinanceSubscription(customerId, subscription, employerId);
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

            // --- Profiles: single source of truth for subscription state ---
            // Map session to profile via client_reference_id or metadata.user_id (Supabase user id = profiles.id).
            const userId =
              (session.metadata?.user_id as string | undefined)?.trim() ||
              (session.client_reference_id as string | undefined)?.trim();
            if (userId) {
              const profile = await getProfileByUserId(userId);
              if (!alreadyProcessedForProfile(profile, event.id) && profile) {
                const periodEnd = (subscription as { current_period_end?: number }).current_period_end;
                const periodEndIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
                const tier = getProfileTierFromSubscription(subscription, session.metadata as Record<string, string> | null);
                const seatCount = getSeatCount(subscription, session.metadata as Record<string, string> | null);
                const usageLimit = getUsageLimit(tier, seatCount);
                await updateProfileSubscription(
                  profile.id,
                  {
                    subscription_tier: tier,
                    subscription_status: "active",
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscription.id,
                    plan_interval: getPlanInterval(subscription),
                    subscription_period_end: periodEndIso,
                    subscription_expires_at: periodEndIso,
                    usage_limit: usageLimit,
                    seat_count: seatCount,
                    grace_period_end: null,
                  },
                  event.id
                );
              }
            }
          } catch (e) {
            console.error("[Stripe Webhook] checkout.session.completed:", e);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        // Do NOT downgrade. Start 7-day grace; user keeps access. Skip if admin_override.
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          try {
            const profile = await getProfileByStripeCustomerId(customerId);
            if (profile?.admin_override) break; // Never auto-downgrade or set grace when admin override is on.
            if (profile && !alreadyProcessedForProfile(profile, event.id)) {
              const graceEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
              await updateProfileSubscription(
                profile.id,
                { subscription_status: "grace", grace_period_end: graceEnd },
                event.id
              );
            }
          } catch (e) {
            console.error("[Stripe Webhook] invoice.payment_failed:", e);
          }
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
        await recordFinancePayment(invoice);
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
        // --- Profiles: restore active and update period end ---
        const customerIdProfile =
          typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as { id?: string })?.id;
        if (customerIdProfile) {
          try {
            const profile = await getProfileByStripeCustomerId(customerIdProfile);
            if (profile && !alreadyProcessedForProfile(profile, event.id)) {
              let subscription_period_end: string | null = null;
              if (subscriptionId) {
                try {
                  const sub = await stripe.subscriptions.retrieve(subscriptionId);
                  const periodEnd = (sub as { current_period_end?: number }).current_period_end;
                  if (periodEnd) subscription_period_end = new Date(periodEnd * 1000).toISOString();
                } catch {
                  // use existing period end or leave null
                }
              }
              const periodEndVal = subscription_period_end ?? undefined;
              await updateProfileSubscription(
                profile.id,
                {
                  subscription_status: "active",
                  subscription_period_end: periodEndVal,
                  subscription_expires_at: periodEndVal,
                  grace_period_end: null,
                },
                event.id
              );
            }
          } catch (e) {
            console.error("[Stripe Webhook] invoice.payment_succeeded (profiles):", e);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        try {
          await updateEmployerFromSubscription(customerId, subscription);
          await upsertFinanceSubscription(customerId, subscription);
        } catch (e) {
          console.error(`[Stripe Webhook] ${event.type}:`, e);
        }
        // Profiles: plan/interval/seat/usage_limit changes (idempotent).
        try {
          const profile = await getProfileByStripeCustomerId(customerId);
          if (profile && !alreadyProcessedForProfile(profile, event.id)) {
            const periodEnd = (subscription as { current_period_end?: number }).current_period_end;
            const periodEndIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
            const tier = getProfileTierFromSubscription(subscription, null);
            const seatCount = getSeatCount(subscription, null);
            const usageLimit = getUsageLimit(tier, seatCount);
            await updateProfileSubscription(
              profile.id,
              {
                plan_interval: getPlanInterval(subscription),
                subscription_period_end: periodEndIso,
                subscription_expires_at: periodEndIso,
                seat_count: seatCount,
                usage_limit: usageLimit,
                stripe_subscription_id: subscription.id,
              },
              event.id
            );
          }
        } catch (e) {
          console.error(`[Stripe Webhook] ${event.type} (profiles):`, e);
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Immediately downgrade unless admin_override. Clear period, grace, usage_limit, seat_count.
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        try {
          await updateEmployerPlanTier(customerId, "lite");
        } catch (e) {
          console.error("[Stripe Webhook] customer.subscription.deleted (employer):", e);
        }
        try {
          const profile = await getProfileByStripeCustomerId(customerId);
          if (profile?.admin_override) break; // Never auto-downgrade when admin override is on.
          if (profile && !alreadyProcessedForProfile(profile, event.id)) {
            await updateProfileSubscription(
              profile.id,
              {
                subscription_tier: "free",
                subscription_status: "canceled",
                subscription_period_end: null,
                subscription_expires_at: null,
                plan_interval: null,
                grace_period_end: null,
                usage_limit: null,
                seat_count: null,
                stripe_subscription_id: null,
              },
              event.id
            );
          }
        } catch (e) {
          console.error("[Stripe Webhook] customer.subscription.deleted (profiles):", e);
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
