import Stripe from "stripe";

/**
 * Stripe client initialization
 *
 * Uses a valid API version.
 * Ensure STRIPE_SECRET_KEY is set in your environment variables.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});
