"use client";

export function MultiverseHUD() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 border-b border-amber-500/50 bg-amber-500/15 px-4 py-2 text-amber-900"
      role="alert"
    >
      <span className="font-semibold">MULTIVERSE MODE</span>
      <span className="opacity-90">— God Mode active. All changes are local and reversible.</span>
    </div>
  );
}
