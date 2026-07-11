"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useUser } from "@/components/AuthProvider";
import { ProfileDropdown } from "@/components/workvouch/ProfileDropdown";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { WvButton } from "@/components/wv";

const navLinkClass =
  "text-white/70 hover:text-white transition-colors whitespace-nowrap text-sm font-medium";
const navLinkActiveClass = "text-white font-semibold";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loading } = useUser();
  const pathname = usePathname();

  const isLoading = loading;
  const isAuthenticated = user !== null;
  const isActive = (path: string) =>
    pathname === path || (path !== "/coworker-matches" && pathname?.startsWith(path));

  if (pathname?.startsWith("/demo")) {
    return null;
  }

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-wv-bg/85 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-8"
        aria-label="Main navigation"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-8">
          <Link
            href={isAuthenticated ? "/coworker-matches" : "/"}
            className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wv-brand-blue/50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white shadow-lg shadow-blue-500/20 md:hidden">
              WV
            </span>
            <Image
              src="/images/workvouch-logo.png.png"
              alt="WorkVouch"
              width={300}
              height={100}
              className="hidden h-9 w-auto max-w-[120px] object-contain md:block"
              priority
              style={{ objectFit: "contain", height: "36px", width: "auto" }}
            />
          </Link>
          {!isAuthenticated && (
            <div className="hidden items-center gap-6 md:flex">
              <Link href="/" className={navLinkClass}>Home</Link>
              <Link href="/employers" className={isActive("/employers") ? navLinkActiveClass : navLinkClass}>
                For Employers
              </Link>
              <Link href="/about" className={navLinkClass}>About</Link>
              <Link href="/pricing" className={navLinkClass}>Pricing</Link>
              <Link href="/contact" className={navLinkClass}>Contact</Link>
              <Link href="/demo" className={isActive("/demo") ? navLinkActiveClass : navLinkClass}>
                Live Demo
              </Link>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {isLoading && <span className="text-sm text-white/50">Loading…</span>}
            {!isLoading && !isAuthenticated && (
              <>
                <WvButton href="/login" variant="ghost" size="sm">Login</WvButton>
                <WvButton href="/signup" size="sm">Sign Up</WvButton>
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
                <button type="button" onClick={handleLogout} className={cn(navLinkClass, "font-medium")}>
                  Logout
                </button>
                <ProfileDropdown />
              </>
            )}
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/5 hover:text-white md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-wv-bg/95 px-4 py-4 backdrop-blur-xl md:hidden">
          {!isAuthenticated ? (
            <div className="space-y-1">
              {[
                { href: "/", label: "Home" },
                { href: "/employers", label: "For Employers" },
                { href: "/about", label: "About" },
                { href: "/pricing", label: "Pricing" },
                { href: "/contact", label: "Contact" },
                { href: "/demo", label: "Live Demo" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
                <WvButton href="/login" variant="outline" className="w-full">Login</WvButton>
                <WvButton href="/signup" className="w-full">Get Your First Vouch</WvButton>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {[
                { href: "/coworker-matches", label: "Dashboard" },
                { href: "/requests", label: "Requests" },
                { href: "/notifications", label: "Notifications" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="block rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>
                  {label}
                </Link>
              ))}
              <button type="button" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/70 hover:bg-white/5">
                Logout
              </button>
              <div className="pt-2" onClick={() => setMobileMenuOpen(false)}>
                <ProfileDropdown />
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
