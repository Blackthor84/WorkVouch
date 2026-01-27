// Script to list all active Stripe prices
const { stripe } = require('../lib/stripe');

async function listActivePrices() {
  try {
    if (!stripe) {
      console.error("Stripe client not initialized. Check STRIPE_SECRET_KEY.");
      process.exit(1);
    }

    console.log("Fetching all active prices from Stripe...\n");
    const prices = await stripe.prices.list({ active: true });
    
    console.log(`✅ Found ${prices.data.length} active prices:\n`);
    
    prices.data.forEach((price, index) => {
      const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : '0.00';
      const type = price.recurring ? `${price.recurring.interval}ly` : 'One-time';
      const currency = price.currency.toUpperCase();
      
      console.log(`${index + 1}. ${price.id}`);
      console.log(`   Product: ${price.product}`);
      console.log(`   Amount: $${amount} ${currency}`);
      console.log(`   Type: ${type}`);
      console.log(`   Active: ${price.active}`);
      if (price.nickname) console.log(`   Nickname: ${price.nickname}`);
      console.log('');
    });
    
    console.log(`\nTotal: ${prices.data.length} active prices`);
  } catch (error) {
    console.error("Error fetching prices:", error.message);
    process.exit(1);
  }
}

listActivePrices();
