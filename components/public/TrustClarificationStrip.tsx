export default function TrustClarificationStrip() {
  return (
    <section
      className="border-t border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30"
      aria-label="Trust clarification"
    >
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-6">
        <p className="text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          WorkVouch is not a background check service and does not verify
          criminal history, licenses, or certifications. Trust scores are
          informational and based on employment overlap and peer validation.
        </p>
      </div>
    </section>
  );
}
