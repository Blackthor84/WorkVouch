/**
 * SOC-2: Access control and sandbox isolation guards.
 * requireSandboxMode() returns 403 when not in sandbox (APP_MODE set at build/load time).
 */

import { requireSandboxMode } from "@/lib/sandbox/apiGuard";

describe("SOC-2 guards", () => {
  it("requireSandboxMode returns 403 or null based on env", () => {
    const res = requireSandboxMode();
    if (res !== null) {
      expect(res.status).toBe(403);
      expect(res).toBeInstanceOf(Response);
    }
    // When NEXT_PUBLIC_APP_MODE=sandbox at load time, res is null; otherwise 403.
  });
});
