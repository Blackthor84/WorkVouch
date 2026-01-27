// app/components/PricingButton.tsx
"use client";

import React from "react";

interface PricingButtonProps {
  priceId: string; // Stripe price ID or "free" for Free tier
  label: string;   // Button text
  disabled?: boolean;
}

export const PricingButton: React.FC<PricingButtonProps> = ({
  priceId,
  label,
  disabled = false,
}) => {
  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Failed to start checkout: ${data.error || "Unknown error"}`);
        return;
      }

      if (!data.url) {
        alert("Checkout URL not returned by server.");
        return;
      }

      // For Free tier, just redirect to success page
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(`Checkout failed: ${err.message || "Unknown error"}`);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
    >
      {label}
    </button>
  );
};
