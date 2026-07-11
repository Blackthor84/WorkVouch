import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-wv-border py-10 text-center text-sm text-wv-muted">
      <div className="mb-4 flex flex-wrap justify-center gap-6">
        <Link href="/employers" className="hover:text-wv-foreground transition-colors">
          Employers
        </Link>
        <Link href="/demo" className="hover:text-wv-foreground transition-colors">
          Live Demo
        </Link>
        <Link href="/privacy" className="hover:text-wv-foreground transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-wv-foreground transition-colors">
          Terms
        </Link>
      </div>
      <p>© {new Date().getFullYear()} WorkVouch</p>
    </footer>
  );
}
