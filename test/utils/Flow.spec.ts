import { describe, expect, it } from "vitest";
import { normalizeFlowForSpacing } from "../../src/utils/flow";

describe("normalizeFlowForSpacing", () => {
  it("keeps boundary flow values 0 and 1 unchanged regardless of spacing", () => {
    expect(normalizeFlowForSpacing(0, 25, 0.01)).toBe(0);
    expect(normalizeFlowForSpacing(1, 25, 0.01)).toBe(1);
  });

  it("clamps invalid negative and >1 flow inputs to [0, 1]", () => {
    expect(normalizeFlowForSpacing(-1, 25, 0.01)).toBe(0);
    expect(normalizeFlowForSpacing(2, 25, 0.01)).toBe(1);
  });

  it("reduces per-stamp alpha when spacing creates dense overlap and preserves optical accumulation", () => {
    const dense = normalizeFlowForSpacing(0.18, 25, 0.01);
    const medium = normalizeFlowForSpacing(0.18, 25, 0.25);
    const sparse = normalizeFlowForSpacing(0.18, 25, 2);

    expect(dense).toBeLessThan(medium);
    expect(medium).toBeLessThan(sparse);
    expect(sparse).toBeCloseTo(0.18);
    expect(1 - Math.pow(1 - dense, 100)).toBeCloseTo(0.18);
  });

  it("returns target flow unchanged when brushSize <= 0 and respects minSpacing floor", () => {
    expect(normalizeFlowForSpacing(0.4, 0, 0.1)).toBe(0.4);
    expect(normalizeFlowForSpacing(0.4, -5, 0.1)).toBe(0.4);

    // spacing * brushSize = 0.01 * 10 = 0.1, clamped by minSpacing = 1 -> overlaps = (10*2)/1 = 20
    const normalized = normalizeFlowForSpacing(0.5, 10, 0.01, 1);
    expect(normalized).toBeCloseTo(1 - Math.pow(0.5, 1 / 20));
  });
});
