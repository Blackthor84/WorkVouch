import { NextRequest, NextResponse } from "next/server";
import {
  getRehireData,
  getTrustScoresForEmployer,
} from "@/lib/actions/employer/analytics";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

// Mark route as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header] || "";
      // Escape commas and quotes in CSV
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get employer account ID
    const supabase = createServerSupabase();
    const supabaseAny = supabase as any;
    type EmployerAccountRow = { id: string; plan_tier: string };
    const { data: employerAccount } = await supabaseAny
      .from("employer_accounts")
      .select("id, plan_tier")
      .eq("user_id", user.id)
      .single();

    if (!employerAccount) {
      return NextResponse.json(
        { error: "Employer account not found" },
        { status: 404 },
      );
    }

    const employerAccountTyped = employerAccount as EmployerAccountRow;

    // Check if user has Pro plan
    if (employerAccountTyped.plan_tier !== "pro") {
      return NextResponse.json(
        { error: "This feature requires Pro plan" },
        { status: 403 },
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const exportType = searchParams.get("type") || "rehire";

    let csvData = "";
    let filename = "export.csv";

    if (exportType === "rehire") {
      const rehireData = await getRehireData(employerAccountTyped.id);
      csvData = convertToCSV(rehireData, [
        "workerEmail",
        "rehireCount",
        "lastHired",
      ]);
      filename = `rehire-data-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (exportType === "trust-scores") {
      const trustScores = await getTrustScoresForEmployer(
        employerAccountTyped.id,
      );
      csvData = convertToCSV(trustScores, ["workerEmail", "score"]);
      filename = `trust-scores-${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      return NextResponse.json(
        { error: "Invalid export type" },
        { status: 400 },
      );
    }

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export data" },
      { status: 500 },
    );
  }
}
