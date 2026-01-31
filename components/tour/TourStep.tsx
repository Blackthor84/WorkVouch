"use client";

export interface TourStepConfig {
  id: string;
  targetId: string;
  title: string;
  description: string;
}

export const TOUR_STEPS: TourStepConfig[] = [
  {
    id: "trust-score",
    targetId: "tour-trust-score",
    title: "Trust Score",
    description: "Your verified work reputation in one number. Employers use this to assess fit and reduce hiring risk.",
  },
  {
    id: "verification-request",
    targetId: "tour-verification-request",
    title: "Verification Request",
    description: "Request verification from past employers or coworkers. Each verified role strengthens your profile.",
  },
  {
    id: "analytics",
    targetId: "tour-analytics",
    title: "Analytics",
    description: "See rehire probability, team compatibility, and workforce risk—all powered by verified data.",
  },
  {
    id: "rehire-probability",
    targetId: "tour-rehire-probability",
    title: "Rehire Probability",
    description: "A key metric showing likelihood of rehire based on verification and reference activity.",
  },
  {
    id: "feature-flag",
    targetId: "tour-feature-flag",
    title: "Feature Preview",
    description: "Pro and enterprise plans unlock advanced analytics and team tools. Upgrade to see more.",
  },
];
