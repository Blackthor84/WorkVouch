// Simple script to list Stripe prices
fetch('http://localhost:3000/api/stripe/test')
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      console.log(`\n✅ Success! Found ${data.prices.length} prices:\n`);
      data.prices.forEach((price, i) => {
        const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : '0.00';
        const type = price.recurring ? `${price.recurring.interval}ly` : 'One-time';
        console.log(`${i + 1}. ${price.id}`);
        console.log(`   Amount: $${amount} ${price.currency.toUpperCase()}`);
        console.log(`   Type: ${type}`);
        console.log(`   Active: ${price.active}`);
        console.log(`   Product: ${price.product}`);
        console.log('');
      });
    } else {
      console.error('❌ Error:', data.error);
    }
  })
  .catch(err => {
    console.error('❌ Request failed:', err.message);
    console.log('\n💡 Make sure the dev server is running: npm run dev');
  });
