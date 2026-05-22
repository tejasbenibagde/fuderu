// tests/utils/ease.spec.ts

import { describe, expect, it } from "vitest";

import { ease } from "../../src/utils/ease";

describe("ease", () => {
  it("should return 0 when input is 0", () => {
    expect(ease(0)).toBe(0);
  });

  it("should return 1 when input is 1", () => {
    expect(ease(1)).toBe(1);
  });

  it("should clamp values below 0", () => {
    expect(ease(-1)).toBe(0);
  });

  it("should clamp values above 1", () => {
    expect(ease(2)).toBe(1);
  });

  it("should return expected easing values", () => {
    expect(ease(0.5)).toBeCloseTo(0.133974596, 6);

    expect(ease(0.75)).toBeCloseTo(0.338562172, 6);
  });

  it("should always return values between 0 and 1", () => {
    const samples = [0, 0.1, 0.25, 0.5, 0.75, 1];

    for (const value of samples) {
      const result = ease(value);

      expect(result).toBeGreaterThanOrEqual(0);

      expect(result).toBeLessThanOrEqual(1);
    }
  });
});
