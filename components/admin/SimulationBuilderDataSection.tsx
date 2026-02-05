"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const INDUSTRIES = ["technology", "healthcare", "finance", "retail", "logistics", "hospitality", "corporate", "security"];
const PLAN_TIERS = ["starter", "pro", "custom"] as const;

type EmployerItem = { id: string; company_name?: string | null };

export function SimulationBuilderDataSection({
  sandboxId,
  employerList,
  onSuccess,
}: {
  sandboxId: string | null;
  employerList: EmployerItem[];
  onSuccess?: () => void;
}) {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [planTier, setPlanTier] = useState<"starter" | "pro" | "custom">("pro");
  const [seats, setSeats] = useState(3);
  const [location, setLocation] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [empIndustry, setEmpIndustry] = useState(INDUSTRIES[0]);
  const [yearsExperience, setYearsExperience] = useState(5);
  const [rehireEligible, setRehireEligible] = useState(true);

  const [employeeId, setEmployeeId] = useState("");
  const [linkEmployerId, setLinkEmployerId] = useState("");
  const [jobTitle, setJobTitle] = useState("Associate");

  const [reviewerId, setReviewerId] = useState("");
  const [reviewedId, setReviewedId] = useState("");
  const [rating, setRating] = useState(5);
  const [writtenReview, setWrittenReview] = useState("");
  const [rehireRecommendation, setRehireRecommendation] = useState(true);

  const [employerLoading, setEmployerLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [peerLoading, setPeerLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasSandbox = Boolean(sandboxId);
  const employerOptions = employerList;

  async function createEmployer() {
    if (!sandboxId) return;
    setEmployerLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/generate-employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sandbox_id: sandboxId,
          company_name: companyName || "Sandbox Employer Corp",
          industry,
          plan_tier: planTier,
          seats,
          location: location || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMessage(`Employer created: ${j.employer_id?.slice(0, 8)}…`);
      setCompanyName("");
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setEmployerLoading(false);
    }
  }

  async function createEmployee() {
    if (!sandboxId) return;
    setEmployeeLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/generate-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sandbox_id: sandboxId,
          full_name: fullName || "Sandbox Employee",
          email: email.trim() || undefined,
          industry: empIndustry,
          years_experience: yearsExperience,
          rehire_eligible: rehireEligible,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMessage(`Employee created: ${j.user_id?.slice(0, 8)}…`);
      setFullName("");
      setEmail("");
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setEmployeeLoading(false);
    }
  }

  async function linkEmployment() {
    if (!sandboxId || !employeeId || !linkEmployerId) return;
    setLinkLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/link-employment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sandbox_id: sandboxId,
          employee_id: employeeId,
          employer_id: linkEmployerId,
          job_title: jobTitle,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMessage("Employment linked.");
      setEmployeeId("");
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLinkLoading(false);
    }
  }

  async function addPeerReview() {
    if (!sandboxId || !reviewerId || !reviewedId) return;
    setPeerLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/add-peer-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sandbox_id: sandboxId,
          reviewer_id: reviewerId,
          reviewed_id: reviewedId,
          rating,
          written_review: writtenReview,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMessage("Peer review added; intelligence recalculated.");
      setReviewerId("");
      setReviewedId("");
      setWrittenReview("");
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPeerLoading(false);
    }
  }

  async function bulkGenerate(type: string) {
    if (!sandboxId) return;
    setBulkLoading(type);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sandbox_id: sandboxId, type }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMessage(`Bulk done: ${j.employees ?? 0} employees, ${j.employers ?? 0} employers.`);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBulkLoading(null);
    }
  }

  if (!hasSandbox) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Select an active sandbox above to use the data input forms and bulk generator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Employer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Company name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Sandbox Employer Corp" className="mt-1" />
            </div>
            <div>
              <Label>Industry</Label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200">
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Plan tier</Label>
              <select value={planTier} onChange={(e) => setPlanTier(e.target.value as typeof planTier)} className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2">
                {PLAN_TIERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Seats (optional)</Label>
              <Input type="number" min={0} value={seats} onChange={(e) => setSeats(Number(e.target.value) || 0)} className="mt-1" />
            </div>
            <div>
              <Label>Location (optional)</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" className="mt-1" />
            </div>
            <Button onClick={createEmployer} disabled={employerLoading}>{employerLoading ? "Creating…" : "Create employer"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Employee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sandbox Employee" className="mt-1" />
            </div>
            <div>
              <Label>Email (optional, auto-generated if blank)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="leave blank to auto-generate" className="mt-1" />
            </div>
            <div>
              <Label>Industry</Label>
              <select value={empIndustry} onChange={(e) => setEmpIndustry(e.target.value)} className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2">
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Years experience</Label>
              <Input type="number" min={0} value={yearsExperience} onChange={(e) => setYearsExperience(Number(e.target.value) || 0)} className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="rehire" checked={rehireEligible} onChange={(e) => setRehireEligible(e.target.checked)} className="rounded" />
              <Label htmlFor="rehire">Rehire eligible</Label>
            </div>
            <Button onClick={createEmployee} disabled={employeeLoading}>{employeeLoading ? "Creating…" : "Create employee"}</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment Linker</CardTitle>
          <p className="text-xs text-grey-medium dark:text-gray-400">Link an employee (user ID) to an employer with an employment record.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Employee user ID</Label>
            <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="User ID from Create Employee" className="mt-1" />
          </div>
          <div>
            <Label>Employer</Label>
            <select value={linkEmployerId} onChange={(e) => setLinkEmployerId(e.target.value)} className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2">
              <option value="">Select employer</option>
              {employerOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.company_name ?? e.id.slice(0, 8)}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Job title (optional)</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={linkEmployment} disabled={!employeeId || !linkEmployerId || linkLoading}>{linkLoading ? "Linking…" : "Link employment"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Peer Review</CardTitle>
          <p className="text-xs text-grey-medium dark:text-gray-400">Reviewer and reviewed must have overlapping employment. Triggers runIntelligencePipeline after insert.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Reviewer user ID</Label>
            <Input value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} placeholder="Reviewer profile ID" className="mt-1" />
          </div>
          <div>
            <Label>Reviewed user ID</Label>
            <Input value={reviewedId} onChange={(e) => setReviewedId(e.target.value)} placeholder="Reviewed profile ID" className="mt-1" />
          </div>
          <div>
            <Label>Rating (1–5)</Label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Written review</Label>
            <textarea value={writtenReview} onChange={(e) => setWrittenReview(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2" placeholder="Optional comment" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rehireRec" checked={rehireRecommendation} onChange={(e) => setRehireRecommendation(e.target.checked)} className="rounded" />
            <Label htmlFor="rehireRec">Rehire recommendation (UI only)</Label>
          </div>
          <Button onClick={addPeerReview} disabled={!reviewerId || !reviewedId || peerLoading}>{peerLoading ? "Adding…" : "Add peer review"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bulk Data Generator</CardTitle>
          <p className="text-xs text-grey-medium dark:text-gray-400">Random realistic names and industries. All rows include sandbox_id.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => bulkGenerate("10_employees")} disabled={!!bulkLoading}>{bulkLoading === "10_employees" ? "Generating…" : "Generate 10 Employees"}</Button>
          <Button variant="secondary" onClick={() => bulkGenerate("50_employees")} disabled={!!bulkLoading}>{bulkLoading === "50_employees" ? "Generating…" : "Generate 50 Employees"}</Button>
          <Button variant="secondary" onClick={() => bulkGenerate("1_employer_25_employees")} disabled={!!bulkLoading}>{bulkLoading === "1_employer_25_employees" ? "Generating…" : "Generate 1 Employer + 25 Employees"}</Button>
          <Button variant="secondary" onClick={() => bulkGenerate("500_org")} disabled={!!bulkLoading}>{bulkLoading === "500_org" ? "Generating…" : "Generate Enterprise Org (500 users)"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
