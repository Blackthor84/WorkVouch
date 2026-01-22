import { NavbarServer } from '@/components/navbar-server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  return (
    <>
      <NavbarServer />
      <main className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
        <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-grey-medium dark:text-gray-400">
              We're here to help. Get in touch with our team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                General Support
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4">
                For questions about your account, features, or how to use WorkVouch.
              </p>
              <a href="mailto:support@workvouch.com" className="text-primary hover:underline font-semibold">
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
              <a href="mailto:privacy@workvouch.com" className="text-primary hover:underline font-semibold">
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
              <a href="mailto:security@workvouch.com" className="text-primary hover:underline font-semibold">
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
              <a href="mailto:employers@workvouch.com" className="text-primary hover:underline font-semibold">
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
