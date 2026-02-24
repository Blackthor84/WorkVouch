/**
 * Isolated layout for _not-found.
 * Does NOT import: Providers, LayoutWrapper, Navbar, analytics.
 * No useSearchParams — static only. Uses wrapper div; root layout owns <html>/<body>.
 */
export default function NotFoundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {children}
    </div>
  );
}
