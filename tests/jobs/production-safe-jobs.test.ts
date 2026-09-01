import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockInsert, mockUpdate, mockSelect, mockEq, mockOrder, mockLimit, mockMaybeSingle, mockSingle, mockIn, mockOr } =
  vi.hoisted(() => {
    const mockSingle = vi.fn();
    const mockMaybeSingle = vi.fn();
    const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockOrder = vi.fn(() => ({ limit: mockLimit, order: mockOrder }));
    const mockOr = vi.fn(() => ({ order: mockOrder }));
    const mockIn = vi.fn(() => ({ or: mockOr, order: mockOrder }));
    const mockEq = vi.fn(() => ({ eq: mockEq, order: mockOrder, select: mockSelect }));
    const mockSelect = vi.fn(() => ({ eq: mockEq, in: mockIn, single: mockSingle }));
    const mockInsert = vi.fn(() => ({ select: mockSelect }));
    const mockUpdate = vi.fn(() => ({ eq: mockEq }));
    const mockFrom = vi.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    }));
    return {
      mockFrom,
      mockInsert,
      mockUpdate,
      mockSelect,
      mockEq,
      mockOrder,
      mockLimit,
      mockMaybeSingle,
      mockSingle,
      mockIn,
      mockOr,
    };
  });

import {
  defaultOnboardingJobVisibility,
  employerVisibilityFields,
  insertJobWithColumnFallback,
  isJobRowVisibleToEmployers,
  queryEmployerVisibleJobs,
  saveOnboardingVouchJob,
} from "@/lib/jobs/productionSafeJobs";

