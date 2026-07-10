"use client";

import { motion } from "framer-motion";
import { ArrowRight, User, Building2, Play } from "lucide-react";
import { DemoShell } from "@/components/demo-center/DemoShell";
import { GlassCard, DemoButton, AnimatedCounter } from "@/components/demo-center/shared/DemoUI";
import { HeroIllustration } from "@/components/demo-center/shared/DemoAnimations";
import { StaggerGrid, staggerItem, FeatureTooltip } from "@/components/demo-center/shared/FlowLayout";
import { LANDING_STATS } from "@/lib/demo/demo-center-data";

export default function DemoLanding() {
  return (
    <DemoShell flow="landing">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300 mb-8"
        >
          Verified workplace reputation
        </motion.span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] max-w-4xl mx-auto bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent">
          Trust Built By The People Who Worked Beside You
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed">
          WorkVouch helps workers build verified professional reputations while helping
          employers hire with confidence.
        </p>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-12"
      >
        <HeroIllustration />
      </motion.div>

      <StaggerGrid className="mt-16 grid md:grid-cols-2 gap-6">
        {[
          {
            href: "/demo/employee",
            icon: User,
            gradient: "from-blue-500 to-cyan-500",
            hoverGradient: "from-blue-500/10",
            eyebrow: "Employee Experience",
            title: "Build your verified reputation",
            desc: "Walk through onboarding, coworker matching, incoming reviews, and your trust score dashboard.",
            cta: "Explore",
            variant: "primary" as const,
            tooltip: "See how workers collect verified reviews and build a portable trust score.",
          },
          {
            href: "/demo/employer",
            icon: Building2,
            gradient: "from-violet-500 to-purple-600",
            hoverGradient: "from-violet-500/10",
            eyebrow: "Employer Experience",
            title: "Hire with verified trust data",
            desc: "Search candidates, compare trust scores, review peer insights, and make confident hiring decisions.",
            cta: "Explore",
            variant: "secondary" as const,
            tooltip: "See how employers reduce hiring risk with peer-verified candidate intelligence.",
          },
        ].map((card) => (
          <motion.div key={card.href} variants={staggerItem}>
            <GlassCard hover glow className="group relative overflow-hidden h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.hoverGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                    <card.icon className="h-7 w-7" aria-hidden />
                  </div>
                  <FeatureTooltip label={card.eyebrow} body={card.tooltip} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400/90 mb-2">{card.eyebrow}</p>
                <h2 className="text-2xl font-bold mb-3">{card.title}</h2>
                <p className="text-white/55 text-sm leading-relaxed mb-6">{card.desc}</p>
                <DemoButton href={card.href} size="lg" variant={card.variant}>
                  {card.cta} <ArrowRight className="h-4 w-4" aria-hidden />
                </DemoButton>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </StaggerGrid>

      <StaggerGrid className="mt-16 grid sm:grid-cols-2 gap-6">
        {LANDING_STATS.map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <GlassCard hover className="text-center">
              <p className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-3 text-sm text-white/55 leading-relaxed max-w-xs mx-auto">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </StaggerGrid>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center"
      >
        <DemoButton href="/demo/employee" size="lg" className="text-lg px-12 py-4">
          <Play className="h-5 w-5 fill-current" aria-hidden />
          Start Interactive Demo
        </DemoButton>
        <p className="mt-4 text-sm text-white/40">
          No signup · No backend · Fully interactive · ~5 min experience
        </p>
      </motion.section>
    </DemoShell>
  );
}
