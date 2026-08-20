import { describe, expect, it } from "vitest";
import { parseLinkHeaderNext } from "@/lib/integrations/providers/greenhouse/api/link-pagination";
import { GREENHOUSE_OAUTH_CONFIG } from "@/lib/integrations/providers/greenhouse/config/manifest";
import { GREENHOUSE_PARTNER_SCOPES } from "@/lib/integrations/providers/greenhouse/config/scopes";

describe("Greenhouse V3 migration utilities", () => {
  it("parses Link header next URL", () => {
    const link =
      '<https://harvest.greenhouse.io/v3/jobs?cursor=abc123>; rel="next"';
    expect(parseLinkHeaderNext(link)).toBe(
      "https://harvest.greenhouse.io/v3/jobs?cursor=abc123"
    );
  });

  it("returns null when Link header has no next page", () => {
    expect(parseLinkHeaderNext(undefined)).toBeNull();
    expect(parseLinkHeaderNext("")).toBeNull();
  });

  it("uses Partner OAuth endpoints and approved scopes only", () => {
    expect(GREENHOUSE_OAUTH_CONFIG.authorizationUrl).toBe(
      "https://auth.greenhouse.io/authorize"
    );
    expect(GREENHOUSE_OAUTH_CONFIG.tokenUrl).toBe("https://auth.greenhouse.io/token");
    expect(GREENHOUSE_OAUTH_CONFIG.pkceRequired).toBe(false);
    expect(GREENHOUSE_OAUTH_CONFIG.scopes).toEqual([...GREENHOUSE_PARTNER_SCOPES]);
    expect(GREENHOUSE_OAUTH_CONFIG.scopes).toHaveLength(7);
  });
});
