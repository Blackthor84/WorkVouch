import { ChooseRoleForm } from "./ChooseRoleForm";

export const dynamic = "force-dynamic";

/**
 * Role selection UI. Auth and redirects are handled in proxy.ts (profiles.role via Supabase in proxy).
 */
export default function ChooseRolePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <ChooseRoleForm />
    </div>
  );
}
