import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Data Retention Policy | WorkVouch",
  description:
    "WorkVouch Data Retention Policy: retention periods, compliance retention, and deletion requests.",
};

export default function DataRetentionPolicyPage() {
  return (
    <LegalPageLayout title="Data Retention Policy" lastUpdated="January 2025">
      <p className="leading-relaxed">
        This Data Retention Policy describes how WorkVouch retains and disposes of
        data. WorkVouch displays employer-submitted and peer-submitted information.
        Employers are responsible for evaluations they submit. WorkVouch does not make
        hiring decisions.
      </p>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Retention Periods
        </h2>
        <p className="mb-4">
          We retain account, profile, employment, and reference data for the duration
          of your account and as needed to operate the Service, resolve disputes, and
          comply with legal obligations.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Data Deletion Requests
        </h2>
        <p className="mb-4">
          Data deletion requests require identity confirmation. We will not process
          deletion requests without verifying that the requester is the account holder
          or an authorized representative. Contact{" "}
          <a href="mailto:privacy@workvouch.com" className="text-primary hover:underline">
            privacy@workvouch.com
          </a>{" "}
          for deletion requests.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Compliance and Legal Retention
        </h2>
        <p className="mb-4">
          WorkVouch may retain certain data for compliance, legal, or audit reasons
          after account closure or after a deletion request. This may include dispute
          and appeal records, audit logs, employer submission records, and data
          required by law or for the establishment, exercise, or defense of legal
          claims.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Contact
        </h2>
        <p>
          For questions about data retention:{" "}
          <a href="mailto:privacy@workvouch.com" className="text-primary hover:underline">
            privacy@workvouch.com
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
