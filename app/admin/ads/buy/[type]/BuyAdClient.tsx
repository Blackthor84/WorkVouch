"use client";

import { useParams, useRouter } from "next/navigation";
import { AD_PRICING } from "@/lib/ads/pricing";
import { useState } from "react";

export default function BuyAdClient() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const type = params.type as string;
  const ad = AD_PRICING.find((a) => a.id === type);

  async function checkout() {
    if (!ad) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ads/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adType: type, employerId: "ADMIN_PURCHASE" }),
      });
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
        setLoading(false);
      }
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to process checkout"}`);
      setLoading(false);
    }
  }

  if (!ad) {
    return (
      <div className="p-8">
        <p className="text-red-600">Invalid ad type</p>
        <button onClick={() => router.push("/admin/ads")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Back to Ads
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Buy Ad: {ad.label}</h1>
      <div className="border rounded-lg p-6 bg-white shadow-md">
        <div className="space-y-4">
          <div>
            <p className="text-gray-600">Price:</p>
            <p className="text-3xl font-bold text-blue-600">${ad.price}</p>
          </div>
          <div>
            <p className="text-gray-600">Duration:</p>
            <p className="text-xl font-semibold">{ad.durationDays} days</p>
          </div>
          <div>
            <p className="text-gray-600">Impressions:</p>
            <p className="text-xl font-semibold">{typeof ad.impressions === "string" ? ad.impressions : ad.impressions.toLocaleString()}</p>
          </div>
        </div>
        <button onClick={checkout} disabled={loading} className="mt-6 w-full px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Processing..." : "Proceed to Checkout"}
        </button>
        <button onClick={() => router.push("/admin/ads")} className="mt-4 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
          Cancel
        </button>
      </div>
    </div>
  );
}
