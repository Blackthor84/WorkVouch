"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DocumentArrowUpIcon,
  UserCircleIcon,
  BriefcaseIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const fakeShortcuts = [
  { href: "#", label: "Upload Resume", icon: DocumentArrowUpIcon, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  { href: "#", label: "Profile", icon: UserCircleIcon, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  { href: "#", label: "Job History", icon: BriefcaseIcon, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
  { href: "#", label: "Coworker Matches", icon: UserGroupIcon, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" },
];

const fakeActivity = [
  { id: 1, message: "New reference from John Doe", time: "2 hours ago" },
  { id: 2, message: "Coworker match found at ABC Security", time: "1 day ago" },
  { id: 3, message: "New message from employer", time: "2 days ago" },
];

export default function AdminDemoWorkerClient() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">
            Worker Dashboard Demo
          </h1>
          <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
            Simulated data — no database. Admin demo only.
          </p>
        </div>
        <Button variant="secondary" href="/admin/demo">
          Back to Demo Hub
        </Button>
      </div>

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 mb-8 text-amber-800 dark:text-amber-200 text-sm font-medium">
        Demo Mode — All data is simulated. No real user data.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                Quick Actions (simulated)
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fakeShortcuts.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="flex flex-col items-center gap-2 rounded-xl border border-grey-background dark:border-[#374151] p-4 hover:bg-grey-background dark:hover:bg-[#1A1F2B] transition-colors"
                    >
                      <div className={`rounded-xl p-3 ${s.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold text-grey-dark dark:text-gray-200">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                Recent Activity (simulated)
              </h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {fakeActivity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg bg-grey-background dark:bg-[#0D1117] p-3"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-grey-dark dark:text-gray-200">{a.message}</p>
                      <p className="text-xs text-grey-medium dark:text-gray-400 mt-0.5">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="h-1 rounded-t-2xl bg-green-500" />
            <CardHeader>
              <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
                Trust Score (simulated)
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">782</p>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">Good — verified history</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
                Profile Status (simulated)
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-grey-medium dark:text-gray-400">Profile Complete</span>
                <Badge variant="success">85%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grey-medium dark:text-gray-400">References</span>
                <Badge variant="info">3</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grey-medium dark:text-gray-400">Job History</span>
                <Badge variant="info">5</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
