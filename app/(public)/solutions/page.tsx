import Link from "next/link";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Industry Solutions | WorkVouch",
  description: "Industry-tailored verification workflows for security, healthcare, logistics, construction, hospitality, and corporate hiring.",
};

const SOLUTIONS = [
  { slug: "healthcare", label: "Healthcare Staffing", href: "/solutions/healthcare", description: "Verify clinical roles, credentials, and employment history." },
  { slug: "logistics", label: "Logistics & Transportation", href: "/solutions/logistics", description: "Driver and warehouse verification, safety records, tenure." },
  { slug: "construction", label: "Construction", href: "/solutions/construction", description: "Trade experience, certifications, and project history verification." },
  { slug: "hospitality", label: "Hospitality", href: "/solutions/hospitality", description: "Front-line and management verification across properties." },
  { slug: "corporate", label: "Corporate Hiring", href: "/solutions/corporate", description: "Structured verification for professional and office roles." },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="text-3xl font-bold tracking-tight text-grey-dark dark:text-gray-200 md:text-4xl text-center">
          Industry-Tailored Verification Workflows
        </h1>
        <p className="mt-4 text-center text-base text-grey-medium dark:text-gray-400 max-w-2xl mx-auto">
          WorkVouch provides verification and trust scoring tailored to your industry. Same plan enforcement, certification uploads, and risk engine—different workflow framing.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <Link key={s.slug} href={s.href}>
              <Card className="p-6 h-full hover:shadow-lg transition-shadow border-grey-background dark:border-[#374151]">
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">{s.label}</h2>
                <p className="mt-2 text-sm text-grey-medium dark:text-gray-400">{s.description}</p>
                <span className="mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">Learn more</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
