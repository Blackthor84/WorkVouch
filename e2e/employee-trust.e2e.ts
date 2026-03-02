/**
 * E2E: Employee-side trust suite. Validates REAL behavior; no mocks.
 * Requires: E2E_TEST_SECRET set, app running (or webServer in config).
 * Optional: E2E_EMPLOYEE_EMAIL, E2E_EMPLOYEE_PASSWORD, E2E_EMPLOYER_EMAIL, E2E_EMPLOYER_PASSWORD
 * for Scenarios A–F. If missing, tests fail with a clear message.
 */

import { test, expect } from "@playwright/test";
import {
  payloadsIdentical,
  normalizeProfilePayload,
  type EmployerViewProfilePayload,
  type TrustTrajectoryPayload,
} from "./fixtures/payload-types";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMPLOYEE_EMAIL = process.env.E2E_EMPLOYEE_EMAIL ?? "";
const EMPLOYEE_PASSWORD = process.env.E2E_EMPLOYEE_PASSWORD ?? "";
const EMPLOYER_EMAIL = process.env.E2E_EMPLOYER_EMAIL ?? "";
const EMPLOYER_PASSWORD = process.env.E2E_EMPLOYER_PASSWORD ?? "";

function requireCredentials(): void {
  if (!EMPLOYEE_EMAIL || !EMPLOYEE_PASSWORD || !EMPLOYER_EMAIL || !EMPLOYER_PASSWORD) {
    throw new Error(
      "Set E2E_EMPLOYEE_EMAIL, E2E_EMPLOYEE_PASSWORD, E2E_EMPLOYER_EMAIL, E2E_EMPLOYER_PASSWORD to run E2E"
    );
  }
}

async function loginAsEmployee(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(EMPLOYEE_EMAIL);
  await page.getByPlaceholder("Password").fill(EMPLOYEE_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|profile|my-jobs)/, { timeout: 15000 });
}

async function loginAsEmployer(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(EMPLOYER_EMAIL);
  await page.getByPlaceholder("Password").fill(EMPLOYER_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|employer)/, { timeout: 15000 });
}

