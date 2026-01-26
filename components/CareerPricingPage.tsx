"use client";

import { useState, useEffect } from "react";
import { PricingModal } from "@/components/PricingModal";
import { supabase } from "@/lib/supabase/client";

interface CareerPricingPageProps {
  userId?: string;
  userType?: "employee" | "employer";
}

export default function CareerPricingPage({ 
  userId: propUserId, 
  userType: propUserType 
}: CareerPricingPageProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(propUserId);
  const [userType, setUserType] = useState<"employee" | "employer" | undefined>(propUserType);
  const [loading, setLoading] = useState(!propUserId);

  // Fetch user info if not provided
  useEffect(() => {
    if (propUserId && propUserType) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // Try to determine user type from profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          
          if (profile) {
            const role = (profile as any).role;
            if (role === "employer" || role === "admin") {
              setUserType("employer");
            } else {
              setUserType("employee");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [propUserId, propUserType]);

  // Example tiers (matching the pricing structure from career page)
  const employerTiers = [
    {
      id: "price_1ABC123Basic",
      name: "Basic",
      price: "$49/mo",
      benefits: [
        "Post up to 10 jobs/month",
        "Access to verified employee reviews",
        "Basic support",
      ],
    },
    {
      id: "price_1ABC123Pro",
      name: "Pro",
      price: "$99/mo",
      benefits: [
        "Unlimited job postings",
        "Advanced analytics dashboard",
        "Priority support",
      ],
    },
  ];

  const employeeTiers = [
    {
      id: "",
      name: "Free",
      price: "Always Free",
      benefits: [
        "WorkVouch is always free for workers",
        "Add unlimited past job history",
        "Match with former coworkers",
        "Receive unlimited peer references",
        "Build your verified work profile",
        "Get discovered by employers",
        "Access all WorkVouch features",
        "No credit card required",
        "No subscriptions, ever",
      ],
    },
  ];

  const tiers = userType === "employer" ? employerTiers : employeeTiers;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Choose Your Tier</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="p-6 border rounded-lg shadow hover:shadow-lg transition bg-white"
          >
            <h2 className="text-xl font-semibold mb-2">{tier.name}</h2>
            <p className="text-gray-700 mb-4 text-lg font-bold">{tier.price}</p>
            <ul className="list-disc list-inside mb-4 space-y-1">
              {tier.benefits.map((b, idx) => (
                <li key={idx} className="text-sm">{b}</li>
              ))}
            </ul>
            <button
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              onClick={() => setSelectedTier(tier.id)}
            >
              Select
            </button>
          </div>
        ))}
      </div>

      {selectedTier !== null && (
        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-md">
            <PricingModal
              tier={tiers.find(t => t.id === selectedTier)?.name || "Plan"}
              price={tiers.find(t => t.id === selectedTier)?.price || ""}
              benefits={tiers.find(t => t.id === selectedTier)?.benefits || []}
              priceId={selectedTier || undefined}
              userId={userId}
              userType={userType}
              autoOpen={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
