import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Employer Agreement | WorkVouch",
  description:
    "WorkVouch Employer Agreement: Reputation Score disclaimer, dispute policy, employer liability, and platform limitations.",
};

export default function LegalEmployerAgreementPage() {
  return (
    <LegalPageLayout title="Employer Agreement" lastUpdated="January 2025">
      <p className="leading-relaxed">
        This Employer Agreement applies when you use WorkVouch as an employer or to
        evaluate candidates. By using employer features, you agree to these terms in
        addition to our Terms of Service.
      </p>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Reputation Score Disclaimer
        </h2>
        <p className="mb-4">
          WorkVouch Reputation Scores are proprietary and provided for informational
          purposes only. They are not an endorsement, certification, or guarantee of
          job performance or suitability.
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Employers are solely responsible for hiring and employment decisions.</li>
<li>Do not use Reputation Scores as the sole basis for adverse employment decisions.</li>
            <li>Reputation Scores reflect verification completeness and reference quality, not future performance.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Dispute Policy
        </h2>
        <p className="mb-4">
          Candidates may dispute employment verification, references, fraud flags, Trust
          Score, and rehire eligibility. Evidence submission is allowed. WorkVouch
          administrators review disputes; one appeal per dispute is permitted. Abuse of
          the dispute system may result in suspension. Employers may see that a dispute
          or appeal is in progress where relevant to a candidate&apos;s profile.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Employer Liability Clause
        </h2>
        <p>
          Employers are responsible for their own hiring decisions. Rehire eligibility
          and related flags are submitted by employers; WorkVouch does not guarantee the
          accuracy of employer-submitted data. Employers must comply with all
          applicable employment, fair-chance, and anti-discrimination laws. WorkVouch
          is not liable for decisions made using the Service.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Platform Limitation Clause
        </h2>
        <p>
          WorkVouch is not a background check service, is not a consumer reporting
          agency under the FCRA, and is not governed as a credit bureau. We provide
          verification and reference infrastructure only. Employers must not use
          WorkVouch data as a consumer report for eligibility decisions under FCRA
          without independent compliance advice.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Subscription and Access
        </h2>
        <p>
          Employer access is subject to active subscription and tier limits. Billing is
          managed through Stripe. You are responsible for securing your account and
          for all use under your account.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Contact
        </h2>
        <p>
          Employer and legal questions:{" "}
          <a href="mailto:legal@workvouch.com" className="text-primary hover:underline">
            legal@workvouch.com
          </a>
          . Support:{" "}
          <a href="mailto:support@workvouch.com" className="text-primary hover:underline">
            support@workvouch.com
          </a>
          .
        </p>
      </section>

      <div className="mt-8 pt-6 border-t border-grey-background dark:border-[#374151]">
        <p className="text-sm text-grey-medium dark:text-gray-400">
          See also{" "}
          <Link href="/legal/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </LegalPageLayout>
  );
}
