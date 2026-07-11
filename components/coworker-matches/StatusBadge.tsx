"use client";

import { WvBadge } from "@/components/wv";

type Status = "pending" | "accepted" | "confirmed" | "rejected";

const statusConfig: Record<Status, { label: string; variant: "warning" | "success" | "danger" | "default" }> = {
  pending: { label: "Pending", variant: "warning" },
  accepted: { label: "Accepted", variant: "success" },
  confirmed: { label: "Accepted", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

type Props = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: Props) {
  const normalized = (status?.toLowerCase() ?? "pending") as Status;
  const config = statusConfig[normalized] ?? statusConfig.pending;

  return (
    <WvBadge variant={config.variant} className={className}>
      {config.label}
    </WvBadge>
  );
}
