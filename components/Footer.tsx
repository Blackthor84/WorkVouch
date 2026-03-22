import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t pt-6 pb-10 text-center text-sm text-gray-500">
      <div className="mb-4 flex justify-center gap-6">
        <Link href="/employers" className="hover:text-black">
          Employers
        </Link>
        <Link href="/privacy" className="hover:text-black">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-black">
          Terms
        </Link>
      </div>

      <p>© {new Date().getFullYear()} WorkVouch</p>
    </footer>
  );
}
