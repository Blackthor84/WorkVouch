"use client";

import { useEffect, useState } from "react";

interface Price {
  id: string;
  unit_amount: number | null;
  currency: string;
  productName: string;
  type: string;
}

export default function PricingPage() {
  const [prices, setPrices] = useState<Price[]>([]);

  useEffect(() => {
    fetch("/api/prices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrices(data.prices);
      })
      .catch(console.error);
  }, []);

  const handleCheckout = async (priceId: string) => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    }).then((r) => r.json());

    if (res.url) window.location.href = res.url;
    else alert("Failed to start checkout: " + res.error);
  };

  return (
    <div>
      <h1>Pricing</h1>
      <div className="pricing-grid">
        {prices.map((price) => (
          <div key={price.id} className="price-card">
            <h2>{price.productName}</h2>
            <p>
              {price.unit_amount === 0 || price.unit_amount === null
                ? "Free"
                : `$${((price.unit_amount || 0) / 100).toFixed(2)}`}
            </p>
            <button onClick={() => handleCheckout(price.id)}>Select</button>
          </div>
        ))}
      </div>
    </div>
  );
}
