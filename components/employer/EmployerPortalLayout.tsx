import { EmployerHeader } from "./employer-header";
import { EmployerSidebar } from "./employer-sidebar";

type EmployerPortalLayoutProps = {
  children: React.ReactNode;
  /** Wider main area (e.g. candidate search grids) */
  wide?: boolean;
};

/** Shared employer portal chrome — dark glass sidebar + header. */
export function EmployerPortalLayout({ children, wide = false }: EmployerPortalLayoutProps) {
  return (
    <div className="relative flex min-h-screen bg-wv-bg text-wv-foreground overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[600px] rounded-full bg-blue-600/10 blur-[90px]" />
      </div>
      <EmployerSidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <EmployerHeader />
        <main
          className={`flex-1 overflow-x-hidden px-4 py-8 md:px-6 md:py-10 ${wide ? "" : "max-w-7xl w-full mx-auto"}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
