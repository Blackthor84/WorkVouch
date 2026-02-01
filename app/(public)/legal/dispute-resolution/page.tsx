import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Dispute Resolution Policy | WorkVouch",
  description:
    "WorkVouch Dispute Resolution Policy: how disputes work, identity verification, and appeals.",
};

export default function DisputeResolutionPolicyPage() {
  return (
    <LegalPageLayout title="Dispute Resolution Policy" lastUpdated="January 2025">
      <p className="leading-relaxed">
        WorkVouch displays employer-submitted and peer-submitted information.
        Employers are responsible for evaluations they submit. WorkVouch does not make
        hiring decisions. Users may submit disputes in accordance with this policy.
      </p>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          What May Be Disputed
        </h2>
        <p className="mb-4">
          Users may dispute employment verification status, references, fraud flags,
          trust score calculation, and rehire eligibility (employer-submitted) status.
          Evidence submission is allowed. Disputes are reviewed by WorkVouch
          administrators.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Identity Verification Before Submission
        </h2>
        <p className="mb-4">
          Identity verification is required before we accept dispute submissions and
          before we process certain data changes. We may require you to confirm your
          identity through the means we specify. We will not process dispute
          submissions or sensitive data changes without identity confirmation where
          required.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Review and Resolution
        </h2>
        <p className="mb-4">
          Disputes are reviewed in good faith. We will provide a resolution summary
          where applicable. One appeal per dispute is permitted after an initial
          resolution. Abuse of the dispute system, including frivolous or repetitive
          submissions, may result in account suspension or termination.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Data Retention
        </h2>
        <p className="mb-4">
          Dispute and appeal data may be retained for compliance and audit reasons as
          described in our Data Retention Policy.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Contact
        </h2>
        <p>
          For dispute-related questions:{" "}
          <a href="mailto:support@workvouch.com" className="text-primary hover:underline">
            support@workvouch.com
          </a>
          . Legal:{" "}
          <a href="mailto:legal@workvouch.com" className="text-primary hover:underline">
            legal@workvouch.com
          </a>
          .
        </p>
      </section>

      <div className="mt-8 pt-6 border-t border-grey-background dark:border-[#374151]">
        <p className="text-sm text-grey-medium dark:text-gray-400">
          See also{" "}
          <Link href="/legal/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          ,{" "}
          <Link href="/legal/data-retention" className="text-primary hover:underline">
            Data Retention Policy
          </Link>
          , and{" "}
          <Link href="/how-disputes-work" className="text-primary hover:underline">
            How Disputes Work
          </Link>
          .
        </p>
      </div>
    </LegalPageLayout>
  );
}
