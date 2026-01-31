"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const fakeStats = [
  { label: "Active Jobs", value: "12", change: "+3" },
  { label: "Applications", value: "48", change: "+12" },
  { label: "Saved Candidates", value: "24", change: "+5" },
  { label: "Messages", value: "8", change: "+2" },
];

const fakeActivity = [
  { id: 1, message: "New application for Security Guard position", time: "2 hours ago" },
  { id: 2, message: "Message from John Doe", time: "5 hours ago" },
  { id: 3, message: "New candidate saved: Jane Smith", time: "1 day ago" },
];

export default function AdminDemoEmployerClient() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">
            Employer Dashboard Demo
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

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 transition-shadow hover:shadow-lg" hover>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-2">
                  <PlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-grey-dark dark:text-gray-200">Post New Job</p>
                  <p className="text-xs text-grey-medium dark:text-gray-400">Create a job listing</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 transition-shadow hover:shadow-lg" hover>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-violet-100 dark:bg-violet-900/40 p-2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-grey-dark dark:text-gray-200">Search Employees</p>
                  <p className="text-xs text-grey-medium dark:text-gray-400">View who lists your company</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 transition-shadow hover:shadow-lg" hover>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 p-2">
                  <UserGroupIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-grey-dark dark:text-gray-200">Candidates</p>
                  <p className="text-xs text-grey-medium dark:text-gray-400">Request verification</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 transition-shadow hover:shadow-lg" hover>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 p-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-grey-dark dark:text-gray-200">Upgrade Plan</p>
                  <p className="text-xs text-grey-medium dark:text-gray-400">Unlock premium</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Stats (simulated)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fakeStats.map((stat) => (
              <Card key={stat.label} className="p-4">
                <p className="text-sm text-grey-medium dark:text-gray-400">{stat.label}</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-grey-dark dark:text-gray-200">{stat.value}</span>
                  <Badge variant="success">{stat.change}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
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
    </div>
  );
}
