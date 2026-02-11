import Link from "next/link";
import { INFO_EMAIL, SUPPORT_EMAIL, LEGAL_EMAIL, SALES_EMAIL } from "@/lib/constants/contact";

export default function Footer() {
  return (
    <footer className="bg-blue-700 text-white py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div>
            <h3 className="font-semibold mb-4 text-lg">WorkVouch</h3>
            <p className="text-sm text-blue-100 mb-4">
              Verified work history for real careers. Build trust, verify experience, and hire with confidence.
            </p>
            <div className="text-sm space-y-1">
              <p><strong>General Inquiries:</strong>{" "}<a href={"mailto:" + INFO_EMAIL} className="hover:underline">{INFO_EMAIL}</a></p>
              <p><strong>Support:</strong>{" "}<a href={"mailto:" + SUPPORT_EMAIL} className="hover:underline">{SUPPORT_EMAIL}</a></p>
              <p><strong>Legal:</strong>{" "}<a href={"mailto:" + LEGAL_EMAIL} className="hover:underline">{LEGAL_EMAIL}</a></p>
              <p><strong>Sales:</strong>{" "}<a href={"mailto:" + SALES_EMAIL} className="hover:underline">{SALES_EMAIL}</a></p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-lg">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:underline text-blue-100 hover:text-white">About</Link></li>
              <li><Link href="/careers" className="hover:underline text-blue-100 hover:text-white">Careers</Link></li>
              <li><Link href="/contact" className="hover:underline text-blue-100 hover:text-white">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-lg">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="hover:underline text-blue-100 hover:text-white">Pricing</Link></li>
              <li><Link href="/directory" className="hover:underline text-blue-100 hover:text-white">Directory</Link></li>
              <li><Link href="/faq" className="hover:underline text-blue-100 hover:text-white">FAQ</Link></li>
              <li><Link href="/help" className="hover:underline text-blue-100 hover:text-white">Help</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-lg">Industry Solutions</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/solutions" className="hover:underline text-blue-100 hover:text-white">All Solutions</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-lg">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="hover:underline text-blue-100 hover:text-white">Terms</Link></li>
              <li><Link href="/legal/privacy" className="hover:underline text-blue-100 hover:text-white">Privacy</Link></li>
              <li><Link href="/legal/employer-agreement" className="hover:underline text-blue-100 hover:text-white">Employer Agreement</Link></li>
              <li><Link href="/how-disputes-work" className="hover:underline text-blue-100 hover:text-white">How Disputes Work</Link></li>
              <li><Link href="/compliance" className="hover:underline text-blue-100 hover:text-white">Compliance</Link></li>
              <li><Link href="/security" className="hover:underline text-blue-100 hover:text-white">Trust &amp; Compliance</Link></li>
              <li><Link href="/scoring-methodology" className="hover:underline text-blue-100 hover:text-white">Trust &amp; Methodology</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue-600 mt-8 pt-8 text-center text-sm text-blue-100">
          <p>&copy; {new Date().getFullYear()} WorkVouch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
