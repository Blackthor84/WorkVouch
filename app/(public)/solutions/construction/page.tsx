import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "WorkVouch for Construction",
  description: "Trade experience, certifications, and project history verification.",
};

export default function SolutionsConstructionPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="text-3xl font-bold tracking-tight text-grey-dark dark:text-gray-200 sm:text-4xl">
          Construction Verification
        </h1>
        <p className="mt-4 text-grey-medium dark:text-gray-400">
          Verify trade experience, certifications, and project history. Same WorkVouch verification engine and plan enforcement—framed for construction.
        </p>
        <ul className="mt-6 list-disc list-inside space-y-2 text-grey-medium dark:text-gray-400">
          <li>Peer-confirmed project and employer history</li>
          <li>Certification validation</li>
          <li>Structured trust scoring</li>
        </ul>
        <div className="mt-8">
          <Button asChild>
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
