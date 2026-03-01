"use client";

/**
 * Abstract, system-oriented icons for Human Factors (Modeled) UI.
 * Outline-only, monochrome, neutral. No faces, people, stars, or emotive symbols.
 * Use currentColor so parent controls color.
 */

const iconClass = "flex-shrink-0 text-slate-500";

export function IconLayeredNodes({ className }: { className?: string }) {
  return (
    <svg className={className ?? iconClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="3" />
      <circle cx="7" cy="14" r="2.5" />
      <circle cx="17" cy="14" r="2.5" />
      <path d="M12 11v2M10 12.5L7 14M14 12.5L17 14" />
    </svg>
  );
}

export function IconLoopedChain({ className }: { className?: string }) {
  return (
    <svg className={className ?? iconClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="12" r="2.5" />
      <circle cx="16" cy="12" r="2.5" />
      <path d="M10.5 12h3M16 9.5a5 5 0 0 0-8 0M16 14.5a5 5 0 0 1-8 0" />
      <path d="M8 9.5a5 5 0 0 0 8 0M8 14.5a5 5 0 0 1 8 0" />
    </svg>
  );
}

export function IconParallelLines({ className }: { className?: string }) {
  return (
    <svg className={className ?? iconClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 4v16M16 4v16" />
      <path d="M12 4v16" strokeDasharray="2 2" />
    </svg>
  );
}

export function IconIntersectingPaths({ className }: { className?: string }) {
  return (
    <svg className={className ?? iconClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20L12 4M20 20L12 12M12 12L20 4M12 12L4 4" />
    </svg>
  );
}

export function IconClockPause({ className }: { className?: string }) {
  return (
    <svg className={className ?? iconClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
      <path d="M9.5 9v6M14.5 9v6" />
    </svg>
  );
}

export function IconNetworkBurst({ className }: { className?: string }) {
  return (
    <svg className={className ?? iconClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10V6M12 14v4M10 12H6M14 12h4" />
      <path d="M9.2 9.2L6.3 6.3M14.8 9.2l2.9-2.9M14.8 14.8l2.9 2.9M9.2 14.8L6.3 17.7" />
    </svg>
  );
}

export function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className ?? iconClass} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className ?? iconClass} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
