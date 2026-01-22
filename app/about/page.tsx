import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <main className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
      <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200">
            About WorkVouch
          </h1>
          <p className="text-lg text-grey-medium dark:text-gray-400 mt-4">
            Building the world's first peer-verified career network
          </p>
        </div>

        {/* Content Sections */}
        <div className="flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Our Mission
            </h2>
            <p className="text-grey-medium dark:text-gray-400 leading-relaxed">
              WorkVouch was founded on a simple idea: your work reputation
              should be verified by the people who actually worked with you.
              We're building a platform where job seekers can create trusted
              career profiles with peer-verified references, and employers can
              verify candidate work history instantly and affordably.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              How It Works
            </h2>
            <div className="space-y-4 text-grey-medium dark:text-gray-400">
              <div>
                <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  1. Add Your Jobs
                </h3>
                <p>
                  List your work history with company names, job titles, and
                  dates.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  2. Get Verified
                </h3>
                <p>
                  WorkVouch matches you with coworkers who worked at the same
                  company. They verify your employment and can write references.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  3. Build Your Trust Score
                </h3>
                <p>
                  Your Trust Score (0-100) grows as you add verified jobs and
                  receive peer references. It shows employers how verified and
                  trustworthy your profile is.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  4. Stand Out to Employers
                </h3>
                <p>
                  Employers can verify your work history in seconds through your
                  WorkVouch profile. No more waiting weeks for background
                  checks.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Why WorkVouch?
            </h2>
            <ul className="space-y-3 text-grey-medium dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>
                  <strong className="text-grey-dark dark:text-gray-200">
                    Peer Verification:
                  </strong>{" "}
                  Only coworkers who actually worked with you can verify your
                  jobs and write references.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>
                  <strong className="text-grey-dark dark:text-gray-200">
                    Trust Score:
                  </strong>{" "}
                  A 0-100 score that quantifies how verified and trustworthy
                  your career profile is.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>
                  <strong className="text-grey-dark dark:text-gray-200">
                    Industry-Specific:
                  </strong>{" "}
                  Tailored for law enforcement, security, hospitality, retail,
                  and warehousing professionals.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>
                  <strong className="text-grey-dark dark:text-gray-200">
                    Affordable:
                  </strong>{" "}
                  Free for job seekers, affordable subscriptions for employers.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>
                  <strong className="text-grey-dark dark:text-gray-200">
                    Instant:
                  </strong>{" "}
                  Employers verify candidate work history in seconds, not days
                  or weeks.
                </span>
              </li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Our Focus
            </h2>
            <p className="text-grey-medium dark:text-gray-400 leading-relaxed mb-4">
              WorkVouch is built specifically for industries where verification
              and references matter most:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  Law Enforcement
                </h3>
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Police, sheriff's departments, federal agencies
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  Security
                </h3>
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Private security, corporate security, event security
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  Hospitality
                </h3>
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Hotels, restaurants, event venues
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  Retail
                </h3>
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Stores, supermarkets, customer service
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  Warehousing & Logistics
                </h3>
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Warehouse associates, forklift operators, fulfillment workers,
                  logistics team members
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Contact Us
            </h2>
            <p className="text-grey-medium dark:text-gray-400 mb-4">
              Have questions or feedback? We'd love to hear from you.
            </p>
            <div className="space-y-2 text-grey-medium dark:text-gray-400">
              <p>
                <strong className="text-grey-dark dark:text-gray-200">
                  Email:
                </strong>{" "}
                support@workvouch.com
              </p>
              <p>
                <strong className="text-grey-dark dark:text-gray-200">
                  Support:
                </strong>{" "}
                <a href="/help" className="text-primary hover:underline">
                  Help Center
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
