"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { WarehouseOnboarding } from "@/components/warehouse-onboarding";
import { Card } from "@/components/ui/card";

interface WarehouseOnboardingClientProps {
  userId: string;
  onComplete: () => void;
}

export function WarehouseOnboardingClient({
  userId,
  onComplete,
}: WarehouseOnboardingClientProps) {
  return (
    <Card className="p-8">
      <WarehouseOnboarding userId={userId} onComplete={onComplete} />
    </Card>
  );
}
