import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { LEGAL_EMAIL, SUPPORT_EMAIL } from "@/lib/constants/contact";

export const metadata: Metadata = {
  title: "Terms of Service | WorkVouch",
  description:
    "WorkVouch Terms of Service: user rights, Reputation Score disclaimer, dispute policy, employer liability, and platform limitations.",
};

export default function LegalTermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="January 2025">
      <p className="leading-relaxed">
        By accessing or using WorkVouch (&quot;Service&quot;), you agree to be bound by
        these Terms of Service (&quot;Terms&quot;). If you disagree with any part of
        these terms, you may not access the Service.
      </p>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Reputation Score Disclaimer
        </h2>
        <p className="mb-4">
          WorkVouch Reputation Scores are proprietary metrics calculated from verified
          employment data, peer references, and reference quality. They are provided
          for informational purposes only.
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Reputation Scores are not an endorsement, certification, or guarantee of job performance.</li>
          <li>Employers are solely responsible for their hiring and employment decisions.</li>
          <li>Reputation Scores should not be used as the sole basis for adverse employment decisions.</li>
          <li>WorkVouch does not guarantee any particular Reputation Score outcome.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Dispute Policy
        </h2>
        <p className="mb-4">
          Users may dispute the following through our dispute system:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Employment verification status</li>
          <li>References</li>
          <li>Fraud flags</li>
          <li>Trust score calculation</li>
          <li>Rehire eligibility (employer-submitted) status</li>
        </ul>
        <p className="mt-4">
          Evidence submission is allowed. Disputes are reviewed by WorkVouch administrators.
          One appeal per dispute is permitted after an initial resolution. Abuse of the
          dispute system, including frivolous or repetitive submissions, may result in
          account suspension or termination.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Employer Liability Clause
        </h2>
        <p>
          Employers are solely responsible for their hiring decisions. Rehire eligibility
          and related flags are submitted by employers; WorkVouch does not guarantee the
          accuracy of employer-submitted data. Employers must comply with all applicable
          employment and fair-chance hiring laws.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Platform Limitation Clause
        </h2>
        <p className="mb-4">
          WorkVouch is not a background check service, is not a consumer reporting agency
          under the Fair Credit Reporting Act (FCRA), and is not governed as a credit
          bureau. Our Service provides verification and reference infrastructure only.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Display of Information; No Hiring Decisions
        </h2>
        <p className="mb-4">
          WorkVouch displays employer-submitted and peer-submitted information. Employers
          are responsible for evaluations and data they submit. WorkVouch does not make
          hiring decisions and is not responsible for employer or peer content.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Identity Verification and Data Changes
        </h2>
        <p className="mb-4">
          Identity verification is required before we process certain data changes,
          including dispute submissions and sensitive profile updates. We may require
          you to confirm your identity through the means we specify.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Data Deletion and Compliance Retention
        </h2>
        <p className="mb-4">
          Data deletion requests require identity confirmation. WorkVouch may retain
          certain data for compliance, legal, or audit reasons as described in our
          Data Retention Policy, even after account closure or deletion requests.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          User Rights and Responsibilities
        </h2>
        <p className="mb-4">
          You must be at least 18 years old to use WorkVouch. You must provide accurate,
          current, and complete information and maintain account security. Profile and
          job information must be truthful. Violations may result in suspension or
          termination.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Contact
        </h2>
        <p>
          For questions about these Terms:{" "}
          <a href={"mailto:" + LEGAL_EMAIL} className="text-primary hover:underline">
            {LEGAL_EMAIL}
          </a>
          . Support:{" "}
          <a href={"mailto:" + SUPPORT_EMAIL} className="text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>

      <div className="mt-8 pt-6 border-t border-grey-background dark:border-[#374151]">
        <p className="text-sm text-grey-medium dark:text-gray-400">
          See also{" "}
          <Link href="/legal/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          ,{" "}
          <Link href="/legal/data-retention" className="text-primary hover:underline">
            Data Retention Policy
          </Link>
          ,{" "}
          <Link href="/legal/dispute-resolution" className="text-primary hover:underline">
            Dispute Resolution Policy
          </Link>
          , and{" "}
          <Link href="/legal/employer-agreement" className="text-primary hover:underline">
            Employer Agreement
          </Link>
          .
        </p>
      </div>
    </LegalPageLayout>
  );
}
