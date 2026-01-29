import Link from "next/link";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-grey-medium dark:text-gray-400">
              Find answers to common questions about WorkVouch
            </p>
          </div>

          <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-8">
            <p className="text-grey-medium dark:text-gray-400 mb-8">
              For a comprehensive FAQ covering all topics, please see our{" "}
              <Link
                href="/docs/faq/FAQ.md"
                className="text-primary hover:underline"
              >
                complete FAQ document
              </Link>
              .
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                  Quick Links
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/help#getting-started"
                    className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  >
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      Getting Started
                    </h3>
                    <p className="text-sm text-grey-medium dark:text-gray-400">
                      Learn how to create an account and get started
                    </p>
                  </Link>
                  <Link
                    href="/help#trust-score"
                    className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  >
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      Trust Score
                    </h3>
                    <p className="text-sm text-grey-medium dark:text-gray-400">
                      Understand how Trust Scores work
                    </p>
                  </Link>
                  <Link
                    href="/help#coworker-matching"
                    className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  >
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      Coworker Matching
                    </h3>
                    <p className="text-sm text-grey-medium dark:text-gray-400">
                      How coworker verification works
                    </p>
                  </Link>
                  <Link
                    href="/help#references"
                    className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  >
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                      References
                    </h3>
                    <p className="text-sm text-grey-medium dark:text-gray-400">
                      About peer references
                    </p>
                  </Link>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                  Need More Help?
                </h2>
                <p className="text-grey-medium dark:text-gray-400 mb-4">
                  Can't find what you're looking for? Contact our support team.
                </p>
                <Link href="/contact" className="inline-block">
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition">
                    Contact Support
                  </button>
                </Link>
              </section>
            </div>
          </div>
        </div>
    </div>
  );
}
