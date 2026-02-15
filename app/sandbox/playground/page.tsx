import Link from "next/link";
import { isSandbox } from "@/lib/app-mode";
import { PlaygroundClient } from "@/app/admin/sandbox-v2/playground/PlaygroundClient";

export const dynamic = "force-dynamic";

/**
 * /sandbox/playground — Only render when ENV === SANDBOX and role === ADMIN.
 * Layout already enforces admin; here we enforce sandbox mode.
 */
export default async function SandboxPlaygroundRoutePage() {
  if (!isSandbox()) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-6 text-center text-slate-700">
          <p className="font-semibold">Sandbox Playground is not available</p>
          <p className="mt-2 text-sm">
            Playground only renders when <code className="rounded bg-slate-200 px-1">ENV === SANDBOX</code> and your role is Admin.
          </p>
          <p className="mt-4"><Link href="/admin" className="text-blue-600 hover:underline">Back to Admin</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <p className="mb-4"><Link href="/admin" className="text-slate-600 hover:underline text-sm">← Back to Admin</Link></p>
      {/* Global banner — always visible in playground */}
      <div className="mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">🧪 SANDBOX PLAYGROUND</p>
        <p className="mt-1 text-amber-800">
          You are testing real WorkVouch flows with simulated data.
        </p>
        <p className="mt-0.5 text-amber-800">No production users or employers are affected.</p>
      </div>
      <PlaygroundClient />
    </div>
  );
}
