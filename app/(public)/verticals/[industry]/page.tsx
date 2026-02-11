import Link from "next/link";
import { getVerticalMarketingBySlug } from "@/lib/verticals/marketing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ industry: string }> };

export default async function VerticalLandingPage({ params }: Props) {
  const { industry: slug } = await params;
  const industry = decodeURIComponent(slug ?? "");
  const config = getVerticalMarketingBySlug(industry);

  if (!config) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Coming Soon</h1>
        <p className="text-slate-400 mb-6">
          We&apos;re building something great for this vertical.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8 sm:px-6 sm:py-12 overflow-x-hidden">
      <div className="max-w-3xl mx-auto min-w-0">
        <h1 className="text-3xl font-bold mb-4 md:text-4xl">{config.headline}</h1>
        <p className="text-base text-slate-400 mb-8 md:text-xl">{config.subheadline}</p>

        <ul className="mb-10 space-y-2">
          {config.painPoints.map((p, i) => (
            <li key={i} className="text-lg flex items-center gap-2">
              <span className="text-indigo-400">•</span> {p}
            </li>
          ))}
        </ul>

        <Link
          href="/signup"
          className="inline-block w-full sm:w-auto text-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors"
        >
          {config.cta}
        </Link>
      </div>
    </div>
  );
}
