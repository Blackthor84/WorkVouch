/**
 * Script to create all WorkVouch pricing plans in Stripe
 * 
 * Usage:
 * 1. Set your Stripe secret key in .env.local: STRIPE_SECRET_KEY=sk_test_...
 * 2. Run: npx tsx scripts/create-stripe-plans.ts
 * 
 * This will create all products and prices in your Stripe account.
 */

import Stripe from "stripe";
import { allPlans } from "../lib/stripe/pricing-plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

async function createStripePlans() {
  console.log("🚀 Creating WorkVouch pricing plans in Stripe...\n");

  for (const plan of allPlans) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: plan.metadata,
      });

      console.log(`✅ Created product: ${plan.name} (${product.id})`);

      // Create price
      if (plan.interval === "one_time") {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price * 100), // Convert to cents
          currency: plan.currency,
        });
        console.log(`   ✅ Created one-time price: $${plan.price} (${price.id})\n`);
      } else {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price * 100),
          currency: plan.currency,
          recurring: {
            interval: plan.interval,
          },
        });
        console.log(
          `   ✅ Created recurring price: $${plan.price}/${plan.interval} (${price.id})\n`
        );
      }
    } catch (error: any) {
      console.error(`❌ Error creating ${plan.name}:`, error.message);
      if (error.code === "resource_already_exists") {
        console.log(`   ⚠️  Plan already exists, skipping...\n`);
      } else {
        console.log(`   ❌ Full error:`, error);
      }
    }
  }

  console.log("✨ Done! All plans created in Stripe.");
  console.log("\n📝 Next steps:");
  console.log("1. Copy the price IDs from above");
  console.log("2. Update stripePriceId in app/pricing/page.tsx");
  console.log("3. Test checkout flow");
}

// Run if called directly
if (require.main === module) {
  createStripePlans().catch(console.error);
}

export { createStripePlans };
