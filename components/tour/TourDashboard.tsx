"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Simulated employer dashboard for the guided tour. No DB, fake data. */
export function TourDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">Dashboard</h1>
        <p className="text-grey-medium dark:text-gray-400 mt-1">Preview — simulated data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Analytics graph (static demo) */}
          <Card id="tour-analytics" className="transition-shadow duration-300">
            <CardHeader>
              <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Analytics</h2>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-2">
                {[72, 85, 68, 90, 78, 88, 82].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500/70 dark:bg-blue-500/50 rounded-t min-h-[20px]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-grey-medium dark:text-gray-400 mt-2">Activity (simulated)</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold text-grey-dark dark:text-gray-200">Quick Actions</h3>
              </CardHeader>
              <CardContent>
                <Button id="tour-verification-request" variant="primary" size="md" className="w-full">
                  Request Verification
                </Button>
                <p className="text-xs text-grey-medium dark:text-gray-400 mt-2">Ask employers to verify your work</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {/* Trust Score card */}
          <Card id="tour-trust-score">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 rounded-t-2xl" />
            <CardHeader>
              <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Trust Score</h2>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">782</div>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">Good — verified history</p>
            </CardContent>
          </Card>

          {/* Rehire Probability */}
          <Card id="tour-rehire-probability">
            <CardHeader>
              <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Rehire Probability</h2>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">84%</div>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">Based on verifications</p>
            </CardContent>
          </Card>

          {/* Compatibility score */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Team Compatibility</h2>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">88</div>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">Score (simulated)</p>
            </CardContent>
          </Card>

          {/* Feature flag preview */}
          <Card id="tour-feature-flag">
            <CardHeader>
              <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Pro Features</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-grey-medium dark:text-gray-400">Advanced analytics & workforce risk — upgrade to unlock.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
