import { getVerticalOnboardingConfig } from "@/lib/verticals/onboarding";
import { ONBOARDING_INDUSTRY_DRAFT_KEY } from "@/lib/onboarding/onboardingProfileFields";

/** Client draft: user completed Step 2 (role step) without requiring industry. */
export const ONBOARDING_ROLE_STEP_KEY = "workvouch_onboarding_role_step_completed";

/** Client draft: professional role entered on Step 2. */
export const ONBOARDING_PROFESSIONAL_ROLE_DRAFT_KEY = "workvouch_onboarding_professional_role_draft";

export type VouchWizardServerState = {
  step: number;
  hasJob: boolean;
  completed: boolean;
  industry: string | null;
  verticalMetadata: Record<string, unknown>;
  profileBasicsComplete: boolean;
  contacts: unknown[];
};

export function validateRoleStepInput(professionalRole: string): string | null {
  if (!professionalRole.trim()) {
    return "Enter your professional role.";
  }
  return null;
}

export function resolveVouchWizardStep(
  data: VouchWizardServerState,
  options: { roleStepCompleted: boolean }
): number {
  if (data.completed) {
    if (!data.profileBasicsComplete) return 6;
    const vertical = getVerticalOnboardingConfig(data.industry ?? "");
    const meta = data.verticalMetadata ?? {};
    const hasVerticalData =
      !vertical ||
      vertical.employeeFields.some((f) => {
        const v = meta[f.key];
        return v != null && v !== "" && !(Array.isArray(v) && v.length === 0);
      });
    if (vertical && !hasVerticalData) return 7;
    return 9;
  }

  if (!options.roleStepCompleted && !data.hasJob) {
    return 2;
  }

  if (!data.hasJob) return 3;

  if (data.step === 3) return 4;
  if (data.step === 4) return 5;
  if (data.step >= 5) return 5;
  return 4;
}

export function readOnboardingClientDraft(): {
  roleStepCompleted: boolean;
  industry: string | null;
  professionalRole: string | null;
} {
  if (typeof window === "undefined") {
    return { roleStepCompleted: false, industry: null, professionalRole: null };
  }
  try {
    return {
      roleStepCompleted: localStorage.getItem(ONBOARDING_ROLE_STEP_KEY) === "1",
      industry: localStorage.getItem(ONBOARDING_INDUSTRY_DRAFT_KEY)?.trim() || null,
      professionalRole: localStorage.getItem(ONBOARDING_PROFESSIONAL_ROLE_DRAFT_KEY)?.trim() || null,
    };
  } catch {
    return { roleStepCompleted: false, industry: null, professionalRole: null };
  }
}

export function writeRoleStepDraft(professionalRole: string, industry: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDING_ROLE_STEP_KEY, "1");
    localStorage.setItem(ONBOARDING_PROFESSIONAL_ROLE_DRAFT_KEY, professionalRole.trim());
    if (industry.trim()) {
      localStorage.setItem(ONBOARDING_INDUSTRY_DRAFT_KEY, industry.trim());
    }
  } catch {
    /* ignore storage errors */
  }
}
