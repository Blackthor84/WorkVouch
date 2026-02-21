import { getEffectiveUser } from "@/lib/sandbox/effectiveUser";

export async function ImpersonationBannerServer() {
  const effectiveUser = await getEffectiveUser();

  if (!effectiveUser || effectiveUser.type !== "impersonated") return null;

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b-2 border-amber-400 bg-amber-500 px-4 py-2 text-sm text-black"
      role="status"
      aria-label="Sandbox impersonation active"
    >
      <span className="font-medium">
        Impersonating: {effectiveUser.name ?? effectiveUser.userId}
      </span>
      <form action="/api/sandbox/stop-impersonation" method="POST">
        <button type="submit" className="ml-4 underline font-medium hover:no-underline">
          Stop
        </button>
      </form>
    </div>
  );
}
