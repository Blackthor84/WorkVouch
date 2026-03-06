/**
 * Trust Network: depth bands, relationship types, graph depth classification.
 * - Graph depth classification correct (minimal, moderate, strong, exceptional)
 * - toNetworkDepthBand matches spec
 */

import { describe, it, expect } from "vitest";
import {
  toNetworkDepthBand,
  toDepthBand,
  computeDepthScore,
} from "@/lib/trust/depthBands";

describe("Trust Network depth bands", () => {
  describe("toNetworkDepthBand (connection count)", () => {
    it("returns minimal for connections < 2", () => {
      expect(toNetworkDepthBand(0)).toBe("minimal");
      expect(toNetworkDepthBand(1)).toBe("minimal");
    });

    it("returns moderate for connections 3-5", () => {
      expect(toNetworkDepthBand(3)).toBe("moderate");
      expect(toNetworkDepthBand(5)).toBe("moderate");
    });

    it("returns strong for connections 6-10", () => {
      expect(toNetworkDepthBand(6)).toBe("strong");
      expect(toNetworkDepthBand(10)).toBe("strong");
    });

    it("returns exceptional for connections > 10", () => {
      expect(toNetworkDepthBand(11)).toBe("exceptional");
      expect(toNetworkDepthBand(20)).toBe("exceptional");
    });
  });

  describe("toDepthBand (weighted score)", () => {
    it("returns weak for score 0-2", () => {
      expect(toDepthBand(0)).toBe("weak");
      expect(toDepthBand(2)).toBe("weak");
    });
    it("returns moderate for score 3-5", () => {
      expect(toDepthBand(3)).toBe("moderate");
      expect(toDepthBand(5)).toBe("moderate");
    });
    it("returns strong for score 6+", () => {
      expect(toDepthBand(6)).toBe("strong");
    });
  });

  describe("computeDepthScore", () => {
    it("computes direct + manager*2 for verified connections", () => {
      expect(computeDepthScore(2, 0)).toBe(2);
      expect(computeDepthScore(1, 2)).toBe(5);
      expect(computeDepthScore(4, 3)).toBe(10);
    });
  });
});
