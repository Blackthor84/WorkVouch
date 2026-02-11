export default function TrustedBySection() {
  return (
    <section className="border-y border-[#E2E8F0] bg-white py-12 md:py-16" id="trusted-by">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 overflow-x-hidden">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-[#64748B]">
          Trusted by growing teams
        </p>
        <p className="mt-4 text-center text-base text-[#334155] max-w-2xl mx-auto">
          Healthcare, logistics, security, and other high-trust industries use WorkVouch to verify experience and hire with confidence.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-[#64748B]">
          <span className="text-sm font-medium">Healthcare</span>
          <span className="text-sm font-medium">Logistics</span>
          <span className="text-sm font-medium">Security</span>
          <span className="text-sm font-medium">Staffing</span>
          <span className="text-sm font-medium">Corporate HR</span>
        </div>
      </div>
    </section>
  );
}
