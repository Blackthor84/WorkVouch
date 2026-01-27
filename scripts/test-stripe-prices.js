require('dotenv').config({ path: './.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
  apiVersion: "2025-12-15.clover" 
});

async function testPrices() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ STRIPE_SECRET_KEY is not set in .env.local");
      process.exit(1);
    }

    console.log("🔍 Testing Stripe connection...");
    console.log("📝 STRIPE_SECRET_KEY (last 8 chars):", process.env.STRIPE_SECRET_KEY?.slice(-8));

    const prices = await stripe.prices.list({ limit: 10 });
    
    if (!prices.data || prices.data.length === 0) {
      console.log("⚠️  No prices found in Stripe account");
      return;
    }

    console.log(`✅ Successfully fetched ${prices.data.length} prices:`);
    prices.data.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.id} - $${(p.unit_amount || 0) / 100} ${p.currency.toUpperCase()}`);
    });
  } catch (err) {
    console.error("❌ Stripe connection failed:", err.message);
    if (err.type === 'StripeAuthenticationError') {
      console.error("   → Check your STRIPE_SECRET_KEY in .env.local");
    }
    process.exit(1);
  }
}

testPrices();
