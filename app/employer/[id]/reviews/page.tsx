/**
 * Example Employer Reviews Page
 * Usage: /employer/[employer-id]/reviews
 */

import { ReviewForm, ReviewList } from "@/components/reviews";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WvShell, WvPageHeader } from "@/components/wv";

export default async function EmployerReviewsPage(props: any) {
  const { id: employerId } = await props.params;
  const supabase = await createServerSupabaseClient();
  const supabaseAny = supabase as any;

  const { data: employer } = await supabaseAny
    .from("employer_accounts")
    .select("id, company_name")
    .eq("id", employerId)
    .single();

  return (
    <WvShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <WvPageHeader
          eyebrow="Reviews"
          title="Employee Reviews"
          description={
            employer
              ? `Reviews for ${employer.company_name || "this employer"}`
              : "Share and browse employee reviews."
          }
        />

        <div className="mb-8">
          <ReviewForm
            employerId={employerId}
            onReviewSubmitted={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
          />
        </div>

        <ReviewList employerId={employerId} showStatistics={true} />
      </div>
    </WvShell>
  );
}
