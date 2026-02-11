import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy | WorkVouch",
  description:
    "WorkVouch Privacy Policy: data collection, use, storage, and your rights. Reputation Score and dispute data handling.",
};

export default function LegalPrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="January 2025">
      <p className="leading-relaxed">
        WorkVouch (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
        privacy. This Privacy Policy explains how we collect, use, disclose, and
        safeguard your information when you use our Service.
      </p>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Reputation Score Disclaimer
        </h2>
        <p>
          Reputation Scores are proprietary, informational only, and not an endorsement or
          certification. Employers are responsible for their own decisions. We process
          Reputation Score data to operate the Service and to support dispute and appeal
          processes as described in our Terms.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Dispute Policy and Data
        </h2>
        <p className="mb-4">
          If you submit a dispute, we collect your dispute description, evidence you
          upload, and related correspondence. Disputes are reviewed by administrators.
          One appeal per dispute is allowed. Abuse may result in suspension. Dispute and
          appeal data may be retained for compliance and audit purposes.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Employer Liability and Data
        </h2>
        <p>
          Rehire eligibility and employer-submitted data are provided by employers.
          WorkVouch does not guarantee the accuracy of employer input. We store and
          process such data to operate the Service and for audit and dispute resolution.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Platform Limitation
        </h2>
        <p>
          WorkVouch is not a background check service, consumer reporting agency, or
          credit bureau. We do not furnish consumer reports for eligibility decisions
          under FCRA. Our processing of data is for verification and reference
          infrastructure only.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Information We Collect
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Account and profile information (email, name, job history, industry)</li>
          <li>Payment information (processed via Stripe; we do not store full card details)</li>
          <li>Dispute and evidence submissions</li>
          <li>Usage data and device information (IP, browser) for security and operations</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          How We Use Your Information
        </h2>
        <p className="mb-4">
          We use your data to operate the Service, calculate Reputation Scores, process
          disputes and appeals, enforce policies, process payments, and comply with
          legal obligations. We do not sell your personal information.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Identity Verification for Data Changes
        </h2>
        <p className="mb-4">
          Before we process certain data changes (including dispute submissions and
          sensitive updates), we may require identity verification. Data deletion
          requests require identity confirmation. We will not process such requests
          without confirming that the requester is the account holder or an authorized
          representative.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Your Rights; Data Deletion and Compliance Retention
        </h2>
        <p className="mb-4">
          You may request access, correction, or deletion of your personal data.
          Contact{" "}
          <a href={"mailto:" + LEGAL_EMAIL} className="text-primary hover:underline">
            {LEGAL_EMAIL}
          </a>
          . GDPR and CCPA rights apply where applicable. WorkVouch may retain certain
          data for compliance, legal, or audit reasons as described in our Data
          Retention Policy, even after account closure or deletion requests.
        </p>
      </section>

      <div className="mt-8 pt-6 border-t border-grey-background dark:border-[#374151]">
        <p className="text-sm text-grey-medium dark:text-gray-400">
          See also{" "}
          <Link href="/legal/terms" className="text-primary hover:underline">
            Terms of Service
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
