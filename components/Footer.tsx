import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-blue-700 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8">
          <div>
            <h3 className="font-semibold mb-4 text-lg">WorkVouch</h3>
            <p className="text-sm opacity-90 mb-4">
              Verified work history for real careers. Build trust, verify experience, and hire with confidence.
            </p>
            <p className="text-sm">
              <strong>Support:</strong>{" "}
              <a href="mailto:support@workvouch.com" className="hover:underline">
                support@workvouch.com
              </a>
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-lg">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:underline opacity-90 hover:opacity-100">About</Link></li>
              <li><Link href="/careers" className="hover:underline opacity-90 hover:opacity-100">Careers</Link></li>
              <li><Link href="/contact" className="hover:underline opacity-90 hover:opacity-100">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-lg">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="hover:underline opacity-90 hover:opacity-100">Pricing</Link></li>
              <li><Link href="/directory" className="hover:underline opacity-90 hover:opacity-100">Directory</Link></li>
              <li><Link href="/faq" className="hover:underline opacity-90 hover:opacity-100">FAQ</Link></li>
              <li><Link href="/help" className="hover:underline opacity-90 hover:opacity-100">Help</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-lg">Industry Solutions</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/security-agencies" className="hover:underline opacity-90 hover:opacity-100">Security Agencies</Link></li>
              <li><Link href="/solutions" className="hover:underline opacity-90 hover:opacity-100">All Solutions</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-lg">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="hover:underline opacity-90 hover:opacity-100">Terms</Link></li>
              <li><Link href="/legal/privacy" className="hover:underline opacity-90 hover:opacity-100">Privacy</Link></li>
              <li><Link href="/legal/employer-agreement" className="hover:underline opacity-90 hover:opacity-100">Employer Agreement</Link></li>
              <li><Link href="/how-disputes-work" className="hover:underline opacity-90 hover:opacity-100">How Disputes Work</Link></li>
              <li><Link href="/compliance" className="hover:underline opacity-90 hover:opacity-100">Compliance</Link></li>
              <li><Link href="/security" className="hover:underline opacity-90 hover:opacity-100">Trust &amp; Compliance</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue-600 mt-8 pt-8 text-center text-sm opacity-75">
          <p>&copy; {new Date().getFullYear()} WorkVouch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
