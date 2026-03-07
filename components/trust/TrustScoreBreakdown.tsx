"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type TrustEvent = {
  event_type: string;
};

export default function TrustScoreBreakdown({
  profileId,
}: {
  profileId: string;
}) {
  const [events, setEvents] = useState<TrustEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from("trust_events")
        .select("event_type")
        .eq("profile_id", profileId);

      if (!error && data) {
        setEvents(data as TrustEvent[]);
      }

      setLoading(false);
    }

    loadEvents();
  }, [profileId]);

  const counts = {
    manager: events.filter((e) => e.event_type === "manager_verified").length,
    coworker: events.filter((e) => e.event_type === "coworker_verified").length,
    lowTrust: events.filter((e) => e.event_type === "low_trust_verifier").length,
  };

  const score =
    counts.manager * 10 +
    counts.coworker * 5 +
    counts.lowTrust * 1;

  if (loading) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow">
        Loading trust score...
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Trust Score Breakdown</h2>

      <div className="text-3xl font-bold text-blue-600 mb-4">
        {score}
      </div>

      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Manager Verifications</span>
          <span>+{counts.manager * 10}</span>
        </div>

        <div className="flex justify-between">
          <span>Coworker Verifications</span>
          <span>+{counts.coworker * 5}</span>
        </div>

        <div className="flex justify-between">
          <span>Low Trust Verifiers</span>
          <span>+{counts.lowTrust * 1}</span>
        </div>
      </div>
    </div>
  );
}
