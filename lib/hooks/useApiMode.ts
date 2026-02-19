"use client";

import { useMemo } from "react";

export type ProfileWithSandboxMode = {
  sandbox_mode?: boolean;
  [key: string]: unknown;
};

export type ApiMode = {
  isSandboxMode: boolean;
  /** Use when profile.sandbox_mode is true: direct fetch calls to sandbox endpoints (e.g. /api/admin/sandbox-v2/...). */
  useSandboxAPIs: () => ApiModeConfig;
  /** Use when profile.sandbox_mode is false: standard production API paths. */
  useProductionAPIs: () => ApiModeConfig;
};

export type ApiModeConfig = {
  isSandbox: boolean;
  /** Base path for API calls; production uses relative /api, sandbox may use /api/admin/sandbox-v2 for admin sandbox features. */
  apiBasePath: string;
};

const SANDBOX_CONFIG: ApiModeConfig = {
  isSandbox: true,
  apiBasePath: "/api",
};
const PRODUCTION_CONFIG: ApiModeConfig = {
  isSandbox: false,
  apiBasePath: "/api",
};

/**
 * Returns API mode from profile. Use the returned config when building fetch URLs or options.
 * Call unconditionally (pass profile or null); do not call useSandboxAPIs() vs useProductionAPIs() conditionally as hooks.
 *
 * @example
 * const { isSandboxMode, useSandboxAPIs, useProductionAPIs } = useApiMode(profile);
 * const config = isSandboxMode ? useSandboxAPIs() : useProductionAPIs();
 * const url = `${config.apiBasePath}/admin/sandbox-v2/...`;
 */
export function useApiMode(profile: ProfileWithSandboxMode | null | undefined): ApiMode {
  return useMemo(() => {
    const isSandboxMode = Boolean(profile?.sandbox_mode);
    return {
      isSandboxMode,
      useSandboxAPIs: () => SANDBOX_CONFIG,
      useProductionAPIs: () => PRODUCTION_CONFIG,
    };
  }, [profile?.sandbox_mode]);
}
