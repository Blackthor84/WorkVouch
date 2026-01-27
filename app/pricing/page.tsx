"use client";

import { useEffect, useState } from "react";

interface Price {
  id: string;
  unit_amount: number | null;
  currency: string;
  productName: string;
  type: "recurring" | "one_time";
}

export default function PricingPage() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPrices() {
      try {
        const res = await fetch("/api/prices");

        if (!res.ok) {
          throw new Error("Failed to load prices");
        }

        const data = await res.json();
        console.log("Loaded prices:", data);

        if (!data.success) {
          throw new Error(data.error || "API returned success=false");
        }

        setPrices(data.prices || []);
      } catch (err: any) {
        console.error("Failed to fetch prices:", err);
        setError(err.message || "Unable to load pricing. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadPrices();
  }, []);

  async function startCheckout(priceId: string) {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      console.log("Checkout response:", data);

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Checkout error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">
          WorkVouch Pricing
        </h1>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 font-semibold text-lg">{error}</p>
            <p className="text-gray-600 mt-2">Please refresh the page or try again later.</p>
          </div>
        )}

        {!loading && !error && prices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prices.map((price) => {
              const amount = price.unit_amount || 0;
              const isFree = amount === 0;
              const isRecurring = price.type === "recurring";

              return (
                <div
                  key={price.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col justify-between border-2 border-gray-100"
                >
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">
                      {price.productName}
                    </h2>

                    <div className="mb-6">
                      <p className="text-4xl font-extrabold text-gray-900 mb-2">
                        {isFree ? (
                          "Free"
                        ) : (
                          `$${(amount / 100).toFixed(2)}`
                        )}
                      </p>
                      {isRecurring && !isFree && (
                        <p className="text-gray-600 text-sm">/month</p>
                      )}
                      {!isRecurring && !isFree && (
                        <p className="text-gray-600 text-sm">One-time payment</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => startCheckout(price.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mt-6"
                  >
                    {isFree ? "Get Started" : "Subscribe Now"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && prices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No pricing plans available at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
