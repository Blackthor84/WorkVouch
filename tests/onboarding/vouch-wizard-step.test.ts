import { describe, it, expect } from "vitest";
import {
  resolveVouchWizardStep,
  validateRoleStepInput,
} from "@/lib/onboarding/vouchWizardStep";

const baseState = {
  step: 2,
  hasJob: false,
  completed: false,
  industry: null,
  verticalMetadata: {},
  profileBasicsComplete: false,
  contacts: [],
};

describe("validateRoleStepInput", () => {
  it("allows continuing with no industry when professional role is provided", () => {
    expect(validateRoleStepInput("Forklift Operator")).toBeNull();
  });

  it("requires professional role", () => {
    expect(validateRoleStepInput("")).toBe("Enter your professional role.");
    expect(validateRoleStepInput("   ")).toBe("Enter your professional role.");
  });
});

describe("resolveVouchWizardStep", () => {
  it("shows Step 2 when role step is not completed and there is no job", () => {
    expect(
      resolveVouchWizardStep(baseState, { roleStepCompleted: false })
    ).toBe(2);
  });

  it("advances to Step 3 when role step is completed without industry", () => {
    expect(
      resolveVouchWizardStep(baseState, { roleStepCompleted: true })
    ).toBe(3);
  });

  it("advances to Step 3 when role step is completed with industry draft", () => {
    expect(
      resolveVouchWizardStep(
        { ...baseState, industry: "Healthcare" },
        { roleStepCompleted: true }
      )
    ).toBe(3);
  });

  it("maps server job progress to later wizard steps", () => {
    expect(
      resolveVouchWizardStep(
        { ...baseState, hasJob: true, step: 3, contacts: [] },
        { roleStepCompleted: true }
      )
    ).toBe(4);
  });
});
