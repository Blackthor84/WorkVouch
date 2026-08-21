/** PostgREST: relation not found in schema cache (table absent in this project). */
const PGRST_TABLE_MISSING = "PGRST205";

type SchemaProbeClient = {
  from: (table: string) => {
    select: (columns: string) => {
      limit: (n: number) => Promise<{ error?: { code?: string } | null }>;
    };
  };
};

/**
 * True when public.organizations exists (enterprise multi-tenant stack deployed).
 * Production currently uses employer_accounts-only onboarding when this is false.
 */
export async function enterpriseOrgTablesAvailable(client: SchemaProbeClient): Promise<boolean> {
  const { error } = await client.from("organizations").select("id").limit(0);
  if (!error) return true;
  return error.code !== PGRST_TABLE_MISSING;
}
