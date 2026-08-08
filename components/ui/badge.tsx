import { cn } from "@/lib/utils";
import { WvBadge } from "@/components/wv/WvBadge";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "destructive"
    | "secondary";
  className?: string;
}

const variantMap = {
  primary: "default" as const,
  default: "default" as const,
  success: "success" as const,
  warning: "warning" as const,
  danger: "danger" as const,
  destructive: "danger" as const,
  info: "brand" as const,
  secondary: "default" as const,
};

/** @deprecated Prefer WvBadge from @/components/wv for new code. */
export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <WvBadge variant={variantMap[variant]} className={className}>
      {children}
    </WvBadge>
  );
}
