import ActiveAds from "@/components/ActiveAds";
import HeroInteractive, { type HeroIndustry } from "@/components/public/HeroInteractive";
import HowItWorksDual from "@/components/public/HowItWorksDual";
import PreviewCards from "@/components/public/PreviewCards";
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ActiveAds />
      </div>
      <HowItWorksDual />
      <PreviewCards />
      <FinalCTA />
    </div>
  );
}
