import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";

describe("HiringGuidanceCoachmarks", () => {
  it("declares ready state before referencing it in the render guard", () => {
    const source = readFileSync(
      join(process.cwd(), "components/guidance/HiringGuidanceCoachmarks.tsx"),
      "utf8"
    );
    const readyDecl = source.indexOf("const [ready, setReady]");
    const readyUse = source.indexOf("!ready || dismissed");
    expect(readyDecl).toBeGreaterThan(-1);
    expect(readyUse).toBeGreaterThan(-1);
    expect(readyDecl).toBeLessThan(readyUse);
  });

  it("is rendered from employer candidate profile viewer", () => {
    const source = readFileSync(
      join(process.cwd(), "components/employer/candidate-profile-viewer.tsx"),
      "utf8"
    );
    expect(source).toContain("HiringGuidanceCoachmarks");
  });
});
