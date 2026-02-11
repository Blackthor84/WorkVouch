import { headers } from "next/headers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONTACT_EMAIL, SUPPORT_EMAIL, LEGAL_EMAIL, SALES_EMAIL } from "@/lib/constants/contact";

export default async function ContactPage() {
  const h = await headers();
  const accept = h.get("accept") ?? "(none)";
  const contentType = h.get("content-type") ?? "(none)";
  const nextRouterPrefetch = h.get("next-router-prefetch") ?? "(none)";
  const rsc = h.get("rsc") ?? "(none)";
  console.log("[ /contact ] Request headers:");
  console.log("  accept:", accept);
  console.log("  content-type:", contentType);
  console.log("  next-router-prefetch:", nextRouterPrefetch);
  console.log("  rsc:", rsc);

  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117] min-w-0 overflow-x-hidden">
        <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-4xl mx-auto min-w-0">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-4 md:text-4xl">
              Contact Us
            </h1>
            <p className="text-base text-grey-medium dark:text-gray-400 md:text-lg">
              We&apos;re here to help. Get in touch with our team.
            </p>
            <p className="mt-2 text-grey-medium dark:text-gray-400">
              Primary:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline font-semibold">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                General Support
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4">
                For questions about your account, features, or how to use
                WorkVouch.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary hover:underline font-semibold"
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-2">
                Response time: 24-48 hours
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Privacy & Legal
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4">
                For privacy requests, legal questions, or data deletion
                requests.
              </p>
              <a
                href={`mailto:${LEGAL_EMAIL}`}
                className="text-primary hover:underline font-semibold"
              >
                {LEGAL_EMAIL}
              </a>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-2">
                Response time: 30 business days for legal requests
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Security Issues
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4">
                To report security vulnerabilities or security concerns.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary hover:underline font-semibold"
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-2">
                We appreciate responsible disclosure
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Sales & Employer Inquiries
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4">
                For employers interested in using WorkVouch, pricing, demos, or enterprise.
              </p>
              <a
                href={`mailto:${SALES_EMAIL}`}
                className="text-primary hover:underline font-semibold"
              >
                {SALES_EMAIL}
              </a>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-2">
                Response time: 24-48 hours
              </p>
            </Card>
          </div>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Help Center
            </h2>
            <p className="text-grey-medium dark:text-gray-400 mb-6">
              Before contacting us, check out our Help Center for answers to
              common questions.
            </p>
            <Button href="/help" variant="primary">
              Visit Help Center
            </Button>
          </Card>
        </div>
    </div>
  );
}
