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
          "rounded-2xl border border-wv-border bg-wv-surface backdrop-blur-xl p-6 text-wv-foreground shadow-xl shadow-black/10",
          featured && "ring-1 ring-white/10 shadow-lg",
          hover && "transition-all duration-200 hover:border-wv-border-hover hover:bg-wv-surface-hover hover:shadow-2xl",
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
        "text-lg font-semibold text-wv-foreground",
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
    <div className={cn("text-sm text-wv-muted", className)}>
      {children}
    </div>
  );
}
