"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/components/AuthProvider";
import { ProfileDropdown } from "@/components/workvouch/ProfileDropdown";
import { supabaseBrowser } from "@/lib/supabase/browser";

const navLinkClass = "text-white/90 hover:text-white transition whitespace-nowrap";
const navLinkActiveClass = "text-white font-medium";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loading } = useUser();

  const isLoading = loading;
  const isAuthenticated = user !== null;

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || (path !== "/coworker-matches" && pathname?.startsWith(path));

  return (
    <header className="sticky top-0 z-50">
      <nav className="h-14 flex items-center px-4 md:px-8 bg-blue-600/95 text-white backdrop-blur-md border-b border-blue-500/30 shadow-[0_1px_3px_-1px_rgba(37,99,235,0.12)]">
        <div className="flex flex-1 items-center justify-between gap-4 max-w-7xl mx-auto min-w-0">
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0 min-w-0">
            <Link href={isAuthenticated ? "/coworker-matches" : "/"} className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/images/workvouch-logo.png.png"
                alt="WorkVouch"
                width={300}
                height={100}
                className="h-10 w-auto flex-shrink-0 max-w-[120px]"
                priority
                style={{ objectFit: "contain", width: "auto", height: "40px" }}
              />
            </Link>
            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-5 flex-shrink-0">
                <Link href="/" className={navLinkClass}>Home</Link>
                <Link
                  href="/employers"
                  className={isActive("/employers") ? navLinkActiveClass : navLinkClass}
                >
                  For Employers
                </Link>
                <Link href="/about" className={navLinkClass}>About</Link>
                <Link href="/pricing" className={navLinkClass}>Pricing</Link>
                <Link href="/contact" className={navLinkClass}>Contact</Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-4">
              {isLoading && (
                <span className="text-white/90 text-sm">Loading...</span>
              )}
              {!isLoading && !isAuthenticated && (
                <>
                  <Link
                    href="/login"
                    className="text-white/90 hover:text-white border border-white/40 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap hover:bg-white/[0.08]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-white/95 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-white transition whitespace-nowrap shadow-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              {!isLoading && isAuthenticated && (
                <>
                  <Link href="/coworker-matches" className={isActive("/coworker-matches") ? navLinkActiveClass : navLinkClass}>
                    Dashboard
                  </Link>
                  <Link href="/requests" className={isActive("/requests") ? navLinkActiveClass : navLinkClass}>
                    Requests
                  </Link>
                  <Link href="/notifications" className={isActive("/notifications") ? navLinkActiveClass : navLinkClass}>
                    Notifications
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-white/90 hover:text-white transition whitespace-nowrap font-medium"
                  >
                    Logout
                  </button>
                  <ProfileDropdown />
                </>
              )}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -m-2 text-white/90 hover:text-white transition rounded-lg"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>
      {/* Mobile Menu — context-aware: marketing when logged out, app nav when logged in */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-blue-600/95 backdrop-blur-md border-t border-blue-500/30 py-4 px-4 z-50 space-y-1">
          {!isAuthenticated ? (
            <>
              <Link href="/" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/employers" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>For Employers</Link>
              <Link href="/about" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link href="/pricing" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/contact" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              <div className="pt-3 mt-3 border-t border-white/15 space-y-2">
                {!isLoading && (
                  <>
                    <Link
                      href="/login"
                      className="block text-center text-white/90 hover:text-white border border-white/40 py-2.5 rounded-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="block text-center bg-white text-blue-600 py-2.5 rounded-lg text-sm font-bold sm:text-base"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Your First Vouch
                    </Link>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/coworker-matches" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/requests" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Requests</Link>
              <Link href="/notifications" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Notifications</Link>
              <button type="button" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left py-2.5 text-white/90 hover:text-white font-medium">
                Logout
              </button>
              <div className="pt-2" onClick={() => setMobileMenuOpen(false)}>
                <ProfileDropdown />
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
