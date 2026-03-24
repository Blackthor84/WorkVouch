import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  /** Primary focal card on a page: stronger elevation + subtle ring. */
  featured?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hover = false, featured = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-card
        className={cn(
          "rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
          featured
            ? "shadow-lg ring-1 ring-black/5 dark:ring-white/10"
            : "shadow-sm",
          hover && "transition-shadow duration-200 hover:shadow-md",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-lg font-medium text-gray-900 dark:text-gray-100",
        className,
      )}
    >
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn("text-sm text-gray-600 dark:text-gray-400", className)}>
      {children}
    </div>
  );
}
