"use client";

import { motion } from "framer-motion";

type WvPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function WvPageHeader({ eyebrow, title, description, action }: WvPageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-wv-brand-blue/90">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-wv-foreground sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-wv-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.header>
  );
}
