import Link from "next/link";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  lastUpdated = "January 2025",
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
      <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
            {title}
          </h1>
          <p className="text-lg text-grey-medium dark:text-gray-400">
            Last Updated: {lastUpdated}
          </p>
          <nav className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/legal/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link href="/legal/data-retention" className="text-primary hover:underline">
              Data Retention
            </Link>
            <Link href="/legal/dispute-resolution" className="text-primary hover:underline">
              Dispute Resolution
            </Link>
            <Link href="/legal/employer-submission" className="text-primary hover:underline">
              Employer Submission
            </Link>
            <Link href="/legal/employer-agreement" className="text-primary hover:underline">
              Employer Agreement
            </Link>
          </nav>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-8 space-y-6 text-grey-medium dark:text-gray-400">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
