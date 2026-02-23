import type { ImpersonationContext } from "@/types/impersonation";

export function attachImpersonation(
  session: any,
  impersonation?: ImpersonationContext
): any {
  return {
    ...session,
    impersonation: impersonation ?? {
      impersonating: false,
      actorType: "employee",
    },
  };
}
