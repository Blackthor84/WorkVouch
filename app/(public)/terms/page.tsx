import Link from "next/link";
import { LEGAL_EMAIL, SUPPORT_EMAIL } from "@/lib/constants/contact";

export default function TermsPage() {
  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
        <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-grey-medium dark:text-gray-400">
              Last Updated: January 2025
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-8 space-y-6 text-grey-medium dark:text-gray-400">
              <p className="leading-relaxed">
                By accessing or using WorkVouch ("Service"), you agree to be
                bound by these Terms of Service ("Terms"). If you disagree with
                any part of these terms, you may not access the Service.
              </p>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                  1. User Rights and Responsibilities
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      Account Creation
                    </h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        You must be at least 18 years old to use WorkVouch
                      </li>
                      <li>
                        You must provide accurate, current, and complete
                        information
                      </li>
                      <li>
                        You are responsible for maintaining account security
                      </li>
                      <li>
                        One person or entity may maintain only one account
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      Profile Information
                    </h3>
                    <p>
                      All job information must be truthful and accurate. You are
                      responsible for the content you post.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      Coworker Matching
                    </h3>
                    <p>
                      You may request coworker verification for jobs you've
                      listed. Coworkers must have worked at the same company
                      during overlapping dates.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                  2. Reputation Score System
                </h2>
                <p className="mb-4">
                  Reputation Scores range from 0-100 and are calculated based on
                  verified jobs, peer references, and reference quality. Scores
                  are recalculated when jobs or references are added or verified, or after dispute resolution. Reputation Scores are indicators, not
                  guarantees of job performance.
                </p>
                <p>
                  You may dispute Reputation Score calculations through support.
                  Disputes will be reviewed within 30 business days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                  3. Prohibited Behavior
                </h2>
                <p className="mb-4">You may not:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create fake accounts or impersonate others</li>
                  <li>Provide false or misleading job information</li>
                  <li>Request references from non-coworkers</li>
                  <li>Write false or defamatory references</li>
                  <li>Harass, threaten, or abuse other users</li>
                  <li>Use automated systems to access the Service</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
                <p className="mt-4">
                  Violations may result in immediate account suspension or
                  termination.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                  4. Privacy and Data
                </h2>
                <p>
                  Your data is stored securely in Supabase (PostgreSQL database)
                  with encryption. See our
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    {" "}
                    Privacy Policy
                  </Link>{" "}
                  for detailed information about data collection, use, and your
                  rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                  5. Disclaimers
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      Service Availability
                    </h3>
                    <p>
                      WorkVouch is provided "as is" without warranties. We do
                      not guarantee uninterrupted or error-free service.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      Reference Accuracy
                    </h3>
                    <p>
                      WorkVouch does not verify the accuracy of individual
                      references. References reflect the opinions of coworkers,
                      not WorkVouch.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      No Employment Guarantee
                    </h3>
                    <p>
                      WorkVouch does not guarantee job offers or employment. We
                      are a verification platform, not a job board or recruiter.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                  6. Limitation of Liability
                </h2>
                <p>
                  WorkVouch shall not be liable for any indirect, incidental,
                  special, or consequential damages. Our total liability shall
                  not exceed the amount you paid us in the past 12 months.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                  7. Contact
                </h2>
                <p>For questions about these Terms, contact us at:</p>
                <ul className="list-none space-y-2 mt-4">
                  <li>
                    <strong className="text-grey-dark dark:text-gray-200">
                      Email:
                    </strong>{" "}
                    <a
                      href={"mailto:" + LEGAL_EMAIL}
                      className="text-primary hover:underline"
                    >
                      {LEGAL_EMAIL}
                    </a>
                  </li>
                  <li>
                    <strong className="text-grey-dark dark:text-gray-200">
                      Support:
                    </strong>{" "}
                    <a
                      href={"mailto:" + SUPPORT_EMAIL}
                      className="text-primary hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </li>
                </ul>
              </section>

              <div className="mt-8 pt-6 border-t border-grey-background dark:border-[#374151]">
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  For the complete Terms of Service, including arbitration,
                  DMCA, intellectual property, and more, please see our{" "}
                  <Link
                    href="/docs/legal/TERMS_OF_SERVICE.md"
                    className="text-primary hover:underline"
                  >
                    full Terms of Service document
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
