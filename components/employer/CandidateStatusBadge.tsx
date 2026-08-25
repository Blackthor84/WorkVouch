import { WvBadge } from "@/components/wv";
import {
  platformStatusBadgeVariant,
  platformStatusLabel,
} from "@/lib/employer/candidates/status-labels";
import type { PlatformStatus } from "@/lib/employer/candidates/directory-types";

type Props = {
  status: PlatformStatus;
  className?: string;
};

export function CandidateStatusBadge({ status, className }: Props) {
  return (
    <WvBadge variant={platformStatusBadgeVariant(status)} className={className}>
      {platformStatusLabel(status)}
    </WvBadge>
  );
}
