import { describe, expect, it } from "vitest";

import { normalizeFlowForSpacing } from "../../src/utils/flow";

describe("normalizeFlowForSpacing", () => {
  it("keeps boundary flow values unchanged", () => {
    expect(normalizeFlowForSpacing(0, 25, 0.01)).toBe(0);
    expect(normalizeFlowForSpacing(1, 25, 0.01)).toBe(1);
  });

  it("reduces per-stamp alpha when spacing creates dense overlap", () => {
    const normalized = normalizeFlowForSpacing(0.18, 25, 0.01);

    expect(normalized).toBeLessThan(0.18);
    expect(1 - Math.pow(1 - normalized, 100)).toBeCloseTo(0.18);
  });

  it("leaves flow close to the target when stamps barely overlap", () => {
    expect(normalizeFlowForSpacing(0.18, 25, 2)).toBeCloseTo(0.18);
  });

  it("clamps invalid flow input", () => {
    expect(normalizeFlowForSpacing(-1, 25, 0.01)).toBe(0);
    expect(normalizeFlowForSpacing(2, 25, 0.01)).toBe(1);
  });
});
