import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How Disputes Work | WorkVouch",
  description:
    "Learn how WorkVouch handles disputes fairly: overview, what can be disputed, review process, appeals, and reputation score recalculation.",
};

export default function HowDisputesWorkPage() {
  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
      <div className="w-full max-w-4xl mx-auto space-y-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
            How Disputes Work
          </h1>
          <p className="text-lg text-grey-medium dark:text-gray-400 max-w-2xl mx-auto">
            Fairness and transparency are at the core of WorkVouch. Our dispute and
            appeal process is designed to give you a clear path to correct errors
            while protecting the integrity of the platform.
          </p>
        </div>

        <section className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200">
            1. Overview
          </h2>
          <p className="text-grey-medium dark:text-gray-400 leading-relaxed">
            WorkVouch is committed to fairness and transparency. When you dispute a
            record, we treat your submission seriously. All dispute and appeal
            actions are logged in our audit system so that decisions can be reviewed
            and accountability is maintained. Our goal is to correct genuine errors
            while preventing abuse of the system.
          </p>
        </section>

        <section className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200">
            2. What Can Be Disputed
          </h2>
          <p className="text-grey-medium dark:text-gray-400">
            You may submit a dispute for the following:
          </p>
          <ul className="list-disc list-inside space-y-2 text-grey-medium dark:text-gray-400 ml-4">
            <li><strong className="text-grey-dark dark:text-gray-200">Employment verification</strong> — status or details of a verified job</li>
            <li><strong className="text-grey-dark dark:text-gray-200">References</strong> — reference content or attribution</li>
            <li><strong className="text-grey-dark dark:text-gray-200">Fraud flags</strong> — if you believe a fraud flag was applied in error</li>
            <li><strong className="text-grey-dark dark:text-gray-200">Trust score</strong> — calculation or factors affecting your score</li>
            <li><strong className="text-grey-dark dark:text-gray-200">Rehire eligibility</strong> — employer-submitted rehire status</li>
          </ul>
        </section>

        <section className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200">
            3. How Review Works
          </h2>
          <ol className="list-decimal list-inside space-y-4 text-grey-medium dark:text-gray-400 ml-2">
            <li><strong className="text-grey-dark dark:text-gray-200">Evidence submission</strong> — You submit a dispute with a description and may upload supporting evidence (e.g. documents, screenshots) through our secure system.</li>
            <li><strong className="text-grey-dark dark:text-gray-200">Admin review</strong> — A WorkVouch administrator reviews your dispute and any evidence, and may take action (e.g. modify a record, remove a flag, trigger a recalculation).</li>
            <li><strong className="text-grey-dark dark:text-gray-200">Resolution</strong> — You receive a resolution summary. If the outcome affects your Reputation Score (e.g. employment, reference, fraud flag, or reputation score disputes), we recalculate your score server-side.</li>
            <li><strong className="text-grey-dark dark:text-gray-200">Reputation score recalculation</strong> — When a resolution affects verification, references, or fraud flags, your Reputation Score is updated automatically. You can see your current score and whether it is under review in your dashboard.</li>
          </ol>
        </section>

        <section className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200">
            4. Appeals
          </h2>
          <p className="text-grey-medium dark:text-gray-400 leading-relaxed">
            If your dispute is resolved or rejected, you may submit <strong className="text-grey-dark dark:text-gray-200">one appeal</strong> per
            dispute. The appeal is reviewed by our team. The final decision is logged
            in our audit system. Abuse of the dispute or appeal process (e.g.
            frivolous or repetitive submissions) may result in account suspension.
          </p>
        </section>

        <section className="text-center py-8">
          <p className="text-grey-medium dark:text-gray-400 mb-6">
            Ready to submit a dispute? Sign in and use the dispute form in your dashboard.
          </p>
          <Button asChild variant="primary" size="lg">
            <Link href="/dashboard">Submit a Dispute</Link>
          </Button>
          <p className="mt-4 text-sm text-grey-medium dark:text-gray-400">
            From your dashboard you can open a dispute and attach evidence.
          </p>
        </section>

        <div className="border-t border-grey-background dark:border-[#374151] pt-8">
          <p className="text-sm text-grey-medium dark:text-gray-400">
            For our legal policies, see{" "}
            <Link href="/legal/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            ,{" "}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/legal/employer-agreement" className="text-primary hover:underline">
              Employer Agreement
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
