"use client";

import type { LeaderboardEntry } from "@/lib/actions/leaderboard";

export function Leaderboard({ users }: { users: LeaderboardEntry[] }) {
  if (!users.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Most trusted</h2>
      <ul className="space-y-1">
        {users.map((u, i) => (
          <li
            key={u.id}
            className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-slate-50"
          >
            <span className="text-sm font-medium text-slate-700">
              {i + 1}. {u.full_name || "Anonymous"}
            </span>
            <span className="text-sm font-semibold text-slate-900">{u.trust_score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
