import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";
import type { ConnectionSummary } from "@/lib/integrations/connect/connection/types";

export interface EmployerIntegrationContext {
  userId: string;
  employerAccountId: string;
  companyName: string | null;
}

export async function requireEmployerIntegration():
  Promise<{ ctx: EmployerIntegrationContext } | { error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isEmployer = await hasRole("employer");
  if (!isEmployer) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const { data: employerAccount, error } = await admin
    .from("employer_accounts")
    .select("id, company_name")
    .eq("user_id", user.id)
    .single();

  if (error || !employerAccount) {
    return { error: NextResponse.json({ error: "Employer account not found" }, { status: 404 }) };
  }

  return {
    ctx: {
      userId: user.id,
      employerAccountId: employerAccount.id,
      companyName: employerAccount.company_name ?? null,
    },
  };
}

export async function requireConnectionAccess(
  connectionId: string,
  employerAccountId: string
): Promise<{ connection: ConnectionSummary; runtime: ReturnType<typeof getConnectApiRuntime> } | { error: NextResponse }> {
  const runtime = getConnectApiRuntime();
  const connection = await runtime.connections.getConnection(connectionId);

  if (!connection || connection.employerAccountId !== employerAccountId) {
    return { error: NextResponse.json({ error: "Connection not found" }, { status: 404 }) };
  }

  return { connection, runtime };
}
