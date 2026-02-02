import { ShieldCheckIcon } from "@heroicons/react/24/outline";

type IconComponent = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

interface SafeIconProps {
  icon?: IconComponent | null;
  className?: string;
  "aria-hidden"?: boolean;
}

/**
 * Renders a Heroicons component with a fallback to ShieldCheckIcon if the icon
 * import is undefined (e.g. invalid or renamed in Heroicons v2). Prevents runtime
 * crashes from bad icon imports.
 */
export function SafeIcon({ icon: Icon, className, "aria-hidden": ariaHidden }: SafeIconProps) {
  const Fallback = ShieldCheckIcon;
  const Component = Icon ?? Fallback;
  return <Component className={className} aria-hidden={ariaHidden} />;
}
