"use client";

import { useState } from "react";
import { TourDashboard } from "@/components/tour/TourDashboard";
import { TourOverlay } from "@/components/tour/TourOverlay";
import { TOUR_STEPS } from "@/components/tour/TourStep";
import { Button } from "@/components/ui/button";

export default function TourPage() {
  const [tourActive, setTourActive] = useState(true);

  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      {tourActive && (
        <TourOverlay
          steps={TOUR_STEPS}
          onClose={() => setTourActive(false)}
          endCtaText="Create Account to Unlock Full Access"
          endCtaHref="/auth/signup"
        />
      )}
      <TourDashboard />
      {!tourActive && (
        <div className="max-w-5xl mx-auto px-4 pb-12 text-center">
          <Button variant="primary" onClick={() => setTourActive(true)}>
            Restart tour
          </Button>
        </div>
      )}
    </div>
  );
}
