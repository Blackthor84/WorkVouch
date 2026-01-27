"use client";
import { useEffect, useState } from "react";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  productName: string;
  type: string;
}

export default function PricingPage() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/prices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Order the prices exactly
          const orderedIds = [
            "price_1SthM2KCZX6GjNTDUS2xAfaL",
            "price_1StgIcKCZX6GjNTDTTt2QQ6V",
            "price_1StgdKKCZX6GjNTDiDmCHXnJ",
            "price_1SthDEKCZX6GjNTDeTvMRQ6Q",
            "price_1StgiTKCZX6GjNTDA9fGuzgc",
            "price_1Sth9IKCZX6GjNTDO6Ls4UBb",
          ];
          const sortedPrices = orderedIds
            .map((id) => data.prices.find((p: Price) => p.id === id))
            .filter(Boolean);
          setPrices(sortedPrices);
        }
      })
      .catch((err) => console.error("Failed to load prices:", err))
      .finally(() => setLoading(false));
  }, []);

  const startCheckout = async (priceId: string) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Checkout failed: " + data.error);
    } catch (err: any) {
      alert("Checkout error: " + err.message);
    }
  };

  if (loading) return <p>Loading pricing...</p>;
  if (!prices.length) return <p>Unable to load pricing. Please try again later.</p>;

  return (
    <div className="pricing-grid">
      {prices.map((p) => (
        <div key={p.id} className="plan-card">
          <h3>{p.productName}</h3>
          <p>${(p.unit_amount / 100).toFixed(2)}</p>
          <button onClick={() => startCheckout(p.id)}>Choose Plan</button>
        </div>
      ))}
    </div>
  );
}
