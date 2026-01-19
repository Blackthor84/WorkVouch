import { Navbar } from '@/components/navbar'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-grey-medium dark:text-gray-400">
              Last Updated: January 2025
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-8 space-y-6 text-grey-medium dark:text-gray-400">
              <p className="leading-relaxed">
                WorkVouch ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">1. Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">Information You Provide</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Account information (email, password, full name)</li>
                      <li>Profile information (job history, skills, certifications)</li>
                      <li>Industry information</li>
                      <li>Payment information (processed securely through Stripe)</li>
                      <li>References and messages</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">Information Automatically Collected</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Usage data (pages visited, features used)</li>
                      <li>Device information (IP address, browser type)</li>
                      <li>Cookies and session data</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">2. How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Create and manage your account</li>
                  <li>Display your profile to employers</li>
                  <li>Match you with coworkers</li>
                  <li>Calculate and display your Trust Score</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Send notifications and communications</li>
                  <li>Improve our Service</li>
                  <li>Comply with legal requirements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">3. Where Your Data Is Stored</h2>
                <p className="mb-4">
                  Your data is stored securely in Supabase (PostgreSQL database) with enterprise-grade encryption. 
                  Data may be stored in multiple geographic locations for redundancy.
                </p>
                <p>
                  Payment information is processed through Stripe, a PCI-DSS Level 1 certified payment processor. 
                  We do not store full payment details on our servers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">4. Your Privacy Rights</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">GDPR Rights (European Users)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Right to access your personal data</li>
                      <li>Right to rectification (correction)</li>
                      <li>Right to erasure ("right to be forgotten")</li>
                      <li>Right to restrict processing</li>
                      <li>Right to data portability</li>
                      <li>Right to object to processing</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">CCPA Rights (California Users)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Right to know what data is collected</li>
                      <li>Right to delete personal information</li>
                      <li>Right to opt-out of sale (WorkVouch does not sell personal information)</li>
                      <li>Right to non-discrimination</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4">
                  To exercise your rights, contact us at <a href="mailto:privacy@workvouch.com" className="text-primary hover:underline">privacy@workvouch.com</a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">5. Data Security</h2>
                <p className="mb-4">
                  We implement industry-standard security measures including encryption in transit (HTTPS/TLS) and 
                  encryption at rest (AES-256). We conduct regular security audits and monitor for security threats.
                </p>
                <p>
                  In the event of a data breach, we will notify affected users within 72 hours of discovery.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">6. Contact Us</h2>
                <p>
                  For privacy-related questions or requests, contact us at:
                </p>
                <ul className="list-none space-y-2 mt-4">
                  <li><strong className="text-grey-dark dark:text-gray-200">Email:</strong> <a href="mailto:privacy@workvouch.com" className="text-primary hover:underline">privacy@workvouch.com</a></li>
                  <li><strong className="text-grey-dark dark:text-gray-200">Support:</strong> <a href="mailto:support@workvouch.com" className="text-primary hover:underline">support@workvouch.com</a></li>
                </ul>
              </section>

              <div className="mt-8 pt-6 border-t border-grey-background dark:border-[#374151]">
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  For the complete Privacy Policy, including detailed information about data retention, cookies, 
                  employer access, and more, please see our <Link href="/docs/legal/PRIVACY_POLICY.md" className="text-primary hover:underline">full Privacy Policy document</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
