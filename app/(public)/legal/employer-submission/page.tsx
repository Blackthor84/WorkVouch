import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Employer Submission Policy | WorkVouch",
  description:
    "WorkVouch Employer Submission Policy: rehire evaluations, structured reasons, and employer responsibility.",
};

export default function EmployerSubmissionPolicyPage() {
  return (
    <LegalPageLayout title="Employer Submission Policy" lastUpdated="January 2025">
      <p className="leading-relaxed">
        WorkVouch displays employer-submitted and peer-submitted information.
        Employers are responsible for evaluations they submit. WorkVouch does not make
        hiring decisions. This policy describes how employer submissions (including
        rehire status) are structured and governed.
      </p>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Employer Responsibility
        </h2>
        <p className="mb-4">
          Employers are solely responsible for submitted evaluations, including
          rehire status and related reasons. WorkVouch does not guarantee the
          accuracy of employer-submitted data. Employers must comply with all
          applicable employment and fair-chance hiring laws.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Rehire Status and Structured Reasons
        </h2>
        <p className="mb-4">
          Employer rehire submissions must use defined statuses (e.g., Approved,
          Eligible With Review, Not Eligible) and a mandatory structured reason
          selection. Permitted reason categories include attendance issues, policy
          violation, performance concerns, contract completion, role eliminated, or
          other (with written explanation). Written justification is required when
          status indicates eligible with review or not eligible. Free-form
          &quot;mark not eligible&quot; without reason or justification is not
          permitted.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Disputes and Identity Verification
        </h2>
        <p className="mb-4">
          Users may dispute employer-submitted rehire status through our dispute
          system. Identity verification is required before we process dispute
          submissions and certain data changes. Data deletion requests require
          identity confirmation. WorkVouch may retain certain data for compliance
          reasons as described in our Data Retention Policy.
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
          </Link>
          ,{" "}
          <Link href="/legal/employer-agreement" className="text-primary hover:underline">
            Employer Agreement
          </Link>
          , and{" "}
          <Link href="/legal/dispute-resolution" className="text-primary hover:underline">
            Dispute Resolution Policy
          </Link>
          .
        </p>
      </div>
    </LegalPageLayout>
  );
}
