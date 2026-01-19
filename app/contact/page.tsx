import { Navbar } from '@/components/navbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-grey-medium dark:text-gray-400">
              We're here to help. Get in touch with our team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                General Support
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4">
                For questions about your account, features, or how to use WorkVouch.
              </p>
              <a href="mailto:support@peercv.com" className="text-primary hover:underline font-semibold">
                support@workvouch.com
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
                For privacy requests, legal questions, or data deletion requests.
              </p>
              <a href="mailto:privacy@peercv.com" className="text-primary hover:underline font-semibold">
                privacy@workvouch.com
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
              <a href="mailto:security@peercv.com" className="text-primary hover:underline font-semibold">
                security@workvouch.com
              </a>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-2">
                We appreciate responsible disclosure
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Employer Inquiries
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4">
                For employers interested in using WorkVouch for hiring.
              </p>
              <a href="mailto:employers@peercv.com" className="text-primary hover:underline font-semibold">
                employers@workvouch.com
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
              Before contacting us, check out our Help Center for answers to common questions.
            </p>
            <Button href="/help" variant="primary">
              Visit Help Center
            </Button>
          </Card>
        </div>
      </main>
    </>
  )
}
