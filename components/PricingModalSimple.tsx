"use client";

import { FC, useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

interface ModalProps {
  tier: string;
}

// Make sure your environment variable is NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const PricingModal: FC<ModalProps> = ({ tier }) => {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    if (stripePromise) {
      stripePromise.then(setStripe);
    }
  }, []);

  const handleCheckout = async () => {
    if (!stripe) return;

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });

    const session = await res.json();
    if (session.error) {
      console.error("Checkout error:", session.error);
      return;
    }

    const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
    if (error) console.error(error);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Subscribe: {tier}</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleCheckout}
          disabled={!stripe}
        >
          {stripe ? "Checkout" : "Loading..."}
        </button>
      </div>
    </div>
  );
};

export { PricingModal };
