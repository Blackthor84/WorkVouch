import { Card } from "@/components/ui/card";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/constants/contact";

export default function HelpPage() {
  const faqCategories = [
    {
      title: "Getting Started",
      questions: [
        {
          q: "What is WorkVouch?",
          a: "WorkVouch is a peer-verified career platform that helps you build a trusted work history profile using references from coworkers who actually worked with you.",
        },
        {
          q: "How does peer verification work?",
          a: "When you add a job, WorkVouch matches you with coworkers who worked at the same company. They verify your employment and can write references.",
        },
        {
          q: "How do I create an account?",
          a: 'Click "Get Started Free" on the homepage, enter your information, select your industry, and verify your email address.',
        },
      ],
    },
    {
      title: "Reputation Score",
      questions: [
        {
          q: "What is the Reputation Score?",
          a: "The Reputation Score is a 0-100 rating that reflects how verified and trustworthy your career profile is, based on verified jobs and peer references.",
        },
        {
          q: "How is my Reputation Score calculated?",
          a: "Scores are calculated from verified jobs, peer references, reference quality, and profile completeness. Scores update nightly.",
        },
        {
          q: "How can I improve my Reputation Score?",
          a: "Add more verified jobs, request references from coworkers, complete your profile, and ensure all jobs are verified.",
        },
      ],
    },
    {
      title: "Coworker Matching",
      questions: [
        {
          q: "How are coworkers matched?",
          a: "WorkVouch finds people who worked at the same company during overlapping dates and are registered on WorkVouch.",
        },
        {
          q: "What if I can't find my coworkers?",
          a: "You can invite coworkers by email. They'll receive an invitation to join WorkVouch and verify your work.",
        },
        {
          q: "What if a coworker denies my verification?",
          a: "Review your job details for accuracy. You can contact the coworker directly or remove the job if it's incorrect.",
        },
      ],
    },
    {
      title: "References",
      questions: [
        {
          q: "What are peer references?",
          a: "Peer references are written evaluations from coworkers who worked with you, including work quality, skills, and specific examples.",
        },
        {
          q: "Who can write me a reference?",
          a: "Only verified coworkers who confirmed they worked with you can write references.",
        },
        {
          q: "Can I remove a bad reference?",
          a: "Yes. You can dispute references that are false, defamatory, or written by non-coworkers through WorkVouch support.",
        },
      ],
    },
    {
      title: "Account & Privacy",
      questions: [
        {
          q: "Is my data safe?",
          a: "Yes. WorkVouch uses industry-standard encryption, secure password hashing, and stores data in Supabase with enterprise-grade security.",
        },
        {
          q: "Who can see my profile?",
          a: "You can always see your profile. Employers with active subscriptions can view it (with your consent). Your profile is not publicly visible.",
        },
        {
          q: "Can I delete my account?",
          a: "Yes. Go to Settings > Data > Delete Account. Your data will be removed within 30 days.",
        },
      ],
    },
    {
      title: "Troubleshooting",
      questions: [
        {
          q: "I can't log in. What should I do?",
          a: "Check your email and password, try resetting your password, or contact support if issues persist.",
        },
        {
          q: "My Reputation Score isn't updating. Why?",
          a: "Reputation Scores update nightly. Wait 24 hours after adding jobs/references. Ensure jobs are verified and references are approved.",
        },
        {
          q: "I'm not receiving verification emails.",
          a: "Check your spam folder, verify your email address, try resending the verification email, or contact support.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
              Help Center
            </h1>
            <p className="text-lg text-grey-medium dark:text-gray-400">
              Find answers to common questions about WorkVouch
            </p>
          </div>

          <div className="space-y-8">
            {faqCategories.map((category, idx) => (
              <Card key={idx} className="p-8">
                <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-6">
                  {category.title}
                </h2>
                <div className="space-y-6">
                  {category.questions.map((faq, faqIdx) => (
                    <div key={faqIdx}>
                      <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                        {faq.q}
                      </h3>
                      <p className="text-grey-medium dark:text-gray-400">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-8 mt-12">
            <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Still Need Help?
            </h2>
            <p className="text-grey-medium dark:text-gray-400 mb-6">
              Can&apos;t find what you&apos;re looking for? Contact our support team at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-medium">{SUPPORT_EMAIL}</a>
              {" "}and we&apos;ll get back to you within 24-48 hours.
            </p>
            <div className="flex gap-4">
              <Link href="/contact" className="inline-block">
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition">
                  Contact Support
                </button>
              </Link>
              <Link href="/faq" className="inline-block">
                <button className="px-6 py-2 bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-300 border border-grey-background dark:border-[#374151] rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-[#1A1F2B] transition">
                  View Full FAQ
                </button>
              </Link>
            </div>
          </Card>
        </div>
    </div>
  );
}