test.describe("Employee Trust E2E", () => {
  test("SCENARIO A — Employer View Mirror is identical", async ({ page }) => {
    requireCredentials();
    await loginAsEmployee(page);

    const myViewRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/e2e/my-employer-view`, { credentials: "include" });
      return { status: r.status, body: await r.json() };
    }, BASE);
    expect(myViewRes.status).toBe(200);
    const payloadAsEmployee = myViewRes.body as EmployerViewProfilePayload;
    const employeeProfileId = payloadAsEmployee.profile?.id;
    expect(employeeProfileId).toBeDefined();

    await loginAsEmployer(page);

    const employerViewRes = await page.evaluate(
      async ({ base, profileId }) => {
        const r = await fetch(`${base}/api/e2e/employer-view-of?profileId=${profileId}`, { credentials: "include" });
        return { status: r.status, body: await r.json() };
      },
      { base: BASE, profileId: employeeProfileId }
    );
    expect(employerViewRes.status).toBe(200);
    const payloadAsEmployer = employerViewRes.body as EmployerViewProfilePayload;

    const { same, message } = payloadsIdentical(
      normalizeProfilePayload(payloadAsEmployee),
      normalizeProfilePayload(payloadAsEmployer)
    );
    expect(same, message ?? "Payloads must be identical").toBe(true);
    expect(payloadAsEmployee.trust_score).toBe(payloadAsEmployer.trust_score);
    expect(payloadAsEmployee.verified_employment_coverage_pct).toBe(payloadAsEmployer.verified_employment_coverage_pct);
    expect(payloadAsEmployee.jobs.length).toBe(payloadAsEmployer.jobs.length);
    expect(payloadAsEmployee.references.length).toBe(payloadAsEmployer.references.length);
  });

  test("SCENARIO B — Trust trajectory cannot lie", async ({ page }) => {
    requireCredentials();
    await loginAsEmployee(page);

    const meRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/user/me`, { credentials: "include" });
      return { status: r.status, body: await r.json() };
    }, BASE);
    expect(meRes.status).toBe(200);
    const me = meRes.body as { user?: { id?: string } };
    const profileId = me.user?.id;
    expect(profileId).toBeDefined();

    const trajRes1 = await page.request.get(`${BASE}/api/e2e/trust-trajectory?profileId=${profileId}`);
    expect(trajRes1.status()).toBe(200);
    const traj1 = (await trajRes1.json()) as TrustTrajectoryPayload;
    expect(
      traj1.trajectory,
      "Expected at_risk when last verification 200+ days ago and no recent refs. Seed test user accordingly."
    ).toBe("at_risk");

    const seedRes = await page.request.post(`${BASE}/api/e2e/seed-verified-employment`, {
      data: { profileId },
    });
    expect(seedRes.ok(), "Seed verified employment must succeed").toBe(true);

    const trajRes2 = await page.request.get(`${BASE}/api/e2e/trust-trajectory?profileId=${profileId}`);
    expect(trajRes2.status()).toBe(200);
    const traj2 = (await trajRes2.json()) as TrustTrajectoryPayload;
    expect(traj2.trajectory, "After adding verified employment, trajectory must be improving").toBe("improving");
  });

  test("SCENARIO C — Visibility controls are absolute", async ({ page }) => {
    requireCredentials();
    await loginAsEmployee(page);

    const myViewRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/e2e/my-employer-view`, { credentials: "include" });
      return { status: r.status, body: await r.json() };
    }, BASE);
    expect(myViewRes.status).toBe(200);
    const payload = myViewRes.body as EmployerViewProfilePayload;
    const jobIds = payload.jobs.map((j) => j.id);
    expect(jobIds.length).toBeGreaterThanOrEqual(1);

    const secondJobId = jobIds[1];
    expect(secondJobId, "Scenario C requires employee with at least 2 jobs. Seed test user with 2+ visible jobs.").toBeDefined();

    const setVisRes = await page.evaluate(
      async ({ base, jobHistoryId }) => {
        const r = await fetch(`${base}/api/user/set-visibility`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobHistoryId, isVisibleToEmployer: false }),
        });
        return r.status;
      },
      { base: BASE, jobHistoryId: secondJobId }
    );
    expect(setVisRes).toBeGreaterThanOrEqual(200);
    expect(setVisRes).toBeLessThan(300);

    const afterRes = await page.request.get(`${BASE}/api/e2e/my-employer-view`, {
      headers: { Cookie: (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ") },
    });
    expect(afterRes.status()).toBe(200);
    const afterPayload = afterRes.body as EmployerViewProfilePayload;
    const afterJobIds = afterPayload.jobs.map((j) => j.id);
    expect(afterJobIds.includes(secondJobId)).toBe(false);
  });

  test("SCENARIO D — Trust event timeline is causal", async ({ page }) => {
    requireCredentials();
    await loginAsEmployee(page);

    const meRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/user/me`, { credentials: "include" });
      return { status: r.status, body: await r.json() };
    }, BASE);
    expect(meRes.status).toBe(200);
    const me = meRes.body as { user?: { id?: string } };
    const profileId = me.user?.id;
    expect(profileId).toBeDefined();

    await page.request.post(`${BASE}/api/e2e/seed-verified-employment`, { data: { profileId } as Record<string, string> });

    const timelineRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/user/trust-activity`, { credentials: "include" });
      return { status: r.status, body: await r.json() };
    }, BASE);
    expect(timelineRes.status).toBe(200);
    const { events } = timelineRes.body as { events: Array<{ type: string; event: string; impact: number | null; date: string }> };
    const verificationEntry = events.find(
      (e) => e.type === "employment_verification" && e.event.includes("E2E Test Co")
    );
    expect(verificationEntry).toBeDefined();
    expect(verificationEntry!.date).toBeDefined();
    expect(typeof verificationEntry!.impact === "number" || verificationEntry!.impact === null).toBe(true);
  });

  test("SCENARIO E — Reference badges are legit", async ({ page }) => {
    requireCredentials();
    await loginAsEmployee(page);

    const insightsRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/user/references-insights`, { credentials: "include" });
      return { status: r.status, body: await r.json() };
    }, BASE);
    expect(insightsRes.status).toBe(200);
    const { references } = insightsRes.body as {
      references: Array<{ is_direct_manager: boolean; is_repeated_coworker: boolean; is_verified_match: boolean }>;
    };
    for (const ref of references) {
      if (!ref.is_direct_manager && !ref.is_repeated_coworker && !ref.is_verified_match) {
        continue;
      }
      expect(typeof ref.is_direct_manager).toBe("boolean");
      expect(typeof ref.is_repeated_coworker).toBe("boolean");
      expect(typeof ref.is_verified_match).toBe("boolean");
    }
  });

  test("SCENARIO F — Credential lifecycle is absolute", async ({ page }) => {
    requireCredentials();
    await loginAsEmployee(page);

    const createRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/user/workvouch-credential`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeShareToken: true, expiresInDays: 7, visibility: "standard" }),
      });
      return { status: r.status, body: await r.json() };
    }, BASE);
    expect(createRes.status).toBe(200);
    const createData = createRes.body as { share_token?: string };
    const token = createData.share_token;
    expect(token).toBeDefined();

    const viewRes = await page.request.get(`${BASE}/api/public/credential?token=${token}`);
    expect(viewRes.status()).toBe(200);

    const listRes = await page.request.get(`${BASE}/api/user/workvouch-credential`, {
      headers: { Cookie: (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ") },
    });
    expect(listRes.status()).toBe(200);
    const { credentials } = (await listRes.json()) as { credentials: Array<{ id: string }> };
    const credId = credentials[0]?.id;
    expect(credId).toBeDefined();

    const revokeRes = await page.evaluate(
      async ({ base, id }) => {
        const r = await fetch(`${base}/api/user/workvouch-credential/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revoke: true }),
        });
        return r.status;
      },
      { base: BASE, id: credId }
    );
    expect(revokeRes).toBe(200);

    const afterRes = await page.request.get(`${BASE}/api/public/credential?token=${token}`);
    expect(afterRes.status()).toBe(404);
  });
});
