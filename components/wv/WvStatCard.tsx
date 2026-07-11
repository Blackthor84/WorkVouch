"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { WvCard } from "./WvCard";
import { AnimatedCounter } from "./WvAnimatedCounter";
import { cn } from "@/lib/utils";

type WvStatCardProps = {
  label: string;
  value: number;
  suffix?: string;
  icon?: LucideIcon;
  trend?: string;
  accent?: "blue" | "green" | "violet" | "amber";
};

const accentMap = {
  blue: "text-blue-400",
  green: "text-emerald-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
};

export function WvStatCard({ label, value, suffix = "", icon: Icon, trend, accent = "blue" }: WvStatCardProps) {
  return (
    <WvCard hover padding="md" className="h-full">
      {Icon && <Icon className={cn("mb-3 h-5 w-5", accentMap[accent])} aria-hidden />}
      <p className={cn("text-3xl font-bold tabular-nums", accentMap[accent])}>
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
      <p className="mt-1 text-sm text-wv-muted">{label}</p>
      {trend && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-emerald-400/90">
          {trend}
        </motion.p>
      )}
    </WvCard>
  );
}
