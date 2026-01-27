import Stripe from "stripe";

/**
 * Stripe client initialization
 *
 * Uses a valid API version.
 * Throws an error if STRIPE_SECRET_KEY is not defined.
 */
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is not defined. Please set it in your environment variables."
  );
}

// Log masked key in development to confirm it's loaded
if (process.env.NODE_ENV === "development") {
  const maskedKey = process.env.STRIPE_SECRET_KEY.substring(0, 7) + "..." + process.env.STRIPE_SECRET_KEY.slice(-4);
  console.log("[Stripe] Initialized with key:", maskedKey);
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});
