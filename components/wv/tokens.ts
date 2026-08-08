/**
 * WorkVouch design tokens — single source of truth for spacing, radius, motion.
 * Canonical reference: Live Demo (`/demo`, `components/demo-center/`).
 */

export const wvTokens = {
  /** Page canvas */
  bg: "bg-wv-bg",
  surface: "bg-wv-surface",
  surfaceHover: "bg-wv-surface-hover",
  border: "border-wv-border",
  borderHover: "border-wv-border-hover",

  /** Typography */
  textPrimary: "text-wv-foreground",
  textMuted: "text-wv-muted",
  textSubtle: "text-wv-subtle",

  /** Headings */
  h1: "text-2xl font-bold tracking-tight text-wv-foreground sm:text-3xl lg:text-4xl",
  h2: "text-xl font-semibold tracking-tight text-wv-foreground sm:text-2xl",
  h3: "text-lg font-semibold text-wv-foreground",
  body: "text-base leading-relaxed text-wv-muted",
  caption: "text-xs text-wv-subtle",

  /** Spacing */
  pagePy: "py-8",
  sectionGap: "gap-8",
  stackGap: "space-y-6",

  /** Radius — always rounded-2xl for cards, rounded-xl for inputs/buttons */
  radiusCard: "rounded-2xl",
  radiusControl: "rounded-xl",
  radiusBadge: "rounded-full",

  /** Shadows */
  shadowCard: "shadow-xl shadow-black/20",
  shadowGlow: "ring-1 ring-white/10 shadow-blue-500/5",

  /** Motion */
  transition: "transition-all duration-200",
  transitionSlow: "transition-all duration-300",
} as const;

export type WvToken = keyof typeof wvTokens;
