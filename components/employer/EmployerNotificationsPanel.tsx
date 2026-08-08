"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { WvCard, WvButton, WvEmptyState, WvLoadingState } from "@/components/wv";

type EmployerNotification = {
  id: string;
  type: string;
  related_user_id: string | null;
  related_record_id: string | null;
  read: boolean;
  created_at: string;
};

function labelForType(type: string): string {
  switch (type) {
    case "verification_confirmed":
      return "Verification confirmed";
    case "verification_requested":
      return "Verification requested";
    case "dispute":
      return "Employment dispute";
    case "message":
      return "New message";
    case "listed_employee":
      return "Employee listed your company";
    default:
      return "Update";
  }
}

function hrefForNotification(n: EmployerNotification): string {
  if (n.type === "message") return "/employer/messages";
  if (n.related_user_id) return `/employer/profile/${n.related_user_id}`;
  if (n.type === "listed_employee" || n.type === "verification_requested") {
    return "/employer/listed-employees";
  }
  return "/employer/dashboard";
}

export function EmployerNotificationsPanel() {
  const [list, setList] = useState<EmployerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/notifications", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to load notifications");
      }
      setList((data as { notifications?: EmployerNotification[] }).notifications ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/employer/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  if (loading) {
    return (
      <WvCard padding="lg">
        <WvLoadingState label="Loading notifications…" />
      </WvCard>
    );
  }

  if (error) {
    return (
      <WvCard padding="lg">
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
        <WvButton size="sm" className="mt-4" onClick={load}>
          Retry
        </WvButton>
      </WvCard>
    );
  }

  if (list.length === 0) {
    return (
      <WvEmptyState
        icon={<Bell className="h-6 w-6" />}
        title="No notifications"
        description="Verification updates, listed employees, and messages appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {list.map((n) => (
        <li key={n.id}>
          <Link
            href={hrefForNotification(n)}
            onClick={() => !n.read && markRead(n.id)}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wv-brand-blue/40 rounded-2xl"
          >
            <WvCard
              padding="md"
              className={!n.read ? "border-wv-brand-blue/30 bg-wv-surface-hover/50" : ""}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-wv-foreground">{labelForType(n.type)}</p>
                  <p className="mt-1 text-xs text-wv-subtle">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-wv-brand-blue" aria-hidden />
                )}
              </div>
            </WvCard>
          </Link>
        </li>
      ))}
    </ul>
  );
}
