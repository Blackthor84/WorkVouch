import Link from "next/link";
import { isSafeConnectInviteReturnTo } from "@/lib/auth/safeReturnTo";

export const dynamic = "force-dynamic";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo?.trim() ?? "";
  const connectInviteReturn = isSafeConnectInviteReturnTo(returnTo);
  const loginHref = connectInviteReturn
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/login";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-wv-bg px-4">
      <div className="bg-wv-surface p-8 rounded-xl shadow-lg w-full max-w-md border border-wv-border text-center">
        <h1 className="text-2xl font-bold text-wv-foreground mb-2">Check your email</h1>
        <p className="text-wv-muted text-sm mb-4">
          We sent you a confirmation link. Click it to verify your email and finish signing up.
        </p>
        {connectInviteReturn && (
          <p className="text-sm text-blue-300 mb-4 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
            After you verify your email, you&apos;ll return automatically to complete your WorkVouch
            invitation.
          </p>
        )}
        <Link href={loginHref} className="inline-block text-blue-400 hover:text-blue-300 font-medium">
          Back to log in
        </Link>
      </div>
    </div>
  );
}
