import Link from "next/link";

export function HomepageFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white w-full">
      <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
        <div className="text-center text-gray-600">
          <p className="mb-2">
            © {new Date().getFullYear()} WorkVouch. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <Link
              href="/privacy"
              className="hover:text-blue-600 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-blue-600 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="hover:text-blue-600 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
