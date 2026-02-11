import ActiveAds from "@/components/ActiveAds";
import BuiltForHighTrustProfessions from "@/components/marketing/BuiltForHighTrustProfessions";
import HeroInteractive, { type HeroIndustry } from "@/components/public/HeroInteractive";
import TheProblemSection from "@/components/public/TheProblemSection";
import HowWorkVouchWorks from "@/components/public/HowWorkVouchWorks";
import RealExampleSection from "@/components/public/RealExampleSection";
import WhyWorkVouch from "@/components/public/WhyWorkVouch";
import ForEmployersSection from "@/components/public/ForEmployersSection";
import ForEmployeesSection from "@/components/public/ForEmployeesSection";
import EnterpriseSection from "@/components/public/EnterpriseSection";
import TestimonialsSection from "@/components/public/TestimonialsSection";
import FinalCTA from "@/components/public/FinalCTA";

const VALID_INDUSTRIES: readonly HeroIndustry[] = [
  "healthcare",
  "tech",
  "finance",
  "logistics",
];

function parseIndustry(value: unknown): HeroIndustry | undefined {
  if (typeof value !== "string") return undefined;
  return VALID_INDUSTRIES.includes(value as HeroIndustry)
    ? (value as HeroIndustry)
    : undefined;
}

interface HomeProps {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<{ industry?: string }>;
}

export default async function Home(props: HomeProps) {
  const resolved = await (props.searchParams ?? Promise.resolve({} as { industry?: string }));
  const industry = parseIndustry(resolved.industry);

  return (
    <div className="min-h-screen">
      <HeroInteractive industry={industry} />
      <TheProblemSection />
      <HowWorkVouchWorks />
      <RealExampleSection />
      <BuiltForHighTrustProfessions />
      <WhyWorkVouch />
      <ForEmployersSection />
      <ForEmployeesSection />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ActiveAds />
      </div>
      <EnterpriseSection />
      <TestimonialsSection />
      <FinalCTA />
    </div>
  );
}
