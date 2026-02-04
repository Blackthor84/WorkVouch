"use client";

import { FC, useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

interface ModalProps {
  tier: string;
  price: string; // display only
  benefits: string[];
  priceId?: string; // Stripe Price ID (optional for free tiers)
  userId?: string; // Current logged-in user (optional)
  userType?: "employee" | "employer"; // User type (optional)
}

export const PricingModal: FC<ModalProps & { autoOpen?: boolean }> = ({ 
  tier, 
  price, 
  benefits, 
  priceId,
  userId,
  userType,
  autoOpen = false,
}) => {
  const [open, setOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "cancel">("idle");

  // Initialize Stripe - support both NEXT_PUBLIC_STRIPE_PK and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PK || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

  const handleCheckout = async () => {
    if (!priceId) {
      // Free tier - redirect to signup
      window.location.href = "/signup";
      return;
    }

    setLoading(true);
    setStatus("processing");

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          priceId,
          userId: userId || undefined,
          userType: userType || undefined,
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        alert("Error starting checkout: " + data.error);
        setStatus("cancel");
        setLoading(false);
        return;
      }

      // If we have Stripe.js and session ID, use redirectToCheckout
      if (data.id && stripePromise) {
        const stripe = await stripePromise;
        if (stripe) {
          const { error: redirectError } = await stripe.redirectToCheckout({
            sessionId: data.id,
          });
          
          if (redirectError) {
            console.error("Stripe redirect error:", redirectError);
            // Fallback to URL redirect
            if (data.url) {
              window.location.href = data.url;
            } else {
              alert("Error redirecting to checkout");
              setStatus("cancel");
              setLoading(false);
            }
          }
          // If redirect succeeds, status will remain "processing" until webhook updates
          return;
        }
      }

      // Fallback to URL redirect
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error starting checkout: No checkout URL available");
        setStatus("cancel");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error starting checkout");
      setStatus("cancel");
      setLoading(false);
    }
  };

  // Poll subscription status after checkout (only if userId is provided)
  useEffect(() => {
    if (!userId || status !== "processing") return;

    let interval: NodeJS.Timeout | null = null;
    let pollCount = 0;
    const maxPolls = 30; // Poll for up to 60 seconds (30 * 2s)

    interval = setInterval(async () => {
      pollCount++;
      
      try {
        const res = await fetch(`/api/subscription-status?userId=${userId}`);
        const json = await res.json();
        
        if (json.active) {
          setStatus("success");
          if (interval) clearInterval(interval);
        } else if (pollCount >= maxPolls) {
          // Stop polling after max attempts
          if (interval) clearInterval(interval);
          // Don't change status - let user check manually
        }
      } catch (error) {
        console.error("Subscription status check error:", error);
        // Continue polling on error
      }
    }, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, userId]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full bg-white text-black font-semibold py-2 px-4 rounded hover:bg-gray-100 transition"
      >
        Select Plan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full shadow-lg relative">
            <button
              onClick={() => {
                setOpen(false);
                setStatus("idle");
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 font-bold text-xl"
            >
              &times;
            </button>
            
            {status === "idle" && (
              <>
                <h2 className="text-2xl font-bold mb-2">{tier}</h2>
                <p className="text-lg font-semibold mb-4">{price}</p>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  {benefits.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Redirecting..." : priceId ? "Proceed to Payment" : "Get Started Free"}
                </button>
              </>
            )}

            {status === "processing" && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">{tier}</h2>
                <p className="text-gray-700 mb-4">Processing your subscription...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                {userId && (
                  <p className="text-sm text-gray-500 mt-4">
                    Waiting for payment confirmation...
                  </p>
                )}
              </div>
            )}

            {status === "success" && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4 text-green-700">
                  🎉 Subscription Active!
                </h2>
                <p className="text-green-700 font-semibold mb-4">
                  All {userType || "premium"} features are now unlocked.
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    setStatus("idle");
                    // Optionally redirect to dashboard
                    if (userId) {
                      window.location.href = "/dashboard";
                    }
                  }}
                  className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 transition"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}

            {status === "cancel" && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4 text-red-700">Payment Canceled</h2>
                <p className="text-red-700 mb-4">Your subscription was not processed. Please try again.</p>
                <button
                  onClick={() => {
                    setStatus("idle");
                  }}
                  className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
