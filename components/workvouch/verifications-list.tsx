"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateLong } from "@/lib/utils/date";
import { useRouter } from "next/navigation";

interface VerificationRequest {
  id: string;
  job_id: string;
  requested_by_type: string;
  status: string;
  created_at: string;
  jobs: {
    company_name: string;
    job_title: string;
    user_id: string;
    profiles: {
      full_name: string;
      email: string;
    };
  };
}

export function VerificationsList() {
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      // We'll need to create an API endpoint for this
      // For now, using the disputes endpoint structure as reference
      const response = await fetch("/api/admin/verification-requests");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch verification requests");
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      // Fallback: show empty state
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch("/api/admin/approve-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationRequestId: requestId }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve verification");
      }

      router.refresh();
      fetchVerifications();
    } catch (error) {
      alert("Failed to approve verification");
    }
  };

  const handleReject = async (requestId: string) => {
    if (
      !confirm("Are you sure you want to reject this verification request?")
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/reject-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationRequestId: requestId }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject verification");
      }

      router.refresh();
      fetchVerifications();
    } catch (error) {
      alert("Failed to reject verification");
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">Loading verification requests...</Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-grey-medium dark:text-gray-400">
            No verification requests found
          </p>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                    Verification Request
                  </h3>
                  <Badge
                    variant={
                      request.status === "pending"
                        ? "warning"
                        : request.status === "approved"
                          ? "success"
                          : "destructive"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
                <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">
                  <strong>Employee:</strong> {request.jobs?.profiles?.full_name}{" "}
                  ({request.jobs?.profiles?.email})
                </p>
                <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">
                  <strong>Job:</strong> {request.jobs?.job_title} at{" "}
                  {request.jobs?.company_name}
                </p>
                <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">
                  <strong>Requested by:</strong> {request.requested_by_type}
                </p>
                <p className="text-xs text-grey-medium dark:text-gray-400">
                  Requested: {formatDateLong(request.created_at)}
                </p>
              </div>
            </div>

            {request.status === "pending" && (
              <div className="flex gap-3 pt-4 border-t border-grey-background dark:border-[#374151]">
                <Button
                  variant="ghost"
                  onClick={() => handleApprove(request.id)}
                >
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleReject(request.id)}
                >
                  Reject
                </Button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
