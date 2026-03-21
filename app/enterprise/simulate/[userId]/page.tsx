"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EnterpriseSimulateClient = dynamic(
  () => import("@/components/enterprise/EnterpriseSimulateClient"),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Loading hiring insights…
      </div>
    ),
  }
);

type SummaryCandidate = {
  candidateId: string;
  fullName: string;
  industry: string | null;
  roleHint: string | null;
  trustScore: number | null;
  verificationCount: number;
};

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params?.userId === "string" ? params.userId : undefined;

  const [ready, setReady] = useState<{
    candidateId: string;
    initial: {
      fullName: string;
      industryLabel: string | null;
      roleHint: string | null;
      trustScore: number | null;
      referenceCount: number | null;
      jobCount: number | null;
    };
  } | null>(null);

  useEffect(() => {
    if (!userId) {
      router.replace("/enterprise/dashboard");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/employer/hiring-intelligence/summary?range=90", {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 403) {
            router.replace("/login");
            return;
          }
          router.replace("/enterprise/dashboard");
          return;
        }

        const data = (await res.json()) as { candidates?: SummaryCandidate[] };
        const cand = (data.candidates ?? []).find((c) => c.candidateId === userId);

        if (cancelled) return;
        if (!cand) {
          router.replace("/enterprise/dashboard");
          return;
        }

        setReady({
          candidateId: userId,
          initial: {
            fullName: cand.fullName,
            industryLabel: cand.industry ?? null,
            roleHint: cand.roleHint,
            trustScore: cand.trustScore,
            referenceCount: cand.verificationCount,
            jobCount: null,
          },
        });
      } catch {
        if (!cancelled) router.replace("/enterprise/dashboard");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, router]);

  if (!userId || !ready) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Loading hiring insights…
      </div>
    );
  }

  return <EnterpriseSimulateClient candidateId={ready.candidateId} initial={ready.initial} />;
}
