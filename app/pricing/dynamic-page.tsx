"use client";

import { useEffect, useState } from "react";
import PriceButton from "@/components/PriceButton";

interface StripePrice {
  id: string;
  unit_amount: number | null;
  currency: string;
  nickname: string | null;
  type: "one_time" | "recurring";
}

export default function DynamicPricingPage() {
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch prices");

        const formattedPrices = data.prices.map((p: any) => ({
          id: p.unit_amount === 0 ? "free" : p.id,
          unit_amount: p.unit_amount,
          currency: p.currency,
          nickname: p.nickname || p.id,
          type: p.type,
        }));

        setPrices(formattedPrices);
      } catch (err: any) {
        console.error("Error fetching prices:", err);
        setError(err.message || "Failed to load prices");
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  if (loading) return <p>Loading pricing plans...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1>Choose Your Plan</h1>
      {prices.map((p) => (
        <PriceButton
          key={p.id}
          priceId={p.id}
          label={p.unit_amount === 0 ? `Free ($0)` : `${p.nickname} ($${((p.unit_amount || 0) / 100).toFixed(2)})`}
        />
      ))}
    </div>
  );
}
