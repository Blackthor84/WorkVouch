import { cn } from "@/lib/utils";
import Link from "next/link";

interface ListItemProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

export function ListItem({
  children,
  href,
  onClick,
  className,
  active,
}: ListItemProps) {
  const baseClasses =
    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer";
  const activeClasses = active
    ? "bg-blue-600 text-white"
    : "text-blue-800 hover:bg-blue-100";

  const content = (
    <div
      className={cn(baseClasses, activeClasses, className)}
      onClick={onClick}
    >
      {children}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
