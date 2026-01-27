import Stripe from "stripe";

/**
 * Stripe client initialization
 * 
 * This is the centralized Stripe instance used throughout the application.
 * Ensure STRIPE_SECRET_KEY is set in your environment variables.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});
