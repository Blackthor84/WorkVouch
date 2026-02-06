import { cn } from "@/lib/utils";

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

export function Badge({
  children,
  variant = "primary",
  className,
}: BadgeProps) {
  const variants = {
    primary:
      "bg-grey-background dark:bg-[#1A1F2B] text-grey-dark dark:text-gray-200",
    default:
      "bg-grey-background dark:bg-[#1A1F2B] text-grey-dark dark:text-gray-200",
    success:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
    warning:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
    destructive: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
    secondary: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