describe("productionSafeJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockReturnValue({ eq: mockEq, order: mockOrder, select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq, in: mockIn, single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockOrder.mockReturnValue({ limit: mockLimit, order: mockOrder });
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockIn.mockReturnValue({ or: mockOr, order: mockOrder });
    mockOr.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    });
  });

  it("maps hidden employer visibility to is_private=true", () => {
    expect(employerVisibilityFields("hidden")).toEqual({
      is_visible_to_employer: false,
      is_private: true,
    });
  });

  it("defaults onboarding jobs to hidden from employers", () => {
    expect(defaultOnboardingJobVisibility()).toBe("hidden");
  });

  it("treats is_private=true as not employer-visible", () => {
    expect(isJobRowVisibleToEmployers({ is_private: true })).toBe(false);
    expect(isJobRowVisibleToEmployers({ is_private: false })).toBe(true);
  });

  it("denies employer visibility when no visibility columns are present", () => {
    expect(isJobRowVisibleToEmployers({})).toBe(false);
  });

  it("inserts onboarding jobs without is_visible_to_employer on production schema", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockSingle
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42703",
          message: "column jobs.is_visible_to_employer does not exist",
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "job-1",
          company_name: "Acme",
          job_title: "Operator",
          title: "Operator",
        },
        error: null,
      });

    const client = { from: mockFrom };
    const result = await saveOnboardingVouchJob(client, {
      userId: "user-1",
      companyName: "Acme",
      role: "Operator",
      startDate: "2026-01-01",
    });

    expect(result.error).toBeNull();
    expect(result.result?.job.id).toBe("job-1");
    expect(result.result?.visibility).toBe("hidden");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("inserts onboarding jobs when PostgREST returns PGRST204 for is_visible_to_employer", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockSingle
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "PGRST204",
          message:
            "Could not find the 'is_visible_to_employer' column of 'jobs' in the schema cache",
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "job-pgrst",
          company_name: "Acme",
          job_title: "Operator",
          title: "Operator",
        },
        error: null,
      });

    const client = { from: mockFrom };
    const result = await saveOnboardingVouchJob(client, {
      userId: "user-1",
      companyName: "Acme",
      role: "Operator",
      startDate: "2026-01-01",
    });

    expect(result.error).toBeNull();
    expect(result.result?.job.id).toBe("job-pgrst");
    expect(result.result?.persistedVisibility.is_private).toBe(true);
  });

  it("retries insert without is_visible_to_employer when column is missing", async () => {
    let payload: Record<string, unknown> | undefined;
    mockInsert.mockImplementation((row: Record<string, unknown>) => {
      payload = row;
      return { select: () => ({ single: mockSingle }) };
    });

    mockSingle
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42703",
          message: "column jobs.is_visible_to_employer does not exist",
        },
      })
      .mockResolvedValueOnce({
        data: { id: "job-2", company_name: "Acme", job_title: "Tech", title: "Tech" },
        error: null,
      });

    const client = { from: mockFrom };
    const result = await insertJobWithColumnFallback(
      client,
      {
        user_id: "user-1",
        company_name: "Acme",
        job_title: "Tech",
        title: "Tech",
        start_date: "2026-01-01",
      },
      "hidden"
    );

    expect(result.error).toBeNull();
    expect(payload).toEqual(
      expect.objectContaining({
        is_private: true,
      })
    );
    expect(payload).not.toHaveProperty("is_visible_to_employer");
  });

  it("retries insert without is_visible_to_employer on PGRST204 and preserves job fields", async () => {
    const payloads: Record<string, unknown>[] = [];
    mockInsert.mockImplementation((row: Record<string, unknown>) => {
      payloads.push({ ...row });
      return { select: () => ({ single: mockSingle }) };
    });

    mockSingle
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "PGRST204",
          message:
            "Could not find the 'is_visible_to_employer' column of 'jobs' in the schema cache",
        },
      })
      .mockResolvedValueOnce({
        data: { id: "job-4", company_name: "Acme", job_title: "Tech", title: "Tech" },
        error: null,
      });

    const client = { from: mockFrom };
    const baseRow = {
      user_id: "user-1",
      company_name: "Acme",
      job_title: "Tech",
      title: "Tech",
      start_date: "2026-01-01",
      end_date: null,
      is_current: true,
      employment_type: "full_time",
      verification_status: "unverified",
    };
    const result = await insertJobWithColumnFallback(client, baseRow, "hidden");

    expect(result.error).toBeNull();
    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toEqual(
      expect.objectContaining({
        ...baseRow,
        is_visible_to_employer: false,
        is_private: true,
      })
    );
    expect(payloads[1]).toEqual(
      expect.objectContaining({
        ...baseRow,
        is_private: true,
      })
    );
    expect(payloads[1]).not.toHaveProperty("is_visible_to_employer");
  });

  it("keeps is_visible_to_employer when the column exists", async () => {
    let payload: Record<string, unknown> | undefined;
    mockInsert.mockImplementation((row: Record<string, unknown>) => {
      payload = row;
      return { select: () => ({ single: mockSingle }) };
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: "job-3", company_name: "Acme", job_title: "Tech", title: "Tech" },
      error: null,
    });

    const client = { from: mockFrom };
    await insertJobWithColumnFallback(
      client,
      {
        user_id: "user-1",
        company_name: "Acme",
        job_title: "Tech",
        title: "Tech",
        start_date: "2026-01-01",
      },
      "hidden"
    );

    expect(payload).toEqual(
      expect.objectContaining({
        is_visible_to_employer: false,
        is_private: true,
      })
    );
  });

  it("falls back to is_private filter for employer-visible job queries", async () => {
    mockOrder
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42703",
          message: "column jobs.is_visible_to_employer does not exist",
        },
      })
      .mockResolvedValueOnce({
        data: [{ user_id: "user-1", company_name: "Acme", is_private: false }],
        error: null,
      });

    const client = { from: mockFrom };
    const result = await queryEmployerVisibleJobs(client, ["user-1"], "user_id, company_name, is_private");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(mockOr).toHaveBeenCalledWith("is_private.eq.false,is_private.is.null");
  });

  it("returns no jobs when neither visibility column exists", async () => {
    mockOrder
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42703",
          message: "column jobs.is_visible_to_employer does not exist",
        },
      })
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42703",
          message: "column jobs.is_private does not exist",
        },
      });

    const client = { from: mockFrom };
    const result = await queryEmployerVisibleJobs(client, ["user-1"], "user_id, company_name");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });
});
