"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type GetInviteResponse = {
  user_name: string;
  company: string;
  token: string;
  status: "pending" | "accepted" | "declined";
  /** Present when API recorded first open (`invite_opened_at`). */
  just_opened?: boolean;
};

type Props = {
  /** URL token from server (sanitized); empty = invalid link */
  token: string;
};

/**
 * Client vouch flow using `/api/get-invite` + `/api/accept-invite` (simple fetch pattern).
 */
export function VouchConfirmClient({ token }: Props) {
  const [invite, setInvite] = useState<GetInviteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uiStatus, setUiStatus] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setLoadError(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    fetch(`/api/get-invite?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as GetInviteResponse & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(true);
          setInvite(null);
          return;
        }
        setInvite({
          user_name: data.user_name,
          company: data.company,
          token: data.token,
          status: data.status,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setInvite(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const respond = useCallback(
    async (decision: "yes" | "no") => {
      if (!invite?.token) return;
      setErr(null);
      setBusy(true);
      try {
        const res = await fetch("/api/accept-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            decision === "yes" ? { token: invite.token } : { token: invite.token, decision: "no" }
          ),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          status?: string;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          setErr(data.error === "already_resolved" ? "This invite was already answered." : "Something went wrong. Try again.");
          setBusy(false);
          return;
        }
        if (data.status === "accepted" || data.status === "already_accepted") {
          setUiStatus("accepted");
        } else if (data.status === "declined" || data.status === "already_declined") {
          setUiStatus("declined");
        }
      } catch {
        setErr("Network error. Check your connection.");
      } finally {
        setBusy(false);
      }
    },
    [invite]
  );

  if (!token || loadError) {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 bg-zinc-50 text-zinc-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-zinc-200">
          <h1 className="text-xl font-semibold tracking-tight">Link not found</h1>
          <p className="mt-2 text-zinc-600 text-[15px] leading-relaxed">
            This invite link is invalid or expired. Ask your coworker to send a new one.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-zinc-900 px-5 text-[15px] font-medium text-white w-full"
          >
            Go to WorkVouch
          </Link>
        </div>
      </main>
    );
  }

  if (loading || !invite) {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 bg-zinc-50 text-zinc-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-zinc-200 text-center text-zinc-600">
          Loading…
        </div>
      </main>
    );
  }

  const { user_name: userName, company, token: t } = invite;
  const status = uiStatus ?? invite.status;

  if (status === "accepted") {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 bg-emerald-50/80 text-zinc-900">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-emerald-100 text-center p-6">
          <h1 className="text-xl font-bold mb-4">🔥 You just vouched for them</h1>
          <p className="mb-4 text-zinc-600 text-[15px]">Want to get vouched too?</p>
          <Link
            href={`/signup?invite=${encodeURIComponent(t)}`}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-600 px-5 text-base font-semibold text-white active:scale-[0.99] transition-transform hover:bg-emerald-700"
          >
            Create your profile
          </Link>
          <p className="mt-3 text-[12px] text-zinc-400">Optional — no account was required to vouch.</p>
        </div>
      </main>
    );
  }

  if (status === "declined") {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 bg-zinc-50 text-zinc-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-zinc-200">
          <h1 className="text-xl font-semibold tracking-tight">Response recorded</h1>
          <p className="mt-2 text-zinc-600 text-[15px] leading-relaxed">You declined this vouch. No account was created.</p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-zinc-900 px-5 text-[15px] font-medium text-white w-full"
          >
            Go to WorkVouch
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 bg-zinc-50 text-zinc-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-zinc-200">
        <p className="text-[13px] font-medium uppercase tracking-wide text-zinc-400 mb-3">WorkVouch</p>
        <h1 className="text-[22px] font-semibold leading-snug tracking-tight">
          Did you work with <span className="text-zinc-950">{userName}</span> at <span className="text-zinc-950">{company}</span>?
        </h1>
        <p className="mt-3 text-zinc-600 text-[15px] leading-relaxed">You can respond without creating an account.</p>

        {err ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {err}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void respond("yes")}
            className="min-h-[52px] w-full rounded-xl bg-emerald-600 text-[16px] font-semibold text-white active:scale-[0.99] transition-transform disabled:opacity-50"
          >
            {busy ? "…" : "Yes 👍"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void respond("no")}
            className="min-h-[52px] w-full rounded-xl border-2 border-zinc-200 bg-white text-[16px] font-semibold text-zinc-800 active:scale-[0.99] transition-transform disabled:opacity-50"
          >
            No
          </button>
        </div>

        <p className="mt-8 text-center text-[12px] text-zinc-400 leading-relaxed">
          Please respond honestly. You can optionally sign up later — it&apos;s not required to vouch.
        </p>
      </div>
    </main>
  );
}
