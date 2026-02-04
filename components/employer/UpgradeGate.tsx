"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockClosedIcon } from "@heroicons/react/24/solid";

interface UpgradeGateProps {
  feature: string;
  className?: string;
}

export function UpgradeGate({ feature, className = "" }: UpgradeGateProps) {
  return (
    <Card className={`p-6 flex flex-col items-center justify-center text-center min-h-[120px] ${className}`}>
      <LockClosedIcon className="h-10 w-10 text-grey-medium dark:text-gray-500 mb-2" />
      <p className="text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">
        {feature} is available on Lite, Pro, or Enterprise.
      </p>
      <Button variant="primary" size="sm" asChild>
        <Link href="/employer/upgrade">Upgrade to unlock</Link>
      </Button>
    </Card>
  );
}
