"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CnaCertificationClient() {
  const router = useRouter();
  const supabase = supabaseBrowser;
  const [state, setState] = useState("");
  const [registryNumber, setRegistryNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      const { data: hp } = await supabase
        .from("healthcare_profiles")
        .select("role")
        .eq("user_id", currentUser.id)
        .single();
      if ((hp as { role?: string } | null)?.role !== "CNA") {
        router.push("/onboarding/healthcare/setting");
        return;
      }
      const { data: existing } = await supabase
        .from("cna_credentials")
        .select("state, registry_number, expiration_date, document_url")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (existing) {
        setState(existing.state ?? "");
        setRegistryNumber(existing.registry_number ?? "");
        setExpirationDate(
          existing.expiration_date
            ? new Date(existing.expiration_date).toISOString().slice(0, 10)
            : ""
        );
        setDocumentUrl(existing.document_url ?? "");
      }
      setUser(currentUser);
    })();
  }, [router]);

  const handleSkip = () => {
    router.push("/onboarding/healthcare/setting");
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
        ...(state && { state }),
        ...(registryNumber && { registry_number: registryNumber }),
        ...(expirationDate && { expiration_date: expirationDate }),
        ...(documentUrl && { document_url: documentUrl }),
      };
      const { error } = await supabase.from("cna_credentials").upsert(
        payload,
        { onConflict: "user_id" }
      );
      if (error) {
        console.error("Error saving CNA certification:", error);
        alert("Error saving. You can skip this step and continue.");
        setLoading(false);
        return;
      }
      router.push("/onboarding/healthcare/setting");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. You can skip and continue.");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-grey-medium dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
        CNA certification (optional)
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Add your certification details if you have them. You can skip this step—agency and short-term work count, and you can verify with coworkers instead.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="cna-state">State</Label>
          <Input
            id="cna-state"
            type="text"
            placeholder="e.g., CA, TX"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cna-registry">Registry number</Label>
          <Input
            id="cna-registry"
            type="text"
            placeholder="Optional"
            value={registryNumber}
            onChange={(e) => setRegistryNumber(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cna-expiration">Expiration date</Label>
          <Input
            id="cna-expiration"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cna-document">Document URL (optional)</Label>
          <Input
            id="cna-document"
            type="url"
            placeholder="Link to certification document if you have one"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
          disabled={loading}
          className="flex-1"
        >
          Skip
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </Card>
  );
}
