import { describe, expect, it } from "vitest";
import { ease } from "../../src/utils/ease";

describe("ease", () => {
  it("handles boundary and out-of-range inputs", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
  });

  it("computes the exact circular easing curve 1 - sqrt(1 - x^2)", () => {
    expect(ease(0.5)).toBeCloseTo(1 - Math.sqrt(0.75), 10);
    expect(ease(0.75)).toBeCloseTo(1 - Math.sqrt(1 - 0.5625), 10);
  });

  it("is monotonically increasing across [0, 1]", () => {
    const samples = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
    let prev = -1;

    for (const value of samples) {
      const result = ease(value);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(result).toBeGreaterThan(prev);
      prev = result;
    }
  });
});
