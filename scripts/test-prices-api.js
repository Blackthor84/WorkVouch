// Test the /api/prices endpoint
fetch('http://localhost:3000/api/prices')
  .then(r => r.json())
  .then(data => {
    if (Array.isArray(data)) {
      console.log(`✅ Prices API working! Found ${data.length} prices:\n`);
      data.forEach((price, i) => {
        const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : '0.00';
        const type = price.recurring ? `${price.recurring.interval}ly` : 'One-time';
        console.log(`${i + 1}. ${price.id}`);
        console.log(`   Product: ${price.product?.name || price.product || 'N/A'}`);
        console.log(`   Amount: $${amount} ${price.currency.toUpperCase()}`);
        console.log(`   Type: ${type}`);
        console.log('');
      });
    } else {
      console.log('Response:', data);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Make sure the dev server is running: npm run dev');
  });
