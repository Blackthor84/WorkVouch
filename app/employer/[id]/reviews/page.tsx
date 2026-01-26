/**
 * Example Employer Reviews Page
 * Shows how to use ReviewForm and ReviewList components
 * 
 * Usage: /employer/[employer-id]/reviews
 */

import { ReviewForm, ReviewList } from "@/components/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EmployerReviewsPage({ params }: PageProps) {
  const employerId = params.id;
  const supabase = await createSupabaseServerClient();
  const supabaseAny = supabase as any;

  // Fetch employer info (optional, for display)
  const { data: employer } = await supabaseAny
    .from("employer_accounts")
    .select("id, company_name")
    .eq("id", employerId)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Employee Reviews
          </h1>
          {employer && (
            <p className="text-lg text-gray-600">
              Reviews for {employer.company_name || "this employer"}
            </p>
          )}
        </div>

        {/* Review Form */}
        <div className="mb-8">
          <ReviewForm
            employerId={employerId}
            onReviewSubmitted={() => {
              // This will be handled client-side by ReviewList
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
          />
        </div>

        {/* Review List with Statistics */}
        <ReviewList employerId={employerId} showStatistics={true} />
      </div>
    </div>
  );
}
